import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useGetCompoundFieldsQuery } from '../../services/objectsApi';
import type { ObjectData } from '../../services/objectsApi';

interface CompoundField {
  id: number;
  name: string;
  field_id: string;
  label: string;
}

interface CompoundFieldsSlideInProps {
  open: boolean;
  onClose: () => void;
  object: ObjectData | null;
}

export const CompoundFieldsSlideIn: React.FC<CompoundFieldsSlideInProps> = ({
  open,
  onClose,
  object,
}) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const {
    data: compoundFields,
    isLoading,
    error,
  } = useGetCompoundFieldsQuery(object?.object_id || '', {
    skip: !object?.object_id || !open,
  });

  // Reset selected fields when object changes
  useEffect(() => {
    if (object) {
      setSelectedFields([]);
    }
  }, [object]);

  const handleToggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleSelectAll = () => {
    if (compoundFields) {
      setSelectedFields(compoundFields.map(field => field.field_id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleSave = () => {
    // Save selected compound field names to localStorage (not IDs)
    const selectedFieldNames = compoundFields
      ?.filter(field => selectedFields.includes(field.field_id))
      .map(field => field.name) || [];

    localStorage.setItem('selectedCompoundFields', JSON.stringify(selectedFieldNames));
    console.log('Selected compound field names saved:', selectedFieldNames);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Select Compound Fields
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Object Info */}
        {object && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {object.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {object.description || 'No description'}
            </Typography>
          </Box>
        )}

        {/* Selection Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleSelectAll}
            disabled={!compoundFields?.length}
          >
            Select All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleDeselectAll}
            disabled={selectedFields.length === 0}
          >
            Deselect All
          </Button>
          <Chip
            label={`${selectedFields.length} selected`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load compound fields. Please try again.
          </Alert>
        )}

        {/* Fields List */}
        {!isLoading && compoundFields && (
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {compoundFields.map((field: CompoundField) => (
              <ListItem
                key={field.field_id}
                dense
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Checkbox
                  checked={selectedFields.includes(field.field_id)}
                  onChange={() => handleToggleField(field.field_id)}
                  size="small"
                />
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium">
                      {field.label || field.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {field.name} • ID: {field.id}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* No Fields Message */}
        {!isLoading && !error && (!compoundFields || compoundFields.length === 0) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No compound fields available for this object.
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            fullWidth
            disabled={selectedFields.length === 0}
          >
            Save Selection ({selectedFields.length})
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};