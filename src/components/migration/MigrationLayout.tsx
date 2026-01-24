// components/migration/MigrationLayout.tsx
import React, { useState, useEffect } from 'react';
import { Box, Toolbar, Container, Paper, Typography, Button, IconButton, CircularProgress, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import { MigrationTabs } from './MigrationTabs';
import { setSelectedObject, setActiveTab } from '../../store/slices/migrationSlice';
import { setActiveMenu } from '../../store/slices/appSlice';
import type { MigrationTab } from '../../types';
import { ActivityProvider } from './ActivityProvider';
import { InsertDriveFile as FileIcon, Visibility as RevealIcon, VisibilityOff as RevealOffIcon } from '@mui/icons-material';
import {
  useGetRevealStatusQuery,
  useCreateRevealMutation,
  useUpdateRevealMutation,
} from '../../services/revealApi';
import { FilesSlideIn } from './FilesSlideIn';

export const MigrationLayout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { objectId, tabName } = useParams<{ objectId: string; tabName: MigrationTab }>();
  const { selectedObject, migrationName, activeTab } = useSelector((state: RootState) => state.migration);
  const { activeMenu } = useSelector((state: RootState) => state.app);

  // Reveal functionality state
  const [revealStates, setRevealStates] = useState<Record<string, boolean>>({});
  const [isRevealLoading, setIsRevealLoading] = useState<boolean>(false);

  // Files slide-in state
  const [filesSlideInOpen, setFilesSlideInOpen] = useState<boolean>(false);

  const isRevealActive = selectedObject?.object_id ? revealStates[selectedObject.object_id] || false : false;

  // Reveal API hooks
  const { data: revealData, error: revealError, refetch: refetchReveal } = useGetRevealStatusQuery(
    selectedObject?.object_id || '',
    { skip: !selectedObject?.object_id }
  );
  const [createReveal] = useCreateRevealMutation();
  const [updateReveal] = useUpdateRevealMutation();

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

  // Reset reveal state when object changes
  useEffect(() => {
    if (selectedObject?.object_id) {
      setRevealStates(prev => ({ ...prev, [selectedObject.object_id]: false }));
      refetchReveal();
    }
  }, [selectedObject?.object_id, refetchReveal]);

  // Update reveal active state based on API data
  useEffect(() => {
    if (selectedObject?.object_id) {
      if (revealError) {
        setRevealStates(prev => ({ ...prev, [selectedObject.object_id]: false }));
      } else if (revealData?.message) {
        setRevealStates(prev => ({ ...prev, [selectedObject.object_id]: revealData.message.reveal_flag }));
      } else {
        setRevealStates(prev => ({ ...prev, [selectedObject.object_id]: false }));
      }
    }
  }, [revealData, revealError, selectedObject?.object_id]);

  // Reveal functionality helper functions
  const handleCreateReveal = async (objectId: string) => {
    try {
      setIsRevealLoading(true);
      await createReveal({
        latest_entry: true,
        object_id: objectId,
        reason: "Policy management",
        reveal_flag: true,
      }).unwrap();
      refetchReveal();
    } catch (error) {
      console.error('Error creating reveal:', error);
    } finally {
      setIsRevealLoading(false);
    }
  };

  const handleUpdateReveal = async (objectId: string) => {
    try {
      setIsRevealLoading(true);
      await updateReveal({
        objectId,
        data: {
          is_active: true,
          latest_entry: false,
          reveal_flag: false,
        },
      }).unwrap();
      setRevealStates(prev => ({ ...prev, [objectId]: false }));
      refetchReveal();
    } catch (error) {
      console.error('Error updating reveal:', error);
    } finally {
      setIsRevealLoading(false);
    }
  };

  const handleRevealToggle = async () => {
    if (!selectedObject?.object_id) return;

    if (isRevealActive) {
      // Turn off reveal
      await handleUpdateReveal(selectedObject.object_id);
    } else {
      // Turn on reveal - always create new since we check status on load
      await handleCreateReveal(selectedObject.object_id);
    }
  };

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
        <Container maxWidth="xl" sx={{ mt: 0, mb: 0 }}>
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
    <Box sx={{ flexGrow: 1, overflowX: 'hidden' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, overflowX: 'hidden', width: '100%' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Migration - {selectedObject.object_name}
        </Typography>
        <IconButton
          color="primary"
          title="View files"
          size="small"
          onClick={() => setFilesSlideInOpen(true)}
        >
          <FileIcon />
        </IconButton>
        <IconButton
          onClick={handleRevealToggle}
          disabled={isRevealLoading}
          color={isRevealActive ? 'error' : 'primary'}
          title={isRevealActive ? 'Turn off reveal mode' : 'Turn on reveal mode'}
          size="small"
        >
          {isRevealLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
              <CircularProgress size={16} />
            </Box>
          ) : isRevealActive ? (
            <RevealIcon />
          ) : (
            <RevealOffIcon />
          )}
        </IconButton>
      </Box>

      {/* Reveal Mode Active Banner */}
      {isRevealActive && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 'bold' }}>
          Reveal Mode Active
        </Alert>
      )}

      {/* Migration Tabs */}
      <ActivityProvider>
        <MigrationTabs objectId={objectId} isRevealActive={isRevealActive} />
      </ActivityProvider>

      {/* Files Slide-in */}
      <FilesSlideIn
        open={filesSlideInOpen}
        onClose={() => setFilesSlideInOpen(false)}
        objectName={selectedObject?.object_name}
        objectId={selectedObject?.object_id}
      />
    </Box>
  );
};