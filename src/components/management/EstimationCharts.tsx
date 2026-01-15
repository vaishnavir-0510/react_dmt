import React from 'react';
import { Paper, Box } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  type TooltipProps
} from 'recharts';

// 1. Define the Data Interface
interface ChartItem {
  name: string;
  value: number;
  color: string;
}

const data: ChartItem[] = [
  { name: 'Extract', value: 5, color: '#F6C854' },
  { name: 'Relationship', value: 10, color: '#B9B569' },
  { name: 'Filter', value: 5, color: '#E591A2' },
  { name: 'Metadata', value: 10, color: '#2ADBD7' },
  { name: 'Cleanup', value: 15, color: '#578EFA' },
  { name: 'Mapping', value: 10, color: '#FF946E' },
  { name: 'Validate', value: 10, color: '#88D154' },
  { name: 'Transform', value: 15, color: '#CC90E0' },
  { name: 'Load', value: 10, color: '#E86199' },
  { name: 'Error Handling', value: 10, color: '#7E6BFE' },
];

// 2. Fix Tooltip Types
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: '#333',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          position: 'relative',
          fontWeight: 500,
          // Arrow pointing down
          '&:after': {
            content: '""',
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '6px',
            borderStyle: 'solid',
            borderColor: '#333 transparent transparent transparent',
          },
        }}
      >
        {`${payload[0].name} : ${payload[0].value}%`}
      </Box>
    );
  }
  return null;
};

export const EstimationCharts: React.FC = () => {
  return (
    <Paper elevation={0} sx={{ p: 2, width: '100%', height: 500 }}>
      <Box sx={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Center Label */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '20px', fontWeight: 500, fill: '#444' }}
            >
              BenchMark
            </text>
            
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              // Fix TS2365 by typing the label args as any
              label={({ cx, cy, midAngle, outerRadius, value }: any) => {
                const RADIAN = Math.PI / 180;
                // Explicitly cast to number to fix math operator errors
                const radius = (outerRadius as number) + 20;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#333"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    style={{ fontSize: '13px', fontWeight: 'bold' }}
                  >
                    {`${value}%`}
                  </text>
                );
              }}
              labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'transparent' }} 
              offset={-40} // Pulls tooltip closer to the ring
            />
            
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};