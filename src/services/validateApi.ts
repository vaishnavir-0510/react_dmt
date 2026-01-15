// services/validateApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CleanupResponse } from '../types';

export const validateApi = createApi({
  reducerPath: 'validateApi',
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
  tagTypes: ['Validate'],
  endpoints: (builder) => ({
    getValidateData: builder.query<CleanupResponse, {
      objectId: string;
      environmentId?: string;
      includeAll?: boolean
    }>({
      query: ({ objectId, environmentId, includeAll = true }) => {
        const params = new URLSearchParams({
          object_id: objectId,
          tab_name: 'validate',
          include_all: includeAll.toString(),
        });
        if (environmentId) {
          params.append('environment', environmentId);
        }
        return `/migration/affected/fields?${params.toString()}`;
      },
      providesTags: ['Validate'],
    }),
  }),
});

export const { useGetValidateDataQuery } = validateApi;