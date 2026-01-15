import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FilterList as FilterIcon,
  CleaningServices as CleanupIcon,
  Transform as TransformIcon,
  Map as MappingIcon,
  CheckCircle as ValidateIcon,
  CloudUpload as LoadIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  AccountTree as RelationshipIcon,
  Description as MetadataIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../store';
import { setActiveMenu, openSettingsMenu, switchToApplicationView } from '../../store/slices/appSlice';
import { ProjectDropdown } from '../common/ProjectDropdown';
import { EnvironmentDropdown } from '../common/EnvironmentDropdown';
import FileMigrationDashboard from '../filemigration/FileMigrationDashboard';
import { RelationshipTab } from '../migration/tabs/RelationshipTab';
import { FilterTab } from '../migration/tabs/FilterTab';
import { MetadataTab } from '../migration/tabs/MetadataTab';
import { CleanupTab } from '../migration/tabs/CleanupTab';
import { TransformTab } from '../migration/tabs/TransformTab';
import { MappingTab } from '../migration/tabs/MappingTab';
import { ValidateTab } from '../migration/tabs/ValidateTab';
import { LoadTab } from '../migration/tabs/LoadTab';
import { ErrorTab } from '../migration/tabs/ErrorTab';
import FileMigrationWorkflowsHistory from '../filemigration/FileMigrationWorkflowsHistory';
import { ActivityProvider } from '../migration/ActivityProvider';

const FILE_MIGRATION_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/file-migration/upload' },
  { key: 'relationship', label: 'Relationship', icon: <RelationshipIcon />, path: '/file-migration/relationship' },
  { key: 'filter', label: 'Filter', icon: <FilterIcon />, path: '/file-migration/filter' },
  { key: 'metadata', label: 'Metadata', icon: <MetadataIcon />, path: '/file-migration/metadata' },
  { key: 'cleanup', label: 'Cleanup', icon: <CleanupIcon />, path: '/file-migration/cleanup' },
  { key: 'transform', label: 'Transform', icon: <TransformIcon />, path: '/file-migration/transform' },
  { key: 'mapping', label: 'Mapping', icon: <MappingIcon />, path: '/file-migration/mapping' },
  { key: 'validate', label: 'Validate', icon: <ValidateIcon />, path: '/file-migration/validate' },
  { key: 'load', label: 'Load', icon: <LoadIcon />, path: '/file-migration/load' },
  { key: 'error', label: 'Error', icon: <ErrorIcon />, path: '/file-migration/error' },
  { key: 'workflows', label: 'Workflows History', icon: <HistoryIcon />, path: '/file-migration/workflows' },
];

export const FileMigrationLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedProject, currentView } = useSelector((state: RootState) => state.app);

  // Determine active tab based on current path
  const getActiveTab = () => {
    const currentPath = location.pathname;
    const tab = FILE_MIGRATION_TABS.find(tab => tab.path === currentPath);
    return tab ? FILE_MIGRATION_TABS.indexOf(tab) : 0;
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Set active menu when component mounts
  useEffect(() => {
    dispatch(setActiveMenu('file upload'));
  }, [dispatch]);

  const handleSettingsClick = () => {
    if (currentView === 'application') {
      // Navigate to account page FIRST, then open settings
      navigate('/account');
      dispatch(openSettingsMenu());
    } else {
      // Switch back to application view and navigate to file migration
      dispatch(switchToApplicationView());
      navigate('/file-migration/upload');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    navigate(FILE_MIGRATION_TABS[newValue].path);
  };

  const renderTabContent = () => {
    const currentPath = location.pathname;

    switch (currentPath) {
      case '/file-migration/upload':
        return <FileMigrationDashboard />;
      case '/file-migration/relationship':
        return <RelationshipTab />;
      case '/file-migration/filter':
        return <FilterTab />;
      case '/file-migration/metadata':
        return <MetadataTab />;
      case '/file-migration/cleanup':
        return <CleanupTab />;
      case '/file-migration/transform':
        return <TransformTab />;
      case '/file-migration/mapping':
        return <MappingTab />;
      case '/file-migration/validate':
        return <ValidateTab />;
      case '/file-migration/load':
        return <LoadTab />;
      case '/file-migration/error':
        return <ErrorTab />;
      case '/file-migration/workflows':
        return <FileMigrationWorkflowsHistory />;
      default:
        return <FileMigrationDashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            File Migration App - Dashboard
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ProjectDropdown />
            <EnvironmentDropdown />

            <IconButton
              color="inherit"
              aria-label="settings"
              onClick={handleSettingsClick}
              sx={{
                backgroundColor: currentView === 'settings' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Badge
                color="secondary"
                variant={currentView === 'settings' ? "dot" : "standard"}
              >
                <SettingsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Tabs */}
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 64, // Height of AppBar
        zIndex: theme.zIndex.appBar - 1
      }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              minWidth: 120,
              px: 2,
              borderRadius: '8px 8px 0 0',
              marginRight: 1,
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
          {FILE_MIGRATION_TABS.map((tab, index) => (
            <Tab
              key={tab.key}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          overflow: 'auto',
        }}
      >
        {/* Add top padding to account for the fixed header and tabs */}
        <Box sx={{ mt: 16 }}>
          <Paper
            elevation={0}
            sx={{
              minHeight: '100%',
              p: 3,
              borderRadius: 2,
            }}
          >
            <ActivityProvider>
              {renderTabContent()}
            </ActivityProvider>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};