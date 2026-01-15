// components/entities/SourceObjectsTab.tsx
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetSystemsByProjectQuery } from '../../services/systemsApi';
import { useGetObjectsBySystemQuery, useDeleteObjectMutation } from '../../services/objectsApi';
import type { ObjectData } from '../../services/objectsApi';
import { ObjectSlideIn } from './ObjectSlideIn';


export const SourceObjectsTab: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [slideInOpen, setSlideInOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null);
  const [selectedObject, setSelectedObject] = useState<ObjectData | null>(null);
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

  // Filter only source systems
  const sourceSystems = systems.filter(system => system.type === 'source');

  // Fetch objects for selected system - automatically refetches when system changes
  const {
    data: objects = [],
    isLoading: isLoadingObjects,
    error: objectsError,
  } = useGetObjectsBySystemQuery(selectedSystemId, {
    skip: !selectedSystemId,
    refetchOnMountOrArgChange: true,
  });

  const [deleteObject, { isLoading: isDeleting }] = useDeleteObjectMutation();

  // Auto-select first source system when systems load or project changes
  useEffect(() => {
    if (sourceSystems.length > 0) {
      setSelectedSystemId(sourceSystems[0].id);
    } else {
      setSelectedSystemId('');
    }
  }, [sourceSystems, selectedProject]); // Added selectedProject dependency

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

  const handleSlideInClose = () => {
    setSlideInOpen(false);
    setEditingObject(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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
      <Box sx={{ p: 1 }}>
        <Alert severity="warning">
          Please select a project to view source objects.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* System Selection */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Source System</InputLabel>
          <Select
            value={selectedSystemId}
            onChange={handleSystemChange}
            label="Source System"
            disabled={isLoadingSystems}
          >
            {sourceSystems.map((system) => (
              <MenuItem key={system.id} value={system.id}>
                {system.name} ({system.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
      </Box>

      {/* Loading State */}
      {isLoadingObjects && selectedSystemId && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {objectsError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          Failed to load objects. Please try again.
        </Alert>
      )}

      {/* No System Selected */}
      {!selectedSystemId && !isLoadingSystems && sourceSystems.length > 0 && (
        <Alert severity="info">
          Please select a source system to view objects.
        </Alert>
      )}

      {/* No Systems Available */}
      {!isLoadingSystems && sourceSystems.length === 0 && (
        <Alert severity="info">
          No source systems found for the selected project.
        </Alert>
      )}

      {/* No Objects Found */}
      {selectedSystemId && !isLoadingObjects && objects.length === 0 && (
        <Alert severity="info">
          No objects found for the selected source system.
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
        systemType="source"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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