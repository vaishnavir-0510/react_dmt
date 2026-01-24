import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Button,
  TextField,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, DateRange as DateRangeIcon, Numbers as NumbersIcon, TextFields as TextFieldsIcon, Link as LinkIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetObjectMetadataQuery } from '../../../services/metadataApi';
import { useGetSystemsByProjectQuery } from '../../../services/systemsApi';
import { useGetObjectsBySystemQuery } from '../../../services/objectsApi';
import { useCreateFilterMutation, useApplyFilterMutation, useGetAppliedFiltersQuery, useUpdateFilterMutation, useDeleteFiltersMutation } from '../../../services/filterApi';
import type { MetadataField } from '../../../types';
import type { System } from '../../../types';
import type { ObjectData } from '../../../services/objectsApi';
import type { AppliedFilter } from '../../../services/filterApi';

interface FilterRowsSlideInProps {
  open: boolean;
  onClose: () => void;
  objectId: string;
  rowFilters: {[key: string]: string};
  onRowFiltersChange: (filters: {[key: string]: string}) => void;
  refetch: () => void;
}

type FilterType = 'date' | 'numeric' | 'value' | 'reference';

interface FilterConfig {
  type: FilterType;
  title: string;
  icon: React.ReactNode;
  fields: string[];
}

export const FilterRowsSlideIn: React.FC<FilterRowsSlideInProps> = ({
  open,
  onClose,
  objectId,
  rowFilters,
  onRowFiltersChange,
  refetch,
}) => {
  const { selectedEnvironment } = useSelector((state: RootState) => state.app);
  const [expandedPanel, setExpandedPanel] = useState<FilterType | null>(null);
  const [localFilters, setLocalFilters] = useState<{[key: string]: string}>({});
  const [selectedDateField, setSelectedDateField] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // Numeric filter states
  const [selectedNumericField, setSelectedNumericField] = useState<string>('');
  const [numericMinValue, setNumericMinValue] = useState('');
  const [numericMaxValue, setNumericMaxValue] = useState('');

  // Picklist filter states
  const [selectedPicklistField, setSelectedPicklistField] = useState<string>('');
  const [selectedPicklistValues, setSelectedPicklistValues] = useState<string[]>([]);

  // Reference filter states
  const [selectedReferenceField, setSelectedReferenceField] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedTargetObject, setSelectedTargetObject] = useState<string>('');
  const [selectedTargetField, setSelectedTargetField] = useState<string>('');
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [filtersToDelete, setFiltersToDelete] = useState<Set<string>>(new Set());

  // Fetch metadata for the object
  const {
    data,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useGetObjectMetadataQuery(objectId, {
    skip: !objectId || !open,
  });

  const metadataFields = data || [];

  // Fetch systems for the project
  const {
    data: systemsData,
    isLoading: isLoadingSystems,
    error: systemsError,
  } = useGetSystemsByProjectQuery(selectedEnvironment?.project || '', {
    skip: !selectedEnvironment?.project || !open,
  });

  const systems = systemsData || [];

  // Fetch objects for selected system
  const {
    data: objectsData,
    isLoading: isLoadingObjects,
    error: objectsError,
  } = useGetObjectsBySystemQuery(selectedSystem, {
    skip: !selectedSystem || !open,
  });

  const objects = objectsData || [];

  // Fetch fields for selected object
  const {
    data: fieldsData,
    isLoading: isLoadingFields,
    error: fieldsError,
  } = useGetObjectMetadataQuery(selectedTargetObject, {
    skip: !selectedTargetObject || !open,
  });

  const targetFields = fieldsData || [];

  // Fetch applied filters
  const {
    data: appliedFiltersData,
    isLoading: isLoadingAppliedFilters,
    refetch: refetchAppliedFilters,
  } = useGetAppliedFiltersQuery(objectId, {
    skip: !objectId || !open,
  });

  const appliedFilters = appliedFiltersData || [];

  // Mutations
  const [createFilter] = useCreateFilterMutation();
  const [updateFilter] = useUpdateFilterMutation();
  const [applyFilter] = useApplyFilterMutation();
  const [deleteFilters] = useDeleteFiltersMutation();

  useEffect(() => {
    if (open) {
      setLocalFilters({ ...rowFilters });
      // Reset date fields
      setStartDate('');
      setEndDate('');
      setDateError('');
      // Reset numeric fields
      setNumericError('');
      // Reset reference fields
      setSelectedReferenceField('');
      setSelectedSystem('');
      setSelectedTargetObject('');
      setSelectedTargetField('');
      // Reset editing
      setEditingFilterId(null);
      setFiltersToDelete(new Set());
      // Close all accordions
      setExpandedPanel(null);
      // Refetch data
      refetchAppliedFilters();
    }
  }, [open, rowFilters, refetchAppliedFilters]);

  // Validate date range
   useEffect(() => {
     if (startDate && endDate && startDate > endDate) {
       setDateError('Start date cannot be after end date');
     } else {
       setDateError('');
     }
   }, [startDate, endDate]);

  // Validate numeric range
  const [numericError, setNumericError] = useState('');
  useEffect(() => {
    const min = parseFloat(numericMinValue);
    const max = parseFloat(numericMaxValue);
    if (numericMinValue && numericMaxValue && !isNaN(min) && !isNaN(max) && min > max) {
      setNumericError('Min value cannot be greater than max value');
    } else {
      setNumericError('');
    }
  }, [numericMinValue, numericMaxValue]);

  const handleAccordionChange = (panel: FilterType) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : null);
    if (isExpanded) {
      // Reset states when opening a different accordion
      if (panel === 'date') {
        setStartDate('');
        setEndDate('');
        setDateError('');
        setSelectedDateField('');
      } else if (panel === 'numeric') {
        setSelectedNumericField('');
        setNumericMinValue('');
        setNumericMaxValue('');
        setNumericError('');
      } else if (panel === 'value') {
        setSelectedPicklistField('');
        setSelectedPicklistValues([]);
      } else if (panel === 'reference') {
        setSelectedReferenceField('');
        setSelectedSystem('');
        setSelectedTargetObject('');
        setSelectedTargetField('');
      }
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [column]: value,
    }));
  };

  const validateCurrentFilter = () => {
    if (!expandedPanel) return { valid: false, message: 'Please open a filter type' };
    switch (expandedPanel) {
      case 'date':
        if (!selectedDateField) return { valid: false, message: 'Please select a date field' };
        if (!startDate && !endDate) return { valid: false, message: 'Please select start or end date' };
        if (dateError) return { valid: false, message: dateError };
        break;
      case 'numeric':
        if (!selectedNumericField) return { valid: false, message: 'Please select a numeric field' };
        if (!numericMinValue && !numericMaxValue) return { valid: false, message: 'Please enter min or max value' };
        if (numericError) return { valid: false, message: numericError };
        break;
      case 'value':
        if (!selectedPicklistField) return { valid: false, message: 'Please select a picklist field' };
        if (selectedPicklistValues.length === 0) return { valid: false, message: 'Please select at least one value' };
        break;
      case 'reference':
        if (!selectedReferenceField) return { valid: false, message: 'Please select a reference field' };
        if (!selectedSystem) return { valid: false, message: 'Please select a system' };
        if (!selectedTargetObject) return { valid: false, message: 'Please select a target object' };
        if (!selectedTargetField) return { valid: false, message: 'Please select a target field' };
        break;
    }
    return { valid: true };
  };

  const handleApplyFilters = async () => {
    try {
      // First, handle deletions
      if (filtersToDelete.size > 0) {
        try {
          await deleteFilters(Array.from(filtersToDelete)).unwrap();
          setFiltersToDelete(new Set());
          refetchAppliedFilters(); // Ensure chips update immediately
          setTimeout(() => refetch(), 500); // Refetch table data
        } catch (deleteError) {
          console.error('Delete failed:', deleteError);
          alert('Failed to delete some filters, but continuing with other operations.');
        }
      }

      // Then, handle create/update if accordion is open
      if (expandedPanel) {
        const validation = validateCurrentFilter();
        if (!validation.valid) {
          alert(validation.message);
          return;
        }
      let payload: any = {
        object_id: objectId,
      };

      switch (expandedPanel) {
        case 'date':
          payload = {
            ...payload,
            type: 'date',
            field: selectedDateField,
            from_date: startDate || null,
            to_date: endDate || null,
          };
          break;
        case 'numeric':
          payload = {
            ...payload,
            type: 'numeric',
            field: selectedNumericField,
            from_range: numericMinValue || null,
            to_range: numericMaxValue || null,
          };
          break;
        case 'value':
          payload = {
            ...payload,
            type: 'values',
            field: selectedPicklistField,
            values: selectedPicklistValues,
          };
          break;
        case 'reference':
          payload = {
            ...payload,
            type: 'reference',
            field: selectedReferenceField,
            ref_field: selectedTargetField,
            ref_obj_id: selectedTargetObject,
            ref_type: selectedSystem,
          };
          break;
      }

      // Call create or update filter
      if (editingFilterId) {
        await updateFilter({ filterId: editingFilterId, payload }).unwrap();
      } else {
        await createFilter(payload).unwrap();
      }

      // Call apply filter
      await applyFilter({ object_id: objectId }).unwrap();

      // Refetch table data
      setTimeout(() => refetch(), 500); // Delay to ensure backend processing

      // Close accordion and clear fields
      setExpandedPanel(null);
      setEditingFilterId(null);
      // Reset fields based on type
      if (expandedPanel === 'date') {
        setSelectedDateField('');
        setStartDate('');
        setEndDate('');
      } else if (expandedPanel === 'numeric') {
        setSelectedNumericField('');
        setNumericMinValue('');
        setNumericMaxValue('');
      } else if (expandedPanel === 'value') {
        setSelectedPicklistField('');
        setSelectedPicklistValues([]);
      } else if (expandedPanel === 'reference') {
        setSelectedReferenceField('');
        setSelectedSystem('');
        setSelectedTargetObject('');
        setSelectedTargetField('');
      }
    }

  } catch (error) {
      console.error('Error applying filter:', error);
      alert('Failed to apply filter. Please try again.');
    }
  };

  const handleClearAll = () => {
    setLocalFilters({});
  };

  const activeFilters = Object.keys(localFilters).filter(key => localFilters[key].trim() !== '');

  const handleEditFilter = (filter: AppliedFilter) => {
    setEditingFilterId(filter.dmt_filter);
    const panelType = filter.type === 'values' ? 'value' : filter.type as FilterType;
    setExpandedPanel(panelType);

    // Populate fields based on filter type
    if (filter.type === 'date') {
      setSelectedDateField(filter.field);
      setStartDate(filter.from_date || '');
      setEndDate(filter.to_date || '');
    } else if (filter.type === 'numeric') {
      setSelectedNumericField(filter.field);
      setNumericMinValue(filter.from_range || '');
      setNumericMaxValue(filter.to_range || '');
    } else if (filter.type === 'values') {
      setSelectedPicklistField(filter.field);
      setSelectedPicklistValues(filter.values ? filter.values.split(',') : []);
    } else if (filter.type === 'reference') {
      setSelectedReferenceField(filter.field);
      setSelectedSystem(filter.ref_type || '');
      setSelectedTargetObject(filter.ref_obj_id || '');
      setSelectedTargetField(filter.ref_field || '');
    }
  };

  const handleToggleDeleteFilter = (filterId: string) => {
    setFiltersToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterId)) {
        newSet.delete(filterId);
      } else {
        newSet.add(filterId);
      }
      return newSet;
    });
  };

  // Filter metadata fields that are date-related based on exact condition
  const getDateFields = () => {
    console.log('All metadata fields:', metadataFields);
    console.log('Fields with is_datetime or is_date:', metadataFields.filter((field: MetadataField) => {
      console.log(`Field: ${field.name}, is_datetime: ${field.is_datetime}, is_date: ${field.is_date}`);
      return field.is_datetime === 'true' || field.is_date === 'true';
    }));
    return metadataFields.filter((field: MetadataField) =>
      field.is_datetime === 'true' || field.is_date === 'true'
    );
  };

  // Filter metadata fields that are numeric-related
  const getNumericFields = () => {
    return metadataFields.filter((field: MetadataField) =>
      field.is_integer === 'true' || field.is_float === 'true'
    );
  };

  // Filter metadata fields that are picklist-related
  const getPicklistFields = () => {
    return metadataFields.filter((field: MetadataField) =>
      field.is_picklist === 'true'
    );
  };

  // Filter metadata fields that are reference-related
  const getReferenceFields = () => {
    return metadataFields.filter((field: MetadataField) =>
      field.is_fk === 'true' || field.is_reference === 'true'
    );
  };

  const dateFields = getDateFields();
  const numericFields = getNumericFields();
  const picklistFields = getPicklistFields();
  const referenceFields = getReferenceFields();
  
  // Sort all fields alphabetically
  dateFields.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));
  numericFields.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));
  picklistFields.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));
  referenceFields.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));

  const allFieldNames = metadataFields.map((field: MetadataField) => field.name);

  // Helper function to get picklist values for a field
  const getPicklistValues = (fieldName: string) => {
    const field = metadataFields.find(f => f.name === fieldName);
    if (field?.picklist_values) {
      return Object.keys(field.picklist_values);
    }
    return [];
  };


  const filterConfigs: FilterConfig[] = [
    {
      type: 'date',
      title: 'Filter by Date',
      icon: <DateRangeIcon />,
      fields: selectedDateField ? [selectedDateField] : [],
    },
    {
      type: 'numeric',
      title: 'Filter by Numeric Range',
      icon: <NumbersIcon />,
      fields: selectedNumericField ? [selectedNumericField] : [],
    },
    {
      type: 'value',
      title: 'Filter by Value',
      icon: <TextFieldsIcon />,
      fields: selectedPicklistField ? [selectedPicklistField] : [],
    },
    {
      type: 'reference',
      title: 'Filter by Reference',
      icon: <LinkIcon />,
      fields: selectedReferenceField ? [selectedReferenceField] : [],
    },
  ];

  const modalWidth = 500;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        zIndex: (theme) => theme.zIndex.modal,
        p: 0, // Remove modal padding
      }}
    >
      <Paper
        sx={{
          width: modalWidth,
          height: '100vh',
          m: 0, // Remove all margins
          p: 0, // Remove all padding
          borderRadius: 0,
          overflow: 'auto',
          boxShadow: 24,
        }}
      >
        <Box sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
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
              Filter Rows
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Applied Filters Section */}
          <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Applied Filters
            </Typography>
            {activeFilters.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {activeFilters.map((column) => (
                  <Chip
                    key={column}
                    label={`${column}: ${localFilters[column]}`}
                    onDelete={() => {
                      setLocalFilters(prev => {
                        const newFilters = { ...prev };
                        delete newFilters[column];
                        return newFilters;
                      });
                    }}
                    size="small"
                    sx={{ backgroundColor: 'grey.200', color: 'black' }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'grey.600' }}>
                No filters applied
              </Typography>
            )}
           </Box>

           {/* Applied Filters from API */}
           <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderBottom: '1px solid #e0e0e0' }}>
             <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
               Applied Filters
             </Typography>
             {appliedFilters.length > 0 ? (
               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                 {appliedFilters.map((filter: AppliedFilter) => (
                   <Box key={filter.dmt_filter} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                     <Chip
                       label={`${filter.field}: ${filter.type === 'values' ? (filter.values || '') : filter.type === 'date' ? `${filter.from_date || ''}-${filter.to_date || ''}` : filter.type === 'numeric' ? `${filter.from_range || ''}-${filter.to_range || ''}` : filter.ref_field || ''}`}
                       variant="filled"
                       sx={{
                         backgroundColor: filtersToDelete.has(filter.dmt_filter) ? '#d32f2f' : '#1976d2',
                         color: 'white'
                       }}
                     />
                     <IconButton
                       size="small"
                       onClick={() => handleEditFilter(filter)}
                       sx={{ color: '#1976d2' }}
                     >
                       <EditIcon />
                     </IconButton>
                     <IconButton
                       size="small"
                       onClick={() => handleToggleDeleteFilter(filter.dmt_filter)}
                       sx={{ color: filtersToDelete.has(filter.dmt_filter) ? '#d32f2f' : '#1976d2' }}
                     >
                       <DeleteIcon />
                     </IconButton>
                   </Box>
                 ))}
               </Box>
             ) : (
               <Typography variant="body2" sx={{ color: 'grey.600' }}>
                 No filters applied
               </Typography>
             )}
           </Box>

           {/* Loading State */}
          {isLoadingMetadata && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading metadata fields...</Typography>
            </Box>
          )}

          {/* Error State */}
          {metadataError && (
            <Box sx={{ p: 3 }}>
              <Typography color="error">Failed to load metadata fields</Typography>
            </Box>
          )}

          {/* Filter Cards */}
          {!isLoadingMetadata && !metadataError && (
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
              {filterConfigs.map((config, index) => (
              <Card
                key={config.type}
                sx={{
                  mb: index < filterConfigs.length - 1 ? 2 : 0,
                  backgroundColor: 'grey.100',
                  border: '1px solid',
                  borderColor: 'grey.300',
                }}
              >
                <Accordion
                  expanded={expandedPanel === config.type}
                  onChange={handleAccordionChange(config.type)}
                  sx={{
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    backgroundColor: 'transparent',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 1,
                      },
                      px: 2,
                      py: 1,
                    }}
                  >
                    {config.icon}
                    <Typography variant="h6" sx={{ color: 'grey.800' }}>
                      {config.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pb: 2 }}>
                    {config.type === 'date' ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Date Field</InputLabel>
                            <Select
                              value={selectedDateField}
                              label="Select Date Field"
                              onChange={(e) => setSelectedDateField(e.target.value)}
                            >
                              <MenuItem value="">
                                <em>Select a date field</em>
                              </MenuItem>
                              {dateFields.map((field, index) => (
                                <MenuItem key={field.name || field.field_id || `date-field-${index}`} value={field.name}>
                                  {field.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {selectedDateField && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                size="small"
                                error={!!dateError}
                                helperText={dateError}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                  }
                                }}
                              />
                            </Grid>
                          </>
                        )}
                      </Grid>
                    ) : config.type === 'numeric' ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Numeric Field</InputLabel>
                            <Select
                              value={selectedNumericField}
                              label="Select Numeric Field"
                              onChange={(e) => setSelectedNumericField(e.target.value)}
                            >
                              <MenuItem value="">
                                <em>Select a numeric field</em>
                              </MenuItem>
                              {numericFields.map((field, index) => (
                                <MenuItem key={field.name || field.field_id || `numeric-field-${index}`} value={field.name}>
                                  {field.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {selectedNumericField && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Min Value"
                                type="number"
                                value={numericMinValue}
                                onChange={(e) => setNumericMinValue(e.target.value)}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Max Value"
                                type="number"
                                value={numericMaxValue}
                                onChange={(e) => setNumericMaxValue(e.target.value)}
                                size="small"
                                error={!!numericError}
                                helperText={numericError}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                  }
                                }}
                              />
                            </Grid>
                          </>
                        )}
                      </Grid>
                    ) : config.type === 'value' ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Picklist Field</InputLabel>
                            <Select
                              value={selectedPicklistField}
                              label="Select Picklist Field"
                              onChange={(e) => setSelectedPicklistField(e.target.value)}
                            >
                              <MenuItem value="">
                                <em>Select a picklist field</em>
                              </MenuItem>
                              {picklistFields.map((field, index) => (
                                <MenuItem key={field.name || field.field_id || `picklist-field-${index}`} value={field.name}>
                                  {field.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {selectedPicklistField && (
                          <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Select Values</InputLabel>
                              <Select
                                multiple
                                value={selectedPicklistValues}
                                label="Select Values"
                                onChange={(e) => setSelectedPicklistValues(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                renderValue={(selected) => selected.join(', ')}
                              >
                                {getPicklistValues(selectedPicklistField).map((value) => (
                                  <MenuItem key={value} value={value}>
                                    <Checkbox checked={selectedPicklistValues.indexOf(value) > -1} />
                                    <ListItemText primary={value} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        )}
                      </Grid>
                    ) : config.type === 'reference' ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Reference Field</InputLabel>
                            <Select
                              value={selectedReferenceField}
                              label="Select Reference Field"
                              onChange={(e) => {
                                setSelectedReferenceField(e.target.value);
                                setSelectedSystem(''); // Reset dependent selects
                                setSelectedTargetObject('');
                                setSelectedTargetField('');
                              }}
                            >
                              <MenuItem value="">
                                <em>Select a reference field</em>
                              </MenuItem>
                              {metadataFields.map((field: MetadataField, index) => (
                                <MenuItem key={field.name || field.field_id || `reference-field-${index}`} value={field.name}>
                                  {field.label || field.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>System</InputLabel>
                            <Select
                              value={selectedSystem}
                              label="System"
                              onChange={(e) => {
                                setSelectedSystem(e.target.value);
                                setSelectedTargetObject(''); // Reset dependent selects
                                setSelectedTargetField('');
                              }}
                              disabled={!selectedReferenceField || isLoadingSystems}
                            >
                              <MenuItem value="">
                                <em>Select system</em>
                              </MenuItem>
                              {systems.map((system: System) => (
                                <MenuItem key={system.id} value={system.id}>
                                  {system.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Target Object</InputLabel>
                            <Select
                              value={selectedTargetObject}
                              label="Target Object"
                              onChange={(e) => {
                                setSelectedTargetObject(e.target.value);
                                setSelectedTargetField(''); // Reset dependent select
                              }}
                              disabled={!selectedSystem || isLoadingObjects}
                            >
                              <MenuItem value="">
                                <em>Select target object</em>
                              </MenuItem>
                              {objects.map((object: ObjectData) => (
                                <MenuItem key={object.object_id} value={object.object_id}>
                                  {object.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Target Field</InputLabel>
                            <Select
                              value={selectedTargetField}
                              label="Target Field"
                              onChange={(e) => setSelectedTargetField(e.target.value)}
                              disabled={!selectedTargetObject || isLoadingFields}
                            >
                              <MenuItem value="">
                                <em>Select target field</em>
                              </MenuItem>
                              {targetFields.map((field: MetadataField) => (
                                <MenuItem key={field.field_id || field.name} value={field.name}>
                                  {field.label || field.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    ) : null}
                  </AccordionDetails>
                </Accordion>
              </Card>
              ))}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};