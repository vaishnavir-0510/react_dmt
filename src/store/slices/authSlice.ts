import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthResponse } from '../../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Check if token exists and is valid on initial load
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Clear expired tokens on startup
const clearExpiredTokens = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // If tokens exist but are expired, clear everything
    if (accessToken || refreshToken) {
      const accessValid = accessToken ? isValidToken(accessToken) : false;
      const refreshValid = refreshToken ? isValidToken(refreshToken) : false;
      
      if (!accessValid && !refreshValid) {
        console.group('🔐 Clearing Expired Tokens on Startup');
        console.log(`⏰ Time: ${new Date().toLocaleString()}`);
        console.log('⚠️ Both access and refresh tokens are expired - clearing all data');
        console.groupEnd();
        
        // Clear all localStorage
        localStorage.clear();
        // Also clear sessionStorage for good measure
        sessionStorage.clear();
        return;
      }
      
      // If only access token is expired but refresh is valid, we can keep it
      // The token refresh logic will handle it
      if (!accessValid && refreshValid) {
        console.log('⚠️ Access token expired but refresh token valid - will refresh on next API call');
      }
    }
  } catch (error) {
    console.error('Error checking token expiry on startup:', error);
    // On error, clear everything to be safe
    localStorage.clear();
    sessionStorage.clear();
  }
};

// Clear expired tokens on module load
clearExpiredTokens();

const initialToken = localStorage.getItem('accessToken');
const initialRefreshToken = localStorage.getItem('refreshToken');

const initialState: AuthState = {
  user: null,
  accessToken: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: isValidToken(initialToken),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      const { access_token, refresh_token, user_id } = action.payload;
      
      console.group('🔐 Setting User Credentials');
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      console.log(`👤 User ID: ${user_id}`);
      
      // Parse and log token expiry info
      try {
        const accessPayload = JSON.parse(atob(access_token.split('.')[1]));
        const accessExpiry = new Date(accessPayload.exp * 1000);
        const remaining = accessPayload.exp * 1000 - Date.now();
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        console.log(`📅 Access Token Expiry: ${accessExpiry.toLocaleString()}`);
        console.log(`⏳ Remaining Time: ${minutes}m ${seconds}s`);
      } catch (e) {
        console.warn('Could not parse access token expiry');
      }
      
      try {
        const refreshPayload = JSON.parse(atob(refresh_token.split('.')[1]));
        const refreshExpiry = new Date(refreshPayload.exp * 1000);
        console.log(`📅 Refresh Token Expiry: ${refreshExpiry.toLocaleString()}`);
      } catch (e) {
        console.warn('Could not parse refresh token expiry');
      }
      
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.isAuthenticated = true;
      state.error = null;
      state.user = {
        user_id,
        user: '', // Will be populated from user profile
        tenant_id: '',
        role_id: '',
      };
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('lastActivity', Date.now().toString());
      
      console.log('✅ Credentials saved to Redux and localStorage');
      console.groupEnd();
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      
      // Explicitly clear all storage to ensure complete cleanup
      try {
        console.group('🧹 Clearing All Storage on Logout');
        console.log(`⏰ Time: ${new Date().toLocaleString()}`);
        
        // Clear all known keys first
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('app_state');
        localStorage.removeItem('migration_state');
        localStorage.removeItem('sidebar_session');
        localStorage.removeItem('local_workspace_project');
        localStorage.removeItem('tokenRefreshInProgress');
        
        // Clear any remaining keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Final clear to ensure everything is gone
        localStorage.clear();
        
        // Also clear sessionStorage completely
        sessionStorage.clear();
        
        console.log('✅ All localStorage and sessionStorage cleared');
        console.groupEnd();
      } catch (error) {
        console.error('❌ Error clearing storage on logout:', error);
        // Fallback to clear all
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (clearError) {
          console.error('❌ Error during fallback clear:', clearError);
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      console.group('🔄 Updating Tokens');
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      
      // Parse and log token expiry info
      try {
        const accessPayload = JSON.parse(atob(action.payload.accessToken.split('.')[1]));
        const accessExpiry = new Date(accessPayload.exp * 1000);
        const remaining = accessPayload.exp * 1000 - Date.now();
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        console.log(`📅 New Access Token Expiry: ${accessExpiry.toLocaleString()}`);
        console.log(`⏳ Remaining Time: ${minutes}m ${seconds}s`);
      } catch (e) {
        console.warn('Could not parse access token expiry');
      }
      
      try {
        const refreshPayload = JSON.parse(atob(action.payload.refreshToken.split('.')[1]));
        const refreshExpiry = new Date(refreshPayload.exp * 1000);
        console.log(`📅 New Refresh Token Expiry: ${refreshExpiry.toLocaleString()}`);
      } catch (e) {
        console.warn('Could not parse refresh token expiry');
      }
      
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('lastActivity', Date.now().toString());
      
      console.log('✅ Tokens updated in Redux and localStorage');
      console.groupEnd();
    },
    setUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  setCredentials, 
  logout, 
  setLoading, 
  updateTokens,
  setUser,
  setError,
  clearError
} = authSlice.actions;
export default authSlice.reducer;

// import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
// import type { User, AuthResponse } from '../../types';

// interface AuthState {
//   user: User | null;
//   accessToken: string | null;
//   refreshToken: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;
//   tokenExpiry: number | null;
//   lastActivity: number | null;
// }

// // Check if token exists and is valid on initial load
// const isValidToken = (token: string | null): boolean => {
//   if (!token) return false;
  
//   try {
//     const payload = JSON.parse(atob(token.split('.')[1]));
//     return payload.exp * 1000 > Date.now();
//   } catch {
//     return false;
//   }
// };

// // Load initial state from localStorage
// const loadInitialState = (): AuthState => {
//   try {
//     const accessToken = localStorage.getItem('accessToken');
//     const refreshToken = localStorage.getItem('refreshToken');
//     const user = localStorage.getItem('user');
//     const tokenExpiry = localStorage.getItem('tokenExpiry');
//     const lastActivity = localStorage.getItem('lastActivity');

//     return {
//       user: user ? JSON.parse(user) : null,
//       accessToken,
//       refreshToken,
//       isAuthenticated: isValidToken(accessToken),
//       isLoading: false,
//       error: null,
//       tokenExpiry: tokenExpiry ? parseInt(tokenExpiry) : null,
//       lastActivity: lastActivity ? parseInt(lastActivity) : Date.now(),
//     };
//   } catch (error) {
//     console.error('Failed to load auth state:', error);
//     return {
//       user: null,
//       accessToken: null,
//       refreshToken: null,
//       isAuthenticated: false,
//       isLoading: false,
//       error: null,
//       tokenExpiry: null,
//       lastActivity: null,
//     };
//   }
// };

// const initialState: AuthState = loadInitialState();

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: { updateAccessToken: (state, action: PayloadAction<string>) => {
//     state.accessToken = action.payload;
//     localStorage.setItem('accessToken', action.payload);
//     state.lastActivity = Date.now();
//   },
//     setCredentials: (state, action: PayloadAction<AuthResponse>) => {
//       const { 
//         access_token, 
//         refresh_token, 
//         user_id, 
//         user ='',
//         tenant_id ='', 
//         role_id =''
//       } = action.payload;
      
//       const tokenExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes expiry
      
//       state.accessToken = access_token;
//       state.refreshToken = refresh_token;
//       state.isAuthenticated = true;
//       state.error = null;
//       state.tokenExpiry = tokenExpiry;
//       state.lastActivity = Date.now();
//       state.user = {
//         user_id,
//         user: user || '',
//         tenant_id: tenant_id || '',
//         role_id: role_id || '',
//       };
      
//       // Save to localStorage
//       localStorage.setItem('accessToken', access_token);
//       localStorage.setItem('refreshToken', refresh_token);
//       localStorage.setItem('tokenExpiry', tokenExpiry.toString());
//       localStorage.setItem('lastActivity', Date.now().toString());
//       localStorage.setItem('user', JSON.stringify(state.user));
//     },
//     logout: (state) => {
//       state.user = null;
//       state.accessToken = null;
//       state.refreshToken = null;
//       state.isAuthenticated = false;
//       state.error = null;
//       state.tokenExpiry = null;
//       state.lastActivity = null;
      
//       // Clear localStorage
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('tokenExpiry');
//       localStorage.removeItem('lastActivity');
//       localStorage.removeItem('user');
//     },
//     updateTokens: (state, action: PayloadAction<{
//       access_token: string;
//       refresh_token: string;
//     }>) => {
//       const { access_token, refresh_token } = action.payload;
//       const tokenExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes expiry
      
//       state.accessToken = access_token;
//       state.refreshToken = refresh_token;
//       state.tokenExpiry = tokenExpiry;
//       state.lastActivity = Date.now();
      
//       // Update localStorage
//       localStorage.setItem('accessToken', access_token);
//       localStorage.setItem('refreshToken', refresh_token);
//       localStorage.setItem('tokenExpiry', tokenExpiry.toString());
//       localStorage.setItem('lastActivity', Date.now().toString());
//     },
//     updateLastActivity: (state) => {
//       state.lastActivity = Date.now();
//       localStorage.setItem('lastActivity', state.lastActivity.toString());
//     },
//     setLoading: (state, action: PayloadAction<boolean>) => {
//       state.isLoading = action.payload;
//     },
//     setUser: (state, action: PayloadAction<Partial<User>>) => {
//       if (state.user) {
//         state.user = { ...state.user, ...action.payload };
//         localStorage.setItem('user', JSON.stringify(state.user));
//       }
//     },
//     setError: (state, action: PayloadAction<string>) => {
//       state.error = action.payload;
//     },
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
// });

// export const { 
//   setCredentials, 
//   logout, 
//   setLoading, 
// updateAccessToken,
//   updateTokens,
//   updateLastActivity,
//   setUser,
//   setError,
//   clearError
// } = authSlice.actions;

// export default authSlice.reducer;
// src/store/slices/authSlice.ts
