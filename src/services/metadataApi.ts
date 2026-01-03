// services/metadataApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export interface MetadataField {
  id: number;
  name: string;
  label: string;
  datatype: string;
  type: string;
  max_length: string;
  length: string;
  is_required: string;
  is_unique: string;
  is_pk: string;
  is_fk: string;
  description: string;
  sample_value: string;
  data_count: string;
  unique_values_count: string;
  null_count: string;
  data_quality: string;
  field_source: string;
  for_migrate: string;

  // Data Type and Structure fields
  min_length: string;
  is_fixed_length: string;
  float_precision: string;
  is_float: string;
  is_integer: string;
  is_text: string;
  is_html: string;
  is_encoded: string;
  nullable: string;

  // Date and Time Management fields
  timezone: string;
  date_format: string;
  duration_unit: string;
  is_timezone: string;
  is_date: string;
  is_time: string;
  is_datetime: string;
  is_duration: string;

  // Currency fields
  currency_code: string;

  // General Information fields
  permission: string;
  owner: string;

  // Validation and Formatting fields
  text_case: string;
  security_class: string;
  data_format: string;
  mask: string;
  is_case_sensitive: string;
  is_picklist: string;
  is_null: string;

  // Identification and Key Relationships fields
  fk_system: string;
  fk_object: string;
  fk_field: string;
  externalid: string;

  // Geographical and Contact Information fields
  is_address_line: string;
  is_email: string;
  is_link: string;
  is_country: string;
  is_state: string;
  is_phone: string;
  is_pincode: string;
  is_city: string;

  // Data Source and Migration fields
  field_id: string;
  object_id: string;
  system_id: string;

  // Data Properties & Characteristics fields
  max_value: string;
  min_value: string;
  average_value: string;
  standard_deviation: string;
  mean_value: string;
  mode_value: string;
  median_value: string;

  // Identification & Encoding fields
  text_encoding: string;
  entity: string;
  is_noun: string;

  // Data Count & Uniqueness fields
  outliers: string;
  is_multi_picklist: string;
  picklist_values: string;

  // Data Trends & Distribution fields
  data_trend: string;
  data_distribution: string;
  data_trend_direction: string;
  data_density: string;

  // Additional numeric value counts
  lt_zero_count: string;
  gt_zero_count: string;
  eq_zero_count: string;
  lt_mean_count: string;
  gt_mean_count: string;
  eq_mean_count: string;
  lt_median_count: string;
  gt_median_count: string;
  eq_median_count: string;

  // Additional fields
  autoNumber: string;

  // System fields
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;
  tenant_id: string;

  // New fields from API response
  object_name: string;
  compound_field_name: string;
  is_compound_field: boolean;
  project_id: string;
  tenant_key: string;
  caseSensitive: string;
  htmlFormatted: string;
  precision: string;
  referenceTo: string;
  relationshipName: string;
  idLookup: string;
  unique: string;
  permissionable: string;
  calculated: string;
  calculatedFormula: string;
  formulaTreatNullNumberAsZero: string;
  defaultValue: string;
  is_deleted: boolean;

  // Allow any other fields that might come from the API
  [key: string]: any;
}

export interface PaginatedMetadataResponse {
  records: MetadataField[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}
export interface MappedObject {
  id: string;
  name: string;
  system: string;
  project: string;
  description: string;
  operation: string;
  created_date: string;
  modified_date: string;
}

export interface OntologyMapping {
  id: number;
  object_id: string;
  original_field_name: string;
  ontology_term: string;
  is_PII: boolean;
  data_type: string;
  ontological_term_description: string;
  confidence_score: number;
  ontology_term_status: string;
  ontological_term_description_status: string;
  ontology_term_user_feedback: string | null;
  ontological_term_description_user_feedback: string | null;
}

export const metadataApi = createApi({
  reducerPath: 'metadataApi',
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
  tagTypes: ['Metadata', 'MappedObject', 'Ontology'],
  endpoints: (builder) => ({
    // Get metadata for an object
    getObjectMetadata: builder.query<MetadataField[], string>({
      query: (objectId) => `/migration/metadata/object/${objectId}`,
      providesTags: ['Metadata'],
    }),

    // Get metadata for an object with pagination
    getObjectMetadataPaginated: builder.query<PaginatedMetadataResponse, { objectId: string; page?: number; page_size?: number }>({
      query: ({ objectId, page = 1, page_size = 5 }) => `/migration/v2/metadata/object/${objectId}?page=${page}&page_size=${page_size}`,
      providesTags: ['Metadata'],
    }),
    
    // Get mapped target object for source object
    getMappedTargetObject: builder.query<MappedObject, { 
      sourceObjectId: string; 
      projectId: string; 
      environmentId: string 
    }>({
      query: ({ sourceObjectId, projectId, environmentId }) => 
        `/migration/v1/entity-mapped-object/?source_object_id=${sourceObjectId}&project=${projectId}&environment=${environmentId}`,
      providesTags: ['MappedObject'],
    }),

    // UPDATE: Add update field metadata endpoint
    updateFieldMetadata: builder.mutation<MetadataField, {
      objectId: string;
      fieldId: string;
      updates: Record<string, any>;
    }>({
      query: ({ objectId, fieldId, updates }) => ({
        url: `/migration/v1/object/${objectId}/fields/${fieldId}`,
        method: 'PUT',
        body: updates,
      }),
      // Invalidate metadata to refetch after update
      invalidatesTags: ['Metadata'],
    }),

    // Get ontology mappings for an object
    getOntologyMappings: builder.query<OntologyMapping[], string>({
      query: (objectId) => `https://api-dev.datamatter.tech/agent/ontology-mapper-context-gathering/mapper/object/${objectId}`,
      providesTags: ['Ontology'],
    }),

    // Update ontology mapping
    updateOntologyMapping: builder.mutation<OntologyMapping, { mappingId: number; updates: Partial<OntologyMapping> }>({
      query: ({ mappingId, updates }) => ({
        url: `https://api-dev.datamatter.tech/agent/ontology-mapper-context-gathering/mapper/?mapping_id=${mappingId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Ontology'],
    }),
  }),
});

export const {
  useGetObjectMetadataQuery,
  useGetObjectMetadataPaginatedQuery,
  useGetMappedTargetObjectQuery,
  useUpdateFieldMetadataMutation, // UPDATE: Export the new mutation
  useGetOntologyMappingsQuery,
  useUpdateOntologyMappingMutation,
} = metadataApi;