// pages/translation/TranslationDashboard.tsx
import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Tag as TagIcon,
  Language as LanguageIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGetTranslationDashboardQuery } from '../../services/translationApi';

export const TranslationDashboard: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useGetTranslationDashboardQuery();

  if (isLoading) {
    return (
      <Box sx={{ pt: "5px", px: "10px", pb: "10px", textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ pt: "5px", px: "10px", pb: "10px", textAlign: 'center', py: 8 }}>
        <Typography color="error" variant="h6">
          Failed to load dashboard data
        </Typography>
        <Typography color="text.secondary">
          Please try refreshing the page
        </Typography>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ pt: "5px", px: "10px", pb: "10px", textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary" variant="h6">
          No dashboard data available
        </Typography>
      </Box>
    );
  }

  const { overview, languages = [], confidence_distribution } = dashboardData;

  // Prepare chart data with fallback
  const confidenceChartData = [
    { name: '>90%', value: confidence_distribution?.high_confidence || 0, label: '>90%' },
    { name: '75-89%', value: confidence_distribution?.medium_confidence || 0, label: '75-89%' },
    { name: '<75%', value: confidence_distribution?.low_confidence || 0, label: '<75%' },
  ];

  return (
    <Box sx={{ pt: "20px", px: "30px", pb: "30px", backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
          {overview?.project_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Source Language: {overview?.source_language}
        </Typography>
      </Box>

      {/* Top Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Overall Progress */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <CircularProgress
                variant="determinate"
                value={overview?.overall_progress || 0}
                size={80}
                thickness={4}
                sx={{
                  color: '#5B7FFF',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#5B7FFF' }}>
                  {`${Math.round(overview?.overall_progress || 0)}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
          </Paper>
        </Grid>

        {/* Total Keys */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: '#E0F2F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TagIcon sx={{ color: '#00897B', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                {overview?.total_keys?.toLocaleString() || 0}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total Keys
            </Typography>
          </Paper>
        </Grid>

        {/* Target Languages */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: '#E3F2FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LanguageIcon sx={{ color: '#1976D2', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                {overview?.target_languages || 0}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Target Languages
            </Typography>
          </Paper>
        </Grid>

        {/* Needs Manual Review */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: '#FFF3E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <WarningIcon sx={{ color: '#F57C00', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
                {overview?.needs_manual_review || 0}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Needs Manual Review
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section - Languages and Chart */}
      <Grid container spacing={3}>
        {/* Languages Overview Table */}
        <Grid item xs={12} md={7}>
          <Paper sx={{
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                Languages Overview
              </Typography>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 650 }}>
                {/* Table Header */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr 1fr',
                  gap: 2,
                  p: 2,
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                    Language
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                    Status
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                    Progress
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                    Avg. Confidence
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
                    Review
                  </Typography>
                </Box>

                {/* Table Rows */}
                {languages.length > 0 ? (
                  languages.map((language, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 2fr 1.5fr 1fr',
                        gap: 2,
                        p: 2,
                        borderBottom: index < languages.length - 1 ? '1px solid #e0e0e0' : 'none',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: '#fafafa'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
                        {language.language || 'Unknown'}
                      </Typography>
                      
                      <Chip
                        label={language.status || 'pending'}
                        size="small"
                        sx={{
                          backgroundColor: language.status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                          color: language.status === 'completed' ? '#2E7D32' : '#E65100',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                          borderRadius: 1,
                          textTransform: 'capitalize',
                          width: 'fit-content'
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={language.progress || 0}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#E3F2FD',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#5B7FFF',
                              borderRadius: 3
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', minWidth: 40, textAlign: 'right' }}>
                          {Math.round(language.progress || 0)}%
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                        {language.avg_confidence?.toFixed(1) || '0.0'}%
                      </Typography>
                      
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#333', textAlign: 'center' }}>
                        {language.review_count || 0}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No language data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* AI Confidence Distribution Chart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            height: '100%'
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
              AI Confidence Distribution
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={confidenceChartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#999', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#999', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};