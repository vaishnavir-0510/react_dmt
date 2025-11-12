import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useCreateObjectMutation, useUpdateObjectMutation } from '../../services/objectsApi';
import type { ObjectData } from '../../services/objectsApi';

interface ObjectSlideInProps {
  open: boolean;
  onClose: () => void;
  object: ObjectData | null;
  systemId: string;
  systemType: 'source' | 'target';
}

export const ObjectSlideIn: React.FC<ObjectSlideInProps> = ({
  open,
  onClose,
  object,
  systemId,
  systemType,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    operation: 'insert',
    criteria: '',
    post_mig_strategy: '',
  });

  const [createObject, { isLoading: isCreating, error: createError }] = useCreateObjectMutation();
  const [updateObject, { isLoading: isUpdating, error: updateError }] = useUpdateObjectMutation();

  const isEditing = !!object;
  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;

  // Reset form when opening/closing or when object changes
  useEffect(() => {
    if (open) {
      if (object) {
        setFormData({
          name: object.name || '',
          description: object.description || '',
          operation: object.operation || 'insert',
          criteria: object.criteria || '',
          post_mig_strategy: object.post_mig_strategy || '',
        });
      } else {
        setFormData({
          name: '',
          description: '',
          operation: 'insert',
          criteria: '',
          post_mig_strategy: '',
        });
      }
    }
  }, [open, object]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const objectData = {
        ...formData,
        system: systemId,
        project: '', // This will be set by the backend based on system
      };

      if (isEditing && object) {
        await updateObject({
          id: object.object_id,
          data: objectData,
        }).unwrap();
      } else {
        await createObject(objectData).unwrap();
      }

      onClose();
      // Data will automatically refresh due to RTK Query cache invalidation
    } catch (error) {
      // Error handling is done through the mutation result
      console.error('Failed to save object:', error);
    }
  };

  const operationOptions = [
    { value: 'insert', label: 'Insert' },
    { value: 'upsert', label: 'Upsert' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
  ];

  const modalWidth = 500;

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
              {isEditing ? 'Edit Object' : 'Add New Object'}
            </Typography>
            <IconButton onClick={onClose} disabled={isLoading}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* System Info */}
          <Box sx={{ mb: 3 }}>
            <Chip 
              label={`${systemType.toUpperCase()} System`} 
              color={systemType === 'source' ? 'primary' : 'secondary'}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              System ID: {systemId}
            </Typography>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to {isEditing ? 'update' : 'create'} object. Please try again.
            </Alert>
          )}

          {/* Form */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Object Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  multiline
                  rows={3}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={isLoading}>
                  <InputLabel>Operation</InputLabel>
                  <Select
                    value={formData.operation}
                    onChange={handleSelectChange('operation')}
                    label="Operation"
                  >
                    {operationOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Criteria"
                  value={formData.criteria}
                  onChange={handleInputChange('criteria')}
                  multiline
                  rows={2}
                  disabled={isLoading}
                  placeholder="e.g., status='active'"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Post-Migration Strategy"
                  value={formData.post_mig_strategy}
                  onChange={handleInputChange('post_mig_strategy')}
                  multiline
                  rows={2}
                  disabled={isLoading}
                  placeholder="e.g., archive old records"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading || !formData.name}
              startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};