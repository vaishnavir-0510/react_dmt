import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, DateRange as DateRangeIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { useGetMetadataFieldsQuery, useGetPicklistValuesQuery } from '../../services/objectsApi';

const BackupType: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedObject } = useSelector((state: RootState) => state.migration);

  // Get selected backup object from localStorage (set by object selection)
  const [selectedBackupObject, setSelectedBackupObject] = useState<any>(null);

  const [backupType, setBackupType] = useState('full');
  const [conditionalType, setConditionalType] = useState('date');

  // Date backup fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDateField, setSelectedDateField] = useState('');

  // Numeric range fields
  const [startRange, setStartRange] = useState('');
  const [endRange, setEndRange] = useState('');
  const [selectedNumericField, setSelectedNumericField] = useState('');

  // Value backup fields
  const [selectedPicklistField, setSelectedPicklistField] = useState('');
  const [selectedPicklistValue, setSelectedPicklistValue] = useState('');

  // Incremental backup fields
  const [incrementalCompareField, setIncrementalCompareField] = useState('');
  const [incrementalStartDate, setIncrementalStartDate] = useState('');

  // Load selected backup object and configuration from localStorage
  useEffect(() => {
    const storedObject = localStorage.getItem('selectedBackupObject');
    if (storedObject) {
      try {
        const parsed = JSON.parse(storedObject);
        setSelectedBackupObject(parsed);
      } catch (error) {
        console.error('Failed to parse selected backup object:', error);
      }
    }

    const storedConfig = localStorage.getItem('backupTypeConfiguration');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setBackupType(config.backupType || 'full');
        setConditionalType(config.conditionalType || 'date');

        // Load date backup settings
        if (config.dateBackup) {
          setStartDate(config.dateBackup.startDate || '');
          setEndDate(config.dateBackup.endDate || '');
          setSelectedDateField(config.dateBackup.selectedDateField || '');
        }

        // Load numeric backup settings
        if (config.numericBackup) {
          setStartRange(config.numericBackup.startRange || '');
          setEndRange(config.numericBackup.endRange || '');
          setSelectedNumericField(config.numericBackup.selectedNumericField || '');
        }

        // Load value backup settings
        if (config.valueBackup) {
          setSelectedPicklistField(config.valueBackup.selectedPicklistField || '');
          setSelectedPicklistValue(config.valueBackup.selectedPicklistValue || '');
        }

        // Load incremental backup settings
        if (config.incrementalBackup) {
          setIncrementalCompareField(config.incrementalBackup.incrementalCompareField || '');
          setIncrementalStartDate(config.incrementalBackup.incrementalStartDate || '');
        }
      } catch (error) {
        console.error('Failed to parse backup configuration:', error);
      }
    }
  }, []);

  // API calls
  const { data: metadataFields, isLoading: loadingMetadata } = useGetMetadataFieldsQuery(
    selectedBackupObject?.object_id || '',
    { skip: !selectedBackupObject?.object_id }
  );

  const { data: picklistValues } = useGetPicklistValuesQuery(
    {
      objectId: selectedBackupObject?.object_id || '',
      fieldId: selectedPicklistField
    },
    { skip: !selectedBackupObject?.object_id || !selectedPicklistField }
  );

  console.log('BackupType - metadataFields:', metadataFields);
  console.log('BackupType - loadingMetadata:', loadingMetadata);

  // Auto-save configuration whenever any field changes
  useEffect(() => {
    if (selectedBackupObject) {
      const configuration = {
        selectedObject: selectedBackupObject,
        backupType,
        conditionalType,
        dateBackup: {
          startDate,
          endDate,
          selectedDateField,
        },
        numericBackup: {
          startRange,
          endRange,
          selectedNumericField,
        },
        valueBackup: {
          selectedPicklistField,
          selectedPicklistValue,
        },
        incrementalBackup: {
          incrementalCompareField,
          incrementalStartDate,
        },
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('backupTypeConfiguration', JSON.stringify(configuration));
    }
  }, [
    selectedBackupObject,
    backupType,
    conditionalType,
    startDate,
    endDate,
    selectedDateField,
    startRange,
    endRange,
    selectedNumericField,
    selectedPicklistField,
    selectedPicklistValue,
    incrementalCompareField,
    incrementalStartDate,
  ]);

  const handleSaveConfiguration = () => {
    const configuration = {
      selectedObject: selectedBackupObject,
      backupType,
      conditionalType,
      dateBackup: {
        startDate,
        endDate,
        selectedDateField,
      },
      numericBackup: {
        startRange,
        endRange,
        selectedNumericField,
      },
      valueBackup: {
        selectedPicklistField,
        selectedPicklistValue,
      },
      incrementalBackup: {
        incrementalCompareField,
        incrementalStartDate,
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('backupTypeConfiguration', JSON.stringify(configuration));
    console.log('Backup configuration saved:', configuration);
    // You could also dispatch to Redux store if needed
  };

  // Filter fields based on type
  const dateFields = metadataFields?.filter(field =>
    field.is_datetime === 'true' || field.is_date === 'true'
  ).map(field => ({ name: field.name, field_id: field.field_id })) || [];

  const numericFields = metadataFields?.filter(field =>
    field.is_integer === 'true' || field.is_float === 'true'
  ).map(field => ({ name: field.name, field_id: field.field_id })) || [];

  const picklistFields = metadataFields?.filter(field =>
    field.is_picklist === 'true'
  ).map(field => ({ name: field.name, field_id: field.field_id })) || [];

  console.log('Filtered fields:', { dateFields, numericFields, picklistFields });

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Backup Type Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Configure the type of backup operations for your data
      </Typography>
      {selectedBackupObject ? (
        <Typography variant="body2" color="primary" sx={{ mb: 3 }}>
          Using metadata from object: <strong>{selectedBackupObject.name}</strong>
        </Typography>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select an object in the "Object Selection" tab first to configure backup types.
        </Alert>
      )}

      {selectedBackupObject ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Backup Types
                </Typography>
                <RadioGroup
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value)}
                >
                  <FormControlLabel value="full" control={<Radio />} label="Full - All Data" />
                  <FormControlLabel value="conditional" control={<Radio />} label="Conditional Backup" />
                  <FormControlLabel value="incremental" control={<Radio />} label="Incremental Backup" />
                </RadioGroup>
              </CardContent>
            </Card>
          </Grid>

        {/* Conditional Backup Options */}
        <Grid item xs={12}>
          <Collapse in={backupType === 'conditional'}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conditional Backup Options
                </Typography>
                <RadioGroup
                  value={conditionalType}
                  onChange={(e) => setConditionalType(e.target.value)}
                >
                  <FormControlLabel value="date" control={<Radio />} label="Backup by Date" />
                  <FormControlLabel value="numeric" control={<Radio />} label="Backup by Numeric Range" />
                  <FormControlLabel value="value" control={<Radio />} label="Backup by Value" />
                </RadioGroup>

                {/* Date Backup Options */}
                <Collapse in={conditionalType === 'date'}>
                  <Card sx={{ mt: 2, ml: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Date Range Configuration
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />,
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
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Select Date Field</InputLabel>
                            <Select
                              value={selectedDateField}
                              onChange={(e) => setSelectedDateField(e.target.value)}
                              label="Select Date Field"
                              disabled={loadingMetadata}
                            >
                              {dateFields.length > 0 ? (
                                dateFields.map((field, index) => (
                                  <MenuItem key={field.field_id || field.name || `backup-field-${index}`} value={field.field_id}>
                                    {field.name}
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem disabled>No date fields available</MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Collapse>

                {/* Numeric Range Options */}
                <Collapse in={conditionalType === 'numeric'}>
                  <Card sx={{ mt: 2, ml: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Numeric Range Configuration
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Select Numeric Field</InputLabel>
                            <Select
                              value={selectedNumericField}
                              onChange={(e) => setSelectedNumericField(e.target.value)}
                              label="Select Numeric Field"
                              disabled={loadingMetadata}
                            >
                              {numericFields.length > 0 ? (
                                numericFields.map((field) => (
                                  <MenuItem key={field.field_id} value={field.field_id}>
                                    {field.name}
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem disabled>No numeric fields available</MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Start Range"
                            type="number"
                            value={startRange}
                            onChange={(e) => setStartRange(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="End Range"
                            type="number"
                            value={endRange}
                            onChange={(e) => setEndRange(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Collapse>

                {/* Value Backup Options */}
                <Collapse in={conditionalType === 'value'}>
                  <Card sx={{ mt: 2, ml: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Value Configuration
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Select Picklist Field</InputLabel>
                            <Select
                              value={selectedPicklistField}
                              onChange={(e) => setSelectedPicklistField(e.target.value)}
                              label="Select Picklist Field"
                              disabled={loadingMetadata}
                            >
                              {picklistFields.length > 0 ? (
                                picklistFields.map((field) => (
                                  <MenuItem key={field.field_id} value={field.field_id}>
                                    {field.name}
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem disabled>No picklist fields available</MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        </Grid>
                        {selectedPicklistField && (
                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Select Value</InputLabel>
                              <Select
                                value={selectedPicklistValue}
                                onChange={(e) => setSelectedPicklistValue(e.target.value)}
                                label="Select Value"
                              >
                                {picklistValues?.picklist_values && picklistValues.picklist_values.length > 0 ? (
                                  picklistValues.picklist_values.map((value, index) => (
                                    <MenuItem key={index} value={value}>
                                      {value}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem disabled>No values available</MenuItem>
                                )}
                              </Select>
                            </FormControl>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Collapse>
              </CardContent>
            </Card>
          </Collapse>
        </Grid>

        {/* Incremental Backup Options */}
        <Grid item xs={12}>
          <Collapse in={backupType === 'incremental'}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Incremental Backup Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Compare Using</InputLabel>
                      <Select
                        value={incrementalCompareField}
                        onChange={(e) => setIncrementalCompareField(e.target.value)}
                        label="Compare Using"
                        disabled={loadingMetadata}
                      >
                        {dateFields.length > 0 ? (
                          dateFields.map((field) => (
                            <MenuItem key={field.field_id} value={field.field_id}>
                              {field.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>No date fields available</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={incrementalStartDate}
                      onChange={(e) => setIncrementalStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>
        </Grid>

        {/* Save Configuration */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfiguration}
              size="large"
            >
              Save Configuration
            </Button>
          </Box>
        </Grid>
      </Grid>
      ) : null}
    </Box>
  );
};

export { BackupType };