// components/migration/tabs/ValidateRuleTimelineSlideIn.tsx
import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Paper,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Collapse,
  Tooltip,
  Grid,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Edit as EditIcon,
  Replay as ReplayIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useGetValidateRulesQuery, useApplyAllRulesMutation, useLazyGetCleanerTaskStatusQuery, useDeleteCleanerRuleMutation } from '../../../services/transformRuleApi';

interface ValidateRuleTimelineSlideInProps {
  open: boolean;
  onClose: () => void;
  objectId: string;
  objectName: string;
}

export const ValidateRuleTimelineSlideIn: React.FC<ValidateRuleTimelineSlideInProps> = ({
  open,
  onClose,
  objectId,
  objectName,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [applyAllTaskId, setApplyAllTaskId] = useState<string | null>(null);
  const [applyAllResults, setApplyAllResults] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [reapplyingRules, setReapplyingRules] = useState<Set<string>>(new Set());
  const [reapplyResults, setReapplyResults] = useState<Record<string, any>>({});
  const [deletingRules, setDeletingRules] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    rule: any | null;
  }>({
    open: false,
    rule: null
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const {
    data: rules = [],
    isLoading,
    error,
  } = useGetValidateRulesQuery(
    { objectId },
    { skip: !open || !objectId }
  );

  // Apply all rules API
  const [applyAllRules] = useApplyAllRulesMutation();
  const [getCleanerTaskStatus] = useLazyGetCleanerTaskStatusQuery();
  const [deleteCleanerRule] = useDeleteCleanerRuleMutation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return '#4caf50'; // Green
      case 'SUCCESS':
        return '#4caf50'; // Green
      case 'PENDING':
        return '#ff9800'; // Orange
      case 'FAILURE':
      case 'ERROR':
      case 'FAILED':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleCardExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedCards(newExpanded);
  };

  const handleApplyAllRules = async () => {
    if (rules.length === 0) return;

    try {
      setIsApplyingAll(true);

      // Get all rule IDs
      const ruleIds = rules.map(rule => rule.rule_id.toString());

      // Call apply all rules API
      const result = await applyAllRules({
        object_id: objectId,
        rule_ids: ruleIds
      }).unwrap();

      console.log('Apply all rules started:', result);
      setApplyAllTaskId(result.task_id);

      // Start polling for status
      pollTaskStatus(result.task_id);

    } catch (error: any) {
      console.error('Failed to apply all rules:', error);
      setIsApplyingAll(false);
      setSnackbar({
        open: true,
        message: 'Failed to start applying all rules. Please try again.',
        severity: 'error'
      });
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const result = await getCleanerTaskStatus({ taskId }).unwrap();

      console.log('Task status:', result);

      if (result.status === 'SUCCESS' || result.status === 'FAILURE' || result.status === 'ERROR') {
        // Task completed
        setIsApplyingAll(false);
        setApplyAllTaskId(null);
        setApplyAllResults(result);
        setShowResultsDialog(true);

        // Refresh rules data
        // TODO: Add refetch logic

        // Check if any individual rule failed
        const hasFailedRules = result.result?.results?.some((r: any) => r.status === 'error');

        if (result.status === 'SUCCESS' && !hasFailedRules) {
          setSnackbar({
            open: true,
            message: 'All rules applied successfully!',
            severity: 'success'
          });
        } else if (hasFailedRules) {
          const failedCount = result.result?.results?.filter((r: any) => r.status === 'error').length || 0;
          setSnackbar({
            open: true,
            message: `Failed to apply ${failedCount} rule${failedCount !== 1 ? 's' : ''}. Check results for details.`,
            severity: 'error'
          });
        } else {
          setSnackbar({
            open: true,
            message: `Failed to apply rules: ${result.error || 'Unknown error'}`,
            severity: 'error'
          });
        }

      } else {
        // Continue polling
        setTimeout(() => pollTaskStatus(taskId), 2000);
      }
    } catch (error) {
      console.error('Failed to get task status:', error);
      setIsApplyingAll(false);
      setApplyAllTaskId(null);
      setSnackbar({
        open: true,
        message: 'Failed to check task status. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleEdit = (rule: any) => {
    console.log('Edit rule:', rule);
    // TODO: Implement edit functionality
  };

  const handleReapply = async (rule: any) => {
    try {
      setReapplyingRules(prev => new Set(prev).add(rule.rule_id));

      // Call apply all rules API with single rule ID
      const result = await applyAllRules({
        object_id: objectId,
        rule_ids: [rule.rule_id.toString()]
      }).unwrap();

      console.log('Reapply rule started:', result);
      pollReapplyStatus(rule.rule_id, result.task_id);

    } catch (error: any) {
      console.error('Failed to reapply rule:', error);
      setReapplyingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(rule.rule_id);
        return newSet;
      });
      // TODO: Show error notification
    }
  };

  const pollReapplyStatus = async (ruleId: string, taskId: string) => {
    try {
      const result = await getCleanerTaskStatus({ taskId }).unwrap();

      console.log('Reapply status:', result);

      if (result.status === 'SUCCESS' || result.status === 'FAILURE' || result.status === 'ERROR') {
        // Task completed
        setReapplyingRules(prev => {
          const newSet = new Set(prev);
          newSet.delete(ruleId);
          return newSet;
        });

        // Store results
        setReapplyResults(prev => ({
          ...prev,
          [ruleId]: result
        }));

        // Check individual rule result status
        const ruleResult = result.result?.results?.find((r: any) => r.rule_id === ruleId);

        console.log('Individual rule result lookup:', {
          ruleId,
          ruleResult,
          allResults: result.result?.results
        });

        if (ruleResult) {
          if (ruleResult.status === 'error') {
            console.log('Found error in individual rule result');
            setSnackbar({
              open: true,
              message: `Rule ${ruleId} reapply failed: ${ruleResult.message || 'Unknown error'}`,
              severity: 'error'
            });
          } else {
            setSnackbar({
              open: true,
              message: `Rule ${ruleId} reapplied successfully`,
              severity: 'success'
            });
          }
        } else if (result.status === 'SUCCESS') {
          console.log('Overall success, no individual result found');
          setSnackbar({
            open: true,
            message: `Rule ${ruleId} reapplied successfully`,
            severity: 'success'
          });
        } else {
          console.log('Overall failure');
          setSnackbar({
            open: true,
            message: `Failed to reapply rule ${ruleId}: ${result.error || 'Unknown error'}`,
            severity: 'error'
          });
        }

      } else {
        // Continue polling
        setTimeout(() => pollReapplyStatus(ruleId, taskId), 2000);
      }
    } catch (error) {
      console.error('Failed to get reapply status:', error);
      setReapplyingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
      setSnackbar({
        open: true,
        message: `Failed to check reapply status for rule ${ruleId}. Please try again.`,
        severity: 'error'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    const rule = deleteDialog.rule;
    if (!rule) return;

    setDeleteDialog({ open: false, rule: null });

    try {
      setDeletingRules(prev => new Set(prev).add(rule.rule_id));

      await deleteCleanerRule({ ruleId: rule.rule_id }).unwrap();

      setSnackbar({
        open: true,
        message: `Rule ${rule.rule_id} deleted successfully!`,
        severity: 'success'
      });

      // Refresh the rules list
      // The invalidatesTags should handle this automatically

    } catch (error: any) {
      console.error('Failed to delete rule:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete rule ${rule.rule_id}. Please try again.`,
        severity: 'error'
      });
    } finally {
      setDeletingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(rule.rule_id);
        return newSet;
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, rule: null });
  };

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
      }}
    >
      <Paper
        sx={{
          width: '700px',
          height: '100vh',
          margin: 0,
          borderRadius: 0,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'grey.50',
        }}
      >
        {/* Header */}
        <Box sx={{
          py: 1.5,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: '#4c1d95', // Explicit indigo color
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon sx={{ fontSize: 20 }} />
            <Typography variant="h6" component="h2" fontWeight="bold" sx={{ fontSize: '1rem' }}>
              Validate Rule Timeline - {objectName}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ color: 'white', p: 0.5 }}
            size="small"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Sub Header */}
        <Box sx={{
          py: 1,
          px: 2,
          backgroundColor: '#4c1d95', // Indigo background
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography
            variant="body2"
            sx={{
              color: 'grey.700', // Dark grey color
              fontWeight: 'medium'
            }}
          >
            List of Validate Rules
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyAllRules}
            disabled={isApplyingAll || rules.length === 0}
            startIcon={isApplyingAll ? <CircularProgress size={16} /> : null}
            sx={{
              backgroundColor: 'white',
              color: '#4c1d95',
              '&:hover': {
                backgroundColor: 'grey.100',
              },
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500',
              }
            }}
          >
            {isApplyingAll ? 'Applying...' : 'Apply All Rules'}
          </Button>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading validate rules...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error">
              Failed to load validate rules. Please try again later.
            </Alert>
          ) : rules.length === 0 ? (
            <Alert severity="info">
              No validate rules found for this object.
            </Alert>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Rule Execution History
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  Showing {rules.length} validate rule{rules.length !== 1 ? 's' : ''} executed on {objectName}
                </Typography>
              </Box>

              {/* Rules Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rules.map((rule, index) => {
                  const isExpanded = expandedCards.has(rule.rule_id);
                  const sourceField = rule.parameter?.column_name || 'N/A';

                  return (
                    <Card
                      key={rule.rule_id}
                      elevation={2}
                      sx={{
                        border: `2px solid ${getStatusColor(rule.status)}`,
                        backgroundColor: 'grey.100',
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Card Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {index + 1}. {rule.cleanup_function}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={`Field: ${sourceField}`}
                                size="small"
                                sx={{
                                  backgroundColor: '#f5f5dc', // Skin color
                                  border: 'none'
                                }}
                              />
                              <Chip
                                label={`ID: ${rule.rule_id}`}
                                size="small"
                                sx={{
                                  backgroundColor: '#f5f5dc', // Skin color
                                  border: 'none'
                                }}
                              />
                              <Chip
                                label={`Field: ${rule.parameter?.column_name || 'N/A'}`}
                                size="small"
                                sx={{
                                  backgroundColor: '#f5f5dc', // Skin color
                                  border: 'none'
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Action Icons */}
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Tooltip title="Edit Rule">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(rule)}
                                sx={{ color: 'primary.main' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reapply Rule">
                              <IconButton
                                size="small"
                                onClick={() => handleReapply(rule)}
                                disabled={reapplyingRules.has(rule.rule_id)}
                                sx={{ color: 'success.main' }}
                              >
                                {reapplyingRules.has(rule.rule_id) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <ReplayIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Rule">
                              <IconButton
                                size="small"
                                onClick={() => setDeleteDialog({ open: true, rule })}
                                disabled={deletingRules.has(rule.rule_id)}
                                sx={{ color: 'error.main' }}
                              >
                                {deletingRules.has(rule.rule_id) ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleCardExpansion(rule.rule_id)}
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Expanded Content */}
                        <Collapse in={isExpanded}>
                          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Field Name
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {sourceField}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Applied At
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                  {rule.applied_at ? formatDate(rule.applied_at) : 'Not applied'}
                                </Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Status
                              </Typography>
                              <Chip
                                label={rule.status}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(rule.status),
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Rule Definition
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {rule.parameter && Object.entries(rule.parameter).map(([key, value]) => (
                                  <Chip
                                    key={key}
                                    label={`${key}: ${value}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: getStatusColor(rule.status),
                                      color: 'white',
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>

                            {rule.last_error && (
                              <Box sx={{ mt: 2 }}>
                                <Alert severity="error" sx={{ py: 1 }}>
                                  <Typography variant="body2">
                                    {rule.last_error}
                                  </Typography>
                                </Alert>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>

              {/* Summary Statistics */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Total Rules: ${rules.length}`}
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={`Applied: ${rules.filter(r => r.status === 'APPLIED').length}`}
                  variant="outlined"
                  sx={{ backgroundColor: '#4caf50', color: 'white' }}
                />
                <Chip
                  label={`Pending: ${rules.filter(r => r.status === 'PENDING').length}`}
                  variant="outlined"
                  sx={{ backgroundColor: '#ff9800', color: 'white' }}
                />
                <Chip
                  label={`Failed: ${rules.filter(r => ['FAILURE', 'ERROR', 'FAILED'].includes(r.status)).length}`}
                  variant="outlined"
                  sx={{ backgroundColor: '#f44336', color: 'white' }}
                />
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Modal>

    {/* Results Dialog - Separate Modal */}
    <Modal
      open={showResultsDialog}
      onClose={() => setShowResultsDialog(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper sx={{ p: 3, maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Apply All Rules Results
        </Typography>

        {applyAllResults && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary">
                Overall Status: {applyAllResults.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Task ID: {applyAllResults.task_id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Progress: {applyAllResults.progress}%
              </Typography>
            </Box>

            {applyAllResults.result && applyAllResults.result.results && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Individual Rule Results:
                </Typography>
                {applyAllResults.result.results.map((ruleResult: any, index: number) => (
                  <Card key={index} sx={{ mb: 1, border: `1px solid ${ruleResult.status === 'error' ? '#f44336' : '#4caf50'}` }}>
                    <CardContent sx={{ py: 1, px: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold">
                          Rule ID: {ruleResult.rule_id}
                        </Typography>
                        <Chip
                          label={ruleResult.status}
                          size="small"
                          color={ruleResult.status === 'error' ? 'error' : 'success'}
                        />
                      </Box>
                      {ruleResult.message && (
                        <Typography variant="body2" color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
                          {ruleResult.message}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Progress: {ruleResult.overall_progress}%
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {applyAllResults.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {applyAllResults.error}
              </Alert>
            )}
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setShowResultsDialog(false)}>
            Close
          </Button>
        </Box>
      </Paper>
    </Modal>

    {/* Delete Confirmation Dialog */}
    <Dialog
      open={deleteDialog.open}
      onClose={handleDeleteCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the rule "{deleteDialog.rule?.cleanup_function}"?
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteCancel} color="inherit">
          No
        </Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
          Yes, Delete
        </Button>
      </DialogActions>
    </Dialog>

    {/* Snackbar for notifications */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
  );
};