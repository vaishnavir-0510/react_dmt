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
} from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, DateRange as DateRangeIcon, Numbers as NumbersIcon, TextFields as TextFieldsIcon, Link as LinkIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetObjectMetadataQuery } from '../../../services/metadataApi';
import type { MetadataField } from '../../../types';

interface FilterRowsSlideInProps {
  open: boolean;
  onClose: () => void;
  objectId: string;
  rowFilters: {[key: string]: string};
  onRowFiltersChange: (filters: {[key: string]: string}) => void;
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
}) => {
  const [expandedPanel, setExpandedPanel] = useState<FilterType | null>(null);
  const [localFilters, setLocalFilters] = useState<{[key: string]: string}>({});
  const [selectedDateField, setSelectedDateField] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // Fetch metadata for the object
  const {
    data,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useGetObjectMetadataQuery(objectId, {
    skip: !objectId || !open,
  });

  const metadataFields = data || [];

  useEffect(() => {
    if (open) {
      setLocalFilters({ ...rowFilters });
      // Reset date fields
      setStartDate('');
      setEndDate('');
      setDateError('');
    }
  }, [open, rowFilters]);

  // Validate date range
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Start date cannot be after end date');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const handleAccordionChange = (panel: FilterType) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const handleFilterChange = (column: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleApplyFilters = () => {
    const filters = { ...localFilters };
    if (selectedDateField && (startDate || endDate)) {
      filters[selectedDateField] = `${startDate}-${endDate}`;
    }
    onRowFiltersChange(filters);
    onClose();
  };

  const handleClearAll = () => {
    setLocalFilters({});
  };

  const activeFilters = Object.keys(localFilters).filter(key => localFilters[key].trim() !== '');

  // Filter metadata fields that are likely date-related
  const getDateFields = () => {
    return metadataFields.filter((field: MetadataField) =>
      field.name.toLowerCase().includes('date') ||
      field.name.toLowerCase().includes('time') ||
      field.name.toLowerCase().includes('created') ||
      field.name.toLowerCase().includes('modified') ||
      field.name.toLowerCase().includes('updated') ||
      field.name.toLowerCase().includes('timestamp') ||
      field.datatype?.toLowerCase().includes('date') ||
      field.datatype?.toLowerCase().includes('time') ||
      field.is_date === 'true' ||
      field.is_datetime === 'true' ||
      field.is_time === 'true'
    );
  };

  const dateFields = getDateFields();
  dateFields.sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));
  const allFieldNames = metadataFields.map((field: MetadataField) => field.name);

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
      fields: allFieldNames, // You might want to filter only numeric columns
    },
    {
      type: 'value',
      title: 'Filter by Value',
      icon: <TextFieldsIcon />,
      fields: allFieldNames,
    },
    {
      type: 'reference',
      title: 'Filter by Reference',
      icon: <LinkIcon />,
      fields: allFieldNames, // You might want to filter only reference columns
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
                    ) : (
                      <Grid container spacing={2}>
                        {config.fields.map((column) => (
                          <Grid item xs={12} key={column}>
                            <TextField
                              fullWidth
                              label={`Filter ${column}`}
                              value={localFilters[column] || ''}
                              onChange={(e) => handleFilterChange(column, e.target.value)}
                              placeholder={`Enter value to filter ${column}...`}
                              size="small"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'white',
                                }
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
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