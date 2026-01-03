// pages/backup/BackupDashboard.tsx
import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { Backup as BackupIcon } from '@mui/icons-material';

export const BackupDashboard: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <BackupIcon sx={{ fontSize: 40, color: 'info.main' }} />
        <Typography variant="h4" component="h1">
          Backup Dashboard
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Backup Project Overview
        </Typography>
        <Typography>
          Welcome to your backup project dashboard. Here you can manage your backup jobs, 
          restoration processes, and view backup history.
        </Typography>
      </Paper>
    </Box>
  );
};