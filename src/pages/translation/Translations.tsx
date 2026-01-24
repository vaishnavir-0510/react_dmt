// pages/translation/Translations.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Translate as TranslateIcon,
  History as HistoryIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useGetLatestStfFileQuery, useGenerateTranslationMutation, useGetTranslationComparisonQuery, useGetTranslationHistoryQuery } from '../../services/translationApi';
import ImportSTFDialog from '../../components/translation/ImportSTFDialog';
import AddTargetLanguageDialog from '../../components/translation/AddTargetLanguageDialog';
import TranslationResults from '../../components/translation/TranslationResults';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`translation-tabpanel-${index}`}
      aria-labelledby={`translation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `translation-tab-${index}`,
    'aria-controls': `translation-tabpanel-${index}`,
  };
}

export const Translations: React.FC = () => {
  const [value, setValue] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addLanguageDialogOpen, setAddLanguageDialogOpen] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<any>(null);
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [exportSnackbar, setExportSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Mock data for demonstration
  const workbenchData = [
    { id: 1, sourceText: 'Welcome', targetText: '', language: 'French', status: 'in_progress' },
    { id: 2, sourceText: 'Goodbye', targetText: 'Au revoir', language: 'French', status: 'review' },
  ];



  const { data: latestStfFile, isLoading: isLoadingStf, refetch: refetchStf } = useGetLatestStfFileQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: historyData = [], isLoading: isLoadingHistory } = useGetTranslationHistoryQuery();
  const [generateTranslation] = useGenerateTranslationMutation();

  // Get auth token for direct API calls
  const authToken = useSelector((state: any) => state.auth.accessToken);

  const handleAddTargetLanguage = async (language: any) => {
    if (!latestStfFile) {
      console.error('No source file available');
      return;
    }

    setIsGeneratingTranslation(true);

    try {
      const translationRequest = {
        source_file_id: latestStfFile.file_id,
        target_language: language.label,
        target_language_code: language.locale_code,
      };

      const response = await generateTranslation(translationRequest).unwrap();

      // Set the current translation data to display in the workbench
      setCurrentTranslation({
        translatedFileId: response.translated_file_id,
        targetLanguage: response.target_language,
        totalKeys: response.total_keys,
        successfulTranslations: response.successful_translations,
        avgConfidence: response.avg_confidence,
      });

      // Switch to workbench tab to show results
      setValue(1);

    } catch (error) {
      console.error('Error generating translation:', error);
    } finally {
      setIsGeneratingTranslation(false);
    }
  };

  const handleExportFile = async () => {
    if (!currentTranslation?.translatedFileId) {
      setExportSnackbar({
        open: true,
        message: 'No translation file available to export',
        severity: 'error',
      });
      return;
    }

    setDownloadingFileId(currentTranslation.translatedFileId);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translation/api/files/download/${currentTranslation.translatedFileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `translated_file_${currentTranslation.translatedFileId}.stf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSnackbar({
        open: true,
        message: 'File exported successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error exporting file:', error);
      setExportSnackbar({
        open: true,
        message: 'Failed to export file. Please try again.',
        severity: 'error',
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDownloadHistoryFile = async (fileId: string, fileName: string) => {
    setDownloadingFileId(fileId);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/translation/api/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSnackbar({
        open: true,
        message: 'File downloaded successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      setExportSnackbar({
        open: true,
        message: 'Failed to download file. Please try again.',
        severity: 'error',
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <Box sx={{ pt: "5px", px: "10px", pb: "10px" }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="translation tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                minHeight: 48,
                borderRadius: '8px 8px 0 0',
                marginRight: 1,
                minWidth: 'auto',
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: '#0b378aff',
                  color: 'white',
                  fontWeight: 600,
                },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&.Mui-selected': {
                    backgroundColor: '#0b378aff',
                  },
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
              mb: 2,
            }}
          >
            <Tab
              icon={<WorkIcon />}
              label="Source"
              {...a11yProps(0)}
              iconPosition="start"
            />
            <Tab
              icon={<TranslateIcon />}
              label="Workbench"
              {...a11yProps(1)}
              iconPosition="start"
            />
            <Tab
              icon={<HistoryIcon />}
              label="History"
              {...a11yProps(2)}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
            {/* STF File Information */}
            {isLoadingStf ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading source file information...</Typography>
              </Box>
            ) : latestStfFile ? (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" />
                  Analysis Complete
                </Typography>

                <Box sx={{
                  p: 3,
                  bgcolor: 'success.light',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.main'
                }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Source File Details
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Filename</Typography>
                      <Typography variant="body1" fontWeight="medium">{latestStfFile.filename}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Language</Typography>
                      <Typography variant="body1" fontWeight="medium">{latestStfFile.language}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Records</Typography>
                      <Typography variant="body1" fontWeight="medium">{latestStfFile.record_count.toLocaleString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fields</Typography>
                      <Typography variant="body1" fontWeight="medium">{latestStfFile.fields_count}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">File Size</Typography>
                      <Typography variant="body1" fontWeight="medium">{(parseInt(latestStfFile.size) / 1024).toFixed(1)} KB</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Created Date</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(latestStfFile.created_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{
                textAlign: 'center',
                py: 4,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'grey.300'
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Source File Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Import a source translation file to get started
                </Typography>
              </Box>
            )}

            {/* Import File Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setImportDialogOpen(true)}
                sx={{
                  bgcolor: '#6366f1',
                  '&:hover': { bgcolor: '#5555d8' },
                  px: 4,
                  py: 1.5,
                }}
              >
                Import File
              </Button>
            </Box>

          </Paper>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
            <Typography variant="h6" gutterBottom>
              Translation Workbench
            </Typography>

            {/* Search Bar and Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <TextField
                placeholder="Search by key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  maxWidth: 600,
                  '& .MuiInputBase-root': {
                    height: 40,
                  }
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => setAddLanguageDialogOpen(true)}
                sx={{
                  bgcolor: '#6366f1',
                  '&:hover': { bgcolor: '#5555d8' },
                  whiteSpace: 'nowrap',
                  height: 40,
                  minWidth: 'auto',
                  px: 2
                }}
              >
                Add Target Language
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={downloadingFileId === currentTranslation?.translatedFileId ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={handleExportFile}
                disabled={downloadingFileId === currentTranslation?.translatedFileId || !currentTranslation}
                sx={{
                  whiteSpace: 'nowrap',
                  height: 40,
                  minWidth: 'auto',
                  px: 2
                }}
              >
                {downloadingFileId === currentTranslation?.translatedFileId ? 'Exporting...' : 'Export'}
              </Button>
            </Box>

            {/* Translation Results */}
            {currentTranslation ? (
              <TranslationResults translation={currentTranslation} />
            ) : (
              /* No Translation Items Message */
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No file translated
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  There are no translation items available
                </Typography>
              </Box>
            )}
          </Paper>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, borderTop: '4px solid #6366f1' }}>
            <Typography variant="h6" gutterBottom>
              Translation History
            </Typography>

            {isLoadingHistory ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading history...</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>File Name</TableCell>
                      <TableCell>Language</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Records</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.map((file) => (
                      <TableRow key={file.file_id} hover>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {file.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{file.language}</TableCell>
                        <TableCell>
                          <Chip
                            label={file.file_type}
                            size="small"
                            color={file.file_type === 'source' ? 'primary' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{file.record_count.toLocaleString()}</TableCell>
                        <TableCell>{(parseInt(file.size) / 1024).toFixed(1)} KB</TableCell>
                        <TableCell>
                          {new Date(file.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={file.status}
                            size="small"
                            color={file.status === 'active' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={downloadingFileId === file.file_id ? <CircularProgress size={16} /> : <DownloadIcon />}
                            onClick={() => handleDownloadHistoryFile(file.file_id, file.name)}
                            disabled={downloadingFileId === file.file_id}
                          >
                            {downloadingFileId === file.file_id ? 'Downloading...' : 'Download'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>


        {/* Import STF Dialog */}
        <ImportSTFDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={() => {
            refetchStf(); // Refresh the STF file data after successful upload
          }}
        />

        {/* Add Target Language Dialog */}
        <AddTargetLanguageDialog
          open={addLanguageDialogOpen}
          onClose={() => setAddLanguageDialogOpen(false)}
          onAddLanguage={handleAddTargetLanguage}
          isGenerating={isGeneratingTranslation}
        />

        {/* Export Snackbar */}
        <Snackbar
          open={exportSnackbar.open}
          autoHideDuration={4000}
          onClose={() => setExportSnackbar({ ...exportSnackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setExportSnackbar({ ...exportSnackbar, open: false })}
            severity={exportSnackbar.severity}
            sx={{ width: '100%' }}
          >
            {exportSnackbar.message}
          </Alert>
        </Snackbar>
    </Box>
  );
};