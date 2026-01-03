// services/transformApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { TransformDataRecord } from '../types';


export interface TransformDataResponse {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  data: TransformDataRecord[];
}

export const transformApi = createApi({
  reducerPath: 'transformApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/migration/v1`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['TransformData'],
  endpoints: (builder) => ({
    getTransformData: builder.query<TransformDataResponse, { 
      objectId: string;
      page?: number;
      pageSize?: number;
    }>({
      query: ({ objectId, page = 1, pageSize = 50 }) => 
        `/data/?object_id=${objectId}&file_name=${objectId}.csv&page=${page}&page_size=${pageSize}`,
      providesTags: ['TransformData'],
    }),
  }),
});

export const { useGetTransformDataQuery } = transformApi;