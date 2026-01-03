// components/layout/Header.tsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Apps as AppIcon,
  Logout as LogoutIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { openSettingsMenu, switchToApplicationView, toggleSidebar,  } from '../../store/slices/appSlice';
import { ProjectDropdown } from '../common/ProjectDropdown';
import { EnvironmentDropdown } from '../common/EnvironmentDropdown';
import { ConnectorDialog } from './ConnectorDialog';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentView, currentApp, isSettingsMenuOpen, selectedProject, activeMenu } = useSelector((state: RootState) => state.app);
  const [connectorDialogOpen, setConnectorDialogOpen] = useState(false);

  const handleSettingsClick = () => {
    if (currentView === 'application') {
      // Navigate to account page FIRST, then open settings
      navigate('/account');
      dispatch(openSettingsMenu());
    } else {
      // Switch back to application view and navigate to appropriate dashboard
      dispatch(switchToApplicationView());
      if (selectedProject?.project_type === 'backup') {
        navigate('/backup/dashboard');
      } else if (selectedProject?.project_type === 'translation') {
        navigate('/translation/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleAppIconClick = () => {
    dispatch(switchToApplicationView());
    // Navigate to appropriate dashboard based on project type
    if (selectedProject?.project_type === 'backup') {
      navigate('/backup/dashboard');
    } else if (selectedProject?.project_type === 'translation') {
      navigate('/translation/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    console.log('Starting logout process...');

    try {
      // Call the logout API
      console.log('Calling logout API...');
      const result = await logout();
      console.log('Logout API successful:', result);
    } catch (error: any) {
      console.error('Logout API failed:', {
        error,
        message: error?.message,
        status: error?.status,
        data: error?.data,
        stack: error?.stack
      });

      // Log specific error details
      if (error?.data) {
        console.error('API Error Response:', error.data);
      }
      if (error?.status) {
        console.error('HTTP Status:', error.status);
      }

      // Continue with logout even if API fails
      console.log('Continuing with logout despite API failure...');
    }

    // Always clear all localStorage data and redirect
    console.log('Clearing localStorage...');
    const keysBefore = Object.keys(localStorage);
    console.log('localStorage keys before clear:', keysBefore);

    localStorage.clear();

    const keysAfter = Object.keys(localStorage);
    console.log('localStorage keys after clear:', keysAfter);

    // Delay navigation to allow logs to be visible
    console.log('🚪 LOGOUT: Waiting 3 seconds before navigation...');
    setTimeout(() => {
      console.log('🚪 LOGOUT: Now navigating to login page...');
      navigate('/login');
    }, 3000);
  };

  const getAppTitle = () => {
    if (currentView === 'settings') return 'Settings';
    
    switch (currentApp) {
      case 'backup':
        return 'Backup App';
      case 'translation':
        return 'Translation App';
      case 'migration':
      default:
        return 'Data Migration App';
    }
  };

  const getPageTitle = () => {
    if (currentView === 'settings') {
      switch (activeMenu) {
        case 'account':
          return 'Account';
        case 'user':
          return 'User Management';
        case 'project':
          return 'Project Management';
        default:
          return 'Settings';
      }
    }
    
    switch (activeMenu) {
      case 'dashboard':
        return 'Dashboard';
      case 'entities':
        return 'Entities';
      case 'management':
        return 'Management';
      case 'backup dashboard':
        return 'Backup Dashboard';
      case 'backup jobs':
        return 'Backup Jobs';
      case 'restore':
        return 'Restore';
      case 'backup history':
        return 'Backup History';
      case 'translation dashboard':
        return 'Translation Dashboard';
      case 'language packs':
        return 'Language Packs';
      case 'translation memory':
        return 'Translation Memory';
      case 'progress tracking':
        return 'Progress Tracking';
      case 'translations':
        return 'Translations';
      default:
        return getAppTitle();
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {currentView === 'settings' ? (
          <IconButton
            color="inherit"
            aria-label="back to application"
            edge="start"
            onClick={handleAppIconClick}
            sx={{ mr: 2 }}
          >
            <AppIcon />
          </IconButton>
        ) : (
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {getAppTitle()} {currentView === 'settings' ? ` - ${getPageTitle()}` : ` - ${getPageTitle()}`}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ProjectDropdown />
          <EnvironmentDropdown />
          
          <IconButton
            color="inherit"
            aria-label="connector"
            onClick={() => setConnectorDialogOpen(true)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            title="Connector"
          >
            <LinkIcon />
          </IconButton>

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

          <IconButton
            color="inherit"
            aria-label="logout"
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            title="Logout"
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <ConnectorDialog
        open={connectorDialogOpen}
        onClose={() => setConnectorDialogOpen(false)}
      />
    </AppBar>
  );
};
