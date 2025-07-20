import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import clsx from 'clsx';
import { ChartProps, ChartConfig } from './types';
import { generateChartConfig } from '../../utils/analytics';

interface PieChartProps extends ChartProps {
  config?: ChartConfig;
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey = 'name',
  className,
  height = 300,
  loading = false,
  error = null,
  title,
  subtitle,
  config = {},
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true
}) => {
  const chartConfig = generateChartConfig('pie', config.theme);

  if (loading) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6', className)}>
        {title && (
          <div className="mb-4">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
            {subtitle && <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>}
          </div>
        )}
        <div 
          className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ height }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6', className)}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
        )}
        <div 
          className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
          style={{ height }}
        >
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading chart</p>
            <p className="text-red-500 dark:text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6', className)}>
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
        )}
        <div 
          className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded"
          style={{ height }}
        >
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Convert data to format expected by recharts
  const chartData = Array.isArray(data) ? data : Object.entries(data).map(([key, value]) => ({
    [nameKey]: key,
    [dataKey]: value
  }));

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm', className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomizedLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            animationDuration={config.animation !== false ? 1000 : 0}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartConfig.colors[index % chartConfig.colors.length]} 
              />
            ))}
          </Pie>
          {config.tooltip !== false && (
            <Tooltip 
              contentStyle={{
                backgroundColor: config.theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `1px solid ${config.theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                borderRadius: '6px',
                color: chartConfig.textColor
              }}
            />
          )}
          {config.legend !== false && (
            <Legend 
              wrapperStyle={{ color: chartConfig.textColor }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;