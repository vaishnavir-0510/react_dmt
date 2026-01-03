// components/metadata/MetadataEditorSlideIn.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Switch,
  FormControlLabel,
  Grid,
  Snackbar,
  Tooltip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  InfoOutlined as InfoOutlinedIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Place as PlaceIcon,
  Source as SourceIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { MetadataField } from '../../types';
import { metadataConfig, getSectionsForTab } from './metadataConfig';
import { useGetOntologyMappingsQuery, useUpdateOntologyMappingMutation } from '../../services/metadataApi';

interface MetadataEditorSlideInProps {
  open: boolean;
  onClose: () => void;
  field: MetadataField | null;
  onSave: (fieldData: any, modifiedFields: Record<string, any>) => void;
  isLoading?: boolean;
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
      id={`metadata-tabpanel-${index}`}
      aria-labelledby={`metadata-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Define comprehensive options for common dropdown fields
const DROPDOWN_OPTIONS: Record<string, string[]> = {
  datatype: [
    'string', 'boolean', 'numeric', 'date', 'time', 'datetime', 
    'timestamp', 'text', 'decimal', 'float', 'double', 'varchar', 
    'char', 'json', 'array', 'object', 'Imported', 'mixed'
  ],
  text_case: ['upper', 'lower', 'sentence', 'title', 'mixed'],
  timezone: ['IST', 'UTC', 'EST', 'PST', 'GMT', 'Imported'],
  currency_code: ['USD', 'EUR', 'INR', 'Imported'],
  field_source: ['Database', 'File', 'API', 'Imported', 'mixed'],
  permission: ['Public', 'Internal', 'Confidential', 'Restricted', 'Imported'],
  security_class: [
    'Public', 'Internal Business', 'Confidential Business', 
    'PII', 'Sensitive PII', 'PHI', 'Imported'
  ],
  mask: [
    'None', 'Full', 'Mask Last 4', 'Mask First 4', 
    'Redact Email', 'Hash (SHA-256)', 'Imported'
  ],
  duration_unit: ['ss', 'nn', 'hh', 'dd', 'mm', 'ww', 'yy', 'Imported'],
  text_encoding: ['UTF-8', 'ASCII', 'ISO-8859-1', 'Imported']
};

// Section icons mapping
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Data Type and Structure': <StorageIcon />,
  'Date and Time Management': <ScheduleIcon />,
  'General Information': <InfoOutlinedIcon />,
  'Identification and Key Relationships': <LinkIcon />,
  'Validation and Formatting': <CheckCircleIcon />,
  'Geographical and Contact Information': <PlaceIcon />,
  'Data Source and Migration': <SourceIcon />,
};

export const MetadataEditorSlideIn: React.FC<MetadataEditorSlideInProps> = ({
  open,
  onClose,
  field,
  onSave,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Record<string, any>>({});
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [currentDataType, setCurrentDataType] = useState<string>('string');
  const [pendingDataTypeChange, setPendingDataTypeChange] = useState<string | null>(null);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const { selectedProject } = useSelector((state: RootState) => state.app);

  // Ontology hooks
  const { data: ontologyMappings } = useGetOntologyMappingsQuery(field?.object_id || '', {
    skip: !field?.object_id,
  });
  const [updateOntologyMapping] = useUpdateOntologyMappingMutation();

  // Initialize form data when field changes or modal opens
  useEffect(() => {
    if (open && field) {
      const initialData: Record<string, any> = {};
      const fieldDataType = field.datatype || 'string';
      
      // Initialize all configurable fields from metadataConfig
      Object.values(metadataConfig).forEach(config => {
        if (!config.hidden) {
          const fieldValue = field[config.name];
          initialData[config.name] = fieldValue !== undefined && fieldValue !== null 
            ? fieldValue 
            : config.default_value !== undefined 
              ? config.default_value 
              : '';
        }
      });
      
      setFormData(initialData);
      setOriginalData(initialData);
      setCurrentDataType(fieldDataType);
      setErrors({});
      setEditingField(null);
      setModifiedFields({});
      setPendingDataTypeChange(null);
    }
  }, [open, field]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setEditingField(null);
  };

  const getDropdownOptions = (config: any, currentValue: any): string[] => {
    if (DROPDOWN_OPTIONS[config.name]) {
      return DROPDOWN_OPTIONS[config.name];
    }
    
    if (Array.isArray(config.values_list) && config.values_list.length > 0) {
      return config.values_list;
    }
    
    if (currentValue && !Array.isArray(currentValue)) {
      return [currentValue.toString()];
    }
    
    return [];
  };

  const handleInputChange = (fieldName: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const value = event.target.value;
    const newFormData = {
      ...formData,
      [fieldName]: value,
    };

    setFormData(newFormData);

    if (originalData[fieldName] !== value) {
      setModifiedFields(prev => ({
        ...prev,
        [fieldName]: value,
      }));
    } else {
      setModifiedFields(prev => {
        const newModified = { ...prev };
        delete newModified[fieldName];
        return newModified;
      });
    }

    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }

    if (fieldName === 'datatype') {
      setPendingDataTypeChange(value);
    }
  };

  const resetDependentFields = (newDataType: string, currentFormData: Record<string, any>) => {
    const dependentFields = ['length', 'precision', 'scale', 'max_length', 'min_length', 'float_precision'];
    const updatedFormData = { ...currentFormData };
    const updatedModified = { ...modifiedFields };
    
    dependentFields.forEach(fieldName => {
      if (updatedFormData[fieldName] !== undefined) {
        updatedFormData[fieldName] = '';
        delete updatedModified[fieldName];
      }
    });
    
    setFormData(updatedFormData);
    setModifiedFields(updatedModified);
  };

  const handleSwitchChange = (fieldName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked;
    const newFormData = {
      ...formData,
      [fieldName]: value,
    };

    setFormData(newFormData);

    if (originalData[fieldName] !== value) {
      setModifiedFields(prev => ({
        ...prev,
        [fieldName]: value,
      }));
    } else {
      setModifiedFields(prev => {
        const newModified = { ...prev };
        delete newModified[fieldName];
        return newModified;
      });
    }
  };

  const handleEditStart = (fieldName: string) => {
    setEditingField(fieldName);
  };

  const handleEditCancel = (fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: originalData[fieldName]
    }));
    
    setModifiedFields(prev => {
      const newModified = { ...prev };
      delete newModified[fieldName];
      return newModified;
    });
    
    setEditingField(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    if (fieldName === 'datatype') {
      setPendingDataTypeChange(null);
    }
  };

  const validateField = (fieldName: string, value: any, config: any): string => {
    if (config.is_required && (!value && value !== false && value !== 0)) {
      return `${config.label} is required`;
    }

    if (config.data_type === 'Integer' || config.data_type === 'Float') {
      if (value && value !== '') {
        if (isNaN(Number(value))) {
          return `${config.label} must be a valid number`;
        }
        
        const numValue = Number(value);
        
        if (config.name === 'min_length' || config.name === 'min_value') {
          if (numValue < 0) {
            return `${config.label} must be greater than or equal to 0`;
          }
        }
        
        if (config.name === 'max_length' && formData.min_length) {
          const minLength = Number(formData.min_length);
          if (numValue < minLength) {
            return `${config.label} must be greater than or equal to Minimum Length`;
          }
        }
      }
    }

    return '';
  };

  const handleFieldSave = (fieldName: string, config: any) => {
    const value = formData[fieldName];
    const error = validateField(fieldName, value, config);
    
    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error,
      }));
      return;
    }

    if (fieldName === 'datatype' && pendingDataTypeChange) {
      resetDependentFields(value, formData);
      setCurrentDataType(value);
      setPendingDataTypeChange(null);
    }

    const fieldPayload = {
      [fieldName]: value
    };
    
    onSave({
      ...field,
      ...formData,
    }, fieldPayload);
    
    setEditingField(null);
    setShowSaveSuccess(true);
    setOriginalData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    setModifiedFields(prev => {
      const newModified = { ...prev };
      delete newModified[fieldName];
      return newModified;
    });
  };

  const handleSaveAll = () => {
    if (pendingDataTypeChange) {
      resetDependentFields(pendingDataTypeChange, formData);
      setCurrentDataType(pendingDataTypeChange);
      setPendingDataTypeChange(null);
    }

    onSave({
      ...field,
      ...formData,
    }, modifiedFields);

    setShowSaveSuccess(true);
    setOriginalData(formData);
    setModifiedFields({});
    setEditingField(null);
  };

  const handleAcceptOntology = async (mapping: any) => {
    try {
      await updateOntologyMapping({
        mappingId: mapping.id,
        updates: { ontology_term_status: 'true', ontological_term_description_status: 'true' }
      }).unwrap();
    } catch (error) {
      console.error('Failed to accept ontology:', error);
    }
  };

  const handleRejectOntology = (mapping: any) => {
    setRejectionMode(true);
  };

  const handleFeedbackAccept = async (mapping: any) => {
    try {
      await updateOntologyMapping({
        mappingId: mapping.id,
        updates: {
          ontology_term_status: 'false',
          ontological_term_description_status: 'false',
          ontology_term_user_feedback: feedbackText
        }
      }).unwrap();
      setRejectionMode(false);
      setFeedbackText('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleFeedbackCancel = () => {
    setRejectionMode(false);
    setFeedbackText('');
  };

  const getFieldConfigsBySection = (section: string, tab: 'General' | 'Analytical') => {
    const effectiveDataType = pendingDataTypeChange || currentDataType;
    
    return Object.values(metadataConfig).filter(config => 
      config.ui_section === section && 
      config.ui_tab === tab &&
      !config.hidden &&
      (config.applicable_for_dt.includes('all') || config.applicable_for_dt.includes(effectiveDataType))
    ).sort((a, b) => (a.priority || 999) - (b.priority || 999));
  };

  const renderFieldControl = (config: any) => {
    const value = formData[config.name] !== undefined ? formData[config.name] : (config.default_value || '');
    const error = errors[config.name];
    const isModified = modifiedFields[config.name] !== undefined;
    const isEditing = editingField === config.name;
    const isEditable = config.permission === 'W' && (isEditing || activeTab === 1);

    const showDataTypeWarning = pendingDataTypeChange && 
      config.name !== 'datatype' && 
      !config.applicable_for_dt.includes('all') && 
      !config.applicable_for_dt.includes(pendingDataTypeChange);

    switch (config.ui_control) {
      case 'Dropdown':
        const options = getDropdownOptions(config, value);
        const hasCurrentValue = value && value !== '';
        const isValueInOptions = options.includes(value);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '180px' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {config.label}
                {config.tooltip && (
                  <Tooltip title={config.tooltip}>
                    <InfoIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.secondary', verticalAlign: 'middle' }} />
                  </Tooltip>
                )}
              </Typography>
            </Box>
            <FormControl 
              size="small" 
              error={!!error}
              disabled={!isEditable}
              sx={{ minWidth: 250, flexGrow: 1 }}
            >
              <Select
                value={value}
                onChange={handleInputChange(config.name)}
                displayEmpty
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="">
                  <em>Select an option</em>
                </MenuItem>
                {hasCurrentValue && !isValueInOptions && (
                  <MenuItem key={value} value={value}>
                    {value} (Current)
                  </MenuItem>
                )}
                {options.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {config.permission === 'W' && activeTab === 0 && (
              <>
                {!isEditing ? (
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditStart(config.name)}
                    sx={{ color: '#1976d2' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={() => handleFieldSave(config.name, config)}
                      sx={{ color: '#4caf50' }}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : <CheckIcon fontSize="small" />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditCancel(config.name)}
                      sx={{ color: '#f44336' }}
                      disabled={isLoading}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        );

      case 'Checkbox':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '180px' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {config.label}
                {config.tooltip && (
                  <Tooltip title={config.tooltip}>
                    <InfoIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.secondary', verticalAlign: 'middle' }} />
                  </Tooltip>
                )}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => handleSwitchChange(config.name)({ target: { checked: e.target.checked } } as any)}
                disabled={!isEditable}
                className="metadata-checkbox"
                title={config.label}
                placeholder={config.label}
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {value ? config.name : ''}
              </Typography>
            </Box>
            {config.permission === 'W' && activeTab === 0 && (
              <>
                {!isEditing ? (
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditStart(config.name)}
                    sx={{ color: '#1976d2' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={() => handleFieldSave(config.name, config)}
                      sx={{ color: '#4caf50' }}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : <CheckIcon fontSize="small" />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditCancel(config.name)}
                      sx={{ color: '#f44336' }}
                      disabled={isLoading}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        );

      case 'TextArea':
        return (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '180px', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {config.label}
                {config.tooltip && (
                  <Tooltip title={config.tooltip}>
                    <InfoIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.secondary', verticalAlign: 'middle' }} />
                  </Tooltip>
                )}
              </Typography>
            </Box>
            <TextField
              size="small"
              value={value}
              onChange={handleInputChange(config.name)}
              error={!!error}
              helperText={error}
              disabled={!isEditable}
              multiline
              rows={3}
              sx={{ minWidth: 250, flexGrow: 1, bgcolor: 'background.paper' }}
            />
            {config.permission === 'W' && activeTab === 0 && (
              <>
                {!isEditing ? (
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditStart(config.name)}
                    sx={{ color: '#1976d2', mt: 1 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={() => handleFieldSave(config.name, config)}
                      sx={{ color: '#4caf50', mt: 1 }}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : <CheckIcon fontSize="small" />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditCancel(config.name)}
                      sx={{ color: '#f44336', mt: 1 }}
                      disabled={isLoading}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        );

      case 'Textbox':
      default:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '180px' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {config.label}
                {config.tooltip && (
                  <Tooltip title={config.tooltip}>
                    <InfoIcon sx={{ fontSize: 16, ml: 0.5, color: 'text.secondary', verticalAlign: 'middle' }} />
                  </Tooltip>
                )}
              </Typography>
            </Box>
            <TextField
              size="small"
              value={value}
              onChange={handleInputChange(config.name)}
              error={!!error}
              helperText={error}
              disabled={!isEditable}
              type={config.data_type === 'Integer' || config.data_type === 'Float' ? 'number' : 'text'}
              sx={{ minWidth: 250, flexGrow: 1, bgcolor: 'background.paper' }}
            />
            {config.permission === 'W' && activeTab === 0 && (
              <>
                {!isEditing ? (
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditStart(config.name)}
                    sx={{ color: '#1976d2' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <>
                    <IconButton 
                      size="small" 
                      onClick={() => handleFieldSave(config.name, config)}
                      sx={{ color: '#4caf50' }}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={20} /> : <CheckIcon fontSize="small" />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditCancel(config.name)}
                      sx={{ color: '#f44336' }}
                      disabled={isLoading}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        );
    }
  };

  const renderSection = (section: string, tab: 'General' | 'Analytical') => {
    const fields = getFieldConfigsBySection(section, tab);
    
    if (fields.length === 0) return null;

    return (
      <Box 
        key={section}
        sx={{ 
          border: '1px solid #e0e0e0',
          mb: 2,
          bgcolor: 'white'
        }}
      >
        <Box
          sx={{ 
            bgcolor: '#f5f5f5',
            p: 2,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {SECTION_ICONS[section] || <InfoOutlinedIcon />}
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {section}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          {fields.map((config) => (
            <Box key={config.name}>
              {renderFieldControl(config)}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  if (!field) return null;

  const ontologyMapping = ontologyMappings?.find(m => m.original_field_name === field.name);

  const generalSections = getSectionsForTab('General', currentDataType);
  const analyticalSections = getSectionsForTab('Analytical', currentDataType);
  const hasModifications = Object.keys(modifiedFields).length > 0;
  const modalWidth = 750;

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
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Blue Header */}
          <Box sx={{ 
            bgcolor: '#1565c0',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Edit Metadata for column - {field.name}
            </Typography>
            <IconButton onClick={onClose} disabled={isLoading} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* AI Ontology Suggestion */}
          {ontologyMapping && (
            <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToyIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    AI Ontology Suggestion
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {ontologyMapping.ontology_term_status === 'true' && (
                    <Chip
                      label="AI description accepted successfully"
                      size="small"
                      sx={{
                        bgcolor: '#4caf50',
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  )}
                  {!rejectionMode && ontologyMapping.ontology_term_status !== 'true' && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAcceptOntology(ontologyMapping)}
                        sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleRejectOntology(ontologyMapping)}
                        sx={{ color: '#f44336', borderColor: '#f44336' }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {rejectionMode && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleFeedbackAccept(ontologyMapping)}
                        disabled={!feedbackText.trim()}
                        sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                      >
                        Submit Feedback
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleFeedbackCancel}
                        sx={{ color: '#f44336', borderColor: '#f44336' }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
              {!rejectionMode ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Ontology Term:</strong> {ontologyMapping.ontology_term}
                  </Typography>
                  <Box sx={{ bgcolor: '#fff9c4', p: 1, borderRadius: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Ontology Description:</strong> {ontologyMapping.ontological_term_description}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Please provide feedback for rejecting this ontology suggestion:</strong>
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Explain why you rejected this suggestion..."
                    sx={{ mb: 1 }}
                  />
                </Box>
              )}
            </Box>
          )}

          <Typography variant="body2" sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
            Use this window to view and modify the metadata associated with the selected data column.
          </Typography>

          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              TabIndicatorProps={{
                style: { backgroundColor: '#1565c0', height: 3 }
              }}
            >
              <Tab 
                label="General" 
                sx={{ 
                  fontWeight: 600,
                  color: activeTab === 0 ? '#1565c0' : 'text.primary',
                  '&.Mui-selected': { color: '#1565c0' }
                }}
              />
              <Tab 
                label="Analytical" 
                sx={{ 
                  fontWeight: 600,
                  color: activeTab === 1 ? '#1565c0' : 'text.primary',
                  '&.Mui-selected': { color: '#1565c0' }
                }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#fafafa' }}>
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 2 }}>
                {generalSections.map(section => 
                  renderSection(section, 'General')
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 2 }}>
                {analyticalSections.map(section => 
                  renderSection(section, 'Analytical')
                )}
              </Box>
            </TabPanel>
          </Box>
        </Paper>
      </Modal>

      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSaveSuccess(false)}
        message="Field metadata updated successfully!"
      />
    </>
  );
};