// components/common/ProjectDropdown.tsx
import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Translate as TranslationIcon,
  Storage as MigrationIcon,
  Folder as FileMigrationIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useWorkspace } from '../../hooks/useWorkspace';

export const ProjectDropdown: React.FC = () => {
  const { selectedProject, currentView } = useSelector((state: RootState) => state.app);
  const { projects, switchProject, isLoading, currentWorkspaceProjectId } = useWorkspace();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleProjectSelect = (projectId: string) => {
    switchProject(projectId);
    handleCloseMenu();
  };

  const getProjectIcon = (projectType?: string) => {
    switch (projectType) {
      case 'backup':
        return <BackupIcon fontSize="small" />;
      case 'translation':
        return <TranslationIcon fontSize="small" />;
      case 'file migration':
      case 'filemigration':
        return <FileMigrationIcon fontSize="small" />;
      case 'migration':
      default:
        return <MigrationIcon fontSize="small" />;
    }
  };

  const getProjectColor = (projectType?: string) => {
    switch (projectType) {
      case 'backup':
        return 'info';
      case 'translation':
        return 'warning';
      case 'file migration':
      case 'filemigration':
        return 'secondary';
      case 'migration':
      default:
        return 'primary';
    }
  };

  // Show loading if project is not ready
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
        <CircularProgress size={20} color="inherit" />
      </Box>
    );
  }

  // In settings view, show placeholder instead of selected project
  const isSettingsView = currentView === 'settings';

  return (
    <>
      {/* 🔥 Replaced icon with a dropdown-style clickable box */}
      <Tooltip title={isSettingsView ? "Select Project" : `Current: ${selectedProject?.name || 'No project selected'}`}>
        <Box
          onClick={handleOpenMenu}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.7,
            borderRadius: 1,
            cursor: 'pointer',
            bgcolor: 'rgba(255,255,255,0.15)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.25)',
            },
          }}
        >
          {isSettingsView ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Select Project
              </Typography>
              <ExpandMoreIcon fontSize="small" />
            </>
          ) : selectedProject ? (
            <>
              {getProjectIcon(selectedProject.project_type)}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedProject.name}
              </Typography>
              <ExpandMoreIcon fontSize="small" />
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No project selected
              </Typography>
              <ExpandMoreIcon fontSize="small" />
            </>
          )}
        </Box>
      </Tooltip>

      {/* 🔥 Same menu logic (unchanged) */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            SELECT PROJECT
          </Typography>
          <Typography variant="body2" color="text.primary" fontWeight="medium">
            Current: {selectedProject?.name || 'No project selected'}
          </Typography>
        </Box>

        {projects.map((project) => {
          const isSelected = selectedProject?.id === project.id;
          const isWorkspaceProject = project.id === currentWorkspaceProjectId;

          return (
            <MenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              selected={isSelected}
              sx={{
                py: 1.5,
                borderLeft: isSelected ? 3 : 0,
                borderColor: 'primary.main',
                backgroundColor: isSelected ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemIcon>
                {getProjectIcon(project.project_type)}
              </ListItemIcon>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.project_type === 'file migration' ? 'FILE MIGRATION' : (project.project_type?.toUpperCase() || 'MIGRATION')}
                      size="small"
                      color={getProjectColor(project.project_type) as any}
                      variant="outlined"
                      sx={{ fontSize: '0.55rem', height: 18 }}
                    />
                    {isWorkspaceProject && (
                      <Chip
                        label="WORKSPACE"
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{ fontSize: '0.55rem', height: 18 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {project.description || 'No description'}
                  </Typography>
                }
              />

              {isSelected && <CheckIcon color="primary" fontSize="small" />}
            </MenuItem>
          );
        })}

        {projects.length === 0 && !isLoading && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No projects available
            </Typography>
          </MenuItem>
        )}

        {isLoading && (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading projects...</Typography>
            </Box>
          </MenuItem>
        )}

        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            • WORKSPACE: Your default project from server  
            <br />
            • Selection is saved locally
          </Typography>
        </Box>
      </Menu>
    </>
  );
};
