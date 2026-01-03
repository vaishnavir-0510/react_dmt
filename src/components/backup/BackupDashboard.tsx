import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Stack,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetBackupStatsQuery, useGetRecentActivityQuery, useGetTopObjectsQuery } from '../../services/backupApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface BackupStats {
  objects: {
    total: number;
    change: number;
  };
  backups: {
    total: number;
    change: number;
    percentage_change: number;
  };
  last_backup: {
    object_id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    schedule_type: string;
  };
  next_scheduled: string | null;
  success_rate: number;
  fail_rate: number;
  success_count: number;
  failure_count: number;
  data_growth: Array<{
    month: string;
    gb: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const BackupDashboard: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const { data: stats, isLoading: loading, error } = useGetBackupStatsQuery();
  const { data: recentActivity } = useGetRecentActivityQuery({ page: 1, limit: 5 });
  const { data: topObjects } = useGetTopObjectsQuery({ limit: 5 });


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUpIcon sx={{ color: 'success.main' }} />;
    if (change < 0) return <ErrorIcon sx={{ color: 'error.main' }} />;
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          Error loading backup statistics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try again later
        </Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No backup statistics available
        </Typography>
      </Box>
    );
  }

  // Prepare chart data
  const successRateData = [
    { name: 'Success', value: stats.success_rate, color: '#00C49F' },
    { name: 'Failure', value: stats.fail_rate, color: '#FF8042' },
  ];

  const dataGrowthChartData = stats.data_growth.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    gb: item.gb
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Salesforce Prod Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of your backup operation for this project
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          sx={{ minWidth: 150 }}
        >
          + New Backup
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 2,
            opacity: stats.objects.total === 0 ? 0.5 : 1,
            filter: stats.objects.total === 0 ? 'grayscale(100%)' : 'none'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: stats.objects.total === 0 ? 'grey.400' : 'primary.main',
                mx: 'auto',
                mb: 2
              }}>
                <StorageIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" sx={{
                color: stats.objects.total === 0 ? 'text.disabled' : 'primary.main'
              }}>
                {stats.objects.total}
              </Typography>
              <Typography variant="body2" sx={{
                color: stats.objects.total === 0 ? 'text.disabled' : 'text.secondary'
              }} gutterBottom>
                Objects Monitored
              </Typography>
              {stats.objects.total > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {getChangeIcon(stats.objects.change)}
                  <Typography variant="caption" sx={{ color: getChangeColor(stats.objects.change) }}>
                    {stats.objects.change > 0 ? '+' : ''}{stats.objects.change}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 2,
            opacity: stats.backups.total === 0 ? 0.5 : 1,
            filter: stats.backups.total === 0 ? 'grayscale(100%)' : 'none'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: stats.backups.total === 0 ? 'grey.400' : 'success.main',
                mx: 'auto',
                mb: 2
              }}>
                <BackupIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" sx={{
                color: stats.backups.total === 0 ? 'text.disabled' : 'success.main'
              }}>
                {stats.backups.total}
              </Typography>
              <Typography variant="body2" sx={{
                color: stats.backups.total === 0 ? 'text.disabled' : 'text.secondary'
              }} gutterBottom>
                Backups
              </Typography>
              {stats.backups.total > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {getChangeIcon(stats.backups.change)}
                  <Typography variant="caption" sx={{ color: getChangeColor(stats.backups.change) }}>
                    {stats.backups.change > 0 ? '+' : ''}{stats.backups.change}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 2,
            opacity: !stats.last_backup || !stats.last_backup.start_date ? 0.5 : 1,
            filter: !stats.last_backup || !stats.last_backup.start_date ? 'grayscale(100%)' : 'none'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: !stats.last_backup || !stats.last_backup.start_date ? 'grey.400' : 'info.main',
                mx: 'auto',
                mb: 2
              }}>
                <EventIcon />
              </Avatar>
              <Typography variant="body2" sx={{
                color: !stats.last_backup || !stats.last_backup.start_date ? 'text.disabled' : 'text.secondary'
              }} gutterBottom>
                Last Backup
              </Typography>
              <Typography variant="body2" fontWeight="medium" sx={{
                color: !stats.last_backup || !stats.last_backup.start_date ? 'text.disabled' : 'text.primary'
              }}>
                {stats.last_backup?.schedule_type || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{
                color: !stats.last_backup || !stats.last_backup.start_date ? 'text.disabled' : 'text.secondary'
              }}>
                {formatDate(stats.last_backup?.start_date || null)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 2,
            opacity: !stats.next_scheduled ? 0.5 : 1,
            filter: !stats.next_scheduled ? 'grayscale(100%)' : 'none'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{
                bgcolor: !stats.next_scheduled ? 'grey.400' : 'warning.main',
                mx: 'auto',
                mb: 2
              }}>
                <ScheduleIcon />
              </Avatar>
              <Typography variant="body2" sx={{
                color: !stats.next_scheduled ? 'text.disabled' : 'text.secondary'
              }} gutterBottom>
                Next Scheduled
              </Typography>
              <Typography variant="body2" fontWeight="medium" sx={{
                color: !stats.next_scheduled ? 'text.disabled' : 'text.primary'
              }}>
                {stats.next_scheduled ? formatDate(stats.next_scheduled) : 'Not Scheduled'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3}>
        {/* Data Growth Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: 2,
            height: '100%',
            opacity: stats.data_growth.length === 0 ? 0.5 : 1,
            filter: stats.data_growth.length === 0 ? 'grayscale(100%)' : 'none'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{
                color: stats.data_growth.length === 0 ? 'text.disabled' : 'text.primary'
              }}>
                Data Growth (GB)
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {stats.data_growth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [value.toFixed(6), 'GB']} />
                      <Line
                        type="monotone"
                        dataKey="gb"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.disabled'
                  }}>
                    <Typography variant="body2">No data available</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Success Rate Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: 2,
            height: '100%',
            opacity: (stats.success_rate === 0 && stats.fail_rate === 0) ? 0.5 : 1,
            filter: (stats.success_rate === 0 && stats.fail_rate === 0) ? 'grayscale(100%)' : 'none'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{
                color: (stats.success_rate === 0 && stats.fail_rate === 0) ? 'text.disabled' : 'text.primary'
              }}>
                Backup Success Rate
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {(stats.success_rate > 0 || stats.fail_rate > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={successRateData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {successRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Rate']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.disabled'
                  }}>
                    <Typography variant="body2">No backup data available</Typography>
                  </Box>
                )}
              </Box>
              {(stats.success_rate > 0 || stats.fail_rate > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#00C49F', borderRadius: '50%' }} />
                    <Typography variant="body2">Success ({stats.success_rate}%)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#FF8042', borderRadius: '50%' }} />
                    <Typography variant="body2">Failure ({stats.fail_rate}%)</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Sections Row */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Recent Activity Table - Left Side */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Backup Activity
              </Typography>
              {recentActivity?.activity && recentActivity.activity.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Object</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Records</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Start Time</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Size</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentActivity.activity.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>{activity.object_name}</TableCell>
                          <TableCell align="right">{activity.records?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(activity.start_time).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={activity.status}
                              size="small"
                              color={activity.status === 'success' ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">{activity.size}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent activity available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Objects Chart - Right Side */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Top Objects by Records
              </Typography>
              {topObjects?.objects && topObjects.objects.length > 0 ? (
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topObjects.objects}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="object_name" type="category" width={80} />
                      <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Records']} />
                      <Bar dataKey="total_records" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 300,
                  color: 'text.disabled'
                }}>
                  <Typography variant="body2">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BackupDashboard;