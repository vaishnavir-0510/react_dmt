// components/migration/tabs/RelationshipTab.tsx
import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  IconButton,
  Grid,
  Snackbar,
  Alert,
  TextField,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, Check as CheckIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetObjectMetadataQuery, useUpdateFieldMetadataMutation } from '../../../services/metadataApi';
import { useGetSystemsByProjectQuery } from '../../../services/systemsApi';
import { useGetObjectsBySystemQuery } from '../../../services/objectsApi';
import type { MetadataField } from '../../../services/metadataApi';
import type { System } from '../../../types';
import { useCreateLookupRelationMutation, useGetLookupRelationsQuery, useUpdateLookupRelationMutation } from '../../../services/lookupApi';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';



export const RelationshipTab: React.FC = () => {
   const { selectedObject } = useSelector((state: RootState) => state.migration);
   const { selectedProject, selectedEnvironment } = useSelector((state: RootState) => state.app);
   const { user } = useSelector((state: RootState) => state.auth);
  const { getCompletionStatus, getReadOnlyFlag } = useActivity();
  const isReadOnly = getReadOnlyFlag('Relationship') || getCompletionStatus('Mapping');
  const [selectedPrimaryKey, setSelectedPrimaryKey] = useState<string>('');
  const [uniqueKeyFields, setUniqueKeyFields] = useState<string[]>(['']);

  // Foreign key relations state
  const [foreignKeyRelations, setForeignKeyRelations] = useState<Array<{
    fieldId: string;
    systemId: string;
    relatedObjectId: string;
    relatedFieldId: string;
    completed: boolean;
    // Store names for display and API calls
    fieldName?: string;
    systemName?: string;
    relatedObjectName?: string;
    relatedFieldName?: string;
  }>>([{ fieldId: '', systemId: '', relatedObjectId: '', relatedFieldId: '', completed: false }]);

  // Lookup relations state
  const [lookupRelations, setLookupRelations] = useState<Array<{
    id?: string; // For existing relations
    fieldId: string;
    lookupSystemId: string;
    lookupObjectId: string;
    lookupJoinFieldId: string;
    lookupFetchFieldIds: string[];
    completed: boolean;
    // Store names for display
    fieldName?: string;
    lookupSystemName?: string;
    lookupObjectName?: string;
    lookupJoinFieldName?: string;
    lookupFetchFieldNames?: string[];
  }>>([{ fieldId: '', lookupSystemId: '', lookupObjectId: '', lookupJoinFieldId: '', lookupFetchFieldIds: [], completed: false }]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Track initial state and last saved state to avoid unnecessary API calls
  const initialPrimaryKeyRef = React.useRef<string>('');
  const lastSavedPrimaryKeyRef = React.useRef<string>('');
  const initialUniqueKeysRef = React.useRef<string[]>([]);
  const hasInitializedRef = React.useRef(false);

  // Fetch metadata for the selected object
  const { data: metadataFields = [], isLoading } = useGetObjectMetadataQuery(
    selectedObject?.object_id || '',
    { skip: !selectedObject?.object_id }
  );

  // Fetch systems for the project
  const { data: systems = [] } = useGetSystemsByProjectQuery(
    selectedProject?.id || '',
    { skip: !selectedProject?.id }
  );

  // Update field metadata mutation
  const [updateFieldMetadata] = useUpdateFieldMetadataMutation();

  // Lookup API queries and mutations
  const { data: existingLookupRelations = [] } = useGetLookupRelationsQuery(
    selectedObject?.object_id || '',
    { skip: !selectedObject?.object_id }
  );
  const [createLookupRelation] = useCreateLookupRelationMutation();
  const [updateLookupRelation] = useUpdateLookupRelationMutation();

  // Get the currently selected system for foreign key relations
  const currentSelectedSystem = foreignKeyRelations.find(r => r.systemId && !r.completed)?.systemId || '';

  // Fetch objects for the currently selected system
  const { data: currentSystemObjects = [] } = useGetObjectsBySystemQuery(currentSelectedSystem, {
    skip: !currentSelectedSystem
  });

  // Get the currently selected related object
  const currentSelectedRelatedObject = foreignKeyRelations.find(r => r.relatedObjectId && !r.completed)?.relatedObjectId || '';

  // Fetch metadata for the currently selected related object
  const { data: currentRelatedObjectMetadata = [] } = useGetObjectMetadataQuery(currentSelectedRelatedObject, {
    skip: !currentSelectedRelatedObject
  });

  // Get the currently selected lookup system and object
  const currentSelectedLookupSystem = lookupRelations.find(r => r.lookupSystemId && !r.completed)?.lookupSystemId || '';
  const currentSelectedLookupObject = lookupRelations.find(r => r.lookupObjectId && !r.completed)?.lookupObjectId || '';

  // Fetch objects for the currently selected lookup system
  const { data: currentLookupSystemObjects = [] } = useGetObjectsBySystemQuery(currentSelectedLookupSystem, {
    skip: !currentSelectedLookupSystem
  });

  // Fetch metadata for the currently selected lookup object
  const { data: currentLookupObjectMetadata = [] } = useGetObjectMetadataQuery(currentSelectedLookupObject, {
    skip: !currentSelectedLookupObject
  });

  // Get primary key field (first field where is_pk = "true")
  const primaryKeyField = useMemo(() => {
    return metadataFields.find(field => field.is_pk === 'true');
  }, [metadataFields]);

  // Get unique fields (fields where is_unique = "true")
  const uniqueFields = useMemo(() => {
    return metadataFields.filter(field => field.is_unique === 'true');
  }, [metadataFields]);

  // Reset state and refetch data when object or environment changes
  React.useEffect(() => {
    if (selectedObject?.object_id) {
      setSelectedPrimaryKey('');
      setUniqueKeyFields(['']);
      setForeignKeyRelations([{ fieldId: '', systemId: '', relatedObjectId: '', relatedFieldId: '', completed: false }]);
      setLookupRelations([{ fieldId: '', lookupSystemId: '', lookupObjectId: '', lookupJoinFieldId: '', lookupFetchFieldIds: [], completed: false }]);
      setSnackbar({ open: false, message: '', severity: 'info' });
      initialPrimaryKeyRef.current = '';
      lastSavedPrimaryKeyRef.current = '';
      initialUniqueKeysRef.current = [];
      hasInitializedRef.current = false;
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id]);

  // Initialize with existing metadata values
  React.useEffect(() => {
    if (metadataFields.length > 0 && !hasInitializedRef.current) {
      const pkField = metadataFields.find(f => f.is_pk === 'true');
      const uniqueKeyFieldsFromMetadata = metadataFields.filter(f => f.is_unique === 'true');

      if (pkField) {
        setSelectedPrimaryKey(pkField.name);
        initialPrimaryKeyRef.current = pkField.name;
        lastSavedPrimaryKeyRef.current = pkField.name; // Track last saved value
      }

      if (uniqueKeyFieldsFromMetadata.length > 0) {
        const uniqueNames = uniqueKeyFieldsFromMetadata.map(f => f.name);
        setUniqueKeyFields(uniqueNames);
        initialUniqueKeysRef.current = uniqueNames;
      }

      // Initialize lookup relations from existing data
      if (existingLookupRelations.length > 0) {
        const lookupRelationsFromAPI = existingLookupRelations.map((relation: any) => ({
          id: relation.id,
          fieldId: metadataFields.find(f => f.name === relation.source_field)?.field_id || '',
          lookupSystemId: relation.lookup_system,
          lookupObjectId: relation.lookup_object,
          lookupJoinFieldId: metadataFields.find(f => f.name === relation.lookup_join_field)?.field_id || '',
          lookupFetchFieldIds: relation.lookup_fetch_field.map((fieldName: string) =>
            metadataFields.find(f => f.name === fieldName)?.field_id || ''
          ).filter((id: string) => id !== ''),
          completed: true,
          fieldName: relation.source_field,
          lookupSystemName: systems.find(s => s.id === relation.lookup_system)?.name,
          lookupObjectName: relation.lookup_object, // This might need to be resolved to name
          lookupJoinFieldName: relation.lookup_join_field,
          lookupFetchFieldNames: relation.lookup_fetch_field,
        }));
        setLookupRelations(lookupRelationsFromAPI);
      }

      hasInitializedRef.current = true;
    }
  }, [metadataFields, existingLookupRelations, systems]);

  const handleAddUniqueField = () => {
    setUniqueKeyFields(prev => [...prev, '']);
  };

  const handleRemoveUniqueField = (index: number) => {
    setUniqueKeyFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleUniqueFieldChange = (index: number, value: string) => {
    setUniqueKeyFields(prev => prev.map((field, i) => i === index ? value : field));
  };

  // Get available fields for dropdowns (exclude already selected fields)
  const getAvailableFields = (excludeValues: string[] = []) => {
    return metadataFields.filter(field =>
      !excludeValues.includes(field.name) || field.name === ''
    );
  };

  // Get available fields for unique key dropdowns (exclude already selected unique fields)
  const getAvailableUniqueFields = (currentIndex: number) => {
    const selectedUniqueFields = uniqueKeyFields.filter((field, index) =>
      index !== currentIndex && field !== ''
    );
    return metadataFields.filter(field =>
      !selectedUniqueFields.includes(field.name)
    );
  };

  // Foreign key handlers
  const handleAddForeignKeyRelation = () => {
    setForeignKeyRelations(prev => [...prev, {
      fieldId: '',
      systemId: '',
      relatedObjectId: '',
      relatedFieldId: '',
      completed: false
    }]);
  };

  const handleForeignKeyChange = (index: number, field: keyof typeof foreignKeyRelations[0], value: string) => {
    setForeignKeyRelations(prev => prev.map((relation, i) => {
      if (i === index) {
        const updatedRelation = { ...relation, [field]: value };

        // Store names when values are selected
        if (field === 'fieldId') {
          const selectedField = metadataFields.find(f => f.field_id === value);
          updatedRelation.fieldName = selectedField?.label || selectedField?.name;
        } else if (field === 'systemId') {
          const selectedSystem = systems.find(s => s.id === value);
          updatedRelation.systemName = selectedSystem?.name;
        } else if (field === 'relatedObjectId') {
          const selectedObject = currentSystemObjects.find((o: any) => o.object_id === value);
          updatedRelation.relatedObjectName = selectedObject?.name || value; // Store name, fallback to ID
        } else if (field === 'relatedFieldId') {
          const selectedField = currentRelatedObjectMetadata.find(f => f.field_id === value);
          updatedRelation.relatedFieldName = selectedField?.label || selectedField?.name;
        }

        return updatedRelation;
      }
      return relation;
    }));
  };

  const handleRemoveForeignKeyRelation = (index: number) => {
    setForeignKeyRelations(prev => prev.filter((_, i) => i !== index));
  };

  // Lookup relation handlers
  const handleAddLookupRelation = () => {
    setLookupRelations(prev => [...prev, {
      fieldId: '',
      lookupSystemId: '',
      lookupObjectId: '',
      lookupJoinFieldId: '',
      lookupFetchFieldIds: [],
      completed: false
    }]);
  };

  const handleLookupChange = (index: number, field: keyof typeof lookupRelations[0], value: string | string[]) => {
    setLookupRelations(prev => prev.map((relation, i) => {
      if (i === index) {
        const updatedRelation = { ...relation, [field]: value };

        // Store names when values are selected
        if (field === 'fieldId' && typeof value === 'string') {
          const selectedField = metadataFields.find(f => f.field_id === value);
          updatedRelation.fieldName = selectedField?.label || selectedField?.name;
        } else if (field === 'lookupSystemId' && typeof value === 'string') {
          const selectedSystem = systems.find(s => s.id === value);
          updatedRelation.lookupSystemName = selectedSystem?.name;
        } else if (field === 'lookupObjectId' && typeof value === 'string') {
          const selectedObject = currentLookupSystemObjects.find((o: any) => o.object_id === value);
          updatedRelation.lookupObjectName = selectedObject?.name;
        } else if (field === 'lookupJoinFieldId' && typeof value === 'string') {
          const selectedField = currentLookupObjectMetadata.find(f => f.field_id === value);
          updatedRelation.lookupJoinFieldName = selectedField?.label || selectedField?.name;
        } else if (field === 'lookupFetchFieldIds' && Array.isArray(value)) {
          updatedRelation.lookupFetchFieldNames = value.map(fieldId => {
            const selectedField = currentLookupObjectMetadata.find(f => f.field_id === fieldId);
            return selectedField?.label || selectedField?.name || fieldId;
          });
        }

        return updatedRelation;
      }
      return relation;
    }));
  };

  const handleRemoveLookupRelation = (index: number) => {
    setLookupRelations(prev => prev.filter((_, i) => i !== index));
  };

  // Manual save function for lookup relations
  const handleSaveLookupRelation = async (index: number) => {
    const relation = lookupRelations[index];
    if (!relation.fieldId || !relation.lookupSystemId || !relation.lookupObjectId ||
        !relation.lookupJoinFieldId || relation.lookupFetchFieldIds.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields before saving',
        severity: 'warning',
      });
      return;
    }

    try {
      const selectedField = metadataFields.find(f => f.field_id === relation.fieldId);
      const selectedSystem = systems.find(s => s.id === relation.lookupSystemId);
      const lookupJoinField = currentLookupObjectMetadata.find(f => f.field_id === relation.lookupJoinFieldId);
      const lookupFetchFields = relation.lookupFetchFieldIds.map(fieldId =>
        currentLookupObjectMetadata.find(f => f.field_id === fieldId)
      ).filter(Boolean);

      if (selectedField && selectedSystem && lookupJoinField && lookupFetchFields.length > 0) {
        const lookupData = {
          id: relation.id || null,
          source_field: selectedField.name,
          source_object: selectedObject?.object_id || '',
          lookup_system: relation.lookupSystemId,
          lookup_object: relation.lookupObjectId,
          lookup_join_field: lookupJoinField.name,
          lookup_fetch_field: lookupFetchFields.map(f => f!.name),
          default_value: "String",
          tenant_key: user?.tenant_id || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          created_by: null,
          created_date: null,
          modified_by: null,
          modified_date: null,
        };

        console.log('Manual Lookup Save Payload:', lookupData);

        if (relation.id) {
          // Update existing relation
          await updateLookupRelation(lookupData).unwrap();
        } else {
          // Create new relation
          await createLookupRelation(lookupData).unwrap();
        }

        // Mark this relation as completed and update with the returned data
        setLookupRelations(prev => prev.map((r, i) =>
          i === index ? { ...r, completed: true } : r
        ));

        setSnackbar({
          open: true,
          message: `Lookup relation saved successfully for ${selectedField.name}`,
          severity: 'success',
        });
      }
    } catch (error: any) {
      console.error('Failed to save lookup relation:', error);
      setSnackbar({
        open: true,
        message: `Failed to save lookup relation: ${error?.data?.message || error?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  // Update field metadata when all foreign key fields are selected (debounced)
  // OPTIMIZATION: Removed metadataFields, systems, and other dependencies to prevent
  // unnecessary API calls when data is refetched but relations haven't changed
  const foreignKeyUpdateTimeoutRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (foreignKeyUpdateTimeoutRef.current) {
      clearTimeout(foreignKeyUpdateTimeoutRef.current);
    }

    foreignKeyUpdateTimeoutRef.current = setTimeout(async () => {
      for (const relation of foreignKeyRelations) {
        if (relation.fieldId && relation.systemId && relation.relatedObjectId && relation.relatedFieldId && !relation.completed) {
          try {
            const selectedField = metadataFields.find(f => f.field_id === relation.fieldId);
            const selectedSystem = systems.find(s => s.id === relation.systemId);
            const relatedField = currentRelatedObjectMetadata.find(f => f.field_id === relation.relatedFieldId);

            if (selectedField && selectedSystem && relatedField) {
              // Update field metadata with foreign key relationship
              // Payload structure: field_id (UUID), fk_field (name), fk_object (name), fk_system (type)
              const payload = {
                objectId: selectedObject?.object_id || '',
                fieldId: relation.fieldId, // field_id (UUID) of the foreign key field
                updates: {
                  field_id: relation.fieldId, // field_id (UUID) of the foreign key field
                  fk_field: relatedField.name, // name of the related field (e.g., "AccountId")
                  fk_object: relation.relatedObjectName || relation.relatedObjectId, // name of the related object (stored when selected)
                  fk_system: selectedSystem.type, // system type (e.g., "source", "target")
                  is_fk: 'true',
                  is_pk: null,
                  is_unique: null,
                }
              };

              console.log('Foreign Key Update Payload:', payload);
              await updateFieldMetadata(payload).unwrap();

              // Mark this relation as completed
              setForeignKeyRelations(prev => prev.map(r =>
                r.fieldId === relation.fieldId ? { ...r, completed: true } : r
              ));

              setSnackbar({
                open: true,
                message: `Foreign key relation updated successfully for ${selectedField.name}`,
                severity: 'success',
              });
            }
          } catch (error: any) {
            console.error('Failed to update foreign key metadata:', error);
            setSnackbar({
              open: true,
              message: `Failed to update foreign key relation: ${error?.data?.message || error?.message || 'Unknown error'}`,
              severity: 'error',
            });
          }
        }
      }
    }, 1000); // 1 second debounce

    return () => {
      if (foreignKeyUpdateTimeoutRef.current) {
        clearTimeout(foreignKeyUpdateTimeoutRef.current);
      }
    };
  }, [foreignKeyRelations, selectedObject?.object_id]); // Only depend on relations and object ID

  // Update lookup relations when all fields are selected (debounced)
  const lookupUpdateTimeoutRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (lookupUpdateTimeoutRef.current) {
      clearTimeout(lookupUpdateTimeoutRef.current);
    }

    lookupUpdateTimeoutRef.current = setTimeout(async () => {
      for (const relation of lookupRelations) {
        if (relation.fieldId && relation.lookupSystemId && relation.lookupObjectId &&
            relation.lookupJoinFieldId && relation.lookupFetchFieldIds.length > 0 && !relation.completed) {
          try {
            const selectedField = metadataFields.find(f => f.field_id === relation.fieldId);
            const selectedSystem = systems.find(s => s.id === relation.lookupSystemId);
            const lookupJoinField = currentLookupObjectMetadata.find(f => f.field_id === relation.lookupJoinFieldId);
            const lookupFetchFields = relation.lookupFetchFieldIds.map(fieldId =>
              currentLookupObjectMetadata.find(f => f.field_id === fieldId)
            ).filter(Boolean);

            if (selectedField && selectedSystem && lookupJoinField && lookupFetchFields.length > 0) {
              const lookupData = {
                id: relation.id || null,
                source_field: selectedField.name,
                source_object: selectedObject?.object_id || '',
                lookup_system: relation.lookupSystemId,
                lookup_object: relation.lookupObjectId,
                lookup_join_field: lookupJoinField.name,
                lookup_fetch_field: lookupFetchFields.map(f => f!.name),
                default_value: "String",
                tenant_key: user?.tenant_id || "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                created_by: null,
                created_date: null,
                modified_by: null,
                modified_date: null,
              };

              console.log('Lookup Relation Update Payload:', lookupData);

              if (relation.id) {
                // Update existing relation
                await updateLookupRelation(lookupData).unwrap();
              } else {
                // Create new relation
                await createLookupRelation(lookupData).unwrap();
              }

              // Mark this relation as completed
              setLookupRelations(prev => prev.map(r =>
                r.fieldId === relation.fieldId ? { ...r, completed: true } : r
              ));

              setSnackbar({
                open: true,
                message: `Lookup relation updated successfully for ${selectedField.name}`,
                severity: 'success',
              });
            }
          } catch (error: any) {
            console.error('Failed to update lookup relation:', error);
            setSnackbar({
              open: true,
              message: `Failed to update lookup relation: ${error?.data?.message || error?.message || 'Unknown error'}`,
              severity: 'error',
            });
          }
        }
      }
    }, 1000); // 1 second debounce

    return () => {
      if (lookupUpdateTimeoutRef.current) {
        clearTimeout(lookupUpdateTimeoutRef.current);
      }
    };
  }, []); // Disabled - using manual save instead

  // Update primary key metadata only when changed from last saved value (debounced)
  // OPTIMIZATION: Removed metadataFields from dependencies to prevent unnecessary API calls
  // when metadata is refetched but primary key hasn't changed
  const primaryKeyUpdateTimeoutRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!hasInitializedRef.current || selectedPrimaryKey === lastSavedPrimaryKeyRef.current) {
      return;
    }

    if (primaryKeyUpdateTimeoutRef.current) {
      clearTimeout(primaryKeyUpdateTimeoutRef.current);
    }

    primaryKeyUpdateTimeoutRef.current = setTimeout(async () => {
      if (selectedPrimaryKey && selectedObject?.object_id) {
        const selectedField = metadataFields.find(f => f.name === selectedPrimaryKey);
        if (selectedField) {
          try {
            console.log('Primary Key Update:', {
              from: lastSavedPrimaryKeyRef.current,
              to: selectedPrimaryKey,
              fieldId: selectedField.field_id
            });

            await updateFieldMetadata({
              objectId: selectedObject.object_id,
              fieldId: selectedField.field_id,
              updates: {
                field_id: selectedField.field_id,
                fk_field: null,
                fk_object: null,
                fk_system: null,
                is_fk: null,
                is_pk: 'true',
                is_unique: null,
              }
            }).unwrap();

            // Update last saved value on success
            lastSavedPrimaryKeyRef.current = selectedPrimaryKey;

            setSnackbar({
              open: true,
              message: `Primary key updated successfully for ${selectedField.name}`,
              severity: 'success',
            });
          } catch (error: any) {
            console.error('Failed to update primary key metadata:', error);
            setSnackbar({
              open: true,
              message: `Failed to update primary key: ${error?.data?.message || error?.message || 'Unknown error'}`,
              severity: 'error',
            });
          }
        }
      }
    }, 1000); // 1 second debounce

    return () => {
      if (primaryKeyUpdateTimeoutRef.current) {
        clearTimeout(primaryKeyUpdateTimeoutRef.current);
      }
    };
  }, [selectedPrimaryKey, selectedObject?.object_id]); // Only depend on actual values that matter

  // Update unique key metadata only when changed from initial values (debounced)
  // OPTIMIZATION: Removed metadataFields from dependencies to prevent unnecessary API calls
  // when metadata is refetched but unique keys haven't changed
  const uniqueKeyUpdateTimeoutRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!hasInitializedRef.current || JSON.stringify(uniqueKeyFields.sort()) === JSON.stringify(initialUniqueKeysRef.current.sort())) {
      return;
    }

    if (uniqueKeyUpdateTimeoutRef.current) {
      clearTimeout(uniqueKeyUpdateTimeoutRef.current);
    }

    uniqueKeyUpdateTimeoutRef.current = setTimeout(async () => {
      // Clear existing unique keys that are no longer selected
      const removedFields = initialUniqueKeysRef.current.filter(name => !uniqueKeyFields.includes(name));
      for (const fieldName of removedFields) {
        const field = metadataFields.find(f => f.name === fieldName);
        if (field) {
          try {
            await updateFieldMetadata({
              objectId: selectedObject!.object_id,
              fieldId: field.field_id,
              updates: {
                field_id: field.field_id,
                is_unique: null,
              }
            }).unwrap();
          } catch (error) {
            console.error('Failed to clear unique key metadata:', error);
          }
        }
      }

      // Set new unique keys
      const addedFields = uniqueKeyFields.filter(name => !initialUniqueKeysRef.current.includes(name));
      for (const fieldName of addedFields) {
        if (fieldName && selectedObject?.object_id) {
          const selectedField = metadataFields.find(f => f.name === fieldName);
          if (selectedField) {
            try {
              await updateFieldMetadata({
                objectId: selectedObject.object_id,
                fieldId: selectedField.field_id,
                updates: {
                  field_id: selectedField.field_id,
                  fk_field: null,
                  fk_object: null,
                  fk_system: null,
                  is_fk: null,
                  is_pk: null,
                  is_unique: 'true',
                }
              }).unwrap();

              setSnackbar({
                open: true,
                message: `Unique key updated successfully for ${selectedField.name}`,
                severity: 'success',
              });
            } catch (error: any) {
              console.error('Failed to update unique key metadata:', error);
              setSnackbar({
                open: true,
                message: `Failed to update unique key: ${error?.data?.message || error?.message || 'Unknown error'}`,
                severity: 'error',
              });
            }
          }
        }
      }

      // Update refs
      initialUniqueKeysRef.current = [...uniqueKeyFields];
    }, 1000); // 1 second debounce

    return () => {
      if (uniqueKeyUpdateTimeoutRef.current) {
        clearTimeout(uniqueKeyUpdateTimeoutRef.current);
      }
    };
  }, [uniqueKeyFields, selectedObject?.object_id]); // Only depend on actual values that matter

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Analyze and Define Keys and Relationship
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Loading metadata...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Analyze and Define Keys and Relationship
        </Typography>
        <ToggleButton
          activity="Relationship"
          disabled={getCompletionStatus('Mapping')}
        />
      </Box>

      {/* Primary Key Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Primary Key
        </Typography>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Primary Key Field</InputLabel>
          <Select
            value={selectedPrimaryKey}
            onChange={(e) => setSelectedPrimaryKey(e.target.value)}
            label="Select Primary Key Field"
          >
            {metadataFields.map((field, index) => (
              <MenuItem key={field.name || field.field_id || `field-${index}`} value={field.name}>
                {field.label} ({field.name}) - {field.datatype}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Unique Key Fields Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Unique Key Fields
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddUniqueField}
            disabled={uniqueKeyFields.some(field => field === '') || isReadOnly}
            title={uniqueKeyFields.some(field => field === '') ? 'Complete the current unique key field first' : 'Add another unique key field'}
          >
            Add Field
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {uniqueKeyFields.map((selectedField, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Unique Field {index + 1}</InputLabel>
                <Select
                  value={selectedField}
                  onChange={(e) => handleUniqueFieldChange(index, e.target.value)}
                  label={`Select Unique Field ${index + 1}`}
                  disabled={!!selectedField && metadataFields.find(f => f.name === selectedField)?.is_unique === 'true'}
                >
                  {getAvailableUniqueFields(index).map((field, fieldIndex) => (
                    <MenuItem key={field.name || field.field_id || `unique-field-${index}-${fieldIndex}`} value={field.name}>
                      {field.label} ({field.name}) - {field.datatype}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {uniqueKeyFields.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => handleRemoveUniqueField(index)}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Foreign Key Relations Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Foreign Key Relations
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddForeignKeyRelation}
            disabled={foreignKeyRelations.some(relation => !relation.completed) || isReadOnly}
            title={foreignKeyRelations.some(relation => !relation.completed) ? 'Complete the current foreign key relation first' : 'Add another foreign key relation'}
          >
            Add Field
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {foreignKeyRelations.map((relation, index) => (
            <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Foreign Key Relation {index + 1}
                </Typography>
                {foreignKeyRelations.length > 1 && (
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleRemoveForeignKeyRelation(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Foreign Key Field - Always visible */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Foreign Key Field</InputLabel>
                    <Select
                      value={relation.fieldId}
                      onChange={(e) => handleForeignKeyChange(index, 'fieldId', e.target.value)}
                      label="Foreign Key Field"
                      disabled={relation.completed}
                    >
                      {metadataFields.map((field, fieldIndex) => (
                        <MenuItem key={field.field_id || field.name || `field-${fieldIndex}`} value={field.field_id}>
                          {field.label} ({field.name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* System - Show only after field is selected */}
                {relation.fieldId && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>System</InputLabel>
                      <Select
                        value={relation.systemId}
                        onChange={(e) => handleForeignKeyChange(index, 'systemId', e.target.value)}
                        label="System"
                        disabled={relation.completed}
                      >
                        {systems.map((system) => (
                          <MenuItem key={system.id} value={system.id}>
                            {system.name} ({system.type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Related Object - Show only after system is selected */}
                {relation.fieldId && relation.systemId && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small" disabled={relation.completed}>
                      <InputLabel>Related Object</InputLabel>
                      <Select
                        value={relation.relatedObjectId}
                        onChange={(e) => handleForeignKeyChange(index, 'relatedObjectId', e.target.value)}
                        label="Related Object"
                        disabled={relation.completed}
                      >
                        {relation.completed || relation.systemId === currentSelectedSystem ? (
                          relation.completed ? (
                            // For completed relations, show the selected object
                            <MenuItem value={relation.relatedObjectId}>
                              {relation.relatedObjectName || relation.relatedObjectId}
                            </MenuItem>
                          ) : (
                            // For active relations, show current system objects
                            currentSystemObjects.map((object: any) => (
                              <MenuItem key={object.object_id} value={object.object_id}>
                                {object.name}
                              </MenuItem>
                            ))
                          )
                        ) : (
                          <MenuItem value="" disabled>
                            Select a system first
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Related Field - Show only after related object is selected */}
                {relation.fieldId && relation.systemId && relation.relatedObjectId && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small" disabled={relation.completed}>
                      <InputLabel>Related Field</InputLabel>
                      <Select
                        value={relation.relatedFieldId}
                        onChange={(e) => handleForeignKeyChange(index, 'relatedFieldId', e.target.value)}
                        label="Related Field"
                        disabled={relation.completed}
                      >
                        {relation.completed || relation.relatedObjectId === currentSelectedRelatedObject ? (
                          relation.completed ? (
                            // For completed relations, show the selected field
                            <MenuItem value={relation.relatedFieldId}>
                              {relation.relatedFieldName || relation.relatedFieldId}
                            </MenuItem>
                          ) : (
                            // For active relations, show current related object fields
                            currentRelatedObjectMetadata.map((field, fieldIndex) => (
                              <MenuItem key={field.field_id || field.name || `related-field-${fieldIndex}`} value={field.field_id}>
                                {field.label} ({field.name})
                              </MenuItem>
                            ))
                          )
                        ) : (
                          <MenuItem value="" disabled>
                            Select a related object first
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))}
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Lookup Relations Section */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Lookup Relations
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddLookupRelation}
            disabled={lookupRelations.some(relation => !relation.completed) || isReadOnly}
            title={lookupRelations.some(relation => !relation.completed) ? 'Complete the current lookup relation first' : 'Add another lookup relation'}
          >
            Add Field
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {lookupRelations.map((relation, index) => (
            <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Lookup Relation {index + 1}
                  {relation.completed && (
                    <CheckCircleIcon sx={{ ml: 1, color: 'success.main', fontSize: '1rem' }} />
                  )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!relation.completed && (
                    <IconButton
                      color="success"
                      size="small"
                      onClick={() => handleSaveLookupRelation(index)}
                      title="Save lookup relation"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  {lookupRelations.length > 1 && (
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveLookupRelation(index)}
                      disabled={relation.completed}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                {/* Source Field - Always visible */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Source Field</InputLabel>
                    <Select
                      value={relation.fieldId}
                      onChange={(e) => handleLookupChange(index, 'fieldId', e.target.value)}
                      label="Source Field"
                      disabled={relation.completed}
                    >
                      {metadataFields.map((field, fieldIndex) => (
                        <MenuItem key={field.field_id || field.name || `field-${fieldIndex}`} value={field.field_id}>
                          {field.label} ({field.name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Lookup System - Show only after source field is selected */}
                {relation.fieldId && (
                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Lookup System</InputLabel>
                      <Select
                        value={relation.lookupSystemId}
                        onChange={(e) => handleLookupChange(index, 'lookupSystemId', e.target.value)}
                        label="Lookup System"
                        disabled={relation.completed}
                      >
                        {systems.map((system) => (
                          <MenuItem key={system.id} value={system.id}>
                            {system.name} ({system.type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Lookup Object - Show only after lookup system is selected */}
                {relation.fieldId && relation.lookupSystemId && (
                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small" disabled={relation.completed}>
                      <InputLabel>Lookup Object</InputLabel>
                      <Select
                        value={relation.lookupObjectId}
                        onChange={(e) => handleLookupChange(index, 'lookupObjectId', e.target.value)}
                        label="Lookup Object"
                        disabled={relation.completed}
                      >
                        {relation.completed || relation.lookupSystemId === currentSelectedLookupSystem ? (
                          relation.completed ? (
                            // For completed relations, show the selected object
                            <MenuItem value={relation.lookupObjectId}>
                              {relation.lookupObjectName || relation.lookupObjectId}
                            </MenuItem>
                          ) : (
                            // For active relations, show current system objects
                            currentLookupSystemObjects.map((object: any) => (
                              <MenuItem key={object.object_id} value={object.object_id}>
                                {object.name}
                              </MenuItem>
                            ))
                          )
                        ) : (
                          <MenuItem value="" disabled>
                            Select a lookup system first
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Lookup Join Field - Show only after lookup object is selected */}
                {relation.fieldId && relation.lookupSystemId && relation.lookupObjectId && (
                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small" disabled={relation.completed}>
                      <InputLabel>Lookup Join Field</InputLabel>
                      <Select
                        value={relation.lookupJoinFieldId}
                        onChange={(e) => handleLookupChange(index, 'lookupJoinFieldId', e.target.value)}
                        label="Lookup Join Field"
                        disabled={relation.completed}
                      >
                        {relation.completed || relation.lookupObjectId === currentSelectedLookupObject ? (
                          relation.completed ? (
                            // For completed relations, show the selected field
                            <MenuItem value={relation.lookupJoinFieldId}>
                              {relation.lookupJoinFieldName || relation.lookupJoinFieldId}
                            </MenuItem>
                          ) : (
                            // For active relations, show current lookup object fields
                            currentLookupObjectMetadata.map((field, fieldIndex) => (
                              <MenuItem key={field.field_id || field.name || `lookup-field-${fieldIndex}`} value={field.field_id}>
                                {field.label} ({field.name})
                              </MenuItem>
                            ))
                          )
                        ) : (
                          <MenuItem value="" disabled>
                            Select a lookup object first
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* Lookup Fetch Fields - Show only after lookup join field is selected */}
                {relation.fieldId && relation.lookupSystemId && relation.lookupObjectId && relation.lookupJoinFieldId && (
                  <Grid item xs={12} sm={6} md={2.4}>
                    <FormControl fullWidth size="small" disabled={relation.completed}>
                      <InputLabel>Lookup Fetch Fields</InputLabel>
                      {relation.completed ? (
                        // For completed relations, show selected fields as text
                        <TextField
                          value={relation.lookupFetchFieldNames?.join(', ') || ''}
                          label="Lookup Fetch Fields"
                          disabled
                          size="small"
                        />
                      ) : (
                        // For active relations, show multi-select dropdown
                        <Select
                          multiple
                          value={relation.lookupFetchFieldIds}
                          onChange={(e) => handleLookupChange(index, 'lookupFetchFieldIds', e.target.value)}
                          label="Lookup Fetch Fields"
                          renderValue={(selected) => {
                            const selectedNames = selected.map(fieldId => {
                              const field = currentLookupObjectMetadata.find(f => f.field_id === fieldId);
                              return field?.label || field?.name || fieldId;
                            });
                            return selectedNames.join(', ');
                          }}
                        >
                          {currentLookupObjectMetadata.map((field, fieldIndex) => (
                            <MenuItem key={field.field_id || field.name || `lookup-fetch-field-${fieldIndex}`} value={field.field_id}>
                              <Checkbox
                                checked={relation.lookupFetchFieldIds.indexOf(field.field_id) > -1}
                                size="small"
                              />
                              {field.label} ({field.name})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
