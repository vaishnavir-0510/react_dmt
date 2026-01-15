// components/migration/tabs/TransformTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  Chip,
} from '@mui/material';
import {
  PlayArrow as TransformIcon,
  List as RuleListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetTransformDataQuery } from '../../../services/transformApi';
import { TransformSlideIn } from './TransformSlideIn';
import { TransformRuleTimelineSlideIn } from './TransformRuleTimelineSlideIn';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';


export const TransformTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);
  const { selectedEnvironment } = useSelector((state: RootState) => state.app);
  const { getReadOnlyFlag, getActivityStatus } = useActivity();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transformSlideInOpen, setTransformSlideInOpen] = useState(false);
  const [ruleTimelineSlideInOpen, setRuleTimelineSlideInOpen] = useState(false);
  const [taskMap, setTaskMap] = useState<Record<string, string>>({});
  
  const {
    data: transformData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useGetTransformDataQuery(
    {
      objectId: selectedObject?.object_id || '',
      environmentId: selectedEnvironment?.id,
      page: page + 1,
      pageSize: rowsPerPage
    },
    { skip: !selectedObject?.object_id || !selectedEnvironment?.id }
  );

  // Reset state and refetch data when object or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      setPage(0); // Reset to first page when object or environment changes
      setRowsPerPage(10);
      setTransformSlideInOpen(false);
      setTaskMap({});
      refetch();
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, refetch]);

  // Refresh activity status when tab is accessed or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      getActivityStatus(selectedObject.object_id);
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, getActivityStatus]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleTransform = () => {
    setTransformSlideInOpen(true);
  };

  const handleShowRuleList = () => {
    setRuleTimelineSlideInOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCloseTransformSlideIn = () => {
    setTransformSlideInOpen(false);
  };

  const handleCloseRuleTimelineSlideIn = () => {
    setRuleTimelineSlideInOpen(false);
  };

  const handleTaskStarted = (objectId: string, taskId: string) => {
    setTaskMap(prev => ({
      ...prev,
      [objectId]: taskId
    }));
  };

  if (!selectedObject) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Transformation
        </Typography>
        <Alert severity="info">
          Please select an object to view transformation data.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Transformation - {selectedObject.object_name}
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Transformation - {selectedObject.object_name}
        </Typography>
        <Alert severity="error">
          Failed to load transformation data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const records = transformData?.data || [];
  const columns = records.length > 0 ? Object.keys(records[0]) : [];

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Transformation - {selectedObject.object_name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButton
            activity="Transform"
            disabled={false}
          />

          {/* Rule List Button */}
          <Tooltip title="View transformation rules">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RuleListIcon />}
              onClick={handleShowRuleList}
              disabled={getReadOnlyFlag('Transform')}
              sx={{ minWidth: '140px' }}
            >
              Rule List
            </Button>
          </Tooltip>

          {/* Transform Button */}
          <Tooltip title="Execute data transformation">
            <Button
              variant="contained"
              color="primary"
              startIcon={<TransformIcon />}
              onClick={handleTransform}
              disabled={getReadOnlyFlag('Transform')}
              sx={{ minWidth: '140px' }}
            >
              Transform
            </Button>
          </Tooltip>

          {/* Refresh Button */}
          <Tooltip title="Refresh data">
            <IconButton
              onClick={handleRefresh}
              disabled={isFetching || getReadOnlyFlag('Transform')}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Define and execute data transformation rules for {selectedObject.object_name}. 
        Preview the data below before applying transformations.
      </Typography>

      {/* Summary Statistics */}
      {transformData && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={`Total Records: ${transformData.total_records}`}
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Current Page: ${transformData.page}`}
            variant="outlined"
            color="secondary"
          />
          <Chip
            label={`Total Pages: ${transformData.total_pages}`}
            variant="outlined"
          />
          <Chip
            label={`Page Size: ${rowsPerPage}`}
            variant="outlined"
          />
          <Chip
            label={`Showing: ${records.length} records`}
            variant="filled"
            color="info"
          />
        </Box>
      )}

      {/* Data Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }} aria-label="transformation data table" size="small">
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
            {records.map((record, index) => (
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

      {/* Pagination */}
      {transformData && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={transformData.total_records}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ mt: 2 }}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      )}

      {/* Loading indicator for pagination */}
      {isFetching && (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading data...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {records.length === 0 && !isLoading && (
        <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" textAlign="center" color="text.secondary">
            No transformation data found for this object.
          </Typography>
        </Paper>
      )}

      {/* Transform Slide-in Modal */}
      {selectedObject && (
        <TransformSlideIn
          open={transformSlideInOpen}
          onClose={handleCloseTransformSlideIn}
          objectId={selectedObject.object_id}
          objectName={selectedObject.object_name}
          onTaskStarted={handleTaskStarted}
          taskMap={taskMap}
        />
      )}

      {/* Transform Rule Timeline Slide-in Modal */}
      {selectedObject && (
        <TransformRuleTimelineSlideIn
          open={ruleTimelineSlideInOpen}
          onClose={handleCloseRuleTimelineSlideIn}
          objectId={selectedObject.object_id}
          objectName={selectedObject.object_name}
        />
      )}
    </Box>
  );
};