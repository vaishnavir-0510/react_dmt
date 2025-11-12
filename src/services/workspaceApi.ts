import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { WorkspaceResponse, ApiProject } from '../types';

export const workspaceApi = createApi({
  reducerPath: 'workspaceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Workspace', 'Projects'],
  endpoints: (builder) => ({
    getUserWorkspace: builder.query<WorkspaceResponse, void>({
      query: () => '/management/user_workspace/user_workspace/',
      providesTags: ['Workspace'],
    }),
    getProjects: builder.query<ApiProject[], void>({
      query: () => '/management/v2/project',
      providesTags: ['Projects'],
    }),
    updateUserWorkspace: builder.mutation<WorkspaceResponse, { 
      project?: string; 
      environment?: string | null;
    }>({
      query: (workspaceData) => ({
        url: '/management/user_workspace/user_workspace/',
        method: 'PUT',
        body: workspaceData,
      }),
      invalidatesTags: ['Workspace'],
    }),
  }),
});

export const {
  useGetUserWorkspaceQuery,
  useGetProjectsQuery,
  useUpdateUserWorkspaceMutation,
} = workspaceApi;