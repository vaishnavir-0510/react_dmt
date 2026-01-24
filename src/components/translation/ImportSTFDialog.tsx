import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useUploadStfFileMutation } from '../../services/translationApi';

interface ImportSTFDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ImportSTFDialog: React.FC<ImportSTFDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStfFile, { isLoading, data: uploadResult, error }] = useUploadStfFileMutation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const handleUploadClick = async () => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        await uploadStfFile(formData).unwrap();

        // Reset form after successful upload
        setFile(null);
        onSuccess?.();
        onClose();
      } catch (error) {
        console.error('Error uploading STF file:', error);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFile(null);
      onClose();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.stf'],
      'text/plain': ['.stf'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 9999 }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Import STF File</Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            disabled={isLoading}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to upload file. Please try again.
          </Alert>
        )}

        {uploadResult && uploadResult.success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {uploadResult.message}
          </Alert>
        )}

        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Upload Source Translation File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select or drag & drop your STF file to import source text for translation.
          </Typography>

          <Paper
            {...getRootProps()}
            variant="outlined"
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              textAlign: 'center',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              opacity: isLoading ? 0.7 : 1,
              '&:hover': {
                backgroundColor: isLoading ? 'background.paper' : 'action.hover',
                borderColor: isLoading ? 'divider' : 'primary.main',
              },
            }}
          >
            <input {...getInputProps()} disabled={isLoading} />
            {isLoading ? (
              <CircularProgress size={48} />
            ) : (
              <UploadIcon color="action" fontSize="large" />
            )}
            <Typography sx={{ mt: 1 }}>
              {isDragActive
                ? 'Drop the STF file here'
                : file
                ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                : 'Drag & drop an STF file here, or click to select'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported format: .stf
            </Typography>
          </Paper>
        </Box>

        {file && !isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="body2">
              File selected: {file.name}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUploadClick}
          color="primary"
          variant="contained"
          disabled={!file || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Uploading...' : 'Upload File'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportSTFDialog;