import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  Grid,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { AccountData } from '../../types';

interface EditAccountSlideInProps {
  open: boolean;
  account: AccountData | null;
  onClose: () => void;
  onSave: (accountData: any) => void;
}

export const EditAccountSlideIn: React.FC<EditAccountSlideInProps> = ({
  open,
  account,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      name: account?.name || '',
    });
    setErrors({});
  }, [account, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Account name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!account) return;

    if (validateForm()) {
      onSave({
        name: formData.name.trim(),
      });
    }
  };

  const handleChange = (value: string) => {
    setFormData({ name: value });

    if (errors.name) {
      setErrors({});
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
          width: 420,
          boxSizing: 'border-box',
          height: '100vh',
          top: 0,
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography fontWeight={600}>Edit Account Name</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        <Box flexGrow={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info">
                The account name is used across the platform.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Account Name"
                value={formData.name}
                onChange={(e) => handleChange(e.target.value)}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Enter account name"
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
            disabled={!formData.name.trim()}
          >
            Update Account
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
