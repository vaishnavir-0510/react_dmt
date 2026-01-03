
// components/migration/tabs/WorkflowsTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { setMigrationName } from '../../../store/slices/migrationSlice';
import {
  useGetPipelinesQuery,
  useGeneratePipelineMutation,
  useRunPipelineMutation,
  useGetExecutionsQuery,
  useGetExecutionStepsQuery,
  usePromotePipelineMutation,
} from '../../../services/pipelineApi';
import { useGetEnvironmentsByProjectQuery } from '../../../services/environmentApi';
import { useGetEntityMappedObjectQuery } from '../../../services/odfFileApi';
import PipelineStepsSlideIn from '../PipelineStepsSlideIn';
import ExecutionStepsSlideIn from '../ExecutionStepsSlideIn';

interface Pipeline {
  name: string;
  id: string;
  environment_id: string;
  object_id: string;
  status: string;
  is_deleted: boolean;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
  description: string;
  project_id: string;
  target_object_id: string;
  is_active: boolean;
  version_number: number;
  description_of_changes: string | null;
}

export const WorkflowsTab: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedObject, migrationName } = useSelector((state: RootState) => state.migration);
  const { selectedProject, selectedEnvironment, selectedSystem } = useSelector(
    (state: RootState) => state.app
  );

  const [activeTab, setActiveTab] = useState(0); // 0 for Pipeline, 1 for Execution History
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [isStepsSlideInOpen, setIsStepsSlideInOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [isExecutionStepsSlideInOpen, setIsExecutionStepsSlideInOpen] = useState(false);
  const [runningPipelineId, setRunningPipelineId] = useState<string | null>(null);

  // API hooks
  const {
    data: pipelines = [],
    isLoading: isLoadingPipelines,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = useGetPipelinesQuery(
    {
      object_id: selectedObject?.object_id || '',
      environment_id: selectedEnvironment?.id || ''
    },
    {
      skip: !selectedObject?.object_id || !selectedEnvironment?.id
    }
  );

  const [generatePipeline, { isLoading: isGenerating }] = useGeneratePipelineMutation();
  const [runPipeline, { isLoading: isRunning }] = useRunPipelineMutation();
  const [promotePipeline, { isLoading: isPromoting }] = usePromotePipelineMutation();

  // Get executions for execution history
  const {
    data: executions = [],
    isLoading: isLoadingExecutions,
    refetch: refetchExecutions,
  } = useGetExecutionsQuery(
    {
      pipeline_id: selectedPipeline?.id || '',
      environment_id: selectedEnvironment?.id || ''
    },
    {
      skip: !selectedPipeline?.id || activeTab !== 1 || !selectedEnvironment?.id
    }
  );

  // Get entity mapping for target object
  const { data: entityMapping } = useGetEntityMappedObjectQuery(
    {
      source_object_id: selectedObject?.object_id || '',
      project: selectedProject?.id || '',
      environment: selectedEnvironment?.id || '',
    },
    {
      skip: !selectedObject?.object_id || !selectedProject?.id || !selectedEnvironment?.id
    }
  );

  // Get environments for promotion
  const { data: environments = [] } = useGetEnvironmentsByProjectQuery(selectedProject?.id || '', {
    skip: !selectedProject?.id
  });


  // Refetch executions when selected pipeline changes (for execution history tab)
  useEffect(() => {
    if (selectedPipeline?.id && selectedEnvironment?.id && activeTab === 1) {
      refetchExecutions();
    }
  }, [selectedPipeline?.id, selectedEnvironment?.id, activeTab, refetchExecutions]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGeneratePipeline = async () => {
    if (!selectedObject?.object_id || !selectedProject?.id || !selectedEnvironment?.id || !selectedSystem?.id || !entityMapping) {
      return;
    }

    try {
      await generatePipeline({
        object_id: selectedObject.object_id,
        project_id: selectedProject.id,
        environment_id: selectedEnvironment.id,
        target_object_id: (entityMapping?.id || entityMapping?.target_object_id || entityMapping) || '',
        name: `${selectedObject.object_name}_Pipeline`,
        description: 'Generated Pipeline',
      }).unwrap();
      refetchPipelines();
    } catch (error) {
      console.error('Failed to generate pipeline:', error);
    }
  };

  const handleRunPipeline = async (pipelineId: string) => {
    if (!selectedEnvironment?.id) return;

    setRunningPipelineId(pipelineId);
    try {
      await runPipeline({ pipelineId, environmentId: selectedEnvironment.id }).unwrap();
      refetchPipelines();
      // Refresh executions if we're on the execution history tab
      if (activeTab === 1 && selectedPipeline?.id === pipelineId) {
        refetchExecutions();
      }
    } catch (error) {
      console.error('Failed to run pipeline:', error);
    } finally {
      setRunningPipelineId(null);
    }
  };

  const handlePromotePipeline = async (pipelineId: string) => {
    const qaEnv = environments.find(env => env.type.toLowerCase() === 'qa' || env.name.toLowerCase().includes('qa'));
    if (!qaEnv) {
      console.error('QA environment not found');
      return;
    }

    try {
      await promotePipeline({
        pipelineId,
        promotion_note: 'Promoted to QA',
        to_env: qaEnv.id,
      }).unwrap();
      refetchPipelines();
    } catch (error) {
      console.error('Failed to promote pipeline:', error);
    }
  };

  const handleRowClick = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setIsStepsSlideInOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
      case 'error':
        return 'error';
      case 'created':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Define Pipelines
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Pipeline" />
          <Tab label="Execution History" />
        </Tabs>
      </Box>

      {/* Generate Pipeline and Promote Buttons - Only show on Pipeline tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleGeneratePipeline}
            disabled={isGenerating || !selectedObject?.object_id || !entityMapping}
            startIcon={isGenerating ? <CircularProgress size={20} /> : null}
          >
            {isGenerating ? 'Generating...' : 'Generate Pipeline'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const activePipeline = pipelines.find(p => p.is_active);
              if (activePipeline) {
                handlePromotePipeline(activePipeline.id);
              }
            }}
            disabled={isPromoting || !pipelines.some(p => p.is_active)}
            startIcon={isPromoting ? <CircularProgress size={20} /> : null}
          >
            {isPromoting ? 'Promoting...' : 'Promote to QA'}
          </Button>
        </Box>
      )}

      {/* Pipeline Tab Content */}
      {activeTab === 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          {pipelinesError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load pipelines. Please try again.
            </Alert>
          )}

          {isLoadingPipelines ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={48} />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Loading pipelines...
              </Typography>
            </Box>
          ) : pipelines.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No pipelines found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Generate a pipeline to get started with your migration workflow.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Modified</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pipelines.map((pipeline) => (
                    <TableRow
                      key={pipeline.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(pipeline)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {pipeline.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pipeline.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pipeline.is_active ? 'ACTIVE' : 'INACTIVE'}
                          size="small"
                          color={pipeline.is_active ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          v{pipeline.version_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(pipeline.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(pipeline.modified_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {pipeline.is_active && (
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunPipeline(pipeline.id);
                            }}
                            disabled={runningPipelineId === pipeline.id || pipeline.status === 'running'}
                            color="primary"
                            size="small"
                          >
                            {runningPipelineId === pipeline.id ? <CircularProgress size={20} /> : <PlayIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Execution History Tab Content */}
      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          {selectedPipeline ? (
            <>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Execution History - {selectedPipeline.name}
              </Typography>

              {isLoadingExecutions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={48} />
                  <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading executions...
                  </Typography>
                </Box>
              ) : executions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No executions found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Run the pipeline to see execution history.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Started</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {executions.map((execution) => (
                        <TableRow
                          key={execution.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedExecution(execution);
                            setIsExecutionStepsSlideInOpen(true);
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={execution.status.toUpperCase()}
                              size="small"
                              color={execution.status === 'completed' ? 'success' :
                                     execution.status === 'failed' ? 'error' :
                                     execution.status === 'running' ? 'primary' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(execution.started_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {execution.completed_at ? formatDate(execution.completed_at) : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {execution.completed_at ?
                                `${Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)}s` :
                                'N/A'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="error.main"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {execution.error_message || 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Select a Pipeline
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Go to the Pipeline tab and select a pipeline to view its execution history.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Pipeline Steps Slide-in */}
      <PipelineStepsSlideIn
        open={isStepsSlideInOpen}
        onClose={() => setIsStepsSlideInOpen(false)}
        pipelineId={selectedPipeline?.id || ''}
        pipelineName={selectedPipeline?.name || ''}
      />

      {/* Execution Steps Slide-in */}
      <ExecutionStepsSlideIn
        open={isExecutionStepsSlideInOpen}
        onClose={() => setIsExecutionStepsSlideInOpen(false)}
        executionId={selectedExecution?.id || ''}
        executionName={`Execution ${selectedExecution?.id?.slice(-8) || ''}`}
      />
    </Box>
  );
};