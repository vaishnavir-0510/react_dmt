import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  CircularProgress,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setSelectedProject, clearSelectedEnvironment } from '../../store/slices/appSlice';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { Project } from '../../types';

export const ProjectDropdown: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const { projects, isLoading, currentWorkspaceProjectId } = useWorkspace();

  const handleChange = (event: SelectChangeEvent) => {
    const projectId = event.target.value;
    
    if (!projectId) {
      dispatch(setSelectedProject(null));
      dispatch(clearSelectedEnvironment());
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (project) {
      dispatch(setSelectedProject(project));
      // Clear environment when project changes - EnvironmentDropdown will auto-select new one
      dispatch(clearSelectedEnvironment());
    }
  };

  // Get the current value for the dropdown
  const getCurrentValue = (): string => {
    if (selectedProject?.id) {
      return selectedProject.id;
    }
    if (currentWorkspaceProjectId && projects.some(p => p.id === currentWorkspaceProjectId)) {
      return currentWorkspaceProjectId;
    }
    if (projects.length > 0) {
      return projects[0].id;
    }
    return '';
  };

  if (isLoading) {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Project</InputLabel>
        <Select label="Project" value="" disabled>
          <MenuItem value="">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Loading projects...
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (projects.length === 0) {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Project</InputLabel>
        <Select label="Project" value="" disabled>
          <MenuItem value="">No projects available</MenuItem>
        </Select>
      </FormControl>
    );
  }

  const currentValue = getCurrentValue();
  const currentProject = projects.find(p => p.id === currentValue);

  return (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Project</InputLabel>
      <Select
        value={currentValue}
        onChange={handleChange}
        label="Project"
      >
        {projects.map((project) => {
          const isCurrentWorkspace = project.id === currentWorkspaceProjectId;
          const isActive = project.status === 'Active';
          const isSelected = project.id === currentValue;
          
          return (
            <MenuItem key={project.id} value={project.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography 
                    variant="body2" 
                    noWrap 
                    sx={{ 
                      maxWidth: 120,
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}
                  >
                    {project.name || project.project_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {isCurrentWorkspace && (
                      <Chip 
                        label="Current" 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                    )}
                    {!isActive && (
                      <Chip 
                        label="Inactive" 
                        size="small" 
                        color="default"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                </Box>
                {project.description && project.description !== 'None' && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    noWrap 
                    sx={{ maxWidth: 150 }}
                  >
                    {project.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};