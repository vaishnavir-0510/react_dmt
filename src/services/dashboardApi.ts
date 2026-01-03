// services/dashboardApi.ts
//import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
/*import { updateTokens, logout } from '../store/slices/authSlice';

interface MigrationStatusItem {
    object_id: string;
    Object_name: string;
    project_id: string;
    environment_id: string;
    activity: string;
    completion: number;
    is_completed: boolean;
}

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
        console.log('🌐 DASHBOARD MIGRATION REQUEST:', {
            url: input,
            method: init?.method,
            headers: init?.headers ? Object.fromEntries((init.headers as Headers).entries()) : undefined,
            body: init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : undefined
        });

        const response = await fetch(input, init);

        console.log('🌐 DASHBOARD MIGRATION RESPONSE:', {
            url: input,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        try {
            const responseBody = await clonedResponse.json();
            console.log('🌐 DASHBOARD MIGRATION RESPONSE BODY:', responseBody);
        } catch (e) {
            console.log('🌐 DASHBOARD MIGRATION RESPONSE BODY: (not JSON or empty)');
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

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['DashboardMigration'],
    endpoints: (builder) => ({
        // Get dashboard migration status
        getDashboardMigrationStatus: builder.query<MigrationStatusItem[], void>({
            query: () => '/management/v2/object/estimator/project/environment/status/',
            providesTags: ['DashboardMigration'],
        }),
    }),
});//

export const {
    useGetDashboardMigrationStatusQuery,
} = dashboardApi;*/
// services/dashboardApi.ts
// services/dashboardApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface MigrationStatus {
  object_id: string;
  Object_name: string;
  project_id: string;
  environment_id: string;
  activity: string;
  completion: number;
  is_completed: boolean;
}

/**
 * 🔑 IMPORTANT:
 * projectId & environmentId are NOT used in URL
 * They are used ONLY to change query cache key
 */
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['MigrationStatus'],
  endpoints: (builder) => ({
    getMigrationStatus: builder.query<
      MigrationStatus[],
      { projectId: string; environmentId: string }
    >({
      query: () =>
        '/management/v2/object/estimator/project/environment/status/',
      providesTags: ['MigrationStatus'],
    }),
  }),
});

export const { useGetMigrationStatusQuery } = dashboardApi;
