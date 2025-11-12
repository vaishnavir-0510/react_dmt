// pages/Users.tsx
import React, { useState } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';
import { useGetSystemUsersQuery, useInviteUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../services/usersApi';
import { InviteUserSlideIn } from '../components/users/InviteUserSlideIn';
import { EditUserSlideIn } from '../components/users/EditUserSlideIn';
import type { SystemUser } from '../types';

export const Users: React.FC = () => {
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // State for slide-ins
  const [inviteSlideInOpen, setInviteSlideInOpen] = useState(false);
  const [editSlideInOpen, setEditSlideInOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });

  // API hooks
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useGetSystemUsersQuery();

  const [inviteUser] = useInviteUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Filter out deleted users
  const activeUsers = users.filter(user => !user.is_deleted);

  // Calculate paginated users
  const paginatedUsers = activeUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFirstPage = () => setPage(0);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNextPage = () => setPage((prev) => Math.min(prev + 1, Math.ceil(activeUsers.length / rowsPerPage) - 1));
  const handleLastPage = () => setPage(Math.ceil(activeUsers.length / rowsPerPage) - 1);

  // User action handlers
  const handleInviteUser = async (userData: any) => {
    try {
      await inviteUser(userData).unwrap();
      setSnackbar({ 
        open: true, 
        message: 'User invitation sent successfully', 
        severity: 'success' 
      });
      setInviteSlideInOpen(false);
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to send invitation', 
        severity: 'error' 
      });
    }
  };

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setEditSlideInOpen(true);
  };

  const handleUpdateUser = async (userData: any) => {
    try {
      await updateUser(userData).unwrap();
      setSnackbar({ 
        open: true, 
        message: 'User updated successfully', 
        severity: 'success' 
      });
      setEditSlideInOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update user', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId).unwrap();
        setSnackbar({ 
          open: true, 
          message: 'User deleted successfully', 
          severity: 'success' 
        });
        refetch();
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: 'Failed to delete user', 
          severity: 'error' 
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
          Failed to load users. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Users Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage system users and permissions
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setInviteSlideInOpen(true)}
              >
                Invite User
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>MFA</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight="medium">
                          {user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.firstname} {user.lastname}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_no || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          size="small"
                          color={user.role === 'admin' ? 'error' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.status} 
                          size="small"
                          color={
                            user.status === 'active' ? 'success' :
                            user.status === 'inactive' ? 'default' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.mfa_active ? 'Enabled' : 'Disabled'} 
                          size="small"
                          color={user.mfa_active ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {user.is_logged_in === 'Yes' ? 'Online' : formatDate(user.modified_date)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {activeUsers.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No users found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Click "Invite User" to add your first user
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {activeUsers.length > 0 && (
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
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, activeUsers.length)} of {activeUsers.length}
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
                        disabled={page >= Math.ceil(activeUsers.length / rowsPerPage) - 1}
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
                        disabled={page >= Math.ceil(activeUsers.length / rowsPerPage) - 1}
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
      </Grid>

      {/* Slide-in Panels */}
      <InviteUserSlideIn 
        open={inviteSlideInOpen}
        onClose={() => setInviteSlideInOpen(false)}
        onSave={handleInviteUser}
      />

      <EditUserSlideIn 
        open={editSlideInOpen}
        user={selectedUser}
        onClose={() => {
          setEditSlideInOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleUpdateUser}
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