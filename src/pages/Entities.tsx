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
    <Box sx={{ p: 2 }}>
      {/* Main Tabs Container */}
      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="entities tabs"
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
          <SourceObjectsTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TargetObjectsTab />
        </TabPanel>
      </Paper>
    </Box>
  );
};