import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  LinearProgress,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Storage as DatabaseIcon,
  TableChart as TableIcon,
  ExpandMore as ChevronDownIcon,
  Error as AlertCircleIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  useGetODFFileQuery,
  useUploadFileMutation,
  useExtractMetadataMutation,
  useCheckMetadataStatusQuery,
  useLazyGetObjectCompletionQuery,
  useLazyGetColumnDensityQuery,
  useLazyGetDataDensityQuery,
  useLazyGetDataQualityQuery,
  useLazyGetEntityMappedObjectQuery,
  useLazyGetPicklistDistributionQuery,
  useLazyGetChartFilterQuery,
  useLazyGetAllPicklistDistributionsQuery,
  useLazyGetDateDistributionQuery,
} from '../../../services/odfFileApi';
import { useGetSystemsByProjectQuery } from '../../../services/systemsApi';
import ImportODFFileSlideIn from '../../odf/ImportODFFileSlideIn';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';

const POLLING_INTERVAL = 2000;
const MAX_POLLING_ATTEMPTS = 30;

const SummaryTab: React.FC = () => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<
    'idle' | 'uploading' | 'extracting' | 'processing' | 'completed' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [selectedPicklistField, setSelectedPicklistField] = useState<string>('');
  const [shouldPoll, setShouldPoll] = useState(false);

  // Refs to prevent multiple API calls
  const hasStartedPolling = useRef(false);
  const hasRefreshedData = useRef(false);

  // Redux state
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedProject, selectedEnvironment, selectedSystem } = useSelector(
    (state: RootState) => state.app
  );

  const { getCompletionStatus, getActivityStatus } = useActivity();

  // API Hooks
  const {
    data: odfFile,
    isLoading,
    error: fetchError,
    refetch: refetchODFFile
  } = useGetODFFileQuery(
    {
      id: selectedObject?.object_id || '',
      objectId: selectedObject?.object_id || ''
    },
    {
      skip: !selectedObject?.object_id
    }
  );

  const { data: systems = [] } = useGetSystemsByProjectQuery(selectedProject?.id || '', {
    skip: !selectedProject?.id
  });

  const [uploadFile] = useUploadFileMutation();
  const [extractMetadata] = useExtractMetadataMutation();

  const { data: metadataStatus } = useCheckMetadataStatusQuery(
    taskId || '',
    {
      skip: !taskId || !shouldPoll,
      pollingInterval: shouldPoll ? POLLING_INTERVAL : 0,
    }
  );

  // Lazy queries
  const [getObjectCompletion] = useLazyGetObjectCompletionQuery();
  const [getColumnDensity] = useLazyGetColumnDensityQuery();
  const [getDataDensity] = useLazyGetDataDensityQuery();
  const [getDataQuality] = useLazyGetDataQualityQuery();
  const [getEntityMapped] = useLazyGetEntityMappedObjectQuery();
  const [getChartFilter] = useLazyGetChartFilterQuery();
  const [getPicklistDistribution] = useLazyGetPicklistDistributionQuery();
  const [getAllPicklistDistributions] = useLazyGetAllPicklistDistributionsQuery();
  const [getDateDistribution] = useLazyGetDateDistributionQuery();

  // State for chart data
  const [chartFilterData, setChartFilterData] = useState<any>(null);
  const [picklistDistribution, setPicklistDistribution] = useState<any>(null);
  const [allPicklistDistributions, setAllPicklistDistributions] = useState<any>(null);

  // State for completion and summary data
  const [completionData, setCompletionData] = useState<Array<{ activity: string; completion: number }>>([]);
  const [dataDensity, setDataDensity] = useState<any>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // State for additional charts
  const [columnDensityData, setColumnDensityData] = useState<any>(null);
  const [selectedDateField, setSelectedDateField] = useState<string>('');
  const [selectedPicklistFieldForChart, setSelectedPicklistFieldForChart] = useState<string>('');
  const [dateDistributionData, setDateDistributionData] = useState<any>(null);
  const [picklistChartData, setPicklistChartData] = useState<any>(null);
  const [toggleState, setToggleState] = useState<boolean>(false);

  // Load completion and chart data when odfFile is available
  useEffect(() => {
    if (odfFile && selectedObject?.object_id && !isUploading) {
      loadCompletionData();
      loadChartData();
    }
  }, [odfFile, selectedObject?.object_id, isUploading, selectedEnvironment?.id]);

  // Effect to handle metadata status polling
  useEffect(() => {
    if (metadataStatus && shouldPoll) {
      handleMetadataStatusUpdate(metadataStatus);
    }
  }, [metadataStatus]);

  // Effect to set default picklist field when chart filter data loads
  useEffect(() => {
    if (chartFilterData?.picklist_values && chartFilterData.picklist_values.length > 0 && !selectedPicklistField) {
      setSelectedPicklistField(chartFilterData.picklist_values[0]);
    }
    if (chartFilterData?.picklist_values && chartFilterData.picklist_values.length > 0 && !selectedPicklistFieldForChart) {
      setSelectedPicklistFieldForChart(chartFilterData.picklist_values[0]);
    }
    if (chartFilterData?.dates && chartFilterData.dates.length > 0 && !selectedDateField) {
      setSelectedDateField(chartFilterData.dates[0][1]);
    }
  }, [chartFilterData, selectedPicklistField, selectedPicklistFieldForChart, selectedDateField]);

  // Effect to load picklist distribution when field is selected
  useEffect(() => {
    if (selectedPicklistField && selectedObject?.object_id) {
      loadPicklistDistribution(selectedPicklistField);
    }
  }, [selectedPicklistField, selectedObject?.object_id, selectedEnvironment?.id]);

  // Effect to load date distribution when field is selected
  useEffect(() => {
    if (selectedDateField && selectedObject?.object_id) {
      loadDateDistribution(selectedDateField);
    }
  }, [selectedDateField, selectedObject?.object_id, selectedEnvironment?.id]);

  // Effect to load picklist chart data when field is selected
  useEffect(() => {
    if (selectedPicklistFieldForChart && selectedObject?.object_id) {
      loadPicklistChartData(selectedPicklistFieldForChart);
    }
  }, [selectedPicklistFieldForChart, selectedObject?.object_id, selectedEnvironment?.id]);

  // Effect to refresh all data when environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id && odfFile) {
      // Reset refs to allow data refresh
      hasRefreshedData.current = false;
      hasStartedPolling.current = false;

      // Load all data
      loadCompletionData();
      loadChartData();

      // Refresh entity mapped data if needed
      if (selectedProject?.id) {
        getEntityMapped({
          source_object_id: selectedObject.object_id,
          project: selectedProject.id,
          environment: selectedEnvironment.id
        }).unwrap().catch(error => {
          console.error('Error loading entity mapped data:', error);
        });
      }
    }
  }, [selectedEnvironment?.id, selectedObject?.object_id, selectedProject?.id]);

  // Refresh activity status when tab is accessed
  useEffect(() => {
    if (selectedObject?.object_id) {
      getActivityStatus(selectedObject.object_id);
    }
  }, [selectedObject?.object_id, getActivityStatus]);


  // Load chart data
  const loadChartData = async () => {
    if (!selectedObject?.object_id || !odfFile) return;

    try {
      const [filterResult, distributionsResult, columnDensityResult] = await Promise.allSettled([
        getChartFilter(selectedObject.object_id).unwrap(),
        getAllPicklistDistributions({ object_id: selectedObject.object_id }).unwrap(),
        getColumnDensity({ object_id: selectedObject.object_id, refresh: false }).unwrap()
      ]);

      if (filterResult.status === 'fulfilled') {
        setChartFilterData(filterResult.value);
      }

      if (distributionsResult.status === 'fulfilled') {
        setAllPicklistDistributions(distributionsResult.value);
      }

      if (columnDensityResult.status === 'fulfilled') {
        setColumnDensityData(columnDensityResult.value);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  // Load completion data
  const loadCompletionData = async () => {
    if (!selectedObject?.object_id) return;

    try {
      const [completionResult, densityResult, qualityResult] = await Promise.allSettled([
        getObjectCompletion(selectedObject.object_id).unwrap(),
        getDataDensity({ object_id: selectedObject.object_id, refresh: false }).unwrap(),
        getDataQuality({ object_id: selectedObject.object_id, refresh: false }).unwrap()
      ]);

      if (completionResult.status === 'fulfilled') {
        setCompletionData(completionResult.value);
      }

      if (densityResult.status === 'fulfilled') {
        setDataDensity(densityResult.value);
      }

      if (qualityResult.status === 'fulfilled') {
        setDataQuality(qualityResult.value);
      }
    } catch (error) {
      console.error('Error loading completion data:', error);
    }
  };

  // Load specific picklist distribution
  const loadPicklistDistribution = async (field: string) => {
    if (!selectedObject?.object_id) return;

    try {
      const result = await getPicklistDistribution({
        object_id: selectedObject.object_id,
        picklist_field: field
      }).unwrap();
      setPicklistDistribution(result);
    } catch (error) {
      console.error('Error loading picklist distribution:', error);
    }
  };

  // Load date distribution
  const loadDateDistribution = async (fieldId: string) => {
    if (!selectedObject?.object_id) return;

    try {
      const result = await getDateDistribution({
        object_id: selectedObject.object_id,
        field_id: fieldId,
        file_name: `${selectedObject.object_id}.csv`
      }).unwrap();
      setDateDistributionData(result);
    } catch (error) {
      console.error('Error loading date distribution:', error);
    }
  };

  // Load picklist chart data
  const loadPicklistChartData = async (field: string) => {
    if (!selectedObject?.object_id) return;

    try {
      const result = await getPicklistDistribution({
        object_id: selectedObject.object_id,
        picklist_field: field
      }).unwrap();
      setPicklistChartData(result);
    } catch (error) {
      console.error('Error loading picklist chart data:', error);
    }
  };

  // Handle metadata status updates
  const handleMetadataStatusUpdate = async (status: any) => {
    if (!selectedObject?.object_id) return;

    setPollingAttempts(prev => prev + 1);

    if (status.status === 'completed' || status.status === 'success') {
      setShouldPoll(false);
      hasStartedPolling.current = false;
      await loadAllDataAfterExtraction();
      setCurrentStatus('completed');
      setIsUploading(false);
    } else if (status.status === 'failed') {
      setShouldPoll(false);
      hasStartedPolling.current = false;
      setError(status.message || 'Metadata extraction failed');
      setCurrentStatus('error');
      setIsUploading(false);
    } else if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
      setShouldPoll(false);
      hasStartedPolling.current = false;
      setError('Processing timed out. Please check back later.');
      setCurrentStatus('error');
      setIsUploading(false);
    }
  };

  // Load all data after metadata extraction
  const loadAllDataAfterExtraction = async () => {
    if (!selectedObject?.object_id || hasRefreshedData.current) return;

    hasRefreshedData.current = true;

    try {
      setCurrentStatus('processing');
      await refetchODFFile();

      const results = await Promise.allSettled([
        getObjectCompletion(selectedObject.object_id).unwrap(),
        getColumnDensity({ object_id: selectedObject.object_id, refresh: false }).unwrap(),
        getDataDensity({ object_id: selectedObject.object_id, refresh: false }).unwrap(),
        getDataQuality({ object_id: selectedObject.object_id, refresh: false }).unwrap(),
        getEntityMapped({
          source_object_id: selectedObject.object_id,
          project: selectedProject?.id || '',
          environment: selectedEnvironment?.id || ''
        }).unwrap(),
        loadChartData()
      ]);

      // Check for environment-related errors
      const entityMappedResult = results[4];
      if (entityMappedResult.status === 'rejected') {
        const error = entityMappedResult.reason;
        if (error?.data?.detail?.includes('environment not found') ||
          error?.message?.includes('environment not found') ||
          error?.error?.includes('environment not found')) {
          setError('Selected environment not found. Please select a different environment.');
          setCurrentStatus('error');
          return;
        }
      }

      await loadCompletionData();
    } catch (error) {
      console.error('Error loading data after extraction:', error);
    } finally {
      hasRefreshedData.current = false;
    }
  };

  // Handle file import
  const handleImport = async (file: File, importType: string) => {
    if (!selectedObject?.object_id) return;

    setIsUploading(true);
    setCurrentStatus('uploading');
    setError(null);
    setPollingAttempts(0);
    setTaskId(null);
    setShouldPoll(false);
    hasStartedPolling.current = false;
    hasRefreshedData.current = false;

    try {
      if (!selectedEnvironment?.id || !selectedProject?.id || !selectedSystem?.id) {
        throw new Error('Please select an environment, project, and system');
      }

      const formData = new FormData();
      formData.append('system', selectedSystem.id);
      formData.append('object', selectedObject.object_id);
      formData.append('file_type', 'main');
      formData.append('is_deleted', 'false');
      formData.append('file', file);

      setCurrentStatus('uploading');
      const uploadResponse = await uploadFile(formData).unwrap();

      if (uploadResponse.status !== 'success') {
        throw new Error(uploadResponse.message || 'File upload failed');
      }

      setCurrentStatus('extracting');

      const extractResponse = await extractMetadata({
        objectId: selectedObject.object_id,
        environment_id: selectedEnvironment.id,
        file_name: `${selectedObject.object_id}.csv`,
        object_id: selectedObject.object_id,
        object_name: selectedObject.object_name || 'Account_40',
        project: selectedProject.id
      }).unwrap();

      setTaskId(extractResponse.task_id);
      setCurrentStatus('processing');

      setShouldPoll(true);
      hasStartedPolling.current = true;

    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during file import';

      // Check for environment not found error
      if (errorMessage.includes('environment not found') ||
        (err as any)?.data?.detail?.includes('environment not found') ||
        (err as any)?.error?.includes('environment not found')) {
        errorMessage = 'Selected environment not found. Please select a different environment.';
      }

      console.error('Error during file import:', errorMessage);
      setError(errorMessage);
      setCurrentStatus('error');
      setIsUploading(false);
      setShouldPoll(false);
    } finally {
      setIsImportDialogOpen(false);
    }
  };

  // Helper functions
  const getSystemNameById = (systemId: string) => {
    const system = systems.find(s => s.id === systemId);
    return system?.name || systemId;
  };

  const getSourceSystemName = () => {
    if (!odfFile?.system) return 'N/A';
    return getSystemNameById(odfFile.system);
  };

  const getTargetSystemName = () => {
    const targetSystem = systems.find(s => s.type === 'target');
    return targetSystem?.name || 'N/A';
  };

  const handleImportButtonClick = () => {
    setIsImportDialogOpen(true);
  };

  // UI Components using Material-UI
  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
        {value}
      </Typography>
    </Box>
  );

  // Render loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            Loading data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Render empty state or error
  if (!odfFile) {
    const isS3FileNotFoundError = fetchError && (
      JSON.stringify(fetchError).includes('File not found in S3') ||
      (fetchError as any)?.detail?.includes('File not found in S3') ||
      (fetchError as any)?.error?.detail?.includes('File not found in S3') ||
      (fetchError as any)?.data?.detail?.includes('File not found in S3') ||
      (fetchError as any)?.message?.includes('File not found in S3')
    );

    const hasError = !!fetchError;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <AlertCircleIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>
            {isS3FileNotFoundError ? 'File Not Found in S3' : hasError ? 'Error Loading File' : 'No ODF file data available'}
          </Typography>
          {isS3FileNotFoundError && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              The file could not be found in S3 storage. Please import a new file to continue.
            </Alert>
          )}
          {hasError && !isS3FileNotFoundError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              An error occurred while loading the file. Please try importing a new file.
            </Alert>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={() => setIsImportDialogOpen(true)}
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6,
              }
            }}
          >
            {isUploading ? 'Importing...' : 'Import File'}
          </Button>
        </Box>
        <ImportODFFileSlideIn
          open={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={handleImport}
          isImporting={isUploading}
          currentStatus={currentStatus}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 3
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Source Data Summary
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconButton
              onClick={() => setToggleState(!toggleState)}
              color="primary"
              sx={{ mr: 1 }}
              title={toggleState ? "Toggle Off" : "Toggle On"}
            >
              {toggleState ? <ToggleOnIcon /> : <ToggleOffIcon />}
            </IconButton>

            {/* Extract Activity Toggle */}
            <ToggleButton
              activity="Extract"
              disabled={getCompletionStatus('Mapping')}
            />

            {/* Import File Button */}
            <button
              onClick={handleImportButtonClick}
              disabled={isUploading}
              style={{
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: isUploading ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
              }}
            >
              {isUploading ? 'Importing...' : 'Import File'}
            </button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Object Info & Stats */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Object Information Card */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <DatabaseIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Object Information
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <InfoField label="Source Object" value={selectedObject?.object_name || selectedObject?.object_id || 'N/A'} />
                  <InfoField label="Object Owner" value={odfFile.created_by} />
                  <InfoField label="Supplied By" value={odfFile.created_by} />
                  <InfoField label="Supplied On" value={new Date(odfFile.created_date).toLocaleDateString()} />
                  <InfoField label="Source System" value={getSourceSystemName()} />
                  <InfoField label="Target System" value={getTargetSystemName()} />
                  <InfoField label="Environment" value={selectedEnvironment ? `${selectedEnvironment.name} (${selectedEnvironment.id})` : 'N/A'} />
                  <InfoField label="Last Updated By" value={odfFile.modified_by} />
                  <InfoField label="Last Updated" value={new Date(odfFile.modified_date).toLocaleDateString()} />
                </Stack>
              </CardContent>
            </Card>

            {/* Key Metrics Card */}
            <Card
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                color: 'white',
                boxShadow: 4
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <TableIcon sx={{ color: 'white' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Data Overview
                  </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {odfFile.record_count}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', opacity: 0.9 }}>
                        Rows
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {odfFile.fields_count}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', opacity: 0.9 }}>
                        Columns
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        p: 2
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold', opacity: 0.9 }}>
                        Data Density
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {dataDensity?.data_density_percentage ? `${dataDensity.data_density_percentage}%` : 'N/A'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={dataDensity?.data_density_percentage || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#10b981',
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        p: 2
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold', opacity: 0.9 }}>
                        Data Quality
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {dataQuality?.data_quality_percentage ? `${dataQuality.data_quality_percentage}%` : 'N/A'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={dataQuality?.data_quality_percentage || 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#10b981',
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column - Charts & Status */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Status Chart */}
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Status Chart
                    </Typography>
                  </Box>
                  <IconButton onClick={() => loadCompletionData()} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Box>

                {completionData.length > 0 ? (
                  <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                    <Stack spacing={2}>
                      {completionData.map((activity, idx) => (
                        <Box key={idx}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {activity.activity}
                            </Typography>
                            <Chip
                              label={`${activity.completion}%`}
                              size="small"
                              color={activity.completion === 100 ? 'success' : 'default'}
                              variant={activity.completion === 100 ? 'filled' : 'outlined'}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={activity.completion}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: '#f3f4f6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: activity.completion === 100 ? '#10b981' : '#6b7280',
                                borderRadius: 5,
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No completion data available
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Field Density Chart */}
            {columnDensityData && (
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Field Density Chart
                    </Typography>
                    <IconButton size="small" title="Shows data completeness for each field">
                      <InfoIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ maxHeight: 450, overflow: 'auto', pr: 1 }}>
                    <Stack spacing={2}>
                      {columnDensityData.column_density_summary.map((field: any, idx: number) => (
                        <Box key={idx}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {field.field_name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                              {field.data_count_percentage}% Data / {field.null_count_percentage}% Null
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={field.data_count_percentage}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: '#f3f4f6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#3b82f6',
                                borderRadius: 5,
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* Distribution Charts Row */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Data Distribution by Date
              </Typography>

              {chartFilterData?.dates && chartFilterData.dates.length > 0 && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Date Field</InputLabel>
                  <Select
                    value={selectedDateField}
                    label="Select Date Field"
                    onChange={(e) => setSelectedDateField(e.target.value)}
                  >
                    {chartFilterData.dates.map(([label, id]: [string, string]) => (
                      <MenuItem key={id} value={id}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {dateDistributionData?.values && dateDistributionData.values.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dateDistributionData.values}>
                    <defs>
                      <linearGradient id="colorDate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="data"
                      stroke="#6b7280"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorDate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No date distribution data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Data Distribution by Picklist
              </Typography>

              {chartFilterData?.picklist_values && chartFilterData.picklist_values.length > 0 && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Picklist Field</InputLabel>
                  <Select
                    value={selectedPicklistFieldForChart}
                    label="Select Picklist Field"
                    onChange={(e) => setSelectedPicklistFieldForChart(e.target.value)}
                  >
                    {chartFilterData.picklist_values.map((field: string) => (
                      <MenuItem key={field} value={field}>{field}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {picklistChartData?.picklist_values && picklistChartData.picklist_values.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={picklistChartData.picklist_values}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="value"
                      stroke="#6b7280"
                      angle={-15}
                      textAnchor="end"
                      height={80}
                      style={{ fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#colorBar)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No picklist distribution data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status Card */}
        {(currentStatus !== 'idle' || error) && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Import Status:{' '}
                    <Typography
                      component="span"
                      sx={{
                        color:
                          currentStatus === 'completed' ? 'success.main' :
                            currentStatus === 'error' ? 'error.main' :
                              'primary.main',
                        fontWeight: 'bold'
                      }}
                    >
                      {currentStatus.toUpperCase()}
                    </Typography>
                  </Typography>
                  {taskId && (
                    <Typography variant="body2" color="text.secondary">
                      Task ID: {taskId}
                    </Typography>
                  )}
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <AlertCircleIcon />
                      <Typography variant="body2">{error}</Typography>
                    </Box>
                  </Alert>
                )}

                {currentStatus === 'processing' && (
                  <Alert severity="info">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        Processing... (Attempt {pollingAttempts}/{MAX_POLLING_ATTEMPTS})
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {currentStatus === 'completed' && (
                  <Alert severity="success">
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckCircleIcon />
                      <Typography variant="body2">
                        File imported and processed successfully!
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Import Dialog */}
      <ImportODFFileSlideIn
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImport}
        isImporting={isUploading}
        currentStatus={currentStatus}
      />
    </Box>
  );
};

export default SummaryTab;