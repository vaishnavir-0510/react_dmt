// services/validateFunctionsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CleanupFunction, CleanupFunctionsResponse } from '../types';

export const validateFunctionsApi = createApi({
  reducerPath: 'validateFunctionsApi',
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
  tagTypes: ['ValidateFunctions'],
  endpoints: (builder) => ({
    getValidateFunctions: builder.query<CleanupFunction[], { 
      changeLogId: number;
    }>({
      query: ({ changeLogId }) => 
        `/migration/validate/action?changelog_id=${changeLogId}`,
      providesTags: ['ValidateFunctions'],
      // Add transform response to handle the array structure
      transformResponse: (response: CleanupFunction[]) => {
        return response;
      },
    }),
  }),
});

export const { useGetValidateFunctionsQuery } = validateFunctionsApi;