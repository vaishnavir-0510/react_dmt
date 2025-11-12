// components/migration/tabs/MappingTab.tsx
import React, { useState, useEffect } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  TextField,
  Snackbar,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetMappingDataQuery } from '../../../services/mappingApi';
import { useGetMappedTargetObjectQuery, useGetObjectMetadataQuery } from '../../../services/metadataApi';
import { useGetObjectsBySystemQuery } from '../../../services/objectsApi';
import { useGetSystemsByProjectQuery } from '../../../services/systemsApi';
import {
  Download as DownloadIcon,
  AutoFixHigh as AutoFixIcon,
  Refresh as RefreshIcon,
  SwapHoriz as SwapIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  List as PicklistIcon,
  Key as KeyIcon,
  Star as RequiredIcon,
  TextFields as TextIcon,
  Public as TimezoneIcon,
  Warning as WarningIcon,
  DragIndicator as DragIcon,
  TableChart as TableIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface MappingPair {
  id: string;
  sourceField: string;
  targetField: string;
  sourceType: string;
  targetType: string;
  sampleValue: string;
  isMapped: boolean;
  sourceIsRequired: boolean;
  targetIsRequired: boolean;
  sourceIsPicklist: boolean;
  targetIsPicklist: boolean;
  sourceIsPk: boolean;
  targetIsPk: boolean;
  sourceIsFk: boolean;
  targetIsFk: boolean;
  sourceDatatype: string;
  targetDatatype: string;
  sourceIsDate: boolean;
  targetIsDate: boolean;
  sourceIsDatetime: boolean;
  targetIsDatetime: boolean;
  sourceTimezone: string;
  targetTimezone: string;
  sourceIsInteger: boolean;
  targetIsInteger: boolean;
  sourceIsFloat: boolean;
  targetIsFloat: boolean;
  sourceIsText: boolean;
  targetIsText: boolean;
  source_column?: string;
  target_column?: string;
}

interface EditState {
  id: string | null;
  targetField: string;
  targetType: string;
  sourceColumnId: string;
  targetColumnId: string;
}

interface MappingJob {
  task_id: string;
  status: 'QUEUED' | 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ERROR' | 'COMPLETED';
  details: string | null;
  last_updated: string;
}

interface TargetColumn {
  target_column: string;
  name: string;
  is_required: string;
  is_text: string;
  is_pk: string;
  is_fk: string;
  is_date: string;
  is_datetime: string;
  is_integer: string;
  is_picklist: string;
  is_float: string;
  datatype: string;
}

export const MappingTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const [targetSystemId, setTargetSystemId] = useState<string>('');
  const [selectedTargetObjectId, setSelectedTargetObjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mappings, setMappings] = useState<MappingPair[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [availableTargetFields, setAvailableTargetFields] = useState<string[]>([]);
  const [targetColumns, setTargetColumns] = useState<TargetColumn[]>([]);
  const [isLoadingTargetColumns, setIsLoadingTargetColumns] = useState<boolean>(false);
  const [isMappingInProgress, setIsMappingInProgress] = useState<boolean>(false);
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [pollingStartTime, setPollingStartTime] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Get all systems for the project to populate target system dropdown
  const { data: projectSystems = [] } = useGetSystemsByProjectQuery(
    selectedProject?.id || '',
    { skip: !selectedProject?.id }
  );

  // Filter target systems (non-source systems)
  const targetSystems = projectSystems.filter(system => system.type !== 'source');

  // Get mapping data for the selected source object
  const {
    data: mappingData = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = useGetMappingDataQuery(
    { sourceObjectId: selectedObject?.object_id || '' },
    { skip: !selectedObject?.object_id }
  );

  // Get mapped target object for the source object from entity mapping API
  const {
    data: mappedTargetObject,
    isLoading: isLoadingTargetObject,
  } = useGetMappedTargetObjectQuery(
    { 
      sourceObjectId: selectedObject?.object_id || '', 
      projectId: selectedProject?.id || '', 
      environmentId: selectedEnvironment?.id || '' 
    },
    { 
      skip: !selectedObject?.object_id || !selectedProject?.id || !selectedEnvironment?.id 
    }
  );

  // Get target objects for the selected target system
  const { data: targetObjects = [] } = useGetObjectsBySystemQuery(
    mappedTargetObject?.system || targetSystemId,
    { skip: !mappedTargetObject?.system && !targetSystemId }
  );

  // Get target object metadata for available fields
  const { data: targetObjectMetadata } = useGetObjectMetadataQuery(
    selectedTargetObjectId || mappedTargetObject?.id || '',
    { skip: !selectedTargetObjectId && !mappedTargetObject?.id }
  );

  // Set target system ID when mapped target object is loaded
  React.useEffect(() => {
    if (mappedTargetObject?.system) {
      setTargetSystemId(mappedTargetObject.system);
    } else if (targetSystems.length > 0) {
      // If no mapped target object, use the first target system
      setTargetSystemId(targetSystems[0].id);
    }
  }, [mappedTargetObject, targetSystems]);

  // Set selected target object when mapped target object or target objects are loaded
  React.useEffect(() => {
    if (mappedTargetObject?.id) {
      // If entity mapping exists, set the mapped target object as selected
      setSelectedTargetObjectId(mappedTargetObject.id);
    } else if (targetObjects.length > 0 && !selectedTargetObjectId) {
      // If no entity mapping but target objects exist, don't auto-select anything
      setSelectedTargetObjectId('');
    }
  }, [mappedTargetObject, targetObjects, selectedTargetObjectId]);

  // Transform API data to match the UI structure
  React.useEffect(() => {
    if (mappingData.length > 0) {
      const transformedData: MappingPair[] = mappingData.map(field => ({
        id: field.id,
        sourceField: field.source_label,
        targetField: field.target_name,
        sourceType: field.source_datatype,
        targetType: field.target_datatype,
        sampleValue: field.sample_value,
        isMapped: true,
        sourceIsRequired: field.source_is_required === 'true',
        targetIsRequired: field.target_is_required === 'true',
        sourceIsPicklist: field.source_is_picklist === 'true',
        targetIsPicklist: field.target_is_picklist === 'true',
        sourceIsPk: field.source_is_pk === 'true',
        targetIsPk: field.target_is_pk === 'true',
        sourceIsFk: field.source_is_fk === 'true',
        targetIsFk: field.target_is_fk === 'true',
        sourceDatatype: field.source_datatype,
        targetDatatype: field.target_datatype,
        sourceIsDate: field.source_is_date === 'true',
        targetIsDate: field.target_is_date === 'true',
        sourceIsDatetime: field.source_is_datetime === 'true',
        targetIsDatetime: field.target_is_datetime === 'true',
        sourceTimezone: field.source_timezone || '',
        targetTimezone: field.target_timezone || '',
        sourceIsInteger: field.source_is_integer === 'true',
        targetIsInteger: field.target_is_integer === 'true',
        sourceIsFloat: field.source_is_float === 'true',
        targetIsFloat: field.target_is_float === 'true',
        sourceIsText: field.source_is_text === 'true',
        targetIsText: field.target_is_text === 'true',
        source_column: field.source_column_id,
        target_column: field.target_column_id,
      }));
      setMappings(transformedData);
    }
  }, [mappingData]);

  // Update available target fields when target object metadata is loaded
  React.useEffect(() => {
    if (targetObjectMetadata && targetObjectMetadata.length > 0) {
      const fieldNames = targetObjectMetadata
        .map(field => field.name || field.label)
        .filter(Boolean)
        .sort();
      setAvailableTargetFields(fieldNames);
    }
  }, [targetObjectMetadata]);

  // Fetch target columns for edit mode
  const fetchTargetColumns = async (sourceObjectId: string, targetObjectId: string, sourceColumnId: string) => {
    console.log('Fetching target columns with:', {
      sourceObjectId,
      targetObjectId,
      sourceColumnId
    });

    if (!sourceObjectId || !targetObjectId || !sourceColumnId) {
      console.error('Missing required parameters:', {
        sourceObjectId,
        targetObjectId,
        sourceColumnId
      });
      setSnackbar({
        open: true,
        message: 'Missing required IDs for fetching target columns',
        severity: 'error'
      });
      return [];
    }

    setIsLoadingTargetColumns(true);
    try {
      const url = `https://api-dev.datamatter.tech/migration/v1/target/field/list/?source_object_id=${sourceObjectId}&target_object_id=${targetObjectId}&source_column=${sourceColumnId}`;
      
      console.log('Making GET request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data: TargetColumn[] = await response.json();
        console.log('Received target columns:', data);
        
        // Remove duplicates and null/empty values
        const uniqueColumns = data.filter((column, index, self) => 
          column.name && 
          column.name.trim() !== '' && 
          self.findIndex(c => c.name === column.name) === index
        );
        
        console.log('Filtered unique columns:', uniqueColumns);
        setTargetColumns(uniqueColumns);
        return uniqueColumns;
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch target columns:', response.status, errorText);
        throw new Error(`Failed to fetch target columns: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching target columns:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch target columns',
        severity: 'error'
      });
      return [];
    } finally {
      setIsLoadingTargetColumns(false);
    }
  };

  // Polling for job status
  useEffect(() => {
    let intervalId: number;

    const checkJobStatus = async () => {
      // Check if polling has been running for more than 1 minute (60000 ms)
      const currentTime = Date.now();
      if (currentTime - pollingStartTime > 60000) {
        setIsMappingInProgress(false);
        setCurrentTaskId('');
        setSnackbar({
          open: true,
          message: 'AI mapping timed out after 1 minute. Please try again.',
          severity: 'error'
        });
        return;
      }

      try {
        const response = await fetch(
          `https://api-dev.datamatter.tech/mapper/agent/v2/mappings/jobs/${currentTaskId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const job: MappingJob = await response.json();
          
          if (job.status === 'SUCCESS' || job.status === 'COMPLETED') {
            setIsMappingInProgress(false);
            setCurrentTaskId('');
            setSnackbar({
              open: true,
              message: 'AI mapping completed successfully!',
              severity: 'success'
            });
            // Refresh mapping data
            refetch();
          } else if (job.status === 'FAILED' || job.status === 'ERROR') {
            setIsMappingInProgress(false);
            setCurrentTaskId('');
            setSnackbar({
              open: true,
              message: `AI mapping failed: ${job.details || 'Unknown error'}`,
              severity: 'error'
            });
          }
          // Continue polling for QUEUED, PENDING, IN_PROGRESS statuses
        } else {
          throw new Error('Failed to fetch job status');
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        setIsMappingInProgress(false);
        setCurrentTaskId('');
        setSnackbar({
          open: true,
          message: 'Error checking mapping status',
          severity: 'error'
        });
      }
    };

    if (isMappingInProgress && currentTaskId) {
      intervalId = window.setInterval(checkJobStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isMappingInProgress, currentTaskId, pollingStartTime, refetch]);

  const handleMapWithAI = async () => {
    if (!selectedObject?.object_id || !selectedTargetObjectId) {
      setSnackbar({
        open: true,
        message: 'Please select both source and target objects',
        severity: 'error'
      });
      return;
    }

    setIsMappingInProgress(true);
    setPollingStartTime(Date.now()); // Set the start time for timeout tracking
    
    try {
      const payload = {
        source_object_id: selectedObject.object_id,
        target_object_id: selectedTargetObjectId
      };

      const response = await fetch('https://api-dev.datamatter.tech/mapper/agent/v2/mappings/queue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentTaskId(result.task_id);
        setSnackbar({
          open: true,
          message: 'AI mapping started successfully!',
          severity: 'info'
        });
      } else {
        throw new Error('Failed to start AI mapping');
      }
    } catch (error) {
      console.error('Error starting AI mapping:', error);
      setIsMappingInProgress(false);
      setCurrentTaskId('');
      setSnackbar({
        open: true,
        message: 'Failed to start AI mapping',
        severity: 'error'
      });
    }
  };

  const handleDownloadMappings = async () => {
    if (!selectedObject?.object_id) {
      setSnackbar({
        open: true,
        message: 'No source object selected for download',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api-dev.datamatter.tech/migration/v1/field/mapping/export/?source_object_id=${selectedObject.object_id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Get the blob from response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from content-disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'field_mapping.csv';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSnackbar({
          open: true,
          message: 'Field mappings downloaded successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to download mappings');
      }
    } catch (error) {
      console.error('Error downloading mappings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download field mappings',
        severity: 'error'
      });
    }
  };

  const handleDownloadJsonMappings = () => {
    const dataStr = JSON.stringify(mappingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mappings-${selectedObject?.object_name || 'object'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSnackbar({
      open: true,
      message: 'JSON mappings downloaded successfully!',
      severity: 'success'
    });
  };

  const handleToggleMapping = (id: string) => {
    setMappings(prev => prev.map(mapping => 
      mapping.id === id 
        ? { ...mapping, isMapped: !mapping.isMapped }
        : mapping
    ));
  };

  const handleEdit = async (mapping: MappingPair) => {
    console.log('Edit clicked for mapping:', mapping);
    console.log('Selected Object:', selectedObject);
    console.log('Selected Target Object ID:', selectedTargetObjectId);
    console.log('Mapping source_column:', mapping.source_column);

    if (!selectedObject?.object_id || !selectedTargetObjectId || !mapping.source_column) {
      console.error('Missing required information:', {
        sourceObjectId: selectedObject?.object_id,
        targetObjectId: selectedTargetObjectId,
        sourceColumnId: mapping.source_column
      });
      setSnackbar({
        open: true,
        message: 'Missing required information for editing mapping',
        severity: 'error'
      });
      return;
    }

    // Fetch target columns for this specific mapping
    const columns = await fetchTargetColumns(
      selectedObject.object_id,
      selectedTargetObjectId,
      mapping.source_column
    );

    if (columns.length > 0) {
      setEditState({
        id: mapping.id,
        targetField: mapping.targetField,
        targetType: mapping.targetType,
        sourceColumnId: mapping.source_column,
        targetColumnId: mapping.target_column || ''
      });
    } else {
      setSnackbar({
        open: true,
        message: 'No target columns available for this mapping',
        severity: 'warning'
      });
    }
  };

  const handleSaveEdit = () => {
    if (editState) {
      setMappings(prev => prev.map(mapping =>
        mapping.id === editState.id
          ? { 
              ...mapping, 
              targetField: editState.targetField,
              targetType: editState.targetType,
              target_column: editState.targetColumnId
            }
          : mapping
      ));
      setEditState(null);
      setTargetColumns([]);
      setSnackbar({
        open: true,
        message: 'Mapping updated successfully!',
        severity: 'success'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditState(null);
    setTargetColumns([]);
  };

  const handleTargetFieldChange = (event: SelectChangeEvent<string>) => {
    if (editState) {
      const selectedColumn = targetColumns.find(col => col.name === event.target.value);
      setEditState(prev => prev ? { 
        ...prev, 
        targetField: event.target.value,
        targetType: selectedColumn?.datatype || '',
        targetColumnId: selectedColumn?.target_column || ''
      } : null);
    }
  };

  const handleTargetObjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedTargetObjectId(event.target.value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Check if there's a type mismatch warning
  const hasTypeMismatch = (mapping: MappingPair) => {
    if (mapping.sourceIsPicklist !== mapping.targetIsPicklist) return true;
    if (mapping.sourceIsDate !== mapping.targetIsDate) return true;
    if (mapping.sourceIsDatetime !== mapping.targetIsDatetime) return true;
    return false;
  };

  const filteredMappings = mappings.filter(mapping =>
    mapping.sourceField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.targetField.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current target system name for display
  const currentTargetSystem = targetSystems.find(system => system.id === targetSystemId);
  
  // Get selected target object name for display
  const selectedTargetObject = targetObjects.find(obj => obj.object_id === selectedTargetObjectId) || mappedTargetObject;

  if (!selectedObject) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Field Mapping
        </Typography>
        <Alert severity="info">
          Please select an object to view field mappings.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Field Mapping - {selectedObject.object_name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Align source fields with the target fields based on entity mappings
          </Typography>
          {mappedTargetObject && (
            <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
              Entity Mapped to: {mappedTargetObject.name} ({currentTargetSystem?.name || 'Target System'})
            </Typography>
          )}
          {selectedTargetObject && selectedTargetObjectId && (
            <Typography variant="body2" color="info.main" sx={{ mt: 0.5 }}>
              Currently Selected: {selectedTargetObject.name}
            </Typography>
          )}
          {!mappedTargetObject && currentTargetSystem && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Target System: {currentTargetSystem.name}
            </Typography>
          )}
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching || isMappingInProgress}
        >
          Refresh
        </Button>
      </Box>

      {/* Controls Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Object</InputLabel>
                <Select
                  value={selectedTargetObjectId}
                  label="Target Object"
                  onChange={handleTargetObjectChange}
                  displayEmpty
                  disabled={isMappingInProgress}
                >
                  <MenuItem value="">
                    <em>Select target object</em>
                  </MenuItem>
                  {targetObjects.length > 0 ? (
                    targetObjects.map(object => (
                      <MenuItem 
                        key={object.object_id} 
                        value={object.object_id}
                      >
                        {object.name}
                        {object.object_id === mappedTargetObject?.id && (
                          <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                            (Entity Mapped)
                          </Typography>
                        )}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No target objects available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {mappedTargetObject && !selectedTargetObjectId && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                  Entity mapping exists but not selected
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search source or target fields..."
                disabled={isMappingInProgress}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Tooltip title={isMappingInProgress ? "Mapping in progress..." : "Map with AI"}>
                <span>
                  <IconButton 
                    onClick={handleMapWithAI}
                    disabled={!selectedTargetObjectId || isMappingInProgress}
                    color="primary"
                    size="large"
                  >
                    {isMappingInProgress ? (
                      <CircularProgress size={24} />
                    ) : (
                      <AutoFixIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={1}>
              <Tooltip title="Download CSV">
                <span>
                  <IconButton 
                    onClick={handleDownloadMappings}
                    disabled={mappingData.length === 0 || isMappingInProgress}
                    color="primary"
                  >
                    <DownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={1}>
              <Tooltip title="Download JSON">
                <span>
                  <IconButton 
                    onClick={handleDownloadJsonMappings}
                    disabled={mappingData.length === 0 || isMappingInProgress}
                    color="primary"
                  >
                    <DownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
          {isMappingInProgress && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                AI mapping in progress... 
                {currentTaskId && ` (Task: ${currentTaskId.slice(0, 8)}...)`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {isLoading || isFetching ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load mapping data. Please try again.
        </Alert>
      ) : mappingData.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Field Mappings Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            No field mappings have been configured for this object yet.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={isMappingInProgress ? <CircularProgress size={16} /> : <AutoFixIcon />}
            onClick={handleMapWithAI}
            disabled={!selectedTargetObjectId || isMappingInProgress}
          >
            {isMappingInProgress ? 'Mapping in Progress...' : 'Generate Mappings with AI'}
          </Button>
        </Paper>
      ) : (
        <Box>
          {/* Table Header */}
          <Paper elevation={1} sx={{ mb: 1 }}>
            <Grid container sx={{ p: 2, backgroundColor: 'grey.100' }}>
              <Grid item xs={2}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                  Sample Data
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" textAlign="center">
                  Source
                </Typography>
              </Grid>
              <Grid item xs={1}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" textAlign="center">
                  
                </Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" textAlign="center">
                  Target
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Mapping Rows */}
          <Box>
            {filteredMappings.map((mapping, index) => {
              const isEditing = editState?.id === mapping.id;
              const hasMismatch = hasTypeMismatch(mapping);
              
              return (
                <Paper 
                  key={mapping.id} 
                  elevation={0}
                  sx={{ 
                    mb: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: hasMismatch ? '#fff3e0' : (index % 2 === 0 ? 'white' : 'grey.50'),
                    '&:hover': {
                      boxShadow: 1
                    }
                  }}
                >
                  <Grid container sx={{ p: 1.5, alignItems: 'center' }}>
                    {/* Sample Data Column */}
                    <Grid item xs={2}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <DragIcon sx={{ color: 'grey.400', fontSize: 20 }} />
                        <Tooltip title={mapping.sampleValue || 'No sample data'} arrow>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px'
                            }}
                          >
                            {mapping.sampleValue || '-'}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </Grid>

                    {/* Source Field */}
                    <Grid item xs={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1,
                        width: '100%',
                        gap: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                          {/* Warning Icon for Mismatch */}
                          {hasMismatch && (
                            <Tooltip title="Type mismatch detected">
                              <span>
                                <WarningIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                              </span>
                            </Tooltip>
                          )}
                          
                          {/* Field Name */}
                          <Typography variant="body1" fontWeight="medium">
                            {mapping.sourceField}
                          </Typography>
                        </Box>
                        
                        {/* All Source Field Icons */}
                        <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'center', flexShrink: 0 }}>
                          {/* Text/Type Icon */}
                          <Tooltip title={mapping.sourceIsText ? "Text" : "Not text"}>
                            <TextIcon 
                              sx={{ 
                                fontSize: 16,
                                color: mapping.sourceIsText ? 'primary.main' : 'grey.300' 
                              }} 
                            />
                          </Tooltip>
                          
                          {/* Timezone Icon */}
                          <Tooltip title={mapping.sourceTimezone || "No timezone"}>
                            <TimezoneIcon 
                              sx={{ 
                                fontSize: 16, 
                                color: mapping.sourceTimezone ? 'info.main' : 'grey.300' 
                              }} 
                            />
                          </Tooltip>
                          
                          {/* Calendar/Date Icon */}
                          <Tooltip title={(mapping.sourceIsDate || mapping.sourceIsDatetime) ? "Date field" : "Not a date"}>
                            <CalendarIcon 
                              sx={{ 
                                fontSize: 16, 
                                color: (mapping.sourceIsDate || mapping.sourceIsDatetime) ? 'success.main' : 'grey.300' 
                              }} 
                            />
                          </Tooltip>
                          
                          {/* Primary/Foreign Key Icon */}
                          <Tooltip title={mapping.sourceIsPk ? "Primary Key" : mapping.sourceIsFk ? "Foreign Key" : "No key"}>
                            <KeyIcon 
                              sx={{ 
                                fontSize: 16, 
                                color: mapping.sourceIsPk ? 'primary.main' : mapping.sourceIsFk ? 'secondary.main' : 'grey.300' 
                              }} 
                            />
                          </Tooltip>
                          
                          {/* Required Icon */}
                          <Tooltip title={mapping.sourceIsRequired ? "Required" : "Optional"}>
                            <RequiredIcon 
                              sx={{ 
                                fontSize: 16, 
                                color: mapping.sourceIsRequired ? 'error.main' : 'grey.300' 
                              }} 
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Arrow/Toggle Column */}
                    <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <SwapIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Grid>

                    {/* Target Field */}
                    <Grid item xs={5}>
                      {isEditing ? (
                        // Edit Mode
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', px: 1 }}>
                          <FormControl size="small" sx={{ flex: 1 }}>
                            {isLoadingTargetColumns ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2" color="text.secondary">
                                  Loading target columns...
                                </Typography>
                              </Box>
                            ) : (
                              <Select
                                value={editState.targetField}
                                onChange={handleTargetFieldChange}
                                displayEmpty
                              >
                                <MenuItem value="" disabled>
                                  Select target field
                                </MenuItem>
                                {targetColumns.length > 0 ? (
                                  targetColumns.map(column => (
                                    <MenuItem key={column.target_column} value={column.name}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography>{column.name}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                                          {/* Target Field Icons in Dropdown */}
                                          {column.is_required === 'true' && (
                                            <Tooltip title="Required">
                                              <RequiredIcon sx={{ fontSize: 14, color: 'error.main' }} />
                                            </Tooltip>
                                          )}
                                          {column.is_text === 'true' && (
                                            <Tooltip title="Text">
                                              <TextIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                            </Tooltip>
                                          )}
                                          {column.is_pk === 'true' && (
                                            <Tooltip title="Primary Key">
                                              <KeyIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                            </Tooltip>
                                          )}
                                          {column.is_fk === 'true' && (
                                            <Tooltip title="Foreign Key">
                                              <KeyIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                                            </Tooltip>
                                          )}
                                          {(column.is_date === 'true' || column.is_datetime === 'true') && (
                                            <Tooltip title="Date/Time">
                                              <CalendarIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                            </Tooltip>
                                          )}
                                          {column.is_picklist === 'true' && (
                                            <Tooltip title="Picklist">
                                              <TableIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                                            </Tooltip>
                                          )}
                                        </Box>
                                      </Box>
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem value="" disabled>
                                    No target columns available
                                  </MenuItem>
                                )}
                              </Select>
                            )}
                          </FormControl>
                          
                          <Tooltip title="Save">
                            <IconButton 
                              size="small" 
                              onClick={handleSaveEdit}
                              color="primary"
                              disabled={isLoadingTargetColumns}
                            >
                              <SaveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small" 
                              onClick={handleCancelEdit}
                              disabled={isLoadingTargetColumns}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        // View Mode
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 1,
                          width: '100%',
                          gap: 1,
                          opacity: mapping.isMapped ? 1 : 0.5
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                            {/* Field Name */}
                            <Typography 
                              variant="body1" 
                              fontWeight="medium"
                            >
                              {mapping.targetField}
                            </Typography>
                          </Box>
                          
                          {/* Icons Container */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                            {/* All Target Field Icons */}
                            <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'center' }}>
                              {/* Text/Type Icon */}
                              <Tooltip title={mapping.targetIsText ? "Text" : "Not text"}>
                                <TextIcon 
                                  sx={{ 
                                    fontSize: 16,
                                    color: mapping.targetIsText ? 'primary.main' : 'grey.300' 
                                  }} 
                                />
                              </Tooltip>
                              
                              {/* Timezone Icon */}
                              <Tooltip title={mapping.targetTimezone || "No timezone"}>
                                <TimezoneIcon 
                                  sx={{ 
                                    fontSize: 16, 
                                    color: mapping.targetTimezone ? 'info.main' : 'grey.300' 
                                  }} 
                                />
                              </Tooltip>
                              
                              {/* Calendar/Date Icon */}
                              <Tooltip title={(mapping.targetIsDate || mapping.targetIsDatetime) ? "Date field" : "Not a date"}>
                                <CalendarIcon 
                                  sx={{ 
                                    fontSize: 16, 
                                    color: (mapping.targetIsDate || mapping.targetIsDatetime) ? 'success.main' : 'grey.300' 
                                  }} 
                                />
                              </Tooltip>
                              
                              {/* Primary/Foreign Key Icon */}
                              <Tooltip title={mapping.targetIsPk ? "Primary Key" : mapping.targetIsFk ? "Foreign Key" : "No key"}>
                                <KeyIcon 
                                  sx={{ 
                                    fontSize: 16, 
                                    color: mapping.targetIsPk ? 'primary.main' : mapping.targetIsFk ? 'secondary.main' : 'grey.300' 
                                  }} 
                                />
                              </Tooltip>
                              
                              {/* Required Icon */}
                              <Tooltip title={mapping.targetIsRequired ? "Required" : "Optional"}>
                                <RequiredIcon 
                                  sx={{ 
                                    fontSize: 16, 
                                    color: mapping.targetIsRequired ? 'error.main' : 'grey.300' 
                                  }} 
                                />
                              </Tooltip>
                            </Box>
                            
                            {/* Action Icons */}
                            <Box sx={{ display: 'flex', gap: 0.3, ml: 0.5 }}>
                              {/* Picklist/Table Icon */}
                              <Tooltip title={mapping.targetIsPicklist ? "Picklist field" : "Not a picklist"}>
                                <TableIcon 
                                  sx={{ 
                                    fontSize: 18,
                                    color: mapping.targetIsPicklist ? 'warning.main' : 'grey.300' 
                                  }} 
                                />
                              </Tooltip>
                              
                              {/* Edit Icon */}
                              <Tooltip title="Edit mapping">
                                <span>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleEdit(mapping)}
                                    disabled={!mapping.isMapped || isMappingInProgress}
                                    sx={{ p: 0.3 }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Summary Stats */}
      {mappingData.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Paper elevation={1} sx={{ p: 2, minWidth: '120px' }}>
            <Typography variant="h6" color="primary.main" textAlign="center">
              {mappings.filter(m => m.isMapped).length}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Mapped Fields
            </Typography>
          </Paper>
          <Paper elevation={1} sx={{ p: 2, minWidth: '120px' }}>
            <Typography variant="h6" color="text.secondary" textAlign="center">
              {mappings.filter(m => !m.isMapped).length}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Unmapped Fields
            </Typography>
          </Paper>
          <Paper elevation={1} sx={{ p: 2, minWidth: '120px' }}>
            <Typography variant="h6" color="warning.main" textAlign="center">
              {mappings.filter(m => hasTypeMismatch(m)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Type Warnings
            </Typography>
          </Paper>
          <Paper elevation={1} sx={{ p: 2, minWidth: '120px' }}>
            <Typography variant="h6" color="text.primary" textAlign="center">
              {mappings.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Total Fields
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};