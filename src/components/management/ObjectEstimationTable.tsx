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
    <Paper elevation={3} sx={{ p: "10px" }}>
      <Box sx={{ mb: "10px" }}>
        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom sx={{ fontSize: "16px" }}>
          Object Load Estimation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "16px" }}>
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

      
    </Paper>
  );
};