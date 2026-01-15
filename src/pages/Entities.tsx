// pages/Entities.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { SourceObjectsTab } from '../components/entities/SourceObjectsTab';
import { TargetObjectsTab } from '../components/entities/TargetObjectsTab';

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
      id={`entities-tabpanel-${index}`}
      aria-labelledby={`entities-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

export const Entities: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { selectedProject } = useSelector((state: RootState) => state.app);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 1, mb: 2 }}>
      {/* Main Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="entities tabs"
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
          label="Source Objects"
          id="entities-tab-0"
          aria-controls="entities-tabpanel-0"
        />
        <Tab
          label="Target Objects"
          id="entities-tab-1"
          aria-controls="entities-tabpanel-1"
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
          <SourceObjectsTab />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
          <TargetObjectsTab />
        </Paper>
      </TabPanel>
    </Box>
  );
};