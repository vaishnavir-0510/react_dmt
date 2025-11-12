// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Entities } from './pages/Entities';
import { Management } from './pages/Management';
import { Account } from './pages/Account';
import { Users } from './pages/Users';
import { Projects } from './pages/Projects';
import { MigrationLayout } from './components/migration/MigrationLayout';

import { WorkspaceInitializer } from './components/workspace/WorkspaceInitializer';
import { ProtectedRoute } from './components/auth/ProtestedRoute';

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

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <WorkspaceInitializer />
          <Routes>
            <Route path="/login" element={<Login />} />
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
            {/* Migration Routes - Add these exact routes */}
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;