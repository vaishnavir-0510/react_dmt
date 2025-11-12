// components/migration/FixIssueSlideIn.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  Tooltip,
  FormControlLabel,
  Checkbox,
  AccordionDetails,
  Accordion,
  AccordionSummary,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Preview as PreviewIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetCleanupDataQuery } from '../../services/cleanupDataApi';
import { useGetCleanupFunctionsQuery } from '../../services/cleanupFunctionsApi';
import { useGetObjectMetadataQuery, useGetMappedTargetObjectQuery } from '../../services/metadataApi';
import { useApplyCleanupRuleMutation, useGetTaskStatusQuery } from '../../services/cleanupRuleApi';
import type { CleanupField, CleanupFunction, CleanupFunctionParameter, MetadataField } from '../../types';
import { validateField, validateForm } from '../../utils/validationUtils';

// Update the FixIssueSlideInProps interface
interface FixIssueSlideInProps {
  open: boolean;
  onClose: () => void;
  field: CleanupField;
  objectId: string;
  onTaskStarted: (changeLogId: number, taskId: string) => void;
  taskMap: Record<number, string>; // ← ADD THIS
}

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
      id={`fix-issue-tabpanel-${index}`}
      aria-labelledby={`fix-issue-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const FixIssueSlideIn: React.FC<FixIssueSlideInProps> = ({
  open,
  onClose,
  field,
  objectId,
  onTaskStarted,
  taskMap, // ← RECEIVE THE PROP
}) => {
  const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFunction, setSelectedFunction] = useState<CleanupFunction | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  // Update the snackbar state to include all severity types
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const pageSize = 10;

  // RTK Query mutations
  const [applyCleanupRule, { isLoading: isApplying, error: applyError }] = useApplyCleanupRuleMutation();

  // Fetch source object metadata
  const {
    data: sourceMetadata = [],
    isLoading: isLoadingSourceMetadata,
    error: sourceMetadataError,
  } = useGetObjectMetadataQuery(objectId, { skip: !open });

  // Fetch mapped target object
  const {
    data: mappedTargetObject,
    isLoading: isLoadingMappedTarget,
  } = useGetMappedTargetObjectQuery(
    { 
      sourceObjectId: objectId, 
      projectId: selectedProject?.project_id || '', 
      environmentId: selectedEnvironment?.id || '' 
    },
    { skip: !open || !selectedProject?.project_id || !selectedEnvironment?.id }
  );

  // Fetch target object metadata if mapped target is available
  const {
    data: targetMetadata = [],
    isLoading: isLoadingTargetMetadata,
  } = useGetObjectMetadataQuery(mappedTargetObject?.id || '', { 
    skip: !open || !mappedTargetObject?.id 
  });

  const {
    data: cleanupData,
    isLoading: isLoadingData,
    error: dataError,
    isFetching: isFetchingData,
  } = useGetCleanupDataQuery(
    { 
      objectId, 
      changeLogId: field.change_log_id!,
      page: currentPage,
      pageSize 
    },
    { skip: !open || !field.change_log_id }
  );

  const {
    data: cleanupFunctions = [],
    isLoading: isLoadingFunctions,
    error: functionsError,
  } = useGetCleanupFunctionsQuery(
    { changeLogId: field.change_log_id! },
    { skip: !open || !field.change_log_id }
  );

  // Memoized field names from metadata
  const sourceFieldNames = useMemo(() => {
    const names = sourceMetadata
      .map((field: MetadataField) => field.name)
      .filter(Boolean)
      .sort();
    console.log('Source field names computed:', names);
    return names;
  }, [sourceMetadata]);

  const targetFieldNames = useMemo(() => {
    const names = targetMetadata
      .map((field: MetadataField) => field.name)
      .filter(Boolean)
      .sort();
    console.log('Target field names computed:', names);
    return names;
  }, [targetMetadata]);

  // Debug useEffect
  useEffect(() => {
    if (open) {
      console.log('🔍 FixIssueSlideIn DEBUG:', {
        field: field.field_name,
        objectId,
        sourceMetadataCount: sourceMetadata.length,
        sourceFieldNames,
        targetMetadataCount: targetMetadata.length, 
        targetFieldNames,
        cleanupFunctionsCount: cleanupFunctions.length,
      });
    }
  }, [open, field, objectId, sourceMetadata, targetMetadata, cleanupFunctions, sourceFieldNames, targetFieldNames]);

  // Helper function to get field options
  const getFieldOptions = (param: CleanupFunctionParameter): string[] => {
    console.log('🎯 Getting field options for parameter:', {
      attribute: param.attribute,
      values: param.values,
      uiComponent: param.ui_component
    });
    
    // SPECIAL CASE: For column_name parameters, ALWAYS return source field names
    if (param.attribute === 'column_name' || param.attribute.includes('column_name') || param.attribute.includes('field_name')) {
      console.log('⚡ FORCING source field names for column parameter:', sourceFieldNames);
      return sourceFieldNames;
    }
    
    // For other parameters with values, process normally
    if (param.values && param.values.length > 0) {
      const resolvedValues: string[] = [];
      
      param.values.forEach(value => {
        if (typeof value === 'string') {
          // If it's a pattern-like string, resolve it dynamically
          if (value.includes('CUR_SRC_OBJECT_MDT') || value.includes('CUR_SRC_FIELD_MDT')) {
            console.log('🔍 Detected source pattern, resolving:', value);
            resolvedValues.push(...sourceFieldNames);
          } 
          // If it's a target pattern, resolve it
          else if (value.includes('CUR_TGT_OBJECT_MDT') || value.includes('CUR_TGT_FIELD_MDT')) {
            console.log('🔍 Detected target pattern, resolving:', value);
            resolvedValues.push(...targetFieldNames);
          }
          else {
            // Regular static value - add as is
            resolvedValues.push(value);
          }
        }
      });
      
      const uniqueValues = [...new Set(resolvedValues)];
      console.log('✅ Final field options:', uniqueValues);
      return uniqueValues;
    }

    // If no values defined, return empty array
    console.log('❌ No values defined for parameter:', param.attribute);
    return [];
  };

  // Helper function to get default value
  const getDefaultValue = (param: CleanupFunctionParameter): any => {
    console.log('🔧 Getting default value for:', {
      attribute: param.attribute,
      default: param.default,
      defaultType: param.default_type
    });
    
    // SPECIAL CASE: For column_name with dynamic defaults
    if (param.attribute === 'column_name' && param.default_type === 'dynamic') {
      console.log('⚡ Handling dynamic default for column_name');
      
      if (sourceFieldNames.length > 0) {
        // Try to find a field that matches the current cleanup field
        const matchingField = sourceFieldNames.find(fieldName => 
          fieldName.toLowerCase() === field.field_name?.toLowerCase()
        );
        
        const result = matchingField || sourceFieldNames[0] || '';
        console.log('🎯 Selected column default:', result);
        return result;
      }
      return '';
    }
    
    if (param.default_type === 'dynamic') {
      // Handle other dynamic defaults (for non-column parameters)
      if (param.default && typeof param.default === 'string') {
        if (param.default.startsWith('[') && param.default.endsWith(']')) {
          const dynamicValues = getDynamicFieldValues(param.default);
          return dynamicValues.length > 0 ? dynamicValues[0] : '';
        }
      }
      return '';
    }
    
    // Static defaults
    return param.default || '';
  };

  const getDynamicFieldValues = (dynamicPattern: string): string[] => {
    console.log('🔄 Resolving dynamic pattern:', dynamicPattern);
    
    switch (dynamicPattern) {
      case '[CUR_SRC_FIELD_MDT].name':
      case '[CUR_SRC_OBJECT_MDT].name':
        return sourceFieldNames;
      
      case '[CUR_TGT_FIELD_MDT].name':
      case '[CUR_TGT_OBJECT_MDT].name':
        return targetFieldNames;
      
      default:
        if (dynamicPattern.includes('CUR_SRC')) {
          return sourceFieldNames;
        }
        if (dynamicPattern.includes('CUR_TGT')) {
          return targetFieldNames;
        }
        console.warn('❌ Unknown dynamic pattern:', dynamicPattern);
        return [];
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleFunctionSelect = (func: CleanupFunction) => {
    console.log('🎯 Function selected:', func["JSON Configuration"].title);
    setSelectedFunction(func);
    
    // Initialize form data with dynamic defaults
    const initialData: Record<string, any> = {};
    func["JSON Configuration"].configuration.forEach(param => {
      const defaultValue = getDefaultValue(param);
      console.log(`📝 Setting default for ${param.attribute}:`, defaultValue);
      initialData[param.attribute] = defaultValue;
    });
    
    setFormData(initialData);
    setFormErrors({});
    setTouchedFields(new Set());
  };

  const handleInputChange = (param: CleanupFunctionParameter) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const value = event.target.value;
    const newFormData = {
      ...formData,
      [param.attribute]: value,
    };

    setFormData(newFormData);

    // Validate immediately when field changes
    const validationResult = validateField(value, param.validation);
    setFormErrors(prev => ({
      ...prev,
      [param.attribute]: validationResult.errors,
    }));

    // Also mark as touched
    setTouchedFields(prev => new Set(prev).add(param.attribute));
  };

  const handleFieldBlur = (param: CleanupFunctionParameter) => () => {
    setTouchedFields(prev => new Set(prev).add(param.attribute));
    
    // Validate field
    const validationResult = validateField(formData[param.attribute], param.validation);
    setFormErrors(prev => ({
      ...prev,
      [param.attribute]: validationResult.errors,
    }));
  };

  const validateCurrentStep = (): boolean => {
    if (activeTab === 1 && selectedFunction) {
      const errors = validateForm(formData, selectedFunction["JSON Configuration"].configuration);
      setFormErrors(errors);
      
      // Mark all fields as touched
      const allFields = new Set(selectedFunction["JSON Configuration"].configuration.map(p => p.attribute));
      setTouchedFields(allFields);
      
      return Object.keys(errors).length === 0;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveTab(activeTab + 1);
    }
  };

  const handleBack = () => {
    setActiveTab(activeTab - 1);
  };

 const handleApplyFix = async () => {
    if (selectedFunction && validateCurrentStep()) {
      try {
        console.log('🚀 Applying fix:', {
          function: selectedFunction.cleanup_function_name,
          params: formData,
          changeLogId: field.change_log_id,
        });

        // Check if task already exists for this change_log_id using the prop
        const existingTaskId = taskMap[field.change_log_id!];
        if (existingTaskId) {
          setSnackbar({
            open: true,
            message: `Cleanup task already in progress! Task ID: ${existingTaskId}`,
            severity: 'warning'
          });
          return;
        }

        // Prepare the API payload
        const payload = {
          change_log_id: field.change_log_id!,
          cleanup_fun_id: selectedFunction.cleanup_fun_id,
          function_name: selectedFunction.cleanup_function_name,
          object_id: objectId,
          params: formData,
          sequence: 0,
          tab_name: "cleanup",
          validation_fun_id: null,
        };

        console.log('📤 Sending payload:', payload);

        // Call the API
        const result = await applyCleanupRule(payload).unwrap();
        
        console.log('✅ Fix applied successfully:', result);

        // Notify parent component about the task - parent will update taskMap
        if (result.task_id) {
          onTaskStarted(field.change_log_id!, result.task_id);
          
          setSnackbar({
            open: true,
            message: `Cleanup task started successfully! Task ID: ${result.task_id}`,
            severity: 'success'
          });
        }

        // Close the slide-in after successful submission
        setTimeout(() => {
          onClose();
        }, 2000);

      } catch (error: any) {
        console.error('❌ Failed to apply fix:', error);
        
        // Handle 409 conflict error specifically
        if (error.status === 409 || error?.data?.status === 409) {
          const conflictMessage = error.data?.message || 'This cleanup operation is already in progress';
          const conflictTaskId = error.data?.task_id;
          
          setSnackbar({
            open: true,
            message: conflictMessage,
            severity: 'warning'
          });
          
          // If the error includes a task_id, notify parent to update taskMap
          if (conflictTaskId) {
            onTaskStarted(field.change_log_id!, conflictTaskId);
          }
        } else {
          // Handle other errors
          setSnackbar({
            open: true,
            message: error.data?.message || 'Failed to apply fix. Please try again.',
            severity: 'error'
          });
        }
      }
    }
  };


  // Reset to first page when opening or when field changes
  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      setActiveTab(0);
      setSelectedFunction(null);
      setFormData({});
      setFormErrors({});
      setTouchedFields(new Set());
    }
  }, [open, field]);

  const getProblemDescription = () => {
    if (!field.metadata_attribute) {
      return "No specific metadata issue identified. General cleanup required.";
    }

    const descriptions: Record<string, string> = {
      'is_fixed_length': `The field '${field.field_name}' is being changed from variable length to fixed length. This may affect data storage and validation.`,
      'is_required': `The field '${field.field_name}' is changing its requirement status.`,
      'is_unique': `The field '${field.field_name}' is changing its uniqueness constraint.`,
      'max_length': `The field '${field.field_name}' has a length constraint modification.`,
      'data_format': `The field '${field.field_name}' has a data format change.`,
    };

    return descriptions[field.metadata_attribute] || 
           `Metadata attribute '${field.metadata_attribute}' is being modified for field '${field.field_name}'.`;
  };

  const getStepStatus = (stepIndex: number) => {
    if (activeTab > stepIndex) return 'completed';
    if (activeTab === stepIndex) return 'current';
    return 'pending';
  };

  useEffect(() => {
    if (selectedFunction && Object.keys(formErrors).length > 0) {
      console.log('🔍 Form Errors:', formErrors);
      console.log('🔍 Form Data:', formData);
    }
  }, [formErrors, formData, selectedFunction]);

  const renderStepIndicator = (stepIndex: number, label: string) => {
    const status = getStepStatus(stepIndex);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            ...(status === 'completed' && {
              backgroundColor: 'success.main',
              color: 'white',
            }),
            ...(status === 'current' && {
              backgroundColor: 'primary.main',
              color: 'white',
            }),
            ...(status === 'pending' && {
              backgroundColor: 'grey.300',
              color: 'grey.600',
            }),
          }}
        >
          {status === 'completed' ? <CheckCircleIcon fontSize="small" /> : stepIndex + 1}
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: status === 'current' ? 'bold' : 'normal',
            color: status === 'pending' ? 'text.secondary' : 'text.primary'
          }}
        >
          {label}
        </Typography>
      </Box>
    );
  };

  const renderParameterControl = (param: CleanupFunctionParameter) => {
    const value = formData[param.attribute] || '';
    const errors = formErrors[param.attribute] || [];
    const isTouched = touchedFields.has(param.attribute);
    const showErrors = isTouched && errors.length > 0;
    const fieldOptions = getFieldOptions(param);

    console.log('🎨 Rendering parameter control:', {
      param: param.attribute,
      value,
      fieldOptionsCount: fieldOptions.length,
      fieldOptions,
      hasErrors: showErrors,
      uiComponent: param.ui_component
    });

    // Show loading state if metadata is still loading for dynamic fields
    const isLoadingMetadata = 
      (param.values?.some(v => v.includes('CUR_SRC')) && isLoadingSourceMetadata) ||
      (param.values?.some(v => v.includes('CUR_TGT')) && isLoadingTargetMetadata);

    if (isLoadingMetadata) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading field options...
          </Typography>
        </Box>
      );
    }

    // Show error if metadata failed to load
    if (sourceMetadataError && param.values?.some(v => v.includes('CUR_SRC'))) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load source field options. Please try again.
        </Alert>
      );
    }

    // Show warning if no field options available for dynamic fields
    if (param.values?.some(v => v.includes('CUR_SRC')) && fieldOptions.length === 0) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No source field names available. Please check if the object has metadata.
        </Alert>
      );
    }

    switch (param.ui_component) {
      case 'dropdown':
        return (
          <FormControl 
            fullWidth 
            size="small" 
            error={showErrors}
            sx={{ mb: 2 }}
          >
            <InputLabel>{param.label}</InputLabel>
            <Select
              value={value}
              onChange={handleInputChange(param)}
              onBlur={handleFieldBlur(param)}
              label={param.label}
              disabled={fieldOptions.length === 0}
            >
              <MenuItem value="">
                <em>Select {param.label}</em>
              </MenuItem>
              {fieldOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {showErrors && (
              <FormHelperText>{errors[0]}</FormHelperText>
            )}
            {param.hint && !showErrors && (
              <FormHelperText>{param.hint}</FormHelperText>
            )}
            {fieldOptions.length === 0 && (
              <FormHelperText error>
                No field options available. Check object metadata.
              </FormHelperText>
            )}
          </FormControl>
        );

      case 'textbox':
        return (
          <TextField
            fullWidth
            size="small"
            label={param.label}
            value={value}
            onChange={handleInputChange(param)}
            onBlur={handleFieldBlur(param)}
            error={showErrors}
            helperText={showErrors ? errors[0] : param.hint}
            placeholder={param.placeholder}
            sx={{ mb: 2 }}
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={handleInputChange(param)}
                onBlur={handleFieldBlur(param)}
              />
            }
            label={param.label}
            sx={{ mb: 2 }}
          />
        );

      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={param.label}
            value={value}
            onChange={handleInputChange(param)}
            onBlur={handleFieldBlur(param)}
            error={showErrors}
            helperText={showErrors ? errors[0] : param.hint}
            placeholder={param.placeholder}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const renderFunctionCard = (func: CleanupFunction) => {
    const isSelected = selectedFunction?.cleanup_fun_id === func.cleanup_fun_id;
    
    return (
      <Card 
        elevation={isSelected ? 4 : 1}
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'grey.300',
          '&:hover': {
            borderColor: 'primary.light',
          }
        }}
        onClick={() => handleFunctionSelect(func)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="h3">
              {func["JSON Configuration"].title}
            </Typography>
            {isSelected && (
              <CheckCircleIcon color="primary" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            {func["JSON Configuration"].description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {func["JSON Configuration"].helptext}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`Function: ${func.cleanup_function_name}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`Affects: ${func.affected_rows} rows`} 
              size="small" 
              color="primary" 
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderAffectedRecordsTable = () => {
    if (isLoadingData || isFetchingData) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (dataError) {
      return (
        <Alert severity="error">
          Failed to load affected records. Please try again later.
        </Alert>
      );
    }

    if (!cleanupData?.data || cleanupData.data.length === 0) {
      return (
        <Alert severity="info">
          No affected records found for this issue.
        </Alert>
      );
    }

    const records = cleanupData.data;
    const columns = Object.keys(records[0] || {});

    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {records.length} of {cleanupData.total_records} affected records
          </Typography>
          <Chip 
            label={`Page ${currentPage} of ${cleanupData.total_pages}`}
            size="small"
            variant="outlined"
          />
        </Box>

        <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column} sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column}>
                      <Typography 
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={String(record[column])}
                      >
                        {String(record[column])}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {cleanupData.total_pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={cleanupData.total_pages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Box>
    );
  };

  const modalWidth = 900;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }}
      >
        <Paper
          sx={{
            width: modalWidth,
            height: '100vh',
            margin: 0,
            borderRadius: 0,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: 'primary.main',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                  Fix Data Issue
                </Typography>
                <Typography variant="body1">
                  Field: <strong>{field.field_name}</strong>
                </Typography>
                {field.metadata_attribute && (
                  <Typography variant="body2">
                    Attribute: <strong>{field.metadata_attribute}</strong>
                  </Typography>
                )}
              </Box>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Progress Steps */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {renderStepIndicator(0, 'Review Issue')}
              <Box 
                key="divider-1"
                sx={{ flex: 1, height: 2, backgroundColor: 'grey.300', mx: 1 }} 
              />
              {renderStepIndicator(1, 'Select Fix')}
              <Box 
                key="divider-2" 
                sx={{ flex: 1, height: 2, backgroundColor: 'grey.300', mx: 1 }} 
              />
              {renderStepIndicator(2, 'Preview & Apply')}
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Review Issue" />
              <Tab label="Select Fix" disabled={activeTab < 1} />
              <Tab label="Preview & Apply" disabled={activeTab < 2} />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorIcon color="warning" />
                        Problem Description
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {getProblemDescription()}
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Affected Rows
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {field.affected_rows}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Change Type
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {field.metadata_attribute || 'General Cleanup'}
                          </Typography>
                        </Grid>
                        {field.old_value && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Current Value
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace">
                              {field.old_value}
                            </Typography>
                          </Grid>
                        )}
                        {field.new_value && (
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Proposed Value
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace">
                              {field.new_value}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Sample Affected Records
                      </Typography>
                      {renderAffectedRecordsTable()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<BuildIcon />}
                  disabled={isLoadingFunctions}
                >
                  {isLoadingFunctions ? <CircularProgress size={20} /> : 'Continue to Select Fix'}
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {isLoadingFunctions ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : functionsError ? (
                <Alert severity="error">
                  Failed to load cleanup functions. Please try again later.
                </Alert>
              ) : cleanupFunctions.length === 0 ? (
                <Alert severity="info">
                  No cleanup functions available for this issue.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Choose Fix for Your Issue
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Select a cleanup function and configure its parameters to fix the data quality issue.
                    </Typography>
                    
                    {cleanupFunctions.map((func) => renderFunctionCard(func))}
                  </Grid>

                  {selectedFunction && (
                    <Grid item xs={12}>
                      <Card elevation={2}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BuildIcon color="primary" />
                            Configure {selectedFunction["JSON Configuration"].title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {selectedFunction["JSON Configuration"].helptext}
                          </Typography>

                          <Box sx={{ mt: 2 }}>
                            {selectedFunction["JSON Configuration"].configuration.map((param) => (
                              <Box key={param.attribute}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle2">
                                    {param.label}
                                    {!param.optional && ' *'}
                                  </Typography>
                                  <Tooltip title={param.tool_tip}>
                                    <InfoIcon fontSize="small" color="action" />
                                  </Tooltip>
                                </Box>
                                {renderParameterControl(param)}
                              </Box>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                >
                  Back to Review
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<PreviewIcon />}
                  disabled={!selectedFunction || Object.keys(formErrors).some(key => formErrors[key].length > 0)}
                >
                  Preview & Apply
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {selectedFunction && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PreviewIcon color="primary" />
                          Preview Fix Application
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Selected Function
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedFunction["JSON Configuration"].title}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Affected Records
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="error.main">
                              {selectedFunction.affected_rows}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Accordion sx={{ mt: 2 }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">Configuration Parameters</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Table size="small">
                              <TableBody>
                                {selectedFunction["JSON Configuration"].configuration.map((param) => (
                                  <TableRow key={param.attribute}>
                                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
                                      {param.label}
                                    </TableCell>
                                    <TableCell>
                                      {formData[param.attribute] || '(Not set)'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionDetails>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="warning">
                      This action will modify {selectedFunction.affected_rows} records. Please review the configuration before applying.
                    </Alert>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                >
                  Back to Fix Selection
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleApplyFix}
                  disabled={Object.keys(formErrors).some(key => formErrors[key].length > 0) || isApplying}
                >
                  {isApplying ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    `Apply Fix to ${selectedFunction?.affected_rows || 0} Records`
                  )}
                </Button>
              </Box>
            </TabPanel>
          </Box>
        </Paper>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};