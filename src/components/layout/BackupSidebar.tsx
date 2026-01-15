// components/layout/BackupSidebar.tsx
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
  Backup as BackupIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setActiveMenu } from '../../store/slices/appSlice';
import { useNavigate, useLocation } from 'react-router-dom';

const backupMenuItems = [
  {
    text: 'Backup',
    icon: <BackupIcon />,
    path: '/backup/dashboard',
    menuKey: 'backup'
  },
];

export const BackupSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject } = useSelector((state: RootState) => state.app);

  const handleMenuClick = (menu: string, path: string) => {
    dispatch(setActiveMenu(menu));
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
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
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        
        {/* Project Info */}
        {selectedProject && (
          <Box sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              BACKUP PROJECT
            </Typography>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {selectedProject.name}
            </Typography>
            <Typography variant="caption" display="block">
              {selectedProject.description}
            </Typography>
          </Box>
        )}

        <Divider />

        {/* Backup Menu Items */}
        <List>
          {backupMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActiveRoute(item.path)}
                onClick={() => handleMenuClick(item.menuKey, item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'info.light',
                    color: 'info.contrastText',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    margin: '8px 12px',
                    '&:hover': {
                      backgroundColor: 'info.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'info.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: isActiveRoute(item.path) ? 'bold' : 'normal',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};