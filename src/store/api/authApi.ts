import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, LoginCredentials } from '../../types';
import { updateTokens, logout, setLoading, setError, clearError } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
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
  fetchFn: async (input, init) => {
    console.log('🌐 HTTP REQUEST:', {
      url: input,
      method: init?.method,
      headers: init?.headers ? Object.fromEntries((init.headers as Headers).entries()) : undefined,
      body: init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : undefined
    });

    const response = await fetch(input, init);

    console.log('🌐 HTTP RESPONSE:', {
      url: input,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Clone response to read body without consuming it
    const clonedResponse = response.clone();
    try {
      const responseBody = await clonedResponse.json();
      console.log('🌐 HTTP RESPONSE BODY:', responseBody);
    } catch (e) {
      console.log('🌐 HTTP RESPONSE BODY: (not JSON or empty)');
    }

    return response;
  }
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/v3/refresh_token',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const { access_token, refresh_token: newRefreshToken } = refreshResult.data as any;

        // Update both tokens
        api.dispatch(updateTokens({
          accessToken: access_token,
          refreshToken: newRefreshToken || refreshToken
        }));

        // Retry original request with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
        window.location.href = '/login';
      }
    } else {
      api.dispatch(logout());
      window.location.href = '/login';
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/v3/login/',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(clearError());
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage = error?.error?.data?.message || 'Login failed';
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    refreshToken: builder.mutation<{ access_token: string; refresh_token: string }, { refresh_token: string }>({
      query: (credentials) => ({
        url: '/auth/v3/refresh_token',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/v3/logout/',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch }) {
        dispatch(logout());
      },
    }),
    getUserProfile: builder.query<any, void>({
      query: () => '/auth/v3/user/',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetUserProfileQuery,
} = authApi;