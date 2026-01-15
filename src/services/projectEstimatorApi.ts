// services/projectEstimatorApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ProjectEstimatorActivity {
  activity: string;
  name: string;
  phase: string;
  range_min: number;
  range_max: number;
  project_id: string;
  id: string;
  dev_set_value: number;
  uat_set_value: number;
  prod_set_value: number;
  qa_set_value: number;
  dev_recc_effort: number;
  tenant_key: string;
  created_by: string;
  modified_by: string;
  is_deleted: boolean;
  created_date: string;
  modified_date: string;
  project_est_data: boolean;
}

export interface ProjectObjectEstimation {
  Object_name: string;
  Info: Array<{
    activity: string;
    efforts: number;
  }>;
  total_efforts: number;
}

export interface CreateProjectEstimatorRequest {
  project_id: string;
  account_id: string;
  name: string;
  activity: string;
  phase: string;
  recc_effort: string;
  dev_set_value: string;
}

export interface UpdateProjectEstimatorRequest {
  activity: string;
  id: string;
  recc_effort: number;
  qa_set_value: number;
  prod_set_value: number;
  tenant_key: string;
  created_by: string;
  created_date: string;
  is_deleted: boolean;
  phase: string;
  project_id: string;
  name: string;
  dev_set_value: number;
  uat_set_value: number;
  account_id: string;
  modified_by: string;
  modified_date: string;
}

export const projectEstimatorApi = createApi({
  reducerPath: 'projectEstimatorApi',
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
  tagTypes: ['ProjectEstimator'],
  endpoints: (builder) => ({
    getProjectEstimator: builder.query<ProjectEstimatorActivity[], void>({
      query: () => '/management/v2/project/estimator/',
      providesTags: ['ProjectEstimator'],
    }),
    getProjectSummary: builder.query<ProjectObjectEstimation[], void>({
      query: () => '/management/v2/estimator/project/summary/',
      providesTags: ['ProjectEstimator'],
    }),
    createProjectEstimator: builder.mutation<ProjectEstimatorActivity, CreateProjectEstimatorRequest>({
      query: (data) => ({
        url: '/management/v2/project/estimator',
        method: 'POST',
        body: data,
      }),
    }),
    updateProjectEstimator: builder.mutation<ProjectEstimatorActivity, { id: string; data: Partial<UpdateProjectEstimatorRequest> }>({
      query: ({ id, data }) => ({
        url: `/management/v2/project/estimator/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),
    bulkUpdateProjectEstimator: builder.mutation<ProjectEstimatorActivity[], { updates: Array<{ id: string; data: Partial<UpdateProjectEstimatorRequest> }> }>({
      query: ({ updates }) => ({
        url: '/management/v2/project/estimator/bulk',
        method: 'PUT',
        body: { updates },
      }),
      invalidatesTags: ['ProjectEstimator'],
    }),
  }),
});

export const {
  useGetProjectEstimatorQuery,
  useGetProjectSummaryQuery,
  useCreateProjectEstimatorMutation,
  useUpdateProjectEstimatorMutation,
  useBulkUpdateProjectEstimatorMutation,
} = projectEstimatorApi;