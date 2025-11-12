// services/mappingApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface MappingField {
  id: string;
  source_object_id: string;
  source_column_id: string;
  target_object_id: string;
  target_column_id: string;
  source_is_date: string;
  source_is_datetime: string;
  source_timezone: string;
  source_is_picklist: string;
  source_is_pk: string;
  source_is_fk: string;
  source_is_required: string;
  source_is_integer: string;
  source_is_float: string;
  source_is_text: string;
  source_datatype: string;
  source_label: string;
  target_is_date: string;
  target_is_datetime: string;
  target_timezone: string;
  target_is_picklist: string;
  target_is_pk: string;
  target_is_fk: string;
  target_is_required: string;
  target_is_integer: string;
  target_is_float: string;
  target_is_text: string;
  target_datatype: string;
  target_name: string;
  sample_value: string;
}

export const mappingApi = createApi({
  reducerPath: 'mappingApi',
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
  tagTypes: ['Mapping'],
  endpoints: (builder) => ({
    getMappingData: builder.query<MappingField[], { sourceObjectId: string }>({
      query: ({ sourceObjectId }) => 
        `/migration/v1/field/mapping/?source_object_id=${sourceObjectId}`,
      providesTags: ['Mapping'],
    }),
  }),
});

export const { useGetMappingDataQuery } = mappingApi;