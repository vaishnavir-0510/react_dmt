// pages/Management.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { EstimationCalculator } from '../components/management/EstimationCalculator';
import { EstimationCharts } from '../components/management/EstimationCharts';
import { ObjectEstimationTable } from '../components/management/ObjectEstimationTable';
import { PlanningSection } from '../components/management/PlanningSection';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

export const Management: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const { selectedProject } = useSelector((state: RootState) => state.app);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!selectedProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Please select a project to view management details.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Project Management
        </Typography>
        
        {/* Project Info Card - Shows on both tabs */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Typography variant="h5" component="h2" fontWeight="bold" color="primary">
                  {selectedProject.project_name || selectedProject.name}
                </Typography>
              </Grid>
              <Grid item xs>
                <Grid container spacing={4}>
                  <Grid item>
                    <Typography variant="body1" fontWeight="medium">
                      Project Owner: {selectedProject.owner_name || 'gauri06'}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" fontWeight="medium">
                      Start Date: {formatDate(selectedProject.start_date)}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" fontWeight="medium">
                      End Date: {formatDate(selectedProject.end_date)}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" fontWeight="medium">
                      Account: {selectedProject.account_name || 'Data'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Tabs for Estimation and Planning */}
      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="management tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
            },
          }}
        >
          <Tab 
            label="Estimation" 
            id="management-tab-0"
            aria-controls="management-tabpanel-0"
          />
          <Tab 
            label="Planning" 
            id="management-tab-1"
            aria-controls="management-tabpanel-1"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Estimation Content */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              {/* Left Column - Estimation Calculator with Slider */}
              <Grid item xs={12} lg={6}>
                <EstimationCalculator />
              </Grid>

              {/* Right Column - Pie Chart */}
              <Grid item xs={12} lg={6}>
                <EstimationCharts />
              </Grid>

              {/* Full Width - Object Estimation Table */}
              <Grid item xs={12}>
                <ObjectEstimationTable />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Planning Content */}
          <Box sx={{ p: 3 }}>
            <PlanningSection />
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};