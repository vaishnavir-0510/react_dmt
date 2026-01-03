// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store, type RootState } from './store';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Entities } from './pages/Entities';
import { Management } from './pages/Management';
import { Account } from './pages/Account';
import { Users } from './pages/Users';
import { Projects } from './pages/Projects';
import { MigrationLayout } from './components/migration/MigrationLayout';
import { FileMigrationLayout } from './components/layout/FileMigrationLayout';
import { BackupLayout } from './components/layout/BackupLayout';
import { TranslationDashboard } from './pages/translation/TranslationDashboard';
import { Translations } from './pages/translation/Translations';
import { WorkspaceInitializer } from './components/workspace/WorkspaceInitializer';
import { ProtectedRoute } from './components/auth/ProtestedRoute';
import { BackupDashboard } from './pages/backup/BackupDashboard';
import { useIdleTimerHook } from './hooks/useIdleTimer';
import { IdleTimeoutDialog } from './components/auth/IdleTimeoutDialog';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b378aff',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Helper component for default redirect
const NavigateToProjectDashboard: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);

  if (selectedProject?.project_type === 'backup') {
    return <Navigate to="/backup/dashboard" replace />;
  } else if (selectedProject?.project_type === 'translation') {
    return <Navigate to="/translation/dashboard" replace />;
  } else if (selectedProject?.project_type === 'file migration') {
    return <Navigate to="/file-migration/upload" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

const AppContent: React.FC = () => {
  const { showIdleDialog, countdown, handleStayActive, handleLogout } = useIdleTimerHook();

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