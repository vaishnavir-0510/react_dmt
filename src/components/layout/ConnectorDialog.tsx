// components/layout/ConnectorDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ComputerIcon from '@mui/icons-material/Computer';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import LinkIcon from '@mui/icons-material/Link';

interface ConnectorDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ConfigState {
  environmentName: string;
  autoConnect: boolean;
  sourceSystem: string;
  targetSystem: string;
  sourceUsername: string;
  targetUsername: string;
  sourcePassword: string;
  targetPassword: string;
  sourceSecurityToken: string;
  targetSecurityToken: string;
  sourceLoginUrl: string;
  targetLoginUrl: string;
}

export const ConnectorDialog: React.FC<ConnectorDialogProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [sourceTargetTab, setSourceTargetTab] = useState(0); // 0 = Source, 1 = Target
  const [config, setConfig] = useState<ConfigState>({
    environmentName: 'Development',
    autoConnect: true,
    sourceSystem: '',
    targetSystem: '',
    sourceUsername: '',
    targetUsername: '',
    sourcePassword: '',
    targetPassword: '',
    sourceSecurityToken: '',
    targetSecurityToken: '',
    sourceLoginUrl: '',
    targetLoginUrl: '',
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    const envNames = ['Development', 'Production', 'Quality'];
    setConfig({ ...config, environmentName: envNames[newValue] });
  };

  const handleTestConnection = () => {
    console.log(`Testing ${sourceTargetTab === 0 ? 'source' : 'target'} connection...`);
  };

  const handleDelete = () => {
    console.log('Deleting configuration...');
  };

  const handleSave = () => {
    console.log('Saving configuration:', config);
    onClose();
  };

  const isSource = sourceTargetTab === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '700px', maxHeight: '95vh' }
      }}
    >
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Left Sidebar with Tabs */}
        <Box sx={{ width: 160, bgcolor: '#1976d2', color: 'white', flexShrink: 0 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Configurations
            </Typography>
          </Box>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                alignItems: 'flex-start',
                textAlign: 'left',
                minHeight: 48,
                '&.Mui-selected': {
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              },
              '& .MuiTabs-indicator': {
                left: 0,
                right: 'auto',
                width: 3,
                bgcolor: 'white',
              },
            }}
          >
            <Tab icon={<ComputerIcon sx={{ fontSize: 16, mr: 1 }} />} iconPosition="start" label="Development" />
            <Tab icon={<ComputerIcon sx={{ fontSize: 16, mr: 1 }} />} iconPosition="start" label="Production" />
            <Tab icon={<ComputerIcon sx={{ fontSize: 16, mr: 1 }} />} iconPosition="start" label="Quality" />
          </Tabs>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content - Scrollable */}
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5, fontSize: '1rem', fontWeight: 500 }}>
                General
              </Typography>

              {/* Environment Name */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>
                  Environment Name
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={config.environmentName}
                      onChange={(e) => setConfig({ ...config, environmentName: e.target.value })}
                      sx={{ height: 36 }}
                    >
                      <MenuItem value="Development">Development</MenuItem>
                      <MenuItem value="Production">Production</MenuItem>
                      <MenuItem value="Quality">Quality</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.autoConnect}
                        onChange={(e) => setConfig({ ...config, autoConnect: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Auto Connect"
                    sx={{ whiteSpace: 'nowrap', '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
                  />
                </Box>
              </Box>

              {/* Source/Target Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
                <Tabs 
                  value={sourceTargetTab} 
                  onChange={(_, newValue) => setSourceTargetTab(newValue)}
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': {
                      minHeight: 36,
                      textTransform: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      py: 0.5,
                    }
                  }}
                >
                  <Tab label="Source" />
                  <Tab label="Target" />
                </Tabs>
              </Box>

              {/* Dynamic Form Content */}
              <Box>
                {/* System Select */}
                <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                  <Select
                    value={isSource ? config.sourceSystem : config.targetSystem}
                    displayEmpty
                    onChange={(e) => setConfig({ 
                      ...config, 
                      [isSource ? 'sourceSystem' : 'targetSystem']: e.target.value 
                    })}
                    startAdornment={
                      <InputAdornment position="start">
                        <ComputerIcon sx={{ fontSize: 17, color: 'action.active' }} />
                      </InputAdornment>
                    }
                    sx={{ height: 36 }}
                  >
                    <MenuItem value="" disabled>Select a System</MenuItem>
                    <MenuItem value="salesforce">Salesforce</MenuItem>
                    <MenuItem value="dynamics">Dynamics 365</MenuItem>
                    <MenuItem value="sap">SAP</MenuItem>
                    <MenuItem value="oracle">Oracle</MenuItem>
                  </Select>
                </FormControl>

                {/* Username */}
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter username"
                  value={isSource ? config.sourceUsername : config.targetUsername}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    [isSource ? 'sourceUsername' : 'targetUsername']: e.target.value 
                  })}
                  sx={{ mb: 1.5, '& .MuiInputBase-root': { height: 36 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ fontSize: 17, color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password */}
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder="Enter password"
                  value={isSource ? config.sourcePassword : config.targetPassword}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    [isSource ? 'sourcePassword' : 'targetPassword']: e.target.value 
                  })}
                  sx={{ mb: 1.5, '& .MuiInputBase-root': { height: 36 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ fontSize: 17, color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Security Token */}
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Security Token
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter token"
                  value={isSource ? config.sourceSecurityToken : config.targetSecurityToken}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    [isSource ? 'sourceSecurityToken' : 'targetSecurityToken']: e.target.value 
                  })}
                  sx={{ mb: 1.5, '& .MuiInputBase-root': { height: 36 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SecurityIcon sx={{ fontSize: 17, color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Login URL */}
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.8rem' }}>
                  Login URL
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter login URL"
                  value={isSource ? config.sourceLoginUrl : config.targetLoginUrl}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    [isSource ? 'sourceLoginUrl' : 'targetLoginUrl']: e.target.value 
                  })}
                  sx={{ mb: 1.5, '& .MuiInputBase-root': { height: 36 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon sx={{ fontSize: 17, color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Test Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                  <Button
                    variant="contained"
                    onClick={handleTestConnection}
                    size="small"
                    sx={{ 
                      bgcolor: '#616161', 
                      '&:hover': { bgcolor: '#757575' },
                      textTransform: 'none',
                      fontSize: '0.85rem',
                      height: 34,
                      px: 2
                    }}
                  >
                    Test {isSource ? 'Source' : 'Target'}
                  </Button>
                </Box>

                {/* Security Note */}
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem' }}>
                  Your credentials are encrypted and securely stored.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer Actions - Fixed at bottom */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', flexShrink: 0, bgcolor: 'background.paper' }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              sx={{ textTransform: 'none', fontSize: '0.85rem', height: 36 }}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ textTransform: 'none', fontSize: '0.85rem', height: 36 }}
            >
              Save Configuration
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};