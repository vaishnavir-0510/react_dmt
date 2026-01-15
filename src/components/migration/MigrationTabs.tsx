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
  isRevealActive: boolean;
}

export const MigrationTabs: React.FC<MigrationTabsProps> = ({ objectId, isRevealActive }) => {
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

    const tabKey = `${currentTab}-${isRevealActive}`;

    switch (currentTab) {
      case 'summary':
        return <SummaryTab key={tabKey} />;
      case 'relationship':
        return <RelationshipTab key={tabKey} />;
      case 'filter':
        return <FilterTab key={tabKey} />;
      case 'metadata':
        return <MetadataTab key={tabKey} />;
      case 'cleanup':
        return <CleanupTab key={tabKey} />;
      case 'transform':
        return <TransformTab key={tabKey} />;
      case 'mapping':
        return <MappingTab key={tabKey} />;
      case 'validate':
        return <ValidateTab key={tabKey} />;
      case 'load':
        return <LoadTab key={tabKey} />;
      case 'error':
        return <ErrorTab key={tabKey} />;
      case 'workflows':
        return <WorkflowsTab key={tabKey} />;
      default:
        return <SummaryTab key={tabKey} />;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="fullWidth"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 1,
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

      <Box sx={{ pt: 0.25, backgroundColor: '#0b378aff', flex: 1, borderRadius: '8px 8px 0 0' }}>
        <Box sx={{ backgroundColor: 'white', flex: 1, p: 1 }}>
          {renderTabContent()}
        </Box>
      </Box>
    </Paper>
  );
};