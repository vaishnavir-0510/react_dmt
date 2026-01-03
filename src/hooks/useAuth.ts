
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useLoginMutation, useLogoutMutation } from '../store/api/authApi';
import { setCredentials, logout as logoutAction, setLoading, setError, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const [loginApi] = useLoginMutation();
  const [logoutApi] = useLogoutMutation();

  const auth = useSelector((state: RootState) => state.auth);

  const login = async (credentials: any) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      const result = await loginApi(credentials).unwrap();
      dispatch(setCredentials(result));

      return result;
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Login failed. Please try again.';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = async () => {
    console.log('🚪 LOGOUT: Starting logout process...');

    try {
      console.log('🚪 LOGOUT: Calling logout API...');
      const result = await logoutApi();
      console.log('🚪 LOGOUT: API call completed, result:', result);
    } catch (error: any) {
      console.error('🚪 LOGOUT: Logout API failed:', {
        error,
        message: error?.message,
        status: error?.status,
        data: error?.data,
        stack: error?.stack
      });
    } finally {
      console.log('🚪 LOGOUT: Dispatching logout action...');
      dispatch(logoutAction());
      console.log('🚪 LOGOUT: Logout process completed');
    }
  };

  return {
    ...auth,
    login,
    logout,
  };
};
