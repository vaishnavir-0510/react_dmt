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
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>

      {/* Project Details */}
      {selectedProject && (
        <Paper elevation={2} sx={{ p: 1, mb: 1 }}>
          <Typography variant="h5" gutterBottom>
            Project Details
          </Typography>

          <Grid container spacing={1}>
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

      {/* -------------------------------
          🔵 Overall Migration Progress
       -------------------------------- */}
      <Paper elevation={3} sx={{ p: 1, mb: 1 }}>
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
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            minHeight: 48,
            borderRadius: '8px 8px 0 0',
            marginRight: 1,
            minWidth: 'auto',
            px: 2,
            '&.Mui-selected': {
              backgroundColor: '#0b378aff',
              color: 'white',
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&.Mui-selected': {
                backgroundColor: '#0b378aff',
              },
            },
          },
          '& .MuiTabs-indicator': {
            display: 'none',
          },
        }}
      >
        <Tab label="Migration Process" />
        <Tab label="Data Load Progress" />
      </Tabs>

      {/* -------------------------------
          TAB 1: Migration Process
       -------------------------------- */}
      {activeTab === 0 && (
        <Paper elevation={3} sx={{ mt: 1, p: 1, overflowX: 'auto' }}>
          {(isLoading || isFetching) && (
            <Typography>Loading migration status...</Typography>
          )}

          {!isLoading && (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, textAlign: 'left' }}>
                    Object Name
                  </th>
                  {activities.map((activity) => (
                    <th key={activity} style={{ padding: 8 }}>
                      {activity}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Object.keys(groupedByObject).map((objectName) => (
                  <tr key={objectName}>
                    <td style={{ padding: 8, fontWeight: 600 }}>
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
        <Paper elevation={3} sx={{ mt: 1, p: 1 }}>
          {dataLoadProgress.map((row) => (
            <Box key={row.objectName} sx={{ mb: 1 }}>
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
