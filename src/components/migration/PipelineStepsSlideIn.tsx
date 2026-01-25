import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
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
import { useGetPipelineStepsQuery } from '../../services/pipelineApi';
import type { PipelineStep } from '../../services/pipelineApi';

interface PipelineStepsSlideInProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string;
  pipelineName: string;
}

const PipelineStepsSlideIn: React.FC<PipelineStepsSlideInProps> = ({
  open,
  onClose,
  pipelineId,
  pipelineName,
}) => {
  const { data: steps, isLoading, error, refetch } = useGetPipelineStepsQuery(pipelineId, {
    skip: !open || !pipelineId,
  });

  const [pollingSteps, setPollingSteps] = useState<Set<string>>(new Set());

  // Sort steps by order
  const sortedSteps = steps?.slice().sort((a, b) => a.order - b.order) || [];

  // Auto-refresh for running steps
  useEffect(() => {
    if (!steps) return;

    const runningSteps = steps.filter(step => step.status === 'running' || step.status === 'created');
    if (runningSteps.length > 0) {
      const interval = setInterval(() => {
        refetch();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [steps, refetch]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'running':
        return <RunningIcon sx={{ color: 'primary.main' }} />;
      case 'created':
        return <PendingIcon sx={{ color: 'warning.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'running':
        return 'primary';
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
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                Pipeline Steps
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {pipelineName}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={48} />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Loading steps...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load pipeline steps. Please try again.
            </Alert>
          ) : sortedSteps.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No steps found for this pipeline
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {sortedSteps.map((step: PipelineStep, index: number) => (
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
                            bgcolor: step.status === 'completed' ? 'success.main' :
                                   step.status === 'error' ? 'error.main' :
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
                              bgcolor: step.status === 'completed' ? 'success.main' : 'grey.300',
                            }}
                          />
                        )}
                      </Box>

                      {/* Step Details */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {step.name}
                          </Typography>
                          <Chip
                            label={step.status.toUpperCase()}
                            size="small"
                            color={getStatusColor(step.status) as any}
                            variant={step.status === 'completed' ? 'filled' : 'outlined'}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {step.description}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip
                            label={`Type: ${step.step_type}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Task: ${step.config.task}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(step.created_at)}
                          </Typography>
                          {step.status === 'error' && step.error_message && (
                            <Typography variant="caption" color="error.main">
                              {step.error_message}
                            </Typography>
                          )}
                        </Box>

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

export default PipelineStepsSlideIn;