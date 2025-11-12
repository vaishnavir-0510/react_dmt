import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface IdleTimeoutDialogProps {
  open: boolean;
  countdown: number;
  onStayActive: () => void;
  onLogout: () => void;
}

export const IdleTimeoutDialog: React.FC<IdleTimeoutDialogProps> = ({
  open,
  countdown,
  onStayActive,
  onLogout,
}) => {
  return (
    <Dialog open={open} onClose={onStayActive}>
      <DialogTitle>Session Timeout Warning</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have been idle for too long. You will be automatically logged out in{' '}
          <Typography component="span" fontWeight="bold">
            {countdown}
          </Typography>{' '}
          seconds.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="error">
          Logout Now
        </Button>
        <Button onClick={onStayActive} variant="contained" autoFocus>
          Stay Active
        </Button>
      </DialogActions>
    </Dialog>
  );
};