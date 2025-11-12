// services/usersApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { SystemUser, InviteUserRequest, UpdateUserRequest } from '../types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
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
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    // Get all system users
    getSystemUsers: builder.query<SystemUser[], void>({
      query: () => '/auth/v3/users/',
      providesTags: ['Users'],
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response && typeof response === 'object' && response.users) {
          return response.users;
        }
        if (response && typeof response === 'object' && response.data) {
          return response.data;
        }
        return [];
      },
    }),
    // Invite user
    inviteUser: builder.mutation<SystemUser, InviteUserRequest>({
      query: (userData) => ({
        url: '/auth/v3/invite/',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),
    // Update user
    updateUser: builder.mutation<SystemUser, UpdateUserRequest>({
      query: ({ id, ...data }) => ({
        url: `/auth/v3/user/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    // Delete user (soft delete)
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/auth/v3/user/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetSystemUsersQuery,
  useInviteUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;