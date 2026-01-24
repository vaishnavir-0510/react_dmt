// components/management/PlanningSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  PlayArrow as GenerateIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetPlanEstimatorQuery, useUpdatePlanEstimatorMutation, useUpdatePlanDatesMutation } from '../../services/planEstimatorApi';

interface PlanEstimator {
  id: string;
  environment: string;
  env_type: string;
  activity: string;
  environment_id: string;
  efforts: number;
  completion: number;
  project_id: string;
  tenant_key: string;
  start_date: string;
  end_date: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
}

interface DateEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string) => void;
  initialStartDate: string;
  initialEndDate: string;
  activity: string;
}

const DateEditDialog: React.FC<DateEditDialogProps> = ({
  open,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  activity,
}) => {
  const [startDate, setStartDate] = useState(initialStartDate.split('T')[0]);
  const [endDate, setEndDate] = useState(initialEndDate.split('T')[0]);

  useEffect(() => {
    setStartDate(initialStartDate.split('T')[0]);
    setEndDate(initialEndDate.split('T')[0]);
  }, [initialStartDate, initialEndDate]);

  const handleSave = () => {
    onSave(startDate, endDate);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit Dates - {activity}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Start Date
            </Typography>
            <TextField
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              End Date
            </Typography>
            <TextField
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const PlanningSection: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    planId: string;
    activity: string;
    startDate: string;
    endDate: string;
  }>({
    open: false,
    planId: '',
    activity: '',
    startDate: '',
    endDate: '',
  });

  const { 
    data: planData = [], 
    isLoading, 
    error, 
    refetch: refetchPlanData 
  } = useGetPlanEstimatorQuery();

  const [updatePlanEstimator] = useUpdatePlanEstimatorMutation();
  const [updatePlanDates] = useUpdatePlanDatesMutation();

  const handleGenerateEfforts = async () => {
    if (!selectedProject) {
      setShowError('Please select a project first');
      return;
    }

    try {
      // Call the efforts API
      await updatePlanEstimator({
        projectId: selectedProject.id,
        data: {
          start_date: null,
          end_date: null,
        }
      }).unwrap();

      // Refetch plan data
      await refetchPlanData();
      
      setShowSuccess(true);
      setShowError('');
    } catch (error) {
      console.error('Failed to generate efforts:', error);
      setShowError('Failed to generate efforts. Please try again.');
    }
  };

  const handleOpenEditDialog = (plan: PlanEstimator) => {
    setEditDialog({
      open: true,
      planId: plan.id,
      activity: plan.activity,
      startDate: plan.start_date,
      endDate: plan.end_date,
    });
  };

  const handleCloseEditDialog = () => {
    setEditDialog({
      open: false,
      planId: '',
      activity: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleSaveDates = async (startDate: string, endDate: string) => {
    try {
      await updatePlanDates({
        planId: editDialog.planId,
        startDate,
        endDate,
      }).unwrap();

      setShowSuccess(true);
      setShowError('');

      // Data will be automatically refetched due to invalidatesTags
    } catch (error) {
      console.error('Failed to update dates:', error);
      setShowError('Failed to update dates. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEnvTypeColor = (envType: string) => {
    switch (envType) {
      case 'dev': return 'primary';
      case 'qa': return 'secondary';
      case 'prod': return 'success';
      default: return 'default';
    }
  };

  const getCompletionColor = (completion: number) => {
    if (completion >= 100) return 'success';
    if (completion >= 75) return 'info';
    if (completion >= 50) return 'warning';
    return 'error';
  };

  if (!selectedProject) {
    return (
      <Alert severity="warning">
        Please select a project to view planning details.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with Generate Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Project Planning
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetchPlanData}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<GenerateIcon />}
            onClick={handleGenerateEfforts}
            disabled={isLoading}
          >
            Generate Efforts
          </Button>
        </Box>
      </Box>

      {/* Planning Table */}
      <Paper elevation={2}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Loading planning data...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Failed to load planning data. Please try again.
            </Alert>
          </Box>
        ) : planData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No planning data found. Click "Generate Efforts" to create planning data.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Activity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Environment</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Efforts (Hours)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Completion</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {planData.map((plan: PlanEstimator) => (
                  <TableRow key={plan.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {plan.activity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {plan.environment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={plan.env_type.toUpperCase()}
                        size="small"
                        color={getEnvTypeColor(plan.env_type) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${plan.efforts} hrs`}
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${plan.completion}%`}
                        size="small"
                        color={getCompletionColor(plan.completion) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(plan.start_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(plan.end_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEditDialog(plan)}
                        title="Edit Dates"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Date Edit Dialog */}
      <DateEditDialog
        open={editDialog.open}
        onClose={handleCloseEditDialog}
        onSave={handleSaveDates}
        initialStartDate={editDialog.startDate}
        initialEndDate={editDialog.endDate}
        activity={editDialog.activity}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {editDialog.open ? 'Dates updated successfully!' : 'Efforts generated successfully!'}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!showError}
        autoHideDuration={6000}
        onClose={() => setShowError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError('')}>
          {showError}
        </Alert>
      </Snackbar>
    </Box>
  );
};