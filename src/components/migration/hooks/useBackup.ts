// hooks/useBackup.ts
import { useState, useEffect, useRef } from 'react';
import { useCreateLoadBackupMutation, useLazyGetBackupStatusQuery, type BackupStatus } from '../../../services/backuploadApi';


interface SnackbarState {
  open: boolean;
  message: string;
  color: 'success' | 'error' | 'info' | 'warning';
}

export const useBackup = () => {
  const [createLoadBackup, { isLoading: isCreatingBackup }] = useCreateLoadBackupMutation();
  const [getBackupStatus] = useLazyGetBackupStatusQuery();
  
  const [backupJobId, setBackupJobId] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    color: 'info'
  });
  const statusTimerRef = useRef<number | null>(null);

  // Check if backup is completed
  const isBackupCompleted = backupStatus && 
    ['SUCCESS', 'FAILED', 'COMPLETED'].includes(backupStatus.status);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearInterval(statusTimerRef.current);
      }
    };
  }, []);

  // Show snackbar
  const showSnackbar = (message: string, color: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      color
    });
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Start polling for backup status
  const startStatusPolling = (jobId: string) => {
    setBackupJobId(jobId);
    
    // Clear existing timer
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
    }

    // Start new polling
    statusTimerRef.current = window.setInterval(async () => {
      try {
        const result = await getBackupStatus(jobId).unwrap();
        setBackupStatus(result);

        // Stop polling if backup is completed
        if (['SUCCESS', 'FAILED', 'COMPLETED'].includes(result.status)) {
          if (statusTimerRef.current) {
            clearInterval(statusTimerRef.current);
          }
          setIsButtonDisabled(false);
          
          // Show success/error notification
          if (result.status === 'SUCCESS' || result.status === 'COMPLETED') {
            showSnackbar('Backup completed successfully!', 'success');
          } else {
            showSnackbar(`Backup failed: ${result.message || 'Unknown error'}`, 'error');
          }
        }
      } catch (error) {
        console.error('Error checking backup status:', error);
        showSnackbar('Error checking backup status', 'error');
        setIsButtonDisabled(false);
        
        if (statusTimerRef.current) {
          clearInterval(statusTimerRef.current);
        }
      }
    }, 1000); // Poll every second
  };

  // Create backup function
  const createBackup = async (objectId: string) => {
    if (!objectId) {
      showSnackbar('No object selected for backup', 'error');
      return;
    }

    try {
      setIsButtonDisabled(true);
      setBackupStatus(null);
      showSnackbar('Starting backup process...', 'info');

      const result = await createLoadBackup({ objectId }).unwrap();
      
      if (result.backup_job_id) {
        showSnackbar('Backup started successfully!', 'success');
        startStatusPolling(result.backup_job_id);
      } else {
        throw new Error('No backup job ID received');
      }
      
      return result;
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      setIsButtonDisabled(false);
      
      const errorMessage = error?.data?.message || error?.message || 'Failed to create backup';
      showSnackbar(errorMessage, 'error');
      throw error;
    }
  };

  // Reset backup state
  const resetBackupState = () => {
    setBackupJobId(null);
    setBackupStatus(null);
    setIsButtonDisabled(false);
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
    }
  };

  return {
    // State
    backupJobId,
    backupStatus,
    isButtonDisabled,
    isCreatingBackup,
    isBackupCompleted,
    snackbar,
    
    // Actions
    createBackup,
    resetBackupState,
    closeSnackbar,
    
    // Computed values
    isLoading: isCreatingBackup || (backupJobId && !isBackupCompleted),
    showStatusIndicator: backupJobId && !isBackupCompleted,
  };
};