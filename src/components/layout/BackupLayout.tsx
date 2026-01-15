import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { SourceObjectsTab } from '../entities/SourceObjectsTab';
import { TargetObjectsTab } from '../entities/TargetObjectsTab';
import BackupDashboard from '../backup/BackupDashboard';
import { BackupObjectSelection } from '../backup/BackupObjectSelection';
import { BackupType } from '../backup/BackupType';
import { BackupSchedule } from '../backup/BackupSchedule';
import { BackupHistory } from '../backup/BackupHistory';


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
      id={`backup-tabpanel-${index}`}
      aria-labelledby={`backup-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

export const BackupLayout: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { selectedProject } = useSelector((state: RootState) => state.app);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Main Tabs Container */}
      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="backup tabs"
          variant="scrollable"
          scrollButtons="auto"
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
              minWidth: 120,
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
            label="Backup Dashboard"
            id="backup-tab-0"
            aria-controls="backup-tabpanel-0"
          />
          <Tab
            label="Object Selection"
            id="backup-tab-1"
            aria-controls="backup-tabpanel-1"
          />
          <Tab
            label="Backup Type"
            id="backup-tab-2"
            aria-controls="backup-tabpanel-2"
          />
          <Tab
            label="Backup Schedule"
            id="backup-tab-3"
            aria-controls="backup-tabpanel-3"
          />
          <Tab
            label="Backup History"
            id="backup-tab-4"
            aria-controls="backup-tabpanel-4"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <BackupDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <BackupObjectSelection />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <BackupType />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <BackupSchedule />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <BackupHistory />
        </TabPanel>
      </Paper>
    </Box>
  );
};