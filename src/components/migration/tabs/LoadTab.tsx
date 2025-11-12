
// components/migration/tabs/LoadTab.tsx
import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';

export const LoadTab: React.FC = () => {
  const { selectedObject } = useSelector((state: RootState) => state.migration);

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Load Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure load settings for {selectedObject?.object_name}
      </Typography>
      
      <Paper elevation={1} sx={{ p: 3, mt: 2 }}>
        <Typography variant="body2">
          Load configuration content will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};