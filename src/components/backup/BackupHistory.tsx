import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Collapse,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetBackupSummaryDetailsQuery, useLazyDownloadBackupQuery } from '../../services/backupApi';

const BackupHistory: React.FC = () => {
  const { selectedProject } = useSelector((state: RootState) => state.app);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Get selected object for backup history
  const [selectedObject, setSelectedObject] = useState<any>(null);

  useEffect(() => {
    const storedObject = localStorage.getItem('selectedBackupObject');
    if (storedObject) {
      try {
        const parsed = JSON.parse(storedObject);
        setSelectedObject(parsed);
      } catch (error) {
        console.error('Failed to parse selected backup object:', error);
      }
    }
  }, []);

  const {
    data: historyData,
    isLoading,
    error,
    refetch
  } = useGetBackupSummaryDetailsQuery(selectedObject?.object_id || '', {
    skip: !selectedObject?.object_id,
  });

  const [downloadBackup] = useLazyDownloadBackupQuery();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'running':
      case 'processing':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleToggleExpand = (backupId: string) => {
    setExpandedRow(expandedRow === backupId ? null : backupId);
  };

  const hasBackupDetails = (backup: any) => {
    return backup.backup_details && backup.backup_details.length > 0;
  };

  const handleDownload = async (backup: any) => {
    if (!selectedObject?.object_id || !backup.filename || !backup.version) {
      setNotification({
        open: true,
        message: 'Missing required information for download.',
        severity: 'error',
      });
      return;
    }

    try {
      const result = await downloadBackup({
        object_id: selectedObject.object_id,
        filename: backup.filename,
        version: backup.version.toString(),
      }).unwrap();

      // Assuming the API returns a download URL or triggers a download
      setNotification({
        open: true,
        message: 'Download started successfully.',
        severity: 'success',
      });

      // If the API returns a URL, you might need to handle the download differently
      // For now, we'll assume it triggers the download automatically

    } catch (error: any) {
      console.error('Download failed:', error);
      setNotification({
        open: true,
        message: `Download failed: ${error?.data?.message || error.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  if (!selectedObject) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Please select an object for backup first.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          Error loading backup history
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try again later
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Backup History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your backup history for {selectedObject?.name || selectedObject?.object_name}
          </Typography>
        </div>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refetch}>
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {historyData?.some((backup: any) => hasBackupDetails(backup)) && <TableCell></TableCell>}
              <TableCell>Backup ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyData && historyData.length > 0 ? (
              historyData.map((backup: any, index: number) => (
                <React.Fragment key={backup.id || backup.backup_id || `backup-${index}`}>
                  <TableRow hover>
                    {historyData?.some((b: any) => hasBackupDetails(b)) && (
                      <TableCell>
                        {hasBackupDetails(backup) && (
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(backup.name)}
                          >
                            {expandedRow === backup.name ? <CollapseIcon /> : <ExpandIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {backup.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {backup.created_date ? new Date(backup.created_date).toLocaleString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Full Backup
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="COMPLETED"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {backup.total_records ? `${backup.total_records} records` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {backup.time_taken || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details Row */}
                  {hasBackupDetails(backup) && (
                    <TableRow>
                      <TableCell colSpan={
                        (historyData?.some((b: any) => hasBackupDetails(b)) ? 1 : 0) + 6
                      } sx={{ py: 0 }}>
                        <Collapse in={expandedRow === backup.name} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="h6" gutterBottom>
                              Backup Details
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                              {backup.name && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Backup Name
                                  </Typography>
                                  <Typography variant="body2">
                                    {backup.name}
                                  </Typography>
                                </Box>
                              )}
                              {backup.created_date && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Created Date
                                  </Typography>
                                  <Typography variant="body2">
                                    {new Date(backup.created_date).toLocaleString()}
                                  </Typography>
                                </Box>
                              )}
                              {backup.modified_date && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Modified Date
                                  </Typography>
                                  <Typography variant="body2">
                                    {new Date(backup.modified_date).toLocaleString()}
                                  </Typography>
                                </Box>
                              )}
                              {backup.chunk_size && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Chunk Size
                                  </Typography>
                                  <Typography variant="body2">
                                    {backup.chunk_size}
                                  </Typography>
                                </Box>
                              )}
                              {backup.chunk_count && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Chunk Count
                                  </Typography>
                                  <Typography variant="body2">
                                    {backup.chunk_count}
                                  </Typography>
                                </Box>
                              )}
                              {backup.time_taken && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Time Taken
                                  </Typography>
                                  <Typography variant="body2">
                                    {backup.time_taken}
                                  </Typography>
                                </Box>
                              )}
                              {backup.total_records && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Total Records
                                  </Typography>
                                  <Typography variant="body2">
                                    {backup.total_records}
                                  </Typography>
                                </Box>
                              )}
                              {backup.backup_details && backup.backup_details.length > 0 && (
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Backup Files
                                  </Typography>
                                  {backup.backup_details.map((detail: any, detailIndex: number) => (
                                    <Box key={detail.filename || detail.version || `detail-${detailIndex}`} sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                          <Typography variant="body2">
                                            <strong>Filename:</strong> {detail.filename}
                                          </Typography>
                                          <Typography variant="body2">
                                            <strong>Version:</strong> {detail.version}
                                          </Typography>
                                          <Typography variant="body2">
                                            <strong>Chunk Size:</strong> {detail.chunk_size}
                                          </Typography>
                                          <Typography variant="body2">
                                            <strong>Chunk Count:</strong> {detail.chunk_count}
                                          </Typography>
                                        </Box>
                                        <Button
                                          size="small"
                                          startIcon={<DownloadIcon />}
                                          onClick={() => handleDownload(detail)}
                                          sx={{ ml: 2, flexShrink: 0 }}
                                        >
                                          Download
                                        </Button>
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No backup history available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export { BackupHistory };