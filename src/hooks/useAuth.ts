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
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logoutAction());
    }
  };

  return {
    ...auth,
    login,
    logout,
  };
};