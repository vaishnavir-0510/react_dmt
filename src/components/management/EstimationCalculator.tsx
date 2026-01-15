import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Slider,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Edit as EditIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  useGetProjectEstimatorQuery,
  useGetProjectSummaryQuery,
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
  hasError: boolean;
}

const PRIMARY_BLUE = '#2b4a83';

export const EstimationCalculator: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const { data: estimatorData = [], isLoading, error, refetch } = useGetProjectEstimatorQuery();
  const { refetch: refetchSummary } = useGetProjectSummaryQuery();
  const { data: account, refetch: refetchAccount } = useGetAccountQuery();
  
  const [createProjectEstimator] = useCreateProjectEstimatorMutation();
  const [updateProjectEstimator] = useUpdateProjectEstimatorMutation();
  const [sliderStates, setSliderStates] = useState<Record<string, SliderState>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);

  // Initialize slider states when data loads
  useEffect(() => {
    if (estimatorData.length > 0) {
      const initialStates: Record<string, SliderState> = {};
      estimatorData.forEach((activity: ProjectEstimatorActivity) => {
        const initialValue = activity.project_est_data ? activity.dev_set_value : activity.dev_recc_effort;
        initialStates[activity.activity] = {
          value: initialValue,
          isModified: false,
          isLoading: false,
          originalValue: initialValue,
          hasError: false,
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
        hasError: false,
      },
    }));
  };

  const processActivity = async (
    activityData: ProjectEstimatorActivity, 
    sliderState: SliderState,
    accountId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      if (!activityData.project_est_data) {
        // POST request for new estimation
        const postData: CreateProjectEstimatorRequest = {
          project_id: selectedProject!.id,
          account_id: accountId,
          name: activityData.name,
          activity: activityData.activity,
          phase: activityData.phase,
          recc_effort: Math.floor(activityData.dev_recc_effort).toString(),
          dev_set_value: Math.floor(sliderState.value).toString(),
        };

        await createProjectEstimator(postData).unwrap();
      } else {
        // PUT request for existing estimation
        const putData = {
          dev_set_value: Math.floor(sliderState.value),
          modified_by: userId,
        };

        await updateProjectEstimator({
          id: activityData.id,
          data: putData
        }).unwrap();
      }

      // Update slider state to mark as success
      setSliderStates(prev => ({
        ...prev,
        [activityData.activity]: {
          value: sliderState.value,
          isModified: false,
          isLoading: false,
          originalValue: sliderState.value,
          hasError: false,
        },
      }));

      return true;
    } catch (error: unknown) {
      console.error(`Failed to process ${activityData.activity}:`, error);
      
      // Update slider state to mark as error
      setSliderStates(prev => ({
        ...prev,
        [activityData.activity]: {
          ...prev[activityData.activity],
          isLoading: false,
          hasError: true,
        },
      }));

      return false;
    }
  };

  const handleCalculateEstimations = async () => {
    if (!selectedProject) {
      setShowError('Please select a project first');
      return;
    }

    setIsCalculating(true);
    setShowError('');
    setShowSuccess(false);
    setSuccessCount(0);
    setCurrentProcessingIndex(-1);

    try {
      // 1. Collect modified activities
      const modifiedActivities = estimatorData.filter(activity =>
        sliderStates[activity.activity]?.isModified
      );

      if (modifiedActivities.length === 0) {
        // Check if any activity has project_est_data = false (new project estimation)
        const hasNewEstimations = estimatorData.some(activity => !activity.project_est_data);
        
        if (!hasNewEstimations) {
          setShowError('No changes detected. Please modify at least one slider.');
          setIsCalculating(false);
          return;
        }
        // If there are new estimations, we need to process all activities
      }

      const activitiesToProcess = modifiedActivities.length > 0 ? modifiedActivities : estimatorData;
      const accountId = account?.id || '41d4357c-10c9-4048-9d31-595386c68f06';
      const userId = '877ee3bd-de6e-4b74-9328-c37bbc63d123';

      let successfulUpdates = 0;

      // 2. Process activities one by one
      for (let i = 0; i < activitiesToProcess.length; i++) {
        const activityData = activitiesToProcess[i];
        const sliderState = sliderStates[activityData.activity];
        
        // Set current processing index
        setCurrentProcessingIndex(i);
        
        // Set loading state for this specific activity
        setSliderStates(prev => ({
          ...prev,
          [activityData.activity]: {
            ...prev[activityData.activity],
            isLoading: true,
            hasError: false,
          },
        }));

        // 3. Wait for the API call to finish before moving to next
        const success = await processActivity(activityData, sliderState, accountId, userId);
        
        if (success) {
          successfulUpdates++;
          setSuccessCount(successfulUpdates);
        }
      }

      // Clear current processing index
      setCurrentProcessingIndex(-1);

      // 4. After ALL activities are processed, call GET APIs
      if (successfulUpdates > 0) {
        try {
          // Call getProjectEstimator (refetch)
          await refetch();

          // Call getProjectSummary (refetch)
          await refetchSummary();

          // Call getAccount (refetch)
          await refetchAccount();
          
          console.log('All data refetched successfully');
        } catch (refetchError) {
          console.error('Failed to refetch data:', refetchError);
          // Continue even if refetch fails
        }
      }

      // 5. Show success/failure message
      if (successfulUpdates === activitiesToProcess.length) {
        setShowSuccess(true);
      } else if (successfulUpdates > 0) {
        setShowError(`Partially completed: ${successfulUpdates}/${activitiesToProcess.length} updates successful.`);
      } else {
        setShowError('All updates failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Unexpected error in handleCalculateEstimations:', error);
      setShowError('An unexpected error occurred. Please try again.');
      setCurrentProcessingIndex(-1);
    } finally {
      setIsCalculating(false);
    }
  };

  const getModifiedCount = () => {
    return Object.values(sliderStates).filter(state => state?.isModified).length;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Failed to load estimation data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'white' }}>
      <Typography variant="body1" sx={{ mb: 4, color: '#444', fontWeight: 500 }}>
        Adjust the slider to indicate time taken for <b>10 fields</b> and <b>50K records</b> Processing
      </Typography>

      <Box sx={{ px: 2 }}>
        {estimatorData.map((activity: ProjectEstimatorActivity, index) => {
          const state = sliderStates[activity.activity];
          const defaultValue = activity.project_est_data ? activity.dev_set_value : activity.dev_recc_effort;
          const currentValue = state?.value || defaultValue;
          const isModified = state?.isModified || false;
          const isLoading = state?.isLoading || false;
          const hasError = state?.hasError || false;
          const isCurrentlyProcessing = currentProcessingIndex === index;

          return (
            <Grid container spacing={4} alignItems="center" key={activity.id} sx={{ mb: 3 }}>
              {/* Activity Name & Icon */}
              <Grid item xs={2.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#666', fontSize: '0.95rem', minWidth: '100px' }}>
                    {activity.name}
                  </Typography>
                  {isLoading ? (
                    <CircularProgress size={16} />
                  ) : hasError ? (
                    <EditIcon sx={{ color: '#f44336', fontSize: 20 }} />
                  ) : isModified ? (
                    <EditIcon sx={{ color: PRIMARY_BLUE, fontSize: 20 }} />
                  ) : (
                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                  )}
                </Box>
              </Grid>

              {/* Min Value */}
              <Grid item xs={0.5}>
                <Typography sx={{ color: '#666', textAlign: 'right', fontSize: '0.9rem' }}>
                  {activity.range_min}
                </Typography>
              </Grid>

              {/* Slider */}
              <Grid item xs={6}>
                <Slider
                  value={currentValue}
                  min={activity.range_min}
                  max={activity.range_max}
                  step={1}
                  onChange={handleSliderChange(activity.activity)}
                  disabled={isLoading || isCalculating}
                  sx={{
                    color: isCurrentlyProcessing ? PRIMARY_BLUE :
                           hasError ? '#f44336' :
                           isModified ? PRIMARY_BLUE : PRIMARY_BLUE,
                    height: 4,
                    '& .MuiSlider-thumb': {
                      width: 36,
                      height: 36,
                      backgroundColor: '#fff',
                      border: `2px solid ${isCurrentlyProcessing ? PRIMARY_BLUE :
                        hasError ? '#f44336' :
                        isModified ? PRIMARY_BLUE : PRIMARY_BLUE}`,
                      '&:before': {
                        boxShadow: 'none',
                      },
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0 0 0 8px ${isCurrentlyProcessing ? PRIMARY_BLUE :
                          hasError ? '#f44336' :
                          isModified ? PRIMARY_BLUE : PRIMARY_BLUE}22`,
                      },
                      position: 'relative',
                      overflow: 'visible',
                      '&::after': {
                        content: `"${currentValue}"`,
                        position: 'absolute',
                        top: '30px',
                        left: '25px',
                          right: '30px',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '0.75rem',
                        color: isCurrentlyProcessing ? PRIMARY_BLUE :
                              hasError ? '#f44336' :
                              isModified ? PRIMARY_BLUE : PRIMARY_BLUE,
                        fontWeight: 'bold',
                        lineHeight: 1,
                        zIndex: 1,
                      }
                    },
                    '& .MuiSlider-track': {
                      border: 'none',
                      height: 6,
                    },
                    '& .MuiSlider-rail': {
                      opacity: 0.2,
                      backgroundColor: '#bfbfbf',
                      height: 4,
                    },
                  }}
                />
              </Grid>

              {/* Max Value */}
              <Grid item xs={0.5}>
                <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                  {activity.range_max}
                </Typography>
              </Grid>

              {/* Hour Display Box */}
              <Grid item xs={2}>
                <Box
                  sx={{
                    border: `1px solid ${isCurrentlyProcessing ? PRIMARY_BLUE : 
                      hasError ? '#f44336' : 
                      isModified ? PRIMARY_BLUE : PRIMARY_BLUE}`,
                    borderRadius: '4px',
                    px: 2,
                    py: 0.5,
                    textAlign: 'center',
                    color: isCurrentlyProcessing ? PRIMARY_BLUE : 
                          hasError ? '#f44336' : 
                          isModified ? PRIMARY_BLUE : PRIMARY_BLUE,
                    width: 'fit-content',
                    minWidth: '80px',
                    ml: 'auto',
                    backgroundColor: isLoading ? `${PRIMARY_BLUE}15` : 
                                   hasError ? '#ffebee' : 'transparent',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    {currentValue} Hr.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          );
        })}
      </Box>

      <Box sx={{ 
        borderTop: '1px solid #e0e0e0', 
        mt: 4, 
        pt: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Typography sx={{ fontWeight: 500, color: '#333' }}>
          Generate object Estimation
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getModifiedCount() > 0 && (
            <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon fontSize="small" />
              {getModifiedCount()} modified
            </Typography>
          )}
          {isCalculating && currentProcessingIndex >= 0 && (
            <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={12} />
              Processing {currentProcessingIndex + 1}/{estimatorData.length}...
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleCalculateEstimations}
            disabled={isCalculating || getModifiedCount() === 0}
            sx={{
              bgcolor: PRIMARY_BLUE,
              textTransform: 'none',
              px: 4,
              minWidth: 200,
              '&:hover': { bgcolor: '#1e355e' },
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e',
              }
            }}
          >
            {isCalculating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Processing...
              </Box>
            ) : (
              'Calculate Estimations'
            )}
          </Button>
        </Box>
      </Box>

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
    </Box>
  );
};


