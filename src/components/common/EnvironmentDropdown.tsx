import React, { useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  CircularProgress,
  Box,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setSelectedEnvironment, clearSelectedEnvironment } from '../../store/slices/appSlice';
import { clearMigrationData } from '../../store/slices/migrationSlice';
import type { Environment } from '../../types';
import { useGetEnvironmentsByProjectQuery } from '../../services/environmentApi';
import { useUpdateEnvironmentWorkspaceMutation, useGetUserWorkspaceQuery } from '../../services/workspaceApi';
import { filterApi } from '../../services/filterApi';
import { metadataApi } from '../../services/metadataApi';
import { mappingApi } from '../../services/mappingApi';
import { validateApi } from '../../services/validateApi';
import { loadApi } from '../../services/loadApi';
import { transformApi } from '../../services/transformApi';
import { cleanupApi } from '../../services/cleanupApi';

export const EnvironmentDropdown: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedEnvironment, selectedProject, currentView } = useSelector((state: RootState) => state.app);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [updateEnvironmentWorkspace] = useUpdateEnvironmentWorkspaceMutation();
  const { refetch: refetchWorkspace } = useGetUserWorkspaceQuery(undefined, {
    skip: !accessToken,
  });

  // Function to invalidate all cached data when environment changes
  const invalidateAllCaches = () => {
    dispatch(filterApi.util.invalidateTags(['FilterData']));
    dispatch(metadataApi.util.invalidateTags(['Metadata', 'MappedObject', 'Ontology']));
    dispatch(mappingApi.util.invalidateTags(['Mapping']));
    dispatch(validateApi.util.invalidateTags(['Validate']));
    dispatch(loadApi.util.invalidateTags(['LoadIteration', 'SalesforceConnection']));
    dispatch(transformApi.util.invalidateTags(['TransformData']));
    dispatch(cleanupApi.util.invalidateTags(['Cleanup']));
  };

  // Fetch environments for the currently selected project
  const {
    data: environments = [],
    isLoading: isLoadingEnvironments,
    error: environmentsError,
    isFetching: isFetchingEnvironments
  } = useGetEnvironmentsByProjectQuery(selectedProject?.id || '', {
    skip: !selectedProject?.id, // Skip if no project is selected
  });

  // Clear selected environment when project changes
  useEffect(() => {
    if (selectedProject) {
      dispatch(clearSelectedEnvironment());
    }
  }, [selectedProject?.id, dispatch]); // Re-run when project ID changes

  // Auto-select first environment when environments load for the current project
  useEffect(() => {
    if (selectedProject && environments.length > 0 && !selectedEnvironment) {
      const firstEnvironment = environments[0];
      dispatch(setSelectedEnvironment(firstEnvironment));
      updateEnvironmentWorkspace({ environment: firstEnvironment.id })
        .unwrap()
        .then(() => refetchWorkspace())
        .catch(console.error);
    }
  }, [environments, selectedEnvironment, selectedProject, dispatch, updateEnvironmentWorkspace, refetchWorkspace]);

  // Clear selected environment if it doesn't belong to current project
  useEffect(() => {
    if (selectedEnvironment && environments.length > 0 && !environments.some(env => env.id === selectedEnvironment.id)) {
      dispatch(clearSelectedEnvironment());
    }
  }, [environments, selectedEnvironment, dispatch]);

  // Also clear if selectedEnvironment exists but is invalid
  useEffect(() => {
    if (selectedEnvironment && (!selectedEnvironment.id || !selectedEnvironment.name)) {
      dispatch(clearSelectedEnvironment());
    }
  }, [selectedEnvironment, dispatch]);

  const handleChange = (event: SelectChangeEvent) => {
    const environmentId = event.target.value;

    if (!environmentId) {
      dispatch(clearSelectedEnvironment());
      // Clear migration data when environment is cleared
      dispatch(clearMigrationData());
      // Invalidate all cached data
      invalidateAllCaches();
      return;
    }

    const environment = environments.find(env => env.id === environmentId);
    if (environment) {
      dispatch(setSelectedEnvironment(environment));
      // Clear migration data when environment changes
      dispatch(clearMigrationData());
      // Invalidate all cached data from previous environment
      invalidateAllCaches();
      updateEnvironmentWorkspace({ environment: environment.id })
        .unwrap()
        .then(() => refetchWorkspace())
        .catch(console.error);
    }
  };

  // Show "Select project first" when no project is selected
  if (!selectedProject) {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Environment</InputLabel>
        <Select label="Environment" value="" disabled>
          <MenuItem value="">
            {currentView === 'settings' ? 'Select environment' : 'Select project first'}
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  // Show loading state
  if (isLoadingEnvironments || isFetchingEnvironments) {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Environment</InputLabel>
        <Select label="Environment" value="" disabled>
          <MenuItem value="">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Loading...
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  // Show error state
  if (environmentsError) {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Environment</InputLabel>
        <Select label="Environment" value="" disabled>
          <MenuItem value="">Error loading</MenuItem>
        </Select>
      </FormControl>
    );
  }

  // Show "No environments" when project has no environments
  if (environments.length === 0) {
    return (
      <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Environment</InputLabel>
        <Select label="Environment" value="" disabled>
          <MenuItem value="">No environments</MenuItem>
        </Select>
      </FormControl>
    );
  }

  // Get current value - only show selected environment if it belongs to current project
  const getCurrentValue = (): string => {
    if (selectedEnvironment && environments.some(env => env.id === selectedEnvironment.id)) {
      return selectedEnvironment.id;
    }
    return '';
  };

  // In settings view, show placeholder instead of selected environment
  const isSettingsView = currentView === 'settings';

  return (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Environment</InputLabel>
      <Select
        value={isSettingsView ? '' : getCurrentValue()}
        onChange={handleChange}
        label="Environment"
        disabled={isSettingsView}
      >
        <MenuItem value="">
          <em>{isSettingsView ? 'Select environment' : 'Select environment'}</em>
        </MenuItem>
        {!isSettingsView && environments.map((environment) => (
          <MenuItem key={environment.id} value={environment.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{environment.name}</span>
              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                <Box
                  sx={{
                    fontSize: '0.7rem',
                    color: environment.type === 'prod' ? 'error.main' :
                      environment.type === 'dev' ? 'primary.main' :
                        environment.type === 'qa' ? 'secondary.main' : 'text.secondary',
                    fontWeight: 'bold',
                  }}
                >
                  {environment.type}
                </Box>
                {environment.is_prod && (
                  <Box
                    sx={{
                      fontSize: '0.7rem',
                      color: 'success.main',
                      fontWeight: 'bold',
                    }}
                  >
                    • Prod
                  </Box>
                )}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};