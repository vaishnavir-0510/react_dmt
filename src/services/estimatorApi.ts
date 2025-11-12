// services/estimatorApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ObjectEstimator } from '../types';

export const estimatorApi = createApi({
  reducerPath: 'estimatorApi',
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
  tagTypes: ['Estimator'],
  endpoints: (builder) => ({
    // Get object estimator status
    getObjectEstimatorStatus: builder.query<ObjectEstimator[], void>({
      query: () => '/management/v2/object/estimator/project/environment/status/',
      providesTags: ['Estimator'],
    }),
  }),
});

export const {
  useGetObjectEstimatorStatusQuery,
} = estimatorApi;