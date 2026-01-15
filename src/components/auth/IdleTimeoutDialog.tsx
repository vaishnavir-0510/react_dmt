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
  // Log dialog state changes
  React.useEffect(() => {
    console.log(`📊 IdleTimeoutDialog - open prop changed: ${open}, countdown: ${countdown}`);
    if (open) {
      console.group('⚠️ Idle Timeout Dialog Opened');
      console.log(`⏰ Dialog opened at: ${new Date().toLocaleString()}`);
      console.log(`⏳ Countdown: ${countdown} seconds`);
      console.log('📋 Dialog will auto-logout user if no action taken');
      console.log('✅ Dialog should be visible on screen now');
      console.groupEnd();
    } else {
      console.log('❌ Idle Timeout Dialog Closed');
    }
  }, [open, countdown]);

  // Log countdown updates
  React.useEffect(() => {
    if (open && (countdown % 10 === 0 || countdown <= 5)) {
      console.log(`⏳ Idle Dialog Countdown: ${countdown} seconds remaining`);
    }
  }, [open, countdown]);

  return (
    <Dialog 
      open={open} 
      onClose={onStayActive}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        ⚠️ Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have been idle for 14 minutes. You will be automatically logged out in{' '}
          <Typography component="span" fontWeight="bold" color="error" fontSize="1.2rem">
            {countdown}
          </Typography>{' '}
          seconds.
        </DialogContentText>
        <DialogContentText sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
          Click "Stay Active" to continue your session or "Logout Now" to end it immediately.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            console.log('🚪 User clicked "Logout Now" button');
            onLogout();
          }} 
          color="error"
        >
          Logout Now
        </Button>
        <Button 
          onClick={() => {
            console.log('✅ User clicked "Stay Active" button');
            onStayActive();
          }} 
          variant="contained" 
          autoFocus
        >
          Stay Active
        </Button>
      </DialogActions>
    </Dialog>
  );
};


