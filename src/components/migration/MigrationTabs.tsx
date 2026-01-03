// components/migration/MigrationTabs.tsx
import React from 'react';
import { Paper, Tabs, Tab, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import type { RootState } from '../../store';
import { setActiveTab } from '../../store/slices/migrationSlice';
import type { MigrationTab } from '../../types';
import { RelationshipTab } from './tabs/RelationshipTab';
import { FilterTab } from './tabs/FilterTab';
import { MetadataTab } from './tabs/MetadataTab';
import { CleanupTab } from './tabs/CleanupTab';
import { MappingTab } from './tabs/MappingTab';
import { ValidateTab } from './tabs/ValidateTab';
import { LoadTab } from './tabs/LoadTab';
import { ErrorTab } from './tabs/ErrorTab';
import { WorkflowsTab } from './tabs/WorkflowsTab';

import { TransformTab } from './tabs/TransformTab';
import SummaryTab from './tabs/SummaryTab';

const tabLabels: Record<MigrationTab, string> = {  
  summary: 'Summary',
  relationship: 'Relationship',
  filter: 'Filter',
  metadata: 'Metadata',
  cleanup: 'Cleanup',
  transform: 'Transform',
  mapping: 'Mapping',
  validate: 'Validate',
  load: 'Load',
  error: 'Error',
  workflows: 'Workflows',
};

interface MigrationTabsProps {
  objectId: string;
}

export const MigrationTabs: React.FC<MigrationTabsProps> = ({ objectId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tabName } = useParams<{ tabName: MigrationTab }>();
  const { activeTab, selectedObject } = useSelector((state: RootState) => state.migration);

  const currentTab = tabName || activeTab;

  const handleTabChange = (event: React.SyntheticEvent, newValue: MigrationTab) => {
    dispatch(setActiveTab(newValue));
    navigate(`/migration/${objectId}/${newValue}`);
  };

  const renderTabContent = () => {
    if (!selectedObject) return null;

    switch (currentTab) {   
      case 'summary':
        return <SummaryTab />;
      case 'relationship':
        return <RelationshipTab />;
      case 'filter':
        return <FilterTab />;
      case 'metadata':
        return <MetadataTab />;
      case 'cleanup':
        return <CleanupTab />;
      case 'transform':
        return <TransformTab />;
      case 'mapping':
        return <MappingTab />;
      case 'validate':
        return <ValidateTab />;
      case 'load':
        return <LoadTab />;
      case 'error':
        return <ErrorTab />;
      case 'workflows':
        return <WorkflowsTab />;
      default:
        return <SummaryTab />;
    }
  };

  return (
    <Paper elevation={2}>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontWeight: 'bold',
            fontSize: '0.8rem',
            minWidth: 'auto',
            px: 2,
          },
        }}
      >
        {Object.entries(tabLabels).map(([key, label]) => (
          <Tab
            key={key}
            label={label}
            value={key}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: currentTab === key ? 'bold' : 'normal',
            }}
          />
        ))}
      </Tabs>

      <Box sx={{ p: 3, minHeight: '400px' }}>
        {renderTabContent()}
      </Box>
    </Paper>
  );
};