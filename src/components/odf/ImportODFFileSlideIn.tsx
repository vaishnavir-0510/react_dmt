import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface ImportODFFileSlideInProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File, importType: string) => Promise<void>;
  isImporting: boolean;
  currentStatus?: 'idle' | 'uploading' | 'extracting' | 'processing' | 'completed' | 'error';
}

const ImportODFFileSlideIn: React.FC<ImportODFFileSlideInProps> = ({
  open,
  onClose,
  onImport,
  isImporting,
  currentStatus = 'idle',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState('new');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const handleImportClick = async () => {
    if (file) {
      try {
        await onImport(file, importType);
        // Reset form after successful import if needed
        if (currentStatus === 'completed') {
          setFile(null);
          setImportType('new');
        }
      } catch (error) {
        console.error('Error during import:', error);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
    },
    maxFiles: 1,
    disabled: isImporting,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 9999 }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Import ODF File</Typography>
          <IconButton
            onClick={onClose}
            size="small"
            disabled={isImporting}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Please select the file you want to import
          </Typography>

          <Paper
            {...getRootProps()}
            variant="outlined"
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              textAlign: 'center',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              opacity: isImporting ? 0.7 : 1,
              '&:hover': {
                backgroundColor: isImporting ? 'background.paper' : 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} disabled={isImporting} />
            <UploadIcon color="action" fontSize="large" />
            <Typography>
              {isDragActive
                ? 'Drop the file here'
                : file
                ? file.name
                : 'Drag & drop a file here, or click to select'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Supported formats: .csv, .xls, .xlsx
            </Typography>
          </Paper>
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Import Options
          </Typography>
          <RadioGroup
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
          >
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="New file - A fresh previous file data will be discarded"
              disabled={isImporting}
            />
            <FormControlLabel
              value="part"
              control={<Radio />}
              label="Part file - Part data is added to existing data set"
              disabled={isImporting}
            />
            <FormControlLabel
              value="correction"
              control={<Radio />}
              label="Correction file - Corrected data file for failed records"
              disabled={isImporting}
            />
          </RadioGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleImportClick}
          color="primary"
          variant="contained"
          disabled={!file || isImporting}
          startIcon={isImporting ? <CircularProgress size={20} /> : null}
        >
          {isImporting ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportODFFileSlideIn;