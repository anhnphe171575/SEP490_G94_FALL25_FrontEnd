"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, Paper, Chip, Stack } from '@mui/material';

type GanttData = {
  name: string;
  start: number;
  end: number;
  duration: number;
  status: 'completed' | 'in-progress' | 'planned' | 'overdue';
  progress: number;
  feature_id: string;
  feature_title: string;
};

type RechartsGanttChartProps = {
  data: GanttData[];
  title?: string;
  height?: number;
};

const RechartsGanttChart: React.FC<RechartsGanttChartProps> = ({ 
  data, 
  title = "Gantt Chart", 
  height = 400 
}) => {
  // Validate and transform data for Recharts
  if (!data || data.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Không có dữ liệu để hiển thị Gantt Chart
          </Typography>
        </Paper>
      </Box>
    );
  }

  const chartData = data
    .filter(item => {
      if (!item) return false;
      const start = Number(item.start);
      const end = Number(item.end);
      const progress = Number(item.progress);
      return !isNaN(start) && !isNaN(end) && !isNaN(progress) && start >= 0 && end > start;
    })
    .map((item, index) => {
      const start = Math.max(0, Number(item.start));
      const end = Math.max(start + 1, Number(item.end));
      const progress = Math.max(0, Math.min(100, Number(item.progress) || 0));
      
      return {
        ...item,
        index,
        // Calculate position for horizontal bar
        startValue: start,
        endValue: end,
        duration: end - start,
        progress: progress,
        // For display purposes
        displayName: `${item.feature_title || `Feature ${index + 1}`} (${progress}%)`,
      };
    });

  if (chartData.length === 0) {
    console.log('No valid chart data:', { originalData: data, chartData });
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Dữ liệu không hợp lệ để hiển thị Gantt Chart
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Debug logging
  console.log('Chart data:', chartData);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in-progress': return '#f59e0b';
      case 'overdue': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.feature_title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {data.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={data.status} 
              size="small" 
              sx={{ 
                bgcolor: getStatusColor(data.status),
                color: 'white',
                fontSize: '0.75rem'
              }} 
            />
            <Typography variant="body2">
              {data.progress}% hoàn thành
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Thời gian: {data.start} - {data.end} ngày
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  try {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[0, 'dataMax']}
                tickFormatter={(value) => `Ngày ${Math.round(value)}`}
              />
              <YAxis 
                type="category" 
                dataKey="displayName" 
                width={200}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="duration" 
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getStatusColor(entry.status)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    );
  } catch (error) {
    console.error('Error rendering Gantt Chart:', error);
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="error">
            Lỗi khi hiển thị Gantt Chart. Vui lòng kiểm tra dữ liệu.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
        </Paper>
      </Box>
    );
  }
};

export default RechartsGanttChart;
