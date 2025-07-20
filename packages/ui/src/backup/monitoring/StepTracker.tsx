/**
 * Real-time step tracking and monitoring component
 */

import React, { useState } from 'react';
import { useAppSelector } from '../../store';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Globe,
  Database,
  Eye,
  ChevronDown,
  ChevronRight,
  Activity,
  Timer,
  Network,
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import ReactJsonView from 'react-json-view';

/**
 * StepTracker props
 */
interface StepTrackerProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Show detailed request/response */
  showDetails?: boolean;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Maximum visible steps */
  maxVisibleSteps?: number;
}

/**
 * Real-time step tracking component
 */
export const StepTracker: React.FC<StepTrackerProps> = ({
  className,
  showDetails = true,
  compact = false,
  maxVisibleSteps = 20,
}) => {
  const { session } = useAppSelector(state => state.execution);
  
  // Local state
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'request' | 'response' | 'metrics'>('request');
  
  // Get all steps from current execution and completed results
  const allSteps = React.useMemo(() => {
    if (!session) return [];
    
    const steps = [...session.currentSteps];
    
    // Add completed steps from results
    session.results.forEach(result => {
      result.stepResults.forEach(stepResult => {
        if (!steps.find(s => s.id === stepResult.stepId)) {
          steps.push({
            id: stepResult.stepId,
            scenarioName: result.scenario.name,
            stepName: stepResult.stepName,
            type: stepResult.stepType,
            status: stepResult.status === 'passed' ? 'completed' : 'failed',
            startedAt: stepResult.startedAt,
            progress: 100,
            currentOperation: 'Completed',
            request: stepResult.request,
            response: stepResult.response,
            metrics: stepResult.metrics || {
              dnsTime: 0,
              connectionTime: 0,
              tlsTime: 0,
              requestTime: 0,
              responseTime: 0,
              totalTime: stepResult.duration,
              bytesSent: 0,
              bytesReceived: 0,
            },
            logs: [],
          });
        }
      });
    });
    
    return steps
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, maxVisibleSteps);
  }, [session, maxVisibleSteps]);
  
  /**
   * Toggle step expansion
   */
  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };
  
  /**
   * Get step status icon
   */
  const getStepIcon = (status: string, type: string) => {
    const baseIcon = type === 'api' ? Globe : type === 'ui' ? Eye : Database;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'executing':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  /**
   * Get status color class
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'executing':
        return 'border-blue-200 bg-blue-50';
      case 'paused':
        return 'border-yellow-200 bg-yellow-50';
      case 'pending':
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };
  
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
  
  if (!session) {
    return (
      <div className={clsx(
        'bg-white rounded-lg shadow-md border border-gray-200 p-6',
        className
      )}>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active execution</p>
          <p className="text-sm text-gray-400 mt-1">
            Start an execution to track steps in real-time
          </p>
        </div>
      </div>
    );
  }
  
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
            Step Tracker
          </h2>
          <p className="text-sm text-gray-500">
            Real-time step execution monitoring
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          {allSteps.length} {allSteps.length === 1 ? 'step' : 'steps'}
        </div>
      </div>
      
      {/* Steps List */}
      {allSteps.length === 0 ? (
        <div className="text-center py-8">
          <Timer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No steps executed yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Steps will appear here as they execute
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allSteps.map((step) => {
            const isExpanded = expandedSteps.has(step.id);
            
            return (
              <div
                key={step.id}
                className={clsx(
                  'border rounded-lg transition-all duration-200',
                  getStatusColor(step.status)
                )}
              >
                {/* Step Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => showDetails && toggleStepExpansion(step.id)}
                >
                  <div className="flex items-center space-x-3">
                    {showDetails && (
                      <button className="text-gray-400 hover:text-gray-600">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {getStepIcon(step.status, step.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 truncate">
                          {step.stepName}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {step.scenarioName}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <span className={clsx(
                            'w-2 h-2 rounded-full',
                            step.type === 'api' ? 'bg-blue-500' : 
                            step.type === 'ui' ? 'bg-purple-500' : 'bg-gray-500'
                          )} />
                          <span className="capitalize">{step.type}</span>
                        </span>
                        
                        <span>{step.currentOperation}</span>
                        
                        <span className="text-gray-500">
                          {formatDistanceToNow(step.startedAt, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={clsx(
                        'text-sm font-medium',
                        step.status === 'completed' ? 'text-green-600' :
                        step.status === 'failed' ? 'text-red-600' :
                        step.status === 'executing' ? 'text-blue-600' :
                        'text-gray-600'
                      )}>
                        {step.status === 'executing' ? `${step.progress}%` : step.status}
                      </div>
                      
                      {step.metrics.totalTime > 0 && (
                        <div className="text-xs text-gray-500">
                          {formatDuration(step.metrics.totalTime)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar for Executing Steps */}
                  {step.status === 'executing' && step.progress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
                      <div
                        className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Expanded Details */}
                {isExpanded && showDetails && (
                  <div className="border-t border-gray-200 bg-white">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                      {['request', 'response', 'metrics'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSelectedTab(tab as any)}
                          className={clsx(
                            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                            selectedTab === tab
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          )}
                        >
                          <div className="flex items-center space-x-1">
                            {tab === 'request' && <Globe className="w-3 h-3" />}
                            {tab === 'response' && <Database className="w-3 h-3" />}
                            {tab === 'metrics' && <Network className="w-3 h-3" />}
                            <span className="capitalize">{tab}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Tab Content */}
                    <div className="p-4 max-h-96 overflow-auto">
                      {selectedTab === 'request' && step.request && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Request Details
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="font-medium text-gray-600">Method:</span>
                                  <span className="ml-2 text-gray-900">{step.request.method}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Size:</span>
                                  <span className="ml-2 text-gray-900">{formatBytes(step.request.size)}</span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="font-medium text-gray-600">URL:</span>
                                <div className="mt-1 p-2 bg-white rounded border text-xs font-mono break-all">
                                  {step.request.url}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {step.request.headers && Object.keys(step.request.headers).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Headers</h4>
                              <ReactJsonView
                                src={step.request.headers}
                                theme="rjv-default"
                                collapsed={1}
                                displayObjectSize={false}
                                displayDataTypes={false}
                                enableClipboard={false}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          )}
                          
                          {step.request.body && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Body</h4>
                              <ReactJsonView
                                src={step.request.body}
                                theme="rjv-default"
                                collapsed={1}
                                displayObjectSize={false}
                                displayDataTypes={false}
                                enableClipboard={false}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedTab === 'response' && step.response && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Response Details
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <span className="font-medium text-gray-600">Status:</span>
                                  <span className={clsx(
                                    'ml-2 font-medium',
                                    step.response.status >= 200 && step.response.status < 300
                                      ? 'text-green-600'
                                      : step.response.status >= 400
                                      ? 'text-red-600'
                                      : 'text-yellow-600'
                                  )}>
                                    {step.response.status}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Size:</span>
                                  <span className="ml-2 text-gray-900">{formatBytes(step.response.size)}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Time:</span>
                                  <span className="ml-2 text-gray-900">{formatDuration(step.response.responseTime)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {step.response.headers && Object.keys(step.response.headers).length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Headers</h4>
                              <ReactJsonView
                                src={step.response.headers}
                                theme="rjv-default"
                                collapsed={1}
                                displayObjectSize={false}
                                displayDataTypes={false}
                                enableClipboard={false}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          )}
                          
                          {step.response.body && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Body</h4>
                              <ReactJsonView
                                src={step.response.body}
                                theme="rjv-default"
                                collapsed={1}
                                displayObjectSize={false}
                                displayDataTypes={false}
                                enableClipboard={false}
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedTab === 'metrics' && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Performance Metrics
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">DNS Lookup:</span>
                                <span className="text-sm font-medium">{formatDuration(step.metrics.dnsTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Connection:</span>
                                <span className="text-sm font-medium">{formatDuration(step.metrics.connectionTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">TLS Handshake:</span>
                                <span className="text-sm font-medium">{formatDuration(step.metrics.tlsTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Request:</span>
                                <span className="text-sm font-medium">{formatDuration(step.metrics.requestTime)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Response:</span>
                                <span className="text-sm font-medium">{formatDuration(step.metrics.responseTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total:</span>
                                <span className="text-sm font-medium">{formatDuration(step.metrics.totalTime)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Sent:</span>
                                <span className="text-sm font-medium">{formatBytes(step.metrics.bytesSent)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Received:</span>
                                <span className="text-sm font-medium">{formatBytes(step.metrics.bytesReceived)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StepTracker;