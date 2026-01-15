// services/accountApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AccountData, Summary } from '../types'; // Updated import

export const accountApi = createApi({
  reducerPath: 'accountApi',
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
  tagTypes: ['Account', 'Summary'],
  endpoints: (builder) => ({
    // Get account information
    getAccount: builder.query<AccountData, void>({ // Updated type
      query: () => '/management/v2/account/',
      providesTags: ['Account'],
    }),
    // Update account name
    updateAccount: builder.mutation<AccountData, { name: string }>({ // Updated type
      query: (accountData) => ({
        url: '/management/v2/account/',
        method: 'PUT',
        body: accountData,
      }),
      invalidatesTags: ['Account'],
    }),
    // Get summary
    getSummary: builder.query<Summary, void>({
      query: () => '/management/v2/summary',
      providesTags: ['Summary'],
    }),
  }),
});

export const {
  useGetAccountQuery,
  useUpdateAccountMutation,
  useGetSummaryQuery,
} = accountApi;