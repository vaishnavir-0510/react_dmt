// pages/translation/TranslationDashboard.tsx
import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { Translate as TranslateIcon } from '@mui/icons-material';

export const TranslationDashboard: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <TranslateIcon sx={{ fontSize: 40, color: 'warning.main' }} />
        <Typography variant="h4" component="h1">
          Translation Dashboard
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Translation Project Overview
        </Typography>
        <Typography>
          Welcome to your translation project dashboard. Manage language packs, 
          translation memory, and track progress across different languages.
        </Typography>
      </Paper>
    </Box>
  );
};