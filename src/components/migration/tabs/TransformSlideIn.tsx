// components/migration/tabs/TransformSlideIn.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Build as BuildIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useGetTransformDataQuery } from '../../../services/transformApi';
import { 
  useGetTransformActionConfigQuery, 
  useGetTransformActionsQuery, 
  type TransformAction, 
  type TransformActionConfig, 
  type TransformActionParameter 
} from '../../../services/transformActionsApi';
import { useGetObjectMetadataQuery, useGetMappedTargetObjectQuery } from '../../../services/metadataApi';
import { useApplyTransformRuleMutation, useGetTransformTaskStatusQuery } from '../../../services/transformRuleApi';
import type { TransformDataRecord, MetadataField } from '../../../types';
import type { RootState } from '../../../store';

interface TransformSlideInProps {
  open: boolean;
  onClose: () => void;
  objectId: string;
  objectName: string;
  onTaskStarted: (objectId: string, taskId: string) => void;
  taskMap: Record<string, string>;
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
      id={`transform-tabpanel-${index}`}
      aria-labelledby={`transform-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const TransformSlideIn: React.FC<TransformSlideInProps> = ({
  open,
  onClose,
  objectId,
  objectName,
  onTaskStarted,
  taskMap,
}) => {
  const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFunction, setSelectedFunction] = useState<TransformAction | null>(null);
  const [selectedFunctionConfig, setSelectedFunctionConfig] = useState<TransformActionConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loadingFunction, setLoadingFunction] = useState<string | null>(null);
  const [transformTaskId, setTransformTaskId] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);
  const [transformStage, setTransformStage] = useState('');

  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // API hooks
  const {
    data: transformData,
    isLoading: isLoadingData,
    error: dataError,
    isFetching: isFetchingData,
    refetch: refetchTransformData,
  } = useGetTransformDataQuery(
    { 
      objectId: objectId,
      page: currentPage,
      pageSize: pageSize
    },
    { skip: !open || !objectId }
  );

  const {
    data: transformActions = [],
    isLoading: isLoadingActions,
    error: actionsError,
  } = useGetTransformActionsQuery(undefined, { skip: !open });

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
    data: functionConfigResponse,
    isLoading: isLoadingConfig,
    error: configError,
  } = useGetTransformActionConfigQuery(selectedFunction?.function_name || '', {
    skip: !open || !selectedFunction?.function_name
  });

  // Transform API mutations
  const [applyTransformRule, { isLoading: isApplyingTransform }] = useApplyTransformRuleMutation();

  // Task status polling
  const {
    data: taskStatus,
    error: taskStatusError,
    isFetching: isFetchingTaskStatus,
  } = useGetTransformTaskStatusQuery(
    { taskId: transformTaskId! },
    {
      skip: !transformTaskId || !isTransforming,
      pollingInterval: isTransforming ? 2000 : 0, // Poll every 2 seconds when transforming
    }
  );

  // CORRECTED: Extract the actual config from array response
  const functionConfig = Array.isArray(functionConfigResponse) 
    ? functionConfigResponse[0] 
    : functionConfigResponse;

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

  // Handle task status updates
  useEffect(() => {
    if (taskStatus && isTransforming) {
      console.log('🔄 Task status update:', taskStatus);
      
      setTransformProgress(taskStatus.progress || 0);
      setTransformStage(taskStatus.stage || '');

      // Check for completion states
      const completedStatuses = ['SUCCESS', 'COMPLETE', 'FAILURE', 'ERROR'];
      if (completedStatuses.includes(taskStatus.status)) {
        setIsTransforming(false);
        
        if (taskStatus.status === 'SUCCESS' || taskStatus.status === 'COMPLETE') {
          setSnackbar({
            open: true,
            message: `Transformation "${selectedFunction?.title}" completed successfully!`,
            severity: 'success'
          });
          
          // Refresh data after successful transformation
          setTimeout(() => {
            refetchTransformData();
          }, 1000);
          
          // Close slide-in after delay
          setTimeout(() => {
            handleClose();
          }, 3000);
        } else {
          setSnackbar({
            open: true,
            message: `Transformation failed: ${taskStatus.error || 'Unknown error'}`,
            severity: 'error'
          });
        }
      }
    }
  }, [taskStatus, isTransforming, selectedFunction, refetchTransformData]);

  // Auto-close after 1 minute if still processing
  useEffect(() => {
    let timeout: number; // CHANGED: Use number instead of NodeJS.Timeout
    
    if (isTransforming) {
      timeout = setTimeout(() => {
        if (isTransforming) {
          setIsTransforming(false);
          setSnackbar({
            open: true,
            message: 'Transformation timeout after 1 minute. Please check task status manually.',
            severity: 'warning'
          });
        }
      }, 60000) as unknown as number; // CHANGED: Cast to number for browser environment
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isTransforming]);

  // Debug: Check API response and metadata
  useEffect(() => {
    if (open) {
      console.log('🔍 TransformSlideIn DEBUG:', {
        objectId,
        objectName,
        sourceMetadataCount: sourceMetadata.length,
        sourceFieldNames,
        targetMetadataCount: targetMetadata.length, 
        targetFieldNames,
        functionConfigResponse,
        functionConfig,
        selectedFunction,
      });
    }
  }, [open, objectId, objectName, sourceMetadata, targetMetadata, sourceFieldNames, targetFieldNames, functionConfigResponse, functionConfig, selectedFunction]);

  // Update selected function config when API returns data
  useEffect(() => {
    if (functionConfig) {
      console.log('Function config processed:', functionConfig);
      setSelectedFunctionConfig(functionConfig);
      setLoadingFunction(null);
      
      // Initialize form data with defaults from config
      const initialData: Record<string, any> = {};
      
      // CORRECTED: Handle both array and object responses
      const configuration = functionConfig["JSON Configuration"]?.configuration;
      
      if (configuration && Array.isArray(configuration)) {
        configuration.forEach((param: TransformActionParameter) => {
          const defaultValue = getDefaultValue(param);
          console.log(`📝 Setting default for ${param.attribute}:`, defaultValue);
          initialData[param.attribute] = defaultValue;
        });
        
        console.log('Initialized form data:', initialData);
      } else {
        console.warn('Configuration not found or not an array:', configuration);
      }
      
      setFormData(initialData);
      setFormErrors({});
      setTouchedFields(new Set());
    }
  }, [functionConfig]);

  // Jab config loading complete ho aur function selected ho, to card expand karein
  useEffect(() => {
    if (selectedFunction && functionConfig && !isLoadingConfig) {
      console.log('Expanding card for:', selectedFunction.function_name);
      setExpandedCard(selectedFunction.function_name);
    }
  }, [selectedFunction, functionConfig, isLoadingConfig]);

  // Helper function to get dynamic field values
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

  // Helper function to get field options
  const getFieldOptions = (param: TransformActionParameter): string[] => {
    console.log('🎯 Getting field options for parameter:', {
      attribute: param.attribute,
      values: param.values,
      uiComponent: param.ui_component
    });
    
    // SPECIAL CASE: For column_name parameters, ALWAYS return source field names
    if (param.attribute === 'column_name' || param.attribute.includes('column_name') || param.attribute.includes('field_name') || param.attribute.includes('source_field')) {
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
  const getDefaultValue = (param: TransformActionParameter): any => {
    console.log('🔧 Getting default value for:', {
      attribute: param.attribute,
      default: param.default,
      defaultType: param.default_type
    });
    
    // SPECIAL CASE: For source_field with dynamic defaults
    if ((param.attribute === 'source_field' || param.attribute.includes('field')) && param.default_type === 'dynamic') {
      console.log('⚡ Handling dynamic default for source_field');
      
      if (sourceFieldNames.length > 0) {
        const result = sourceFieldNames[0] || '';
        console.log('🎯 Selected source field default:', result);
        return result;
      }
      return '';
    }
    
    if (param.default_type === 'dynamic') {
      // Handle other dynamic defaults
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

  // ENHANCED: Field validation function based on API JSON rules
  const validateField = (value: any, validations: any[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!validations || validations.length === 0) {
      return { isValid: true, errors: [] };
    }
    
    console.log('🔍 Validating field:', { value, validations });

    validations.forEach(validation => {
      switch (validation.rule) {
        case 'not_null':
          if (!value && value !== false && value !== 0) {
            console.log('❌ Not null validation failed');
            errors.push(validation.message);
          }
          break;
          
        case 'regex':
          if (value && validation.pattern) {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
              console.log('❌ Regex validation failed:', { value, pattern: validation.pattern });
              errors.push(validation.message);
            }
          }
          break;
          
        case 'min_length':
          if (value && validation.value && value.length < parseInt(validation.value)) {
            console.log('❌ Min length validation failed:', { value, minLength: validation.value });
            errors.push(validation.message);
          }
          break;
          
        case 'max_length':
          if (value && validation.value && value.length > parseInt(validation.value)) {
            console.log('❌ Max length validation failed:', { value, maxLength: validation.value });
            errors.push(validation.message);
          }
          break;
          
        case 'min_value':
          if (value !== undefined && value !== null && validation.value && parseFloat(value) < parseFloat(validation.value)) {
            console.log('❌ Min value validation failed:', { value, minValue: validation.value });
            errors.push(validation.message);
          }
          break;
          
        case 'max_value':
          if (value !== undefined && value !== null && validation.value && parseFloat(value) > parseFloat(validation.value)) {
            console.log('❌ Max value validation failed:', { value, maxValue: validation.value });
            errors.push(validation.message);
          }
          break;
          
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            console.log('❌ Email validation failed');
            errors.push(validation.message);
          }
          break;
          
        case 'url':
          if (value && !/^https?:\/\/.+\..+/.test(value)) {
            console.log('❌ URL validation failed');
            errors.push(validation.message);
          }
          break;
          
        case 'API':
          // API validation - for now, we'll skip actual API calls in validation
          console.log('⚠️ API validation skipped (would call):', validation.api);
          break;
          
        default:
          console.warn('❓ Unknown validation rule:', validation.rule);
          break;
      }
    });
    
    console.log('✅ Validation result:', { isValid: errors.length === 0, errors });
    return { isValid: errors.length === 0, errors };
  };

  // ENHANCED: Form validation function that validates all required fields
  const validateForm = (): { isValid: boolean; errors: Record<string, string[]> } => {
    if (!selectedFunctionConfig || !selectedFunctionConfig["JSON Configuration"]?.configuration) {
      return { isValid: false, errors: {} };
    }
    
    const errors: Record<string, string[]> = {};
    let isValid = true;

    console.log('🔍 Starting form validation for function:', selectedFunctionConfig["JSON Configuration"].title);

    selectedFunctionConfig["JSON Configuration"].configuration.forEach((param: TransformActionParameter) => {
      const value = formData[param.attribute];
      console.log(`🔍 Validating parameter: ${param.attribute} =`, value);
      
      // Validate only if field is not optional OR if it has value and validations
      if (!param.optional || (value && param.validation && param.validation.length > 0)) {
        const validationResult = validateField(value, param.validation || []);
        
        if (!validationResult.isValid) {
          errors[param.attribute] = validationResult.errors;
          isValid = false;
          console.log(`❌ Validation failed for ${param.attribute}:`, validationResult.errors);
        }
      }
    });

    console.log('📊 Final validation result:', { isValid, errors });
    return { isValid, errors };
  };

  // Validate current step before navigation
  const validateCurrentStep = (): boolean => {
    if (activeTab === 1 && selectedFunction) {
      const validationResult = validateForm();
      setFormErrors(validationResult.errors);
      
      // Mark all fields as touched to show errors
      const allFields = new Set(selectedFunctionConfig?.["JSON Configuration"]?.configuration?.map(p => p.attribute) || []);
      setTouchedFields(allFields);
      
      if (!validationResult.isValid) {
        setSnackbar({
          open: true,
          message: 'Please fix validation errors before proceeding.',
          severity: 'error'
        });
      }
      
      return validationResult.isValid;
    }
    return true;
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveTab(activeTab + 1);
    }
  };

  const handleBack = () => {
    setActiveTab(activeTab - 1);
  };

  const handleFunctionSelect = (func: TransformAction) => {
    console.log('Function selected:', func.function_name);
    setSelectedFunction(func);
    setSelectedFunctionConfig(null);
    setExpandedCard(null);
    setLoadingFunction(func.function_name);
  };

  // Handle card header click only, not the entire card
  const handleCardHeaderClick = (func: TransformAction) => {
    console.log('Card header clicked for:', func.function_name, 'Current expanded:', expandedCard);
    
    if (expandedCard === func.function_name) {
      // Same card pe click - collapse karein
      setExpandedCard(null);
      setLoadingFunction(null);
    } else {
      // Naya card expand karein
      setExpandedCard(func.function_name);
      if (selectedFunction?.function_name !== func.function_name) {
        // Naya function select karein
        setSelectedFunction(func);
        setLoadingFunction(func.function_name);
      }
    }
  };

  const handleInputChange = (param: TransformActionParameter) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const value = param.ui_component === 'checkbox' ? event.target.checked : event.target.value;
    const newFormData = {
      ...formData,
      [param.attribute]: value,
    };

    setFormData(newFormData);

    // Validate field immediately when it changes
    const validationResult = validateField(value, param.validation || []);
    setFormErrors(prev => ({
      ...prev,
      [param.attribute]: validationResult.errors,
    }));

    // Mark as touched
    setTouchedFields(prev => new Set(prev).add(param.attribute));
  };

  const handleFieldBlur = (param: TransformActionParameter) => () => {
    setTouchedFields(prev => new Set(prev).add(param.attribute));
    
    // Validate field on blur
    const validationResult = validateField(formData[param.attribute], param.validation || []);
    setFormErrors(prev => ({
      ...prev,
      [param.attribute]: validationResult.errors,
    }));
  };

  const handleClose = () => {
    // Reset all states
    setActiveTab(0);
    setSelectedFunction(null);
    setSelectedFunctionConfig(null);
    setFormData({});
    setFormErrors({});
    setTouchedFields(new Set());
    setExpandedCard(null);
    setLoadingFunction(null);
    setTransformTaskId(null);
    setIsTransforming(false);
    setTransformProgress(0);
    setTransformStage('');
    onClose();
  };

  const handleTransform = async () => {
    const validationResult = validateForm();
    
    if (!validationResult.isValid) {
      setFormErrors(validationResult.errors);
      
      // Mark all fields as touched to show errors
      const allFields = new Set(selectedFunctionConfig?.["JSON Configuration"]?.configuration?.map(p => p.attribute) || []);
      setTouchedFields(allFields);
      
      setSnackbar({
        open: true,
        message: 'Please fix validation errors before executing transformation.',
        severity: 'error'
      });
      return;
    }

    try {
      setIsTransforming(true);
      setTransformProgress(0);
      setTransformStage('Starting transformation...');

      // Prepare payload for transform API
      const payload = {
        object_id: objectId,
        function_name: selectedFunction!.function_name,
        params: formData,
      };

      console.log('🚀 Sending transform request:', payload);

      // Call transform API
      const result = await applyTransformRule(payload).unwrap();
      
      console.log('✅ Transform task created:', result);
      
      // Set task ID for status polling
      setTransformTaskId(result.task_id);
      
      // Notify parent component
      onTaskStarted(objectId, result.task_id);
      
      setSnackbar({
        open: true,
        message: `Transformation "${selectedFunction?.title}" started successfully! Task ID: ${result.task_id}`,
        severity: 'success'
      });

    } catch (error: any) {
      console.error('❌ Failed to start transformation:', error);
      setIsTransforming(false);
      
      // Handle 409 conflict error
      if (error.status === 409) {
        const conflictTaskId = error.data?.task_id;
        setSnackbar({
          open: true,
          message: error.data?.message || 'This transformation is already in progress.',
          severity: 'warning'
        });
        
        if (conflictTaskId) {
          setTransformTaskId(conflictTaskId);
          setIsTransforming(true);
          onTaskStarted(objectId, conflictTaskId);
        }
      } else {
        setSnackbar({
          open: true,
          message: error.data?.message || 'Failed to start transformation. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (activeTab > stepIndex) return 'completed';
    if (activeTab === stepIndex) return 'current';
    return 'pending';
  };

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

  const renderParameterControl = (param: TransformActionParameter) => {
    const value = formData[param.attribute] || '';
    const errors = formErrors[param.attribute] || [];
    const isTouched = touchedFields.has(param.attribute);
    const showErrors = isTouched && errors.length > 0;
    const fieldOptions = getFieldOptions(param);

    // Show loading state if metadata is still loading for dynamic fields
    const isLoadingMetadata = 
      (param.values?.some(v => typeof v === 'string' && v.includes('CUR_SRC')) && isLoadingSourceMetadata) ||
      (param.values?.some(v => typeof v === 'string' && v.includes('CUR_TGT')) && isLoadingTargetMetadata);

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
    if (sourceMetadataError && param.values?.some(v => typeof v === 'string' && v.includes('CUR_SRC'))) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load source field options. Please try again.
        </Alert>
      );
    }

    // Show warning if no field options available for dynamic fields
    if (param.values?.some(v => typeof v === 'string' && v.includes('CUR_SRC')) && fieldOptions.length === 0) {
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
              <FormHelperText>{errors.join(', ')}</FormHelperText>
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
            helperText={showErrors ? errors.join(', ') : param.hint}
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
            helperText={showErrors ? errors.join(', ') : param.hint}
            placeholder={param.placeholder}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const renderFunctionCard = (func: TransformAction) => {
    const isSelected = selectedFunction?.function_name === func.function_name;
    const isExpanded = expandedCard === func.function_name;
    const isLoading = loadingFunction === func.function_name || 
                     (isLoadingConfig && selectedFunction?.function_name === func.function_name);
    
    // CORRECTED: Check if configuration exists and is available
    const hasConfiguration = selectedFunctionConfig && 
                            selectedFunctionConfig["JSON Configuration"] && 
                            Array.isArray(selectedFunctionConfig["JSON Configuration"].configuration);
    
    // Check if there are any validation errors for this function
    const hasValidationErrors = Object.keys(formErrors).some(key => 
      formErrors[key].length > 0
    );

    return (
      <Card 
        elevation={isSelected ? 4 : 1}
        sx={{ 
          mb: 2,
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? (hasValidationErrors ? 'error.main' : 'primary.main') : 'grey.300',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Card Header - Clickable for expand/collapse */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              mb: 1,
              cursor: isLoading ? 'default' : 'pointer',
              '&:hover': {
                backgroundColor: isLoading ? 'transparent' : 'action.hover',
              },
              borderRadius: 1,
              p: 1,
              ml: -1,
              mr: -1,
              mt: -1,
            }}
            onClick={() => !isLoading && handleCardHeaderClick(func)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="h3">
                {func.title}
              </Typography>
              {hasValidationErrors && (
                <Tooltip title="This function has validation errors">
                  <ErrorIcon color="error" fontSize="small" />
                </Tooltip>
              )}
              {isLoading && (
                <CircularProgress size={16} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isSelected && !isLoading && (
                <CheckCircleIcon color={hasValidationErrors ? 'error' : 'primary'} />
              )}
              <ExpandMoreIcon 
                sx={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {func.description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {func.helptext}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={`Function: ${func.function_name}`} 
              size="small" 
              variant="outlined" 
            />
            {hasValidationErrors && (
              <Chip 
                label="Validation Errors" 
                size="small" 
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {/* Expanded Configuration Section */}
          {isExpanded && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading configuration...
                  </Typography>
                </Box>
              ) : hasConfiguration ? (
                <>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon color="primary" />
                    Configure {selectedFunctionConfig!["JSON Configuration"].title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedFunctionConfig!["JSON Configuration"].helptext}
                  </Typography>

                  {/* Show overall validation alert if there are errors */}
                  {hasValidationErrors && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Please fix the validation errors below before proceeding.
                    </Alert>
                  )}

                  <Box sx={{ mt: 2 }}>
                    {selectedFunctionConfig!["JSON Configuration"].configuration.map((param: TransformActionParameter) => (
                      <Box key={param.attribute}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2">
                            {param.label}
                            {!param.optional && ' *'}
                          </Typography>
                          {param.tool_tip && (
                            <Tooltip title={param.tool_tip}>
                              <InfoIcon fontSize="small" color="action" />
                            </Tooltip>
                          )}
                        </Box>
                        {renderParameterControl(param)}
                      </Box>
                    ))}
                  </Box>
                </>
              ) : configError ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to load function configuration. Please try again.
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No configuration available for this function.
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render the same table data as shown in TransformTab
  const renderDataTable = () => {
    const records = transformData?.data || [];
    const columns = records.length > 0 ? Object.keys(records[0]) : [];

    if (isLoadingData || isFetchingData) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading data...
          </Typography>
        </Box>
      );
    }

    if (dataError) {
      return (
        <Alert severity="error">
          Failed to load transformation data. Please try again later.
        </Alert>
      );
    }

    if (records.length === 0) {
      return (
        <Alert severity="info">
          No transformation data found for this object.
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {records.length} of {transformData?.total_records || 0} records
          </Typography>
          <Chip 
            label={`Page ${currentPage} of ${transformData?.total_pages || 1}`}
            size="small"
            variant="outlined"
          />
        </Box>

        <TableContainer component={Paper} elevation={1} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                {columns.map((column) => (
                  <TableCell 
                    key={column}
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record: TransformDataRecord, index: number) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={column}
                      sx={{ 
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={record[column]?.toString()}
                    >
                      {record[column]?.toString() || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {transformData && transformData.total_pages > 1 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={transformData.total_records}
            rowsPerPage={pageSize}
            page={currentPage - 1}
            onPageChange={(event, newPage) => setCurrentPage(newPage + 1)}
            onRowsPerPageChange={(event) => {
              const newSize = parseInt(event.target.value, 10);
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            sx={{ mt: 2 }}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        )}
      </Box>
    );
  };

  const modalWidth = 900;

  return (
    <>
      <Modal
        open={open}
        onClose={isTransforming ? undefined : handleClose}
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
                  Data Transformation
                </Typography>
                <Typography variant="body1">
                  Object: <strong>{objectName}</strong>
                </Typography>
                <Typography variant="body2">
                  Apply transformation rules to modify data structure and values
                </Typography>
              </Box>
              <IconButton 
                onClick={isTransforming ? undefined : handleClose} 
                sx={{ color: 'white' }}
                disabled={isTransforming}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Progress Steps */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {renderStepIndicator(0, 'Review Data')}
              <Box sx={{ flex: 1, height: 2, backgroundColor: 'grey.300', mx: 1 }} />
              {renderStepIndicator(1, 'Select Transformation')}
              <Box sx={{ flex: 1, height: 2, backgroundColor: 'grey.300', mx: 1 }} />
              {renderStepIndicator(2, 'Preview & Execute')}
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Review Data" />
              <Tab label="Select Transformation" disabled={activeTab < 1 || isTransforming} />
              <Tab label="Preview & Execute" disabled={activeTab < 2 || isTransforming} />
            </Tabs>

            {/* Tab 1: Review Data */}
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorIcon color="warning" />
                        Data Preview
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Review the current data for <strong>{objectName}</strong> before applying transformations. 
                        This shows the same data as displayed in the main transformation table.
                      </Typography>
                      
                      <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          label={`Total Records: ${transformData?.total_records || 0}`}
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          label={`Current Page: ${currentPage}`}
                          variant="outlined"
                          color="secondary"
                        />
                        <Chip
                          label={`Total Pages: ${transformData?.total_pages || 1}`}
                          variant="outlined"
                        />
                        <Chip
                          label={`Page Size: ${pageSize}`}
                          variant="outlined"
                        />
                      </Box>

                      {renderDataTable()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<BuildIcon />}
                  disabled={isTransforming}
                >
                  Continue to Select Transformation
                </Button>
              </Box>
            </TabPanel>

            {/* Tab 2: Select Transformation */}
            <TabPanel value={activeTab} index={1}>
              {isLoadingActions ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading transformation functions...
                  </Typography>
                </Box>
              ) : actionsError ? (
                <Alert severity="error">
                  Failed to load transformation functions. Please try again later.
                </Alert>
              ) : transformActions.length === 0 ? (
                <Alert severity="info">
                  No transformation functions available.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BuildIcon color="primary" />
                          Available Transformations
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Choose a transformation function to apply to your data. Each function performs specific data modifications.
                        </Typography>
                        
                        {transformActions.map((func) => renderFunctionCard(func))}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={isTransforming}
                >
                  Back to Review Data
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<PreviewIcon />}
                  disabled={!selectedFunction || !selectedFunctionConfig || Object.keys(formErrors).some(key => formErrors[key].length > 0) || isTransforming}
                >
                  Preview & Execute
                </Button>
              </Box>
            </TabPanel>

            {/* Tab 3: Preview & Execute */}
            <TabPanel value={activeTab} index={2}>
              {selectedFunction && selectedFunctionConfig && selectedFunctionConfig["JSON Configuration"] && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PreviewIcon color="primary" />
                          Transformation Summary
                        </Typography>
                        
                        {/* Show validation errors alert if any */}
                        {Object.keys(formErrors).some(key => formErrors[key].length > 0) && (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            Please fix the validation errors before executing the transformation.
                          </Alert>
                        )}

                        {/* Show transformation progress if in progress */}
                        {isTransforming && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="body2" gutterBottom>
                                Transformation in progress: {transformStage} ({transformProgress}%)
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={transformProgress} 
                                sx={{ mt: 1 }}
                              />
                              {transformTaskId && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                  Task ID: {transformTaskId}
                                </Typography>
                              )}
                            </Box>
                          </Alert>
                        )}

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Selected Function
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {selectedFunction.title}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Object
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                              {objectName}
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
                                {selectedFunctionConfig["JSON Configuration"].configuration?.map((param: TransformActionParameter) => (
                                  <TableRow key={param.attribute}>
                                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
                                      {param.label}
                                      {!param.optional && ' *'}
                                    </TableCell>
                                    <TableCell>
                                      {formData[param.attribute]?.toString() || '(Not set)'}
                                      {formErrors[param.attribute] && formErrors[param.attribute].length > 0 && (
                                        <Box sx={{ mt: 0.5 }}>
                                          <Alert severity="error" sx={{ py: 0, fontSize: '0.75rem' }}>
                                            {formErrors[param.attribute].join(', ')}
                                          </Alert>
                                        </Box>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionDetails>
                        </Accordion>

                        {/* Data Preview Table on Third Tab */}
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Data Preview
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            This is how your data currently looks. The transformation will be applied to this data.
                          </Typography>
                          {renderDataTable()}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="warning">
                      This transformation will modify data in the <strong>{objectName}</strong> object. 
                      Review the configuration before executing.
                    </Alert>
                  </Grid>
                </Grid>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={isTransforming}
                >
                  Back to Configuration
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={
                    isTransforming ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  onClick={handleTransform}
                  disabled={Object.keys(formErrors).some(key => formErrors[key].length > 0) || isTransforming}
                >
                  {isTransforming ? `Transforming... (${transformProgress}%)` : 'Execute Transformation'}
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