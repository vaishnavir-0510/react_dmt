// components/management/EstimationCharts.tsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  type TooltipProps
} from 'recharts';

// Use any type for data to bypass Recharts strict typing
const data = [
  { name: 'Dataset', value: 15 },
  { name: 'Relationship', value: 25 },
  { name: 'Filter', value: 25 },
  { name: 'Metabolism', value: 75 },
  { name: 'Chromap', value: 25 },
  { name: 'Mapping', value: 81 },
  { name: 'Validation', value: 80 },
  { name: 'Transform', value: 75 },
  { name: 'Local', value: 75 },
  { name: 'Error Handling', value: 75 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#D084D0', '#FF6B6B'];

// Define proper types for tooltip
interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percent?: number;
    };
  }>;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percent = data.percent || 0;
    
    return (
      <Paper sx={{ p: 2 }} elevation={3}>
        <Typography variant="body2" fontWeight="bold">
          {data.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`${data.value} hours`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`${(percent * 100).toFixed(1)}%`}
        </Typography>
      </Paper>
    );
  }
  return null;
};

export const EstimationCharts: React.FC = () => {
  return (
    <Paper elevation={2} sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Effort Distribution
      </Typography>
      <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // Use type assertion for the label function
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};