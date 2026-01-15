// components/entities/TargetObjectsTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Layers as LayersIcon,
  Backup as BackupIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import { useGetSystemsByProjectQuery } from '../../services/systemsApi';
import { useGetObjectsBySystemQuery, useDeleteObjectMutation } from '../../services/objectsApi';
import type { ObjectData } from '../../services/objectsApi';
import {
  useCheckSalesforceConnectionQuery,
  useExtractSalesforceSampleMutation,
  useRefreshSalesforceMetadataMutation,
} from '../../services/loadApi';

import { CompoundFieldsSlideIn } from './CompoundFieldsSlideIn';
import { ConnectToSalesforceSlideIn } from './ConnectToSalesforceSlideIn';
import { useDisconnectFromSalesforceMutation } from '../../services/loadApi';
import { ObjectSlideIn } from './ObjectSlideIn';

export const TargetObjectsTab: React.FC = () => {
  const location = useLocation();
  const { selectedProject } = useSelector((state: RootState) => state.app);

  // Check if we're on a backup page
  const isOnBackupPage = location.pathname.startsWith('/backup');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [slideInOpen, setSlideInOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null);
  const [selectedObject, setSelectedObject] = useState<ObjectData | null>(null);
  const [compoundFieldsSlideInOpen, setCompoundFieldsSlideInOpen] = useState(false);
  const [selectedObjectForCompoundFields, setSelectedObjectForCompoundFields] = useState<ObjectData | null>(null);
  const [connectSlideInOpen, setConnectSlideInOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch systems for the project - automatically refetches when project changes
  const {
    data: systems = [],
    isLoading: isLoadingSystems,
    error: systemsError,
  } = useGetSystemsByProjectQuery(selectedProject?.id || '', {
    skip: !selectedProject?.id,
    refetchOnMountOrArgChange: true,
  });

  // Filter only target systems
  const targetSystems = systems.filter(system => system.type === 'target');

  // Fetch objects for selected system - automatically refetches when system changes
  const {
    data: objects = [],
    isLoading: isLoadingObjects,
    error: objectsError,
  } = useGetObjectsBySystemQuery(selectedSystemId, {
    skip: !selectedSystemId,
    refetchOnMountOrArgChange: true,
  });

  // Check Salesforce connection status
  const {
    data: connectionStatus,
    isLoading: isLoadingConnection,
    error: connectionError,
    refetch: refetchConnection,
  } = useCheckSalesforceConnectionQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Disconnect from Salesforce
  const [disconnectFromSalesforce, { isLoading: isDisconnecting }] = useDisconnectFromSalesforceMutation();

  // Extract sample and refresh metadata
  const [extractSalesforceSample] = useExtractSalesforceSampleMutation();
  const [refreshSalesforceMetadata] = useRefreshSalesforceMetadataMutation();

  const [deleteObject, { isLoading: isDeleting }] = useDeleteObjectMutation();

  // Auto-select first target system when systems load or project changes
  useEffect(() => {
    if (targetSystems.length > 0) {
      setSelectedSystemId(targetSystems[0].id);
    } else {
      setSelectedSystemId('');
    }
  }, [targetSystems, selectedProject]); // Added selectedProject dependency

  // Reset selected system when project changes
  useEffect(() => {
    setSelectedSystemId('');
  }, [selectedProject]);

  const handleSystemChange = (event: any) => {
    setSelectedSystemId(event.target.value);
  };

  const handleAddObject = () => {
    setEditingObject(null);
    setSlideInOpen(true);
  };

  const handleEditObject = () => {
    if (!selectedObject) {
      setSnackbar({
        open: true,
        message: 'Please select a row first which you want to edit',
        severity: 'warning',
      });
      return;
    }
    setEditingObject(selectedObject);
    setSlideInOpen(true);
  };

  const handleRowClick = (object: ObjectData) => {
    setSelectedObject(object);
    setSnackbar({
      open: true,
      message: `Selected object: ${object.name}`,
      severity: 'info',
    });
  };

  const handleDeleteObject = async (object: ObjectData) => {
    try {
      await deleteObject(object.object_id).unwrap();
      setSnackbar({
        open: true,
        message: `Successfully deleted object: ${object.name}`,
        severity: 'success',
      });
      if (selectedObject?.object_id === object.object_id) {
        setSelectedObject(null);
      }
    } catch (error) {
      console.error('Failed to delete object:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete object: ${object.name}`,
        severity: 'error',
      });
    }
  };

  const handleSelectForBackup = (object: ObjectData) => {
    localStorage.setItem('selectedBackupObject', JSON.stringify(object));
    console.log('Selected object for backup:', object);
    // You could show a success message here
  };

  const handleCompoundFieldsObject = (object: ObjectData) => {
    setSelectedObjectForCompoundFields(object);
    setCompoundFieldsSlideInOpen(true);
  };

  const handleSlideInClose = () => {
    setSlideInOpen(false);
    setEditingObject(null);
  };

  const handleCompoundFieldsSlideInClose = () => {
    setCompoundFieldsSlideInOpen(false);
    setSelectedObjectForCompoundFields(null);
  };

  const handleConnectClick = () => {
    setConnectSlideInOpen(true);
  };

  const handleConnectSlideInClose = () => {
    setConnectSlideInOpen(false);
  };

  const handleConnectSuccess = () => {
    refetchConnection();
    setSnackbar({
      open: true,
      message: 'Successfully connected to Salesforce!',
      severity: 'success',
    });
  };

  const handleDisconnectClick = () => {
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectConfirm = async () => {
    try {
      await disconnectFromSalesforce().unwrap();
      setDisconnectDialogOpen(false);
      // Immediately refetch connection status
      refetchConnection();
      setSnackbar({
        open: true,
        message: 'Successfully disconnected from Salesforce!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to disconnect from Salesforce:', error);
      setSnackbar({
        open: true,
        message: 'Failed to disconnect from Salesforce. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleDisconnectCancel = () => {
    setDisconnectDialogOpen(false);
  };

  const handleExtractSample = async (object: ObjectData) => {
    try {
      await extractSalesforceSample({ object_name: object.name }).unwrap();
      setSnackbar({
        open: true,
        message: `Successfully extracted sample data for ${object.name}`,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to extract sample:', error);
      setSnackbar({
        open: true,
        message: `Failed to extract sample data for ${object.name}: ${error?.data?.message || error?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  const handleRefreshMetadata = async (object: ObjectData) => {
    try {
      await refreshSalesforceMetadata({
        object_name: object.name,
        object_id: object.object_id,
        project_id: selectedProject?.id || '',
        system_id: selectedSystemId,
      }).unwrap();
      setSnackbar({
        open: true,
        message: `Successfully refreshed metadata for ${object.name}`,
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to refresh metadata:', error);
      setSnackbar({
        open: true,
        message: `Failed to refresh metadata for ${object.name}: ${error?.data?.message || error?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Determine connection status
  const getConnectionStatus = () => {
    if (connectionError) {
      return { isConnected: false, message: 'Connection check failed', isError: true };
    }

    if (!connectionStatus) {
      return { isConnected: false, message: 'Checking connection...', isError: false };
    }

    // Handle different response formats
    if (connectionStatus.detail === 'Authentication failed.') {
      return { isConnected: false, message: 'User is not connected to salesforce', isError: true };
    }

    if (connectionStatus.detail?.includes('not connected')) {
      return { isConnected: false, message: 'User is not connected to salesforce', isError: true };
    }

    if (connectionStatus.message === 'User is connected to salseforce') {
      return { isConnected: true, message: 'User is connected to salesforce', isError: false };
    }

    // Default fallback
    return { isConnected: false, message: connectionStatus.detail || 'Unknown connection status', isError: true };
  };

  const { isConnected, message: connectionMessage, isError: isConnectionError } = getConnectionStatus();

  const getStatusColor = (isCompleted: boolean) => {
    return isCompleted ? 'success' : 'warning';
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'insert': return 'primary';
      case 'upsert': return 'secondary';
      case 'update': return 'info';
      default: return 'default';
    }
  };

  if (!selectedProject) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          Please select a project to view target objects.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Connection Status Strip */}
      <Box sx={{ mb: 2 }}>
        <Alert
          severity={isConnectionError ? 'error' : isConnected ? 'success' : 'info'}
          sx={{
            '& .MuiAlert-message': {
              fontWeight: 'bold',
            }
          }}
        >
          {isLoadingConnection ? 'Checking Salesforce connection...' : connectionMessage}
        </Alert>
      </Box>

      {/* System Selection */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Target System</InputLabel>
          <Select
            value={selectedSystemId}
            onChange={handleSystemChange}
            label="Target System"
            disabled={isLoadingSystems}
          >
            {targetSystems.map((system) => (
              <MenuItem key={system.id} value={system.id}>
                {system.name} ({system.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isConnected ? (
            <>
              <Button
                variant="outlined"
                onClick={handleDisconnectClick}
                disabled={isLoadingConnection || isDisconnecting}
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddObject}
                  disabled={!selectedSystemId || isLoadingSystems}
                >
                  Add Object
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditObject}
                  disabled={!selectedSystemId || isLoadingSystems || !selectedObject}
                >
                  Edit Object
                </Button>
              </Box>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleConnectClick}
              disabled={isLoadingConnection}
            >
              Connect
            </Button>
          )}
        </Box>
      </Box>

      {/* Loading State */}
      {isLoadingObjects && selectedSystemId && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {objectsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load objects. Please try again.
        </Alert>
      )}

      {/* No System Selected */}
      {!selectedSystemId && !isLoadingSystems && targetSystems.length > 0 && (
        <Alert severity="info">
          Please select a target system to view objects.
        </Alert>
      )}

      {/* No Systems Available */}
      {!isLoadingSystems && targetSystems.length === 0 && (
        <Alert severity="info">
          No target systems found for the selected project.
        </Alert>
      )}

      {/* No Objects Found */}
      {selectedSystemId && !isLoadingObjects && objects.length === 0 && (
        <Alert severity="info">
          No objects found for the selected target system.
        </Alert>
      )}

      {/* Objects Table */}
      {objects.length > 0 && (
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Object Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Records</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fields</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Operation</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Extract Sample</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Refresh Metadata</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {objects.map((object) => (
                <TableRow
                  key={object.object_id}
                  hover
                  onClick={() => handleRowClick(object)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedObject?.object_id === object.object_id ? 'action.selected' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {object.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {object.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={object.records_count || '0'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={object.field_count?.toString() || '0'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={object.operation}
                      size="small"
                      color={getOperationColor(object.operation)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={object.is_completed ? 'Completed' : 'In Progress'}
                      size="small"
                      color={getStatusColor(object.is_completed)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExtractSample(object);
                      }}
                      disabled={!isConnected}
                    >
                      Extract
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshMetadata(object);
                      }}
                      disabled={!isConnected}
                    >
                      Refresh
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Delete Object">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteObject(object);
                          }}
                          color="error"
                          disabled={isDeleting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      {isOnBackupPage && (
                        <>
                          <Tooltip title="Select Compound Fields">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompoundFieldsObject(object);
                              }}
                              color="secondary"
                            >
                              <LayersIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Select for Backup">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectForBackup(object);
                              }}
                              color="success"
                            >
                              <BackupIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Slide-in for Add/Edit Object */}
      <ObjectSlideIn
        open={slideInOpen}
        onClose={handleSlideInClose}
        object={editingObject}
        systemId={selectedSystemId}
        systemType="target"
      />

      {/* Slide-in for Compound Fields Selection */}
      <CompoundFieldsSlideIn
        open={compoundFieldsSlideInOpen}
        onClose={handleCompoundFieldsSlideInClose}
        object={selectedObjectForCompoundFields}
      />

      {/* Slide-in for Salesforce Connection */}
      <ConnectToSalesforceSlideIn
        open={connectSlideInOpen}
        onClose={handleConnectSlideInClose}
        onSuccess={handleConnectSuccess}
      />

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={handleDisconnectCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Disconnect</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect from Salesforce? This will remove your saved credentials.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisconnectCancel} disabled={isDisconnecting}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnectConfirm}
            variant="contained"
            color="error"
            disabled={isDisconnecting}
            startIcon={isDisconnecting ? <CircularProgress size={16} /> : undefined}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};