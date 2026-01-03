// services/estimatorApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { updateTokens, logout } from '../store/slices/authSlice';
import type { ObjectEstimator } from '../types';

export type { ObjectEstimator };

const baseQuery = fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as any).auth.accessToken;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    },
    fetchFn: async (input, init) => {
        console.log('🌐 ESTIMATOR REQUEST:', {
            url: input,
            method: init?.method,
            headers: init?.headers ? Object.fromEntries((init.headers as Headers).entries()) : undefined,
            body: init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : undefined
        });

        const response = await fetch(input, init);

        console.log('🌐 ESTIMATOR RESPONSE:', {
            url: input,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        try {
            const responseBody = await clonedResponse.json();
            console.log('🌐 ESTIMATOR RESPONSE BODY:', responseBody);
        } catch (e) {
            console.log('🌐 ESTIMATOR RESPONSE BODY: (not JSON or empty)');
        }

        return response;
    }
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            const refreshResult = await baseQuery(
                {
                    url: '/auth/v3/refresh_token',
                    method: 'POST',
                    body: { refresh_token: refreshToken },
                },
                api,
                extraOptions
            );

            if (refreshResult.data) {
                const { access_token, refresh_token: newRefreshToken } = refreshResult.data as any;
                api.dispatch(updateTokens({
                    accessToken: access_token,
                    refreshToken: newRefreshToken || refreshToken
                }));

                // Retry original request with new token
                result = await baseQuery(args, api, extraOptions);
            } else {
                api.dispatch(logout());
                window.location.href = '/login';
            }
        } else {
            api.dispatch(logout());
            window.location.href = '/login';
        }
    }

    return result;
};

export const estimatorApi = createApi({
    reducerPath: 'estimatorApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Estimator'],
    endpoints: (builder) => ({
        // Get object estimator status
        getObjectEstimatorStatus: builder.query<ObjectEstimator[], void>({
            query: () => '/management/v2/object/estimator/project/environment/status/',
            providesTags: ['Estimator'],
            transformResponse: (response: any) => response.data || response,
        }),
    }),
});

export const {
    useGetObjectEstimatorStatusQuery,
} = estimatorApi;
