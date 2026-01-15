// components/projects/UserSlideIn.tsx
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Grid,
  Autocomplete,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { ProjectUser, SystemUser } from '../../types';
import { useGetSystemUsersQuery } from '../../services/userApi';

interface UserSlideInProps {
  open: boolean;
  projectId: string;
  existingUsers: ProjectUser[];
  onClose: () => void;
  onSave: (userData: any) => void;
}

const roles = [
  { id: 'admin', name: 'Admin' },
  { id: 'user', name: 'User' },
  { id: 'viewer', name: 'Viewer' },
];

export const UserSlideIn: React.FC<UserSlideInProps> = ({
  open,
  projectId,
  existingUsers,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: 'user',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Fetch all system users
  const { 
    data: systemUsers = [], 
    isLoading: isLoadingSystemUsers,
    error: systemUsersError,
    refetch: refetchSystemUsers
  } = useGetSystemUsersQuery();

  // Log the API response to debug
  useEffect(() => {
    if (systemUsers && systemUsers.length > 0) {
      console.log('System Users:', systemUsers);
    }
    if (systemUsersError) {
      console.error('System Users API Error:', systemUsersError);
    }
  }, [systemUsers, systemUsersError]);

  useEffect(() => {
    // Reset form when opening/closing
    setFormData({
      user_id: '',
      role_id: 'user',
    });
    setSelectedUser(null);
    setErrors({});
  }, [open]);

  // Refetch users when slide-in opens
  useEffect(() => {
    if (open) {
      refetchSystemUsers();
    }
  }, [open, refetchSystemUsers]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id) {
      newErrors.user_id = 'User is required';
    } else {
      // Check if user is already added to project
      const isUserAlreadyAdded = existingUsers.some(user => user.user_id === formData.user_id);
      if (isUserAlreadyAdded) {
        newErrors.user_id = 'This user is already added to the project';
      }
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const userData = {
        ...formData,
        project_id: projectId,
      };
      onSave(userData);
    }
  };

  const handleUserChange = (event: any, newValue: SystemUser | null) => {
    console.log('Selected user:', newValue);
    setSelectedUser(newValue);
    setFormData(prev => ({
      ...prev,
      user_id: newValue?.id || '',
    }));
    
    if (errors.user_id) {
      setErrors(prev => ({
        ...prev,
        user_id: '',
      }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role_id: value,
    }));
    
    if (errors.role_id) {
      setErrors(prev => ({
        ...prev,
        role_id: '',
      }));
    }
  };

  // Filter out already added users and inactive users
  const availableUsersFiltered = systemUsers.filter(
    (user: SystemUser) => 
      !existingUsers.some(existingUser => existingUser.user_id === user.id) &&
      user.status === 'active' &&
      !user.is_deleted
  );

  console.log('Available users:', availableUsersFiltered);
  console.log('Existing users:', existingUsers);
  console.log('All system users:', systemUsers);

  const drawerWidth = 500;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 3,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          height: '100vh',
          top: 0,
          zIndex: (theme) => theme.zIndex.drawer + 3,
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: (theme) => theme.zIndex.drawer + 2,
        }
      }}
    >
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        marginTop: '64px',
        height: 'calc(100vh - 64px)',
        overflow: 'auto'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Add User to Project
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a user to add to this project. Only active users not already added to the project are shown.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              {isLoadingSystemUsers ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Loading users...</Typography>
                </Box>
              ) : systemUsersError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to load users. Please try again.
                  <Button 
                    size="small" 
                    onClick={refetchSystemUsers} 
                    sx={{ ml: 1 }}
                  >
                    Retry
                  </Button>
                </Alert>
              ) : availableUsersFiltered.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {systemUsers.length === 0 
                    ? 'No users found in the system.' 
                    : 'All available users are already added to this project.'
                  }
                </Alert>
              ) : (
                <Autocomplete
                  options={availableUsersFiltered}
                  getOptionLabel={(option: SystemUser) => {
                    return `${option.firstname} ${option.lastname} (${option.email}) - ${option.username}`.trim();
                  }}
                  value={selectedUser}
                  onChange={handleUserChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      required
                      error={!!errors.user_id}
                      helperText={errors.user_id}
                      placeholder="Type to search users..."
                    />
                  )}
                  isOptionEqualToValue={(option: SystemUser, value: SystemUser) => option.id === value.id}
                  renderOption={(props, option: SystemUser) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">
                          {option.firstname} {option.lastname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email} • {option.username} • {option.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {option.id}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.role_id}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role_id}
                  label="Role"
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role_id && (
                  <Typography variant="caption" color="error">
                    {errors.role_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {selectedUser && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected User Details:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name:
                      </Typography>
                      <Typography variant="body2">
                        {selectedUser.firstname} {selectedUser.lastname}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Username:
                      </Typography>
                      <Typography variant="body2">
                        {selectedUser.username}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email:
                      </Typography>
                      <Typography variant="body2">
                        {selectedUser.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Current Role:
                      </Typography>
                      <Typography variant="body2">
                        {selectedUser.role}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        User ID:
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {selectedUser.id}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                <strong>Project ID:</strong> {projectId}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Footer Actions */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!formData.user_id || !formData.role_id || isLoadingSystemUsers || availableUsersFiltered.length === 0}
          >
            Add User
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};