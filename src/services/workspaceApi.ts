// services/workspaceApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { updateTokens, logout } from '../store/slices/authSlice';
import type { WorkspaceResponse, ApiProject } from '../types';

// Define the workspace update request type
interface UpdateWorkspaceRequest {
  project: string;
  environment?: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.accessToken;
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

export const workspaceApi = createApi({
  reducerPath: 'workspaceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Workspace', 'Projects'],
  endpoints: (builder) => ({
    getUserWorkspace: builder.query<WorkspaceResponse, void>({
      query: () => '/management/user_workspace/user_workspace/',
      providesTags: ['Workspace'],
    }),

    // Update workspace endpoint
    updateWorkspace: builder.mutation<WorkspaceResponse, UpdateWorkspaceRequest>({
      query: (workspaceData) => ({
        url: '/management/user_workspace/user_workspace/',
        method: 'PUT',
        body: workspaceData,
      }),
      invalidatesTags: ['Workspace'],
    }),

    // Create workspace endpoint
    createWorkspace: builder.mutation<WorkspaceResponse, UpdateWorkspaceRequest>({
      query: (workspaceData) => ({
        url: `/management/user_workspace/user_workspace/project/${workspaceData.project}`,
        method: 'POST',
        body: workspaceData,
      }),
      invalidatesTags: ['Workspace'],
    }),

    updateEnvironmentWorkspace: builder.mutation<WorkspaceResponse, { environment: string }>({
      query: ({ environment }) => ({
        url: `/management/user_workspace/user_workspace/environment/${environment}`,
        method: 'POST',
        body: { environment },
      }),
      invalidatesTags: ['Workspace'],
    }),

    getProjects: builder.query<ApiProject[], void>({
      query: () => '/management/v2/project',
      providesTags: ['Projects'],
      transformResponse: (response: any) => {
        return response.data || response;
      },
    }),
  }),
});

export const {
  useGetUserWorkspaceQuery,
  useGetProjectsQuery,
  useUpdateWorkspaceMutation,
  useCreateWorkspaceMutation,
  useUpdateEnvironmentWorkspaceMutation,
} = workspaceApi;