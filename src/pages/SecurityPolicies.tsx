import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Policy as PolicyIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  VisibilityOff as MaskIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { useGetSecurityPoliciesQuery, useDeleteSecurityPolicyMutation, useUpdateDefaultPolicyMutation, useCreateSecurityPolicyMutation, useUpdateSecurityPolicyMutation, useUpdateDefaultPolicyScopeMutation } from '../services/securityPoliciesApi';
import type { SecurityPolicy } from '../services/securityPoliciesApi';
import { SecurityPolicySlideIn } from '../components/projects/SecurityPolicySlideIn';
import { SecurityPolicyDashboard } from '../components/projects/SecurityPolicyDashboard';

export const SecurityPolicies: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [securityClassFilter, setSecurityClassFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<SecurityPolicy | null>(null);
  const [slideInOpen, setSlideInOpen] = useState(false);
  const [slideInMode, setSlideInMode] = useState<'create' | 'edit' | 'update-default'>('create');
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);
  const [selectedRow, setSelectedRow] = useState<SecurityPolicy | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const { data: policies = [], isLoading, error } = useGetSecurityPoliciesQuery();
  const [deletePolicy] = useDeleteSecurityPolicyMutation();
  const [createPolicy] = useCreateSecurityPolicyMutation();
  const [updatePolicy] = useUpdateSecurityPolicyMutation();
  const [updateDefaultPolicy] = useUpdateDefaultPolicyMutation();
  const [updateDefaultPolicyScope] = useUpdateDefaultPolicyScopeMutation();

  // Get unique values for filters
  const uniqueTenants = useMemo(() => {
    const tenants = policies.map(p => p.tenant_id).filter(Boolean);
    return [...new Set(tenants)];
  }, [policies]);

  const uniqueObjects = useMemo(() => {
    const objects = policies.map(p => p.object_id).filter(Boolean);
    return [...new Set(objects)];
  }, [policies]);

  const uniqueProjects = useMemo(() => {
    const projects = policies.map(p => p.project_id).filter(Boolean);
    return [...new Set(projects)];
  }, [policies]);

  const uniquePiiPolicies = useMemo(() => {
    const piiPolicies = policies.map(p => p.pii_policy_id).filter(Boolean);
    return [...new Set(piiPolicies)];
  }, [policies]);

  const uniqueSecurityClasses = useMemo(() => {
    const securityClasses = policies.map(p => p.security_class).filter((s): s is string => s !== null && s !== undefined);
    return [...new Set(securityClasses)];
  }, [policies]);

  // Filter policies
  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      const matchesSearch = !searchTerm ||
        (policy.policy_name && policy.policy_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (policy.security_class && policy.security_class.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSecurityClass = !securityClassFilter || policy.security_class === securityClassFilter;

      // Scope filtering logic
      let matchesScope = true;
      if (scopeFilter === 'object') {
        matchesScope = !!policy.object_id;
      } else if (scopeFilter === 'project') {
        matchesScope = !!policy.project_id;
      } else if (scopeFilter === 'tenant') {
        matchesScope = !policy.object_id && !policy.project_id;
      }
      // If no scope filter is applied (empty string), show all

      return matchesSearch && matchesSecurityClass && matchesScope;
    });
  }, [policies, searchTerm, scopeFilter, securityClassFilter]);

  const handleDeleteClick = (policy: SecurityPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;

    try {
      await deletePolicy(policyToDelete.pii_policy_id).unwrap();
      setSnackbar({
        open: true,
        message: 'Policy deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete policy',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
    }
  };

  const handleUpdateDefaultPolicy = async () => {
    try {
      // For now, just show a message. In a real implementation, you'd need to select which policy to make default
      setSnackbar({
        open: true,
        message: 'Default policy updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update default policy',
        severity: 'error'
      });
    }
  };

  const handleSavePolicy = async (policyData: any) => {
    try {
      if (slideInMode === 'create') {
        await createPolicy(policyData).unwrap();
        setSnackbar({
          open: true,
          message: 'Policy created successfully',
          severity: 'success'
        });
      } else if (slideInMode === 'edit' && selectedPolicy) {
        await updatePolicy({ id: selectedPolicy.pii_policy_id, data: policyData }).unwrap();
        setSnackbar({
          open: true,
          message: 'Policy updated successfully',
          severity: 'success'
        });
      } else if (slideInMode === 'update-default') {
        // policyData is { scopeType, selectedProject, selectedSystem, selectedObject }
        const data = policyData.scopeType === 'project'
          ? { project_id: policyData.selectedProject }
          : { object_id: policyData.selectedObject };
        await updateDefaultPolicyScope(data).unwrap();
        setSnackbar({
          open: true,
          message: 'Default policy scope updated successfully',
          severity: 'success'
        });
      }
      setSlideInOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to ${slideInMode === 'create' ? 'create' : slideInMode === 'edit' ? 'update' : 'update default'} policy`,
        severity: 'error'
      });
    }
  };

  const getScopeChip = (policy: SecurityPolicy) => {
    if (policy.object_id) return <Chip label="Object" size="small" color="primary" variant="outlined" />;
    if (policy.project_id) return <Chip label="Project" size="small" color="secondary" variant="outlined" />;
    return <Chip label="Tenant" size="small" color="default" variant="outlined" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box sx={{ px: 3, pb: 3, pt: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ px: 3, pb: 3, pt: 0 }}>
        <Alert severity="error">
          Failed to load security policies. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, pb: 1, pt: 0 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Security Policies
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 1,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            minHeight: 48,
            borderRadius: '8px 8px 0 0',
            marginRight: 1,
            '&.Mui-selected': {
              backgroundColor: '#1976d2',
              color: 'white',
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&.Mui-selected': {
                backgroundColor: '#1565c0',
              },
            },
          },
          '& .MuiTabs-indicator': {
            display: 'none',
          },
        }}
      >
        <Tab label="Dashboard" />
        <Tab label="Policies" />
      </Tabs>

      {activeTab === 0 && <SecurityPolicyDashboard />}

      {activeTab === 1 && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
          <Grid container spacing={3}>


        {/* Action Buttons and Filters Combined */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ py: 1, px: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Filters
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSlideInMode('create');
                      setSelectedPolicy(null);
                      setSlideInOpen(true);
                      setSelectedRow(null); // Clear selection after opening
                    }}
                    size="small"
                  >
                    Create Policy
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      if (selectedRow) {
                        setSlideInMode('edit');
                        setSelectedPolicy(selectedRow);
                        setSlideInOpen(true);
                      } else {
                        setSnackbar({
                          open: true,
                          message: 'Please select a row to edit',
                          severity: 'warning'
                        });
                      }
                    }}
                    size="small"
                  >
                    Edit Policy
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => {
                      setSlideInMode('update-default');
                      setSelectedPolicy(null); // In a real implementation, you'd select a policy first
                      setSlideInOpen(true);
                    }}
                    size="small"
                  >
                    Update Default Policy
                  </Button>
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter by Scope</InputLabel>
                    <Select
                      value={scopeFilter}
                      onChange={(e) => setScopeFilter(e.target.value)}
                      label="Filter by Scope"
                    >
                      <MenuItem value="">All Scopes</MenuItem>
                      <MenuItem value="object">Object Scope</MenuItem>
                      <MenuItem value="project">Project Scope</MenuItem>
                      <MenuItem value="tenant">Tenant Scope</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filter by Security Class</InputLabel>
                    <Select
                      value={securityClassFilter}
                      onChange={(e) => setSecurityClassFilter(e.target.value)}
                      label="Filter by Security Class"
                    >
                      <MenuItem value="">All Security Classes</MenuItem>
                      {uniqueSecurityClasses.map((securityClass) => (
                        <MenuItem key={securityClass} value={securityClass}>{securityClass}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Policies Table */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent sx={{ py: 1, px: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Security Policies ({filteredPolicies.length})
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 600, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Policy Name</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShieldIcon sx={{ color: 'primary.main', fontSize: 12 }} />
                          Security Class
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LockIcon sx={{ color: 'success.main', fontSize: 12 }} />
                          Permission
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MaskIcon sx={{ color: 'warning.main', fontSize: 12 }} />
                          Mask
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Ontology Term</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Version</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>PII Policy ID</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Scope</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Status</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Created Date</TableCell>
                      <TableCell sx={{ py: 0, backgroundColor: 'background.paper' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPolicies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 0 }}>
                          <Typography variant="body2" color="text.secondary">
                            No policies found matching the current filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPolicies.map((policy) => (
                        <TableRow
                          key={policy.pii_policy_id}
                          onClick={() => setSelectedRow(policy)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: selectedRow?.pii_policy_id === policy.pii_policy_id ? 'action.selected' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell sx={{ py: 0 }}>{policy.policy_name || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ShieldIcon sx={{ color: 'primary.main', fontSize: 12 }} />
                              {policy.security_class || 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LockIcon sx={{ color: 'success.main', fontSize: 12 }} />
                              {policy.permission || 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MaskIcon sx={{ color: 'warning.main', fontSize: 12 }} />
                              {policy.mask || 'N/A'}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 0 }}>{policy.ontology_term || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 0 }}>{policy.version || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 0 }}>{policy.pii_policy_id}</TableCell>
                          <TableCell sx={{ py: 0 }}>{getScopeChip(policy)}</TableCell>
                          <TableCell sx={{ py: 0 }}>
                            <Chip
                              label={policy.is_active ? 'Active' : 'Inactive'}
                              size="small"
                              color={policy.is_active ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 0 }}>{formatDate(policy.created_date)}</TableCell>
                          <TableCell sx={{ py: 0 }}>
                            <Tooltip title="Delete Policy">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row selection
                                  handleDeleteClick(policy);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Paper>
    )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete Policy
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the policy "{policyToDelete?.policy_name || policyToDelete?.pii_policy_id}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Security Policy Slide-in */}
      <SecurityPolicySlideIn
        open={slideInOpen}
        policy={selectedPolicy}
        mode={slideInMode}
        onClose={() => setSlideInOpen(false)}
        onSave={handleSavePolicy}
      />
    </Box>
  );
};