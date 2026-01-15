import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface Pipeline {
  name: string;
  id: string;
  environment_id: string;
  object_id: string;
  status: string;
  is_deleted: boolean;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
  description: string;
  project_id: string;
  target_object_id: string;
  is_active: boolean;
  version_number: number;
  description_of_changes: string | null;
}

interface PipelineStep {
  pipeline_id: string;
  description: string;
  config: {
    task: string;
  };
  object_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
  created_by: string;
  id: string;
  step_type: string;
  name: string;
  order: number;
  target_object_id: string;
  results: any;
  modified_at: string;
  modified_by: string;
}

export const pipelineApi = createApi({
  reducerPath: 'pipelineApi',
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
  tagTypes: ['Pipeline', 'PipelineStep', 'Execution', 'ExecutionStep'],
  endpoints: (builder) => ({
    // Get pipelines
    getPipelines: builder.query<Pipeline[], { object_id: string; environment_id: string }>({
      query: ({ object_id, environment_id }) => ({
        url: `/pipeline/object/${object_id}/environment/${environment_id}`,
      }),
      providesTags: ['Pipeline'],
    }),

    // Get pipeline steps
    getPipelineSteps: builder.query<PipelineStep[], string>({
      query: (pipelineId) => `/pipeline/${pipelineId}/steps`,
      providesTags: ['PipelineStep'],
    }),

    // Generate pipeline
    generatePipeline: builder.mutation<Pipeline, { object_id: string; project_id: string; environment_id: string; target_object_id: string; name: string; description: string }>({
      query: (params) => ({
        url: '/pipeline/',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Pipeline'],
    }),

    // Run pipeline
    runPipeline: builder.mutation<{ status: string; message: string }, { pipelineId: string; environmentId: string }>({
      query: ({ pipelineId, environmentId }) => ({
        url: `/pipeline/${pipelineId}/execute`,
        method: 'POST',
        params: { environment_id: environmentId },
        body: { pipeline_id: pipelineId },
      }),
      invalidatesTags: ['Pipeline', 'PipelineStep'],
    }),

    // Run pipeline step
    runPipelineStep: builder.mutation<{ status: string; message: string }, { pipelineId: string; stepId: string }>({
      query: ({ pipelineId, stepId }) => ({
        url: `/pipeline/${pipelineId}/step/${stepId}/run`,
        method: 'POST',
      }),
      invalidatesTags: ['PipelineStep'],
    }),

    // Get executions for a pipeline
    getExecutions: builder.query<any[], { pipeline_id: string; environment_id?: string }>({
      query: ({ pipeline_id, environment_id }) => ({
        url: '/pipeline/executions',
        params: { pipeline_id, environment_id },
      }),
      providesTags: ['Execution'],
    }),

    // Get execution steps
    getExecutionSteps: builder.query<any[], string>({
      query: (executionId) => `/pipeline/executions/${executionId}/steps`,
      providesTags: ['ExecutionStep'],
    }),

    // Promote pipeline
    promotePipeline: builder.mutation<{ status: string; message: string }, { pipelineId: string; promotion_note: string; to_env: string }>({
      query: ({ pipelineId, ...body }) => ({
        url: `/pipeline/${pipelineId}/promote`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Pipeline'],
    }),
  }),
});

export const {
  useGetPipelinesQuery,
  useGetPipelineStepsQuery,
  useGeneratePipelineMutation,
  useRunPipelineMutation,
  useRunPipelineStepMutation,
  useGetExecutionsQuery,
  useGetExecutionStepsQuery,
  usePromotePipelineMutation,
} = pipelineApi;