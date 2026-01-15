import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface ODFFileResponse {
  id: string;
  object: string;
  status: string;
  created_date: string;
  modified_date: string;
  project: string;
  record_count: string;
  is_deleted: boolean;
  environment: string;
  fields_count: number;
  filename: string;
  file_type: string;
  system: string;
  size: string;
  tenant_key: string;
  current: boolean;
  created_by: string;
  modified_by: string;
  parent_id: string | null;
  is_filtered: boolean;
}

interface ChartFilterResponse {
  picklist_values: string[];
  dates: Array<[string, string]>;
}

interface PicklistDistributionResponse {
  Object_id: string;
  label: string;
  picklist_values: Array<{ value: string; count: number }>;
  max_y_axis: number;
}

interface DateDistributionResponse {
  object_id: string;
  field_id: string;
  values: Array<{
    object_id: string;
    field_id: string;
    data: string;
    count: number;
  }>;
  max_x_axis: number;
  max_y_axis: number;
  x_axis_granularity: string;
}

interface ColumnDensityResponse {
  column_density_summary: Array<{
    field_name: string;
    data_count_percentage: number;
    null_count_percentage: number;
  }>;
}

interface TaskStatusResponse {
  task_id: string;
  status: string;
}

interface MetadataExtractResponse {
  message: string;
  task_id: string;
}

interface MetadataStatusResponse {
  status: string;
  message: string;
}

export const odfFileApi = createApi({
  reducerPath: 'odfFileApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ODFFile', 'ChartData', 'Distribution', 'Metadata', 'Completion'],
  endpoints: (builder) => ({
    getODFFile: builder.query<ODFFileResponse, { id: string; objectId: string }>({
      query: ({ id, objectId }) => 
        `/management/v3/view/object_file/${id}?object_id=${objectId}`,
      providesTags: ['ODFFile'],
    }),
    
    uploadODFFile: builder.mutation({
      query: ({ file, objectId, importType }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('import_type', importType);
        
        return {
          url: `/management/v3/import/object_file/${objectId}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['ODFFile'],
    }),

    uploadFile: builder.mutation<{
      status: string;
      message: string;
      odf_record_id: string;
    }, FormData>({
      query: (formData) => ({
        url: '/management/v3/file/upload',
        method: 'POST',
        body: formData,
      }),
    }),

    // Get view file API
    getViewFile: builder.query<ODFFileResponse, { objectId: string; fileId: string }>({
      query: ({ objectId, fileId }) => 
        `/management/v3/view/object_file/${fileId}?object_id=${objectId}`,
      providesTags: ['ODFFile'],
    }),

    // Metadata extraction endpoint
    extractMetadata: builder.mutation<MetadataExtractResponse, {
      objectId: string;
      environment_id: string;
      file_name: string;
      object_id: string;
      object_name: string;
      project: string;
    }>({
      query: (params) => ({
        url: '/migration/metadata/extract/',
        method: 'POST',
        body: {
          environment_id: params.environment_id,
          file_name: params.file_name,
          object_id: params.object_id,
          object_name: params.object_name,
          project: params.project
        }
      }),
      invalidatesTags: ['Metadata'],
    }),

    // Check metadata extraction status with polling capability
    checkMetadataStatus: builder.query<MetadataStatusResponse, string>({
      query: (taskId) => `/migration/metadata/extract-status/${taskId}`,
      providesTags: ['Metadata'],
    }),

    getColumnDensity: builder.query<ColumnDensityResponse, {
      object_id: string;
      refresh?: boolean
    }>({
      query: ({ object_id, refresh = true }) => ({
        url: '/migration/v2/summary/chart/column-density/',
        params: { object_id, refresh: String(refresh) }
      }),
      providesTags: ['ChartData'],
    }),

    // Get object completion status
    getObjectCompletion: builder.query<Array<{
      activity: string;
      completion: number;
    }>, string>({
      query: (objectId) => `/management/v2/object/estimator/${objectId}/completion`,
      providesTags: ['Completion'],
    }),

    getDataDensity: builder.query<{ data_density_percentage: number }, {
      object_id: string;
      refresh?: boolean
    }>({
      query: ({ object_id, refresh = true }) => ({
        url: '/migration/v2/data/density/',
        params: { object_id, refresh: String(refresh) }
      }),
      providesTags: ['ChartData'],
    }),

    // Get data quality
    getDataQuality: builder.query<{ data_quality_percentage: number }, {
      object_id: string;
      refresh?: boolean
    }>({
      query: ({ object_id, refresh = true }) => ({
        url: '/migration/v2/data/quality/',
        params: { object_id, refresh: String(refresh) }
      }),
      providesTags: ['ChartData'],
    }),

    // Get entity mapped object
    getEntityMappedObject: builder.query<any, { 
      source_object_id: string;
      project: string;
      environment: string;
    }>({
      query: ({ source_object_id, project, environment }) => ({
        url: '/migration/v1/entity-mapped-object/',
        params: { source_object_id, project, environment }
      }),
    }),

    // Get picklist distribution
    getPicklistDistribution: builder.query<PicklistDistributionResponse, { 
      object_id: string;
      picklist_field: string;
    }>({
      query: ({ object_id, picklist_field }) => ({
        url: `/migration/v1/object/${object_id}/summary/chart/distribution/picklist_record/${encodeURIComponent(picklist_field)}` 
      }),
      providesTags: ['Distribution'],
    }),

    // Get chart filter data
    getChartFilter: builder.query<ChartFilterResponse, string>({
      query: (object_id) => `/migration/v1/object/${object_id}/summary/chart/filter`,
      providesTags: ['ChartData'],
    }),

    // Get date distribution
    getDateDistribution: builder.query<DateDistributionResponse, {
      object_id: string;
      field_id: string;
      file_name: string;
    }>({
      query: ({ object_id, field_id, file_name }) =>
        `/migration/v1/object/${object_id}/summary/chart/distribution/date/${field_id}?file_name=${file_name}`,
      providesTags: ['Distribution'],
    }),

    // Get all picklist distributions (for all picklist fields)
    getAllPicklistDistributions: builder.query<Record<string, PicklistDistributionResponse>, { 
      object_id: string;
    }>({
      async queryFn({ object_id }, _queryApi, _extraOptions, fetchWithBQ) {
        // First get the chart filter to know available picklist fields
        const filterResponse = await fetchWithBQ(`/migration/v1/object/${object_id}/summary/chart/filter`);
        
        if (filterResponse.error) {
          return { error: filterResponse.error };
        }

        const filterData = filterResponse.data as ChartFilterResponse;
        const picklistFields = filterData.picklist_values || [];

        // Fetch distribution for each picklist field
        const distributionPromises = picklistFields.map(async (field) => {
          const distributionResponse = await fetchWithBQ(
            `/migration/v1/object/${object_id}/summary/chart/distribution/picklist_record/${encodeURIComponent(field)}` 
          );
          
          return {
            field,
            data: distributionResponse.data
          };
        });

        const distributions = await Promise.all(distributionPromises);
        
        // Convert to record format
        const result: Record<string, PicklistDistributionResponse> = {};
        distributions.forEach(({ field, data }) => {
          if (data && !(data as any).error) {
            result[field] = data as PicklistDistributionResponse;
          }
        });

        return { data: result };
      },
      providesTags: ['Distribution'],
    }),
  }),
});
// Export all hooks including lazy versions
export const { 
  useGetODFFileQuery,
  useUploadFileMutation,
  useUploadODFFileMutation,
  useGetViewFileQuery,
  useLazyGetViewFileQuery,
  useExtractMetadataMutation,
  useCheckMetadataStatusQuery,
  useLazyCheckMetadataStatusQuery,
  useLazyGetObjectCompletionQuery, 
  useGetColumnDensityQuery,
  useLazyGetColumnDensityQuery,
  useGetDataDensityQuery,
  useLazyGetDataDensityQuery,
  useGetDataQualityQuery,
  useLazyGetDataQualityQuery,
  useGetEntityMappedObjectQuery,
  useLazyGetEntityMappedObjectQuery,
  useGetPicklistDistributionQuery,
  useLazyGetPicklistDistributionQuery,
  useGetChartFilterQuery,
  useLazyGetChartFilterQuery,
  useGetAllPicklistDistributionsQuery,
  useLazyGetAllPicklistDistributionsQuery,
  useLazyGetDateDistributionQuery,
} = odfFileApi;// src/components/SummaryTab.tsx