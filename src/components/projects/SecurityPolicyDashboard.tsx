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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as RevealIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  Error as ErrorIcon,
  VisibilityOff as MaskIcon,
} from '@mui/icons-material';
import { useGetSecurityPoliciesQuery, useGetRevealActivitiesQuery, useGetPolicyChangeHistoryQuery } from '../../services/securityPoliciesApi';
import { useGetSystemUsersQuery } from '../../services/userApi';
import type { SecurityPolicy, RevealActivity, PolicyChangeHistory } from '../../services/securityPoliciesApi';
import type { SystemUser } from '../../types';

// Pagination state

export const SecurityPolicyDashboard: React.FC = () => {
  // Pagination states
  const [revealPage, setRevealPage] = useState(0);
  const [policyPage, setPolicyPage] = useState(0);
  const rowsPerPage = 5;

  const { data: policies = [], isLoading: policiesLoading, error: policiesError } = useGetSecurityPoliciesQuery();
  const { data: revealData, isLoading: revealLoading, error: revealError } = useGetRevealActivitiesQuery();
  const { data: policyHistoryData, isLoading: historyLoading, error: historyError } = useGetPolicyChangeHistoryQuery();
  const { data: systemUsers = [] } = useGetSystemUsersQuery();

  const revealActivities = revealData?.message || [];
  const policyChanges = policyHistoryData?.message || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Create user ID to username mapping
  const userIdToUsername = useMemo(() => {
    const mapping: Record<string, string> = {};
    systemUsers.forEach((user: SystemUser) => {
      mapping[user.id] = user.username;
    });
    return mapping;
  }, [systemUsers]);

  // Calculate metrics from real data
  const metrics = {
    totalRevealSessions: revealActivities.length,
    activeSessions: revealActivities.filter(r => r.is_active).length,
    totalPolicyChanges: policyChanges.length,
    disabledPolicies: policyChanges.filter(log => log.new_value?.[0]?.is_active === false).length,
    maskChanges: policyChanges.filter(log => log.old_value?.[0]?.mask !== log.new_value?.[0]?.mask).length,
    lastAuditActivity: policyChanges.length > 0 ? formatDate(policyChanges[0].datetime) : 'N/A'
  };

  // Calculate governance alerts with correct logic
  const governanceAlerts = useMemo(() => {
    // Security class order (higher number = more restrictive)
    const SECURITY_ORDER: Record<string, number> = {
      'Public': 1,
      'Confidential': 2,
      'Restricted': 3,
    };

    // Mask strength order (higher number = stronger protection)
    const MASK_ORDER: Record<string, number> = {
      'NONE': 1,
      'PARTIAL': 2,
      'HASH': 3,
    };

    // Count disabled policies
    const disabledPolicies = policyChanges.filter(log =>
      log.old_value?.[0]?.is_active === true &&
      log.new_value?.[0]?.is_active === false
    ).length;

    // Count security class downgrades
    const securityDowngrades = policyChanges.filter(log => {
      const oldClass = log.old_value?.[0]?.security_class;
      const newClass = log.new_value?.[0]?.security_class;

      return oldClass &&
             newClass &&
             SECURITY_ORDER[newClass] < SECURITY_ORDER[oldClass];
    }).length;

    // Count mask weakenings
    const maskWeakenings = policyChanges.filter(log => {
      const oldMask = log.old_value?.[0]?.mask;
      const newMask = log.new_value?.[0]?.mask;

      return oldMask &&
             newMask &&
             MASK_ORDER[newMask] < MASK_ORDER[oldMask];
    }).length;

    return { disabledPolicies, securityDowngrades, maskWeakenings };
  }, [policyChanges]);

  const getChangeType = (oldValue: SecurityPolicy[], newValue: SecurityPolicy[]) => {
    if (!oldValue?.length || !newValue?.length) return 'Policy Updated';

    const oldPolicy = oldValue[0];
    const newPolicy = newValue[0];

    if (newPolicy.is_active === false) return 'Policy Disabled';
    if (oldPolicy.mask !== newPolicy.mask) return 'Mask Changed';
    if (oldPolicy.security_class !== newPolicy.security_class) return 'Security Class Changed';

    return 'Policy Updated';
  };

  const formatOldNew = (oldValue: SecurityPolicy[], newValue: SecurityPolicy[]) => {
    if (!oldValue?.length || !newValue?.length) return 'N/A → N/A';

    const oldMask = oldValue[0].mask || 'NONE';
    const newMask = newValue[0].mask || 'NONE';

    return `${oldMask} → ${newMask}`;
  };

  if (policiesLoading || revealLoading || historyLoading) {
    return (
      <Box sx={{ px: 3, pb: 3, pt: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (policiesError || revealError || historyError) {
    return (
      <Box sx={{ px: 3, pb: 3, pt: 0 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, pb: 1, pt: 0 }}>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
        <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={4}>
              <Card elevation={2} sx={{ height: 100 }}>
                <CardContent sx={{ py: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <RevealIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight="bold">
                        {metrics.totalRevealSessions.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="success.main" fontWeight="bold">
                        Active: {metrics.activeSessions}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total reveal attempts
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={2} sx={{ height: 100 }}>
                <CardContent sx={{ py: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <ShieldIcon sx={{ fontSize: 32, color: 'info.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight="bold">
                        {metrics.totalPolicyChanges.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="error.main" fontWeight="bold">
                        Disabled: {metrics.disabledPolicies}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last audit activity
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={2} sx={{ height: 100 }}>
                <CardContent sx={{ py: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <MaskIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight="bold">
                        {metrics.maskChanges.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Mask changes detected
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Governance Alert Banner */}
        {(governanceAlerts.disabledPolicies > 0 || governanceAlerts.securityDowngrades > 0 || governanceAlerts.maskWeakenings > 0) && (
          <Grid item xs={12}>
            <Alert
              severity="warning"
              sx={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7',
                '& .MuiAlert-icon': {
                  color: '#856404',
                },
              }}
            >
              <Typography variant="body1" fontWeight="bold">
                Governance Alert: {governanceAlerts.disabledPolicies} policies disabled, {governanceAlerts.securityDowngrades} security class downgrades, {governanceAlerts.maskWeakenings} masking protections weakened. Immediate review is recommended.
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Activity Tables */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Policy Change History Table */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, height: 500, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Policy Change History
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Date</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Policy</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Change Type</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Old → New</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>User</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {policyChanges.slice(policyPage * rowsPerPage, policyPage * rowsPerPage + rowsPerPage).map((change) => (
                        <TableRow key={change.id}>
                          <TableCell sx={{ py: 1 }}>{formatDate(change.datetime)}</TableCell>
                          <TableCell sx={{ py: 1 }}>{change.new_value?.[0]?.policy_name || 'N/A'}</TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip
                              label={getChangeType(change.old_value, change.new_value)}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>{formatOldNew(change.old_value, change.new_value)}</TableCell>
                          <TableCell sx={{ py: 1 }}>{userIdToUsername[change.user_id] || change.user_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={policyChanges.length}
                  page={policyPage}
                  onPageChange={(_, newPage) => setPolicyPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5]}
                />
              </Paper>
            </Grid>

            {/* Reveal Activity Table */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, height: 500, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Reveal Activity
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>User</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Object</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Reveal</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>Created Date</TableCell>
                        <TableCell sx={{ py: 1, backgroundColor: 'background.paper' }}>IP Address</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revealActivities.slice(revealPage * rowsPerPage, revealPage * rowsPerPage + rowsPerPage).map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell sx={{ py: 1 }}>{userIdToUsername[activity.user_id] || activity.user_id}</TableCell>
                          <TableCell sx={{ py: 1 }}>{activity.object_id}</TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip
                              label={activity.reveal_flag ? 'YES' : 'NO'}
                              size="small"
                              color={activity.reveal_flag ? 'error' : 'success'}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>{formatDate(activity.created_date)}</TableCell>
                          <TableCell sx={{ py: 1 }}>{activity.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={revealActivities.length}
                  page={revealPage}
                  onPageChange={(_, newPage) => setRevealPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5]}
                />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      </Paper>
    </Box>
  );
};