import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setSelectedProject, switchToApplicationView } from '../store/slices/appSlice';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import type { Project, System, Environment, ProjectUser } from '../types';
import { ProjectSlideIn } from '../components/projects/ProjectSlideIn';
import { SystemSlideIn } from '../components/projects/SystemSlideIn';
import { EnvironmentSlideIn } from '../components/projects/EnvironmentSlideIn';
import { UserSlideIn } from '../components/projects/UserSlideIn';
import {
  useGetSystemsByProjectQuery,
  useCreateSystemMutation,
  useUpdateSystemMutation,
  useDeleteSystemMutation
} from '../services/systemsApi';
import {
  useGetEnvironmentsByProjectQuery,
  useCreateEnvironmentMutation,
  useUpdateEnvironmentMutation,
  useDeleteEnvironmentMutation,
} from '../services/environmentApi';
import {
  useGetProjectUsersQuery,
  useAddUserToProjectMutation,
  useRemoveUserFromProjectMutation,
} from '../services/userApi';
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '../services/projectApi';
import {
  useGetAccountQuery,
} from '../services/accountApi';

export const Projects: React.FC = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();
   const { selectedProject } = useSelector((state: RootState) => state.app);
   const { user } = useSelector((state: RootState) => state.auth);
   const { projects, isLoading, error, refetchProjects, currentWorkspaceProjectId, switchProject } = useWorkspace();
  
  // Project states
  const [projectSlideInOpen, setProjectSlideInOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectRow, setSelectedProjectRow] = useState<Project | null>(null);
  
  // System states
  const [systemSlideInOpen, setSystemSlideInOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [selectedSystemRow, setSelectedSystemRow] = useState<System | null>(null);
  const [selectedProjectForSystems, setSelectedProjectForSystems] = useState<string | null>(null);
  
  // Environment states
  const [environmentSlideInOpen, setEnvironmentSlideInOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [selectedEnvironmentRow, setSelectedEnvironmentRow] = useState<Environment | null>(null);
  
  // User states
  const [userSlideInOpen, setUserSlideInOpen] = useState(false);
  const [selectedUserRow, setSelectedUserRow] = useState<ProjectUser | null>(null);

  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [deleteSystemDialogOpen, setDeleteSystemDialogOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState<System | null>(null);

  const [deleteEnvironmentDialogOpen, setDeleteEnvironmentDialogOpen] = useState(false);
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(null);

  // Data clearing flags for clean project switching
  const [clearDataFlag, setClearDataFlag] = useState(0);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });

  // Fetch project users
  const { 
    data: projectUsers = [], 
    isLoading: isLoadingUsers, 
    refetch: refetchUsers 
  } = useGetProjectUsersQuery(selectedProjectForSystems || '', {
    skip: !selectedProjectForSystems,
  });

  // Fetch systems when a project is selected
  const {
    data: systems = [],
    isLoading: isLoadingSystems,
    error: systemsError,
    refetch: refetchSystems
  } = useGetSystemsByProjectQuery(selectedProjectForSystems || '', {
    skip: !selectedProjectForSystems,
  });

  // Fetch environments when a project is selected
  const {
    data: environments = [],
    isLoading: isLoadingEnvironments,
    error: environmentsError,
    refetch: refetchEnvironments
  } = useGetEnvironmentsByProjectQuery(selectedProjectForSystems || '', {
    skip: !selectedProjectForSystems,
  });

  // API mutations
  const [createSystem] = useCreateSystemMutation();
  const [updateSystem] = useUpdateSystemMutation();
  const [deleteSystem] = useDeleteSystemMutation();

  const [createEnvironment] = useCreateEnvironmentMutation();
  const [updateEnvironment] = useUpdateEnvironmentMutation();
  const [deleteEnvironment] = useDeleteEnvironmentMutation();

  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const { data: accountData } = useGetAccountQuery();

  const [addUserToProject] = useAddUserToProjectMutation();
  const [removeUserFromProject] = useRemoveUserFromProjectMutation();

  // Set initial selected row to current workspace project
  useEffect(() => {
    if (currentWorkspaceProjectId && projects.length > 0 && !selectedProjectRow) {
      const currentProject = projects.find(p => p.id === currentWorkspaceProjectId);
      if (currentProject) {
        setSelectedProjectRow(currentProject);
        setSelectedProjectForSystems(currentProject.id);
      }
    }
  }, [currentWorkspaceProjectId, projects, selectedProjectRow]);

  // Clear selections and force fresh data when project changes
  useEffect(() => {
    if (selectedProjectForSystems) {
      setSelectedSystemRow(null);
      setSelectedEnvironmentRow(null);
      setSelectedUserRow(null);
    } else {
      // Clear selections when no project is selected
      setSelectedSystemRow(null);
      setSelectedEnvironmentRow(null);
      setSelectedUserRow(null);
    }
  }, [selectedProjectForSystems]);

  // Force refetch when clearDataFlag changes (project switching)
  useEffect(() => {
    if (selectedProjectForSystems && clearDataFlag > 0) {
      refetchSystems();
      refetchEnvironments();
      refetchUsers();
    }
  }, [clearDataFlag, selectedProjectForSystems, refetchSystems, refetchEnvironments, refetchUsers]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated projects
  const paginatedProjects = projects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination handlers
  const handleFirstPage = () => setPage(0);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () => setPage((prev) => Math.min(prev + 1, Math.ceil(projects.length / rowsPerPage) - 1));
  const handleLastPage = () => setPage(Math.ceil(projects.length / rowsPerPage) - 1);

  // Project handlers - UPDATED: Use local switchProject instead of API
  const handleProjectSelect = async (project: Project) => {
    try {
      // Use the local project switching method (no API call)
      await switchProject(project.id);
      
      setSnackbar({ 
        open: true, 
        message: `Switched to ${project.name || project.project_name}`, 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to switch project', 
        severity: 'error' 
      });
    }
  };

  const handleProjectRowClick = (project: Project) => {
    setSelectedProjectRow(project);
    setSelectedProjectForSystems(project.id);
    setSelectedSystemRow(null); // Reset system selection
    setSelectedEnvironmentRow(null); // Reset environment selection
    setSelectedUserRow(null); // Reset user selection

    // Increment flag to force fresh data queries
    setClearDataFlag(prev => prev + 1);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectSlideInOpen(true);
  };

  const handleEditProject = () => {
    if (selectedProjectRow) {
      setEditingProject(selectedProjectRow);
      setProjectSlideInOpen(true);
    } else {
      setSnackbar({ 
        open: true, 
        message: 'Please select a project to edit', 
        severity: 'warning'
      });
    }
  };

  // System handlers
  const handleSystemRowClick = (system: System) => {
    setSelectedSystemRow(system);
    setSelectedEnvironmentRow(null); // Reset environment selection when system is selected
    setSelectedUserRow(null); // Reset user selection
  };

  const handleAddSystem = () => {
    if (!selectedProjectForSystems) {
      setSnackbar({ 
        open: true, 
        message: 'Please select a project first', 
        severity: 'warning'
      });
      return;
    }
    setEditingSystem(null);
    setSystemSlideInOpen(true);
  };

  const handleEditSystem = () => {
    if (selectedSystemRow) {
      setEditingSystem(selectedSystemRow);
      setSystemSlideInOpen(true);
    } else {
      setSnackbar({ 
        open: true, 
        message: 'Please select a system to edit', 
        severity: 'warning'
      });
    }
  };

  const handleSaveSystem = async (systemData: any) => {
    try {
      // Get account ID and user ID
      const accountId = accountData?.id;
      const userId = user?.user_id;

      if (!accountId) {
        setSnackbar({
          open: true,
          message: 'Unable to get account information. Please try again.',
          severity: 'error'
        });
        return;
      }

      if (!userId) {
        setSnackbar({
          open: true,
          message: 'Unable to get user information. Please try again.',
          severity: 'error'
        });
        return;
      }

      // Add account and owner fields to system data
      const apiData = {
        ...systemData,
        account: accountId,
        owner: userId,
      };

      if (editingSystem) {
        await updateSystem({ id: editingSystem.id, data: apiData }).unwrap();
        setSnackbar({
          open: true,
          message: 'System updated successfully',
          severity: 'success'
        });
      } else {
        await createSystem(apiData).unwrap();
        setSnackbar({
          open: true,
          message: 'System created successfully',
          severity: 'success'
        });
      }
      setSystemSlideInOpen(false);
      setEditingSystem(null);
      refetchSystems();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save system',
        severity: 'error'
      });
    }
  };

  // Open system delete confirmation dialog
  const handleDeleteSystemClick = (system: System) => {
    setSystemToDelete(system);
    setDeleteSystemDialogOpen(true);
  };

  // Confirm delete system
  const handleConfirmDeleteSystem = async () => {
    if (!systemToDelete) return;

    try {
      await deleteSystem(systemToDelete.id).unwrap();
      setSnackbar({
        open: true,
        message: 'System deleted successfully',
        severity: 'success'
      });
      refetchSystems();
      setSelectedSystemRow(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete system',
        severity: 'error'
      });
    } finally {
      setDeleteSystemDialogOpen(false);
      setSystemToDelete(null);
    }
  };

  // Cancel system delete
  const handleCancelDeleteSystem = () => {
    setDeleteSystemDialogOpen(false);
    setSystemToDelete(null);
  };

  // Environment handlers
  const handleEnvironmentRowClick = (environment: Environment) => {
    setSelectedEnvironmentRow(environment);
    setSelectedSystemRow(null); // Reset system selection when environment is selected
    setSelectedUserRow(null); // Reset user selection
  };

  const handleAddEnvironment = () => {
    if (!selectedProjectForSystems) {
      setSnackbar({ 
        open: true, 
        message: 'Please select a project first', 
        severity: 'warning'
      });
      return;
    }
    setEditingEnvironment(null);
    setEnvironmentSlideInOpen(true);
  };

  const handleEditEnvironment = () => {
    if (selectedEnvironmentRow) {
      setEditingEnvironment(selectedEnvironmentRow);
      setEnvironmentSlideInOpen(true);
    } else {
      setSnackbar({ 
        open: true, 
        message: 'Please select an environment to edit', 
        severity: 'warning'
      });
    }
  };

  const handleSaveEnvironment = async (environmentData: any) => {
    try {
      // Get account ID and user ID
      const accountId = accountData?.id;
      const userId = user?.user_id;

      if (!accountId) {
        setSnackbar({
          open: true,
          message: 'Unable to get account information. Please try again.',
          severity: 'error'
        });
        return;
      }

      if (!userId) {
        setSnackbar({
          open: true,
          message: 'Unable to get user information. Please try again.',
          severity: 'error'
        });
        return;
      }

      // Add account and owner fields to environment data, exclude is_prod
      const { is_prod, ...environmentDataWithoutIsProd } = environmentData;
      const apiData = {
        ...environmentDataWithoutIsProd,
        account: accountId,
        owner: userId,
      };

      if (editingEnvironment) {
        await updateEnvironment({ id: editingEnvironment.id, data: apiData }).unwrap();
        setSnackbar({
          open: true,
          message: 'Environment updated successfully',
          severity: 'success'
        });
      } else {
        await createEnvironment(apiData).unwrap();
        setSnackbar({
          open: true,
          message: 'Environment created successfully',
          severity: 'success'
        });
      }
      setEnvironmentSlideInOpen(false);
      setEditingEnvironment(null);
      refetchEnvironments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to save environment',
        severity: 'error'
      });
    }
  };

  // Open environment delete confirmation dialog
  const handleDeleteEnvironmentClick = (environment: Environment) => {
    setEnvironmentToDelete(environment);
    setDeleteEnvironmentDialogOpen(true);
  };

  // Confirm delete environment
  const handleConfirmDeleteEnvironment = async () => {
    if (!environmentToDelete) return;

    try {
      await deleteEnvironment(environmentToDelete.id).unwrap();
      setSnackbar({
        open: true,
        message: 'Environment deleted successfully',
        severity: 'success'
      });
      refetchEnvironments();
      setSelectedEnvironmentRow(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete environment',
        severity: 'error'
      });
    } finally {
      setDeleteEnvironmentDialogOpen(false);
      setEnvironmentToDelete(null);
    }
  };

  // Cancel environment delete
  const handleCancelDeleteEnvironment = () => {
    setDeleteEnvironmentDialogOpen(false);
    setEnvironmentToDelete(null);
  };

  // User handlers
  const handleUserRowClick = (user: ProjectUser) => {
    setSelectedUserRow(user);
  };

  const handleAddUser = () => {
    if (!selectedProjectForSystems) {
      setSnackbar({ 
        open: true, 
        message: 'Please select a project first', 
        severity: 'warning'
      });
      return;
    }
    setUserSlideInOpen(true);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      await addUserToProject(userData).unwrap();
      setSnackbar({ 
        open: true, 
        message: 'User added to project successfully', 
        severity: 'success' 
      });
      setUserSlideInOpen(false);
      refetchUsers();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to add user to project', 
        severity: 'error' 
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedProjectForSystems) return;
    
    try {
      await removeUserFromProject({ 
        projectId: selectedProjectForSystems, 
        userId 
      }).unwrap();
      setSnackbar({ 
        open: true, 
        message: 'User removed from project successfully', 
        severity: 'success' 
      });
      refetchUsers();
      setSelectedUserRow(null);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to remove user from project', 
        severity: 'error' 
      });
    }
  };

  // Project save handler
  const handleSaveProject = async (projectData: any) => {
    try {
      // Get account ID from account API
      const accountId = accountData?.id;
      const userId = user?.user_id;

      if (!accountId) {
        setSnackbar({
          open: true,
          message: 'Unable to get account information. Please try again.',
          severity: 'error'
        });
        return;
      }

      if (!userId) {
        setSnackbar({
          open: true,
          message: 'Unable to get user information. Please try again.',
          severity: 'error'
        });
        return;
      }

      // Transform form data to API format
      const apiData = {
        project_name: projectData.project_name,
        description: projectData.description,
        account_id: accountId,
        status: projectData.status,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        client: projectData.client,
        client_website: projectData.client_website,
        business_function: projectData.business_function,
        project_type: projectData.project_type,
        owner: userId,
        project_manager: userId,
      };

      if (editingProject) {
        await updateProject({
          id: editingProject.id,
          data: apiData
        }).unwrap();
        setSnackbar({
          open: true,
          message: 'Project updated successfully',
          severity: 'success'
        });
      } else {
        await createProject(apiData).unwrap();
        setSnackbar({
          open: true,
          message: 'Project created successfully',
          severity: 'success'
        });
      }
      setProjectSlideInOpen(false);
      setEditingProject(null);
      refetchProjects();
    } catch (error) {
      setSnackbar({
        open: true,
        message: editingProject ? 'Failed to update project' : 'Failed to create project',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  // Confirm delete project
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id).unwrap();
      setSnackbar({
        open: true,
        message: 'Project deleted successfully',
        severity: 'success'
      });
      refetchProjects();
      setSelectedProjectRow(null);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete project',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load projects. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Project Management
      </Typography>

      {/* Delete Confirmation Dialogs */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-project-dialog-title"
        aria-describedby="delete-project-dialog-description"
      >
        <DialogTitle id="delete-project-dialog-title">
          Confirm Delete Project
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-project-dialog-description">
            Are you sure you want to delete the project "{projectToDelete?.name || projectToDelete?.project_name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteSystemDialogOpen}
        onClose={handleCancelDeleteSystem}
        aria-labelledby="delete-system-dialog-title"
        aria-describedby="delete-system-dialog-description"
      >
        <DialogTitle id="delete-system-dialog-title">
          Confirm Delete System
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-system-dialog-description">
            Are you sure you want to delete the system "{systemToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteSystem} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteSystem} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteEnvironmentDialogOpen}
        onClose={handleCancelDeleteEnvironment}
        aria-labelledby="delete-environment-dialog-title"
        aria-describedby="delete-environment-dialog-description"
      >
        <DialogTitle id="delete-environment-dialog-title">
          Confirm Delete Environment
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-environment-dialog-description">
            Are you sure you want to delete the environment "{environmentToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteEnvironment} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteEnvironment} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        {/* Projects Table */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Projects Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage and select projects for data migration
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />} 
                  onClick={handleEditProject}
                  disabled={!selectedProjectRow}
                >
                  Edit Project
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddProject}
                >
                  Add Project
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Project Info */}
        {selectedProject && (
          <Grid item xs={12}>
            <Card elevation={2} sx={{ backgroundColor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Current Active Project
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedProject.name}
                    </Typography>
                    {selectedProject.description && selectedProject.description !== 'None' && (
                      <Typography variant="body2">
                        {selectedProject.description}
                      </Typography>
                    )}
                    {selectedProject.project_type && (
                      <Chip
                        label={selectedProject.project_type === 'file migration' ? 'FILE MIGRATION' : selectedProject.project_type.toUpperCase()}
                        size="small"
                        color="secondary"
                        sx={{ mt: 1, color: 'white' }}
                      />
                    )}
                  </Box>
                  <Chip 
                    label="Active" 
                    color="success" 
                    variant="filled"
                    sx={{ color: 'white', fontWeight: 'bold' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper elevation={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Actions</TableCell>
                    <TableCell>Delete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProjects.map((project) => (
                    <TableRow 
                      key={project.id}
                      onClick={() => handleProjectRowClick(project)}
                      selected={selectedProjectRow?.id === project.id}
                      sx={{
                        backgroundColor: selectedProjectRow?.id === project.id ? 'action.selected' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          cursor: 'pointer',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={selectedProjectRow?.id === project.id ? 'bold' : 'normal'}>
                            {project.name || project.project_name}
                          </Typography>
                          {project.id === currentWorkspaceProjectId && (
                            <Chip 
                              label="Workspace" 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={project.description || 'No description'}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {project.description || 'No description'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{project.account_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={project.status} 
                          size="small"
                          color={
                            project.status === 'Active' ? 'success' :
                            project.status === 'InProgress' ? 'warning' :
                            'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={project.project_type === 'file migration' ? 'FILE MIGRATION' : project.project_type}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {project.start_date ? formatDate(project.start_date) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {project.end_date ? formatDate(project.end_date) : 'N/A'}
                      </TableCell>
                      <TableCell>{project.client}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectSelect(project);
                          }}
                          disabled={project.id === selectedProject?.id}
                        >
                          {project.id === selectedProject?.id ? 'Active' : 'Select'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="h6" color="text.secondary">
                    No projects found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Click "Add Project" to create your first project
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {/* Projects Pagination */}
            {projects.length > 0 && (
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Rows per page:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={rowsPerPage.toString()}
                      onChange={handleChangeRowsPerPage}
                      displayEmpty
                    >
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, projects.length)} of {projects.length}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="First Page">
                    <span>
                      <IconButton 
                        onClick={handleFirstPage}
                        disabled={page === 0}
                        size="small"
                      >
                        <FirstPage />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Previous Page">
                    <span>
                      <IconButton 
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                        size="small"
                      >
                        <KeyboardArrowLeft />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Next Page">
                    <span>
                      <IconButton 
                        onClick={handleNextPage}
                        disabled={page >= Math.ceil(projects.length / rowsPerPage) - 1}
                        size="small"
                      >
                        <KeyboardArrowRight />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Last Page">
                    <span>
                      <IconButton 
                        onClick={handleLastPage}
                        disabled={page >= Math.ceil(projects.length / rowsPerPage) - 1}
                        size="small"
                      >
                        <LastPage />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Systems Table - Only show when a project is selected */}
        {selectedProjectForSystems && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Systems for: {selectedProjectRow?.name || selectedProjectRow?.project_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage systems for the selected project
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />} 
                    onClick={handleEditSystem}
                    disabled={!selectedSystemRow}
                  >
                    Edit System
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddSystem}
                  >
                    Add System
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Paper elevation={2} sx={{ mt: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>System Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Created Date</TableCell>
                      <TableCell>Modified Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoadingSystems ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Loading systems...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (systemsError && 'status' in systemsError && systemsError.status !== 404) ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="error">
                            Failed to load systems
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : systems.length === 0 || (systemsError && 'status' in systemsError && systemsError.status === 404) ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No systems found for this project
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      systems.map((system) => (
                        <TableRow 
                          key={system.id}
                          onClick={() => handleSystemRowClick(system)}
                          selected={selectedSystemRow?.id === system.id}
                          sx={{
                            backgroundColor: selectedSystemRow?.id === system.id ? 'action.selected' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              cursor: 'pointer',
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'action.selected',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={selectedSystemRow?.id === system.id ? 'bold' : 'normal'}>
                              {system.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={system.type} 
                              size="small"
                              color={system.type === 'source' ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{system.owner_username}</TableCell>
                          <TableCell>
                            {system.created_date ? formatDate(system.created_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {system.modified_date ? formatDate(system.modified_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSystemClick(system);
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Environments Table - Only show when a project is selected */}
        {selectedProjectForSystems && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Environments for: {selectedProjectRow?.name || selectedProjectRow?.project_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage environments for the selected project
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />} 
                    onClick={handleEditEnvironment}
                    disabled={!selectedEnvironmentRow}
                  >
                    Edit Environment
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddEnvironment}
                  >
                    Add Environment
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Paper elevation={2} sx={{ mt: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Environment Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Production</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Created Date</TableCell>
                      <TableCell>Modified Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoadingEnvironments ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress size={24} />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Loading environments...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (environmentsError && 'status' in environmentsError && environmentsError.status !== 404) ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="error">
                            Failed to load environments
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : environments.length === 0 || (environmentsError && 'status' in environmentsError && environmentsError.status === 404) ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No environments found for this project
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      environments.map((environment) => (
                        <TableRow 
                          key={environment.id}
                          onClick={() => handleEnvironmentRowClick(environment)}
                          selected={selectedEnvironmentRow?.id === environment.id}
                          sx={{
                            backgroundColor: selectedEnvironmentRow?.id === environment.id ? 'action.selected' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              cursor: 'pointer',
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'action.selected',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={selectedEnvironmentRow?.id === environment.id ? 'bold' : 'normal'}>
                              {environment.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={environment.type} 
                              size="small"
                              color={
                                environment.type === 'prod' ? 'error' :
                                environment.type === 'dev' ? 'primary' :
                                environment.type === 'qa' ? 'secondary' : 'default'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={environment.is_prod ? 'Yes' : 'No'} 
                              size="small"
                              color={environment.is_prod ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{environment.owner_name}</TableCell>
                          <TableCell>
                            {environment.created_date ? formatDate(environment.created_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {environment.modified_date ? formatDate(environment.modified_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEnvironmentClick(environment);
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Users Table - Only show when a project is selected */}
        {selectedProjectForSystems && (
          <Grid item xs={12}>
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Users for: {selectedProjectRow?.name || selectedProjectRow?.project_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage users for the selected project
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddUser}
                  >
                    Add User
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Paper elevation={2} sx={{ mt: 2 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created Date</TableCell>
                      <TableCell>Modified Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Loading users...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : projectUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No users found for this project
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      projectUsers.map((user) => (
                        <TableRow 
                          key={user.user_id}
                          onClick={() => handleUserRowClick(user)}
                          selected={selectedUserRow?.user_id === user.user_id}
                          sx={{
                            backgroundColor: selectedUserRow?.user_id === user.user_id ? 'action.selected' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              cursor: 'pointer',
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'action.selected',
                            },
                          }}
                        >
                          <TableCell>
                            <Typography fontWeight={selectedUserRow?.user_id === user.user_id ? 'bold' : 'normal'}>
                              {user.firstname} {user.lastname}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.rolename} 
                              size="small"
                              color={
                                user.rolename === 'admin' ? 'error' :
                                user.rolename === 'user' ? 'primary' : 'default'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.active ? 'Active' : 'Inactive'} 
                              size="small"
                              color={user.active ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {user.created_date ? formatDate(user.created_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {user.modified_date ? formatDate(user.modified_date) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outlined" 
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveUser(user.user_id);
                              }}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Slide-in Panels */}
      <ProjectSlideIn 
        open={projectSlideInOpen}
        project={editingProject}
        onClose={() => setProjectSlideInOpen(false)}
        onSave={handleSaveProject}
      />

      <SystemSlideIn 
        open={systemSlideInOpen}
        system={editingSystem}
        projectId={selectedProjectForSystems || ''}
        onClose={() => setSystemSlideInOpen(false)}
        onSave={handleSaveSystem}
      />

      <EnvironmentSlideIn 
        open={environmentSlideInOpen}
        environment={editingEnvironment}
        projectId={selectedProjectForSystems || ''}
        onClose={() => setEnvironmentSlideInOpen(false)}
        onSave={handleSaveEnvironment}
      />

      <UserSlideIn 
        open={userSlideInOpen}
        projectId={selectedProjectForSystems || ''}
        existingUsers={projectUsers}
        onClose={() => setUserSlideInOpen(false)}
        onSave={handleSaveUser}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};