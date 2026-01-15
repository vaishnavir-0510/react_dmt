import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Alert,
  Stack,
  Paper,
  Avatar,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Assessment as AnalysisIcon,
  Transform as TransformIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  FilePresent as FileIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FileMigrationDashboard: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);

  // Mock data - replace with actual API calls
  const [stats, setStats] = useState({
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    totalSize: '0 MB',
    processingTime: '0 mins',
    successRate: 0,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      action: 'File uploaded',
      file: 'customer_data.csv',
      timestamp: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      action: 'Processing started',
      file: 'product_catalog.xlsx',
      timestamp: '5 minutes ago',
      status: 'processing',
    },
    {
      id: 3,
      action: 'Validation failed',
      file: 'inventory.json',
      timestamp: '10 minutes ago',
      status: 'error',
    },
  ]);

  const [fileTypesData, setFileTypesData] = useState([
    { name: 'CSV', value: 45, color: '#8884d8' },
    { name: 'Excel', value: 30, color: '#82ca9d' },
    { name: 'JSON', value: 15, color: '#ffc658' },
    { name: 'XML', value: 10, color: '#ff7300' },
  ]);

  const [processingStats, setProcessingStats] = useState([
    { name: 'Upload', completed: 100, total: 100 },
    { name: 'Analysis', completed: 85, total: 100 },
    { name: 'Transform', completed: 60, total: 100 },
    { name: 'Validate', completed: 30, total: 100 },
    { name: 'Load', completed: 0, total: 100 },
  ]);

  // Simulate loading data
  useEffect(() => {
    // In real app, fetch from API
    setStats({
      totalFiles: 156,
      processedFiles: 142,
      failedFiles: 8,
      totalSize: '2.4 GB',
      processingTime: '45 mins',
      successRate: 91,
    });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'processing':
        return <PendingIcon sx={{ color: 'primary.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'processing':
        return 'primary';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          File Migration Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage your file migration processes for {selectedProject?.name}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                <FileIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.totalFiles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                <CheckCircleIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.processedFiles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2 }}>
                <ErrorIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.failedFiles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.successRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* File Types Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                File Types Distribution
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fileTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {fileTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Progress */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Processing Pipeline Progress
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {processingStats.map((stat, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {stat.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.completed}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stat.completed}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Activity
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {recentActivity.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      {getStatusIcon(activity.status)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.file} • {activity.timestamp}
                      </Typography>
                    </Box>
                    <Chip
                      label={activity.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(activity.status) as any}
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            size="large"
            sx={{ minWidth: 150 }}
          >
            Upload Files
          </Button>
          <Button
            variant="outlined"
            startIcon={<AnalysisIcon />}
            size="large"
            sx={{ minWidth: 150 }}
          >
            Start Analysis
          </Button>
          <Button
            variant="outlined"
            startIcon={<TransformIcon />}
            size="large"
            sx={{ minWidth: 150 }}
          >
            Transform Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<StorageIcon />}
            size="large"
            sx={{ minWidth: 150 }}
          >
            Load to Storage
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default FileMigrationDashboard;