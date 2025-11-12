// components/migration/MigrationLayout.tsx
import React, { useEffect } from 'react';
import { Box, Toolbar, Container, Paper, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import { MigrationTabs } from './MigrationTabs';
import { setSelectedObject, setActiveTab } from '../../store/slices/migrationSlice';
import type { MigrationTab } from '../../types';

export const MigrationLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { objectId, tabName } = useParams<{ objectId: string; tabName: MigrationTab }>();
  const { selectedObject, migrationName } = useSelector((state: RootState) => state.migration);

  // Validate and set active tab from URL
  useEffect(() => {
    if (tabName && ['summary','relationship', 'filter', 'metadata', 'cleanup', 'transform', 'mapping', 'validate', 'load', 'error', 'workflows'].includes(tabName)) {
      dispatch(setActiveTab(tabName as MigrationTab));
    } else if (objectId) {
      // Redirect to default tab if invalid
      navigate(`/migration/${objectId}/summary`, { replace: true });
    }
  }, [tabName, objectId, dispatch, navigate]);

  // Load object data if not already loaded
  useEffect(() => {
    if (objectId && (!selectedObject || selectedObject.object_id !== objectId)) {
      // Try to load from localStorage
      const storedObjects = localStorage.getItem('migration_objects');
      if (storedObjects) {
        const objects = JSON.parse(storedObjects);
        const object = objects.find((obj: any) => obj.object_id === objectId);
        if (object) {
          dispatch(setSelectedObject(object));
          return;
        }
      }
      
      // If object not found in localStorage, redirect to entities
      console.warn('Object not found, redirecting to entities');
      navigate('/entities');
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
        <MigrationTabs objectId={objectId} />
      </Container>
    </Box>
  );
};