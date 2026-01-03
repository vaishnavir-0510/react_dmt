// components/layout/TranslationSidebar.tsx
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
  Translate as TranslateIcon,
  Language as LanguageIcon,
  LibraryBooks as LibraryIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setActiveMenu } from '../../store/slices/appSlice';
import { useNavigate, useLocation } from 'react-router-dom';

const translationMenuItems = [
  {
    text: 'Translation Dashboard',
    icon: <TranslateIcon />,
    path: '/translation/dashboard',
    menuKey: 'translation dashboard'
  },
  {
    text: 'Language Packs',
    icon: <LanguageIcon />,
    path: '/translation/languages',
    menuKey: 'language packs'
  },
  {
    text: 'Translation Memory',
    icon: <LibraryIcon />,
    path: '/translation/memory',
    menuKey: 'translation memory'
  },
  {
    text: 'Progress Tracking',
    icon: <TimelineIcon />,
    path: '/translation/progress',
    menuKey: 'progress tracking'
  },
  {
    text: 'Translations',
    icon: <TranslateIcon />,
    path: '/translation/translations',
    menuKey: 'translations'
  },
];

export const TranslationSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen ,activeMenu, selectedProject } = useSelector((state: RootState) => state.app);

  const handleMenuClick = (menu: string, path: string) => {
    dispatch(setActiveMenu(menu));
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Drawer
      variant="persistent"
        open={isSidebarOpen}
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
          <Box sx={{ p: 2, backgroundColor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              TRANSLATION PROJECT
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

        {/* Translation Menu Items */}
        <List>
          {translationMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActiveRoute(item.path)}
                onClick={() => handleMenuClick(item.menuKey, item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'warning.light',
                    color: 'warning.contrastText',
                    '&:hover': {
                      backgroundColor: 'warning.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'warning.contrastText',
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