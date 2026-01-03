import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Card,
  CardContent,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as RunningIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { useGetExecutionStepsQuery } from '../../services/pipelineApi';

interface ExecutionStep {
  id: string;
  execution_id: string;
  step_id: string;
  step_name: string;
  order: number;
  started_at: string;
  results: any;
  created_by: string;
  created_at: string;
  step_type: string;
  status: string;
  completed_at: string;
  error_message: string | null;
  modified_by: string;
  modified_at: string;
}

interface ExecutionStepsSlideInProps {
  open: boolean;
  onClose: () => void;
  executionId: string;
  executionName: string;
}

const ExecutionStepsSlideIn: React.FC<ExecutionStepsSlideInProps> = ({
  open,
  onClose,
  executionId,
  executionName,
}) => {
  const { data: steps, isLoading, error } = useGetExecutionStepsQuery(executionId, {
    skip: !open || !executionId,
  });

  // Sort steps by order
  const sortedSteps = steps?.slice().sort((a, b) => a.order - b.order) || [];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'failed':
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'running':
        return <RunningIcon sx={{ color: 'primary.main' }} />;
      case 'pending':
      case 'created':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'running':
        return 'primary';
      case 'pending':
      case 'created':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 600 },
          p: 0,
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* App Bar */}
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Execution Steps
            </Typography>
            <IconButton color="inherit" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            {executionName}
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={48} />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Loading execution steps...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load execution steps. Please try again.
            </Alert>
          ) : sortedSteps.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No steps found for this execution
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {sortedSteps.map((step: ExecutionStep, index: number) => (
                <Card key={step.id} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* Step Number and Status */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: step.status === 'completed' || step.status === 'success' ? 'success.main' :
                                   step.status === 'failed' || step.status === 'error' ? 'error.main' :
                                   step.status === 'running' ? 'primary.main' : 'warning.main',
                            color: 'white',
                            mb: 1,
                          }}
                        >
                          {step.status === 'running' ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {index + 1}
                            </Typography>
                          )}
                        </Box>
                        {index < sortedSteps.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              height: 40,
                              bgcolor: step.status === 'completed' || step.status === 'success' ? 'success.main' : 'grey.300',
                            }}
                          />
                        )}
                      </Box>

                      {/* Step Details */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {step.step_name}
                          </Typography>
                          <Chip
                            label={step.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(step.status) as any}
                            variant={step.status === 'completed' || step.status === 'success' ? 'filled' : 'outlined'}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Type: {step.step_type}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip
                            label={`Started: ${formatDate(step.started_at)}`}
                            size="small"
                            variant="outlined"
                          />
                          {step.completed_at && (
                            <Chip
                              label={`Completed: ${formatDate(step.completed_at)}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {(step.status === 'failed' || step.status === 'error') && step.error_message && (
                          <Alert severity="error" sx={{ mb: 2, py: 1 }}>
                            <Typography variant="body2">
                              {step.error_message}
                            </Typography>
                          </Alert>
                        )}

                        {step.results && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              Results:
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {JSON.stringify(step.results, null, 2)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default ExecutionStepsSlideIn;