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
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.clear(); // Clear ALL local storage
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      localStorage.setItem('lastActivity', Date.now().toString());
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
