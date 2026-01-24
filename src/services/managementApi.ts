// services/managementApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface FileRecord {
  file_name: string;
  file_type: string;
  sources_from: string;
  status: string | null;
  description: string;
  change_log_id: string | null;
  created_date: string;
  label: string;
}

export interface FilesResponse {
  files: FileRecord[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export const managementApi = createApi({
  reducerPath: 'managementApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getFilesList: builder.query<FilesResponse, { objectId: string; page: number; limit: number }>({
      query: ({ objectId, page, limit }) => ({
        url: `management/v3/list-files`,
        params: { object_id: objectId, page, limit },
      }),
    }),
    downloadFile: builder.query<string, { fileName: string }>({
      query: ({ fileName }) => ({
        url: `management/v2/download_by_name/${fileName}`,
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const { useGetFilesListQuery, useLazyDownloadFileQuery } = managementApi;