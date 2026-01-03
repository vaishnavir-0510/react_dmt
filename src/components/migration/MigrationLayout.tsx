// components/migration/MigrationLayout.tsx
import React, { useEffect } from 'react';
import { Box, Toolbar, Container, Paper, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import { MigrationTabs } from './MigrationTabs';
import { setSelectedObject, setActiveTab } from '../../store/slices/migrationSlice';
import { setActiveMenu } from '../../store/slices/appSlice';
import type { MigrationTab } from '../../types';
import { ActivityProvider } from './ActivityProvider';

export const MigrationLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { objectId, tabName } = useParams<{ objectId: string; tabName: MigrationTab }>();
  const { selectedObject, migrationName, activeTab } = useSelector((state: RootState) => state.migration);
  const { activeMenu } = useSelector((state: RootState) => state.app);

  // Ensure sidebar menu is set to 'entities' when in migration
  useEffect(() => {
    if (activeMenu !== 'entities') {
      dispatch(setActiveMenu('entities'));
    }
  }, [activeMenu, dispatch]);

  // Validate and set active tab from URL
  useEffect(() => {
    if (tabName && ['summary','relationship', 'filter', 'metadata', 'cleanup', 'transform', 'mapping', 'validate', 'load', 'error', 'workflows'].includes(tabName)) {
      dispatch(setActiveTab(tabName as MigrationTab));
    } else if (objectId && !tabName) {
      // If we have an objectId but no tabName in URL, redirect to activeTab or default to summary
      const targetTab = activeTab && activeTab !== 'summary' ? activeTab : 'summary';
      navigate(`/migration/${objectId}/${targetTab}`, { replace: true });
    }
  }, [tabName, objectId, activeTab, dispatch, navigate]);

  // Load object data if not already loaded
  useEffect(() => {
    if (objectId && (!selectedObject || selectedObject.object_id !== objectId)) {
      // Try to load from localStorage
      const storedObjects = localStorage.getItem('migration_objects');
      if (storedObjects) {
        try {
          const objects = JSON.parse(storedObjects);
          const object = objects.find((obj: any) => obj.object_id === objectId);
          if (object) {
            dispatch(setSelectedObject(object));
            return;
          }
        } catch (error) {
          console.error('Failed to parse migration objects from localStorage:', error);
        }
      }
      
      // If object not found in localStorage, try to fetch from API or redirect
      console.warn('Object not found in localStorage, attempting to load from API...');
      // You can add API call here if needed
      
      // If still not found after a moment, redirect to entities
      const timer = setTimeout(() => {
        console.warn('Object not found, redirecting to entities');
        navigate('/entities');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [objectId, selectedObject, dispatch, navigate]);

  // If no object ID in URL, show selection prompt
  if (!objectId) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              No Object Selected
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Please select an object from the sidebar to start migration configuration.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/entities')}
              size="large"
            >
              Go to Entities
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Show loading state while object is being loaded
  if (!selectedObject || selectedObject.object_id !== objectId) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Loading Object...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Loading migration configuration for object: {objectId}
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Toolbar />
      
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link 
            color="inherit" 
            component="button" 
            onClick={() => navigate('/dashboard')}
            sx={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            Dashboard
          </Link>
          <Link 
            color="inherit" 
            component="button" 
            onClick={() => navigate('/entities')}
            sx={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            Entities
          </Link>
          <Typography color="text.primary">
            {selectedObject.object_name} Migration
          </Typography>
        </Breadcrumbs>

        {/* Header Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {migrationName || `Migration - ${selectedObject.object_name}`}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                System: {selectedObject.system_name} | Records: {selectedObject.records_count} | 
                Fields: {selectedObject.field_count} | Operation: {selectedObject.operation}
              </Typography>
            </Box>
            
            {!migrationName && (
              <Typography variant="body2" color="warning.main">
                Please set a migration name in the Workflows tab
              </Typography>
            )}
          </Box>

          {selectedObject.description && (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {selectedObject.description}
            </Typography>
          )}
        </Paper>

        {/* Migration Tabs */}
        <ActivityProvider>
          <MigrationTabs objectId={objectId} />
        </ActivityProvider>
      </Container>
    </Box>
  );
};