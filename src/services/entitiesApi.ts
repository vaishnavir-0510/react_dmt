// services/entitiesApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const entitiesApi = createApi({
  reducerPath: 'entitiesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['SalesforceObjects'],
  endpoints: (builder) => ({
    // Get Salesforce objects
    getSalesforceObjects: builder.query<{ objects: string[] }, void>({
      query: () => '/load/v1/salesforce/objects/',
      providesTags: ['SalesforceObjects'],
    }),
  }),
});

export const {
  useGetSalesforceObjectsQuery,
} = entitiesApi;