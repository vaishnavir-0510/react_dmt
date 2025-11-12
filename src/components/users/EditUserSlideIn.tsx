// components/users/EditUserSlideIn.tsx
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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { SystemUser } from '../../types';

interface EditUserSlideInProps {
  open: boolean;
  user: SystemUser | null;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const roles = [
  { id: 'admin', name: 'Admin' },
  { id: 'user', name: 'User' },
];

const statusOptions = [
  { id: 'active', name: 'Active' },
  { id: 'inactive', name: 'Inactive' },
  { id: 'rejected', name: 'Rejected' },
];

// Type guard to validate status
const isValidStatus = (status: string): status is 'active' | 'inactive' | 'rejected' => {
  return status === 'active' || status === 'inactive' || status === 'rejected';
};

// Get safe status value
const getSafeStatus = (status: string): 'active' | 'inactive' | 'rejected' => {
  return isValidStatus(status) ? status : 'active';
};

export const EditUserSlideIn: React.FC<EditUserSlideInProps> = ({
  open,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_no: '',
    role: 'user',
    status: 'active' as 'active' | 'inactive' | 'rejected',
    mfa_active: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone_no: user.phone_no || '',
        role: user.role || 'user',
        status: getSafeStatus(user.status), // Use the safe status getter
        mfa_active: user.mfa_active || false,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone_no: '',
        role: 'user',
        status: 'active',
        mfa_active: false,
      });
    }
    setErrors({});
  }, [user, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm() && user) {
      const userData = {
        id: user.id,
        ...formData,
      };
      onSave(userData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

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
            Edit User
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
              <TextField
                label="Username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                fullWidth
                required
                error={!!errors.username}
                helperText={errors.username}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                value={formData.phone_no}
                onChange={(e) => handleChange('phone_no', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error">
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.status && (
                  <Typography variant="caption" color="error">
                    {errors.status}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.mfa_active}
                    onChange={(e) => handleChange('mfa_active', e.target.checked)}
                    color="primary"
                  />
                }
                label="MFA Active"
              />
            </Grid>

            {user && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  <strong>User ID:</strong> {user.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Created:</strong> {new Date(user.created_date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Last Modified:</strong> {new Date(user.modified_date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Current Status:</strong> {user.status}
                </Typography>
              </Grid>
            )}
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
            disabled={!user}
          >
            Update User
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};