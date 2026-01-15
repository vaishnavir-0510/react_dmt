// services/errorApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ErrorRecord {
  id: string;
  iteration_reference: string;
  error: string;
  comment: string;
  Fix: string;
  Count: number;
  object_id: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
  is_ignored: boolean;
  environment: string;
  is_current: boolean;
  status: string;
  reload_job: string | null;
  remediation_default_action: string;
  remediation_status: string | null;
  object_name: string;
}

interface ErrorResponse {
  records: ErrorRecord[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

interface UpdateErrorRequest {
  id: string;
  comment?: string;
  Fix?: string;
  is_ignored?: boolean;
}

interface ErrorTrackerDataRecordsResponse {
  records: Record<string, any>[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export const errorApi = createApi({
  reducerPath: "errorApi",
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
  tagTypes: ["ErrorTracker"],
  endpoints: (builder) => ({
    getErrorTracker: builder.query<ErrorResponse, { objectId?: string; page?: number; pageSize?: number }>({
      query: ({ objectId, page = 1, pageSize = 10 }) => {
        if (!objectId) {
          throw new Error('objectId is required');
        }
        return `/load/ingest/v1/error_tracker/?object_id=${objectId}&page=${page}&page_size=${pageSize}`;
      },
      providesTags: ["ErrorTracker"],
    }),
    updateError: builder.mutation<ErrorRecord, UpdateErrorRequest>({
      query: ({ id, ...updates }) => ({
        url: `/load/ingest/v1/errortracker/`,
        method: 'PUT',
        body: { id, ...updates },
      }),
      invalidatesTags: ["ErrorTracker"],
    }),
    getErrorTrackerDataRecords: builder.query<ErrorTrackerDataRecordsResponse, { summaryId: string; objectId: string; page?: number; pageSize?: number }>({
      query: ({ summaryId, objectId, page = 1, pageSize = 50 }) => ({
        url: `/load/ingest/v1/data_records/error_tracker/`,
        params: { summary_id: summaryId, object_id: objectId, page, page_size: pageSize }
      }),
      providesTags: ["ErrorTracker"],
    }),
    updateErrorRecord: builder.mutation<any, { summaryId: string; objectId: string; recordData: Record<string, any> }>({
      query: ({ summaryId, objectId, recordData }) => ({
        url: `/load/ingest/v1/edit_selected/error_records`,
        method: 'POST',
        params: { summary_id: summaryId, object_id: objectId },
        body: [recordData] // Send as array
      }),
      invalidatesTags: ["ErrorTracker"],
    }),
    emailAllErrorRecords: builder.query<any, string>({
      query: (objectId) => ({
        url: `/load/ingest/v1/email_all/error_tracker/records`,
        params: { object_id: objectId }
      }),
    }),
    loadAllErrorRecords: builder.mutation<any, string>({
      query: (objectId) => ({
        url: `/load/ingest/v1/generate/load/file`,
        method: 'POST',
        params: { source_object_id: objectId }
      }),
    }),
    emailErrorRecord: builder.query<any, { errorId: string; objectId: string }>({
      query: ({ errorId, objectId }) => ({
        url: `/load/ingest/v1/email/error_tracker/${errorId}`,
        params: { object_id: objectId }
      }),
    }),
    ignoreErrorRecord: builder.query<any, { errorTrackerId: string; iterationId: string; objectId: string }>({
      query: ({ errorTrackerId, iterationId, objectId }) => ({
        url: `/load/ingest/v1/ignore/data_records`,
        params: { error_tracker_id: errorTrackerId, iteration_id: iterationId, object_id: objectId }
      }),
    }),
    downloadErrorCsv: builder.query<any, { errorId: string; objectId: string; iterationId: string }>({
      query: ({ errorId, objectId, iterationId }) => ({
        url: `/load/ingest/v1/download/error_csv/${errorId}`,
        params: { object_id: objectId, iteration_id: iterationId }
      }),
    }),
  }),
});

export const {
  useGetErrorTrackerQuery,
  useUpdateErrorMutation,
  useGetErrorTrackerDataRecordsQuery,
  useUpdateErrorRecordMutation,
  useLazyEmailAllErrorRecordsQuery,
  useLoadAllErrorRecordsMutation,
  useLazyEmailErrorRecordQuery,
  useLazyIgnoreErrorRecordQuery,
  useLazyDownloadErrorCsvQuery,
} = errorApi;