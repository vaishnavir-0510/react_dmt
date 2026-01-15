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
  const { getReadOnlyFlag, getActivityStatus } = useActivity();

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
        message: "No object selected",
        color: "error",
      });
      return;
    }

    try {
      await generateLoadFile(objectId).unwrap();
      setSnackbar({
        open: true,
        message: "Load file generated successfully!",
        color: "success",
      });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to generate load file",
        color: "error",
      });
    }
  };

  const handleBackupTarget = async () => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: "No object selected for backup",
        color: "error",
      });
      return;
    }

    try {
      await createBackup(objectId);
      // The hook handles the notifications and status updates
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleLoadData = async () => {
    if (!selectedIterationId) {
      setSnackbar({
        open: true,
        message: "Please select a row with 'Created' status to load data",
        color: "error",
      });
      return;
    }

    if (!objectId) {
      setSnackbar({
        open: true,
        message: "No object selected",
        color: "error",
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
        message: "Data loaded successfully!",
        color: "success",
      });
      refetch();
      // Clear selection after successful load
      setSelectedIterationId(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to load data",
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
        message: "Only rows with 'Created' status can be selected",
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

      {/* Table */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                Select
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Records</TableCell>
              <TableCell>Success</TableCell>
              <TableCell>Failed</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
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
                <TableCell>
                  <Chip
                    label={row.status}
                    color={getStatusColor(row.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{row.record_ct}</TableCell>
                <TableCell>{row.success_ct}</TableCell>
                <TableCell>{row.failed_ct}</TableCell>
                <TableCell>{row.start_dt}</TableCell>
                <TableCell>{row.end_dt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Show empty state if no data */}
      {tableData.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
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
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        ContentProps={{
          sx: { 
            backgroundColor: 
              snackbar.color === "success" ? "#2e7d32" : 
              snackbar.color === "error" ? "#d32f2f" : 
              "#ed6c02" 
          },
        }}
      />
    </Box>
  );
};