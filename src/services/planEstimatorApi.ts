// services/planEstimatorApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface PlanEstimator {
  id: string;
  environment: string;
  env_type: string;
  activity: string;
  environment_id: string;
  efforts: number;
  completion: number;
  project_id: string;
  tenant_key: string;
  start_date: string;
  end_date: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
}

export interface UpdatePlanEstimatorRequest {
  start_date: string | null;
  end_date: string | null;
}

export const planEstimatorApi = createApi({
  reducerPath: 'planEstimatorApi',
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
  tagTypes: ['PlanEstimator'],
  endpoints: (builder) => ({
    // Get plan estimator data
    getPlanEstimator: builder.query<PlanEstimator[], void>({
      query: () => '/management/v2/plan/estimator/',
      providesTags: ['PlanEstimator'],
    }),
    // Update plan estimator efforts
    updatePlanEstimator: builder.mutation<{ message: string }, { projectId: string; data: UpdatePlanEstimatorRequest }>({
      query: ({ projectId, data }) => ({
        url: `/management/v2/plan/estimator/${projectId}/efforts`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PlanEstimator'],
    }),
  }),
});

export const {
  useGetPlanEstimatorQuery,
  useUpdatePlanEstimatorMutation,
} = planEstimatorApi;