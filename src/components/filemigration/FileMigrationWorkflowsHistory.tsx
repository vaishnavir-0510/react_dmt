import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  RunningWithErrors as RunningIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: string;
  filesProcessed: number;
  totalFiles: number;
  errors?: string[];
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: string;
  message?: string;
}

const FileMigrationWorkflowsHistory: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);

  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadExecutions();
  }, [selectedProject]);

  const loadExecutions = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockExecutions: WorkflowExecution[] = [
        {
          id: 'exec-001',
          workflowName: 'Customer Data Migration',
          status: 'completed',
          startTime: '2025-12-03T08:00:00Z',
          endTime: '2025-12-03T08:45:00Z',
          duration: '45m 0s',
          filesProcessed: 150,
          totalFiles: 150,
          steps: [
            {
              id: 'step-001',
              name: 'File Upload',
              status: 'completed',
              startTime: '2025-12-03T08:00:00Z',
              endTime: '2025-12-03T08:05:00Z',
              duration: '5m 0s',
            },
            {
              id: 'step-002',
              name: 'Data Analysis',
              status: 'completed',
              startTime: '2025-12-03T08:05:00Z',
              endTime: '2025-12-03T08:15:00Z',
              duration: '10m 0s',
            },
            {
              id: 'step-003',
              name: 'Data Transformation',
              status: 'completed',
              startTime: '2025-12-03T08:15:00Z',
              endTime: '2025-12-03T08:35:00Z',
              duration: '20m 0s',
            },
            {
              id: 'step-004',
              name: 'Data Validation',
              status: 'completed',
              startTime: '2025-12-03T08:35:00Z',
              endTime: '2025-12-03T08:40:00Z',
              duration: '5m 0s',
            },
            {
              id: 'step-005',
              name: 'Data Loading',
              status: 'completed',
              startTime: '2025-12-03T08:40:00Z',
              endTime: '2025-12-03T08:45:00Z',
              duration: '5m 0s',
            },
          ],
        },
        {
          id: 'exec-002',
          workflowName: 'Product Catalog Update',
          status: 'running',
          startTime: '2025-12-03T09:00:00Z',
          filesProcessed: 75,
          totalFiles: 100,
          steps: [
            {
              id: 'step-006',
              name: 'File Upload',
              status: 'completed',
              startTime: '2025-12-03T09:00:00Z',
              endTime: '2025-12-03T09:02:00Z',
              duration: '2m 0s',
            },
            {
              id: 'step-007',
              name: 'Data Analysis',
              status: 'running',
              startTime: '2025-12-03T09:02:00Z',
            },
          ],
        },
        {
          id: 'exec-003',
          workflowName: 'Inventory Sync',
          status: 'failed',
          startTime: '2025-12-03T07:30:00Z',
          endTime: '2025-12-03T07:45:00Z',
          duration: '15m 0s',
          filesProcessed: 25,
          totalFiles: 50,
          errors: ['Validation failed: Invalid data format in row 150'],
          steps: [
            {
              id: 'step-008',
              name: 'File Upload',
              status: 'completed',
              startTime: '2025-12-03T07:30:00Z',
              endTime: '2025-12-03T07:32:00Z',
              duration: '2m 0s',
            },
            {
              id: 'step-009',
              name: 'Data Validation',
              status: 'failed',
              startTime: '2025-12-03T07:32:00Z',
              endTime: '2025-12-03T07:45:00Z',
              duration: '13m 0s',
              message: 'Validation failed: Invalid data format in row 150',
            },
          ],
        },
      ];

      setExecutions(mockExecutions);
    } catch (error) {
      console.error('Failed to load executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon sx={{ color: 'success.main' }} />;
      case 'running':
        return <RunningIcon sx={{ color: 'primary.main' }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'pending':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewDetails = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedExecution(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Workflows History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadExecutions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={48} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading workflow executions...
          </Typography>
        </Box>
      ) : executions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No workflow executions found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Workflow executions will appear here once you run file migration processes.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Workflow Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executions.map((execution) => (
                <TableRow key={execution.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {execution.workflowName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(execution.status)}
                      <Chip
                        label={execution.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(execution.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(execution.startTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {execution.duration || 'In progress'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {execution.filesProcessed}/{execution.totalFiles} files
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(execution)}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      {execution.status === 'failed' && (
                        <IconButton
                          size="small"
                          color="primary"
                          title="Retry"
                        >
                          <PlayIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Execution Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Execution Details: {selectedExecution?.workflowName}
        </DialogTitle>
        <DialogContent>
          {selectedExecution && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Overview
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Status:</strong>{' '}
                    <Chip
                      label={selectedExecution.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(selectedExecution.status) as any}
                      variant="outlined"
                    />
                  </Typography>
                  <Typography variant="body2">
                    <strong>Started:</strong> {formatDate(selectedExecution.startTime)}
                  </Typography>
                  {selectedExecution.endTime && (
                    <Typography variant="body2">
                      <strong>Completed:</strong> {formatDate(selectedExecution.endTime)}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Duration:</strong> {selectedExecution.duration || 'In progress'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Files Processed:</strong> {selectedExecution.filesProcessed}/{selectedExecution.totalFiles}
                  </Typography>
                </Stack>
              </Box>

              {selectedExecution.errors && selectedExecution.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Errors:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {selectedExecution.errors.map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <Typography variant="h6" gutterBottom>
                Steps
              </Typography>
              <Stack spacing={2}>
                {selectedExecution.steps.map((step, index) => (
                  <Paper key={step.id} sx={{ p: 2, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: step.status === 'completed' ? 'success.main' :
                                   step.status === 'failed' ? 'error.main' :
                                   step.status === 'running' ? 'primary.main' : 'warning.main',
                            color: 'white',
                            mb: 1,
                          }}
                        >
                          {step.status === 'running' ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Typography variant="caption" fontWeight="bold">
                              {index + 1}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {step.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Started: {formatDate(step.startTime)}
                          {step.endTime && ` • Completed: ${formatDate(step.endTime)}`}
                          {step.duration && ` • Duration: ${step.duration}`}
                        </Typography>
                        {step.message && (
                          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                            {step.message}
                          </Typography>
                        )}
                      </Box>

                      <Chip
                        label={step.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(step.status) as any}
                        variant="outlined"
                      />
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileMigrationWorkflowsHistory;