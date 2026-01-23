import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGetPicklistMappingQuery, useUpdatePicklistMappingMutation } from '../../../services/picklistApi';
import type { PicklistMapping } from '../../../services/picklistApi';

interface PicklistMappingSlideInProps {
  open: boolean;
  onClose: () => void;
  sourceFieldId: string;
  targetFieldId: string;
  sourceFieldName: string;
  targetFieldName: string;
}

export const PicklistMappingSlideIn: React.FC<PicklistMappingSlideInProps> = ({
  open,
  onClose,
  sourceFieldId,
  targetFieldId,
  sourceFieldName,
  targetFieldName,
}) => {
  const [mappings, setMappings] = useState<PicklistMapping[]>([]);
  const [newSourceValue, setNewSourceValue] = useState<string>('');
  const [newTargetValue, setNewTargetValue] = useState<string>('');

  // Use RTK Query hooks for API calls
  const {
    data: picklistData,
    isLoading,
    error,
  } = useGetPicklistMappingQuery(
    { sourceField: sourceFieldId, targetField: targetFieldId },
    { skip: !open || !sourceFieldId || !targetFieldId }
  );

  const [updatePicklistMapping, { isLoading: isSaving }] = useUpdatePicklistMappingMutation();

  // Update mappings when data is loaded
  useEffect(() => {
    if (picklistData) {
      setMappings(picklistData.picklistMap || []);
    }
  }, [picklistData]);

  // Reset form when component closes
  useEffect(() => {
    if (!open) {
      setMappings([]);
      setNewSourceValue('');
      setNewTargetValue('');
    }
  }, [open]);

  const handleAddMapping = () => {
    if (newSourceValue.trim() && newTargetValue.trim()) {
      setMappings(prev => [...prev, {
        sourceValue: newSourceValue.trim(),
        targetValue: newTargetValue.trim()
      }]);
      setNewSourceValue('');
      setNewTargetValue('');
    }
  };

  const handleDeleteMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSourceValueChange = (index: number, value: string) => {
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, sourceValue: value } : mapping
    ));
  };

  const handleTargetValueChange = (index: number, value: string) => {
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, targetValue: value } : mapping
    ));
  };

  const handleSave = async () => {
    if (!sourceFieldId || !targetFieldId) {
      alert('Missing required field IDs');
      return;
    }

    try {
      const payload = {
        source_field: sourceFieldId,
        target_field: targetFieldId,
        picklist_map: mappings
      };

      const result = await updatePicklistMapping(payload).unwrap();
      console.log('Picklist mapping response:', result);
      
      // Show success message - the API might return different response structure
      alert('Picklist mappings processed successfully!');
      
      onClose();
    } catch (err) {
      console.error('Error saving picklist mappings:', err);
      alert(`Failed to save picklist mappings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const modalWidth = 700;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        zIndex: (theme) => theme.zIndex.modal,
        p: 0,
      }}
    >
      <Paper
        sx={{
          width: modalWidth,
          height: '100vh',
          m: 0,
          p: 0,
          borderRadius: 0,
          overflow: 'auto',
          boxShadow: 24,
        }}
      >
        <Box sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Blue Header */}
          <Box sx={{
            bgcolor: '#1565c0',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Picklist Mapping
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Description */}
          <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary">
              Map source picklist values to target picklist values. This ensures proper data transformation during migration.
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={`Source: ${sourceFieldName}`} 
                size="small" 
                sx={{ mr: 1, backgroundColor: '#e3f2fd', color: '#1565c0' }} 
              />
              <Chip 
                label={`Target: ${targetFieldName}`} 
                size="small" 
                sx={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }} 
              />
            </Box>
          </Box>

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 1 }}>Loading picklist mapping data...</Typography>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">
                {typeof error === 'string' ? error : 'Failed to load picklist mapping data'}
              </Alert>
            </Box>
          )}

          {/* Content */}
          {!isLoading && !error && picklistData && (
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <Grid container spacing={2}>
                {/* Source Picklist Column */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Source Picklist
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {mappings.map((mapping, index) => (
                      <TextField
                        key={`source-${index}`}
                        fullWidth
                        size="small"
                        label="Source Value"
                        value={mapping.sourceValue}
                        onChange={(e) => handleSourceValueChange(index, e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                          }
                        }}
                      />
                    ))}
                    {/* Add new source value */}
                    <TextField
                      fullWidth
                      size="small"
                      label="New Source Value"
                      value={newSourceValue}
                      onChange={(e) => setNewSourceValue(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f5f5f5',
                        }
                      }}
                    />
                  </Box>
                </Grid>

                {/* Target Picklist Column */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Target Picklist
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {mappings.map((mapping, index) => (
                      <Box key={`target-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Target Value</InputLabel>
                          <Select
                            value={mapping.targetValue}
                            label="Target Value"
                            onChange={(e) => handleTargetValueChange(index, e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: 'white',
                              }
                            }}
                          >
                            {picklistData.targetPicklist.map((value) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMapping(index)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    {/* Add new target value */}
                    <FormControl fullWidth size="small">
                      <InputLabel>New Target Value</InputLabel>
                      <Select
                        value={newTargetValue}
                        label="New Target Value"
                        onChange={(e) => setNewTargetValue(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f5f5f5',
                          }
                        }}
                      >
                        {picklistData.targetPicklist.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>

              {/* Add New Mapping Button */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddMapping}
                  disabled={!newSourceValue.trim() || !newTargetValue.trim()}
                  sx={{ mr: 2 }}
                >
                  Add Mapping
                </Button>
              </Box>
            </Box>
          )}

          {/* Footer Actions */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={isLoading || isSaving || mappings.length === 0}
              >
                {isSaving ? 'Saving...' : 'Save Mappings'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};
