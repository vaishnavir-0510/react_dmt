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
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetSystemsByProjectQuery } from '../../services/systemsApi';
import { useGetObjectsBySystemQuery } from '../../services/objectsApi';
import type { ObjectData } from '../../services/objectsApi';
import { ObjectSlideIn } from './ObjectSlideIn';

export const TargetObjectsTab: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [slideInOpen, setSlideInOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null);

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

  const handleEditObject = (object: ObjectData) => {
    setEditingObject(object);
    setSlideInOpen(true);
  };

  const handleSlideInClose = () => {
    setSlideInOpen(false);
    setEditingObject(null);
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
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          Please select a project to view target objects.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddObject}
          disabled={!selectedSystemId || isLoadingSystems}
        >
          Add Object
        </Button>
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
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {objects.map((object) => (
                <TableRow key={object.object_id} hover>
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
                    <Tooltip title="Edit Object">
                      <IconButton
                        size="small"
                        onClick={() => handleEditObject(object)}
                        color="primary"
                      >
                        <EditIcon />
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
        systemType="target"
      />
    </Box>
  );
};