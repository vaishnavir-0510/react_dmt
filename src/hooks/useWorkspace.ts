// hooks/useWorkspace.ts
import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useGetUserWorkspaceQuery,
  useGetProjectsQuery,
  useCreateWorkspaceMutation,
} from '../services/workspaceApi';
import { projectEstimatorApi } from '../services/projectEstimatorApi';
import { dashboardApi } from '../services/dashboardApi';
import { objectsApi } from '../services/objectsApi';
import { estimatorApi } from '../services/estimatorApi';
import type { RootState } from '../store';
import { setSelectedProject, setActiveMenu, switchToApplicationView } from '../store/slices/appSlice';
import type { Project, ApiProject } from '../types';

// Local storage keys
const LOCAL_WORKSPACE_KEY = 'local_workspace_project';

export const useWorkspace = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProject, currentView } = useSelector((state: RootState) => state.app);
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [createWorkspaceProject] = useCreateWorkspaceMutation();

  // Fetch user workspace
  const {
    data: workspaceData,
    isLoading: isLoadingWorkspace,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useGetUserWorkspaceQuery(undefined, {
    skip: !accessToken,
  });

  // Fetch projects list
  const {
    data: projectsData = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsQuery(undefined, {
    skip: !accessToken,
  });

  // Convert API projects to app projects format
  const convertApiProjectToAppProject = useCallback((apiProject: ApiProject): Project => {
    return {
      id: apiProject.project_id,
      name: apiProject.project_name,
      description: apiProject.description,
      status: apiProject.status,
      project_id: apiProject.project_id,
      project_name: apiProject.project_name,
      account_name: apiProject.account_name,
      active: apiProject.active,
      start_date: apiProject.start_date,
      end_date: apiProject.end_date,
      client: apiProject.client,
      client_website: apiProject.client_website,
      business_function: apiProject.business_function,
      project_type: apiProject.project_type === 'filemigration' ? 'file migration' : (apiProject.project_type as 'migration' | 'backup' | 'translation' | 'file migration'),
      owner_id: apiProject.owner_id,
      owner_name: apiProject.owner_name,
      project_manager: apiProject.project_manager,
      created_date: apiProject.created_date,
      modified_date: apiProject.modified_date,
      created_by: apiProject.created_by,
      modified_by: apiProject.modified_by,
      is_deleted: apiProject.is_deleted,
      tenant_key: apiProject.tenant_key,
      user_count: apiProject.user_count,
    };
  }, []);

  // Navigate to appropriate dashboard based on project type
  const navigateToProjectDashboard = useCallback((project: Project) => {
    // Switch to application view when navigating from settings
    dispatch(switchToApplicationView());

    switch (project.project_type) {
      case 'backup':
        navigate('/backup/dashboard');
        dispatch(setActiveMenu('backup dashboard'));
        break;
      case 'translation':
        navigate('/translation/dashboard');
        dispatch(setActiveMenu('translation dashboard'));
        break;
      case 'file migration':
        navigate('/file-migration/upload');
        dispatch(setActiveMenu('file upload'));
        break;
      case 'migration':
      default:
        navigate('/dashboard');
        dispatch(setActiveMenu('dashboard'));
        break;
    }
  }, [dispatch, navigate]);

  // Get initial project - priority: local storage -> workspace API -> first project
  const getInitialProject = useCallback(() => {
    // Check local storage first
    const localProjectId = localStorage.getItem(LOCAL_WORKSPACE_KEY);
    if (localProjectId && projectsData.length > 0) {
      const localProject = projectsData.find(p => p.project_id === localProjectId);
      if (localProject) {
        return convertApiProjectToAppProject(localProject);
      }
    }

    // Check workspace API
    if (workspaceData?.workspace?.project && projectsData.length > 0) {
      const workspaceProject = projectsData.find(p => p.project_id === workspaceData.workspace.project);
      if (workspaceProject) {
        return convertApiProjectToAppProject(workspaceProject);
      }
    }

    // Fallback to first project
    if (projectsData.length > 0) {
      return convertApiProjectToAppProject(projectsData[0]);
    }

    return null;
  }, [workspaceData, projectsData, convertApiProjectToAppProject]);

  // When both workspace and projects are loaded, set the selected project and navigate
  useEffect(() => {
    if (!isInitialized && projectsData.length > 0 && !selectedProject) {
      const initialProject = getInitialProject();
      if (initialProject) {
        dispatch(setSelectedProject(initialProject));
        navigateToProjectDashboard(initialProject);
        setIsInitialized(true);
      }
    }
  }, [workspaceData, projectsData, selectedProject, dispatch, getInitialProject, navigateToProjectDashboard, isInitialized]);

  // Function to manually switch projects (with API call to update workspace)
  const switchProject = useCallback(async (projectId: string) => {
    try {
      const apiProject = projectsData.find(p => p.project_id === projectId);
      if (!apiProject) {
        throw new Error('Project not found');
      }

      const appProject = convertApiProjectToAppProject(apiProject);

      // Save to local storage
      localStorage.setItem(LOCAL_WORKSPACE_KEY, projectId);

      // Update Redux store
      dispatch(setSelectedProject(appProject));

      // Call API to create workspace project with current environment
      const currentEnvironment = workspaceData?.workspace?.environment || undefined;
      await createWorkspaceProject({ project: projectId, environment: currentEnvironment });

      // Refetch workspace to ensure it's updated
      await refetchWorkspace();

      // Refresh project estimator data
      dispatch(projectEstimatorApi.util.invalidateTags(['ProjectEstimator']));

      // Refresh dashboard migration status data
      dispatch(dashboardApi.util.invalidateTags(['MigrationStatus']));

      // Refresh objects data
      dispatch(objectsApi.util.invalidateTags(['Objects']));

      // Refresh estimator status data
      dispatch(estimatorApi.util.invalidateTags(['Estimator']));

      // Check current location to decide navigation behavior
      const currentPath = window.location.pathname;

      // Define valid routes for each project type
      const routeMappings = {
        'migration': {
          routes: ['/dashboard', '/entities', '/management'],
          startsWith: '/migration',
          menuMapping: {
            '/dashboard': 'dashboard',
            '/entities': 'entities',
            '/management': 'management',
            '/migration': 'entities' // default for migration routes
          }
        },
        'backup': {
          routes: ['/backup/dashboard', '/backup/jobs', '/backup/restore', '/backup/history'],
          startsWith: '/backup',
          menuMapping: {
            '/backup/dashboard': 'backup dashboard',
            '/backup/jobs': 'backup jobs',
            '/backup/restore': 'restore',
            '/backup/history': 'backup history'
          }
        },
        'translation': {
          routes: ['/translation/dashboard', '/translation/languages', '/translation/memory', '/translation/progress'],
          startsWith: '/translation',
          menuMapping: {
            '/translation/dashboard': 'translation dashboard',
            '/translation/languages': 'language packs',
            '/translation/memory': 'translation memory',
            '/translation/progress': 'progress tracking'
          }
        },
        'file migration': {
          routes: ['/file-migration/upload', '/file-migration/relationship', '/file-migration/filter',
            '/file-migration/metadata', '/file-migration/cleanup', '/file-migration/transform',
            '/file-migration/mapping', '/file-migration/validate', '/file-migration/load',
            '/file-migration/error', '/file-migration/workflows'],
          startsWith: '/file-migration',
          menuMapping: {
            '/file-migration/upload': 'file upload',
            '/file-migration/relationship': 'file relationship',
            '/file-migration/filter': 'file filter',
            '/file-migration/metadata': 'file metadata',
            '/file-migration/cleanup': 'file cleanup',
            '/file-migration/transform': 'file transform',
            '/file-migration/mapping': 'file mapping',
            '/file-migration/validate': 'file validate',
            '/file-migration/load': 'file load',
            '/file-migration/error': 'file error',
            '/file-migration/workflows': 'file workflows'
          }
        }
      };

      const projectType = appProject.project_type;
      const projectTypeRoutes = projectType && routeMappings[projectType as keyof typeof routeMappings];
      if (projectTypeRoutes) {
        const isOnValidRoute = projectTypeRoutes.routes.includes(currentPath) ||
          currentPath.startsWith(projectTypeRoutes.startsWith);

        if (isOnValidRoute) {
          // Stay on current page - just update active menu based on current route
          const menuMapping = projectTypeRoutes.menuMapping as Record<string, string>;
          const menuKey = Object.keys(menuMapping).find(key =>
            currentPath === key || (key !== currentPath && currentPath.startsWith(key))
          );
          if (menuKey && menuMapping[menuKey]) {
            dispatch(setActiveMenu(menuMapping[menuKey]));
          }
          // Don't navigate - stay on current page
          return appProject;
        }
      }

      // If not on a valid route for this project type, navigate to dashboard
      navigateToProjectDashboard(appProject);

      return appProject;
    } catch (error) {
      console.error('Failed to switch project:', error);
      throw error;
    }
  }, [
    projectsData,
    convertApiProjectToAppProject,
    dispatch,
    navigateToProjectDashboard,
    currentView,
    workspaceData,
    createWorkspaceProject,
    refetchWorkspace
  ]);

  // Convert all API projects to app projects format
  const projects: Project[] = projectsData.map(convertApiProjectToAppProject);

  const currentWorkspaceProjectId = workspaceData?.workspace?.project;
  const currentWorkspaceEnvironmentId = workspaceData?.workspace?.environment;

  // Get currently selected project ID (from Redux store)
  const currentSelectedProjectId = selectedProject?.id;

  return {
    workspace: workspaceData?.workspace,
    projects,
    isLoading: isLoadingWorkspace || isLoadingProjects,
    error: workspaceError || projectsError,
    refetchWorkspace,
    refetchProjects,
    switchProject,
    currentWorkspaceProjectId,
    currentSelectedProjectId,
    currentWorkspaceEnvironmentId,
    isInitialized,
  };
};
