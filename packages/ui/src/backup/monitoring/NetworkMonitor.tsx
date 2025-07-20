/**
 * Real-time network activity monitoring component
 */

import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store';
import {
  Activity,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  Globe,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import clsx from 'clsx';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * NetworkMonitor props
 */
interface NetworkMonitorProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Show charts */
  showCharts?: boolean;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Chart height */
  chartHeight?: number;
}

/**
 * Real-time network monitoring component
 */
export const NetworkMonitor: React.FC<NetworkMonitorProps> = ({
  className,
  showCharts = true,
  compact = false,
  chartHeight = 200,
}) => {
  const { session, connectionStatus, metrics } = useAppSelector(state => state.execution);
  
  // Local state
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [selectedMetric, setSelectedMetric] = useState<'throughput' | 'latency' | 'errors'>('throughput');
  
  // Generate mock network data for visualization
  const networkData = useMemo(() => {
    if (!session) return null;
    
    const now = Date.now();
    const intervals = {
      '1m': { count: 60, interval: 1000 },
      '5m': { count: 300, interval: 1000 },
      '15m': { count: 180, interval: 5000 },
      '1h': { count: 120, interval: 30000 },
    };
    
    const { count, interval } = intervals[timeRange];
    const labels = [];
    const throughputData = [];
    const latencyData = [];
    const errorData = [];
    const connectionsData = [];
    
    for (let i = count; i >= 0; i--) {
      const time = new Date(now - i * interval);
      labels.push(time.toLocaleTimeString('en-US', { 
        hour12: false, 
        minute: '2-digit', 
        second: '2-digit' 
      }));
      
      // Mock data with some randomness
      const baseValue = Math.sin(i * 0.1) * 50 + 100;
      throughputData.push(Math.max(0, baseValue + Math.random() * 20 - 10));
      latencyData.push(Math.max(0, 100 + Math.random() * 50));
      errorData.push(Math.random() < 0.05 ? Math.random() * 5 : 0);
      connectionsData.push(Math.floor(Math.random() * 10) + session.currentSteps.length);
    }
    
    return {
      labels,
      datasets: {
        throughput: {
          label: 'Throughput (req/s)',
          data: throughputData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        latency: {
          label: 'Latency (ms)',
          data: latencyData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        errors: {
          label: 'Errors (%)',
          data: errorData,
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
        connections: {
          label: 'Active Connections',
          data: connectionsData,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4,
        },
      },
    };
  }, [session, timeRange]);
  
  // Calculate network statistics
  const networkStats = useMemo(() => {
    if (!session || !metrics) return null;
    
    const currentSteps = session.currentSteps;
    const totalRequests = currentSteps.reduce((sum, step) => sum + (step.request ? 1 : 0), 0);
    const totalBytes = currentSteps.reduce((sum, step) => 
      sum + (step.metrics?.bytesSent || 0) + (step.metrics?.bytesReceived || 0), 0
    );
    const avgLatency = currentSteps.length > 0 
      ? currentSteps.reduce((sum, step) => sum + (step.metrics?.responseTime || 0), 0) / currentSteps.length
      : 0;
    
    const errorRate = session.results.length > 0
      ? (session.results.filter(r => r.status === 'failed').length / session.results.length) * 100
      : 0;
    
    return {
      activeConnections: currentSteps.length,
      requestRate: metrics.performance.requestRate,
      throughput: metrics.performance.networkThroughput,
      errorRate: errorRate,
      avgLatency: avgLatency,
      totalBytes: totalBytes,
      totalRequests: totalRequests,
    };
  }, [session, metrics]);
  
  /**
   * Format bytes
   */
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  /**
   * Format rate
   */
  const formatRate = (rate: number) => {
    if (rate < 1) return `${Math.round(rate * 1000)}ms`;
    if (rate < 1000) return `${Math.round(rate)}/s`;
    return `${Math.round(rate / 1000)}k/s`;
  };
  
  /**
   * Get connection status color
   */
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500 animate-pulse';
      case 'reconnecting':
        return 'text-orange-500 animate-pulse';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };
  
  /**
   * Get connection status icon
   */
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
      case 'reconnecting':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'error':
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: !compact,
        grid: {
          display: false,
        },
      },
      y: {
        display: !compact,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };
  
  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-md border border-gray-200',
      compact ? 'p-4' : 'p-6',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={clsx(
            'font-semibold text-gray-900',
            compact ? 'text-base' : 'text-lg'
          )}>
            Network Monitor
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className={clsx('flex items-center space-x-1', getConnectionStatusColor())}>
              {getConnectionStatusIcon()}
              <span className="text-sm capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
        
        {!compact && (
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Network Statistics */}
      {networkStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">Connections</span>
            </div>
            <div className="text-lg font-semibold text-blue-900 mt-1">
              {networkStats.activeConnections}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-700">Throughput</span>
            </div>
            <div className="text-lg font-semibold text-green-900 mt-1">
              {formatBytes(networkStats.throughput)}/s
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">Latency</span>
            </div>
            <div className="text-lg font-semibold text-yellow-900 mt-1">
              {Math.round(networkStats.avgLatency)}ms
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">Error Rate</span>
            </div>
            <div className="text-lg font-semibold text-red-900 mt-1">
              {networkStats.errorRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
      
      {/* Traffic Overview */}
      {!compact && networkStats && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Traffic Overview
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ArrowUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Sent</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatBytes(metrics?.resourceUsage.networkActivity.bytesSent || 0)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <ArrowDown className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Received</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatBytes(metrics?.resourceUsage.networkActivity.bytesReceived || 0)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Requests</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {metrics?.resourceUsage.networkActivity.requestCount || 0}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Charts */}
      {showCharts && networkData && !compact && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Real-time Metrics
            </h3>
            <div className="flex items-center space-x-2">
              {['throughput', 'latency', 'errors'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric as any)}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    selectedMetric === metric
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {metric === 'throughput' && <Zap className="w-3 h-3 inline mr-1" />}
                  {metric === 'latency' && <Clock className="w-3 h-3 inline mr-1" />}
                  {metric === 'errors' && <BarChart3 className="w-3 h-3 inline mr-1" />}
                  <span className="capitalize">{metric}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ height: chartHeight }}>
            {selectedMetric === 'errors' ? (
              <Bar
                data={{
                  labels: networkData.labels,
                  datasets: [networkData.datasets.errors],
                }}
                options={chartOptions}
              />
            ) : (
              <Line
                data={{
                  labels: networkData.labels,
                  datasets: [
                    selectedMetric === 'throughput' 
                      ? networkData.datasets.throughput
                      : selectedMetric === 'latency'
                      ? networkData.datasets.latency
                      : networkData.datasets.connections
                  ],
                }}
                options={chartOptions}
              />
            )}
          </div>
        </div>
      )}
      
      {/* No Data State */}
      {!session && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No network activity</p>
          <p className="text-sm text-gray-400 mt-1">
            Start an execution to monitor network traffic
          </p>
        </div>
      )}
    </div>
  );
};

export default NetworkMonitor;