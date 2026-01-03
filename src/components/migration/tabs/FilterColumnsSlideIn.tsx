import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface FilterColumnsSlideInProps {
  open: boolean;
  onClose: () => void;
  allColumns: string[];
  visibleColumns: Set<string>;
  onVisibleColumnsChange: (columns: Set<string>) => void;
}

export const FilterColumnsSlideIn: React.FC<FilterColumnsSlideInProps> = ({
  open,
  onClose,
  allColumns,
  visibleColumns,
  onVisibleColumnsChange,
}) => {
  const handleColumnToggle = (column: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(column)) {
      newVisible.delete(column);
    } else {
      newVisible.add(column);
    }
    onVisibleColumnsChange(newVisible);
  };

  const handleSelectAll = () => {
    onVisibleColumnsChange(new Set(allColumns));
  };

  const handleDeselectAll = () => {
    onVisibleColumnsChange(new Set());
  };

  const modalWidth = 400;

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
              Filter Columns
            </Typography>
            <IconButton onClick={onClose}>
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
            >
              Select All
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleDeselectAll}
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
                      checked={visibleColumns.has(column)}
                      onChange={() => handleColumnToggle(column)}
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
              onClick={onClose}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};