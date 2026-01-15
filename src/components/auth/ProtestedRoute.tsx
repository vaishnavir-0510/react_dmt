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
  const [isStateReady, setIsStateReady] = React.useState(false);

  // Wait for state to be ready after initial load
  useEffect(() => {
    if (!isLoading) {
      // Once loading is complete, state is ready
      // If authenticated, add small delay to ensure state is fully loaded from localStorage
      if (isAuthenticated) {
        const timer = setTimeout(() => {
          setIsStateReady(true);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // If not authenticated, state is ready immediately (no need to wait)
        setIsStateReady(true);
      }
    } else {
      setIsStateReady(false);
    }
  }, [isAuthenticated, isLoading]);

  // Sync Redux state with current route on every location change
  // Only sync if the route actually changed to avoid unnecessary updates
  const prevPathnameRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    // Only sync if pathname actually changed
    if (prevPathnameRef.current === location.pathname) {
      return;
    }
    
    prevPathnameRef.current = location.pathname;
    
    console.log('🔒 ProtectedRoute: Location changed', {
      pathname: location.pathname,
      isAuthenticated,
      currentView,
      selectedProject: selectedProject?.name,
      isStateReady
    });
    
    if (isAuthenticated && isStateReady) {
      // Use setTimeout to ensure any programmatic state updates complete first
      const timer = setTimeout(() => {
        dispatch(syncStateWithRoute({ pathname: location.pathname }));
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [dispatch, location.pathname, isAuthenticated, isStateReady, currentView, selectedProject]);

  // Define which routes are allowed in settings view vs application view
  // Settings routes: account, users, projects, security-policies
  const settingsRoutes = ['/account', '/users', '/projects', '/security-policies'];
  
  // Application routes including all project types
  // Migration routes (dynamic with :objectId and :tabName):
  //   - /migration
  //   - /migration/:objectId
  //   - /migration/:objectId/:tabName (tabs: summary, relationship, filter, metadata, cleanup, transform, mapping, validate, load, error, workflows)
  // All migration routes are handled by isMigrationRoute pattern matching (startsWith('/migration'))
  const applicationRoutes = [
    // Migration routes (base routes - dynamic routes handled by pattern matching)
    '/dashboard',
    '/entities',
    '/management',
    '/migration', // Base migration route - all /migration/:objectId/:tabName routes are handled by pattern matching
    
    // Backup routes
    '/backup/dashboard',
    '/backup/jobs',
    '/backup/restore',
    '/backup/history',
    
    // Translation routes
    '/translation/dashboard',
    '/translation/languages',
    '/translation/memory',
    '/translation/progress',
    '/translation/translations',
    
    // File Migration routes (all tabs)
    '/file-migration/upload',
    '/file-migration/relationship',
    '/file-migration/filter',
    '/file-migration/metadata',
    '/file-migration/cleanup',
    '/file-migration/transform',
    '/file-migration/mapping',
    '/file-migration/validate',
    '/file-migration/load',
    '/file-migration/error',
    '/file-migration/workflows',
    '/file-migration/analysis',
    '/file-migration/storage'
  ];
  
  // Check route patterns
  // Migration routes: /migration, /migration/:objectId, /migration/:objectId/:tabName
  // Tab names: summary, relationship, filter, metadata, cleanup, transform, mapping, validate, load, error, workflows
  const isMigrationRoute = location.pathname.startsWith('/migration');
  const isBackupRoute = location.pathname.startsWith('/backup');
  const isTranslationRoute = location.pathname.startsWith('/translation');
  const isFileMigrationRoute = location.pathname.startsWith('/file-migration');
  
  // Settings routes: account, users, projects, security-policies
  const isSettingsRoute = settingsRoutes.includes(location.pathname);
  
  // Application routes: all non-settings routes
  const isApplicationRoute = applicationRoutes.includes(location.pathname) ||
                            isMigrationRoute ||
                            isBackupRoute ||
                            isTranslationRoute ||
                            isFileMigrationRoute;

  if (isLoading || !isStateReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Allow login and register routes without authentication
  if (location.pathname === '/login' || location.pathname === '/register') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Allow migration routes regardless of current view - they handle their own state
  if (isMigrationRoute) {
    return <>{children}</>;
  }

  // Additional route protection based on current view - only check if state is ready
  if (isStateReady && currentView === 'settings' && !isSettingsRoute && location.pathname !== '/') {
    // If in settings view but trying to access invalid route, redirect to account
    return <Navigate to="/account" replace />;
  }
  
  if (isStateReady && currentView === 'application' && !isApplicationRoute && location.pathname !== '/') {
    // If in application view but trying to access settings route, redirect to appropriate dashboard
    if (selectedProject?.project_type === 'backup') {
      return <Navigate to="/backup/dashboard" replace />;
    } else if (selectedProject?.project_type === 'translation') {
      return <Navigate to="/translation/dashboard" replace />;
    } else if (selectedProject?.project_type === 'file migration' || selectedProject?.project_type === 'filemigration') {
      return <Navigate to="/file-migration/upload" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};