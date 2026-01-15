

// components/migration/tabs/FilterTab.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useGetFilterDataQuery } from '../../../services/filterApi';
import type { FilterDataRecord } from '../../../types';
import { ToggleButton } from '../ToggleButton';
import { useActivity } from '../ActivityProvider';
import { FilterColumnsSlideIn } from './FilterColumnsSlideIn';
import { FilterRowsSlideIn } from './FilterRowsSlideIn';

export const FilterTab: React.FC = () => {
   const { selectedObject } = useSelector((state: RootState) => state.migration);
   const { selectedEnvironment } = useSelector((state: RootState) => state.app);
   const { getReadOnlyFlag, getCompletionStatus, getActivityStatus } = useActivity();
   const [page, setPage] = useState(0);
   const [rowsPerPage, setRowsPerPage] = useState(10);
   const [searchTerm, setSearchTerm] = useState('');
   const tableRef = useRef<HTMLDivElement>(null);
   const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
   const [filterColumnsOpen, setFilterColumnsOpen] = useState(false);
   const [filterRowsOpen, setFilterRowsOpen] = useState(false);
   const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
   const [rowFilters, setRowFilters] = useState<{[key: string]: string}>({});
   const [originalAllColumns, setOriginalAllColumns] = useState<string[]>([]);

  const isReadOnly = getReadOnlyFlag('Filter') || getCompletionStatus('Mapping');
  const isMappingCompleted = getCompletionStatus('Mapping');

  const {
    data: filterData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useGetFilterDataQuery(
    {
      objectId: selectedObject?.object_id || '',
      environmentId: selectedEnvironment?.id,
      page: page + 1,
      limit: rowsPerPage,
    },
    { skip: !selectedObject?.object_id || !selectedEnvironment?.id }
  );

  // Reset state and refetch data when object or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      setPage(0);
      setSearchTerm('');
      setHighlightedRow(null);
      setVisibleColumns(new Set()); // Reset visible columns
      setRowFilters({}); // Reset row filters
      setOriginalAllColumns([]); // Reset original columns
      setFilterColumnsOpen(false); // Reset slide-in states
      setFilterRowsOpen(false);
      refetch();
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, refetch]);

  // Refresh activity status when tab is accessed or environment changes
  useEffect(() => {
    if (selectedObject?.object_id && selectedEnvironment?.id) {
      getActivityStatus(selectedObject.object_id);
    }
  }, [selectedObject?.object_id, selectedEnvironment?.id, getActivityStatus]);

  // Auto-scroll to highlighted row
  useEffect(() => {
    if (highlightedRow !== null && tableRef.current) {
      const rowElement = tableRef.current.querySelector(`[data-row-index="${highlightedRow}"]`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedRow]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setHighlightedRow(null);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setHighlightedRow(null);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    if (term && filterData?.contents) {
      // Find the first row that contains the search term in any column
      const foundIndex = filterData.contents.findIndex((record: FilterDataRecord) =>
        record && Object.values(record).some((value) =>
          value != null && value.toString().toLowerCase().includes(term)
        )
      );

      if (foundIndex !== -1) {
        setHighlightedRow(foundIndex);
      } else {
        setHighlightedRow(null);
      }
    } else {
      setHighlightedRow(null);
    }
  };

  const handleRefresh = () => {
    refetch();
    setSearchTerm('');
    setHighlightedRow(null);
  };

  // Process data - must be before early returns to maintain hook order
  const records = filterData?.contents || [];
  const allColumns = React.useMemo(() =>
    records.length > 0 ? Object.keys(records[0]) : [],
    [records]
  );
  const columns = React.useMemo(() =>
    allColumns.filter(col => visibleColumns.has(col)),
    [allColumns, visibleColumns]
  );

  // Filter records based on row filters and search term
  const baseRecords = filterData?.contents || [];
  const rowFilteredRecords = baseRecords.filter((record: FilterDataRecord) => {
    return Object.keys(rowFilters).every(column => {
      const filterValue = rowFilters[column];
      if (!filterValue) return true;
      const recordValue = record[column]?.toString() || '';

      // Check if it's a date range filter (start-end)
      if (filterValue.includes('-')) {
        const [start, end] = filterValue.split('-');
        if (start && end) {
          // Assume recordValue is a date string
          return recordValue >= start && recordValue <= end;
        } else if (start) {
          return recordValue >= start;
        } else if (end) {
          return recordValue <= end;
        }
      }

      // Default string includes check
      return recordValue.toLowerCase().includes(filterValue.toLowerCase());
    });
  });
  const filteredRecords = rowFilteredRecords;

  // Initialize visible columns when data loads
  useEffect(() => {
    if (allColumns.length > 0 && visibleColumns.size === 0) {
      setVisibleColumns(new Set(allColumns));
    }
  }, [allColumns, visibleColumns.size]);

  // Initialize original all columns when data loads
  useEffect(() => {
    if (allColumns.length > 0 && originalAllColumns.length === 0) {
      setOriginalAllColumns(allColumns);
    }
  }, [allColumns, originalAllColumns.length]);

  // Highlight text in cells that match search term
  const highlightText = (text: string | number | null | undefined, searchTerm: string) => {
    if (!searchTerm || text == null) return text?.toString() || '-';

    const textStr = text.toString();
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = textStr.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (!selectedObject) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Filtering
        </Typography>
        <Alert severity="info">
          Please select an object to view filter data.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Filtering - {selectedObject.object_name}
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
          Data Filtering - {selectedObject.object_name}
        </Typography>
        <Alert severity="error">
          Failed to load filter data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Data Filtering - {selectedObject.object_name}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
           <ToggleButton
             activity="Filter"
             disabled={getCompletionStatus('Mapping')}
           />

           {/* Filter Columns Button */}
           <Button
             variant="outlined"
             size="small"
             onClick={() => setFilterColumnsOpen(true)}
             disabled={isReadOnly || !selectedObject?.object_id}
           >
             Filter Columns
           </Button>

           {/* Filter Rows Button */}
           <Button
             variant="outlined"
             size="small"
             onClick={() => setFilterRowsOpen(true)}
             disabled={isReadOnly}
           >
             Filter Rows
           </Button>

           {/* Search Bar */}
           <TextField
             size="small"
             placeholder="Search in data..."
             value={searchTerm}
             onChange={handleSearch}
             InputProps={{
               startAdornment: (
                 <InputAdornment position="start">
                   <SearchIcon />
                 </InputAdornment>
               ),
             }}
             sx={{ minWidth: { xs: '200px', sm: '250px' } }}
           />

           {/* Refresh Button */}
           <Tooltip title="Refresh data">
             <span>
               <IconButton
                 onClick={handleRefresh}
                 disabled={isFetching || isReadOnly}
                 color="primary"
               >
                 <RefreshIcon />
               </IconButton>
             </span>
           </Tooltip>
         </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        View and search through filtered data for {selectedObject.object_name}.
        Use the search bar to find specific values - matching text will be highlighted and the row will auto-scroll into view.
      </Typography>

      {/* Summary Statistics */}
      {filterData && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={`File: ${filterData.filename}`}
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Total Records: ${filterData.total_records}`}
            variant="outlined"
            color="primary"
          />
          <Chip
            label={`Current Page: ${filterData.page}`}
            variant="outlined"
            color="secondary"
          />
          <Chip
            label={`Total Pages: ${filterData.total_pages}`}
            variant="outlined"
          />
          <Chip
            label={`Page Size: ${filterData.page_size}`}
            variant="outlined"
          />
          <Chip
            label={`Showing: ${records.length} records`}
            variant="filled"
            color="info"
          />
          {searchTerm && (
            <Chip
              label={`Search: "${searchTerm}"`}
              variant="filled"
              color="warning"
            />
          )}
        </Box>
      )}

      {/* Data Table */}
      <TableContainer component={Paper} elevation={2} ref={tableRef} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} aria-label="filter data table" size="small">
          <TableHead sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
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
            {records.map((record: FilterDataRecord, index: number) => (
              <TableRow
                key={index}
                data-row-index={index}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  ...(highlightedRow === index && {
                    backgroundColor: '#fff3cd',
                    border: '2px solid #ffc107',
                  }),
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      width: '200px',
                      wordWrap: 'break-word'
                    }}
                    title={record[column]?.toString() || '-'}
                  >
                    {highlightText(record[column], searchTerm)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>

      {/* Pagination */}
      {filterData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filterData.total_records}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        </Box>
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
            No filter data found for this object.
          </Typography>
        </Paper>
      )}

      {/* Filter Columns Slide-in */}
      <FilterColumnsSlideIn
        open={filterColumnsOpen}
        onClose={() => setFilterColumnsOpen(false)}
        allColumns={allColumns}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        objectId={selectedObject?.object_id || ''}
        refetch={refetch}
      />

      {/* Filter Rows Slide-in */}
      <FilterRowsSlideIn
        open={filterRowsOpen}
        onClose={() => setFilterRowsOpen(false)}
        objectId={selectedObject?.object_id || ''}
        rowFilters={rowFilters}
        onRowFiltersChange={setRowFilters}
      />
    </Box>
  );
};
