// components/users/InviteUserSlideIn.tsx
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
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface InviteUserSlideInProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const roles = [
  { id: 'admin', name: 'Admin' },
  { id: 'user', name: 'User' },
];

export const InviteUserSlideIn: React.FC<InviteUserSlideInProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset form when opening/closing
    setFormData({
      email: '',
      role: 'user',
    });
    setErrors({});
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
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
            Invite User
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
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Enter email address to invite user to this account
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Email Address"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
                placeholder="Enter email address"
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
            disabled={!formData.email || !formData.role}
          >
            Send Invitation
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};