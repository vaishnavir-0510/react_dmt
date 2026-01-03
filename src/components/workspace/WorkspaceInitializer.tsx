// components/workspace/WorkspaceInitializer.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { useWorkspace } from '../../hooks/useWorkspace';
import { setSelectedEnvironment } from '../../store/slices/appSlice';
import { useGetEnvironmentsByProjectQuery } from '../../services/environmentApi';

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
      // The queries will automatically start due to the skip condition being false
      // No need to manually refetch as RTK Query handles this
    }
  }, [isAuthenticated]);

  // Set initial environment from workspace
  useEffect(() => {
    if (currentWorkspaceEnvironmentId && environments.length > 0) {
      const workspaceEnvironment = environments.find(env => env.id === currentWorkspaceEnvironmentId);
      if (workspaceEnvironment) {
        dispatch(setSelectedEnvironment(workspaceEnvironment));
      }
    }
  }, [currentWorkspaceEnvironmentId, environments, dispatch]);

  return null;
};