import React from 'react';
import clsx from 'clsx';
import { ChartProps } from './types';

interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
}

interface HeatmapChartProps extends Omit<ChartProps, 'data'> {
  data: HeatmapData[];
  xLabels: string[];
  yLabels: string[];
  colorScale?: 'red' | 'green' | 'blue' | 'purple';
  cellSize?: number;
  showValues?: boolean;
}

const colorScales = {
  red: {
    low: 'bg-red-100 text-red-800',
    medium: 'bg-red-300 text-red-900',
    high: 'bg-red-500 text-white'
  },
  green: {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-green-300 text-green-900',
    high: 'bg-green-500 text-white'
  },
  blue: {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-blue-300 text-blue-900',
    high: 'bg-blue-500 text-white'
  },
  purple: {
    low: 'bg-purple-100 text-purple-800',
    medium: 'bg-purple-300 text-purple-900',
    high: 'bg-purple-500 text-white'
  }
};

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  xLabels,
  yLabels,
  className,
  loading = false,
  error = null,
  title,
  subtitle,
  colorScale = 'blue',
  cellSize = 40,
  showValues = true
}) => {
  if (loading) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6', className)}>
        {title && (
          <div className="mb-4">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
            {subtitle && <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>}
          </div>
        )}
        <div className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse h-64"></div>
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
        <div className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">Error loading heatmap</p>
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
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded h-64">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Calculate min and max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  const getIntensity = (value: number): 'low' | 'medium' | 'high' => {
    const normalized = (value - minValue) / range;
    if (normalized <= 0.33) return 'low';
    if (normalized <= 0.66) return 'medium';
    return 'high';
  };

  const getCellData = (x: string | number, y: string | number) => {
    return data.find(d => d.x === x && d.y === y);
  };

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm', className)}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      
      <div className="overflow-auto">
        <div className="inline-block min-w-full">
          {/* Header with x-axis labels */}
          <div className="flex">
            <div style={{ width: cellSize }} className="flex-shrink-0"></div>
            {xLabels.map(label => (
              <div 
                key={label}
                className="flex-shrink-0 text-xs text-gray-600 dark:text-gray-400 text-center p-2"
                style={{ width: cellSize }}
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {yLabels.map(yLabel => (
            <div key={yLabel} className="flex">
              {/* Y-axis label */}
              <div 
                className="flex-shrink-0 text-xs text-gray-600 dark:text-gray-400 text-right p-2 flex items-center justify-end"
                style={{ width: cellSize }}
              >
                {yLabel}
              </div>
              
              {/* Data cells */}
              {xLabels.map(xLabel => {
                const cellData = getCellData(xLabel, yLabel);
                const intensity = cellData ? getIntensity(cellData.value) : 'low';
                const colorClasses = colorScales[colorScale][intensity];
                
                return (
                  <div
                    key={`${xLabel}-${yLabel}`}
                    className={clsx(
                      'flex-shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-medium transition-all hover:scale-105',
                      cellData ? colorClasses : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    )}
                    style={{ width: cellSize, height: cellSize }}
                    title={cellData ? `${xLabel} - ${yLabel}: ${cellData.value}` : 'No data'}
                  >
                    {showValues && cellData ? cellData.value : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">Low</span>
          <div className="flex space-x-1">
            <div className={clsx('w-4 h-4 rounded', colorScales[colorScale].low.split(' ')[0])}></div>
            <div className={clsx('w-4 h-4 rounded', colorScales[colorScale].medium.split(' ')[0])}></div>
            <div className={clsx('w-4 h-4 rounded', colorScales[colorScale].high.split(' ')[0])}></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;