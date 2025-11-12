import React from 'react';
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
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { toggleSidebar, openSettingsMenu, switchToApplicationView } from '../../store/slices/appSlice';
import { ProjectDropdown } from '../common/ProjectDropdown';
import { EnvironmentDropdown } from '../common/EnvironmentDropdown';

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { currentView, isSettingsMenuOpen, selectedProject } = useSelector((state: RootState) => state.app);

  const handleSettingsClick = () => {
    if (currentView === 'application') {
      dispatch(openSettingsMenu());
    } else {
      dispatch(switchToApplicationView());
    }
  };

  const handleAppIconClick = () => {
    dispatch(switchToApplicationView());
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Show App Icon when in settings view, Menu Icon when in application view */}
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
          Data Migration App {currentView === 'settings' ? ' - Settings' : ''}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Only show project/environment dropdowns in application view */}
          {currentView === 'application' && (
            <>
              <ProjectDropdown />
              <EnvironmentDropdown />
            </>
          )}
          
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
  );
};