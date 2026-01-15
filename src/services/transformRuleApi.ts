// services/transformRuleApi.ts
import { createApi, fetchBaseQuery, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

interface ApplyTransformRuleRequest {
  object_id: string;
  function_name: string;
  params: Record<string, any>;
}

interface ApplyTransformRuleResponse {
  status: string;
  task_id: string;
  message: string;
}

interface TaskStatusResponse {
  task_id: string;
  status: 'STARTED' | 'SUCCESS' | 'FAILURE' | 'ERROR' | 'queued';
  progress: number;
  stage: string;
  result: any;
  error: string | null;
}

interface TransformRule {
  rule_id: number;
  function_name: string;
  params: Record<string, any>;
  status: 'APPLIED' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ERROR';
  last_error: string | null;
  applied_at: string;
  run_number: number;
}

interface CleanupRule {
  rule_id: string;
  tab_name: string;
  cleanup_function: string;
  change_log_id: string;
  parameter: Record<string, any>;
  sequence: string;
  metadata_attribute: string;
  status: 'APPLIED' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ERROR' | 'FAILED';
  last_error: string | null;
  applied_at: string | null;
  run_number: number;
}

interface ValidateRule {
  rule_id: string;
  tab_name: string;
  cleanup_function: string;
  change_log_id: string;
  parameter: Record<string, any>;
  sequence: string;
  metadata_attribute: string;
  status: 'APPLIED' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ERROR' | 'FAILED';
  last_error: string | null;
  applied_at: string | null;
  run_number: number;
}

interface TransformRulesResponse {
  rules: TransformRule[];
}

interface ApplyAllRulesRequest {
  object_id: string;
  rule_ids: string[];
}

interface ApplyAllRulesResponse {
  task_id: string;
  status: string;
  message: string;
}


// Properly typed error response
interface ApiErrorResponse {
  error?: string;
  message?: string;
  task_id?: string;
  status?: string;
}

export const transformRuleApi = createApi({
  reducerPath: 'transformRuleApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/migration/v2/transform`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['TransformRule', 'TransformTask'],
  endpoints: (builder) => ({
    applyTransformRule: builder.mutation<ApplyTransformRuleResponse, ApplyTransformRuleRequest>({
      query: (ruleData) => ({
        url: '/rule/',
        method: 'POST',
        body: ruleData,
      }),
      transformErrorResponse: (
        baseQueryReturnValue: FetchBaseQueryError, 
        meta, 
        arg
      ) => {
        // Check if it's a 409 Conflict error
        if (baseQueryReturnValue.status === 409) {
          const errorData = baseQueryReturnValue.data as ApiErrorResponse;
          return {
            status: 409,
            data: {
              error: 'TRANSFORM_ALREADY_APPLIED',
              message: errorData?.message || 'This transform rule has already been applied or is in progress',
              object_id: arg.object_id,
              task_id: errorData?.task_id,
            }
          };
        }
        
        // Return original error for other cases
        return baseQueryReturnValue;
      },
      invalidatesTags: ['TransformRule'],
    }),

    getTransformTaskStatus: builder.query<TaskStatusResponse, { taskId: string }>({
      query: ({ taskId }) => `/rule/tasks/${taskId}/status`,
      providesTags: (result, error, { taskId }) => [{ type: 'TransformTask', id: taskId }],
    }),

    getTransformRules: builder.query<TransformRule[], { objectId: string }>({
      query: ({ objectId }) => `/rules/?object_id=${objectId}`,
      providesTags: ['TransformRule'],
    }),

    applyAllRules: builder.mutation<ApplyAllRulesResponse, ApplyAllRulesRequest>({
      query: ({ object_id, rule_ids }) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/migration/v2/cleaner/rules?object_id=${object_id}`,
        method: 'POST',
        body: rule_ids,
      }),
    }),

    getCleanerTaskStatus: builder.query<TaskStatusResponse, { taskId: string }>({
      query: ({ taskId }) => `${import.meta.env.VITE_API_BASE_URL}/migration/v2/cleaner/tasks/${taskId}/status`,
    }),

    deleteTransformRule: builder.mutation<{ message: string }, { ruleId: number }>({
      query: ({ ruleId }) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/migration/v2/transform/rule/${ruleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TransformRule'],
    }),

    deleteCleanerRule: builder.mutation<{ message: string }, { ruleId: string }>({
      query: ({ ruleId }) => ({
        url: `${import.meta.env.VITE_API_BASE_URL}/migration/cleanup/rule?rule_id=${ruleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TransformRule'],
    }),

    getCleanupRules: builder.query<CleanupRule[], { objectId: string }>({
      query: ({ objectId }) => `${import.meta.env.VITE_API_BASE_URL}/migration/v2/cleaner/rules?object_id=${objectId}&tab_name=cleanup`,
      providesTags: ['TransformRule'],
    }),

    getValidateRules: builder.query<ValidateRule[], { objectId: string }>({
      query: ({ objectId }) => `${import.meta.env.VITE_API_BASE_URL}/migration/v2/cleaner/rules?object_id=${objectId}&tab_name=validate`,
      providesTags: ['TransformRule'],
    }),
  }),
});

export const {
  useApplyTransformRuleMutation,
  useGetTransformTaskStatusQuery,
  useLazyGetTransformTaskStatusQuery,
  useGetTransformRulesQuery,
  useApplyAllRulesMutation,
  useGetCleanerTaskStatusQuery,
  useLazyGetCleanerTaskStatusQuery,
  useDeleteTransformRuleMutation,
  useDeleteCleanerRuleMutation,
  useGetCleanupRulesQuery,
  useGetValidateRulesQuery,
} = transformRuleApi;