/**
 * Real-time progress visualization component
 */

import React, { useMemo } from 'react';
import { useAppSelector } from '../../store';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  ArrowRight,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * ProgressVisualizer props
 */
interface ProgressVisualizerProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Show detailed steps */
  showSteps?: boolean;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Show timeline */
  showTimeline?: boolean;
}

/**
 * Real-time progress visualization component
 */
export const ProgressVisualizer: React.FC<ProgressVisualizerProps> = ({
  className,
  showSteps = true,
  compact = false,
  showTimeline = true,
}) => {
  const { session } = useAppSelector(state => state.execution);
  
  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    if (!session) return null;
    
    const { progress } = session;
    const elapsedTime = Date.now() - session.startedAt.getTime();
    const estimatedTotal = progress.overall > 0 
      ? (elapsedTime / progress.overall) * 100
      : 0;
    const remainingTime = estimatedTotal - elapsedTime;
    
    return {
      elapsedTime,
      estimatedTotal,
      remainingTime: Math.max(0, remainingTime),
      averageStepTime: progress.completedSteps > 0 
        ? elapsedTime / progress.completedSteps
        : 0,
      stepsPerMinute: progress.completedSteps > 0
        ? (progress.completedSteps / elapsedTime) * 60000
        : 0,
    };
  }, [session]);
  
  if (!session) {
    return (
      <div className={clsx(
        'bg-white rounded-lg shadow-md border border-gray-200 p-6',
        className
      )}>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active execution</p>
          <p className="text-sm text-gray-400 mt-1">
            Start an execution to see real-time progress
          </p>
        </div>
      </div>
    );
  }
  
  /**
   * Get step status icon
   */
  const getStepIcon = (status: string) => {
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
   * Format duration
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
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
            Execution Progress
          </h2>
          <p className="text-sm text-gray-500">
            {session.name} • {session.environment}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            session.status === 'running' 
              ? 'bg-blue-100 text-blue-800'
              : session.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : session.status === 'failed'
              ? 'bg-red-100 text-red-800'
              : session.status === 'paused'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          )}>
            {session.status}
          </div>
        </div>
      </div>
      
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(session.progress.overall)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={clsx(
              'h-3 rounded-full transition-all duration-500 relative overflow-hidden',
              session.status === 'failed' || session.status === 'error'
                ? 'bg-red-500'
                : session.status === 'completed'
                ? 'bg-green-500'
                : 'bg-blue-500'
            )}
            style={{ width: `${session.progress.overall}%` }}
          >
            {session.status === 'running' && (
              <div className="absolute inset-0 bg-white bg-opacity-30 animate-pulse" />
            )}
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>
            {session.progress.completedSteps} / {session.progress.totalSteps} steps
          </span>
          <span>
            {session.progress.completedScenarios} / {session.progress.totalScenarios} scenarios
          </span>
        </div>
      </div>
      
      {/* Metrics Grid */}
      {progressMetrics && !compact && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Elapsed</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {formatDuration(progressMetrics.elapsedTime)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Remaining</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {progressMetrics.remainingTime > 0 
                ? formatDuration(progressMetrics.remainingTime)
                : '--'
              }
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Avg Step</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {progressMetrics.averageStepTime > 0
                ? formatDuration(progressMetrics.averageStepTime)
                : '--'
              }
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Rate</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {progressMetrics.stepsPerMinute > 0
                ? `${Math.round(progressMetrics.stepsPerMinute)}/min`
                : '--'
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Current Steps */}
      {session.currentSteps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Active Steps
          </h3>
          <div className="space-y-2">
            {session.currentSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                {getStepIcon(step.status)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 truncate">
                      {step.stepName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {step.scenarioName}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-600">
                      {step.currentOperation}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(step.startedAt, { addSuffix: true })}
                    </span>
                  </div>
                  
                  {step.progress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div
                        className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {Math.round(step.progress)}%
                  </div>
                  {step.metrics.totalTime > 0 && (
                    <div className="text-xs text-gray-500">
                      {formatDuration(step.metrics.totalTime)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      {showTimeline && session.results.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Execution Timeline
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {session.results.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {result.status === 'passed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : result.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 truncate">
                      {result.scenario.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.summary.duration}ms
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {result.summary.passedSteps}/{result.summary.totalSteps} steps passed
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {format(result.metadata.startedAt, 'HH:mm:ss')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No Active Steps */}
      {session.currentSteps.length === 0 && session.status === 'running' && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-500">Preparing execution...</p>
        </div>
      )}
    </div>
  );
};

export default ProgressVisualizer;