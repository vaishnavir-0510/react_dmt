// pages/Account.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Folder as ProjectIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { useGetAccountQuery, useUpdateAccountMutation, useGetSummaryQuery } from '../services/accountApi';
import { useGetProjectsQuery } from '../services/workspaceApi';
import { EditAccountSlideIn } from '../components/account/EditAccountSlideIn';
import type { AccountData, Summary, Project, ApiProject } from '../types';

// Helper function to convert ApiProject to Project
const convertApiProjectToProject = (apiProject: ApiProject): Project => {
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

export const Account: React.FC = () => {
  const [editSlideInOpen, setEditSlideInOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });

  // API hooks
  const { 
    data: account, 
    isLoading: isLoadingAccount, 
    error: accountError, 
    refetch: refetchAccount 
  } = useGetAccountQuery();

  const { 
    data: summary, 
    isLoading: isLoadingSummary, 
    error: summaryError 
  } = useGetSummaryQuery();

  const { 
    data: projectsData = [], 
    isLoading: isLoadingProjects, 
    error: projectsError 
  } = useGetProjectsQuery();

  const [updateAccount] = useUpdateAccountMutation();

  // Convert API projects to Project type
  const projects: Project[] = projectsData.map(convertApiProjectToProject);

  // Handle account update
  const handleUpdateAccount = async (accountData: any) => {
    try {
      await updateAccount(accountData).unwrap();
      setSnackbar({ 
        open: true, 
        message: 'Account name updated successfully', 
        severity: 'success' 
      });
      setEditSlideInOpen(false);
      refetchAccount();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update account name', 
        severity: 'error' 
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoadingAccount) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (accountError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load account information.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
        Account Settings
      </Typography>
      
      {/* Compact Account Information */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h2" fontWeight="medium">
            Account Information
          </Typography>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => setEditSlideInOpen(true)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.75rem">
                Account Name
              </Typography>
              <Typography variant="body2" fontWeight="medium" fontSize="0.9rem">
                {account?.name}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.75rem">
                Account Owner
              </Typography>
              <Typography variant="body2" fontWeight="medium" fontSize="0.9rem">
                {account?.owner}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.75rem">
                Created Date
              </Typography>
              <Typography variant="body2" fontSize="0.9rem">
                {account ? formatDate(account.created_date) : 'N/A'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" fontSize="0.75rem">
                Account ID
              </Typography>
              <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                {account?.id?.slice(0, 8)}...
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Compact Summary Cards */}
      <Typography variant="h6" component="h2" gutterBottom fontWeight="medium">
        Account Summary
      </Typography>
      
      {isLoadingSummary ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : summaryError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load summary data.
        </Alert>
      ) : (
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card elevation={1} sx={{ height: '100%', minHeight: 80 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                <BusinessIcon color="primary" sx={{ fontSize: 24, mb: 0.5 }} />
                <Typography variant="h6" component="div" fontWeight="bold" color="primary">
                  {summary?.project_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card elevation={1} sx={{ height: '100%', minHeight: 80 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                <ActiveIcon color="success" sx={{ fontSize: 24, mb: 0.5 }} />
                <Typography variant="h6" component="div" fontWeight="bold" color="success.main">
                  {summary?.active_project_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card elevation={1} sx={{ height: '100%', minHeight: 80 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                <GroupIcon color="secondary" sx={{ fontSize: 24, mb: 0.5 }} />
                <Typography variant="h6" component="div" fontWeight="bold" color="secondary.main">
                  {summary?.user_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card elevation={1} sx={{ height: '100%', minHeight: 80 }}>
              <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                <ProjectIcon color="info" sx={{ fontSize: 24, mb: 0.5 }} />
                <Typography variant="h6" component="div" fontWeight="bold" color="info.main">
                  {summary?.user_active_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Compact Projects Table */}
      <Typography variant="h6" component="h2" gutterBottom fontWeight="medium">
        Projects
      </Typography>

      {isLoadingProjects ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : projectsError ? (
        <Alert severity="error">
          Failed to load projects.
        </Alert>
      ) : (
        <Paper elevation={1}>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1 }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1 }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', py: 1 }}>Start Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.slice(0, 10).map((project: Project) => (
                  <TableRow 
                    key={project.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" fontSize="0.8rem">
                          {project.name || project.project_name}
                        </Typography>
                        {project.description && project.description !== 'None' && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                            {project.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={project.status} 
                        size="small"
                        color={
                          project.status === 'Active' ? 'success' :
                          project.status === 'InProgress' ? 'warning' :
                          'default'
                        }
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Chip 
                        label={project.project_type} 
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
                      {project.client || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
                      {project.start_date ? formatDate(project.start_date) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {projects.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No projects found
              </Typography>
            </Box>
          )}

          {projects.length > 10 && (
            <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Showing 10 of {projects.length} projects
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Slide-in Panel */}
      <EditAccountSlideIn 
        open={editSlideInOpen}
        account={account || null}
        onClose={() => setEditSlideInOpen(false)}
        onSave={handleUpdateAccount}
      />

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};