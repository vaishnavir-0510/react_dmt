// src/services/activityApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

export interface ActivityModel {
  object_id: string;
  project_id: string;
  activity: string;
  field_count: number;
  efforts: number;
  created_by: string;
  created_date: string;
  read_only: boolean;
  environment_id: string;
  id: string;
  is_completed: boolean;
  records_count: string;
  completion: number;
  modified_by: string;
  modified_date: string;
}

export interface ActivityStatusUpdate {
  object_id: string;
  activity: string;
  flag: boolean;
  allow: boolean;
}

export const activityApi = createApi({
  reducerPath: 'activityApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api-dev.datamatter.tech',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ActivityStatus', 'Completion'],
  endpoints: (builder) => ({
    // Get activity status for an object
    getActivityStatus: builder.query<ActivityModel[], { objectId: string }>({
      query: ({ objectId }) => ({
        url: `/management/v2/activity_status/object_estimator`,
        params: { object_id: objectId },
      }),
      providesTags: ['ActivityStatus'],
    }),

    // Update activity completion status
    updateActivityStatus: builder.mutation<
      { message: string },
      ActivityStatusUpdate
    >({
      query: ({ object_id, activity, flag, allow }) => ({
        url: `/management/v2/activity/status/completed/`,
        method: 'PUT',
        params: {
          object_id,
          activity,
          flag: flag.toString(),
          allow: allow.toString(),
        },
      }),
      invalidatesTags: ['ActivityStatus', 'Completion'],
    }),

    // Legacy endpoint for activity status (if needed)
    getActivityStatusLegacy: builder.query<any[], { objectId: string }>({
      query: ({ objectId }) => ({
        url: `/activity-status`,
        params: { object_id: objectId },
      }),
    }),
  }),
});

export const {
  useGetActivityStatusQuery,
  useUpdateActivityStatusMutation,
  useGetActivityStatusLegacyQuery,
} = activityApi;