// components/projects/EnvironmentSlideIn.tsx
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
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Environment } from '../../types';

interface EnvironmentSlideInProps {
  open: boolean;
  environment: Environment | null;
  projectId: string;
  onClose: () => void;
  onSave: (environmentData: any) => void;
  isLoading?: boolean;
}

export const EnvironmentSlideIn: React.FC<EnvironmentSlideInProps> = ({
  open,
  environment,
  projectId,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'dev',
    is_prod: false,
    project: projectId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (environment) {
      setFormData({
        name: environment.name || '',
        type: environment.type || 'dev',
        is_prod: environment.is_prod || false,
        project: projectId,
      });
    } else {
      setFormData({
        name: '',
        type: 'dev',
        is_prod: false,
        project: projectId,
      });
    }
    setErrors({});
  }, [environment, projectId, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Environment name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Environment type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
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
            {environment ? 'Edit Environment' : 'Add New Environment'}
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
                label="Environment Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.type}>
                <InputLabel>Environment Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Environment Type"
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <MenuItem value="dev">Development</MenuItem>
                  <MenuItem value="qa">QA</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="prod">Production</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                </Select>
                {errors.type && (
                  <Typography variant="caption" color="error">
                    {errors.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_prod}
                    onChange={(e) => handleChange('is_prod', e.target.checked)}
                    color="primary"
                  />
                }
                label="Is Production Environment"
              />
            </Grid>

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
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isLoading}
          >
            {environment ? 'Update' : 'Create'} Environment
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};