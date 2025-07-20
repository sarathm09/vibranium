import { MetricValue, TimeSeriesData } from '../types/analytics';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Format a metric value based on its type
 */
export function formatMetricValue(metric: MetricValue): string {
  const { value, format: formatType, unit } = metric;
  
  switch (formatType) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    case 'duration':
      if (unit === 'ms') {
        if (value < 1000) return `${Math.round(value)}ms`;
        if (value < 60000) return `${(value / 1000).toFixed(1)}s`;
        return `${(value / 60000).toFixed(1)}m`;
      }
      if (unit === 'hours') {
        return `${value.toFixed(1)}h`;
      }
      return `${value.toFixed(0)}${unit || ''}`;
    case 'bytes':
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(value) / Math.log(1024));
      return `${(value / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    case 'number':
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
  }
}

/**
 * Get the color class for a metric change
 */
export function getMetricChangeColor(metric: MetricValue): string {
  switch (metric.changeType) {
    case 'increase':
      return 'text-success-600';
    case 'decrease':
      return 'text-error-600';
    case 'neutral':
    default:
      return 'text-gray-500';
  }
}

/**
 * Get the trend icon for a metric
 */
export function getMetricTrendIcon(metric: MetricValue): string {
  switch (metric.trend) {
    case 'up':
      return '↗️';
    case 'down':
      return '↘️';
    case 'stable':
    default:
      return '→';
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Aggregate time series data by time period
 */
export function aggregateTimeSeriesData(
  data: TimeSeriesData[],
  period: 'hour' | 'day' | 'week' | 'month'
): TimeSeriesData[] {
  const groups = new Map<string, TimeSeriesData[]>();
  
  data.forEach(item => {
    const date = parseISO(item.timestamp);
    let key: string;
    
    switch (period) {
      case 'hour':
        key = format(date, 'yyyy-MM-dd HH:00:00');
        break;
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(date, 'yyyy-ww');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });
  
  return Array.from(groups.entries()).map(([key, items]) => ({
    timestamp: key,
    value: items.reduce((sum, item) => sum + item.value, 0) / items.length,
    metadata: {
      count: items.length,
      min: Math.min(...items.map(item => item.value)),
      max: Math.max(...items.map(item => item.value))
    }
  }));
}

/**
 * Generate date range presets
 */
export function getDateRangePresets() {
  const now = new Date();
  
  return {
    today: {
      start: startOfDay(now).toISOString(),
      end: endOfDay(now).toISOString(),
      label: 'Today'
    },
    '7d': {
      start: subDays(now, 7).toISOString(),
      end: now.toISOString(),
      label: 'Last 7 days'
    },
    '30d': {
      start: subDays(now, 30).toISOString(),
      end: now.toISOString(),
      label: 'Last 30 days'
    },
    '90d': {
      start: subDays(now, 90).toISOString(),
      end: now.toISOString(),
      label: 'Last 90 days'
    },
    ytd: {
      start: new Date(now.getFullYear(), 0, 1).toISOString(),
      end: now.toISOString(),
      label: 'Year to date'
    }
  };
}

/**
 * Calculate statistical metrics from time series data
 */
export function calculateStatistics(data: TimeSeriesData[]) {
  if (data.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      standardDeviation: 0,
      variance: 0
    };
  }
  
  const values = data.map(item => item.value).sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = values.length % 2 === 0 
    ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
    : values[Math.floor(values.length / 2)];
  
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    mean,
    median,
    min: values[0],
    max: values[values.length - 1],
    standardDeviation,
    variance
  };
}

/**
 * Get color scheme for charts based on theme
 */
export function getChartColorScheme(theme: 'light' | 'dark' = 'light') {
  const lightColors = [
    '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
  
  const darkColors = [
    '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
    '#22d3ee', '#a3e635', '#fb923c', '#f472b6', '#818cf8'
  ];
  
  return theme === 'dark' ? darkColors : lightColors;
}

/**
 * Calculate health score from multiple metrics
 */
export function calculateHealthScore(metrics: {
  successRate: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}): number {
  const weights = {
    successRate: 0.3,
    responseTime: 0.25,
    errorRate: 0.25,
    uptime: 0.2
  };
  
  // Normalize scores (higher is better)
  const normalizedSuccessRate = metrics.successRate;
  const normalizedResponseTime = Math.max(0, 100 - (metrics.responseTime / 10)); // Assuming 1000ms = 0 score
  const normalizedErrorRate = Math.max(0, 100 - (metrics.errorRate * 10));
  const normalizedUptime = metrics.uptime;
  
  const score = 
    normalizedSuccessRate * weights.successRate +
    normalizedResponseTime * weights.responseTime +
    normalizedErrorRate * weights.errorRate +
    normalizedUptime * weights.uptime;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Get status color based on value and thresholds
 */
export function getStatusColor(
  value: number, 
  thresholds: { good: number; warning: number }
): 'success' | 'warning' | 'error' {
  if (value >= thresholds.good) return 'success';
  if (value >= thresholds.warning) return 'warning';
  return 'error';
}

/**
 * Format duration in human readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Generate chart configuration for Recharts
 */
export function generateChartConfig(
  type: 'line' | 'bar' | 'area' | 'pie',
  theme: 'light' | 'dark' = 'light'
) {
  const colors = getChartColorScheme(theme);
  const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  
  return {
    colors,
    textColor,
    gridColor,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
    fontSize: 12,
    fontFamily: 'Inter, sans-serif'
  };
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key] as any);
    } else {
      result[key] = source[key] as any;
    }
  }
  
  return result;
}