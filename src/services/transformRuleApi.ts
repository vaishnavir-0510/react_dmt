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
  status: 'PENDING' | 'QUEUED' | 'STARTED' | 'PROGRESS' | 'SUCCESS' | 'COMPLETE' | 'FAILURE' | 'ERROR';
  progress: number;
  stage: string;
  result: any;
  error: string | null;
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
  }),
});

export const { 
  useApplyTransformRuleMutation, 
  useGetTransformTaskStatusQuery,
  useLazyGetTransformTaskStatusQuery,
} = transformRuleApi;