// components/layout/FileMigrationSidebar.tsx
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
  Folder as FileMigrationIcon,
  UploadFile as UploadIcon,
  Assessment as AnalysisIcon,
  Transform as TransformIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setActiveMenu } from '../../store/slices/appSlice';
import { useNavigate, useLocation } from 'react-router-dom';

const fileMigrationMenuItems = [
  {
    text: 'File Upload',
    icon: <UploadIcon />,
    path: '/file-migration/upload',
    menuKey: 'file upload'
  },
  {
    text: 'File Analysis',
    icon: <AnalysisIcon />,
    path: '/file-migration/analysis',
    menuKey: 'file analysis'
  },
  {
    text: 'File Transform',
    icon: <TransformIcon />,
    path: '/file-migration/transform',
    menuKey: 'file transform'
  },
  {
    text: 'File Storage',
    icon: <StorageIcon />,
    path: '/file-migration/storage',
    menuKey: 'file storage'
  },
];

export const FileMigrationSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {isSidebarOpen, activeMenu, selectedProject } = useSelector((state: RootState) => state.app);

  const handleMenuClick = (menu: string, path: string) => {
    dispatch(setActiveMenu(menu));
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Drawer
      variant="persistent" open={isSidebarOpen}
       sx={{
        width: isSidebarOpen ? 280 : 0,
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
          <Box sx={{ p: 2, backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              FILE MIGRATION PROJECT
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

        {/* File Migration Menu Items */}
        <List>
          {fileMigrationMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActiveRoute(item.path)}
                onClick={() => handleMenuClick(item.menuKey, item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText',
                    '&:hover': {
                      backgroundColor: 'secondary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'secondary.contrastText',
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