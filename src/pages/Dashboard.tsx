// pages/Dashboard.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import type { RootState } from '../store';
import { useWorkspace } from '../hooks/useWorkspace';
import { useGetObjectEstimatorStatusQuery } from '../services/estimatorApi';
import type { ObjectEstimator } from '../types';

export const Dashboard: React.FC = () => {
  const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspace, currentWorkspaceProjectId } = useWorkspace();
  
  // Fetch estimator data
  const { 
    data: estimatorData = [], 
    isLoading: isLoadingEstimator, 
    error: estimatorError 
  } = useGetObjectEstimatorStatusQuery();

  // Group estimator data by object name
  const groupedEstimatorData = estimatorData.reduce((acc, item) => {
    if (!acc[item.Object_name]) {
      acc[item.Object_name] = [];
    }
    acc[item.Object_name].push(item);
    return acc;
  }, {} as Record<string, ObjectEstimator[]>);

  // Get all unique activities from the data
  const allActivities = Array.from(new Set(estimatorData.map(item => item.activity))).sort();

  // Calculate overall completion percentage
  const overallCompletion = estimatorData.length > 0 
    ? Math.round((estimatorData.filter(item => item.is_completed).length / estimatorData.length) * 100)
    : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityIcon = (isCompleted: boolean, completion: number) => {
    if (isCompleted) {
      return (
        <Tooltip title={`Completed (${completion}%)`}>
          <CheckCircleIcon 
            color="success" 
            fontSize="medium"
            sx={{ 
              backgroundColor: '#1976d2', // Blue background
              color: 'white',
              borderRadius: '50%',
              padding: '4px'
            }} 
          />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title={`In Progress (${completion}%)`}>
          <WarningIcon 
            color="warning" 
            fontSize="medium"
            sx={{ 
              backgroundColor: '#ff9800', // Yellow/Orange background
              color: 'white',
              borderRadius: '50%',
              padding: '4px'
            }} 
          />
        </Tooltip>
      );
    }
  };

  // Get activity status for a specific object and activity
  const getActivityStatus = (objectName: string, activity: string) => {
    const objectActivities = groupedEstimatorData[objectName] || [];
    return objectActivities.find(item => item.activity === activity);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      
      {/* Show workspace info */}
      {workspace && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Current Workspace
          </Typography>
          <Typography variant="body2">
            <strong>User:</strong> {workspace.user}
          </Typography>
          <Typography variant="body2">
            <strong>Project ID:</strong> {workspace.project}
          </Typography>
          {workspace.environment && (
            <Typography variant="body2">
              <strong>Environment:</strong> {workspace.environment}
            </Typography>
          )}
        </Alert>
      )}
      
      {/* Show selected project info prominently */}
      {selectedProject && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Currently working on: <strong>{selectedProject.name}</strong>
          </Typography>
          {selectedProject.description && selectedProject.description !== 'None' && (
            <Typography variant="body2">
              {selectedProject.description}
            </Typography>
          )}
          {selectedProject.status && (
            <Chip 
              label={selectedProject.status} 
              color={
                selectedProject.status === 'Active' ? 'success' :
                selectedProject.status === 'InProgress' ? 'warning' :
                'default'
              }
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Alert>
      )}
      
      {/* Project Details Container */}
      {selectedProject && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
            Project Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Project Owner
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedProject.owner_name || selectedProject.owner_id || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Start Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedProject.start_date ? formatDate(selectedProject.start_date) : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    End Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedProject.end_date ? formatDate(selectedProject.end_date) : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Client
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedProject.client || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Progress Bar Container */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
          Migration Progress
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              Overall Completion
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              {overallCompletion}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={overallCompletion} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: overallCompletion === 100 ? 'success.main' : 'primary.main',
                borderRadius: 5,
              }
            }}
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" fontWeight="bold" color="primary">
                {estimatorData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Activities
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                {estimatorData.filter(item => item.is_completed).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" fontWeight="bold" color="warning.main">
                {estimatorData.filter(item => !item.is_completed).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                {Object.keys(groupedEstimatorData).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Objects
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Estimator Data Table */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
          Object Migration Status
        </Typography>

        {isLoadingEstimator ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : estimatorError ? (
          <Alert severity="error">
            Failed to load migration status data.
          </Alert>
        ) : estimatorData.length === 0 ? (
          <Alert severity="info">
            No migration data available.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                    Object Name
                  </TableCell>
                  {/* Dynamic activity headers */}
                  {allActivities.map(activity => (
                    <TableCell 
                      key={activity} 
                      sx={{ fontWeight: 'bold', backgroundColor: 'grey.100', textAlign: 'center' }}
                    >
                      {activity}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100', textAlign: 'center' }}>
                    Overall Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(groupedEstimatorData).map(([objectName, activities]) => {
                  // Calculate object-specific completion
                  const completedActivities = activities.filter(activity => activity.is_completed).length;
                  const objectCompletion = activities.length > 0 
                    ? Math.round((completedActivities / activities.length) * 100)
                    : 0;

                  // Check if all activities are completed
                  const isObjectCompleted = objectCompletion === 100;

                  return (
                    <TableRow key={objectName} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {objectName}
                      </TableCell>
                      
                      {/* Dynamic activity columns */}
                      {allActivities.map(activity => {
                        const activityStatus = getActivityStatus(objectName, activity);
                        return (
                          <TableCell key={`${objectName}-${activity}`} sx={{ textAlign: 'center' }}>
                            {activityStatus ? (
                              getActivityIcon(activityStatus.is_completed, activityStatus.completion)
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                      
                      {/* Overall Status */}
                      <TableCell sx={{ textAlign: 'center' }}>
                        {getActivityIcon(isObjectCompleted, objectCompletion)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Original Dashboard Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Current Session
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {user?.user || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>User ID:</strong> {user?.user_id || 'N/A'}
              </Typography>
              {currentWorkspaceProjectId && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Workspace Project ID:</strong> {currentWorkspaceProjectId}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Selected Configuration
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Project:</strong> {selectedProject?.name || 'None selected'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Environment:</strong> {selectedEnvironment?.name || 'None selected'}
              </Typography>
              {selectedProject?.status && (
                <Typography variant="body1">
                  <strong>Project Status:</strong> {selectedProject.status}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};