import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useRemoveColumnsMutation } from '../../../services/filterApi';

interface FilterColumnsSlideInProps {
  open: boolean;
  onClose: () => void;
  allColumns: string[];
  visibleColumns: Set<string>;
  onVisibleColumnsChange: (columns: Set<string>) => void;
  objectId: string;
  refetch: () => void;
}

export const FilterColumnsSlideIn: React.FC<FilterColumnsSlideInProps> = ({
  open,
  onClose,
  allColumns,
  visibleColumns,
  onVisibleColumnsChange,
  objectId,
  refetch,
}) => {
  const [localVisibleColumns, setLocalVisibleColumns] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [removeColumns] = useRemoveColumnsMutation();

  useEffect(() => {
    if (open) {
      refetch();
      setLocalVisibleColumns(new Set(visibleColumns));
      setIsSaving(false);
      setSnackbar({ open: false, message: '', severity: 'success' });
    }
  }, [open, visibleColumns, refetch]);

  const handleColumnToggle = (column: string) => {
    const newVisible = new Set(localVisibleColumns);
    if (newVisible.has(column)) {
      newVisible.delete(column);
    } else {
      newVisible.add(column);
    }
    setLocalVisibleColumns(newVisible);
  };

  const handleSelectAll = () => {
    setLocalVisibleColumns(new Set(allColumns));
  };

  const handleDeselectAll = () => {
    setLocalVisibleColumns(new Set());
  };

  const handleSave = async () => {
    // First update the visibility
    onVisibleColumnsChange(localVisibleColumns);
    // Then call API to persist
    setIsSaving(true);
    try {
      console.log('objectId type:', typeof objectId, 'value:', JSON.stringify(objectId));
      if (!objectId || objectId.trim() === '') {
        console.error('objectId is missing or empty');
        setSnackbar({ open: true, message: 'Object ID is missing. Please select an object first.', severity: 'error' });
        setIsSaving(false);
        return;
      }

      const columnsToRemove = allColumns.filter(col => !localVisibleColumns.has(col));
      const payload = {
        object_id: objectId,
        columns_to_remove: columnsToRemove,
        for_migrate: false,
      };
      console.log('objectId:', objectId);
      console.log('API Payload:', payload);
      await removeColumns(payload).unwrap();
      setSnackbar({ open: true, message: 'Columns updated successfully', severity: 'success' });
      // Close after showing message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update columns', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const drawerWidth = 400;

  return (
    <>
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
          height: '100vh',
          overflow: 'auto'
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Filter Columns
            </Typography>
            <IconButton onClick={onClose} disabled={isSaving}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
              disabled={isSaving}
            >
              Select All
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleDeselectAll}
              disabled={isSaving}
            >
              Deselect All
            </Button>
          </Box>

          {/* Column List */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <FormGroup>
              {allColumns.map((column) => (
                <FormControlLabel
                  key={column}
                  control={
                    <Checkbox
                      checked={localVisibleColumns.has(column)}
                      onChange={() => handleColumnToggle(column)}
                      disabled={isSaving}
                    />
                  }
                  label={column}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              disabled={isSaving || !objectId || objectId.trim() === ''}
              startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Drawer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};