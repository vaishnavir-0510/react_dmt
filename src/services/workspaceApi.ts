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