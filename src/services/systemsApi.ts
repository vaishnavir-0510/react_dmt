import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { System } from '../types';

export const systemsApi = createApi({
  reducerPath: 'systemsApi',
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
  tagTypes: ['Systems'],
  endpoints: (builder) => ({
    getSystemsByProject: builder.query<System[], string>({
      query: (projectId) => `/management/v2/project/${projectId}/system`,
      providesTags: ['Systems'],
    }),
    createSystem: builder.mutation<System, Partial<System>>({
      query: (systemData) => ({
        url: '/management/v2/system',
        method: 'POST',
        body: systemData,
      }),
      invalidatesTags: ['Systems'],
    }),
    updateSystem: builder.mutation<System, { id: string; data: Partial<System> }>({
      query: ({ id, data }) => ({
        url: `/management/v2/system/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Systems'],
    }),
    deleteSystem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/management/v2/system/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Systems'],
    }),
  }),
});

export const {
  useGetSystemsByProjectQuery,
  useCreateSystemMutation,
  useUpdateSystemMutation,
  useDeleteSystemMutation,
} = systemsApi;