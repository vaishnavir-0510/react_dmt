// components/auth/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { syncStateWithRoute } from '../../store/slices/appSlice';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const { currentView } = useSelector((state: RootState) => state.app);

  // Sync Redux state with current route on component mount and route change
  useEffect(() => {
    dispatch(syncStateWithRoute({ pathname: location.pathname }));
  }, [dispatch, location.pathname]);

  // Define which routes are allowed in settings view vs application view
  const settingsRoutes = ['/account', '/users', '/projects'];
  const applicationRoutes = ['/dashboard', '/entities', '/management', '/migration'];
  
  // Check if current route starts with migration pattern
  const isMigrationRoute = location.pathname.startsWith('/migration');
  const isSettingsRoute = settingsRoutes.includes(location.pathname);
  const isApplicationRoute = applicationRoutes.includes(location.pathname) || isMigrationRoute;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Additional route protection based on current view
  if (currentView === 'settings' && !isSettingsRoute && !isMigrationRoute) {
    // If in settings view but trying to access application route, redirect to account
    return <Navigate to="/account" replace />;
  }
  
  if (currentView === 'application' && !isApplicationRoute && location.pathname !== '/') {
    // If in application view but trying to access settings route, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};