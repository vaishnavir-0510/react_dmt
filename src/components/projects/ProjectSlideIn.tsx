import React, { useState, useEffect } from 'react';
import {
  Modal,
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
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Project } from '../../types';

interface ProjectSlideInProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (projectData: any) => void;
}

export const ProjectSlideIn: React.FC<ProjectSlideInProps> = ({
  open,
  project,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    account_name: '',
    status: 'InProgress',
    start_date: '',
    end_date: '',
    client: '',
    client_website: '',
    business_function: '',
    project_type: 'migration',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.name || project.project_name || '',
        description: project.description || '',
        account_name: project.account_name || 'Data',
        status: project.status || 'InProgress',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        client: project.client || '',
        client_website: project.client_website || '',
        business_function: project.business_function || '',
        project_type: project.project_type || 'migration',
      });
    } else {
      // Reset form for new project
      setFormData({
        project_name: '',
        description: '',
        account_name: 'Data',
        status: 'InProgress',
        start_date: '',
        end_date: '',
        client: '',
        client_website: '',
        business_function: '',
        project_type: 'migration',
      });
    }
    setErrors({});
  }, [project, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    }
    if (!formData.client.trim()) {
      newErrors.client = 'Client name is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = 'End date cannot be before start date';
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

  const modalWidth = 600;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        zIndex: (theme) => theme.zIndex.modal,
      }}
    >
      <Paper
        sx={{
          width: modalWidth,
          height: '100vh',
          margin: 0,
          borderRadius: 0,
          overflow: 'auto',
          boxShadow: 24,
        }}
      >
        <Box sx={{ 
          p: 3, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              {project ? 'Edit Project' : 'Add New Project'}
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
                  label="Project Name"
                  value={formData.project_name}
                  onChange={(e) => handleChange('project_name', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.project_name}
                  helperText={errors.project_name}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Account Name"
                  value={formData.account_name}
                  onChange={(e) => handleChange('account_name', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <MenuItem value="InProgress">In Progress</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="OnHold">On Hold</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.start_date}
                  helperText={errors.start_date}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.end_date}
                  helperText={errors.end_date}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client"
                  value={formData.client}
                  onChange={(e) => handleChange('client', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.client}
                  helperText={errors.client}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client Website"
                  value={formData.client_website}
                  onChange={(e) => handleChange('client_website', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Business Function"
                  value={formData.business_function}
                  onChange={(e) => handleChange('business_function', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Project Type</InputLabel>
                  <Select
                    value={formData.project_type}
                    label="Project Type"
                    onChange={(e) => handleChange('project_type', e.target.value)}
                  >
                    <MenuItem value="migration">Migration</MenuItem>
                    <MenuItem value="backup">Backup</MenuItem>
                    <MenuItem value="development">Development</MenuItem>
                  </Select>
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
            >
              {project ? 'Update' : 'Create'} Project
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};