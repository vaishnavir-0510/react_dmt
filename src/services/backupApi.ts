import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface BackupStats {
  objects: {
    total: number;
    change: number;
  };
  backups: {
    total: number;
    change: number;
    percentage_change: number;
  };
  last_backup: {
    object_id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    schedule_type: string;
  };
  next_scheduled: string | null;
  success_rate: number;
  fail_rate: number;
  success_count: number;
  failure_count: number;
  data_growth: Array<{
    month: string;
    gb: number;
  }>;
}

interface RecentActivityResponse {
  pagination: {
    page: number;
    limit: number;
    total_records: number;
  };
  activity: Array<{
    object_name: string;
    records: number;
    start_time: string;
    status: string;
    size: string;
  }>;
}

interface TopObjectsResponse {
  limit: number;
  objects: Array<{
    object_name: string;
    total_records: number;
  }>;
}

export const backupApi = createApi({
  reducerPath: 'backupStatsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
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
  tagTypes: ['BackupStats', 'BackupActivity', 'BackupObjects', 'BackupPlan', 'BackupHistory', 'BackupDownload'],
  endpoints: (builder) => ({
    getBackupStats: builder.query<BackupStats, void>({
      query: () => '/backup/v1/backup/stats/',
      providesTags: ['BackupStats'],
    }),
    getRecentActivity: builder.query<RecentActivityResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 5 }) => `/backup/v1/backup/recent-activity/?page=${page}&limit=${limit}`,
      providesTags: ['BackupActivity'],
    }),
    getTopObjects: builder.query<TopObjectsResponse, { limit?: number }>({
      query: ({ limit = 5 }) => `/backup/v1/backup/top-objects/?limit=${limit}`,
      providesTags: ['BackupObjects'],
    }),
    createBackupPlan: builder.mutation<{ summary_id: string; msg: string }, {
      object_id: string;
      Select: string;
      backup_type: string;
      backup_model: { backup_type: string; object_id: string };
      schedule_info: { schedule_type: string };
    }>({
      query: ({ object_id, Select, backup_type, backup_model, schedule_info }) => ({
        url: `/backup/v1/backup/plan/?object_id=${object_id}&Select=${Select}&backup_type=${encodeURIComponent(backup_type)}`,
        method: 'POST',
        body: { backup_model, schedule_info },
      }),
      invalidatesTags: ['BackupPlan'],
    }),
    getBackupProcessStatus: builder.query<{ status: string; message?: string }, string>({
      query: (summaryId) => ({
        url: `/backup/v1/backup/process/?summary_id=${summaryId}`,
        method: 'POST',
      }),
      providesTags: ['BackupPlan'],
    }),
    getBackupSummaryDetails: builder.query<any[], string>({
      query: (objectId) => `/backup/v1/backup/summary-details/?object_id=${objectId}`,
      providesTags: ['BackupHistory'],
    }),
    downloadBackup: builder.query<any, { object_id: string; filename: string; version: string }>({
      query: ({ object_id, filename, version }) =>
        `/backup/v1/backup/download/?object_id=${object_id}&filename=${filename}&version=${version}`,
      providesTags: ['BackupDownload'],
    }),
  }),
});

export const {
  useGetBackupStatsQuery,
  useGetRecentActivityQuery,
  useGetTopObjectsQuery,
  useCreateBackupPlanMutation,
  useGetBackupProcessStatusQuery,
  useGetBackupSummaryDetailsQuery,
  useLazyGetBackupSummaryDetailsQuery,
  useDownloadBackupQuery,
  useLazyDownloadBackupQuery,
} = backupApi;