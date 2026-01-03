// src/components/migration/ToggleButton.tsx
import React, { useState } from 'react';
import {
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useActivity } from './ActivityProvider';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface ToggleButtonProps {
  activity: string;
  label?: string;
  disabled?: boolean;
  showAlert?: boolean;
  alertMessage?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  activity,
  label = 'Mark Completed',
  disabled = false,
  showAlert = true,
  alertMessage,
}) => {
  // Ensure disabled is always boolean
  const safeDisabled = Boolean(disabled);
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedEnvironment } = useSelector((state: RootState) => state.app);

  const {
    getCompletionStatus,
    getReadOnlyFlag,
    toggleCompletionStatus,
    isRevealMode,
    canReveal,
    activateRevealMode,
  } = useActivity();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  const isCompleted = getCompletionStatus(activity);
  const isReadOnly = getReadOnlyFlag(activity);

  // Check if environment is restricted
  const restrictedEnvs = ['prod', 'qa', 'uat'];
  const isRestrictedEnv = selectedEnvironment?.name &&
    restrictedEnvs.some(env => selectedEnvironment.name.toLowerCase().includes(env));

  const isDisabled = !!(safeDisabled || isUpdating || (isRestrictedEnv && !isRevealMode));

  const handleToggle = async () => {
    if (!selectedObject?.object_id) return;

    // Check if restricted environment and not in reveal mode
    if (isRestrictedEnv && !isRevealMode) {
      if (canReveal) {
        setShowPermissionDialog(true);
      }
      return;
    }

    setIsUpdating(true);
    try {
      await toggleCompletionStatus(activity, selectedObject.object_id, isCompleted);
    } catch (error) {
      console.error('Failed to toggle completion status:', error);
      // Error handling - could show a snackbar here
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePermissionConfirm = () => {
    setShowPermissionDialog(false);
    activateRevealMode();
    // Don't auto-toggle, let user click again after reveal mode activates
  };

  const handlePermissionCancel = () => {
    setShowPermissionDialog(false);
  };

  const getAlertMessage = () => {
    if (alertMessage) return alertMessage;

    if (isCompleted) {
      return `This page is currently read-only due to ${activity.toLowerCase()} finalization.`;
    }

    if (isReadOnly) {
      return `This page is in view-only mode because ${activity.toLowerCase()} is marked as completed.`;
    }

    return '';
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {showAlert && (isCompleted || isReadOnly) && (
          <Alert severity="warning" sx={{ flex: 1, minWidth: '300px' }}>
            {getAlertMessage()}
          </Alert>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={isCompleted}
              onChange={handleToggle}
              disabled={isDisabled}
              color="success"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon
                sx={{ color: isCompleted ? 'success.main' : 'grey.400' }}
              />
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {label}
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Permission Dialog for Restricted Environments */}
      <Dialog
        open={showPermissionDialog}
        onClose={handlePermissionCancel}
        aria-labelledby="permission-dialog-title"
        aria-describedby="permission-dialog-description"
      >
        <DialogTitle id="permission-dialog-title">
          Environment Restriction Override
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="permission-dialog-description">
            This environment ({selectedEnvironment?.name}) has restrictions that prevent editing.
            Would you like to temporarily enable editing mode for 2 minutes?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePermissionCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePermissionConfirm} color="primary" variant="contained">
            Enable Editing
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};