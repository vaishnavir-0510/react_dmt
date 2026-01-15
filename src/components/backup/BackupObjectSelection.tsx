import React from 'react';
import { Box, Typography } from '@mui/material';
import { TargetObjectsTab } from '../entities/TargetObjectsTab';

const BackupObjectSelection: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Backup Object Selection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Select and configure objects for backup operations
      </Typography>
      <TargetObjectsTab />
    </Box>
  );
};

export { BackupObjectSelection };