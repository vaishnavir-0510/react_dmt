// services/projectApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiProject } from '../types';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({
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
  }),
  tagTypes: ['Projects'],
  endpoints: (builder) => ({
    // Create a new project
    createProject: builder.mutation<ApiProject, any>({
      query: (projectData) => ({
        url: '/management/v2/project',
        method: 'POST',
        body: projectData,
      }),
      invalidatesTags: ['Projects'],
    }),

    // Update an existing project
    updateProject: builder.mutation<ApiProject, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/management/v2/project/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Projects'],
    }),

    // Delete a project
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/management/v2/project/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;