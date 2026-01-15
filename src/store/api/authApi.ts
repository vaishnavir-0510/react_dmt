import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, LoginCredentials, RegisterCredentials, ForgotPasswordCredentials } from '../../types';
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
    } catch {
      console.log('🌐 HTTP RESPONSE BODY: (not JSON or empty)');
    }

    return response;
  }
});

// Track if a refresh is in progress to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  // Skip token refresh for refresh_token endpoint itself to prevent infinite loops
  const isRefreshTokenRequest = args.url?.includes('/auth/v3/refresh_token');
  
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !isRefreshTokenRequest) {
    console.group('🔐 401 Unauthorized - Token Refresh Required');
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log(`📡 Failed Request: ${args.method || 'GET'} ${args.url}`);
    console.log('🔍 Checking for refresh token...');
    
    // Try to refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.error('❌ No refresh token available - logging out');
      console.groupEnd();
      // No refresh token available, logout immediately
      api.dispatch(logout());
      window.location.href = '/login';
      return result;
    }

    // If refresh is already in progress, wait for it to complete
    if (isRefreshing && refreshPromise) {
      console.log('⏳ Refresh already in progress - waiting for completion...');
      try {
        await refreshPromise;
        console.log('✅ Refresh completed - retrying original request');
        // Retry original request with new token
        result = await baseQuery(args, api, extraOptions);
        console.groupEnd();
        return result;
      } catch {
        console.error('❌ Refresh failed while waiting - logging out');
        // Refresh failed, logout
        api.dispatch(logout());
        window.location.href = '/login';
        console.groupEnd();
        return result;
      }
    }
    
    console.log('🔄 Starting new token refresh process...');

    // Start refresh process
    isRefreshing = true;
    // Set shared flag so useIdleTimer knows refresh is in progress
    localStorage.setItem('tokenRefreshInProgress', 'true');
    
    refreshPromise = (async () => {
      try {
        // Create a base query without reauth to prevent infinite loop
        const refreshBaseQuery = fetchBaseQuery({
          baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
          prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            headers.set('Content-Type', 'application/json');
            return headers;
          },
        });

        const refreshResult = await refreshBaseQuery(
          {
            url: `/auth/v3/refresh_token?refresh_token=${encodeURIComponent(refreshToken)}`,
            method: 'POST',
          },
          api,
          extraOptions
        );

        if (refreshResult.data && !refreshResult.error) {
          const { access_token, refresh_token: newRefreshToken } = refreshResult.data as any;

          // Log token refresh success
          console.group('🔄 Token Refresh (API Interceptor)');
          console.log(`⏰ Refresh Time: ${new Date().toLocaleString()}`);
          console.log('✅ Refresh token API call successful');
          
          // Parse and log token expiry info
          try {
            const accessPayload = JSON.parse(atob(access_token.split('.')[1]));
            const accessExpiry = new Date(accessPayload.exp * 1000);
            const remaining = accessPayload.exp * 1000 - Date.now();
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            console.log(`📅 New Access Token Expiry: ${accessExpiry.toLocaleString()}`);
            console.log(`⏳ Remaining Time: ${minutes}m ${seconds}s`);
          } catch {
            console.warn('Could not parse access token expiry');
          }

          // Update both tokens
          api.dispatch(updateTokens({
            accessToken: access_token,
            refreshToken: newRefreshToken || refreshToken
          }));

          console.log('✅ Tokens updated in Redux store');
          console.groupEnd();
          return { success: true };
        } else {
          // Refresh failed - invalid or expired refresh token
          console.error('❌ Refresh token API returned error:', refreshResult.error);
          throw new Error('Refresh token failed');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        throw error;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
        // Clear shared flag
        localStorage.removeItem('tokenRefreshInProgress');
      }
    })();

    try {
      await refreshPromise;
      console.log('✅ Token refresh successful - retrying original request');
      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
      if (result.error) {
        console.warn('⚠️ Original request still failed after refresh:', result.error);
      } else {
        console.log('✅ Original request succeeded after token refresh');
      }
      console.groupEnd();
    } catch (error) {
      // Refresh failed, logout and redirect
      console.error('❌ Token refresh failed, logging out:', error);
      console.groupEnd();
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
    register: builder.mutation<AuthResponse, RegisterCredentials>({
      query: (credentials) => ({
        url: '/auth/v3/register/',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(clearError());
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage = error?.error?.data?.message || 'Registration failed';
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordCredentials>({
      query: (credentials) => ({
        url: '/auth/v3/forgot_password/',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(clearError());
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error: any) {
          const errorMessage = error?.error?.data?.message || 'Failed to send reset email';
          dispatch(setError(errorMessage));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    refreshToken: builder.mutation<{ access_token: string; refresh_token: string }, { refresh_token: string }>({
      query: (credentials) => ({
        url: `/auth/v3/refresh_token?refresh_token=${encodeURIComponent(credentials.refresh_token)}`,
        method: 'POST',
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
  useRegisterMutation,
  useForgotPasswordMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetUserProfileQuery,
} = authApi;