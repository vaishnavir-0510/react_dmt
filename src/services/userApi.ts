// services/userApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ProjectUser, AddUserRequest, SystemUser, SystemUsersResponse } from '../types';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
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
  tagTypes: ['ProjectUsers', 'SystemUsers'],
  endpoints: (builder) => ({
    // Get all system users
    getSystemUsers: builder.query<SystemUser[], void>({
      query: () => '/auth/v3/users/',
      providesTags: ['SystemUsers'],
      // Transform the response to always return an array of SystemUser
      transformResponse: (response: SystemUsersResponse | SystemUser[]): SystemUser[] => {
        // If response is already an array, return it
        if (Array.isArray(response)) {
          return response;
        }
        // If response is an object with users property
        if (response && typeof response === 'object' && response.users) {
          return response.users;
        }
        // If response is an object with data property
        if (response && typeof response === 'object' && response.data) {
          return response.data;
        }
        // Fallback to empty array
        return [];
      },
    }),
    // Get project users
    getProjectUsers: builder.query<ProjectUser[], string>({
      query: (projectId) => `/management/v2/project/user/${projectId}`,
      providesTags: ['ProjectUsers'],
    }),
    // Add user to project
    addUserToProject: builder.mutation<ProjectUser, AddUserRequest>({
      query: (userData) => ({
        url: '/management/v2/project/user',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['ProjectUsers'],
    }),
    // Remove user from project
    removeUserFromProject: builder.mutation<void, { projectId: string; userId: string }>({
      query: ({ projectId, userId }) => ({
        url: `/management/v2/project/user/${projectId}/user/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectUsers'],
    }),
  }),
});

export const {
  useGetSystemUsersQuery,
  useGetProjectUsersQuery,
  useAddUserToProjectMutation,
  useRemoveUserFromProjectMutation,
} = userApi;