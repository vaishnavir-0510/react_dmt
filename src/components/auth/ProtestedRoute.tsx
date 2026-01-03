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
  const { currentView, selectedProject } = useSelector((state: RootState) => state.app);

  // Sync Redux state with current route on every location change
  useEffect(() => {
    console.log('🔒 ProtectedRoute: Location changed', {
      pathname: location.pathname,
      isAuthenticated,
      currentView,
      selectedProject: selectedProject?.name
    });
    if (isAuthenticated) {
      dispatch(syncStateWithRoute({ pathname: location.pathname }));
    }
  }, [dispatch, location.pathname, isAuthenticated]);

  // Define which routes are allowed in settings view vs application view
  const settingsRoutes = ['/account', '/users', '/projects'];
  
  // Application routes including all project types
  const applicationRoutes = [
    '/dashboard',
    '/entities',
    '/management',
    '/migration',
    '/backup/dashboard',
    '/backup/jobs',
    '/backup/restore',
    '/backup/history',
    '/translation/dashboard',
    '/translation/languages',
    '/translation/memory',
    '/translation/progress',
    '/translation/translations',
    '/file-migration/upload',
    '/file-migration/analysis',
    '/file-migration/transform',
    '/file-migration/storage'
  ];
  
  // Check route patterns
  const isMigrationRoute = location.pathname.startsWith('/migration');
  const isBackupRoute = location.pathname.startsWith('/backup');
  const isTranslationRoute = location.pathname.startsWith('/translation');
  const isFileMigrationRoute = location.pathname.startsWith('/file-migration');
  const isSettingsRoute = settingsRoutes.includes(location.pathname);
  const isApplicationRoute = applicationRoutes.includes(location.pathname) ||
                            isMigrationRoute ||
                            isBackupRoute ||
                            isTranslationRoute ||
                            isFileMigrationRoute;

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

  // Allow migration routes regardless of current view - they handle their own state
  if (isMigrationRoute) {
    return <>{children}</>;
  }

  // Additional route protection based on current view
  if (currentView === 'settings' && !isSettingsRoute && location.pathname !== '/') {
    // If in settings view but trying to access invalid route, redirect to account
    return <Navigate to="/account" replace />;
  }
  
  if (currentView === 'application' && !isApplicationRoute && location.pathname !== '/') {
    // If in application view but trying to access settings route, redirect to appropriate dashboard
    if (selectedProject?.project_type === 'backup') {
      return <Navigate to="/backup/dashboard" replace />;
    } else if (selectedProject?.project_type === 'translation') {
      return <Navigate to="/translation/dashboard" replace />;
    } else if (selectedProject?.project_type === 'file migration') {
      return <Navigate to="/file-migration/upload" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};