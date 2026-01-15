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

const isValidStatus = (
  status: string
): status is 'active' | 'inactive' | 'rejected' =>
  status === 'active' || status === 'inactive' || status === 'rejected';

const getSafeStatus = (
  status: string
): 'active' | 'inactive' | 'rejected' =>
  isValidStatus(status) ? status : 'active';

export const EditUserSlideIn: React.FC<EditUserSlideInProps> = ({
  open,
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
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
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone_no: user.phone_no || '',
        role: user.role || 'user',
        status: getSafeStatus(user.status),
        mfa_active: user.mfa_active || false,
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
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

    if (!formData.first_name.trim())
      newErrors.first_name = 'First name is required';

    if (!formData.last_name.trim())
      newErrors.last_name = 'Last name is required';

    if (!formData.username.trim())
      newErrors.username = 'Username is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.status) newErrors.status = 'Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!user) return;

    if (validateForm()) {
      onSave({
        id: user.id,
        ...formData,
      });
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 3,
        '& .MuiDrawer-paper': {
          width: 500,
          boxSizing: 'border-box',
          height: '100vh',
          top: 0,
        },
      }}
      BackdropProps={{
        sx: { backgroundColor: 'rgba(0,0,0,0.7)' },
      }}
    >
      <Box p={3} display="flex" flexDirection="column" height="100%">
        {/* Header */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography fontWeight={600}>Edit User</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form */}
        <Box flexGrow={1}>
          <Grid container spacing={2}>
            {/* Row 1 */}
            <Grid item xs={6}>
              <TextField
                label="First Name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                fullWidth
                required
                error={!!errors.first_name}
                helperText={errors.first_name}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                fullWidth
                required
                error={!!errors.last_name}
                helperText={errors.last_name}
              />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={6}>
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

            <Grid item xs={6}>
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

            {/* Row 3 */}
            <Grid item xs={6}>
              <TextField
                label="Phone Number"
                value={formData.phone_no}
                onChange={(e) => handleChange('phone_no', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => handleChange('role', e.target.value)}
                >
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Row 4 */}
            <Grid item xs={6}>
              <FormControl fullWidth required error={!!errors.status}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.mfa_active}
                    onChange={(e) =>
                      handleChange('mfa_active', e.target.checked)
                    }
                  />
                }
                label="MFA Active"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!user}
          >
            Update User
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
