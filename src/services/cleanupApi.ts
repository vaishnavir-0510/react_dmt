// services/cleanupApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CleanupResponse } from '../types';

export const cleanupApi = createApi({
  reducerPath: 'cleanupApi',
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
  tagTypes: ['Cleanup'],
  endpoints: (builder) => ({
    getCleanupData: builder.query<CleanupResponse, { 
      objectId: string; 
      includeAll?: boolean 
    }>({
      query: ({ objectId, includeAll = true }) => 
        `/migration/affected/fields?object_id=${objectId}&tab_name=cleanup&include_all=${includeAll}`,
      providesTags: ['Cleanup'],
    }),
  }),
});

export const { useGetCleanupDataQuery } = cleanupApi;