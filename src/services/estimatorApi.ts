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
        } catch {
            console.log('🌐 ESTIMATOR RESPONSE BODY: (not JSON or empty)');
        }

        return response;
    }
});

// Track if a refresh is in progress to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    // Skip token refresh for refresh_token endpoint itself to prevent infinite loops
    const isRefreshTokenRequest = args.url?.includes('/auth/v3/refresh_token');
    
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401 && !isRefreshTokenRequest) {
        // Check if refresh is already in progress (shared state via localStorage)
        const refreshInProgress = localStorage.getItem('tokenRefreshInProgress') === 'true';
        
        if (refreshInProgress && isRefreshing && refreshPromise) {
            // Wait for existing refresh to complete
            try {
                await refreshPromise;
                // Retry original request with new token
                result = await baseQuery(args, api, extraOptions);
                return result;
            } catch {
                // Refresh failed, logout
                api.dispatch(logout());
                window.location.href = '/login';
                return result;
            }
        }

        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            // No refresh token available, logout immediately
            api.dispatch(logout());
            window.location.href = '/login';
            return result;
        }

        // Start refresh process
        isRefreshing = true;
        localStorage.setItem('tokenRefreshInProgress', 'true'); // Set shared flag
        
        refreshPromise = (async () => {
            try {
                // Create a base query without reauth to prevent infinite loop
                const refreshBaseQuery = fetchBaseQuery({
                    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
                    prepareHeaders: (headers) => {
                        headers.set('Accept', 'application/json');
                        headers.set('Content-Type', 'application/json');
                        return headers;
                    },
                });

                const refreshResult = await refreshBaseQuery(
                    {
                        url: `/auth/v3/refresh_token?refresh_token=${encodeURIComponent(refreshToken)}`,
                        method: 'POST',
                    },
                    api,
                    extraOptions
                );

                if (refreshResult.data && !refreshResult.error) {
                    const { access_token, refresh_token: newRefreshToken } = refreshResult.data as any;
                    
                    // Update both tokens
                    api.dispatch(updateTokens({
                        accessToken: access_token,
                        refreshToken: newRefreshToken || refreshToken
                    }));

                    return { success: true };
                } else {
                    // Refresh failed - invalid or expired refresh token
                    throw new Error('Refresh token failed');
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
                throw error;
            } finally {
                isRefreshing = false;
                refreshPromise = null;
                localStorage.removeItem('tokenRefreshInProgress'); // Clear shared flag
            }
        })();

        try {
            await refreshPromise;
            // Retry original request with new token
            result = await baseQuery(args, api, extraOptions);
        } catch (error) {
            // Refresh failed, logout and redirect
            console.error('Token refresh failed, logging out:', error);
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
