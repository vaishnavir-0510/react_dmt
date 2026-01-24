// services/filterApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FilterDataRecord, FilterDataResponse } from '../types';

export interface AppliedFilter {
  object_id: string;
  values: string | null;
  from_date: string | null;
  is_deleted: boolean;
  to_date: string | null;
  is_applied: boolean;
  from_range: string | null;
  autofilter: boolean;
  order: number;
  to_range: string | null;
  created_by: string;
  dmt_filter: string;
  ref_obj_id: string | null;
  modified_by: string;
  type: string;
  ref_field: string | null;
  created_date: string;
  field: string;
  ref_type: string | null;
  modified_date: string;
}

export interface CreateFilterPayload {
  type: string;
  field: string;
  object_id: string;
  from_date?: string | null;
  from_range?: string | null;
  ref_field?: string;
  ref_obj_id?: string;
  ref_type?: string;
  to_date?: string | null;
  to_range?: string | null;
  values?: string[];
}

export const filterApi = createApi({
  reducerPath: 'filterApi',
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
  tagTypes: ['FilterData', 'AppliedFilters'],
  endpoints: (builder) => ({
    getFilterData: builder.query<FilterDataResponse, {
      objectId: string;
      environmentId?: string;
      page?: number;
      limit?: number;
      search?: string;
    }>({
      query: ({ objectId, environmentId, page = 1, limit = 10, search = '' }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: search,
        });
        if (environmentId) {
          params.append('environment', environmentId);
        }
        return `/management/v2/filtered_file/${objectId}/${objectId}.csv?${params.toString()}`;
      },
      providesTags: ['FilterData'],
    }),
    removeColumns: builder.mutation<{
      for_migrate_update: Record<string, string>;
    }, {
      object_id: string;
      columns_to_remove: string[];
      for_migrate?: boolean;
    }>({
      query: (body) => ({
        url: '/management/v2/remove_columns',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FilterData'],
    }),
    createFilter: builder.mutation<any, CreateFilterPayload>({
      query: (body) => ({
        url: '/management/v2/filter',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AppliedFilters'],
    }),
    applyFilter: builder.mutation<{ message: string }, { object_id: string }>({
      query: ({ object_id }) => ({
        url: `/management/v2/filter_apply?object_id=${object_id}`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['FilterData', 'AppliedFilters'],
    }),
    getAppliedFilters: builder.query<AppliedFilter[], string>({
      query: (objectId) => `/management/v2/filter/${objectId}`,
      providesTags: ['AppliedFilters'],
    }),
    updateFilter: builder.mutation<any, { filterId: string; payload: CreateFilterPayload }>({
      query: ({ filterId, payload }) => ({
        url: `/management/v2/filter/${filterId}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['AppliedFilters'],
    }),
    deleteFilters: builder.mutation<{ message: string; deleted_count: number }, string[]>({
      query: (filterIds) => ({
        url: '/management/v2/filters',
        method: 'DELETE',
        body: filterIds,
      }),
      invalidatesTags: ['FilterData', 'AppliedFilters'],
    }),
  }),
});

export const { useGetFilterDataQuery, useRemoveColumnsMutation, useCreateFilterMutation, useApplyFilterMutation, useGetAppliedFiltersQuery, useUpdateFilterMutation, useDeleteFiltersMutation } = filterApi;