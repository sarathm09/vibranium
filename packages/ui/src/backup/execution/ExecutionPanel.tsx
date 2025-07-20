/**
 * Main execution panel with controls and real-time monitoring
 */

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  startExecutionSession,
  stopExecutionSession,
  pauseExecutionSession,
  resumeExecutionSession,
} from '../../store/slices/executionSlice';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';
import type { ExecutionSession, ScenarioTarget } from '../../types/execution';

/**
 * ExecutionPanel props
 */
interface ExecutionPanelProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Show advanced controls */
  showAdvancedControls?: boolean;
  
  /** Compact mode */
  compact?: boolean;
}

/**
 * Main execution panel component
 */
export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  className,
  showAdvancedControls = true,
  compact = false,
}) => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { 
    session, 
    connectionStatus, 
    metrics,
    settings 
  } = useAppSelector(state => state.execution);
  
  const { selectedScenario, scenarios } = useAppSelector(state => state.scenarios);
  
  // Local state
  const [selectedEnvironment, setSelectedEnvironment] = useState('default');
  const [executionMode, setExecutionMode] = useState<'single' | 'batch' | 'debug'>('single');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  
  // Status indicators
  const isConnected = connectionStatus === 'connected';
  const isExecuting = session?.status === 'running';
  const isPaused = session?.status === 'paused';
  const hasError = session?.error != null;
  
  /**
   * Start execution
   */
  const handleStartExecution = async () => {
    if (!selectedScenario && selectedScenarios.length === 0) {
      alert('Please select a scenario to execute');
      return;
    }
    
    const scenarios: ScenarioTarget[] = executionMode === 'single' 
      ? selectedScenario ? [{
          path: selectedScenario,
          name: scenarios[selectedScenario]?.name || 'Unknown',
          priority: 1,
          dependencies: [],
        }] : []
      : selectedScenarios.map((path, index) => ({
          path,
          name: scenarios[path]?.name || 'Unknown',
          priority: index + 1,
          dependencies: [],
        }));
    
    await dispatch(startExecutionSession({
      name: `${executionMode === 'single' ? 'Single' : 'Batch'} Execution`,
      type: executionMode,
      environment: selectedEnvironment,
      scenarios,
      config: {
        maxConcurrency: executionMode === 'batch' ? settings.maxConcurrentExecutions : 1,
        timeout: settings.defaultTimeout,
        retryPolicy: {
          enabled: settings.autoRetry,
          maxAttempts: 3,
          delay: 1000,
          exponentialBackoff: true,
          conditions: [],
        },
        stopOnFailure: false,
        continueOnError: true,
        generateArtifacts: true,
        realTimeReporting: settings.realTimeUpdates,
        debugMode: executionMode === 'debug',
        variableOverrides: {},
      },
    }));
  };
  
  /**
   * Stop execution
   */
  const handleStopExecution = async () => {
    if (session) {
      await dispatch(stopExecutionSession(session.id));
    }
  };
  
  /**
   * Pause execution
   */
  const handlePauseExecution = async () => {
    if (session) {
      await dispatch(pauseExecutionSession(session.id));
    }
  };
  
  /**
   * Resume execution
   */
  const handleResumeExecution = async () => {
    if (session) {
      await dispatch(resumeExecutionSession(session.id));
    }
  };
  
  /**
   * Restart execution
   */
  const handleRestartExecution = () => {
    if (session) {
      handleStopExecution().then(() => {
        setTimeout(handleStartExecution, 1000);
      });
    }
  };
  
  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    if (!session) return <Activity className="w-4 h-4 text-gray-400" />;
    
    switch (session.status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-500 animate-pulse" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };
  
  /**
   * Get status text
   */
  const getStatusText = () => {
    if (!session) return 'Ready to execute';
    
    switch (session.status) {
      case 'running':
        return `Executing... (${session.progress.currentStep}/${session.progress.totalSteps})`;
      case 'paused':
        return 'Execution paused';
      case 'completed':
        return `Completed in ${((session.endedAt?.getTime() || Date.now()) - session.startedAt.getTime()) / 1000}s`;
      case 'failed':
        return 'Execution failed';
      case 'error':
        return 'Execution error';
      case 'cancelled':
        return 'Execution cancelled';
      default:
        return 'Preparing...';
    }
  };
  
  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-md border border-gray-200',
      compact ? 'p-3' : 'p-6',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h2 className={clsx(
              'font-semibold text-gray-900',
              compact ? 'text-sm' : 'text-lg'
            )}>
              Execution Control
            </h2>
            {!compact && (
              <p className="text-sm text-gray-500">
                {getStatusText()}
              </p>
            )}
          </div>
        </div>
        
        {/* Connection status */}
        <div className="flex items-center space-x-2">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Configuration */}
      {!compact && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Environment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isExecuting}
            >
              <option value="default">Default</option>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
          
          {/* Execution Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode
            </label>
            <select
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isExecuting}
            >
              <option value="single">Single Scenario</option>
              <option value="batch">Batch Execution</option>
              <option value="debug">Debug Mode</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      {session && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {Math.round(session.progress.overall)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                session.status === 'failed' || session.status === 'error'
                  ? 'bg-red-500'
                  : session.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              )}
              style={{ width: `${session.progress.overall}%` }}
            />
          </div>
          {!compact && (
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {session.progress.completedSteps} / {session.progress.totalSteps} steps
              </span>
              <span>
                {session.progress.estimatedTimeRemaining > 0 && 
                  `ETA: ${Math.round(session.progress.estimatedTimeRemaining / 1000)}s`
                }
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        {!session || session.status === 'completed' || session.status === 'failed' || session.status === 'cancelled' ? (
          <button
            onClick={handleStartExecution}
            disabled={!isConnected || (!selectedScenario && selectedScenarios.length === 0)}
            className={clsx(
              'flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors',
              'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
            )}
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            {isPaused ? (
              <button
                onClick={handleResumeExecution}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handlePauseExecution}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
            
            <button
              onClick={handleStopExecution}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        )}
        
        {showAdvancedControls && (
          <>
            <button
              onClick={handleRestartExecution}
              disabled={!session}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {!compact && <span>Restart</span>}
            </button>
            
            <button
              className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
            >
              <Settings className="w-4 h-4" />
              {!compact && <span>Settings</span>}
            </button>
          </>
        )}
      </div>
      
      {/* Error Display */}
      {hasError && session?.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-800">
              Execution Error
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {session.error.message}
          </p>
        </div>
      )}
      
      {/* Quick Stats */}
      {!compact && metrics.totalExecutions > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {metrics.totalExecutions}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {Math.round(metrics.successRate)}%
              </div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(metrics.averageExecutionTime / 1000)}s
              </div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionPanel;