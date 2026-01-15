import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { EnvironmentConfig } from '../config/environmentConfig';

export interface RevealEntry {
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

export interface RevealResponse {
  message: RevealEntry;
}

export interface CreateRevealRequest {
  latest_entry: boolean;
  object_id: string;
  reason: string;
  reveal_flag: boolean;
}

export interface UpdateRevealRequest {
  is_active: boolean;
  latest_entry: boolean;
  reveal_flag: boolean;
}

export const revealApi = createApi({
  reducerPath: 'revealApi',
  baseQuery: fetchBaseQuery({
    baseUrl: EnvironmentConfig.baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.accessToken;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Reveal'],
  endpoints: (builder) => ({
    getRevealStatus: builder.query<RevealResponse | null, string>({
      query: (objectId) => ({
        url: `agent/reveal/latest_entry`,
        params: { object_id: objectId },
      }),
      transformResponse: (response: RevealResponse) => response,
      providesTags: ['Reveal'],
    }),

    createReveal: builder.mutation<RevealResponse, CreateRevealRequest>({
      query: (data) => ({
        url: 'agent/reveal',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reveal'],
    }),

    updateReveal: builder.mutation<RevealResponse, { objectId: string; data: UpdateRevealRequest }>({
      query: ({ objectId, data }) => ({
        url: `agent/reveal/${objectId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Reveal'],
    }),
  }),
});

export const {
  useGetRevealStatusQuery,
  useCreateRevealMutation,
  useUpdateRevealMutation,
} = revealApi;