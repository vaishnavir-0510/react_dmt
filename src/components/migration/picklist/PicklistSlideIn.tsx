// components/migration/picklist/PicklistSlideIn.tsx
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
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { useGetPicklistMappingQuery, useUpdatePicklistMappingMutation } from '../../../services/picklistApi';

interface PicklistSlideInProps {
  open: boolean;
  onClose: () => void;
  sourceFieldId: string;
  targetFieldId: string;
  sourceFieldName: string;
  targetFieldName: string;
}

interface PicklistMapping {
  sourceValue: string;
  targetValue: string;
}

export const PicklistSlideIn: React.FC<PicklistSlideInProps> = ({
  open,
  onClose,
  sourceFieldId,
  targetFieldId,
  sourceFieldName,
  targetFieldName,
}) => {
  const [mappings, setMappings] = useState<PicklistMapping[]>([]);
  const [targetOptions, setTargetOptions] = useState<string[]>([]);

  const { 
    data: picklistData, 
    isLoading, 
    error,
    refetch 
  } = useGetPicklistMappingQuery(
    { 
      sourceField: sourceFieldId, 
      targetField: targetFieldId 
    },
    { 
      skip: !open || !sourceFieldId || !targetFieldId 
    }
  );

  const [updatePicklistMapping, { 
    isLoading: isUpdating, 
    error: updateError 
  }] = useUpdatePicklistMappingMutation();

  // Initialize data when picklistData changes
  useEffect(() => {
    if (picklistData) {
      setMappings(picklistData.picklistMap || []);
      setTargetOptions(['', ...(picklistData.targetPicklist || [])]);
    }
  }, [picklistData]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setMappings([]);
      setTargetOptions([]);
    }
  }, [open]);

  const handleTargetValueChange = (index: number, newValue: string) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      targetValue: newValue,
    };
    setMappings(updatedMappings);
  };

  const handleSave = async () => {
    try {
      const payload = {
        source_field: sourceFieldId,
        target_field: targetFieldId,
        picklist_map: mappings.filter(mapping => 
          mapping.sourceValue && mapping.sourceValue.trim() !== ''
        ),
      };

      await updatePicklistMapping(payload).unwrap();
      
      // Close the slide-in after successful save
      onClose();
    } catch (error) {
      console.error('Failed to update picklist mapping:', error);
    }
  };

  const hasChanges = () => {
    if (!picklistData) return false;
    
    const originalMappings = picklistData.picklistMap || [];
    if (mappings.length !== originalMappings.length) return true;

    return mappings.some((mapping, index) => {
      const original = originalMappings[index];
      return mapping.targetValue !== original?.targetValue;
    });
  };

  const modalWidth = 800;

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Picklist Mapping
            </Typography>
            <IconButton onClick={onClose} disabled={isLoading || isUpdating}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Map source picklist values to corresponding target picklist values
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Field Information */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`Source: ${sourceFieldName}`} 
              color="primary"
              variant="outlined"
            />
            <SwapIcon sx={{ color: 'primary.main' }} />
            <Chip 
              label={`Target: ${targetFieldName}`} 
              color="secondary"
              variant="outlined"
            />
          </Box>

          {/* Error Display */}
          {(error || updateError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to {updateError ? 'update' : 'load'} picklist mapping. Please try again.
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            /* Mapping Content */
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {/* Column Headers */}
              <Paper elevation={1} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                      Source Picklist Value
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Arrow space */}
                  </Grid>
                  <Grid item xs={5}>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                      Target Picklist Value
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Mapping Rows */}
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {mappings.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">
                      No picklist values found to map.
                    </Typography>
                  </Paper>
                ) : (
                  mappings.map((mapping, index) => (
                    <Paper 
                      key={index} 
                      elevation={0}
                      sx={{ 
                        mb: 1, 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        backgroundColor: index % 2 === 0 ? 'white' : 'grey.50',
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        {/* Source Value - Readonly */}
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            size="small"
                            value={mapping.sourceValue}
                            label="Source Value"
                            InputProps={{
                              readOnly: true,
                            }}
                            variant="outlined"
                          />
                        </Grid>

                        {/* Arrow */}
                        <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <SwapIcon sx={{ color: 'primary.main' }} />
                        </Grid>

                        {/* Target Value - Dropdown */}
                        <Grid item xs={5}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Target Value</InputLabel>
                            <Select
                              value={mapping.targetValue || ''}
                              onChange={(e) => handleTargetValueChange(index, e.target.value)}
                              label="Target Value"
                              disabled={isUpdating}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {targetOptions
                                .filter(option => option !== '') // Remove empty string from options list
                                .map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))
                              }
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Box>

              {/* Summary */}
              {mappings.length > 0 && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {mappings.filter(m => m.targetValue && m.targetValue.trim() !== '').length} of {mappings.length} values mapped
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              disabled={isLoading || isUpdating}
            >
              Cancel
            </Button>
            <Tooltip 
              title={!hasChanges() ? "No changes to save" : ""}
              arrow
            >
              <span>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSave}
                  disabled={isLoading || isUpdating || !hasChanges()}
                  startIcon={isUpdating ? <CircularProgress size={16} /> : <SaveIcon />}
                >
                  {isUpdating ? 'Saving...' : 'Save Mapping'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};