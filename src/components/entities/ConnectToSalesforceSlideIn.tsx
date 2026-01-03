import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { useConnectToSalesforceMutation } from '../../services/loadApi';

interface ConnectToSalesforceSlideInProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ConnectToSalesforceSlideIn: React.FC<ConnectToSalesforceSlideInProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    security_token: '',
    client_id: '',
    client_secret: '',
  });

  const [connectToSalesforce, { isLoading, error }] = useConnectToSalesforceMutation();

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await connectToSalesforce(formData).unwrap();
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done through the mutation result
      console.error('Failed to connect to Salesforce:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        username: '',
        password: '',
        security_token: '',
        client_id: '',
        client_secret: '',
      });
      onClose();
    }
  };

  const modalWidth = 500;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        zIndex: (theme) => theme.zIndex.modal,
      }}
    >
      <Box
        sx={{
          width: modalWidth,
          height: '100vh',
          margin: 0,
          borderRadius: 0,
          overflow: 'auto',
          boxShadow: 24,
          bgcolor: 'background.paper',
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
              Connect to Salesforce
            </Typography>
            <IconButton onClick={handleClose} disabled={isLoading}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to connect to Salesforce. Please check your credentials and try again.
            </Alert>
          )}

          {/* Form */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                required
                disabled={isLoading}
                placeholder="your.email@company.com"
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                disabled={isLoading}
              />

              <TextField
                fullWidth
                label="Security Token"
                value={formData.security_token}
                onChange={handleInputChange('security_token')}
                required
                disabled={isLoading}
                placeholder="Your Salesforce security token"
              />

              <TextField
                fullWidth
                label="Client ID"
                value={formData.client_id}
                onChange={handleInputChange('client_id')}
                required
                disabled={isLoading}
                placeholder="Your Connected App Consumer Key"
              />

              <TextField
                fullWidth
                label="Client Secret"
                type="password"
                value={formData.client_secret}
                onChange={handleInputChange('client_secret')}
                required
                disabled={isLoading}
                placeholder="Your Connected App Consumer Secret"
              />
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading || !formData.username || !formData.password || !formData.security_token || !formData.client_id || !formData.client_secret}
              startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};