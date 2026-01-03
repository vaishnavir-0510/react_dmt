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
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { DateRange as DateRangeIcon } from '@mui/icons-material';
import { useCreateBackupPlanMutation, useGetBackupProcessStatusQuery } from '../../services/backupApi';

const BackupSchedule: React.FC = () => {
  const [scheduleType, setScheduleType] = useState('manual');
  const [schedulePattern, setSchedulePattern] = useState('daily');

  // Schedule duration fields
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState('30');

  // Schedule range fields
  const [rangeType, setRangeType] = useState('no_end');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');

  // Pattern-specific fields
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMonthDay, setSelectedMonthDay] = useState('1');
  const [selectedMonth, setSelectedMonth] = useState('1');

  // Backup process state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSummaryId, setBackupSummaryId] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load configurations from both tabs
  const [backupTypeConfig, setBackupTypeConfig] = useState<any>(null);
  const [selectedBackupObject, setSelectedBackupObject] = useState<any>(null);
  const [selectedCompoundFields, setSelectedCompoundFields] = useState<string[]>([]);

  // API hooks
  const [createBackupPlan] = useCreateBackupPlanMutation();
  const { data: processStatus, error: processError } = useGetBackupProcessStatusQuery(
    backupSummaryId || '',
    {
      skip: !backupSummaryId || ['success', 'job complete', 'failed'].includes(backupStatus || ''),
      pollingInterval: 2000,
    }
  );

  // Load saved configurations
  useEffect(() => {
    // Load schedule configuration
    const storedScheduleConfig = localStorage.getItem('backupScheduleConfiguration');
    if (storedScheduleConfig) {
      try {
        const config = JSON.parse(storedScheduleConfig);
        setScheduleType(config.scheduleType || 'manual');
        setSchedulePattern(config.schedulePattern || 'daily');
        setScheduleStart(config.scheduleStart || '');
        setScheduleEnd(config.scheduleEnd || '');
        setScheduleDuration(config.scheduleDuration || '30');
        setRangeType(config.rangeType || 'no_end');
        setRangeStart(config.rangeStart || '');
        setRangeEnd(config.rangeEnd || '');
        setRangeEndDate(config.rangeEndDate || '');
        setSelectedDays(config.selectedDays || []);
        setSelectedMonthDay(config.selectedMonthDay || '1');
        setSelectedMonth(config.selectedMonth || '1');
      } catch (error) {
        console.error('Failed to parse schedule configuration:', error);
      }
    }

    // Load backup type configuration
    const storedBackupTypeConfig = localStorage.getItem('backupTypeConfiguration');
    if (storedBackupTypeConfig) {
      try {
        const config = JSON.parse(storedBackupTypeConfig);
        setBackupTypeConfig(config);
        setSelectedBackupObject(config.selectedObject);
      } catch (error) {
        console.error('Failed to parse backup type configuration:', error);
      }
    }

    // Load selected compound fields
    const storedCompoundFields = localStorage.getItem('selectedCompoundFields');
    if (storedCompoundFields) {
      try {
        const fields = JSON.parse(storedCompoundFields);
        setSelectedCompoundFields(fields);
      } catch (error) {
        console.error('Failed to parse compound fields:', error);
      }
    }
  }, []);

  // Handle backup process status updates
  useEffect(() => {
    if (processError) {
      // Handle API errors (500, 502, 400, etc.)
      console.error('Backup process API error:', processError);
      setNotification({
        open: true,
        message: 'Backup process encountered an error. Please try again.',
        severity: 'error',
      });
      setIsBackingUp(false);
      setBackupSummaryId(null);
      setBackupStatus('error');
    } else if (processStatus) {
      setBackupStatus(processStatus.status);

      if (processStatus.status === 'success' || processStatus.status === 'job complete') {
        setNotification({
          open: true,
          message: 'Backup completed successfully!',
          severity: 'success',
        });
        setIsBackingUp(false);
        setBackupSummaryId(null);
      } else if (processStatus.status === 'failed') {
        setNotification({
          open: true,
          message: `Backup failed: ${processStatus.message || 'Unknown error'}`,
          severity: 'error',
        });
        setIsBackingUp(false);
        setBackupSummaryId(null);
      } else {
        // Still processing
        setNotification({
          open: true,
          message: `Backup ${processStatus.status}...`,
          severity: 'info',
        });
      }
    }
  }, [processStatus, processError]);

  // Auto-save configuration
  useEffect(() => {
    const configuration = {
      scheduleType,
      schedulePattern,
      scheduleStart,
      scheduleEnd,
      scheduleDuration,
      rangeType,
      rangeStart,
      rangeEnd,
      rangeEndDate,
      selectedDays,
      selectedMonthDay,
      selectedMonth,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('backupScheduleConfiguration', JSON.stringify(configuration));
  }, [
    scheduleType,
    schedulePattern,
    scheduleStart,
    scheduleEnd,
    scheduleDuration,
    rangeType,
    rangeStart,
    rangeEnd,
    rangeEndDate,
    selectedDays,
    selectedMonthDay,
    selectedMonth,
  ]);

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleBackup = async () => {
    if (!selectedBackupObject || !backupTypeConfig) {
      setNotification({
        open: true,
        message: 'Please configure backup type and select an object first.',
        severity: 'error',
      });
      return;
    }

    setIsBackingUp(true);
    setNotification({
      open: true,
      message: 'Starting backup process...',
      severity: 'info',
    });

    try {
      // Construct the Select parameter from selected compound fields
      if (selectedCompoundFields.length === 0) {
        throw new Error('Please select compound fields for backup in the Object Selection tab.');
      }
      const selectParam = selectedCompoundFields.join(',');

      const backupTypeLabel = backupTypeConfig.backupType === 'full' ? 'Full Backup' :
                             backupTypeConfig.backupType === 'conditional' ? 'Conditional Backup' :
                             'Incremental Backup';

      const scheduleTypeLabel = scheduleType === 'manual' ? 'Manual/Immediate' : 'Scheduled';

      const response = await createBackupPlan({
        object_id: selectedBackupObject.object_id,
        Select: selectParam,
        backup_type: backupTypeLabel,
        backup_model: {
          backup_type: backupTypeLabel,
          object_id: selectedBackupObject.object_id,
        },
        schedule_info: {
          schedule_type: scheduleTypeLabel,
        },
      }).unwrap();

      setBackupSummaryId(response.summary_id);
      setNotification({
        open: true,
        message: 'Backup plan created. Monitoring progress...',
        severity: 'info',
      });

    } catch (error: any) {
      console.error('Backup failed:', error);
      setNotification({
        open: true,
        message: `Backup failed: ${error?.data?.message || error.message || 'Unknown error'}`,
        severity: 'error',
      });
      setIsBackingUp(false);
    }
  };

  const handleCancel = () => {
    setIsBackingUp(false);
    setBackupSummaryId(null);
    setBackupStatus(null);
    setNotification({
      open: true,
      message: 'Backup cancelled.',
      severity: 'info',
    });
  };

  const getPatternDescription = (pattern: string) => {
    switch (pattern) {
      case 'daily':
        return 'Run backup every day at the specified time';
      case 'weekly':
        return 'Run backup on selected days of the week';
      case 'monthly':
        return 'Run backup on a specific day of the month';
      case 'yearly':
        return 'Run backup on a specific date each year';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Backup Schedule Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure how and when your backups should run
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schedule Type
              </Typography>
              <RadioGroup
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
              >
                <FormControlLabel value="manual" control={<Radio />} label="Manual/Immediate - Run backup manually or immediately" />
                <FormControlLabel value="scheduled" control={<Radio />} label="Scheduled - Set up automated backup schedules" />
              </RadioGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Options */}
        <Grid item xs={12}>
          <Collapse in={scheduleType === 'scheduled'}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Schedule Configuration
                </Typography>

                <Grid container spacing={3}>
                  {/* Schedule Duration */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Schedule Duration
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Start Time"
                          type="time"
                          value={scheduleStart}
                          onChange={(e) => setScheduleStart(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="End Time"
                          type="time"
                          value={scheduleEnd}
                          onChange={(e) => setScheduleEnd(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Duration</InputLabel>
                          <Select
                            value={scheduleDuration}
                            onChange={(e) => setScheduleDuration(e.target.value)}
                            label="Duration"
                          >
                            <MenuItem value="15">15 minutes</MenuItem>
                            <MenuItem value="30">30 minutes</MenuItem>
                            <MenuItem value="45">45 minutes</MenuItem>
                            <MenuItem value="60">1 hour</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Schedule Pattern */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Schedule Pattern
                    </Typography>
                    <RadioGroup
                      value={schedulePattern}
                      onChange={(e) => setSchedulePattern(e.target.value)}
                    >
                      <FormControlLabel value="daily" control={<Radio />} label="Daily" />
                      <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
                      <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
                      <FormControlLabel value="yearly" control={<Radio />} label="Yearly" />
                    </RadioGroup>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {getPatternDescription(schedulePattern)}
                    </Typography>

                    {/* Pattern-specific options */}
                    {schedulePattern === 'weekly' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Select days:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <Button
                              key={day}
                              variant={selectedDays.includes(day) ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => handleDayToggle(day)}
                            >
                              {day}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {schedulePattern === 'monthly' && (
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Day of Month</InputLabel>
                          <Select
                            value={selectedMonthDay}
                            onChange={(e) => setSelectedMonthDay(e.target.value)}
                            label="Day of Month"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <MenuItem key={day} value={day.toString()}>
                                {day}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}

                    {schedulePattern === 'yearly' && (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <FormControl fullWidth>
                              <InputLabel>Month</InputLabel>
                              <Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                label="Month"
                              >
                                {[
                                  'January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'
                                ].map((month, index) => (
                                  <MenuItem key={month} value={(index + 1).toString()}>
                                    {month}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <FormControl fullWidth>
                              <InputLabel>Day</InputLabel>
                              <Select
                                value={selectedMonthDay}
                                onChange={(e) => setSelectedMonthDay(e.target.value)}
                                label="Day"
                              >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                  <MenuItem key={day} value={day.toString()}>
                                    {day}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Grid>

                  {/* Schedule Range */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Schedule Range
                    </Typography>
                    <RadioGroup
                      value={rangeType}
                      onChange={(e) => setRangeType(e.target.value)}
                    >
                      <FormControlLabel value="no_end" control={<Radio />} label="No end date" />
                      <FormControlLabel value="end_by" control={<Radio />} label="End by (number of occurrences)" />
                      <FormControlLabel value="end_date" control={<Radio />} label="End by specific date" />
                    </RadioGroup>

                    {rangeType === 'end_by' && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <TextField
                          label="Start after"
                          type="number"
                          value={rangeStart}
                          onChange={(e) => setRangeStart(e.target.value)}
                          sx={{ width: 120 }}
                        />
                        <TextField
                          label="End after"
                          type="number"
                          value={rangeEnd}
                          onChange={(e) => setRangeEnd(e.target.value)}
                          sx={{ width: 120 }}
                        />
                        <Typography sx={{ alignSelf: 'center' }}>occurrences</Typography>
                      </Box>
                    )}

                    {rangeType === 'end_date' && (
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          label="End Date"
                          type="date"
                          value={rangeEndDate}
                          onChange={(e) => setRangeEndDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: <DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />,
                          }}
                          sx={{ maxWidth: 300 }}
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={!isBackingUp}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBackup}
              disabled={isBackingUp || !selectedBackupObject}
              startIcon={isBackingUp ? <CircularProgress size={20} /> : null}
              size="large"
            >
              {isBackingUp ? 'Backing Up...' : 'Backup'}
            </Button>
          </Box>
        </Grid>

        {/* Backup Status */}
        {backupStatus && (
          <Grid item xs={12}>
            <Alert
              severity={
                backupStatus === 'success' || backupStatus === 'job complete' ? 'success' :
                backupStatus === 'failed' ? 'error' : 'info'
              }
              sx={{ mt: 2 }}
            >
              Backup Status: {backupStatus}
              {backupSummaryId && ` (ID: ${backupSummaryId})`}
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export { BackupSchedule };