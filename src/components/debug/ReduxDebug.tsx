import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Box, Paper, Typography } from '@mui/material';

export const ReduxDebug: React.FC = () => {
  const appState = useSelector((state: RootState) => state.app);
  
  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.100' }}>
      <Typography variant="h6">Redux Debug Info</Typography>
      <Typography variant="body2" component="pre">
        {JSON.stringify(appState, null, 2)}
      </Typography>
    </Paper>
  );
};