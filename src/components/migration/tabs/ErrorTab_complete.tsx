// components/migration/tabs/ErrorTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  DialogContentText,
  Divider,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Block as IgnoreIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetErrorTrackerQuery, useUpdateErrorMutation, useGetErrorTrackerDataRecordsQuery, useUpdateErrorRecordMutation, useLazyEmailAllErrorRecordsQuery, useLoadAllErrorRecordsMutation, useLazyEmailErrorRecordQuery, useLazyIgnoreErrorRecordQuery, useLazyDownloadErrorCsvQuery, useEditSelectedErrorRecordsMutation } from '../../../services/errorApi';
import type { ErrorTrackerDataRecordsResponse } from '../../../services/errorApi';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';

interface ErrorRecord {
  id: string;
  iteration_reference: string;
  error: string;
  comment: string;
  Fix: string;
  Count: number;
  object_id: string;
  created_by: string;
  modified_by: string;
  created_date: string;
  modified_date: string;
  is_ignored: boolean;
  environment: string;
  is_current: boolean;
  status: string;
  reload_job: string | null;
  remediation_default_action: string;
  remediation_status: string | null;
  object_name: string;
}

interface ErrorResponse {
  records: ErrorRecord[];
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export const ErrorTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { getReadOnlyFlag, getActivityStatus } = useActivity();
  const objectId = selectedObject?.object_id;

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // State for selected rows (single selection)
  const [selected, setSelected] = useState<string>('');

  // State for selected error record and data records
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [dataRecordsPage, setDataRecordsPage] = useState(0);
  const [dataRecordsRowsPerPage, setDataRecordsRowsPerPage] = useState(5);

  // State for data records editing
  const [selectedDataRecordIndex, setSelectedDataRecordIndex] = useState<number | null>(null);
  const [editDataRecordOpen, setEditDataRecordOpen] = useState(false);
  const [editDataRecord, setEditDataRecord] = useState<Record<string, any>>({});
  const [editSelectedRecordOpen, setEditSelectedRecordOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<Record<string, any> | null>(null);

  // State for bulk actions
  const [isEmailAllLoading, setIsEmailAllLoading] = useState(false);
  const [isLoadAllLoading, setIsLoadAllLoading] = useState(false);

  // State for slide-in dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ErrorRecord | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editFix, setEditFix] = useState('');

  // State for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // API calls
  const {
    data: errorData,
    isLoading,
    error,
    refetch,
  } = useGetErrorTrackerQuery(
    { objectId, page: page + 1, pageSize: rowsPerPage },
    { skip: !objectId }
  );

  // Refetch data when object changes
  useEffect(() => {
    if (objectId) {
      setPage(0); // Reset to first page when object changes
      refetch();
    }
  }, [objectId, refetch]);

  // Refresh activity status when tab is accessed
  useEffect(() => {
    if (objectId) {
      getActivityStatus(objectId);
    }
  }, [objectId, getActivityStatus]);

  const [updateError] = useUpdateErrorMutation();
  const [updateErrorRecord] = useUpdateErrorRecordMutation();
  const [editSelectedErrorRecords] = useEditSelectedErrorRecordsMutation();
  const [emailAllErrorRecords] = useLazyEmailAllErrorRecordsQuery();
  const [loadAllErrorRecords] = useLoadAllErrorRecordsMutation();
  const [emailErrorRecord] = useLazyEmailErrorRecordQuery();
  const [ignoreErrorRecord] = useLazyIgnoreErrorRecordQuery();
  const [downloadErrorCsv] = useLazyDownloadErrorCsvQuery();

  // API for data records
  const {
    data: dataRecords,
    isLoading: isLoadingDataRecords,
    error: dataRecordsError,
  } = useGetErrorTrackerDataRecordsQuery(
    {
      summaryId: selectedErrorId || '',
      objectId: objectId || '',
      page: dataRecordsPage + 1,
      pageSize: dataRecordsRowsPerPage
    },
    { skip: !selectedErrorId || !objectId }
  ) as { data: ErrorTrackerDataRecordsResponse, isLoading: boolean, error: any };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDataRecordsPageChange = (event: unknown, newPage: number) => {
    setDataRecordsPage(newPage);
  };

  const handleDataRecordsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDataRecordsRowsPerPage(parseInt(event.target.value, 10));
    setDataRecordsPage(0);
  };

  const handleDataRecordSelect = (index: number, record: Record<string, any>) => {
    setSelectedDataRecordIndex(index);
    setEditDataRecord({ ...record });
  };

  const handleEditSelectedRecord = () => {
    if (selectedDataRecordIndex !== null && dataRecords?.records) {
      setSelectedRecordForEdit(dataRecords.records[selectedDataRecordIndex]);
      setEditSelectedRecordOpen(true);
    } else {
      setSnackbar({
        open: true,
        message: 'Please select any row first to edit record',
        severity: 'warning',
      });
    }
  };

  const handleEditSelectedRecordClose = () => {
    setEditSelectedRecordOpen(false);
    setSelectedRecordForEdit(null);
  };

  const handleEditSelectedRecordSave = async () => {
    if (!selectedRecordForEdit || !selectedErrorId || !objectId) return;

    try {
      await editSelectedErrorRecords({
        summary_id: selectedErrorId,
        object_id: objectId,
        editedRecords: [selectedRecordForEdit]
      }).unwrap();

      setSnackbar({
        open: true,
        message: 'Record updated successfully!',
        severity: 'success',
      });
      setEditSelectedRecordOpen(false);
      setSelectedRecordForEdit(null);
      setSelectedDataRecordIndex(null); // Reset checkbox selection
      setEditDataRecord({}); // Disable edit button
      // Refetch data records to show updated data
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to update record';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleEditSelectedRecordChange = (field: string, value: any) => {
    if (selectedRecordForEdit) {
      setSelectedRecordForEdit({
        ...selectedRecordForEdit,
        [field]: value
      });
    }
  };

  const handleDataRecordEditClose = () => {
    setEditDataRecordOpen(false);
    setSelectedDataRecordIndex(null);
    setEditDataRecord({});
  };

  const handleDataRecordEditSave = async () => {
    if (!selectedErrorId || !objectId || selectedDataRecordIndex === null) return;

    // Basic validation - check if any field is empty
    const hasEmptyFields = Object.values(editDataRecord).some(value =>
      value === null || value === undefined || String(value).trim() === ''
    );

    if (hasEmptyFields) {
      setSnackbar({
        open: true,
        message: 'All fields are required. Please fill in all fields before saving.',
        severity: 'warning',
      });
      return;
    }

    try {
      await updateErrorRecord({
        summaryId: selectedErrorId,
        objectId: objectId,
        recordData: editDataRecord
      }).unwrap();

      setSnackbar({
        open: true,
        message: 'Data record updated successfully!',
        severity: 'success',
      });
      handleDataRecordEditClose();
      // Optionally refetch data records
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to update data record';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleEditDataRecordChange = (field: string, value: any) => {
    setEditDataRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailAll = async () => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: 'No object selected. Please select an object first.',
        severity: 'warning',
      });
      return;
    }

    // Check if there are any error records
    if (!errorData?.records || errorData.records.length === 0) {
      setSnackbar({
        open: true,
        message: 'No error records found to email.',
        severity: 'warning',
      });
      return;
    }

    setIsEmailAllLoading(true);
    try {
      await emailAllErrorRecords(objectId).unwrap();
      setSnackbar({
        open: true,
        message: `Email sent successfully to ${errorData.records.length} error record${errorData.records.length > 1 ? 's' : ''}!`,
        severity: 'success',
      });
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to send emails';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsEmailAllLoading(false);
    }
  };

  const handleLoadAll = async () => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: 'No object selected. Please select an object first.',
        severity: 'warning',
      });
      return;
    }

    // Check if there are any error records
    if (!errorData?.records || errorData.records.length === 0) {
      setSnackbar({
        open: true,
        message: 'No error records found to generate load file.',
        severity: 'warning',
      });
      return;
    }

    setIsLoadAllLoading(true);
    try {
      await loadAllErrorRecords(objectId).unwrap();
      setSnackbar({
        open: true,
        message: 'Load file generated successfully! Check your downloads.',
        severity: 'success',
      });
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to generate load file';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsLoadAllLoading(false);
    }
  };

  // Handle row selection (single selection)
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    // For single selection, select all doesn't make sense, so do nothing
  };

  const handleRowClick = (record: ErrorRecord) => {
    setSelectedErrorId(record.id);
    setSelected(record.id); // Also select the checkbox
    setDataRecordsPage(0); // Reset to first page when selecting new error
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    setSelected(selected === id ? '' : id);
  };

  const isSelected = (id: string) => selected === id;

  // Handle edit dialog
  const handleEditClick = (record: ErrorRecord) => {
    setEditingRecord(record);
    setEditComment(record.comment || '');
    setEditFix(record.Fix || '');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;

    // Validate input
    if (!editComment.trim() && !editFix.trim()) {
      setSnackbar({
        open: true,
        message: 'Please add a comment or fix description before saving',
        severity: 'warning',
      });
      return;
    }

    try {
      await updateError({
        id: editingRecord.id,
        comment: editComment.trim(),
        Fix: editFix.trim(),
      }).unwrap();

      setSnackbar({
        open: true,
        message: 'Error record updated successfully!',
        severity: 'success',
      });
      setEditDialogOpen(false);
      refetch();
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to update error record';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // Handle ignore toggle
  const handleIgnoreToggle = async (record: ErrorRecord, currentIgnoreStatus: boolean) => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: 'No object selected. Please select an object first.',
        severity: 'warning',
      });
      return;
    }

    try {
      await ignoreErrorRecord({
        errorTrackerId: record.id,
        iterationId: record.iteration_reference,
        objectId
      }).unwrap();

      setSnackbar({
        open: true,
        message: `Error ${!currentIgnoreStatus ? 'ignored' : 'unignored'} successfully!`,
        severity: 'success',
      });
      refetch();
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to update ignore status';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // Handle email action
  const handleEmail = async (record: ErrorRecord) => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: 'No object selected. Please select an object first.',
        severity: 'warning',
      });
      return;
    }

    try {
      await emailErrorRecord({ errorId: record.id, objectId }).unwrap();
      setSnackbar({
        open: true,
        message: 'Email sent successfully for this error record!',
        severity: 'success',
      });
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to send email';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // Handle download
  const handleDownload = async (record: ErrorRecord) => {
    if (!objectId) {
      setSnackbar({
        open: true,
        message: 'No object selected. Please select an object first.',
        severity: 'warning',
      });
      return;
    }

    try {
      const result = await downloadErrorCsv({
        errorId: record.id,
        objectId,
        iterationId: record.iteration_reference
      }).unwrap();

      // Handle different response types
      let blob: Blob;
      let filename: string;
      
      if (result instanceof Blob) {
        blob = result;
        filename = `error-${record.id}.csv`;
      } else if (result?.data) {
        // Handle API response with data property
        blob = new Blob([result.data], { type: 'text/csv' });
        filename = `error-${record.id}.csv`;
      } else {
        // Fallback to JSON
        blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        filename = `error-${record.id}.json`;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Error data downloaded successfully as ${filename}`,
        severity: 'success',
      });
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Failed to download error data';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Calculate values for checkbox states (single selection)
  const recordCount = errorData?.records?.length || 0;
  const isAllSelected = false; // No select all for single selection
  const isSomeSelected = false; // No indeterminate for single selection

  if (!selectedObject) {
    return (
      <Alert severity="info">
        Please select an object to view error details.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Resolve issues that you get during migration process
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButton
            activity="Error Handling"
            disabled={false}
          />
          <Button
            variant="outlined"
            startIcon={isEmailAllLoading ? <CircularProgress size={20} /> : <EmailIcon />}
            onClick={handleEmailAll}
            disabled={isEmailAllLoading || !objectId || getReadOnlyFlag('Error Handling')}
          >
            {isEmailAllLoading ? 'Sending...' : 'Email All'}
          </Button>
          <Button
            variant="contained"
            onClick={handleLoadAll}
            disabled={isLoadAllLoading || !objectId || getReadOnlyFlag('Error Handling')}
            startIcon={isLoadAllLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoadAllLoading ? 'Generating...' : 'Load All'}
          </Button>
          <IconButton onClick={() => refetch()} disabled={!objectId || getReadOnlyFlag('Error Handling')}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Error Table */}
      <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="error table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>Error Message</TableCell>
                <TableCell>Count</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Fix</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ignored</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading error data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Alert severity="error">
                      Failed to load error data.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : recordCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No error records found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                errorData?.records?.map((record) => {
                  const isItemSelected = isSelected(record.id);
                  return (
                    <TableRow
                      key={record.id}
                      hover
                      onClick={() => handleRowClick(record)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, record.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={record.error}
                        >
                          {record.error}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={record.Count} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={record.comment}
                        >
                          {record.comment || 'No comment'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={record.Fix}
                        >
                          {record.Fix || 'No fix'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={record.status === 'failed' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={record.is_ignored}
                          onChange={() => handleIgnoreToggle(record, record.is_ignored)}
                          onClick={(e) => e.stopPropagation()}
                          color="warning"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(record)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEmail(record)}
                            color="info"
                          >
                            <EmailIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(record)}
                            color="success"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Custom Pagination */}
        {errorData && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, errorData.total_records)} of {errorData.total_records} records
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Rows:
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value as string, 10));
                  setPage(0);
                }}
                size="small"
                sx={{ minWidth: 80 }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={75}>75</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={() => handleChangePage(null, page - 1)}
                disabled={page === 0}
                size="small"
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="body2" sx={{ mx: 1 }}>
                {page + 1} of {Math.ceil(errorData.total_records / rowsPerPage)}
              </Typography>
              <IconButton
                onClick={() => handleChangePage(null, page + 1)}
                disabled={page >= Math.ceil(errorData.total_records / rowsPerPage) - 1}
                size="small"
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Data Records Section */}
      {selectedErrorId && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Error Records for Selected Error
          </Typography>
          <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Error Records for Selected Error
              </Typography>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditSelectedRecord}
                disabled={selectedDataRecordIndex === null}
              >
                Edit Selected Record
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="data records table">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    {dataRecords?.records && dataRecords.records.length > 0 && Object.keys(dataRecords.records[0]).map((key: string) => (
                      <TableCell key={key}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingDataRecords ? (
                    <TableRow>
                      <TableCell colSpan={dataRecords?.records?.[0] ? Object.keys(dataRecords.records[0]).length + 1 : 11} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Loading data records...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : dataRecordsError ? (
                    <TableRow>
                      <TableCell colSpan={dataRecords?.records?.[0] ? Object.keys(dataRecords.records[0]).length + 1 : 11} align="center" sx={{ py: 3 }}>
                        <Alert severity="error">
                          Failed to load data records.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : dataRecords?.records && dataRecords.records.length > 0 ? (
                    dataRecords.records.map((record: Record<string, any>, index: number) => (
                      <TableRow 
                        key={index}
                        sx={{
                          backgroundColor: selectedDataRecordIndex === index ? 'rgba(135, 206, 250, 0.15)' : 'inherit'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedDataRecordIndex === index}
                            onChange={() => handleDataRecordSelect(index, record)}
                          />
                        </TableCell>
                        {Object.values(record).map((value: any, idx: number) => (
                          <TableCell key={idx}>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {String(value)}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={dataRecords?.records?.[0] ? Object.keys(dataRecords.records[0]).length + 1 : 11} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No data records found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Custom Pagination for Data Records */}
            {dataRecords && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {dataRecordsPage * dataRecordsRowsPerPage + 1} to {Math.min((dataRecordsPage + 1) * dataRecordsRowsPerPage, dataRecords.total_records)} of {dataRecords.total_records} records
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Rows:
                  </Typography>
                  <Select
                    value={dataRecordsRowsPerPage}
                    onChange={(e) => {
                      setDataRecordsRowsPerPage(parseInt(e.target.value as string, 10));
                      setDataRecordsPage(0);
                    }}
                    size="small"
                    sx={{ minWidth: 80 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={75}>75</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                  </Select>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    onClick={() => handleDataRecordsPageChange(null, dataRecordsPage - 1)}
                    disabled={dataRecordsPage === 0}
                    size="small"
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="body2" sx={{ mx: 1 }}>
                    {dataRecordsPage + 1} of {Math.ceil(dataRecords.total_records / dataRecordsRowsPerPage)}
                  </Typography>
                  <IconButton
                    onClick={() => handleDataRecordsPageChange(null, dataRecordsPage + 1)}
                    disabled={dataRecordsPage >= Math.ceil(dataRecords.total_records / dataRecordsRowsPerPage) - 1}
                    size="small"
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Error Record
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Error Message:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  {editingRecord?.error}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Comment"
                fullWidth
                multiline
                rows={3}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                variant="outlined"
                placeholder="Add your comments here..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Fix"
                fullWidth
                multiline
                rows={3}
                value={editFix}
                onChange={(e) => setEditFix(e.target.value)}
                variant="outlined"
                placeholder="Describe the fix here..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={!editComment && !editFix}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Selected Record Dialog */}
      <Dialog
        open={editSelectedRecordOpen}
        onClose={handleEditSelectedRecordClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Selected Record
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {selectedRecordForEdit && Object.keys(selectedRecordForEdit).map((key: string) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  label={key}
                  fullWidth
                  value={selectedRecordForEdit[key] || ''}
                  onChange={(e) => handleEditSelectedRecordChange(key, e.target.value)}
                  variant="outlined"
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditSelectedRecordClose}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSelectedRecordSave}
            variant="contained"
          >
            Update Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Data Record Slide-in */}
      <Dialog
        open={editDataRecordOpen}
        onClose={handleDataRecordEditClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Data Record
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dataRecords?.records && selectedDataRecordIndex !== null && Object.keys(dataRecords.records[selectedDataRecordIndex]).map((key) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  label={key}
                  fullWidth
                  value={editDataRecord[key] || ''}
                  onChange={(e) => handleEditDataRecordChange(key, e.target.value)}
                  variant="outlined"
                  required
                  error={!editDataRecord[key] || String(editDataRecord[key]).trim() === ''}
                  helperText={(!editDataRecord[key] || String(editDataRecord[key]).trim() === '') ? 'This field is required' : ''}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDataRecordEditClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDataRecordEditSave}
            variant="contained"
            disabled={Object.values(editDataRecord).some(value =>
              value === null || value === undefined || String(value).trim() === ''
            )}
          >
            Update Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
