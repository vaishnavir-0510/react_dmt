import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
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
    Autocomplete,
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useCreateObjectMutation, useUpdateObjectMutation } from '../../services/objectsApi';
import { useGetSystemUsersQuery } from '../../services/userApi';
import { useGetSalesforceObjectsQuery } from '../../services/entitiesApi';
import type { ObjectData } from '../../services/objectsApi';
import type { SystemUser } from '../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

interface ObjectSlideInProps {
    open: boolean;
    onClose: () => void;
    object: ObjectData | null;
    systemId: string;
    systemType: 'source' | 'target';
}

export const ObjectSlideIn: React.FC<ObjectSlideInProps> = ({
    open,
    onClose,
    object,
    systemId,
    systemType,
}) => {
    const { selectedProject } = useSelector((state: RootState) => state.app);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        operation: 'insert',
        criteria: '',
        post_mig_strategy: '',
        owner_id: '',
        estimated_rows: '',
        migration_rows: '',
        migration_columns: '',
    });

    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    const [createObject, { isLoading: isCreating, error: createError }] = useCreateObjectMutation();
    const [updateObject, { isLoading: isUpdating, error: updateError }] = useUpdateObjectMutation();

    // Get system users for owner dropdown
    const { data: systemUsers = [] } = useGetSystemUsersQuery();

    // Get Salesforce objects for target dropdown
    const { data: salesforceObjectsData, isLoading: isLoadingSalesforceObjects, error: salesforceObjectsError } = useGetSalesforceObjectsQuery();
    const salesforceObjects = salesforceObjectsData?.objects || [];

    const isEditing = !!object;

    // Set default owner when users load and no owner is selected
    useEffect(() => {
        if (systemUsers.length > 0 && !formData.owner_id && !isEditing) {
            setFormData(prev => ({
                ...prev,
                owner_id: systemUsers[0].id,
            }));
        }
    }, [systemUsers, formData.owner_id, isEditing]);
    const isLoading = isCreating || isUpdating;
    const error = createError || updateError;

    // Reset form when opening/closing or when object changes
    useEffect(() => {
        if (open) {
            if (object) {
                // Find the owner ID from systemUsers based on owner_name
                const ownerUser = systemUsers.find(user =>
                    user.firstname + ' ' + user.lastname === object.owner_name ||
                    user.username === object.owner_name
                );
                setFormData({
                    name: object.name || '',
                    description: object.description || '',
                    operation: object.operation || 'insert',
                    criteria: object.criteria || '',
                    post_mig_strategy: object.post_mig_strategy || '',
                    owner_id: ownerUser?.id || '',
                    estimated_rows: object.records_count || '',
                    migration_rows: object.migration_count || '',
                    migration_columns: object.field_count?.toString() || '',
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    operation: 'insert',
                    criteria: '',
                    post_mig_strategy: '',
                    owner_id: '',
                    estimated_rows: '',
                    migration_rows: '',
                    migration_columns: '',
                });
            }
        }
    }, [open, object, systemUsers]);

    const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value,
        }));
    };

    const handleSelectChange = (field: string) => (event: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value,
        }));
        // Clear validation error when user changes the field
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};

        if (systemType === 'source') {
            if (!formData.name.trim()) errors.name = 'Object name is required';
            if (!formData.owner_id) errors.owner_id = 'Owner is required';
            if (!formData.estimated_rows.trim()) errors.estimated_rows = 'Estimated rows is required';
            if (!formData.migration_rows.trim()) errors.migration_rows = 'Migration rows is required';
            if (!formData.migration_columns.trim()) errors.migration_columns = 'Migration columns is required';
            if (!formData.description.trim()) errors.description = 'Description is required';
            if (!formData.operation) errors.operation = 'Operation is required';
            // Note: criteria and post_mig_strategy are not required for source
        } else {
            if (!formData.name.trim()) errors.name = 'Target object is required';
            if (!formData.owner_id) errors.owner_id = 'Owner is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            let objectData: any;

            if (systemType === 'target') {
                // For target systems, only pass minimal required fields
                objectData = {
                    name: formData.name,
                    owner: formData.owner_id,
                    system: systemId,
                    project: selectedProject?.id || '',
                    // Pass empty/default values for other fields
                    description: '',
                    operation: 'insert',
                    criteria: '',
                    post_mig_strategy: '',
                    records_count: '',
                    migration_count: '',
                    field_count: 0,
                };
            } else {
                // For source systems, pass all fields
                objectData = {
                    name: formData.name,
                    description: formData.description,
                    operation: formData.operation,
                    criteria: formData.criteria,
                    post_mig_strategy: formData.post_mig_strategy,
                    owner: formData.owner_id,
                    records_count: formData.estimated_rows,
                    migration_count: formData.migration_rows,
                    field_count: parseInt(formData.migration_columns) || 0,
                    system: systemId,
                    project: selectedProject?.id || '',
                };
            }

            if (isEditing && object) {
                await updateObject({
                    id: object.object_id,
                    data: objectData,
                }).unwrap();
            } else {
                await createObject(objectData).unwrap();
            }

            onClose();
            // Data will automatically refresh due to RTK Query cache invalidation
        } catch (error) {
            // Error handling is done through the mutation result
            console.error('Failed to save object:', error);
        }
    };

    const operationOptions = [
        { value: 'insert', label: 'Insert' },
        { value: 'upsert', label: 'Upsert' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' },
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
            }}
        >
            <Paper
                sx={{
                    width: modalWidth,
                    height: '100vh',
                    margin: 0,
                    borderRadius: 0,
                    overflow: 'auto',
                    boxShadow: 24,
                }}
            >
                <Box sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" component="h2" fontWeight="bold">
                            {isEditing ? 'Edit Object' : 'Add New Object'}
                        </Typography>
                        <IconButton onClick={onClose} disabled={isLoading}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* System Info */}
                    <Box sx={{ mb: 3 }}>
                        <Chip
                            label={`${systemType.toUpperCase()} System`}
                            color={systemType === 'source' ? 'primary' : 'secondary'}
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            System ID: {systemId}
                        </Typography>
                    </Box>

                    {/* Error Display */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Failed to {isEditing ? 'update' : 'create'} object. Please try again.
                        </Alert>
                    )}

                    {/* Salesforce Objects Error */}
                    {salesforceObjectsError && systemType === 'target' && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Failed to load Salesforce objects. Please check your connection.
                        </Alert>
                    )}

                    {/* Form */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <Grid container spacing={2}>
                            {/* Target System - Minimal Fields */}
                            {systemType === 'target' ? (
                                <>
                                    <Grid item xs={12}>
                                        <Autocomplete
                                            value={formData.name}
                                            onChange={(event, newValue) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    name: newValue || '',
                                                }));
                                                if (validationErrors.name) {
                                                    setValidationErrors(prev => ({
                                                        ...prev,
                                                        name: '',
                                                    }));
                                                }
                                            }}
                                            options={salesforceObjects}
                                            loading={isLoadingSalesforceObjects}
                                            disabled={isLoading || !!salesforceObjectsError}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Target Object"
                                                    error={!!validationErrors.name}
                                                    helperText={validationErrors.name || (salesforceObjectsError ? 'Failed to load objects' : '')}
                                                    disabled={isLoading || !!salesforceObjectsError}
                                                />
                                            )}
                                            noOptionsText={salesforceObjectsError ? 'Failed to load objects' : 'No objects available'}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <FormControl fullWidth disabled={isLoading} error={!!validationErrors.owner_id}>
                                            <InputLabel>Owner</InputLabel>
                                            <Select
                                                value={formData.owner_id}
                                                onChange={handleSelectChange('owner_id')}
                                                label="Owner"
                                            >
                                                <MenuItem value="">
                                                    <em>Select owner</em>
                                                </MenuItem>
                                                {systemUsers.map((user) => (
                                                    <MenuItem key={user.id} value={user.id}>
                                                        {user.firstname} {user.lastname} ({user.username})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {validationErrors.owner_id && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                                    {validationErrors.owner_id}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="System"
                                            value={systemId}
                                            disabled
                                            InputProps={{
                                                readOnly: true,
                                            }}
                                        />
                                    </Grid>
                                </>
                            ) : (
                                /* Source System - All Fields */
                                <>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Object Name"
                                            value={formData.name}
                                            onChange={handleInputChange('name')}
                                            required
                                            disabled={isLoading}
                                            error={!!validationErrors.name}
                                            helperText={validationErrors.name}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <FormControl fullWidth disabled={isLoading} error={!!validationErrors.owner_id}>
                                            <InputLabel>Owner</InputLabel>
                                            <Select
                                                value={formData.owner_id}
                                                onChange={handleSelectChange('owner_id')}
                                                label="Owner"
                                            >
                                                <MenuItem value="">
                                                    <em>Select owner</em>
                                                </MenuItem>
                                                {systemUsers.map((user) => (
                                                    <MenuItem key={user.id} value={user.id}>
                                                        {user.firstname} {user.lastname} ({user.username})
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {validationErrors.owner_id && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                                    {validationErrors.owner_id}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Estimated Number of Rows in Source System"
                                            value={formData.estimated_rows}
                                            onChange={handleInputChange('estimated_rows')}
                                            type="number"
                                            disabled={isLoading}
                                            placeholder="e.g., 10000"
                                            error={!!validationErrors.estimated_rows}
                                            helperText={validationErrors.estimated_rows}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Estimated Number of ROWS for Migration"
                                            value={formData.migration_rows}
                                            onChange={handleInputChange('migration_rows')}
                                            type="number"
                                            disabled={isLoading}
                                            placeholder="e.g., 5000"
                                            error={!!validationErrors.migration_rows}
                                            helperText={validationErrors.migration_rows}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Estimated Number of COLUMNS for Migration"
                                            value={formData.migration_columns}
                                            onChange={handleInputChange('migration_columns')}
                                            type="number"
                                            disabled={isLoading}
                                            placeholder="e.g., 25"
                                            error={!!validationErrors.migration_columns}
                                            helperText={validationErrors.migration_columns}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            value={formData.description}
                                            onChange={handleInputChange('description')}
                                            multiline
                                            rows={3}
                                            disabled={isLoading}
                                            error={!!validationErrors.description}
                                            helperText={validationErrors.description}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <FormControl fullWidth disabled={isLoading} error={!!validationErrors.operation}>
                                            <InputLabel>Operation</InputLabel>
                                            <Select
                                                value={formData.operation}
                                                onChange={handleSelectChange('operation')}
                                                label="Operation"
                                            >
                                                {operationOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {validationErrors.operation && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                                                    {validationErrors.operation}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Criteria"
                                            value={formData.criteria}
                                            onChange={handleInputChange('criteria')}
                                            multiline
                                            rows={2}
                                            disabled={isLoading}
                                            placeholder="e.g., status='active'"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Post-Migration Strategy"
                                            value={formData.post_mig_strategy}
                                            onChange={handleInputChange('post_mig_strategy')}
                                            multiline
                                            rows={2}
                                            disabled={isLoading}
                                            placeholder="e.g., archive old records"
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isLoading || !formData.name}
                            startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                        >
                            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Modal>
    );
};
