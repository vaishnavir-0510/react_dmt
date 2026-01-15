// services/environmentApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Environment } from '../types';

export const environmentApi = createApi({
  reducerPath: 'environmentApi',
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
  tagTypes: ['Environments'],
  endpoints: (builder) => ({
    getEnvironmentsByProject: builder.query<Environment[], string>({
      query: (projectId) => `/management/v2/environment/project/${projectId}`,
      providesTags: ['Environments'],
    }),
    createEnvironment: builder.mutation<Environment, Partial<Environment>>({
      query: (environmentData) => ({
        url: '/management/v2/environment',
        method: 'POST',
        body: environmentData,
      }),
      invalidatesTags: ['Environments'],
    }),
    updateEnvironment: builder.mutation<Environment, { id: string; data: Partial<Environment> }>({
      query: ({ id, data }) => ({
        url: `/management/v2/environment/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Environments'],
    }),
    deleteEnvironment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/management/v2/environment/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Environments'],
    }),
  }),
});

export const {
  useGetEnvironmentsByProjectQuery,
  useCreateEnvironmentMutation,
  useUpdateEnvironmentMutation,
  useDeleteEnvironmentMutation,
} = environmentApi;