// components/account/EditAccountSlideIn.tsx
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
import type { AccountData } from '../../types'; // Updated import

interface EditAccountSlideInProps {
  open: boolean;
  account: AccountData | null; // Updated type
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
    if (account) {
      setFormData({
        name: account.name || '',
      });
    } else {
      setFormData({
        name: '',
      });
    }
    setErrors({});
  }, [account, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Account name must be at least 2 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm() && account) {
      const accountData = {
        name: formData.name.trim(),
      };
      onSave(accountData);
    }
  };

  const handleChange = (field: string, value: string) => {
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

  const drawerWidth = 450;

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
            Edit Account Name
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
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Update your account name. This name will be used across the platform.
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Account Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Enter account name"
              />
            </Grid>

            {account && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Account Details:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Account ID:</strong> {account.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Owner:</strong> {account.owner}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tenant Key:</strong> {account.tenant_key}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(account.created_date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            )}
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
            disabled={!account || !formData.name.trim()}
          >
            Update Account
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};