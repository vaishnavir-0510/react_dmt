// pages/translation/Translations.tsx
import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Translate as TranslateIcon,
  History as HistoryIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`translation-tabpanel-${index}`}
      aria-labelledby={`translation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `translation-tab-${index}`,
    'aria-controls': `translation-tabpanel-${index}`,
  };
}

export const Translations: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Mock data for demonstration
  const sourceData = [
    { id: 1, sourceText: 'Hello world', targetText: 'Hola mundo', language: 'Spanish', status: 'translated' },
    { id: 2, sourceText: 'Good morning', targetText: 'Buenos días', language: 'Spanish', status: 'translated' },
    { id: 3, sourceText: 'Thank you', targetText: 'Gracias', language: 'Spanish', status: 'pending' },
  ];

  const workbenchData = [
    { id: 1, sourceText: 'Welcome', targetText: '', language: 'French', status: 'in_progress' },
    { id: 2, sourceText: 'Goodbye', targetText: 'Au revoir', language: 'French', status: 'review' },
  ];

  const historyData = [
    { id: 1, sourceText: 'Hello', targetText: 'Bonjour', language: 'French', date: '2024-01-15', translator: 'John Doe' },
    { id: 2, sourceText: 'Yes', targetText: 'Oui', language: 'French', date: '2024-01-14', translator: 'Jane Smith' },
  ];

  const reviewData = [
    { id: 1, sourceText: 'Please', targetText: 'S\'il vous plaît', language: 'French', status: 'pending_review' },
    { id: 2, sourceText: 'Excuse me', targetText: 'Excusez-moi', language: 'French', status: 'approved' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <TranslateIcon sx={{ fontSize: 40, color: 'warning.main' }} />
        <Typography variant="h4" component="h1">
          Translations
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="translation tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                minHeight: 48,
                borderRadius: '8px 8px 0 0',
                marginRight: 1,
                minWidth: 'auto',
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: '#0b378aff',
                  color: 'white',
                  fontWeight: 600,
                },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&.Mui-selected': {
                    backgroundColor: '#0b378aff',
                  },
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab
              icon={<WorkIcon />}
              label="Source"
              {...a11yProps(0)}
              iconPosition="start"
            />
            <Tab
              icon={<TranslateIcon />}
              label="Workbench"
              {...a11yProps(1)}
              iconPosition="start"
            />
            <Tab
              icon={<HistoryIcon />}
              label="History"
              {...a11yProps(2)}
              iconPosition="start"
            />
            <Tab
              icon={<CheckCircleIcon />}
              label="Review"
              {...a11yProps(3)}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search source texts..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source Text</TableCell>
                  <TableCell>Target Text</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sourceData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sourceText}</TableCell>
                    <TableCell>{row.targetText}</TableCell>
                    <TableCell>{row.language}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={row.status === 'translated' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom>
            Translation Workbench
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source Text</TableCell>
                  <TableCell>Target Text</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workbenchData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sourceText}</TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        defaultValue={row.targetText}
                        placeholder="Enter translation..."
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.language}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status.replace('_', ' ')}
                        color={row.status === 'in_progress' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" sx={{ mr: 1 }}>
                        Save
                      </Button>
                      <Button size="small" variant="outlined">
                        Submit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Typography variant="h6" gutterBottom>
            Translation History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source Text</TableCell>
                  <TableCell>Target Text</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Translator</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sourceText}</TableCell>
                    <TableCell>{row.targetText}</TableCell>
                    <TableCell>{row.language}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.translator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <Typography variant="h6" gutterBottom>
            Review Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source Text</TableCell>
                  <TableCell>Target Text</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviewData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sourceText}</TableCell>
                    <TableCell>{row.targetText}</TableCell>
                    <TableCell>{row.language}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status.replace('_', ' ')}
                        color={row.status === 'approved' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" color="success" sx={{ mr: 1 }}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" color="error">
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};