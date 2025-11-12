
// components/migration/tabs/WorkflowsTab.tsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { setMigrationName } from '../../../store/slices/migrationSlice';

export const WorkflowsTab: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedObject, migrationName } = useSelector((state: RootState) => state.migration);
  const [localMigrationName, setLocalMigrationName] = useState(migrationName);

  const handleSaveMigrationName = () => {
    dispatch(setMigrationName(localMigrationName));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Workflows & Migration Setup
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Migration Configuration
            </Typography>
            
            <TextField
              fullWidth
              label="Migration Name"
              value={localMigrationName}
              onChange={(e) => setLocalMigrationName(e.target.value)}
              placeholder={`Enter migration name for ${selectedObject?.object_name}`}
              margin="normal"
              variant="outlined"
            />
            
            <Button
              variant="contained"
              onClick={handleSaveMigrationName}
              sx={{ mt: 2 }}
              disabled={!localMigrationName.trim()}
            >
              Save Migration Name
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Migration Status
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Object Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip label={`Records: ${selectedObject?.records_count}`} size="small" />
                    <Chip label={`Fields: ${selectedObject?.field_count}`} size="small" />
                    <Chip 
                      label={`Operation: ${selectedObject?.operation}`} 
                      size="small"
                      color={selectedObject?.operation === 'insert' ? 'success' : 'primary'}
                    />
                  </Box>
                </CardContent>
              </Card>
              
              {migrationName && (
                <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom color="success.main">
                      Migration Ready
                    </Typography>
                    <Typography variant="body2">
                      Migration name: <strong>{migrationName}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};