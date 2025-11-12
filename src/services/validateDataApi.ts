// services/validateDataApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CleanupDataResponse } from '../types';

export const validateDataApi = createApi({
  reducerPath: 'validateDataApi',
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
  tagTypes: ['ValidateData'],
  endpoints: (builder) => ({
    getValidateData: builder.query<CleanupDataResponse, { 
      objectId: string;
      changeLogId: number;
      page?: number;
      pageSize?: number;
    }>({
      query: ({ objectId, changeLogId, page = 1, pageSize = 50 }) => 
        `/migration/validate/data?object_id=${objectId}&change_log_id=${changeLogId}&page=${page}&page_size=${pageSize}`,
      providesTags: ['ValidateData'],
    }),
  }),
});

export const { useGetValidateDataQuery } = validateDataApi;