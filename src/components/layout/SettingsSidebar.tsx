// components/layout/SettingsSidebar.tsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Person as UserIcon,
  Folder as ProjectIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setActiveMenu } from '../../store/slices/appSlice';
import { useNavigate, useLocation } from 'react-router-dom';

export const SettingsSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAccountClick = () => {
    dispatch(setActiveMenu('account'));
    navigate('/account');
  };

  const handleUserClick = () => {
    dispatch(setActiveMenu('user'));
    navigate('/users');
  };

  const handleProjectClick = () => {
    dispatch(setActiveMenu('project'));
    navigate('/projects');
  };

  const handleSecurityPoliciesClick = () => {
    dispatch(setActiveMenu('security-policies'));
    navigate('/security-policies');
  };

  // Check if current route is active - use exact match for settings
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Toolbar />
      
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account and preferences
        </Typography>
      </Box>

      <Divider />

      {/* Settings Menu Items */}
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        <List>
          {/* Account */}
          <ListItem disablePadding>
            <ListItemButton 
              onClick={handleAccountClick}
              selected={isActiveRoute('/account')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  margin: '8px 12px',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>
                <AccountIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Account"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* User */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleUserClick}
              selected={isActiveRoute('/users')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  margin: '8px 12px',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>
                <UserIcon />
              </ListItemIcon>
              <ListItemText 
                primary="User Management"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Project Selection */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleProjectClick}
              selected={isActiveRoute('/projects')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  margin: '8px 12px',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>
                <ProjectIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Project Management"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* Security Policies */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleSecurityPoliciesClick}
              selected={isActiveRoute('/security-policies')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  margin: '8px 12px',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText
                primary="Security Policies"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 'medium',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};