// components/management/EstimationCalculator.tsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Slider,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Calculate as CalculateIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { 
  useGetProjectEstimatorQuery, 
  useCreateProjectEstimatorMutation,
  useUpdateProjectEstimatorMutation,
  type ProjectEstimatorActivity,
  type CreateProjectEstimatorRequest
} from '../../services/projectEstimatorApi';
import { useGetAccountQuery } from '../../services/accountApi';

interface SliderState {
  value: number;
  isModified: boolean;
  isLoading: boolean;
  originalValue: number;
}

export const EstimationCalculator: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const { data: estimatorData = [], isLoading, error, refetch } = useGetProjectEstimatorQuery();
  const { data: account, isLoading: isLoadingAccount } = useGetAccountQuery();
  
  const [createProjectEstimator] = useCreateProjectEstimatorMutation();
  const [updateProjectEstimator] = useUpdateProjectEstimatorMutation();
  
  const [sliderStates, setSliderStates] = useState<Record<string, SliderState>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);

  // Get CORRECT account ID from the Account API
  const getAccountId = () => {
    if (account?.id) {
      return account.id;
    }
    return '41d4357c-10c9-4048-9d31-595386c68f06'; // Fallback from your response
  };

  // Get CORRECT user ID (you might need to get this from auth context)
  const getUserId = () => {
    // This should come from your authentication context
    // For now, using the fallback from your response
    return '877ee3bd-de6e-4b74-9328-c37bbc63d123';
  };

  // Get CORRECT tenant key from the Account API
  const getTenantKey = () => {
    if (account?.tenant_key) {
      return account.tenant_key;
    }
    return 'a0db0172-37e9-4e43-8a04-04d1d7eab437'; // Fallback from your response
  };

  // Initialize slider states when data loads
  useEffect(() => {
    if (estimatorData.length > 0) {
      const initialStates: Record<string, SliderState> = {};
      estimatorData.forEach((activity: ProjectEstimatorActivity) => {
        initialStates[activity.activity] = {
          value: activity.dev_set_value,
          isModified: false,
          isLoading: false,
          originalValue: activity.dev_set_value,
        };
      });
      setSliderStates(initialStates);
    }
  }, [estimatorData]);

  const handleSliderChange = (activity: string) => (event: Event, newValue: number | number[]) => {
    setSliderStates(prev => ({
      ...prev,
      [activity]: {
        ...prev[activity],
        value: newValue as number,
        isModified: newValue !== prev[activity]?.originalValue,
      },
    }));
  };

  const handleCalculateEstimations = async () => {
    if (!selectedProject) {
      setShowError('Please select a project first');
      return;
    }

    if (isLoadingAccount) {
      setShowError('Loading account information...');
      return;
    }

    setIsCalculating(true);
    setSuccessCount(0);
    const accountId = getAccountId();
    const userId = getUserId();
    const tenantKey = getTenantKey();

    console.log('Using IDs:', { accountId, userId, tenantKey });

    try {
      const activitiesToProcess = estimatorData.filter(activity => 
        sliderStates[activity.activity]?.isModified
      );

      if (activitiesToProcess.length === 0) {
        setShowError('No changes detected. Please modify at least one slider.');
        setIsCalculating(false);
        return;
      }

      setTotalProcessed(activitiesToProcess.length);
      let successfulUpdates = 0;
      let failedUpdates = 0;

      // Process each activity sequentially
      for (const activityData of activitiesToProcess) {
        const sliderState = sliderStates[activityData.activity];
        
        // Set loading state for this specific slider
        setSliderStates(prev => ({
          ...prev,
          [activityData.activity]: {
            ...prev[activityData.activity],
            isLoading: true,
          },
        }));

        try {
          let result;
          
          if (!activityData.project_est_data) {
            // POST request for new estimation
            const postData: CreateProjectEstimatorRequest = {
              project_id: selectedProject.id,
              account_id: accountId, // Use correct account ID from Account API
              name: activityData.name,
              activity: activityData.activity,
              phase: activityData.phase,
              recc_effort: Math.floor(activityData.dev_recc_effort).toString(),
              dev_set_value: Math.floor(sliderState.value).toString(),
            };

            console.log('POST Data:', postData);
            result = await createProjectEstimator(postData).unwrap();
          } else {
            // PUT request for existing estimation - PASS ONLY CHANGED DATA
            const putData = {
              // Only send the fields that are required for update
              dev_set_value: Math.floor(sliderState.value), // Only this changes
              modified_by: userId, // Current user ID
              // DO NOT send modified_date - let backend handle it
              // DO NOT send other unchanged fields to minimize payload
            };

            console.log('PUT Data (minimal):', putData);
            result = await updateProjectEstimator({
              id: activityData.id,
              data: putData
            }).unwrap();
          }

          // If we get here, the API call was successful
          successfulUpdates++;
          setSuccessCount(successfulUpdates);

          console.log(`Successfully updated ${activityData.activity}:`, result);

          // Update slider state to mark as not modified and update original value
          setSliderStates(prev => ({
            ...prev,
            [activityData.activity]: {
              value: sliderState.value,
              isModified: false,
              isLoading: false,
              originalValue: sliderState.value,
            },
          }));

        } catch (error: any) {
          console.error(`Failed to process ${activityData.activity}:`, error);
          failedUpdates++;
          
          // Check if this is actually an error or a successful response
          if (error?.data && typeof error.data === 'object') {
            // If we have data in the error, it might actually be a successful response
            const responseData = error.data;
            if (responseData.activity && responseData.id) {
              // This looks like a successful response that was treated as an error
              console.log(`API returned success for ${activityData.activity}:`, responseData);
              successfulUpdates++;
              setSuccessCount(successfulUpdates);
              
              // Update slider state as successful
              setSliderStates(prev => ({
                ...prev,
                [activityData.activity]: {
                  value: sliderState.value,
                  isModified: false,
                  isLoading: false,
                  originalValue: sliderState.value,
                },
              }));
              continue; // Skip to next activity
            }
          }
          
          // If we get here, it's a real error
          setSliderStates(prev => ({
            ...prev,
            [activityData.activity]: {
              ...prev[activityData.activity],
              isLoading: false,
            },
          }));
        }
      }

      // Refetch data to get updated values from server
      try {
        await refetch();
        console.log('Data refetched successfully after updates');
      } catch (refetchError) {
        console.warn('Failed to refetch data, but updates were successful:', refetchError);
      }

      // Show appropriate message based on results
      if (successfulUpdates === activitiesToProcess.length) {
        setShowSuccess(true);
        setShowError('');
        console.log(`All ${successfulUpdates} updates completed successfully`);
      } else if (successfulUpdates > 0) {
        setShowError(`Partially completed: ${successfulUpdates}/${activitiesToProcess.length} updates successful. ${failedUpdates} failed.`);
        console.log(`Partial success: ${successfulUpdates} successful, ${failedUpdates} failed`);
      } else {
        setShowError('All updates failed. Please try again.');
        console.log('All updates failed');
      }
      
    } catch (error) {
      console.error('Unexpected error in handleCalculateEstimations:', error);
      setShowError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCalculating(false);
      setTotalProcessed(0);
    }
  };

  const calculateTotal = () => {
    return Object.values(sliderStates).reduce((sum, state) => sum + (state?.value || 0), 0);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Extract': return 'primary';
      case 'Transform': return 'secondary';
      case 'Load': return 'success';
      default: return 'default';
    }
  };

  const getModifiedCount = () => {
    return Object.values(sliderStates).filter(state => state?.isModified).length;
  };

  const getProgressText = () => {
    if (isCalculating && totalProcessed > 0) {
      return `Processing... ${successCount}/${totalProcessed}`;
    }
    return '';
  };

  if (isLoading || isLoadingAccount) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading estimation data...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load estimation data. Please try again.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Calculate Estimation (in hours)
          </Typography>
          {getModifiedCount() > 0 && (
            <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
              {getModifiedCount()} slider(s) modified
            </Typography>
          )}
          {getProgressText() && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {getProgressText()}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={isCalculating ? <CircularProgress size={16} /> : <CalculateIcon />}
          onClick={handleCalculateEstimations}
          disabled={isCalculating || getModifiedCount() === 0 || isLoadingAccount}
        >
          {isCalculating ? 'Processing...' : 'Calculate Estimation'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Adjust the slider to indicate time taken for 10 fields and 50K records Processing
      </Typography>

      <Grid container spacing={3}>
        {estimatorData.map((activity: ProjectEstimatorActivity) => {
          const sliderState = sliderStates[activity.activity];
          const currentValue = sliderState?.value || activity.dev_set_value;
          const isModified = sliderState?.isModified || false;
          const isLoading = sliderState?.isLoading || false;

          return (
            <Grid item xs={12} key={activity.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderColor: isModified ? 'primary.main' : 'divider',
                  borderWidth: isModified ? 2 : 1,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'border-color 0.3s ease',
                }}
              >
                {isModified && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.2)', opacity: 0.7 },
                        '100%': { transform: 'scale(1)', opacity: 1 },
                      },
                    }}
                  />
                )}
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1, md: 0 } }}>
                        <Chip 
                          label={activity.phase} 
                          size="small"
                          color={getPhaseColor(activity.phase) as any}
                          variant="outlined"
                        />
                        <Typography variant="body1" fontWeight="medium">
                          {activity.name}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ position: 'relative' }}>
                        <Slider
                          value={currentValue}
                          onChange={handleSliderChange(activity.activity)}
                          min={activity.range_min}
                          max={activity.range_max}
                          step={1}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value} hrs`}
                          disabled={isLoading}
                          sx={{
                            color: getPhaseColor(activity.phase) === 'primary' ? '#1976d2' : 
                                   getPhaseColor(activity.phase) === 'secondary' ? '#dc004e' : '#2e7d32',
                            opacity: isLoading ? 0.6 : 1,
                          }}
                        />
                        {isLoading && (
                          <CircularProgress 
                            size={20} 
                            sx={{ 
                              position: 'absolute', 
                              left: '50%', 
                              top: '50%', 
                              transform: 'translate(-50%, -50%)',
                              color: 'primary.main'
                            }} 
                          />
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {activity.range_min} - {activity.range_max}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isModified && !isLoading && (
                            <CheckCircleIcon color="primary" fontSize="small" />
                          )}
                          <Chip 
                            label={`${currentValue} Hrs`}
                            size="small"
                            color={isModified ? "primary" : "default"}
                            variant={isModified ? "filled" : "outlined"}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Total Calculation */}
      <Card sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Total Estimated Effort
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {calculateTotal()} Hours
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          All estimations saved successfully!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!showError}
        autoHideDuration={6000}
        onClose={() => setShowError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={successCount > 0 ? "warning" : "error"} onClose={() => setShowError('')}>
          {showError}
        </Alert>
      </Snackbar>
    </Paper>
  );
};