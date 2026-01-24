// components/migration/tabs/LoadTab.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  IconButton,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Checkbox,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BackupIcon from "@mui/icons-material/Backup";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import {
  useGetLoadIterationQuery,
  useGenerateLoadFileMutation,
  useLoadDataMutation,
} from "../../../services/loadApi";

import { LoadIterationSlideIn } from "../LoadIterationSlideIn";
import { useBackup } from "../hooks/useBackup";
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';

export const LoadTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const { getActivityStatus } = useActivity();

  const objectId = selectedObject?.object_id;
  const projectId = selectedProject?.id;

  const { data: tableData = [], refetch, isLoading, error } = useGetLoadIterationQuery(
    { objectId, projectId, environmentId: selectedEnvironment?.id },
    { skip: !objectId || !projectId || !selectedEnvironment?.id }
  );

  // Reset state and refetch data when object, project, or environment changes
  useEffect(() => {
    if (objectId && projectId && selectedEnvironment?.id) {
      setSelectedRow(null);
      setSelectedIterationId(null);
      setHasCreatedStatus(false);
      setSnackbar({ open: false, message: "", color: "success" });
      refetch();
    }
  }, [objectId, projectId, selectedEnvironment?.id, refetch]);

  // Refresh activity status when tab is accessed or environment changes
  useEffect(() => {
    if (objectId && selectedEnvironment?.id) {
      getActivityStatus(objectId);
    }
  }, [objectId, selectedEnvironment?.id, getActivityStatus]);

  const [generateLoadFile, { isLoading: isGenerating }] = useGenerateLoadFileMutation();
  const [loadData, { isLoading: isLoadDataLoading }] = useLoadDataMutation();
  
  // Use the backup hook
  const {
    createBackup,
    backupStatus,
    isButtonDisabled,
    isLoading: isBackupLoading,
    showStatusIndicator,
    isBackupCompleted,
  } = useBackup();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success",
  });

  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedIterationId, setSelectedIterationId] = useState<string | null>(null);
  const [hasCreatedStatus, setHasCreatedStatus] = useState<boolean>(false);

  // Check if any row has "Created" status
  useEffect(() => {
    const createdRowExists = tableData.some(row => row.status === "Created");
    setHasCreatedStatus(createdRowExists);
  }, [tableData]);

  const handleGenerateLoadFile = async () => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: "No object selected. Please select an object first.",
        color: "warning",
      });
      return;
    }

    if (!projectId || !selectedEnvironment?.id) {
      setSnackbar({
        open: true,
        message: "Please select both project and environment.",
        color: "warning",
      });
      return;
    }

    try {
      await generateLoadFile(objectId).unwrap();
      setSnackbar({
        open: true,
        message: "Load file generated successfully! Check your downloads.",
        color: "success",
      });
      refetch();
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to generate load file';
      setSnackbar({
        open: true,
        message: errorMessage,
        color: "error",
      });
    }
  };

  const handleBackupTarget = async () => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: "No object selected for backup. Please select an object first.",
        color: "warning",
      });
      return;
    }

    try {
      await createBackup(objectId);
      // The hook handles the notifications and status updates
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Backup failed';
      setSnackbar({
        open: true,
        message: errorMessage,
        color: "error",
      });
    }
  };

  const handleLoadData = async () => {
    if (!selectedIterationId) {
      setSnackbar({
        open: true,
        message: "Please select a row with 'Created' status to load data",
        color: "warning",
      });
      return;
    }

    if (!objectId) {
      setSnackbar({
        open: true,
        message: "No object selected. Please select an object first.",
        color: "warning",
      });
      return;
    }

    if (!projectId || !selectedEnvironment?.id) {
      setSnackbar({
        open: true,
        message: "Please select both project and environment.",
        color: "warning",
      });
      return;
    }

    try {
      const payload = {
        iterationId: selectedIterationId,
        sourceObjectId: objectId,
        operation: "insert"
      };

      await loadData(payload).unwrap();
      setSnackbar({
        open: true,
        message: `Data loaded successfully for iteration ${selectedIterationId}!`,
        color: "success",
      });
      refetch();
      // Clear selection after successful load
      setSelectedIterationId(null);
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to load data';
      setSnackbar({
        open: true,
        message: errorMessage,
        color: "error",
      });
    }
  };

  const handleCheckboxChange = (iterationId: string, status: string) => {
    if (status === "Created") {
      setSelectedIterationId(iterationId === selectedIterationId ? null : iterationId);
    } else {
      setSnackbar({
        open: true,
        message: `Cannot select iteration with status "${status}". Only rows with "Created" status can be selected for loading.`,
        color: "warning",
      });
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "success";
    if (status === "Failed") return "error";
    return "warning";
  };

  const getBackupStatusColor = () => {
    if (!backupStatus) return 'info';
    
    const status = backupStatus.status.toUpperCase();
    if (status === 'SUCCESS' || status === 'COMPLETED') return 'success';
    if (status === 'FAILED') return 'error';
    if (status === 'RUNNING') return 'warning';
    return 'info';
  };

  const getBackupStatusIcon = () => {
    if (!backupStatus) return null;
    
    const status = backupStatus.status.toUpperCase();
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />;
    }
    if (status === 'FAILED') {
      return <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />;
    }
    return null;
  };

  // Button disable logic
  const isGenerateLoadFileDisabled = isGenerating || !objectId || hasCreatedStatus;
  const isLoadDataButtonDisabled = isLoadDataLoading || !selectedIterationId;

  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load load iteration data.
      </Alert>
    );
  }

  // Show message if no object is selected
  if (!selectedObject) {
    return (
      <Alert severity="info">
        Please select an object to view load data.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Page Title */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          Import the cleaned and transformed data into the target system
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button variant="contained" color="primary" size="small" sx={{ mr: 1 }}>
            Connect
          </Button>

          <ToggleButton
            activity="Load"
            disabled={false}
          />
        </Box>
      </Box>

      {/* Section Title */}
      <Typography variant="h6" sx={{ mt: 3 }}>
        Load Data to Target System
      </Typography>

      {/* Buttons Row */}
      <Grid container spacing={2} sx={{ mt: 1 }} alignItems="center">
        {/* Generate Load File Button */}
        <Grid item>
          <Button
            variant="contained"
            startIcon={
              isGenerating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CloudUploadIcon />
              )
            }
            onClick={handleGenerateLoadFile}
            disabled={isGenerateLoadFileDisabled}
            title={hasCreatedStatus ? "Cannot generate load file while 'Created' status exists in table" : "Generate load file"}
          >
            Generate Load File
          </Button>
        </Grid>

        {/* Backup Target Button with Status */}
        <Grid item>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleBackupTarget}
              disabled={isButtonDisabled || !objectId}
              sx={{ 
                opacity: (isButtonDisabled || !objectId) ? 0.8 : 1,
              }}
            >
              Backup Target
            </Button>

            {/* Status Indicators */}
            {(isBackupLoading || showStatusIndicator) && (
              <>
                <CircularProgress size={18} thickness={5} />
                {backupStatus && (
                  <Typography 
                    variant="body2" 
                    color={getBackupStatusColor()}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {backupStatus.status}
                  </Typography>
                )}
              </>
            )}

            {isBackupCompleted && backupStatus && (
              <>
                {getBackupStatusIcon()}
                <Typography 
                  variant="body2" 
                  color={getBackupStatusColor()}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {backupStatus.status}
                </Typography>
              </>
            )}
          </Box>
        </Grid>

        {/* Load Data Button */}
        <Grid item>
          <Button 
            variant="contained" 
            startIcon={
              isLoadDataLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RocketLaunchIcon />
              )
            }
            onClick={handleLoadData}
            disabled={isLoadDataButtonDisabled}
            title={!selectedIterationId ? "Please select a row with 'Created' status" : "Load data to target"}
          >
            Load Data
          </Button>
        </Grid>

        {/* Refresh Button */}
        <Grid item>
          <IconButton onClick={() => refetch()} disabled={!objectId || !projectId}>
            <RefreshIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Status Information */}
      {hasCreatedStatus && (
        <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
          "Generate Load File" button is disabled because there are rows with "Created" status in the table. 
          Please complete the load process or clear existing created entries to generate new load files.
        </Alert>
      )}

      {/* Table or No Data Message */}
      {tableData.length > 0 ? (
        <Paper sx={{ mt: 3, p: 2 }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    Select
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Object ID</TableCell>
                  <TableCell>File ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Batch Size</TableCell>
                  <TableCell>Bulk Mode</TableCell>
                  <TableCell>Success File</TableCell>
                  <TableCell>Error File</TableCell>
                  <TableCell>Unprocessed File</TableCell>
                  <TableCell>Load Track</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Modified By</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Modified Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Error Message</TableCell>
                  <TableCell>Environment</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {tableData.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => setSelectedRow(row)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIterationId === row.id}
                        onChange={() => handleCheckboxChange(row.id, row.status)}
                        disabled={row.status !== "Created"}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.object_id}</TableCell>
                    <TableCell>{row.file_id}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.operation}</TableCell>
                    <TableCell>{row.start_dt}</TableCell>
                    <TableCell>{row.end_dt}</TableCell>
                    <TableCell>{row.duration}</TableCell>
                    <TableCell>{row.record_ct}</TableCell>
                    <TableCell>{row.success_ct}</TableCell>
                    <TableCell>{row.failed_ct}</TableCell>
                    <TableCell>{row.batch_size}</TableCell>
                    <TableCell>{row.bulk_mode}</TableCell>
                    <TableCell>{row.success_file}</TableCell>
                    <TableCell>{row.error_file}</TableCell>
                    <TableCell>{row.unprocessed_file}</TableCell>
                    <TableCell>{row.load_track}</TableCell>
                    <TableCell>{row.created_by}</TableCell>
                    <TableCell>{row.modified_by}</TableCell>
                    <TableCell>{row.created_date}</TableCell>
                    <TableCell>{row.modified_date}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={getStatusColor(row.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.job_id}</TableCell>
                    <TableCell>{row.error_msg || 'No errors'}</TableCell>
                    <TableCell>{row.environment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          No load iterations found for this object.
        </Alert>
      )}

      {/* Selection Info */}
      {selectedIterationId && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Selected iteration: {selectedIterationId} - Ready to load data
        </Alert>
      )}

      {/* Slide-In Drawer */}
      <LoadIterationSlideIn
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.color === "success" ? "success" : snackbar.color === "error" ? "error" : "warning"}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};