// components/layout/Sidebar.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Collapse,
  Chip,
  Divider,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Schema as EntitiesIcon,
  Settings as ManagementIcon,
  ExpandLess,
  ExpandMore,
  Computer as SystemIcon,
  Folder as ProjectIcon,
  Cloud as EnvironmentIcon,
  Storage as ObjectsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setActiveMenu, switchToSettingsView, setSelectedSystem, setSelectedEnvironment } from '../../store/slices/appSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import type { System, Environment, ObjectData } from '../../types';
import { useGetSystemsByProjectQuery } from '../../services/systemsApi';
import { useGetEnvironmentsByProjectQuery } from '../../services/environmentApi';
import { useGetObjectsBySystemQuery } from '../../services/objectsApi';
import { setSelectedObject } from '../../store/slices/migrationSlice';

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/dashboard' 
  },
  { 
    text: 'Entities', 
    icon: <EntitiesIcon />,
    path: '/entities' 
  },
  { 
    text: 'Management', 
    icon: <ManagementIcon />,
    path: '/management' 
  },
];

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, activeMenu, selectedProject, selectedSystem, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const [sourceSystemsOpen, setSourceSystemsOpen] = useState<{ [key: string]: boolean }>({});
  const [environmentDropdownOpen, setEnvironmentDropdownOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch systems for the selected project
  const { 
    data: systems = [], 
    isLoading: isLoadingSystems,
    error: systemsError 
  } = useGetSystemsByProjectQuery(selectedProject?.id || '', {
    skip: !selectedProject?.id,
  });

  // Fetch environments for the selected project
  const { 
    data: environments = [], 
    isLoading: isLoadingEnvironments,
    error: environmentsError 
  } = useGetEnvironmentsByProjectQuery(selectedProject?.id || '', {
    skip: !selectedProject?.id,
  });

  // Filter only source systems
  const sourceSystems = systems.filter(system => system.type === 'source');

  // Load sidebar session from localStorage on initial mount
  useEffect(() => {
    const storedSession = localStorage.getItem('sidebar_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.expandedSystems) {
          setSourceSystemsOpen(session.expandedSystems);
        }
      } catch (error) {
        console.error('Failed to load sidebar session:', error);
      }
    }
    setInitialized(true);
  }, []);

  // Auto-expand system based on current migration URL (only once when URL changes)
  useEffect(() => {
    if (initialized && selectedProject && sourceSystems.length > 0) {
      const currentPath = location.pathname;
      
      // Check if we're on a migration page
      const migrationMatch = currentPath.match(/\/migration\/([^\/]+)/);
      if (migrationMatch) {
        const objectId = migrationMatch[1];
        
        // Try to find which system contains this object from localStorage
        const storedObjects = localStorage.getItem('migration_objects');
        if (storedObjects) {
          try {
            const objects = JSON.parse(storedObjects);
            const currentObject = objects.find((obj: any) => obj.object_id === objectId);
            
            if (currentObject) {
              // Find the system that contains this object
              const systemForObject = sourceSystems.find(system => system.id === currentObject.system_id);
              if (systemForObject && !sourceSystemsOpen[systemForObject.id]) {
                // Expand this system
                setSourceSystemsOpen(prev => ({
                  ...prev,
                  [systemForObject.id]: true
                }));
                
                // Select the system
                dispatch(setSelectedSystem(systemForObject));
              }
            }
          } catch (error) {
            console.error('Error processing stored objects:', error);
          }
        }
      }
    }
  }, [location.pathname, selectedProject, sourceSystems, initialized, dispatch]);

  // Save sidebar session to localStorage when it changes
  useEffect(() => {
    if (initialized) {
      const session = {
        expandedSystems: sourceSystemsOpen,
        timestamp: Date.now()
      };
      localStorage.setItem('sidebar_session', JSON.stringify(session));
    }
  }, [sourceSystemsOpen, initialized]);

  const handleMenuClick = (menu: string, path: string) => {
    dispatch(setActiveMenu(menu));
    navigate(path);
  };

  const handleSourceSystemToggle = useCallback((systemId: string) => {
    setSourceSystemsOpen(prev => ({
      ...prev,
      [systemId]: !prev[systemId]
    }));
  }, []);

  const handleEnvironmentToggle = () => {
    setEnvironmentDropdownOpen(!environmentDropdownOpen);
  };

  const handleProjectClick = () => {
    dispatch(switchToSettingsView());
    dispatch(setActiveMenu('project'));
    navigate('/projects');
  };

  const handleSystemSelect = (system: System) => {
    dispatch(setSelectedSystem(system));
  };

  const handleEnvironmentSelect = (environment: Environment) => {
    dispatch(setSelectedEnvironment(environment));
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Reset source systems open state when project changes
  useEffect(() => {
    if (!selectedProject) {
      setSourceSystemsOpen({});
    }
  }, [selectedProject]);

  // Clear selected environment if it doesn't belong to current project
  useEffect(() => {
    if (selectedEnvironment && environments.length > 0 && !environments.some(env => env.id === selectedEnvironment.id)) {
      dispatch(setSelectedEnvironment(null));
    }
  }, [environments, selectedEnvironment, dispatch]);

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
          position: 'relative',
          height: 'calc(100vh - 64px)',
          top: 'auto',
          left: 'auto',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        
        {/* Selected Project Info */}
        {selectedProject && (
          <Box sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ProjectIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                ACTIVE PROJECT
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {selectedProject.name}
            </Typography>
            {selectedProject.description && (
              <Typography variant="caption" display="block">
                {selectedProject.description}
              </Typography>
            )}
            {selectedProject.environment && (
              <Chip 
                label={selectedProject.environment}
                size="small"
                color="secondary"
                sx={{ mt: 1, color: 'white', fontSize: '0.6rem' }}
              />
            )}
            <ListItemButton 
              onClick={handleProjectClick}
              sx={{ 
                mt: 1, 
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              <ListItemText 
                primary="Change Project"
                primaryTypographyProps={{
                  fontSize: '0.8rem',
                  fontWeight: 'medium',
                }}
              />
            </ListItemButton>
          </Box>
        )}

        <Divider />

        {/* Main Menu Items */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActiveRoute(item.path)}
                onClick={() => handleMenuClick(item.text.toLowerCase(), item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActiveRoute(item.path) ? 'primary.contrastText' : 'inherit' 
                  }}
                >
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

        {/* Source Systems Section - Only show if we have source systems */}
        {selectedProject && sourceSystems.length > 0 && (
          <List sx={{ mt: 2 }}>
            <ListItem disablePadding>
              <ListItemButton disabled sx={{ cursor: 'default' }}>
                <ListItemIcon>
                  <SystemIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Source Systems" 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            {sourceSystems.map((system) => (
              <SourceSystemItem 
                key={system.id}
                system={system}
                isOpen={!!sourceSystemsOpen[system.id]}
                onToggle={() => handleSourceSystemToggle(system.id)}
                onSystemSelect={handleSystemSelect}
                isSelected={selectedSystem?.id === system.id}
                selectedObjectId={selectedObject?.object_id}
              />
            ))}
          </List>
        )}

        {/* Show message if no source systems */}
        {selectedProject && !isLoadingSystems && sourceSystems.length === 0 && (
          <List sx={{ mt: 2 }}>
            <ListItem disablePadding>
              <ListItemButton disabled>
                <ListItemIcon>
                  <SystemIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Source Systems" 
                  secondary="No source systems found"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        )}

        {/* Environment Dropdown - Only show if we have a selected project */}
        {selectedProject && (
          <List sx={{ mt: 1 }}>
            <ListItem disablePadding>
              <ListItemButton onClick={handleEnvironmentToggle}>
                <ListItemIcon>
                  <EnvironmentIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Environments" 
                  secondary={
                    isLoadingEnvironments 
                      ? "Loading..." 
                      : selectedEnvironment?.name || `(${environments.length} environments)`
                  }
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.8rem',
                  }}
                />
                {isLoadingEnvironments ? (
                  <CircularProgress size={16} />
                ) : (
                  environmentDropdownOpen ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={environmentDropdownOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {isLoadingEnvironments ? (
                  <ListItem disablePadding>
                    <ListItemButton sx={{ pl: 4 }} disabled>
                      <CircularProgress size={16} sx={{ mr: 2 }} />
                      <ListItemText 
                        primary="Loading environments..."
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ) : environmentsError ? (
                  <ListItem disablePadding>
                    <ListItemButton sx={{ pl: 4 }} disabled>
                      <ListItemText 
                        primary="Failed to load environments"
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          color: 'error.main',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ) : environments.length === 0 ? (
                  <ListItem disablePadding>
                    <ListItemButton sx={{ pl: 4 }} disabled>
                      <ListItemText 
                        primary="No environments found"
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ) : (
                  environments.map((environment) => (
                    <ListItem key={environment.id} disablePadding>
                      <ListItemButton
                        selected={selectedEnvironment?.id === environment.id}
                        onClick={() => handleEnvironmentSelect(environment)}
                        sx={{
                          pl: 4,
                          '&.Mui-selected': {
                            backgroundColor: 'action.selected',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          },
                        }}
                      >
                        <ListItemText 
                          primary={environment.name}
                          secondary={environment.type}
                          primaryTypographyProps={{
                            fontSize: '0.85rem',
                            fontWeight: selectedEnvironment?.id === environment.id ? 'bold' : 'normal',
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.75rem',
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                          <Chip 
                            label={environment.type}
                            size="small"
                            color={
                              environment.type === 'prod' ? 'error' :
                              environment.type === 'dev' ? 'primary' :
                              environment.type === 'qa' ? 'secondary' : 'default'
                            }
                            variant="outlined"
                            sx={{ fontSize: '0.6rem' }}
                          />
                          {environment.is_prod && (
                            <Chip 
                              label="Prod"
                              size="small"
                              color="success"
                              variant="filled"
                              sx={{ fontSize: '0.6rem' }}
                            />
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            </Collapse>
          </List>
        )}
      </Box>
    </Drawer>
  );
};

// Separate component for Source System with Objects
interface SourceSystemItemProps {
  system: System;
  isOpen: boolean;
  onToggle: () => void;
  onSystemSelect: (system: System) => void;
  isSelected: boolean;
  selectedObjectId?: string;
}

const SourceSystemItem: React.FC<SourceSystemItemProps> = React.memo(({
  system,
  isOpen,
  onToggle,
  onSystemSelect,
  isSelected,
  selectedObjectId
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch objects for this specific system
  const {
    data: objects = [],
    isLoading: isLoadingObjects,
    error: objectsError,
    isFetching: isFetchingObjects
  } = useGetObjectsBySystemQuery(system.id, {
    skip: !system.id,
  });

  const handleSystemClick = () => {
    onSystemSelect(system);
    onToggle();
  };

  const handleObjectClick = useCallback((object: ObjectData) => {
    // Convert ObjectData to MigrationObject and save to store
    const migrationObject = {
      object_id: object.object_id,
      object_name: object.name,
      system_id: object.system,
      system_name: object.system_name,
      project_id: object.project,
      records_count: object.records_count,
      field_count: object.field_count,
      operation: object.operation,
      description: object.description || '',
      is_completed: object.is_completed,
    };

    dispatch(setSelectedObject(migrationObject));

    // Also store in localStorage for persistence
    try {
      const storedObjects = localStorage.getItem('migration_objects');
      let objects = storedObjects ? JSON.parse(storedObjects) : [];

      // Remove existing object with same ID if exists
      objects = objects.filter((obj: any) => obj.object_id !== object.object_id);

      // Add new object
      objects.push(migrationObject);

      localStorage.setItem('migration_objects', JSON.stringify(objects));
    } catch (error) {
      console.error('Failed to store object in localStorage:', error);
    }

    // Get current tab from URL to preserve it when switching objects
    const currentPath = location.pathname;
    const migrationMatch = currentPath.match(/\/migration\/[^\/]+\/([^\/]+)/);
    const currentTab = migrationMatch ? migrationMatch[1] : 'summary';

    // Navigate to migration layout with current tab preserved
    navigate(`/migration/${object.object_id}/${currentTab}`);
  }, [dispatch, navigate, location.pathname]);

  const completedObjectsCount = objects.filter(obj => obj.is_completed).length;
  const totalObjectsCount = objects.length;

  // Check if any object in this system is currently selected
  const hasSelectedObject = objects.some(obj => 
    selectedObjectId === obj.object_id || location.pathname.includes(`/migration/${obj.object_id}`)
  );

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton 
          onClick={handleSystemClick}
          selected={isSelected || hasSelectedObject}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'action.selected',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, ml: 1 }}>
            <Badge 
              badgeContent={totalObjectsCount} 
              color="primary" 
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: 16,
                  minWidth: 16,
                }
              }}
            >
              <SystemIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary={system.name}
            secondary={`${completedObjectsCount}/${totalObjectsCount} completed`}
            primaryTypographyProps={{
              fontSize: '0.85rem',
              fontWeight: (isSelected || hasSelectedObject) ? 'bold' : 'medium',
            }}
            secondaryTypographyProps={{
              fontSize: '0.75rem',
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoadingObjects || isFetchingObjects ? (
              <CircularProgress size={16} />
            ) : (
              <>
                {isOpen ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </Box>
        </ListItemButton>
      </ListItem>
      
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {isLoadingObjects || isFetchingObjects ? (
            <ListItem disablePadding>
              <ListItemButton sx={{ pl: 6 }} disabled>
                <CircularProgress size={16} sx={{ mr: 2 }} />
                <ListItemText 
                  primary="Loading objects..."
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ) : objectsError ? (
            <ListItem disablePadding>
              <ListItemButton sx={{ pl: 6 }} disabled>
                <ListItemText 
                  primary="Failed to load objects"
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    color: 'error.main',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ) : objects.length === 0 ? (
            <ListItem disablePadding>
              <ListItemButton sx={{ pl: 6 }} disabled>
                <ListItemText 
                  primary="No objects found"
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ) : (
            objects.map((object) => {
              const isObjectSelected = selectedObjectId === object.object_id || 
                                    location.pathname.includes(`/migration/${object.object_id}`);
              
              return (
                <ListItem key={object.object_id} disablePadding>
                  <ListItemButton
                    onClick={() => handleObjectClick(object)}
                    selected={isObjectSelected}
                    sx={{
                      pl: 6,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ObjectsIcon 
                        fontSize="small" 
                        color={isObjectSelected ? "primary" : object.is_completed ? "success" : "action"}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={object.name}
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          <Typography 
                            component="span" 
                            variant="caption" 
                            display="block"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            Records: {object.records_count} | Fields: {object.field_count}
                          </Typography>
                          <Typography 
                            component="span" 
                            variant="caption" 
                            display="block"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            Operation: {object.operation}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        fontWeight: isObjectSelected ? 'bold' : 'medium',
                      }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      <Chip 
                        label={object.operation}
                        size="small"
                        color={object.operation === 'insert' ? 'success' : 'primary'}
                        variant="outlined"
                        sx={{ fontSize: '0.55rem', height: 18 }}
                      />
                      {object.is_completed && (
                        <Chip 
                          label="Completed"
                          size="small"
                          color="success"
                          variant="filled"
                          sx={{ fontSize: '0.55rem', height: 18 }}
                        />
                      )}
                      {isObjectSelected && (
                        <Chip 
                          label="Active"
                          size="small"
                          color="primary"
                          variant="filled"
                          sx={{ fontSize: '0.55rem', height: 18 }}
                        />
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </Collapse>
    </>
  );
});

SourceSystemItem.displayName = 'SourceSystemItem';