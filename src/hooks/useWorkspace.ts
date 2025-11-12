import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserWorkspaceQuery, useGetProjectsQuery } from '../services/workspaceApi';
import type { RootState } from '../store';
import { setSelectedProject } from '../store/slices/appSlice';
import type { Project, ApiProject } from '../types';

export const useWorkspace = () => {
  const dispatch = useDispatch();
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const { accessToken } = useSelector((state: RootState) => state.auth);

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
  const convertApiProjectToAppProject = (apiProject: ApiProject): Project => {
    return {
      id: apiProject.project_id,
      name: apiProject.project_name,
      description: apiProject.description,
      status: apiProject.status,
      // Map all API fields
      project_id: apiProject.project_id,
      project_name: apiProject.project_name,
      account_name: apiProject.account_name,
      active: apiProject.active,
      start_date: apiProject.start_date,
      end_date: apiProject.end_date,
      client: apiProject.client,
      client_website: apiProject.client_website,
      business_function: apiProject.business_function,
      project_type: apiProject.project_type,
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
  };

  // When both workspace and projects are loaded, set the selected project
  useEffect(() => {
    if (workspaceData?.workspace?.project && projectsData.length > 0 && !selectedProject) {
      const currentProjectId = workspaceData.workspace.project;
      const currentApiProject = projectsData.find(project => 
        project.project_id === currentProjectId
      );

      if (currentApiProject) {
        const appProject = convertApiProjectToAppProject(currentApiProject);
        dispatch(setSelectedProject(appProject));
      }
    }
  }, [workspaceData, projectsData, selectedProject, dispatch]);

  // Convert all API projects to app projects format
  const projects: Project[] = projectsData.map(convertApiProjectToAppProject);

  const currentWorkspaceProjectId = workspaceData?.workspace?.project;
  const currentWorkspaceEnvironmentId = workspaceData?.workspace?.environment;

  return {
    workspace: workspaceData?.workspace,
    projects,
    isLoading: isLoadingWorkspace || isLoadingProjects,
    error: workspaceError || projectsError,
    refetchWorkspace,
    refetchProjects,
    currentWorkspaceProjectId,
    currentWorkspaceEnvironmentId,
  };
};