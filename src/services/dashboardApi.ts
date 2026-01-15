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
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { updateTokens, logout } from '../store/slices/authSlice';

export interface MigrationStatus {
  object_id: string;
  Object_name: string;
  project_id: string;
  environment_id: string;
  activity: string;
  completion: number;
  is_completed: boolean;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    return headers;
  },
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

/**
 * 🔑 IMPORTANT:
 * projectId & environmentId are NOT used in URL
 * They are used ONLY to change query cache key
 */
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithReauth,
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
