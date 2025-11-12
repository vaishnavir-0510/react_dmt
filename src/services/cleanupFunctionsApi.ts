// services/cleanupFunctionsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CleanupFunction, CleanupFunctionsResponse } from '../types';

export const cleanupFunctionsApi = createApi({
  reducerPath: 'cleanupFunctionsApi',
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
  tagTypes: ['CleanupFunctions'],
  endpoints: (builder) => ({
    getCleanupFunctions: builder.query<CleanupFunction[], { 
      changeLogId: number;
    }>({
      query: ({ changeLogId }) => 
        `/migration/cleanup/action?changelog_id=${changeLogId}`,
      providesTags: ['CleanupFunctions'],
      // Add transform response to handle the array structure
      transformResponse: (response: CleanupFunction[]) => {
        return response;
      },
    }),
  }),
});

export const { useGetCleanupFunctionsQuery } = cleanupFunctionsApi;