// services/backupApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface BackupStatus {
  backup_job_id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'COMPLETED';
  progress?: number;
  message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BackupResponse {
  backup_job_id: string;
  message: string;
}

export const backupApi = createApi({
  reducerPath: 'backupApi',
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
  tagTypes: ['Backup'],
  endpoints: (builder) => ({
    // Create backup
    createLoadBackup: builder.mutation<BackupResponse, { objectId: string }>({
      query: ({ objectId }) => ({
        url: `backup/v1/preload/backup/?source_object_id=${objectId}`,
        method: 'POST',
        body: { object_id: objectId },
      }),
      invalidatesTags: ['Backup'],
    }),

    // Get backup status
    getBackupStatus: builder.query<BackupStatus, string>({
      query: (backupJobId) => `backup/v1/backup/status/?backup_job_id=${backupJobId}`,
      providesTags: ['Backup'],
    }),
  }),
});

export const {
  useCreateLoadBackupMutation,
  useGetBackupStatusQuery,
  useLazyGetBackupStatusQuery,
} = backupApi;