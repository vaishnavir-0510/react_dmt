// services/validateRuleApi.ts
import { createApi, fetchBaseQuery, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

interface ApplyValidateRuleRequest {
  change_log_id: number;
  validate_fun_id: number;
  function_name: string;
  object_id: string;
  params: Record<string, any>;
  sequence?: number;
  tab_name?: string;
  validation_fun_id?: number | null;
}

interface ApplyValidateRuleResponse {
  task_id: string;
  status: string;
  message: string;
}

interface TaskStatusResponse {
  task_id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ERROR';
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

export const validateRuleApi = createApi({
  reducerPath: 'validateRuleApi',
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
  tagTypes: ['ValidateRule', 'ValidateTask'],
  endpoints: (builder) => ({
    applyValidateRule: builder.mutation<ApplyValidateRuleResponse, ApplyValidateRuleRequest>({
      query: (ruleData) => ({
        url: '/migration/v2/validator/rule',
        method: 'POST',
        body: ruleData,
      }),
      // Fixed transformErrorResponse with proper typing
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
              error: 'RULE_ALREADY_APPLIED',
              message: errorData?.message || 'This validate rule has already been applied or is in progress',
              change_log_id: arg.change_log_id,
              task_id: errorData?.task_id,
            }
          };
        }
        
        // Return original error for other cases
        return baseQueryReturnValue;
      },
      invalidatesTags: ['ValidateRule'],
    }),

    getTaskStatus: builder.query<TaskStatusResponse, { taskId: string }>({
      query: ({ taskId }) => `/migration/v2/cleaner/tasks/${taskId}/status`,
      providesTags: (result, error, { taskId }) => [{ type: 'ValidateTask', id: taskId }],
    }),

    // Alternative: Handle 409 in the query itself with extra options
    applyValidateRuleWithRetry: builder.mutation<ApplyValidateRuleResponse, ApplyValidateRuleRequest>({
      query: (ruleData) => ({
        url: '/migration/v2/validator/rule',
        method: 'POST',
        body: ruleData,
      }),
      extraOptions: {
        maxRetries: 1, // Only retry once for non-409 errors
      },
      // Handle errors in the component instead
    }),
  }),
});

// Alternative approach: Create a wrapper hook with better error handling
export const useApplyValidateRuleWithHandling = () => {
  const [applyValidateRule, mutation] = useApplyValidateRuleMutation();
  
  const applyWithHandling = async (ruleData: ApplyValidateRuleRequest) => {
    try {
      const result = await applyValidateRule(ruleData).unwrap();
      return { success: true, data: result };
    } catch (error: any) {
      // Handle 409 conflict specifically
      if (error.status === 409) {
        return { 
          success: false, 
          error: 'CONFLICT',
          message: error.data?.message || 'Rule already applied',
          taskId: error.data?.task_id 
        };
      }
      
      // Handle other errors
      return { 
        success: false, 
        error: 'OTHER_ERROR',
        message: error.data?.message || 'Failed to apply validate rule'
      };
    }
  };
  
  return [applyWithHandling, mutation] as const;
};

export const { 
  useApplyValidateRuleMutation, 
  useGetTaskStatusQuery,
  useLazyGetTaskStatusQuery,
  useApplyValidateRuleWithRetryMutation
} = validateRuleApi;
