import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useGetPipelineStepsQuery, useRunPipelineStepMutation } from '../../services/pipelineApi';

interface PipelineSlideInProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string;
  pipelineName: string;
}

const PipelineSlideIn: React.FC<PipelineSlideInProps> = ({
  open,
  onClose,
  pipelineId,
  pipelineName,
}) => {
  const { data: steps = [], isLoading, error } = useGetPipelineStepsQuery(pipelineId, {
    skip: !open || !pipelineId,
  });

  const [runPipelineStep] = useRunPipelineStepMutation();

  const handleRunStep = async (stepId: string) => {
    try {
      await runPipelineStep({ pipelineId, stepId }).unwrap();
    } catch (error) {
      console.error('Failed to run pipeline step:', error);
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
      case 'in_progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'failed':
      case 'error':
        return <ErrorIcon color="error" />;
      case 'running':
      case 'in_progress':
        return <CircularProgress size={20} />;
      default:
        return <PlayIcon />;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500 },
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Pipeline Steps
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
          {pipelineName}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load pipeline steps
            </Alert>
          ) : steps.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No steps found for this pipeline
            </Typography>
          ) : (
            <List>
              {steps
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                  <ListItem
                    key={step.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 2,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                          Step {step.order}
                        </Typography>
                        {getStatusIcon(step.status)}
                        <Chip
                          label={step.status}
                          size="small"
                          color={getStatusColor(step.status)}
                          variant={step.status === 'completed' ? 'filled' : 'outlined'}
                        />
                      </Box>

                      {step.status !== 'running' && step.status !== 'completed' && (
                        <IconButton
                          size="small"
                          onClick={() => handleRunStep(step.id)}
                          color="primary"
                        >
                          <PlayIcon />
                        </IconButton>
                      )}
                    </Box>

                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {step.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {step.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Type: {step.step_type} | Task: {step.config?.task || 'N/A'}
                          </Typography>
                          {step.error_message && (
                            <Alert severity="error" sx={{ mt: 1, py: 1 }}>
                              {step.error_message}
                            </Alert>
                          )}
                        </Box>
                      }
                    />

                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(step.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default PipelineSlideIn;