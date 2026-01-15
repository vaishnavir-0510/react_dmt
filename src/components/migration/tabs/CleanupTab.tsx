// components/migration/tabs/CleanupTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AutoFixHigh as CleanupIcon,
  Refresh as RefreshIcon,
  List as RuleListIcon,
} from '@mui/icons-material';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';
import { useGetCleanupDataQuery } from '../../../services/cleanupApi';
import { FixIssueSlideIn } from '../FixIssueSlideIn';
import { CleanupRuleTimelineSlideIn } from './CleanupRuleTimelineSlideIn';
import type { CleanupField } from '../../../types';
import { useLazyGetTaskStatusQuery } from '../../../services/cleanupRuleApi';

// Task status component with manual refresh
const TaskStatusIndicator: React.FC<{ 
  taskId: string | null; 
  changeLogId: number;
  onRefresh: (taskId: string) => void;
}> = ({ 
  taskId, 
  changeLogId,
  onRefresh 
}) => {
  const [triggerGetStatus, { data: taskStatus, isLoading, error }] = useLazyGetTaskStatusQuery();

  // Load status initially when taskId is available
  useEffect(() => {
    if (taskId) {
      triggerGetStatus({ taskId });
    }
  }, [taskId, triggerGetStatus]);

  const handleRefresh = () => {
    if (taskId) {
      triggerGetStatus({ taskId });
      onRefresh(taskId);
    }
  };

  if (!taskId) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<WarningIcon />}
          label="Pending Fix"
          color="warning"
          variant="filled"
          size="small"
        />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2">Checking...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label="Status Error"
          color="error"
          variant="filled"
          size="small"
        />
        <Tooltip title="Retry status check">
          <IconButton size="small" onClick={handleRefresh} color="error">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'QUEUED':
        return { color: 'warning', label: 'Queued', icon: <RefreshIcon /> };
      case 'SUCCESS':
        return { color: 'success', label: 'Completed', icon: <CheckCircleIcon /> };
      case 'FAILURE':
      case 'ERROR':
        return { color: 'error', label: 'Failed', icon: <WarningIcon /> };
      case 'PROGRESS':
        return { color: 'info', label: 'In Progress', icon: <CircularProgress size={16} /> };
      default:
        return { color: 'default', label: status, icon: null };
    }
  };

  const statusConfig = getStatusConfig(taskStatus?.status || 'UNKNOWN');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={`Stage: ${taskStatus?.stage || 'Unknown'} | Progress: ${taskStatus?.progress || 0}%`}>
        <Chip
        //  icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color as any}
          variant="filled"
          size="small"
          sx={{ minWidth: '100px' }}
        />
      </Tooltip>
      <Tooltip title="Refresh status">
        <IconButton 
          size="small" 
          onClick={handleRefresh}
          color="primary"
          disabled={isLoading}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export const CleanupTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedEnvironment } = useSelector((state: RootState) => state.app);
  const { getReadOnlyFlag, getCompletionStatus, getActivityStatus } = useActivity();
  const isReadOnly = getReadOnlyFlag('Cleanup');
  const [selectedField, setSelectedField] = useState<CleanupField | null>(null);
  const [fixIssueOpen, setFixIssueOpen] = useState(false);
  const [ruleTimelineSlideInOpen, setRuleTimelineSlideInOpen] = useState(false);
  const [taskMap, setTaskMap] = useState<Record<number, string>>({}); // changeLogId -> taskId mapping
  const [refreshedTasks, setRefreshedTasks] = useState<Set<string>>(new Set()); // Track manually refreshed tasks
  
  const {
    data: cleanupData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useGetCleanupDataQuery(
    { objectId: selectedObject?.object_id || '', environmentId: selectedEnvironment?.id },
    { skip: !selectedObject?.object_id || !selectedEnvironment?.id }
  );

  // Reset state and refetch data when object or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      setSelectedField(null);
      setFixIssueOpen(false);
      setRuleTimelineSlideInOpen(false);
      setTaskMap({});
      setRefreshedTasks(new Set());
      refetch();
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, refetch]);

  // Refresh activity status when tab is accessed or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      getActivityStatus(selectedObject.object_id);
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, getActivityStatus]);

  // Store task ID when a cleanup task is started
  const handleTaskStarted = (changeLogId: number, taskId: string) => {
    setTaskMap(prev => ({
      ...prev,
      [changeLogId]: taskId
    }));
  };

  // Track when user manually refreshes a task status
  const handleTaskRefresh = (taskId: string) => {
    setRefreshedTasks(prev => new Set(prev).add(taskId));
  };

  const handleFixIssue = (field: CleanupField) => {
    setSelectedField(field);
    setFixIssueOpen(true);
  };

  const handleCloseFixIssue = () => {
    setFixIssueOpen(false);
    setSelectedField(null);
  };

  const handleCleanup = (fieldName: string) => {
    console.log(`Running cleanup for field: ${fieldName}`);
    // Implement your cleanup logic here
    alert(`Run cleanup for ${fieldName}`);
  };

  const handleShowRuleList = () => {
    setRuleTimelineSlideInOpen(true);
  };

  const handleCloseRuleTimelineSlideIn = () => {
    setRuleTimelineSlideInOpen(false);
  };

  const getStatusChip = (field: CleanupField) => {
    const taskId = taskMap[field.change_log_id!];
    
    if (taskId) {
      return (
        <TaskStatusIndicator 
          taskId={taskId} 
          changeLogId={field.change_log_id!} 
          onRefresh={handleTaskRefresh}
        />
      );
    }
    
    if (field.change_log_id) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<WarningIcon />}
            label="Pending Fix"
            color="warning"
            variant="filled"
            size="small"
          />
        </Box>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<CheckCircleIcon />}
          label="No Issues"
          color="success"
          variant="outlined"
          size="small"
        />
      </Box>
    );
  };

  const getActionButton = (field: CleanupField) => {
    const taskId = taskMap[field.change_log_id!];
    
    // Show Fix Issue button for fields with change_log_id (issues)
    if (field.change_log_id) {
      return (
        <Tooltip title={`Fix metadata issue for ${field.field_name}`}>
          <Button
            variant="contained"
            color="warning"
            size="small"
            startIcon={<WarningIcon />}
            onClick={() => handleFixIssue(field)}
            disabled={isReadOnly}
            sx={{ minWidth: '120px' }}
          >
            Fix Issue
          </Button>
        </Tooltip>
      );
    }
    
    // Show Cleanup button for fields without issues
    return (
      <Tooltip title={`Run cleanup for ${field.field_name}`}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<CleanupIcon />}
          onClick={() => handleCleanup(field.field_name)}
          sx={{ minWidth: '120px' }}
        >
          Cleanup
        </Button>
      </Tooltip>
    );
  };

  if (!selectedObject) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Cleanup
        </Typography>
        <Alert severity="info">
          Please select an object to view cleanup data.
        </Alert>
      </Box>
    );
  }

  if (isLoading || isFetching) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Cleanup - {selectedObject.object_name}
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Cleanup - {selectedObject.object_name}
        </Typography>
        <Alert severity="error">
          Failed to load cleanup data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const fields = cleanupData?.changelog || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Data Cleanup - {selectedObject.object_name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and fix data quality issues for {selectedObject.object_name}.
            Fields with pending fixes require attention before migration.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButton
            activity="Cleanup"
            disabled={false}
          />
          <Tooltip title="View cleanup rules">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RuleListIcon />}
              onClick={handleShowRuleList}
              disabled={isReadOnly}
              sx={{ minWidth: '140px' }}
            >
              Rule List
            </Button>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isFetching || isReadOnly}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      

      {fields.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            No cleanup data found for this object.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table sx={{ minWidth: 650 }} aria-label="cleanup data table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Field Name
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Target Field
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Metadata Attribute
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Affected Rows
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Old Value
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  New Value
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: field.change_log_id ? 'warning.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: field.change_log_id ? 'warning.light' : 'action.hover',
                    }
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                    {field.field_name}
                  </TableCell>
                  <TableCell>
                    {field.target_field_name || '-'}
                  </TableCell>
                  <TableCell>
                    {field.metadata_attribute || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={field.affected_rows} 
                      color={field.affected_rows > 0 ? 'error' : 'default'}
                      variant={field.affected_rows > 0 ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: 'grey.100',
                        p: 0.5,
                        borderRadius: 1,
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {field.old_value || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        backgroundColor: 'grey.100',
                        p: 0.5,
                        borderRadius: 1,
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {field.new_value || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(field)}
                  </TableCell>
                  <TableCell>
                    {getActionButton(field)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary Statistics */}
      {fields.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Total Fields: ${fields.length}`}
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Pending Fixes: ${fields.filter(f => f.change_log_id).length}`}
            variant="filled"
            color="warning"
          />
          <Chip
            label={`Active Tasks: ${Object.keys(taskMap).length}`}
            variant="filled"
            color="info"
          />
          <Chip
            label={`Affected Rows: ${fields.reduce((sum, f) => sum + f.affected_rows, 0)}`}
            variant="outlined"
            color="error"
          />
          <Chip
            label={`Manual Refreshes: ${refreshedTasks.size}`}
            variant="outlined"
            color="secondary"
          />
        </Box>
      )}

      {/* Fix Issue Slide-in */}
      {selectedField && selectedObject && (
        <FixIssueSlideIn
          open={fixIssueOpen}
          onClose={handleCloseFixIssue}
          field={selectedField}
          objectId={selectedObject.object_id}
          onTaskStarted={handleTaskStarted}
          taskMap={taskMap}
        />
      )}

      {/* Cleanup Rule Timeline Slide-in Modal */}
      {selectedObject && (
        <CleanupRuleTimelineSlideIn
          open={ruleTimelineSlideInOpen}
          onClose={handleCloseRuleTimelineSlideIn}
          objectId={selectedObject.object_id}
          objectName={selectedObject.object_name}
        />
      )}
    </Box>
  );
};