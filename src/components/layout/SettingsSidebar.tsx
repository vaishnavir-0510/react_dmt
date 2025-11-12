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
  Chip,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Person as UserIcon,
  Folder as ProjectIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { RootState } from '../../store';
import { setSelectedProject, switchToApplicationView, setActiveMenu } from '../../store/slices/appSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUpdateUserWorkspaceMutation } from '../../services/workspaceApi';

export const SettingsSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedProject, activeMenu } = useSelector((state: RootState) => state.app);
  const { projects, isLoading, currentWorkspaceProjectId } = useWorkspace();
  const [updateUserWorkspace] = useUpdateUserWorkspaceMutation();

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

  const handleProjectSelect = async (project: any) => {
    try {
      // Update user workspace with the selected project
      await updateUserWorkspace({ project: project.id }).unwrap();
      
      // Convert to basic Project for Redux store
      const basicProject = {
        id: project.id,
        name: project.name || project.project_name || '',
        description: project.description,
      };
      
      dispatch(setSelectedProject(basicProject));
      dispatch(switchToApplicationView());
      dispatch(setActiveMenu('dashboard'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to switch project:', error);
    }
  };

  // Check if current route is active
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
        </List>

        {/* Quick Project Selection Section */}
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            QUICK PROJECT SELECTION
          </Typography>
          
          {/* Current Selection Info */}
          {selectedProject && (
            <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'success.light', borderRadius: 1 }}>
              <Typography variant="caption" color="success.contrastText" display="block">
                Active Project:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="success.contrastText">
                {selectedProject.name}
              </Typography>
            </Box>
          )}

          {/* Project List */}
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {projects.map((project) => (
              <ListItemButton
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                selected={selectedProject?.id === project.id}
                sx={{
                  mb: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemText 
                  primary={project.name || project.project_name}
                  secondary={project.description}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: selectedProject?.id === project.id ? 'bold' : 'normal',
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
                {project.id === currentWorkspaceProjectId && (
                  <Chip 
                    label="Current" 
                    size="small" 
                    color="primary"
                    sx={{ ml: 1, fontSize: '0.6rem' }}
                  />
                )}
              </ListItemButton>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Click any project to switch and return to dashboard
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};