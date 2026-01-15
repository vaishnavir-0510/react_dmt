// services/securityPoliciesApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface SecurityPolicy {
  policy_name: string | null;
  security_class: string | null;
  permission: string | null;
  mask: string | null;
  object_id: string | null;
  project_id: string | null;
  ontology_term: string | null;
  version: string | null;
  pii_policy_id: string;
  created_by: string | null;
  modified_by: string | null;
  created_date: string;
  modified_date: string;
  is_active: boolean;
  is_deleted: boolean;
  tenant_id: string;
}

export interface RevealActivity {
  id: string;
  user_id: string;
  object_id: string;
  tenant_id: string;
  is_active: boolean;
  reveal_flag: boolean;
  latest_entry: boolean;
  source: string;
  ip: string;
  created_date: string;
  modified_date: string;
}

export interface PolicyChangeHistory {
  id: string;
  user_id: string;
  object_id: string;
  tenant_id: string;
  datetime: string;
  old_value: SecurityPolicy[];
  new_value: SecurityPolicy[];
  ip: string;
  source: string;
}

export const securityPoliciesApi = createApi({
  reducerPath: 'securityPoliciesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api-dev.datamatter.tech',
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
  tagTypes: ['SecurityPolicies'],
  endpoints: (builder) => ({
    // Get all security policies
    getSecurityPolicies: builder.query<SecurityPolicy[], void>({
      query: () => '/agent/semantic_policy/policies',
      providesTags: ['SecurityPolicies'],
    }),

    // Create a new security policy
    createSecurityPolicy: builder.mutation<SecurityPolicy, Partial<SecurityPolicy>>({
      query: (policyData) => ({
        url: '/agent/semantic_policy/policy',
        method: 'POST',
        body: policyData,
      }),
      invalidatesTags: ['SecurityPolicies'],
    }),

    // Update an existing security policy
    updateSecurityPolicy: builder.mutation<SecurityPolicy, { id: string; data: Partial<SecurityPolicy> }>({
      query: ({ id, data }) => ({
        url: `/agent/semantic_policy/policies/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SecurityPolicies'],
    }),

    // Delete a security policy
    deleteSecurityPolicy: builder.mutation<void, string>({
      query: (id) => ({
        url: `/agent/semantic_policy/policies/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SecurityPolicies'],
    }),

    // Update default policy
    updateDefaultPolicy: builder.mutation<void, { policyId: string }>({
      query: ({ policyId }) => ({
        url: `/agent/semantic_policy/policies/${policyId}/default`,
        method: 'PUT',
      }),
      invalidatesTags: ['SecurityPolicies'],
    }),

    // Update default policy scope
    updateDefaultPolicyScope: builder.mutation<void, { project_id?: string; object_id?: string }>({
      query: (data) => ({
        url: '/agent/semantic_policy/update_default_policy',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SecurityPolicies'],
    }),

    // Get reveal activities
    getRevealActivities: builder.query<{ message: RevealActivity[] }, void>({
      query: () => '/agent/reveal',
      providesTags: ['SecurityPolicies'],
    }),

    // Get policy change history
    getPolicyChangeHistory: builder.query<{ message: PolicyChangeHistory[] }, void>({
      query: () => '/agent/v1/policy/all',
      providesTags: ['SecurityPolicies'],
    }),
  }),
});

export const {
  useGetSecurityPoliciesQuery,
  useCreateSecurityPolicyMutation,
  useUpdateSecurityPolicyMutation,
  useDeleteSecurityPolicyMutation,
  useUpdateDefaultPolicyMutation,
  useUpdateDefaultPolicyScopeMutation,
  useGetRevealActivitiesQuery,
  useGetPolicyChangeHistoryQuery,
} = securityPoliciesApi;