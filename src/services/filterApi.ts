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
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: ({ objectId, page = 1, limit = 10, search = '' }) =>
        `/management/v2/filtered_file/${objectId}/${objectId}.csv?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      providesTags: ['FilterData'],
    }),
  }),
});

export const { useGetFilterDataQuery } = filterApi;