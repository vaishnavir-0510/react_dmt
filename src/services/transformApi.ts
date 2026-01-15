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
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/migration/v2`,
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
      environmentId?: string;
      page?: number;
      pageSize?: number;
    }>({
      query: ({ objectId, environmentId, page = 1, pageSize = 50 }) => {
        const params = new URLSearchParams({
          object_id: objectId,
          file_name: `${objectId}.csv`,
          page: page.toString(),
          page_size: pageSize.toString(),
        });
        if (environmentId) {
          params.append('environment', environmentId);
        }
        return `/data/?${params.toString()}`;
      },
      providesTags: ['TransformData'],
    }),
  }),
});

export const { useGetTransformDataQuery } = transformApi;