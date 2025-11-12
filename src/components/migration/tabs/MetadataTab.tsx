// components/migration/tabs/MetadataTab.tsx
import React, { useState, useMemo, useCallback } from 'react';
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
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { 
  useGetMappedTargetObjectQuery, 
  useGetObjectMetadataQuery,
  useUpdateFieldMetadataMutation // UPDATE: Import the mutation
} from '../../../services/metadataApi';

import type { MetadataField } from '../../../types';
import { MetadataEditorSlideIn } from '../../metadata/MetadataEditorSlidein';

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
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filterField, setFilterField] = useState('all');
  const [selectedField, setSelectedField] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rawDataDialogOpen, setRawDataDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<MetadataField | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // UPDATE: Add the update mutation
  const [updateFieldMetadata, { isLoading: isUpdating }] = useUpdateFieldMetadataMutation();

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
    data: sourceMetadata = [],
    isLoading: isLoadingSourceMetadata,
    error: sourceMetadataError,
    refetch: refetchSourceMetadata, // UPDATE: Get refetch function
  } = useGetObjectMetadataQuery(selectedObject?.object_id || '', {
    skip: !selectedObject?.object_id,
  });

  // Get target metadata with refetch capability
  const {
    data: targetMetadata = [],
    isLoading: isLoadingTargetMetadata,
    error: targetMetadataError,
    refetch: refetchTargetMetadata, // UPDATE: Get refetch function
  } = useGetObjectMetadataQuery(mappedObject?.id || '', {
    skip: !mappedObject?.id,
  });

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

  // Filter and search logic
  const filteredMetadata = useMemo(() => {
    const metadata = activeTab === 0 ? sourceMetadata : targetMetadata;
    
    return metadata.filter((field) => {
      const matchesSearch = searchTerm === '' || 
        Object.values(field).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesFilter = filterField === 'all' || 
        (filterField === 'primary_key' && field.is_pk === 'true') ||
        (filterField === 'foreign_key' && field.is_fk === 'true') ||
        (filterField === 'required' && field.is_required === 'true') ||
        (filterField === 'unique' && field.is_unique === 'true') ||
        (filterField === 'for_migration' && field.for_migrate === 'true');

      return matchesSearch && matchesFilter;
    });
  }, [sourceMetadata, targetMetadata, activeTab, searchTerm, filterField]);

  // Pagination
  const paginatedMetadata = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMetadata.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMetadata, page, rowsPerPage]);

  // Highlight search term in text
  const highlightText = useCallback((text: string, search: string) => {
    if (!search || !text) return text;
    
    const parts = text.toString().split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  }, []);

  // Get current metadata for raw data view
  const currentMetadata = activeTab === 0 ? sourceMetadata : targetMetadata;

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
      <Paper elevation={1}>
        <TableContainer sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '200px' }}>Field Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '150px' }}>Label</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Data Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Length</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Properties</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: '150px' }}>Sample Value</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Data Quality</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metadata.map((field) => (
                <TableRow 
                  key={field.id}
                  onClick={() => {
                    setSelectedRowId(field.id);
                    setEditingField(field);
                    setEditorOpen(true);
                  }}
                  sx={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedRowId === field.id ? 'action.selected' : 'inherit',
                    '&:hover': { 
                      backgroundColor: selectedRowId === field.id ? 'action.selected' : 'action.hover' 
                    },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell>
                    {highlightText(field.id.toString(), searchTerm)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {highlightText(field.name, searchTerm)}
                  </TableCell>
                  <TableCell>
                    {highlightText(field.label || '-', searchTerm)}
                  </TableCell>
                  <TableCell>
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
                  <TableCell>
                    {field.max_length || field.length || '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {field.is_pk === 'true' && (
                        <Chip label="PK" size="small" color="primary" variant="filled" />
                      )}
                      {field.is_fk === 'true' && (
                        <Chip label="FK" size="small" color="secondary" variant="filled" />
                      )}
                      {field.is_required === 'true' && (
                        <Chip label="Required" size="small" color="error" variant="outlined" />
                      )}
                      {field.is_unique === 'true' && (
                        <Chip label="Unique" size="small" color="warning" variant="outlined" />
                      )}
                      {field.for_migrate === 'true' && (
                        <Chip label="For Mig" size="small" color="success" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {highlightText(field.sample_value || '-', searchTerm)}
                  </TableCell>
                  <TableCell>
                    {field.data_quality && field.data_quality !== '0' ? (
                      <Chip 
                        label={`${parseFloat(field.data_quality).toFixed(1)}%`}
                        size="small"
                        color={
                          parseFloat(field.data_quality) > 90 ? 'success' :
                          parseFloat(field.data_quality) > 70 ? 'warning' : 'error'
                        }
                        variant="filled"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
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
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[25, 50, 100, 200]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{
            borderTop: 1,
            borderColor: 'divider'
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
    <Box>
      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message="Field metadata updated successfully!"
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Metadata Management
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            View and manage metadata for {selectedObject?.object_name}
          </Typography>
        </Box>
        
        <Tooltip title="View raw API data">
          <IconButton 
            onClick={handleViewRawData}
            color="primary"
            sx={{ border: 1, borderColor: 'primary.main' }}
          >
            <CodeIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* System Information Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
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
                <strong>Fields:</strong> {sourceMetadata.length}
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
        
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
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
                    <strong>Fields:</strong> {targetMetadata.length}
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

      {/* Tabs for Source/Target */}
      <Paper elevation={1} sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
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
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search across all field properties..."
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
          sx={{ minWidth: 300, flexGrow: 1 }}
          size="small"
        />
        
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
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <MetadataTable
          metadata={paginatedMetadata}
          isLoading={isLoadingSourceMetadata}
          error={sourceMetadataError}
          searchTerm={searchTerm}
          highlightText={highlightText}
          totalCount={filteredMetadata.length}
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
            totalCount={filteredMetadata.length}
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
            Total Fields: {currentMetadata.length}
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
                  {JSON.stringify(currentMetadata, null, 2)}
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