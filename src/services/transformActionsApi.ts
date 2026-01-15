// services/transformActionsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface TransformAction {
  function_name: string;
  params: Record<string, any>;
  title: string;
  description: string;
  helptext: string;
}

export interface TransformActionConfig {
  "JSON Configuration": {
    function_name: string;
    title: string;
    description: string;
    helptext: string;
    parameters: Record<string, string>;
    configuration: TransformActionParameter[];
  };
  function_name: string;
  params: Record<string, any>;
}

export interface TransformActionParameter {
  attribute: string;
  default: string;
  default_type: 'static' | 'dynamic';
  hint: string;
  label: string;
  optional: boolean;
  placeholder: string;
  tool_tip: string;
  ui_component: 'textbox' | 'dropdown' | 'checkbox' | 'textarea';
  validation: Array<{
    message: string;
    rule: string;
    value?: any;
    pattern?: string;
    api?: string;
    description?: string;
    parameters?: Array<{
      name: string;
      value: string;
    }>;
  }>;
  values: string[];
}

export const transformActionsApi = createApi({
  reducerPath: 'transformActionsApi',
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
  tagTypes: ['TransformActions'],
  endpoints: (builder) => ({
    getTransformActions: builder.query<TransformAction[], void>({
      query: () => '/actions/',
      providesTags: ['TransformActions'],
    }),
    getTransformActionConfig: builder.query<TransformActionConfig, string>({
      query: (functionName) => `/action/config/${functionName}`,
      providesTags: ['TransformActions'],
    }),
  }),
});

export const { 
  useGetTransformActionsQuery, 
  useGetTransformActionConfigQuery 
} = transformActionsApi;