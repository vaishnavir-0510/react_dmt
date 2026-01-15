// services/picklistApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface PicklistMapping {
  sourceValue: string;
  targetValue: string;
}

export interface PicklistResponse {
  picklistMap: PicklistMapping[];
  targetPicklist: string[];
}

export interface PicklistUpdatePayload {
  source_field: string;
  target_field: string;
  picklist_map: PicklistMapping[];
}

export const picklistApi = createApi({
  reducerPath: 'picklistApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api-dev.datamatter.tech',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['PicklistMapping'],
  endpoints: (builder) => ({
    getPicklistMapping: builder.query<PicklistResponse, { sourceField: string; targetField: string }>({
      query: ({ sourceField, targetField }) => 
        `/migration/v1/picklist/mapping/?source_field=${sourceField}&target_field=${targetField}`,
      providesTags: ['PicklistMapping'],
    }),
    
    updatePicklistMapping: builder.mutation<void, PicklistUpdatePayload>({
      query: (payload) => ({
        url: '/migration/v1/picklist/mapping/',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['PicklistMapping'],
    }),
  }),
});

export const { useGetPicklistMappingQuery, useUpdatePicklistMappingMutation } = picklistApi;