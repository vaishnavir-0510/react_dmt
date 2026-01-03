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
  Alert,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

import type { RootState } from '../store';
import { useWorkspace } from '../hooks/useWorkspace';
import { useGetMigrationStatusQuery } from '../services/dashboardApi';

export const Dashboard: React.FC = () => {
  const { selectedProject, selectedEnvironment } = useSelector(
    (state: RootState) => state.app
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { workspace, currentWorkspaceProjectId } = useWorkspace();

  const [activeTab, setActiveTab] = React.useState(0);

  const {
    data: migrationData = [],
    isLoading,
    isFetching,
  } = useGetMigrationStatusQuery(
    {
      projectId: selectedProject?.id!,
      environmentId: selectedEnvironment?.id!,
    },
    {
      skip: !selectedProject || !selectedEnvironment,
    }
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  /* --------------------------------
     Data Transformations
  -------------------------------- */

  // Unique activities (columns)
  const activities = Array.from(
    new Set(migrationData.map((item) => item.activity))
  );

  // Group by object
  const groupedByObject = migrationData.reduce((acc: any, curr) => {
    if (!acc[curr.Object_name]) acc[curr.Object_name] = [];
    acc[curr.Object_name].push(curr);
    return acc;
  }, {});

  /* --------------------------------
     🔵 Overall Progress Calculation
  -------------------------------- */

  const totalActivities = migrationData.length;

  const completedActivities = migrationData.filter(
    (item) => item.completion > 0
  ).length;

  const overallProgress =
    totalActivities === 0
      ? 0
      : Math.round((completedActivities / totalActivities) * 100);

  /* --------------------------------
     Data Load Progress (per object)
  -------------------------------- */

  const dataLoadProgress = Object.keys(groupedByObject).map((objectName) => {
    const items = groupedByObject[objectName];
    const avgCompletion =
      items.reduce((sum: number, i: any) => sum + i.completion, 0) /
      items.length;

    return {
      objectName,
      progress: Math.round(avgCompletion),
    };
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      {/* Workspace Info */}
      {workspace && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">Current Workspace</Typography>
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

      {/* Project Info */}
      {selectedProject && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Currently working on: <strong>{selectedProject.name}</strong>
          </Typography>
        </Alert>
      )}

      {/* Project Details */}
      {selectedProject && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Project Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <PersonIcon /> {selectedProject.owner_name || 'N/A'}
            </Grid>
            <Grid item xs={12} md={3}>
              <CalendarIcon />{' '}
              {selectedProject.start_date
                ? formatDate(selectedProject.start_date)
                : 'N/A'}
            </Grid>
            <Grid item xs={12} md={3}>
              <CalendarIcon />{' '}
              {selectedProject.end_date
                ? formatDate(selectedProject.end_date)
                : 'N/A'}
            </Grid>
            <Grid item xs={12} md={3}>
              <BusinessIcon /> {selectedProject.client || 'N/A'}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Current Session</Typography>
              <Typography>User: {user?.user}</Typography>
              <Typography>User ID: {user?.user_id}</Typography>
              {currentWorkspaceProjectId && (
                <Typography>
                  Workspace Project ID: {currentWorkspaceProjectId}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Selected Configuration</Typography>
              <Typography>
                Project: {selectedProject?.name || 'None'}
              </Typography>
              <Typography>
                Environment: {selectedEnvironment?.name || 'None'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* -------------------------------
         🔵 Overall Migration Progress
      -------------------------------- */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight={600}>
          Overall Migration Progress
        </Typography>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{ height: 10, borderRadius: 5, mt: 1 }}
        />
        <Typography variant="caption">
          {overallProgress}% completed
        </Typography>
      </Paper>

      {/* -------------------------------
         Tabs
      -------------------------------- */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Migration Process" />
        <Tab label="Data Load Progress" />
      </Tabs>

      {/* -------------------------------
         TAB 1: Migration Process
      -------------------------------- */}
      {activeTab === 0 && (
        <Paper elevation={3} sx={{ mt: 3, p: 2, overflowX: 'auto' }}>
          {(isLoading || isFetching) && (
            <Typography>Loading migration status...</Typography>
          )}

          {!isLoading && (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: 12, textAlign: 'left' }}>
                    Object Name
                  </th>
                  {activities.map((activity) => (
                    <th key={activity} style={{ padding: 12 }}>
                      {activity}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Object.keys(groupedByObject).map((objectName) => (
                  <tr key={objectName}>
                    <td style={{ padding: 12, fontWeight: 600 }}>
                      {objectName}
                    </td>

                    {activities.map((activity) => {
                      const data = groupedByObject[objectName].find(
                        (i: any) => i.activity === activity
                      );

                      if (!data) return <td key={activity} />;

                      const completed = data.completion > 0;

                      return (
                        <td key={activity} style={{ textAlign: 'center' }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: completed ? '#1976d2' : '#fbc02d',
                              color: '#fff',
                            }}
                          >
                            {completed ? (
                              <CheckCircleIcon fontSize="small" />
                            ) : (
                              <ErrorIcon fontSize="small" />
                            )}
                          </Box>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Paper>
      )}

      {/* -------------------------------
         TAB 2: Data Load Progress
      -------------------------------- */}
      {activeTab === 1 && (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          {dataLoadProgress.map((row) => (
            <Box key={row.objectName} sx={{ mb: 3 }}>
              <Typography fontWeight={600}>
                {row.objectName}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={row.progress}
                sx={{ height: 10, borderRadius: 5, mt: 1 }}
              />

              <Typography variant="caption">
                {row.progress}%
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};
