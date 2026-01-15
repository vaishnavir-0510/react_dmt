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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Button,
} from '@mui/material';

import {
  Edit as EditIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
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

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle account update
  const handleUpdateAccount = async (accountData: any) => {
    try {
      await updateAccount(accountData).unwrap();
      setSnackbar({ 
        open: true, 
        message: 'Account updated successfully', 
        severity: 'success' 
      });
      setEditSlideInOpen(false);
      refetchAccount();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update account', 
        severity: 'error' 
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate paginated projects
  const paginatedProjects = projects.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  if (isLoadingAccount) {
    return (
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (accountError) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error">
          Failed to load account information.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <Typography variant="h5" component="h1" fontWeight="600" sx={{ color: '#1a1a1a' }}>
            SETUP: Account Information
          </Typography>
          <IconButton size="small" sx={{ ml: 'auto' }}>
            <InfoIcon sx={{ color: '#666' }} />
          </IconButton>
        </Box>

        {/* Account Information Card */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            mb: 1,
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            bgcolor: '#ffffff'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Company Logo Section */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: { xs: '100%', md: 200 },
              pb: { xs: 2, md: 0 },
              pr: { xs: 0, md: 3 },
              borderRight: { xs: 'none', md: '1px solid #e0e0e0' },
              borderBottom: { xs: '1px solid #e0e0e0', md: 'none' }
            }}>
              <Typography variant="caption" sx={{ color: '#666', mb: 2, fontWeight: 500 }}>
                Company Logo
              </Typography>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#ffffff',
                  border: '2px solid #1976d2',
                }}
              >
                <Typography sx={{ color: '#1976d2', fontWeight: 600, fontSize: '1.2rem' }}>
                  LOGONAME
                </Typography>
              </Avatar>
            </Box>

            {/* Account Details Section */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight="600" sx={{ color: '#1a1a1a' }}>
                  Account Information
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setEditSlideInOpen(true)}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 1,
                    px: 2
                  }}
                >
                  Edit Account
                </Button>
              </Box>

              <Grid container spacing={3}>
                {/* Column 1 - Account Name and Account Owner */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontWeight: 500 }}>
                      Account Name:
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ color: '#1a1a1a', mb: 2.5 }}>
                      {account?.name}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontWeight: 500 }}>
                      Account Owner:
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ color: '#1a1a1a' }}>
                      {account?.owner}
                    </Typography>
                  </Box>
                </Grid>

                {/* Vertical Divider */}
                <Grid item xs={12} sm={6} md="auto" sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <Divider orientation="vertical" flexItem />
                </Grid>

                {/* Column 2 - Created Date and Created By */}
                <Grid item xs={12} sm={6} md={3.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontWeight: 500 }}>
                      Created Date:
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ color: '#1a1a1a', mb: 2.5 }}>
                      {account ? formatDate(account.created_date) : 'N/A'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontWeight: 500 }}>
                      Created By:
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ color: '#1a1a1a' }}>
                      {account?.created_by}
                    </Typography>
                  </Box>
                </Grid>

                {/* Vertical Divider */}
                <Grid item xs={12} sm={6} md="auto" sx={{ display: { xs: 'none', md: 'flex' } }}>
                  <Divider orientation="vertical" flexItem />
                </Grid>

                {/* Column 3 - Last Modified Date and Last Modified By */}
                <Grid item xs={12} sm={6} md={3.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontWeight: 500 }}>
                      Last Modified Date:
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ color: '#1a1a1a', mb: 2.5 }}>
                      {account ? formatDate(account.modified_date) : 'N/A'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5, fontWeight: 500 }}>
                      Last Modified By:
                    </Typography>
                    <Typography variant="body2" fontWeight="500" sx={{ color: '#1a1a1a' }}>
                      {account?.modified_by}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>

      {/* Summary Cards */}
      {isLoadingSummary ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : summaryError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load summary data.
        </Alert>
      ) : (
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#ffffff'
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 1.5, 
                    bgcolor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DescriptionIcon sx={{ fontSize: 28, color: '#1976d2' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="700" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                      {summary?.project_count || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Project Count
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#ffffff'
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 1.5, 
                    bgcolor: '#fff3e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 28, color: '#f57c00' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="700" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                      {summary?.active_project_count || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Active Project Count
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#ffffff'
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 1.5, 
                    bgcolor: '#e0f7fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PeopleIcon sx={{ fontSize: 28, color: '#00acc1' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="700" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                      {summary?.user_count || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      User Count
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={0} 
              sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#ffffff'
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 1.5, 
                    bgcolor: '#fce4ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PersonAddIcon sx={{ fontSize: 28, color: '#c2185b' }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="700" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                      {summary?.user_active_count || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Active User Count
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Projects Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          bgcolor: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="600" sx={{ color: '#1a1a1a' }}>
            Projects
          </Typography>
        </Box>

        {isLoadingProjects ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={30} />
          </Box>
        ) : projectsError ? (
          <Alert severity="error" sx={{ m: 1 }}>
            Failed to load projects.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: { xs: 600, md: 'auto' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 2 }}>
                      Project Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 2 }}>
                      Project Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 2 }}>
                      Owner
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 2 }}>
                      Client
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 2 }}>
                      Client Website
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.875rem', py: 2 }}>
                      Business Function
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          No projects found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project: Project, index: number) => (
                      <TableRow 
                        key={project.id}
                        sx={{
                          '&:hover': { bgcolor: '#f5f5f5' },
                          borderBottom: index === paginatedProjects.length - 1 ? 'none' : '1px solid #e0e0e0'
                        }}
                      >
                        <TableCell sx={{ py: 2, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {project.name || project.project_name}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {project.project_type}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {project.owner_name}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {project.client || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {project.client_website || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ py: 2, color: '#1a1a1a', fontSize: '0.875rem' }}>
                          {project.business_function || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Custom Pagination */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              borderTop: '1px solid #e0e0e0',
              flexWrap: 'wrap',
              gap: 2
            }}>
              {/* Left side - Showing text */}
              <Typography variant="body2" sx={{ color: '#666' }}>
                Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, projects.length)} of {projects.length} results
              </Typography>

              {/* Right side - Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Rows per page dropdown */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Project Per Page:
                  </Typography>
                  <select
                    value={rowsPerPage}
                    onChange={handleChangeRowsPerPage}
                    style={{
                      padding: '6px 32px 6px 12px',
                      border: '1px solid #00acc1',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: '#00acc1',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300acc1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </Box>

                {/* Page navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={(e) => handleChangePage(e, page - 1)}
                    disabled={page === 0}
                    size="small"
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      width: 32,
                      height: 32,
                      '&:disabled': {
                        opacity: 0.3
                      }
                    }}
                  >
                    <Typography sx={{ fontSize: '18px', color: '#666' }}>‹</Typography>
                  </IconButton>

                  {/* Page numbers */}
                  {[...Array(Math.ceil(projects.length / rowsPerPage))].map((_, index) => (
                    <Button
                      key={index}
                      onClick={(e) => handleChangePage(e, index)}
                      variant={page === index ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        minWidth: 32,
                        width: 32,
                        height: 32,
                        p: 0,
                        border: '1px solid',
                        borderColor: page === index ? '#00acc1' : '#e0e0e0',
                        bgcolor: page === index ? '#00acc1' : 'white',
                        color: page === index ? 'white' : '#666',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: page === index ? '#00acc1' : '#f5f5f5',
                          borderColor: page === index ? '#00acc1' : '#e0e0e0',
                        }
                      }}
                    >
                      {index + 1}
                    </Button>
                  ))}

                  <IconButton
                    onClick={(e) => handleChangePage(e, page + 1)}
                    disabled={page >= Math.ceil(projects.length / rowsPerPage) - 1}
                    size="small"
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      width: 32,
                      height: 32,
                      '&:disabled': {
                        opacity: 0.3
                      }
                    }}
                  >
                    <Typography sx={{ fontSize: '18px', color: '#666' }}>›</Typography>
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Paper>

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