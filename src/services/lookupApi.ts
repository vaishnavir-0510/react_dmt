// services/lookupApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface LookupRelation {
  id: string | null;
  source_field: string;
  source_object: string;
  lookup_system: string;
  lookup_object: string;
  lookup_join_field: string;
  lookup_fetch_field: string[];
  default_value: string;
  tenant_key: string;
  created_by: string | null;
  created_date: string | null;
  modified_by: string | null;
  modified_date: string | null;
}

export const lookupApi = createApi({
  reducerPath: 'lookupApi',
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
  tagTypes: ['LookupRelations'],
  endpoints: (builder) => ({
    // Get lookup relations for a source object
    getLookupRelations: builder.query<LookupRelation[], string>({
      query: (sourceObjectId) => `/load/lookup/v1/lookup/${sourceObjectId}/`,
      providesTags: ['LookupRelations'],
    }),

    // Create new lookup relation
    createLookupRelation: builder.mutation<LookupRelation, Omit<LookupRelation, 'id' | 'created_by' | 'created_date' | 'modified_by' | 'modified_date'>>({
      query: (lookupData) => ({
        url: '/load/lookup/v1/lookup/',
        method: 'POST',
        body: lookupData,
      }),
      invalidatesTags: ['LookupRelations'],
    }),

    // Update existing lookup relation
    updateLookupRelation: builder.mutation<LookupRelation, LookupRelation>({
      query: (lookupData) => ({
        url: '/load/lookup/v1/lookup/',
        method: 'PUT',
        body: lookupData,
      }),
      invalidatesTags: ['LookupRelations'],
    }),
  }),
});

export const {
  useGetLookupRelationsQuery,
  useCreateLookupRelationMutation,
  useUpdateLookupRelationMutation,
} = lookupApi;

export default lookupApi;