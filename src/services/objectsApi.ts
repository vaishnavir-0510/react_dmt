// services/objectsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ObjectData {
  object_id: string;
  project: string;
  system: string;
  field_count: number;
  criteria: string;
  migration_count: string;
  created_by: string;
  modified_by: string;
  is_deleted: boolean;
  tenant_key: string;
  created_date: string;
  modified_date: string;
  name: string;
  description: string;
  notes: string | null;
  records_count: string;
  post_mig_strategy: string;
  operation: string;
  system_name: string;
  owner_name: string;
  is_completed: boolean;
}

export const objectsApi = createApi({
  reducerPath: 'objectsApi',
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
  tagTypes: ['Objects', 'CompoundFields', 'MetadataFields', 'PicklistValues'],
  endpoints: (builder) => ({
    getObjectsBySystem: builder.query<ObjectData[], string>({
      query: (systemId) => `/management/v2/system/${systemId}/objects`,
      providesTags: ['Objects'],
    }),
    createObject: builder.mutation<ObjectData, Partial<ObjectData>>({
      query: (objectData) => ({
        url: '/management/v2/object',
        method: 'POST',
        body: objectData,
      }),
      invalidatesTags: ['Objects'],
    }),
    updateObject: builder.mutation<ObjectData, { id: string; data: Partial<ObjectData> }>({
      query: ({ id, data }) => ({
        url: `/management/v2/object/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Objects'],
    }),
    deleteObject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/management/v2/object/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Objects'],
    }),
    getCompoundFields: builder.query<any[], string>({
      query: (objectId) => `/migration/metadata/object/compound/${objectId}`,
      providesTags: ['CompoundFields'],
    }),
    getMetadataFields: builder.query<any[], string>({
      query: (objectId) => `/migration/metadata/object/${objectId}`,
      providesTags: ['MetadataFields'],
    }),
    getPicklistValues: builder.query<{ picklist_values: string[]; count: number }, { objectId: string; fieldId: string }>({
      query: ({ objectId, fieldId }) => `/migration/v1/object/${objectId}/picklist_values/${fieldId}`,
      providesTags: ['PicklistValues'],
    }),
  }),
});

export const {
  useGetObjectsBySystemQuery,
  useCreateObjectMutation,
  useUpdateObjectMutation,
  useDeleteObjectMutation,
  useGetCompoundFieldsQuery,
  useGetMetadataFieldsQuery,
  useGetPicklistValuesQuery,
} = objectsApi;