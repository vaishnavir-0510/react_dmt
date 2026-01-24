// components/migration/FilesSlideIn.tsx
import React, { useState } from 'react';
import {
  Modal,
  Paper,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TablePagination,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Description as DocumentIcon,
  TableChart as TableIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useGetFilesListQuery, useLazyDownloadFileQuery } from '../../services/managementApi';

interface FilesSlideInProps {
  open: boolean;
  onClose: () => void;
  objectName?: string;
  objectId?: string;
}

export const FilesSlideIn: React.FC<FilesSlideInProps> = ({
  open,
  onClose,
  objectName = 'Migration Object',
  objectId
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const {
    data: filesData,
    isLoading,
    error,
    isFetching,
  } = useGetFilesListQuery(
    {
      objectId: objectId || '',
      page: page + 1,
      limit: rowsPerPage,
    },
    { skip: !objectId }
  );

  const [triggerDownload] = useLazyDownloadFileQuery();

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'validation_file':
        return <TableIcon color="primary" />;
      case 'iteration':
        return <DocumentIcon color="action" />;
      default:
        return <FileIcon color="action" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'validation_file':
        return 'primary';
      case 'iteration':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const result = await triggerDownload({ fileName }).unwrap();
      // The result is the response text with IDs
      console.log('Download result:', result);
      // Show success message
      setSnackbar({
        open: true,
        message: 'Download started successfully',
        severity: 'success',
      });
      // You can handle the download here, e.g., create a blob or redirect
    } catch (error: any) {
      console.error('Download failed:', error);
      const errorMessage = error?.data?.message || error?.message || 'Download failed';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
      >
        <Paper
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: {
              xs: '100%',
              sm: '100%',
              md: '95%',
              lg: '90%',
              xl: '95%',
            },
            maxWidth: '1600px',
            height: '100vh',
            margin: 0,
            borderRadius: 0,
            overflow: 'hidden',
            boxShadow: 24,
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              backgroundColor: 'primary.main',
              color: 'white'
            }}>
              <Typography variant="h6" component="h2" fontWeight="bold">
                Migration Files
              </Typography>
              <IconButton onClick={onClose} size="large" sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Description */}
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="body1" color="text.secondary">
                List of files created and used during the migration process
              </Typography>
            </Box>

            {/* Object Info */}
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Object: {objectName}
              </Typography>
            </Box>

            {/* Files Table */}
            <Box sx={{ flex: 1, overflow: 'hidden', px: 3 }}>
              {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">
                  Failed to load files data. Please try again later.
                </Alert>
              ) : (
                <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>File Name</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Change Log ID</TableCell>
                        <TableCell>Created Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filesData?.files.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFileIcon(file.file_type)}
                              <Chip
                                label={file.file_type}
                                size="small"
                                color={getFileTypeColor(file.file_type) as any}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>{file.label}</TableCell>
                          <TableCell>{file.sources_from}</TableCell>
                          <TableCell>{file.description}</TableCell>
                          <TableCell>{file.status || 'N/A'}</TableCell>
                          <TableCell>{file.change_log_id || 'N/A'}</TableCell>
                          <TableCell>{new Date(file.created_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownload(file.file_name)}
                            >
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Pagination */}
            {filesData && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={filesData.total_records}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                  }
                />
              </Box>
            )}

            {/* Loading indicator for pagination */}
            {isFetching && (
              <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading data...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};