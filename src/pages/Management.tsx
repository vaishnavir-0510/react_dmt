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
    <Box sx={{ pt: "5px", px: "10px", pb: "10px" }}>

      {/* Tabs for Estimation and Planning */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="management tabs"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
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
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
          {/* Project Info Inside Component */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Typography variant="h5" component="h2" fontWeight="bold" color="primary" sx={{ fontSize: "16px" }}>
                  Project Name: {selectedProject.project_name || selectedProject.name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      Project Owner: {selectedProject.owner_name || 'gauri06'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      Start Date: {formatDate(selectedProject.start_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      End Date: {formatDate(selectedProject.end_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      Account: {selectedProject.account_name || 'Data'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
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
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Planning Content */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
          {/* Project Info Inside Component */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Typography variant="h5" component="h2" fontWeight="bold" color="primary" sx={{ fontSize: "16px" }}>
                  Project Name: {selectedProject.project_name || selectedProject.name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      Project Owner: {selectedProject.owner_name || 'gauri06'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      Start Date: {formatDate(selectedProject.start_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      End Date: {formatDate(selectedProject.end_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body1" fontWeight="medium" sx={{ fontSize: "16px" }}>
                      Account: {selectedProject.account_name || 'Data'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <PlanningSection />
        </Paper>
      </TabPanel>
    </Box>
  );
};