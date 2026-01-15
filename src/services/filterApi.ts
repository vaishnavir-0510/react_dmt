// services/filterApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FilterDataRecord, FilterDataResponse } from '../types';

export const filterApi = createApi({
  reducerPath: 'filterApi',
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
  tagTypes: ['FilterData'],
  endpoints: (builder) => ({
    getFilterData: builder.query<FilterDataResponse, {
      objectId: string;
      environmentId?: string;
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: ({ objectId, environmentId, page = 1, limit = 10, search = '' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: search,
        });
        if (environmentId) {
          params.append('environment', environmentId);
        }
        return `/management/v2/filtered_file/${objectId}/${objectId}.csv?${params.toString()}`;
      },
      providesTags: ['FilterData'],
    }),
    removeColumns: builder.mutation<{
      for_migrate_update: Record<string, string>;
    }, {
      object_id: string;
      columns_to_remove: string[];
      for_migrate?: boolean;
    }>({
      query: (body) => ({
        url: '/management/v2/remove_columns',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FilterData'],
    }),
  }),
});

export const { useGetFilterDataQuery, useRemoveColumnsMutation } = filterApi;