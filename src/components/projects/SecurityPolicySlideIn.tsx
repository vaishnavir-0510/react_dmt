import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Paper,
  Divider,
  IconButton,
  RadioGroup,
  Radio,
  FormLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useCreateSecurityPolicyMutation, useUpdateSecurityPolicyMutation, useGetSecurityPoliciesQuery } from '../../services/securityPoliciesApi';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useGetSystemsByProjectQuery } from '../../services/systemsApi';
import { useGetObjectsBySystemQuery } from '../../services/objectsApi';
import type { SecurityPolicy } from '../../services/securityPoliciesApi';

interface SecurityPolicySlideInProps {
  open: boolean;
  policy?: SecurityPolicy | null;
  mode: 'create' | 'edit' | 'update-default';
  onClose: () => void;
  onSave: (data: any) => void;
}

export const SecurityPolicySlideIn: React.FC<SecurityPolicySlideInProps> = ({
  open,
  policy,
  mode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<{
    policy_name: string;
    security_class: string;
    permission: string;
    mask: string;
    version: string;
    is_active?: boolean;
  }>({
    policy_name: '',
    security_class: '',
    permission: '',
    mask: '',
    version: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // For update-default mode
  const [scopeType, setScopeType] = useState<'project' | 'object'>('project');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedObject, setSelectedObject] = useState('');
  // Removed selectedPolicyId for update-default

  const { projects } = useWorkspace();
  const { data: allPolicies = [] } = useGetSecurityPoliciesQuery();
  const { data: systems = [] } = useGetSystemsByProjectQuery(selectedProject, { skip: !selectedProject });
  const { data: objects = [] } = useGetObjectsBySystemQuery(selectedSystem, { skip: !selectedSystem });

  // Get unique values for dropdowns
  const uniqueSecurityClasses = [...new Set(allPolicies.map(p => p.security_class).filter(s => s !== null && s !== undefined))] as string[];
  const uniquePermissions = [...new Set(allPolicies.map(p => p.permission).filter(s => s !== null && s !== undefined))] as string[];
  const uniqueMasks = [...new Set(allPolicies.map(p => p.mask).filter(s => s !== null && s !== undefined))] as string[];

  // Filter policies based on selected scope
  const filteredPolicies = allPolicies.filter((policy: SecurityPolicy) => {
    if (scopeType === 'project') {
      return policy.project_id === selectedProject;
    } else {
      // For object scope, filter policies by selected object
      return policy.object_id === selectedObject;
    }
  });

  // Systems are already filtered by the query
  const filteredSystems = systems;

  // Objects are already filtered by the query
  const filteredObjects = objects;

  useEffect(() => {
    if (policy && (mode === 'edit' || mode === 'update-default')) {
      setFormData({
        policy_name: policy.policy_name || '',
        security_class: policy.security_class || '',
        permission: policy.permission || '',
        mask: policy.mask || '',
        version: policy.version || '',
        is_active: policy.is_active,
      });
    } else if (mode === 'create') {
      setFormData({
        policy_name: '',
        security_class: '',
        permission: '',
        mask: '',
        version: '',
        is_active: true,
      });
    }
  }, [policy, mode, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'update-default') {
      if (scopeType === 'project' && !selectedProject) {
        newErrors.project = 'Please select a project';
      }
      if (scopeType === 'object' && (!selectedProject || !selectedSystem || !selectedObject)) {
        newErrors.object = 'Please select project, source system, and source object';
      }
    } else {
      if (!formData.policy_name.trim()) {
        newErrors.policy_name = 'Policy name is required';
      }

      if (!formData.security_class.trim()) {
        newErrors.security_class = 'Security class is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (mode === 'update-default') {
      onSave({ scopeType, selectedProject, selectedSystem, selectedObject });
    } else {
      // Prepare data based on mode
      if (mode === 'create') {
        const dataToSave = {
          policy_name: formData.policy_name,
          security_class: formData.security_class,
          permission: formData.permission,
          mask: formData.mask,
          version: formData.version,
        };
        onSave(dataToSave);
      } else {
        // For edit mode
        onSave(formData);
      }
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create Security Policy';
      case 'edit':
        return 'Edit Security Policy';
      case 'update-default':
        return 'Update Default Policy';
      default:
        return 'Security Policy';
    }
  };

  const modalWidth = 600;

  const formContent = mode === 'update-default' ? (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormLabel component="legend">Select Scope</FormLabel>
        <RadioGroup
          value={scopeType}
          onChange={(e) => {
            setScopeType(e.target.value as 'project' | 'object');
            setSelectedProject('');
            setSelectedSystem('');
            setSelectedObject('');
          }}
          row
        >
          <FormControlLabel value="project" control={<Radio />} label="Project" />
          <FormControlLabel value="object" control={<Radio />} label="Object" />
        </RadioGroup>
      </Grid>

      {scopeType === 'project' && (
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
              }}
              label="Project"
            >
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      {scopeType === 'object' && (
        <>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedSystem('');
                  setSelectedObject('');
                }}
                label="Project"
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Source System</InputLabel>
              <Select
                value={selectedSystem}
                onChange={(e) => {
                  setSelectedSystem(e.target.value);
                  setSelectedObject('');
                }}
                label="Source System"
                disabled={!selectedProject}
              >
                {filteredSystems.map(system => (
                  <MenuItem key={system.id} value={system.id}>{system.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Source Object</InputLabel>
              <Select
                value={selectedObject}
                onChange={(e) => {
                  setSelectedObject(e.target.value);
                }}
                label="Source Object"
                disabled={!selectedSystem}
              >
                {filteredObjects.map(obj => (
                  <MenuItem key={obj.object_id} value={obj.object_id}>{obj.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </>
      )}

      {errors.project && (
        <Grid item xs={12}>
          <Alert severity="error">{errors.project}</Alert>
        </Grid>
      )}
      {errors.object && (
        <Grid item xs={12}>
          <Alert severity="error">{errors.object}</Alert>
        </Grid>
      )}
    </Grid>
  ) : (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          label="Policy Name"
          value={formData.policy_name}
          onChange={(e) => handleInputChange('policy_name', e.target.value)}
          fullWidth
          required
          error={!!errors.policy_name}
          helperText={errors.policy_name}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.security_class}>
          <InputLabel>Security Class</InputLabel>
          <Select
            value={formData.security_class}
            onChange={(e) => handleInputChange('security_class', e.target.value)}
            label="Security Class"
          >
            {uniqueSecurityClasses.map(cls => (
              <MenuItem key={cls} value={cls}>{cls}</MenuItem>
            ))}
          </Select>
          {errors.security_class && <Typography variant="caption" color="error">{errors.security_class}</Typography>}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Permission</InputLabel>
          <Select
            value={formData.permission}
            onChange={(e) => handleInputChange('permission', e.target.value)}
            label="Permission"
          >
            {uniquePermissions.map(perm => (
              <MenuItem key={perm} value={perm}>{perm}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Mask</InputLabel>
          <Select
            value={formData.mask}
            onChange={(e) => handleInputChange('mask', e.target.value)}
            label="Mask"
          >
            {uniqueMasks.map(mask => (
              <MenuItem key={mask} value={mask}>{mask}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Version"
          value={formData.version}
          onChange={(e) => handleInputChange('version', e.target.value)}
          fullWidth
        />
      </Grid>

      {mode === 'edit' && (
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active || false}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                color="primary"
              />
            }
            label="Active"
          />
        </Grid>
      )}
    </Grid>
  );

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
              {getTitle()}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Form Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {formContent}
          </Box>

          {/* Footer Actions */}
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12} sm={6}>
              <Button onClick={onClose} variant="outlined" fullWidth>
                Cancel
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                onClick={handleSave}
                variant="contained"
                startIcon={<SaveIcon />}
                fullWidth
              >
                {mode === 'create' ? 'Create' : mode === 'update-default' ? 'Update Default' : 'Save'} Policy
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Modal>
  );
};