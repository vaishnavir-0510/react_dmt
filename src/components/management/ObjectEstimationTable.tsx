// components/management/ObjectEstimationTable.tsx
import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  useGetProjectSummaryQuery,
  type ProjectObjectEstimation
} from '../../services/projectEstimatorApi';

export const ObjectEstimationTable: React.FC = () => {
  const { data: summaryData = [], isLoading, error } = useGetProjectSummaryQuery();

  const activities = [
    'Extract',
    'Relationship',
    'Filter',
    'Metadata',
    'Cleanup',
    'Mapping',
    'Validate',
    'Transform',
    'Load',
    'Error Handling'
  ];

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>Loading object estimation data...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography color="error">Failed to load object estimation data</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
          Object Load Estimation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed effort breakdown by object and activity
        </Typography>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Object Name</TableCell>
              {activities.map((activity: string) => (
                <TableCell 
                  key={activity} 
                  align="center"
                  sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  {activity}
                </TableCell>
              ))}
              <TableCell 
                align="center"
                sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.map((object: ProjectObjectEstimation) => (
              <TableRow
                key={object.Object_name}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ fontWeight: 'medium' }}
                >
                  {object.Object_name}
                </TableCell>
                {activities.map((activity: string) => {
                  const effort = object.Info.find((info) => info.activity === activity)?.efforts || 0;
                  return (
                    <TableCell key={`${object.Object_name}-${activity}`} align="center">
                      <Chip
                        label={effort}
                        size="small"
                        variant="outlined"
                        color={effort > 100 ? 'error' : effort > 50 ? 'warning' : 'primary'}
                      />
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Chip
                    label={object.total_efforts}
                    size="medium"
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Objects
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {summaryData.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Effort
              </Typography>
              <Typography variant="h4" color="secondary" fontWeight="bold">
                {summaryData.length > 0
                  ? Math.round(summaryData.reduce((sum: number, obj: ProjectObjectEstimation) => sum + obj.total_efforts, 0) / summaryData.length)
                  : 0
                } hrs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Project Effort
              </Typography>
              <Typography variant="h4" color="success" fontWeight="bold">
                {summaryData.reduce((sum: number, obj: ProjectObjectEstimation) => sum + obj.total_efforts, 0)} hrs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};