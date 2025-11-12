import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { useWorkspace } from '../../hooks/useWorkspace';
import { setSelectedEnvironment } from '../../store/slices/appSlice';
import { useGetEnvironmentsByProjectQuery } from '../../services/environmentApi';

// This component initializes workspace data when the app loads
export const WorkspaceInitializer: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { refetchWorkspace, refetchProjects, currentWorkspaceProjectId, currentWorkspaceEnvironmentId } = useWorkspace();
  const { selectedProject } = useSelector((state: RootState) => state.app);

  // Fetch environments for workspace project to set initial environment
  const { data: environments = [] } = useGetEnvironmentsByProjectQuery(
    currentWorkspaceProjectId || '', 
    { skip: !currentWorkspaceProjectId }
  );

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch workspace and projects when authenticated
      refetchWorkspace();
      refetchProjects();
    }
  }, [isAuthenticated, refetchWorkspace, refetchProjects]);

  // Set initial environment from workspace
  useEffect(() => {
    if (currentWorkspaceEnvironmentId && environments.length > 0) {
      const workspaceEnvironment = environments.find(env => env.id === currentWorkspaceEnvironmentId);
      if (workspaceEnvironment) {
        dispatch(setSelectedEnvironment(workspaceEnvironment));
      }
    }
  }, [currentWorkspaceEnvironmentId, environments, dispatch]);

  return null; // This component doesn't render anything
};