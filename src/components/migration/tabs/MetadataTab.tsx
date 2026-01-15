// components/migration/tabs/MetadataTab.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  Public as PublicIcon,
  BusinessCenter as BusinessCenterIcon,
  LockOutlined as LockOutlinedIcon,
  PersonOutline as PersonOutlineIcon,
  VerifiedUser as VerifiedUserIcon,
  MedicalServices as MedicalServicesIcon,
  WarningAmber as WarningAmberIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterCenterFocus as FilterCenterFocusIcon,
  Email as EmailIcon,
  Fingerprint as FingerprintIcon,
  Business as BusinessIcon,
  NoEncryption as NoEncryptionIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
  useGetMappedTargetObjectQuery,
  useGetObjectMetadataPaginatedQuery,
  useUpdateFieldMetadataMutation, // UPDATE: Import the mutation
  useGetOntologyMappingsQuery,
  useUpdateOntologyMappingMutation,
} from '../../../services/metadataApi';

import type { MetadataField } from '../../../types';
import { MetadataEditorSlideIn } from '../../metadata/MetadataEditorSlidein';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metadata-tabpanel-${index}`}
      aria-labelledby={`metadata-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

export const MetadataTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const { getCompletionStatus, getReadOnlyFlag, getActivityStatus } = useActivity();
  const isReadOnly = getReadOnlyFlag('Metadata') || getCompletionStatus('Mapping');
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterField, setFilterField] = useState('all');
  const [selectedField, setSelectedField] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rawDataDialogOpen, setRawDataDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<MetadataField | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ontologyStatuses, setOntologyStatuses] = useState<Record<string, 'pending' | 'accepted' | 'rejected' | 'user_override'>>({});
  const [editingOntology, setEditingOntology] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [bulkAccepted, setBulkAccepted] = useState(false);

  // UPDATE: Add the update mutation
  const [updateFieldMetadata, { isLoading: isUpdating }] = useUpdateFieldMetadataMutation();
  const [updateOntologyMapping] = useUpdateOntologyMappingMutation();

  // Get mapped target object
  const { 
    data: mappedObject, 
    isLoading: isLoadingMappedObject,
    error: mappedObjectError,
  } = useGetMappedTargetObjectQuery({
    sourceObjectId: selectedObject?.object_id || '',
    projectId: selectedProject?.id || '',
    environmentId: selectedEnvironment?.id || ''
  }, {
    skip: !selectedObject?.object_id || !selectedProject?.id || !selectedEnvironment?.id,
  });

  // Get source metadata with refetch capability
  const {
    data: sourceMetadataResponse,
    isLoading: isLoadingSourceMetadata,
    error: sourceMetadataError,
    refetch: refetchSourceMetadata, // UPDATE: Get refetch function
  } = useGetObjectMetadataPaginatedQuery({
    objectId: selectedObject?.object_id || '',
    environmentId: selectedEnvironment?.id,
    page: page + 1,
    page_size: rowsPerPage
  }, {
    skip: !selectedObject?.object_id || !selectedEnvironment?.id,
  });

  // Get target metadata with refetch capability
  const {
    data: targetMetadataResponse,
    isLoading: isLoadingTargetMetadata,
    error: targetMetadataError,
    refetch: refetchTargetMetadata, // UPDATE: Get refetch function
  } = useGetObjectMetadataPaginatedQuery({
    objectId: mappedObject?.id || '',
    environmentId: selectedEnvironment?.id,
    page: page + 1,
    page_size: rowsPerPage
  }, {
    skip: !mappedObject?.id || !selectedEnvironment?.id,
  });

  // Get ontology mappings
  const {
    data: ontologyMappings,
    isLoading: isLoadingOntology,
    error: ontologyError,
  } = useGetOntologyMappingsQuery(selectedObject?.object_id || '', {
    skip: !selectedObject?.object_id,
  });

  // Check for unaccepted high-confidence mappings
  const hasUnacceptedHighConfidence = React.useMemo(() => {
    return ontologyMappings?.some(m => m.confidence_score >= 0.95 && ontologyStatuses[m.original_field_name] !== 'accepted') || false;
  }, [ontologyMappings, ontologyStatuses]);

  const sourceMetadata = sourceMetadataResponse?.records || [];
  const targetMetadata = targetMetadataResponse?.records || [];

  // Reset state and refetch data when object or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      setActiveTab(0);
      setSearchTerm('');
      setPage(0);
      setFilterField('all');
      setSelectedField(null);
      setDetailDialogOpen(false);
      setRawDataDialogOpen(false);
      setEditorOpen(false);
      setEditingField(null);
      setSelectedRowId(null);
      setOntologyStatuses({});
      setEditingOntology(null);
      setEditingValue('');
      setBulkAccepted(false);
      // Only refetch if the query conditions are met
      if (selectedObject?.object_id && selectedEnvironment?.id) {
        refetchSourceMetadata();
      }
      if (mappedObject?.id && selectedEnvironment?.id) {
        refetchTargetMetadata();
      }
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, refetchSourceMetadata, refetchTargetMetadata, mappedObject?.id]);

  // Refresh activity status when tab is accessed or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      getActivityStatus(selectedObject.object_id);
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, getActivityStatus]);

  // Reset bulk accepted when object changes
  useEffect(() => {
    setBulkAccepted(false);
  }, [selectedObject?.object_id]);

  useEffect(() => {
    if (selectedProject?.id && selectedEnvironment?.id && selectedObject?.object_id) {
      // Refetch mapped object and target metadata when environment changes
      // The queries will automatically refetch due to the skip conditions
    }
  }, [selectedProject?.id, selectedEnvironment?.id, selectedObject?.object_id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
    setSelectedRowId(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (field: any) => {
    setSelectedField(field);
    setDetailDialogOpen(true);
  };

  const handleEditField = (field: MetadataField) => {
    setSelectedRowId(field.id);
    setEditingField(field);
    setEditorOpen(true);
  };

  // UPDATE: Enhanced handleSaveField function
  const handleSaveField = async (fieldData: any, modifiedFields: Record<string, any>) => {
    try {
      if (!selectedObject?.object_id || !editingField) {
        console.error('Missing object ID or editing field');
        return;
      }

      console.log('Saving field data:', { fieldData, modifiedFields });

      // Call the update API with only modified fields
      await updateFieldMetadata({
        objectId: selectedObject.object_id,
        fieldId: editingField.field_id.toString(), // Convert to string as per your API
        updates: modifiedFields
      }).unwrap();

      // Show success message
      setSaveSuccess(true);
      
      // Refetch metadata to update the table
      if (activeTab === 0) {
        await refetchSourceMetadata();
      } else {
        await refetchTargetMetadata();
      }

      // Close the editor after successful save
      setEditorOpen(false);
      setEditingField(null);
      setSelectedRowId(null);
      
    } catch (error) {
      console.error('Failed to save field metadata:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleViewRawData = () => {
    setRawDataDialogOpen(true);
  };

  const handleAcceptOntology = async (fieldName: string, mapping: any) => {
    try {
      await updateOntologyMapping({
        mappingId: mapping.id,
        updates: { ontology_term_status: 'true', ontological_term_description_status: 'true' }
      }).unwrap();
      setOntologyStatuses(prev => ({ ...prev, [fieldName]: 'accepted' }));
    } catch (error) {
      console.error('Failed to accept ontology:', error);
    }
  };

  const handleRejectOntology = (fieldName: string) => {
    setOntologyStatuses(prev => ({ ...prev, [fieldName]: 'rejected' }));
    setEditingOntology(fieldName);
    const mapping = ontologyMappings?.find(m => m.original_field_name === fieldName);
    setEditingValue(mapping?.ontology_term || '');
  };

  const handleSaveOntologyEdit = async (fieldName: string, mapping: any) => {
    try {
      await updateOntologyMapping({
        mappingId: mapping.id,
        updates: { ontology_term: editingValue, ontology_term_status: 'true', ontological_term_description_status: 'true' }
      }).unwrap();
      setOntologyStatuses(prev => ({ ...prev, [fieldName]: 'user_override' }));
      setEditingOntology(null);
      setEditingValue('');
    } catch (error) {
      console.error('Failed to update ontology:', error);
    }
  };

  const handleBulkAcceptHighConfidence = async () => {
    const highConfidenceMappings = ontologyMappings?.filter(m => m.confidence_score >= 0.95 && ontologyStatuses[m.original_field_name] !== 'accepted') || [];
    for (const mapping of highConfidenceMappings) {
      try {
        await updateOntologyMapping({
          mappingId: mapping.id,
          updates: { ontology_term_status: 'true', ontological_term_description_status: 'true' }
        }).unwrap();
        setOntologyStatuses(prev => ({ ...prev, [mapping.original_field_name]: 'accepted' }));
      } catch (error) {
        console.error('Failed to accept high confidence ontology:', error);
      }
    }
    setBulkAccepted(true);
  };

  // Filter logic (client-side on current page data)
  const filteredMetadata = useMemo(() => {
    const metadata = activeTab === 0 ? sourceMetadata : targetMetadata;

    return metadata.filter((field: any) => {
      const matchesFilter = filterField === 'all' ||
        (filterField === 'primary_key' && field.is_pk === 'true') ||
        (filterField === 'foreign_key' && field.is_fk === 'true') ||
        (filterField === 'required' && field.is_required === 'true') ||
        (filterField === 'unique' && field.is_unique === 'true') ||
        (filterField === 'for_migration' && field.for_migrate === 'true');

      return matchesFilter;
    });
  }, [sourceMetadata, targetMetadata, activeTab, filterField]);

  // Since pagination is server-side, paginatedMetadata is just filteredMetadata
  const paginatedMetadata = filteredMetadata;

  // Highlight search term in text
  const highlightText = useCallback((text: string, search: string) => {
    if (!search || !text) return text;
    
    const parts = text.toString().split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => {
          // Skip empty parts to avoid duplicate keys
          if (!part) return null;
          
          return part.toLowerCase() === search.toLowerCase() ? (
            <mark key={`highlight-${index}-${part.slice(0, 10)}`} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
              {part}
            </mark>
          ) : (
            <span key={`text-${index}-${part.slice(0, 10)}`}>{part}</span>
          );
        })}
      </span>
    );
  }, []);

  // Get current metadata for raw data view
  const currentMetadata = activeTab === 0 ? sourceMetadata : targetMetadata;
  const currentMetadataResponse = activeTab === 0 ? sourceMetadataResponse : targetMetadataResponse;

  // Enhanced Metadata Table Component
  const MetadataTable: React.FC<{
    metadata: any[];
    isLoading: boolean;
    error: any;
    searchTerm: string;
    highlightText: (text: string, search: string) => React.ReactNode;
    totalCount: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onViewDetails: (field: any) => void;
    onEditField: (field: MetadataField) => void;
    selectedRowId: number | null;
  }> = ({
    metadata,
    isLoading,
    error,
    searchTerm,
    highlightText,
    totalCount,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onViewDetails,
    onEditField,
    selectedRowId,
  }) => {
    // Configs for special field rendering
    const securityClassConfig: Record<string, { color: string; icon: (color: string) => React.ReactNode; tooltip: string }> = {
      "Public": {
        color: '#4caf50',
        icon: (color) => <PublicIcon fontSize="small" sx={{ color }} />,
        tooltip: "Public - Openly accessible data",
      },
      "Internal Business": {
        color: '#2196f3',
        icon: (color) => <BusinessCenterIcon fontSize="small" sx={{ color }} />,
        tooltip: "Internal Business - Company internal use only",
      },
      "Confidential Business": {
        color: '#ff9800',
        icon: (color) => <LockOutlinedIcon fontSize="small" sx={{ color }} />,
        tooltip: "Confidential Business - Restricted company data",
      },
      "PII": {
        color: '#9c27b0',
        icon: (color) => <PersonOutlineIcon fontSize="small" sx={{ color }} />,
        tooltip: "PII - Personally Identifiable Information",
      },
      "Sensitive PII": {
        color: '#f44336',
        icon: (color) => <VerifiedUserIcon fontSize="small" sx={{ color }} />,
        tooltip: "Sensitive PII - Highly sensitive personal data",
      },
      "PHI": {
        color: '#ff5722',
        icon: (color) => <MedicalServicesIcon fontSize="small" sx={{ color }} />,
        tooltip: "PHI - Protected Health Information",
      },
    };

    const maskConfig: Record<string, { color: string; icon: (color: string) => React.ReactNode; tooltip: string }> = {
      "None": {
        color: '#4caf50',
        icon: (color) => <VisibilityIcon fontSize="small" sx={{ color }} />,
        tooltip: "None - No masking applied",
      },
      "Full": {
        color: '#f44336',
        icon: (color) => <VisibilityOffIcon fontSize="small" sx={{ color }} />,
        tooltip: "Full - Complete data masking",
      },
      "Mask Last 4": {
        color: '#2196f3',
        icon: (color) => <FilterCenterFocusIcon fontSize="small" sx={{ color }} />,
        tooltip: "Mask Last 4 - Hide last 4 characters",
      },
      "Mask First 4": {
        color: '#2196f3',
        icon: (color) => <FilterCenterFocusIcon fontSize="small" sx={{ color }} />,
        tooltip: "Mask First 4 - Hide first 4 characters",
      },
      "Redact Email": {
        color: '#9c27b0',
        icon: (color) => <EmailIcon fontSize="small" sx={{ color }} />,
        tooltip: "Redact Email - Hide email content",
      },
      "Hash (SHA-256)": {
        color: '#ff9800',
        icon: (color) => <FingerprintIcon fontSize="small" sx={{ color }} />,
        tooltip: "Hash (SHA-256) - Cryptographic hashing",
      },
    };

    const permissionConfig: Record<string, { color: string; icon: (color: string) => React.ReactNode; tooltip: string }> = {
      "Public": {
        color: '#4caf50',
        icon: (color) => <PublicIcon fontSize="small" sx={{ color }} />,
        tooltip: "Public - Accessible to everyone",
      },
      "Internal": {
        color: '#2196f3',
        icon: (color) => <BusinessIcon fontSize="small" sx={{ color }} />,
        tooltip: "Internal - Company employees only",
      },
      "Confidential": {
        color: '#ff9800',
        icon: (color) => <LockOutlinedIcon fontSize="small" sx={{ color }} />,
        tooltip: "Confidential - Restricted access required",
      },
      "Restricted": {
        color: '#f44336',
        icon: (color) => <NoEncryptionIcon fontSize="small" sx={{ color }} />,
        tooltip: "Restricted - Highly controlled access",
      },
    };

    const renderSpecialCell = (key: string, value: string) => {
      if (!value || value === 'No data' || value === 'null') {
        return (
          <Tooltip title={`No ${key.replace('_', ' ')} assigned`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HelpOutlineIcon sx={{ fontSize: 16, color: 'grey.500' }} />
              <Typography variant="body2" color="text.secondary">
                {key === 'security_class' ? 'Unclassified' : key === 'mask' ? 'No Mask' : 'Not Set'}
              </Typography>
            </Box>
          </Tooltip>
        );
      }

      const classes = value.split(',').map(e => e.trim()).filter(e => e); // Filter out empty strings
      const configMap = key === 'security_class' ? securityClassConfig : key === 'mask' ? maskConfig : permissionConfig;

      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {classes.map((className, index) => {
            // Skip empty class names
            if (!className) return null;
            
            const config = configMap[className] || {
              color: 'grey.500',
              icon: (color: string) => <WarningAmberIcon fontSize="small" sx={{ color }} />,
              tooltip: `Unknown ${key}: ${className}`,
            };

            return (
              <Tooltip key={`${key}-${className}-${index}`} title={config.tooltip}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {config.icon(config.color)}
                  <Typography variant="body2" sx={{ color: config.color, fontWeight: 500 }}>
                    {className}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      );
    };
    // Get all unique keys from metadata for dynamic columns
    const allKeys = React.useMemo(() => {
      if (metadata.length === 0) return [];
      const keys = new Set<string>();
      metadata.forEach((field: any) => {
        Object.keys(field).forEach(key => {
          // Filter out empty keys to avoid duplicate key warnings
          if (key && key.trim()) {
            keys.add(key);
          }
        });
      });
      return Array.from(keys).sort();
    }, [metadata]);

    // Define columns
    const columns = React.useMemo(() => [
      { key: 'ai_suggested', label: 'AI Agent Suggested Field Name', minWidth: '200px' },
      { key: 'actions', label: 'Actions', width: '120px' },
      { key: 'name', label: 'Field Name', minWidth: '200px' },
      { key: 'datatype', label: 'Data Type', width: '120px' },
      { key: 'max_length', label: 'Max Length', width: '80px' },
      ...allKeys.filter(key => !['name', 'datatype', 'max_length'].includes(key)).map(key => ({ key, label: key, minWidth: '150px' }))
    ], [allKeys]);

    // Filter columns based on search term
    const displayedColumns = React.useMemo(() =>
      columns.filter(col => searchTerm === '' || col.label.toLowerCase().includes(searchTerm.toLowerCase())),
      [columns, searchTerm]
    );
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading metadata...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          Failed to load metadata. Please try again.
          <br />
          Error: {error?.data?.message || error?.status || 'Unknown error'}
        </Alert>
      );
    }

    if (metadata.length === 0) {
      return (
        <Alert severity="info">
          No metadata fields found.
        </Alert>
      );
    }

    return (
      <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          maxHeight: '60vh', 
          overflowY: 'auto', 
          overflowX: 'hidden', 
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            overflowX: 'auto', 
            overflowY: 'hidden',
            width: '100%',
            flex: 1,
            minWidth: 0 // Important: allows flex child to shrink below content size
          }}>
            <Table sx={{ tableLayout: 'auto', width: 'max-content', minWidth: '100%' }} size="small">
            <TableHead>
              <TableRow>
                {displayedColumns.map((col, colIndex) => (
                  <TableCell key={col.key || `col-${colIndex}`} sx={{ fontWeight: 'bold', ...(col.width ? { width: col.width } : { minWidth: col.minWidth }) }}>
                    {col.key === 'ai_suggested' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{highlightText(col.label, searchTerm)}</span>
                        {!bulkAccepted && hasUnacceptedHighConfidence && (
                          <Tooltip title="Accept All High-Confidence Suggestions">
                            <IconButton
                              size="small"
                              onClick={handleBulkAcceptHighConfidence}
                              sx={{ ml: 1, color: '#4caf50' }}
                            >
                              <SmartToyIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      highlightText(col.label, searchTerm)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {metadata.map((field: any, index: number) => (
                <TableRow
                  key={field.id || `field-${index}`}
                  onClick={() => {
                    if (!isReadOnly) {
                      setSelectedRowId(field.id);
                      setEditingField(field);
                      setEditorOpen(true);
                    }
                  }}
                  sx={{
                    cursor: isReadOnly ? 'default' : 'pointer',
                    backgroundColor: selectedRowId === field.id ? 'action.selected' : 'inherit',
                    '&:hover': {
                      backgroundColor: selectedRowId === field.id ? 'action.selected' : (isReadOnly ? 'inherit' : 'action.hover')
                    },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  {displayedColumns.map((col, colIdx) => {
                    const cellKey = `${field.id || index}-${col.key || colIdx}`;
                    if (col.key === 'actions') {
                      return (
                        <TableCell key={cellKey}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View all field details">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  onViewDetails(field);
                                }}
                                color="primary"
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit field metadata">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click
                                  onEditField(field);
                                }}
                                color="secondary"
                                disabled={isReadOnly}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      );
                    } else if (col.key === 'name') {
                      return (
                        <TableCell key={cellKey} sx={{ fontWeight: 'medium' }}>
                          {field.name}
                        </TableCell>
                      );
                    } else if (col.key === 'datatype') {
                      return (
                        <TableCell key={cellKey}>
                          <Chip
                            label={field.datatype}
                            size="small"
                            variant="outlined"
                            color={
                              field.datatype === 'string' ? 'primary' :
                              field.datatype === 'number' ? 'secondary' :
                              field.datatype === 'boolean' ? 'success' : 'default'
                            }
                          />
                        </TableCell>
                      );
                    } else if (col.key === 'max_length') {
                      return (
                        <TableCell key={cellKey}>
                          {field.max_length || '-'}
                        </TableCell>
                      );
                    } else if (col.key === 'ai_suggested') {
                      const mapping = ontologyMappings?.find(m => m.original_field_name === field.name);
                      const status = ontologyStatuses[field.name] || (mapping?.ontology_term_status === 'true' ? 'accepted' : 'pending');
                      if (!mapping) {
                        return <TableCell key={cellKey}>-</TableCell>;
                      }
                      if (editingOntology === field.name) {
                        return (
                          <TableCell key={cellKey} onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField
                                size="small"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                sx={{ minWidth: 150 }}
                              />
                              <IconButton size="small" onClick={() => handleSaveOntologyEdit(field.name, mapping)} color="primary">
                                <CheckIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => { setEditingOntology(null); setEditingValue(''); }} color="secondary">
                                <CloseIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={cellKey} onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {status === 'pending' && (
                              <Box sx={{ backgroundColor: '#fff9c4', padding: '4px 8px', borderRadius: 1, border: '1px dashed #fbc02d' }}>
                                <Typography variant="body2" sx={{ textDecoration: 'underline', textDecorationStyle: 'dashed' }}>
                                  {mapping.ontology_term}
                                </Typography>
                              </Box>
                            )}
                            {status === 'accepted' && (
                              <Typography variant="body2">{mapping.ontology_term}</Typography>
                            )}
                            {status === 'user_override' && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{mapping.ontology_term}</Typography>
                                <PersonIcon fontSize="small" />
                              </Box>
                            )}
                            <Tooltip title={mapping.ontological_term_description}>
                              <InfoIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                            </Tooltip>
                            {status === 'pending' && (
                              <>
                                <IconButton size="small" onClick={() => handleAcceptOntology(field.name, mapping)} color="success">
                                  <CheckIcon />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleRejectOntology(field.name)} color="error">
                                  <CloseIcon />
                                </IconButton>
                              </>
                            )}
                            {(status === 'accepted' || status === 'user_override') && (
                              <IconButton size="small" onClick={() => { setEditingOntology(field.name); setEditingValue(mapping.ontology_term); }} color="primary">
                                <EditIcon />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      );
                    } else {
                      const isSpecialField = ['security_class', 'mask', 'permission'].includes(col.key);
                      return (
                        <TableCell key={cellKey}>
                          {isSpecialField ? renderSpecialCell(col.key, field[col.key]?.toString() || '') : (field[col.key]?.toString() || '-')}
                        </TableCell>
                      );
                    }
                  })}
                </TableRow>
              ))}
            </TableBody>
           </Table>
          </Box>
        </Box>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            flexShrink: 0 // Prevent pagination from shrinking
          }}
        />
      </Paper>
    );
  };

  if (!selectedObject) {
    return (
      <Alert severity="info">
        Please select an object to view metadata.
      </Alert>
    );
  }

  const isLoading = isLoadingSourceMetadata || (activeTab === 1 && isLoadingTargetMetadata);
  const error = sourceMetadataError || (activeTab === 1 && targetMetadataError);

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message="Field metadata updated successfully!"
      />

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'flex-start' }, 
        mb: 2, 
        gap: 2,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          flex: '1 1 auto', 
          minWidth: 0,
          width: { xs: '100%', md: 'auto' },
          maxWidth: '100%'
        }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ wordBreak: 'break-word' }}>
            Metadata Management
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ wordBreak: 'break-word' }}>
            View and manage metadata for {selectedObject?.object_name}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          flexShrink: 0,
          flexWrap: 'wrap',
          width: { xs: '100%', md: 'auto' },
          maxWidth: { xs: '100%', md: '400px' },
          justifyContent: { xs: 'flex-start', md: 'flex-end' }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            maxWidth: '100%'
          }}>
            <ToggleButton
              activity="Metadata"
              disabled={getCompletionStatus('Mapping')}
            />
          </Box>
          <Tooltip title="View raw API data">
            <IconButton
              onClick={handleViewRawData}
              color="primary"
              sx={{ border: 1, borderColor: 'primary.main', flexShrink: 0 }}
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* System Information Cards */}
      <Box sx={{ 
        mb: 3, 
        width: '100%', 
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
          <Grid item xs={12} md={6} sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Card variant="outlined" sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Source System
                </Typography>
                <Typography variant="body2">
                  <strong>Object:</strong> {selectedObject.object_name}
                </Typography>
                <Typography variant="body2">
                  <strong>System:</strong> {selectedObject.system_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> Source
                </Typography>
                <Typography variant="body2">
                  <strong>Fields:</strong> {sourceMetadataResponse?.total_records || 0}
                </Typography>
                {isLoadingSourceMetadata && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Loading source metadata...</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Card variant="outlined" sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary">
                Target System
              </Typography>
              {isLoadingMappedObject ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">Loading target mapping...</Typography>
                </Box>
              ) : mappedObjectError ? (
                <Typography variant="body2" color="error">
                  No mapped target object found
                </Typography>
              ) : mappedObject ? (
                <>
                  <Typography variant="body2">
                    <strong>Object:</strong> {mappedObject.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>System:</strong> Target System
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> Target
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fields:</strong> {targetMetadataResponse?.total_records || 0}
                  </Typography>
                  {isLoadingTargetMetadata && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption">Loading target metadata...</Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No target mapping configured
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </Box>

      {/* Tabs for Source/Target */}
      <Paper elevation={1} sx={{ mb: 2, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
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
          }}
        >
          <Tab 
            label="Source Metadata"
            sx={{ 
              fontWeight: activeTab === 0 ? 'bold' : 'normal',
              fontSize: '0.9rem'
            }}
          />
          <Tab 
            label="Target Metadata"
            disabled={!mappedObject}
            sx={{ 
              fontWeight: activeTab === 1 ? 'bold' : 'normal',
              fontSize: '0.9rem'
            }}
          />
        </Tabs>
      </Paper>

      {/* Search and Filter Controls */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 2, 
        flexWrap: 'wrap',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <TextField
          placeholder="Search column headers..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300, flexGrow: 1, maxWidth: '100%' }}
          size="small"
        />

        {activeTab === 1 && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Fields</InputLabel>
            <Select
              value={filterField}
              label="Filter Fields"
              onChange={(e) => setFilterField(e.target.value)}
              startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="all">All Fields</MenuItem>
              <MenuItem value="primary_key">Primary Keys</MenuItem>
              <MenuItem value="foreign_key">Foreign Keys</MenuItem>
              <MenuItem value="required">Required Fields</MenuItem>
              <MenuItem value="unique">Unique Fields</MenuItem>
              <MenuItem value="for_migration">For Migration</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <MetadataTable
          metadata={paginatedMetadata}
          isLoading={isLoadingSourceMetadata}
          error={sourceMetadataError}
          searchTerm={searchTerm}
          highlightText={highlightText}
          totalCount={sourceMetadataResponse?.total_records || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onViewDetails={handleViewDetails}
          onEditField={handleEditField}
          selectedRowId={selectedRowId}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {!mappedObject ? (
          <Alert severity="info">
            No target object mapping found for this source object.
          </Alert>
        ) : (
          <MetadataTable
            metadata={paginatedMetadata}
            isLoading={isLoadingTargetMetadata}
            error={targetMetadataError}
            searchTerm={searchTerm}
            highlightText={highlightText}
            totalCount={targetMetadataResponse?.total_records || 0}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onViewDetails={handleViewDetails}
            onEditField={handleEditField}
            selectedRowId={selectedRowId}
          />
        )}
      </TabPanel>

      {/* Metadata Editor Slide-in */}
      <MetadataEditorSlideIn
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingField(null);
          setSelectedRowId(null);
        }}
        field={editingField}
        onSave={handleSaveField}
        isLoading={isUpdating} // UPDATE: Pass loading state from mutation
      />

      {/* Field Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Field Details: {selectedField?.name}
        </DialogTitle>
        <DialogContent>
          {selectedField && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {Object.entries(selectedField).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      wordBreak: 'break-all',
                      backgroundColor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                      mt: 0.5
                    }}>
                      {value !== null && value !== undefined ? value.toString() : 'null'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Raw Data Dialog */}
      <Dialog 
        open={rawDataDialogOpen} 
        onClose={() => setRawDataDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Raw API Data - {activeTab === 0 ? 'Source' : 'Target'} Metadata
          <Typography variant="caption" display="block" color="text.secondary">
            Total Fields: {currentMetadataResponse?.total_records || 0}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Complete API Response</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{
                  backgroundColor: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(currentMetadataResponse?.records || [], null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRawDataDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};