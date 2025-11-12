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
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { System } from '../../types';

interface SystemSlideInProps {
  open: boolean;
  system: System | null;
  projectId: string;
  onClose: () => void;
  onSave: (systemData: any) => void;
}

export const SystemSlideIn: React.FC<SystemSlideInProps> = ({
  open,
  system,
  projectId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'source' as 'source' | 'target',
    project: projectId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (system) {
      setFormData({
        name: system.name || '',
        type: system.type || 'source',
        project: projectId,
      });
    } else {
      // Reset form for new system
      setFormData({
        name: '',
        type: 'source',
        project: projectId,
      });
    }
    setErrors({});
  }, [system, projectId, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'System name is required';
    }
    if (!formData.type) {
      newErrors.type = 'System type is required';
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
    
    // Clear error when user starts typing
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
  height: 'calc(100vh - 64px)', // ← Only one height property
  overflow: 'auto'
}}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            {system ? 'Edit System' : 'Add New System'}
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
                label="System Name"
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
                <InputLabel>System Type</InputLabel>
                <Select
                  value={formData.type}
                  label="System Type"
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <MenuItem value="source">Source</MenuItem>
                  <MenuItem value="target">Target</MenuItem>
                </Select>
                {errors.type && (
                  <Typography variant="caption" color="error">
                    {errors.type}
                  </Typography>
                )}
              </FormControl>
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
            startIcon={<SaveIcon />}
          >
            {system ? 'Update' : 'Create'} System
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};