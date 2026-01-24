import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  LinearProgress,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  Stack,
  TextField,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useGetTranslationComparisonQuery, useUpdateTranslationMutation } from '../../services/translationApi';

interface TranslationResultsProps {
  translation: {
    translatedFileId: string;
    targetLanguage: string;
    totalKeys: number;
    successfulTranslations: number;
    avgConfidence: number;
  };
}

const TranslationResults: React.FC<TranslationResultsProps> = ({ translation }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');

  const { data: comparisonData, isLoading, error } = useGetTranslationComparisonQuery({
    translatedFileId: translation.translatedFileId,
    page: currentPage,
    pageSize: pageSize,
  });

  const [updateTranslation] = useUpdateTranslationMutation();

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (event: any) => {
    setPageSize(event.target.value);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleEditClick = (key: string, currentText: string) => {
    setEditingKey(key);
    setEditedText(currentText);
  };

  const handleSaveClick = async (key: string) => {
    try {
      await updateTranslation({
        file_id: translation.translatedFileId,
        key_updates: {
          [key]: editedText,
        },
      }).unwrap();
      setEditingKey(null);
      setEditedText('');
    } catch (error) {
      console.error('Error updating translation:', error);
    }
  };

  const handleCancelClick = () => {
    setEditingKey(null);
    setEditedText('');
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Loading translation results...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">
          Failed to load translation results
        </Typography>
      </Box>
    );
  }

  if (!comparisonData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No translation data available
        </Typography>
      </Box>
    );
  }

  const successRate = (translation.successfulTranslations / translation.totalKeys) * 100;

  return (
    <Box>
      {/* Translation Summary */}
      <Box sx={{ mb: 3, p: 3, bgcolor: 'success.light', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Translation Complete
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Target Language</Typography>
            <Typography variant="body1" fontWeight="medium">{translation.targetLanguage}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Keys</Typography>
            <Typography variant="body1" fontWeight="medium">{translation.totalKeys.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Successful</Typography>
            <Typography variant="body1" fontWeight="medium">{translation.successfulTranslations.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Success Rate</Typography>
            <Typography variant="body1" fontWeight="medium">{successRate.toFixed(1)}%</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Avg Confidence</Typography>
            <Typography variant="body1" fontWeight="medium">{(translation.avgConfidence * 100).toFixed(1)}%</Typography>
          </Box>
        </Box>
      </Box>

      {/* Translation Items Table */}
      <Typography variant="h6" gutterBottom>
        Translation Items ({comparisonData.items.length} of {comparisonData.pagination.total_items})
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Source Text</TableCell>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Translated Text</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comparisonData.items.map((item, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {item.key}
                </TableCell>
                <TableCell>{item.source_text}</TableCell>
                <TableCell>
                  {editingKey === item.key ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveClick(item.key);
                          } else if (e.key === 'Escape') {
                            handleCancelClick();
                          }
                        }}
                        autoFocus
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleSaveClick(item.key)}
                        color="success"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={handleCancelClick}
                        color="error"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.translated_text}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(item.key, item.translated_text)}
                        sx={{ ml: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${(item.confidence * 100).toFixed(1)}%`}
                      size="small"
                      color={item.confidence >= 0.9 ? 'success' : item.confidence >= 0.7 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Records info */}
        <Typography variant="body2" color="text.secondary">
          {comparisonData.items.length > 0
            ? `${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, comparisonData.pagination.total_items)} of ${comparisonData.pagination.total_items} records`
            : `0 of ${comparisonData.pagination.total_items} records`
          }
        </Typography>

        {/* Middle: Rows per page selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            rows
          </Typography>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              sx={{ fontSize: '0.875rem' }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Right: Page navigation */}
        <Pagination
          count={comparisonData.pagination.total_pages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size="small"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default TranslationResults;