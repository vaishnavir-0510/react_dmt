// services/loadApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface LoadIterationRow {
  id: string;
  object_id: string;
  file_id: string;
  type: string;
  operation: string;
  start_dt: string;
  end_dt: string;
  duration: string;
  record_ct: number;
  success_ct: number;
  failed_ct: number;
  batch_size: number;
  bulk_mode: string;
  success_file: string;
  error_file: string;
  unprocessed_file: string;
  load_track: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
  status: string;
  job_id: string;
  error_msg: string;
  environment: string;
}

export const loadApi = createApi({
  reducerPath: "loadApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["LoadIteration", "SalesforceConnection"],

  endpoints: (builder) => ({
    // GET TABLE DATA - Update types to accept string | undefined
    getLoadIteration: builder.query<LoadIterationRow[], { objectId?: string; projectId?: string }>({
      query: ({ objectId, projectId }) => {
        // Add validation to ensure required parameters are present
        if (!objectId || !projectId) {
          throw new Error('objectId and projectId are required');
        }
        return `/migration/v1/iteration/data/?object=${objectId}&project=${projectId}`;
      },
      providesTags: ["LoadIteration"],
    }),
// In loadApi.ts, add this to the endpoints object
loadData: builder.mutation<any, { iterationId: string; sourceObjectId: string; operation: string }>({
  query: ({ iterationId, sourceObjectId, operation }) => ({
    url: `/load/ingest/v1/load/file?operation=${operation}&iteration_id=${iterationId}&source_object_id=${sourceObjectId}`,
    method: 'POST',
  }),
  invalidatesTags: ['LoadIteration'],
}),
    // Generate Load File - Update to accept string | undefined
    generateLoadFile: builder.mutation<any, string | undefined>({
      query: (objectId) => {
        if (!objectId) {
          throw new Error('objectId is required');
        }
        return {
          url: `/load/ingest/v1/generate/load/file?source_object_id=${objectId}`,
          method: "POST",
          body: { source_object_id: objectId },
        };
      },
    }),

    // Check Salesforce connection status
    checkSalesforceConnection: builder.query<{ detail?: string; message?: string }, void>({
      query: () => '/load/v1/check-connection/',
      providesTags: ['SalesforceConnection'],
    }),

    // Connect to Salesforce
    connectToSalesforce: builder.mutation<any, {
      username: string;
      password: string;
      security_token: string;
      client_id: string;
      client_secret: string;
    }>({
      query: (credentials) => ({
        url: '/load/v1/connect/',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['SalesforceConnection'],
    }),

    // Disconnect from Salesforce
    disconnectFromSalesforce: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/load/v1/disconnect/',
        method: 'DELETE',
      }),
      invalidatesTags: ['SalesforceConnection'],
    }),

    // Extract sample data from Salesforce
    extractSalesforceSample: builder.mutation<any, { object_name: string }>({
      query: ({ object_name }) => ({
        url: `/load/v1/salesforce/sample/${object_name}`,
        method: 'POST',
        body: { object_name },
      }),
    }),

    // Refresh Salesforce metadata
    refreshSalesforceMetadata: builder.mutation<any, {
      object_name: string;
      object_id: string;
      project_id: string;
      system_id: string;
    }>({
      query: (params) => ({
        url: `/load/v1/salesforce/metadata/${params.object_name}`,
        method: 'POST',
        body: params,
      }),
    }),
  }),
});

export const {
  useGetLoadIterationQuery,
  useGenerateLoadFileMutation,
  useLoadDataMutation,
  useCheckSalesforceConnectionQuery,
  useConnectToSalesforceMutation,
  useDisconnectFromSalesforceMutation,
  useExtractSalesforceSampleMutation,
  useRefreshSalesforceMetadataMutation,
} = loadApi;