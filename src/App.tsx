// App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { store, type RootState } from './store';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Entities } from './pages/Entities';
import { Management } from './pages/Management';
import { Account } from './pages/Account';
import { Users } from './pages/Users';
import { Projects } from './pages/Projects';
import { SecurityPolicies } from './pages/SecurityPolicies';
import { MigrationLayout } from './components/migration/MigrationLayout';
import { FileMigrationLayout } from './components/layout/FileMigrationLayout';
import { BackupLayout } from './components/layout/BackupLayout';
import { TranslationDashboard } from './pages/translation/TranslationDashboard';
import { Translations } from './pages/translation/Translations';
import { WorkspaceInitializer } from './components/workspace/WorkspaceInitializer';
import { ProtectedRoute } from './components/auth/ProtestedRoute';
import { useIdleTimerHook } from './hooks/useIdleTimer';
import { IdleTimeoutDialog } from './components/auth/IdleTimeoutDialog';
import { setupMultiTabSync } from './utils/multiTabSync';
import { setupActivityListeners } from './utils/session';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b378aff',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
});

// Helper component for default redirect - restores previous route if available
const NavigateToProjectDashboard: React.FC = () => {
  const { selectedProject, lastRoute } = useSelector((state: RootState) => state.app);
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  // Don't navigate anywhere if still loading auth state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If we have a last route and user is authenticated, restore it
  if (lastRoute && lastRoute !== '/') {
    // Validate that the last route is still valid
    // Settings routes: account, users, projects, security-policies
    const settingsRoutes = ['/account', '/users', '/projects', '/security-policies'];
    const isSettingsRoute = settingsRoutes.includes(lastRoute);
    
    // Migration routes: /migration, /migration/:objectId, /migration/:objectId/:tabName
    // Migration tabs: summary, relationship, filter, metadata, cleanup, transform, mapping, validate, load, error, workflows
    const isMigrationRoute = lastRoute.startsWith('/migration');
    const isBackupRoute = lastRoute.startsWith('/backup');
    const isTranslationRoute = lastRoute.startsWith('/translation');
    const isFileMigrationRoute = lastRoute.startsWith('/file-migration');
    const isApplicationRoute = lastRoute === '/dashboard' || 
                              lastRoute === '/entities' || 
                              lastRoute === '/management' ||
                              isMigrationRoute ||
                              isBackupRoute ||
                              isTranslationRoute ||
                              isFileMigrationRoute;

    // Only restore if it's a valid route (settings, application, or migration)
    if (isSettingsRoute || isApplicationRoute || isMigrationRoute) {
      return <Navigate to={lastRoute} replace />;
    }
  }

  // Fallback to default dashboard based on project type (only if authenticated)
  if (selectedProject?.project_type === 'backup') {
    return <Navigate to="/backup/dashboard" replace />;
  } else if (selectedProject?.project_type === 'translation') {
    return <Navigate to="/translation/dashboard" replace />;
  } else if (selectedProject?.project_type === 'file migration' || selectedProject?.project_type === 'filemigration') {
    return <Navigate to="/file-migration/upload" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

const AppContent: React.FC = () => {
  const { showIdleDialog, countdown, handleStayActive, handleLogout } = useIdleTimerHook();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Token refresh is handled by useIdleTimerHook (checks every minute, refreshes 5 mins before expiry)

  // Setup multi-tab synchronization
  useEffect(() => {
    const cleanup = setupMultiTabSync();
    return cleanup;
  }, []);

  // Setup activity listeners for idle detection
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = setupActivityListeners();
      return cleanup;
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <WorkspaceInitializer />
      <IdleTimeoutDialog
        open={showIdleDialog}
        countdown={countdown}
        onStayActive={handleStayActive}
        onLogout={handleLogout}
      />
      <Routes>
       <Route path="/login" element={<Login />} />
       <Route path="/register" element={<Register />} />
       <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Migration Routes (existing) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/entities"
          element={
            <ProtectedRoute>
              <Layout>
                <Entities />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/management"
          element={
            <ProtectedRoute>
              <Layout>
                <Management />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Layout>
                <Account />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/security-policies"
          element={
            <ProtectedRoute>
              <Layout>
                <SecurityPolicies />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Migration Routes */}
        <Route
          path="/migration/:objectId/:tabName"
          element={
            <ProtectedRoute>
              <Layout>
                <MigrationLayout />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/migration/:objectId"
          element={
            <ProtectedRoute>
              <Layout>
                <MigrationLayout />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/migration"
          element={
            <ProtectedRoute>
              <Layout>
                <MigrationLayout />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Backup Routes */}
        <Route
          path="/backup/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <BackupLayout />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backup/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Backup Jobs Page</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backup/restore"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Restore Page</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backup/history"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Backup History Page</div>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Translation Routes */}
        <Route
          path="/translation/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <TranslationDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/translation/languages"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Language Packs Page</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/translation/memory"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Translation Memory Page</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/translation/progress"
          element={
            <ProtectedRoute>
              <Layout>
                <div>Progress Tracking Page</div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/translation/translations"
          element={
            <ProtectedRoute>
              <Layout>
                <Translations />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* File Migration Routes */}
        <Route
          path="/file-migration/upload"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/relationship"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/filter"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/metadata"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/cleanup"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/transform"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/mapping"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/validate"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/load"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/error"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-migration/workflows"
          element={
            <ProtectedRoute>
              <FileMigrationLayout />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<NavigateToProjectDashboard />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
};

export default App;