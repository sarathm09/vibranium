/**
 * Execution queue management component
 */

import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  queueExecution,
  updateQueueItem,
  removeFromQueue,
  clearQueue,
} from '../../store/slices/executionSlice';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Calendar,
  Settings,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { QueuedExecution, ScenarioTarget } from '../../types/execution';

/**
 * ExecutionQueue props
 */
interface ExecutionQueueProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Show queue controls */
  showControls?: boolean;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Maximum visible items */
  maxVisibleItems?: number;
}

/**
 * Execution queue component
 */
export const ExecutionQueue: React.FC<ExecutionQueueProps> = ({
  className,
  showControls = true,
  compact = false,
  maxVisibleItems = 10,
}) => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { queue, settings, metrics } = useAppSelector(state => state.execution);
  const { scenarios } = useAppSelector(state => state.scenarios);
  
  // Local state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('default');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [executionName, setExecutionName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState(1);
  
  // Filter and sort queue
  const sortedQueue = [...queue].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return a.createdAt.getTime() - b.createdAt.getTime(); // Earlier first
  });
  
  const visibleQueue = sortedQueue.slice(0, maxVisibleItems);
  
  /**
   * Add execution to queue
   */
  const handleAddToQueue = async () => {
    if (!executionName.trim() || selectedScenarios.length === 0) {
      alert('Please provide a name and select scenarios');
      return;
    }
    
    const scenarios: ScenarioTarget[] = selectedScenarios.map((path, index) => ({
      path,
      name: scenarios[path]?.name || 'Unknown',
      priority: index + 1,
      dependencies: [],
    }));
    
    await dispatch(queueExecution({
      name: executionName.trim(),
      scenarios,
      environment: selectedEnvironment,
      priority,
      scheduledAt: scheduledTime ? new Date(scheduledTime) : undefined,
      config: {
        maxConcurrency: 1,
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
        debugMode: false,
        variableOverrides: {},
      },
    }));
    
    // Reset form
    setExecutionName('');
    setSelectedScenarios([]);
    setScheduledTime('');
    setPriority(1);
    setShowAddDialog(false);
  };
  
  /**
   * Remove from queue
   */
  const handleRemoveFromQueue = (id: string) => {
    dispatch(removeFromQueue(id));
  };
  
  /**
   * Update queue item priority
   */
  const handleUpdatePriority = (id: string, newPriority: number) => {
    dispatch(updateQueueItem({
      id,
      updates: { priority: Math.max(1, Math.min(5, newPriority)) },
    }));
  };
  
  /**
   * Clear entire queue
   */
  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear the entire queue?')) {
      dispatch(clearQueue());
    }
  };
  
  /**
   * Get status icon
   */
  const getStatusIcon = (status: QueuedExecution['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'ready':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'executing':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  /**
   * Get priority badge color
   */
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'bg-red-100 text-red-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 1:
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div>
          <h2 className={clsx(
            'font-semibold text-gray-900',
            compact ? 'text-sm' : 'text-lg'
          )}>
            Execution Queue
          </h2>
          {!compact && (
            <p className="text-sm text-gray-500">
              {queue.length} {queue.length === 1 ? 'item' : 'items'} queued
            </p>
          )}
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="w-3 h-3" />
              {!compact && <span>Add</span>}
            </button>
            
            {queue.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                <Trash2 className="w-3 h-3" />
                {!compact && <span>Clear</span>}
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Queue Items */}
      {queue.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No executions queued</p>
          <p className="text-sm text-gray-400 mt-1">
            Add scenarios to the queue to execute them later
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleQueue.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'border rounded-lg p-3 transition-colors',
                item.status === 'executing' 
                  ? 'border-blue-300 bg-blue-50'
                  : item.status === 'completed'
                  ? 'border-green-300 bg-green-50'
                  : item.status === 'failed'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(item.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      
                      {/* Priority Badge */}
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getPriorityColor(item.priority)
                      )}>
                        P{item.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{item.scenarios.length} scenarios</span>
                      <span>{item.environment}</span>
                      {item.scheduledAt && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(item.scheduledAt, { addSuffix: true })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-1">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdatePriority(item.id, item.priority + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Increase priority"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => handleUpdatePriority(item.id, item.priority - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Decrease priority"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleRemoveFromQueue(item.id)}
                    disabled={item.status === 'executing'}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {queue.length > maxVisibleItems && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                +{queue.length - maxVisibleItems} more items
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Queue Stats */}
      {!compact && queue.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {queue.filter(q => q.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {queue.filter(q => q.status === 'executing').length}
              </div>
              <div className="text-xs text-gray-500">Running</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {queue.filter(q => q.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {queue.filter(q => q.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add to Queue Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add to Queue
              </h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Execution Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={executionName}
                  onChange={(e) => setExecutionName(e.target.value)}
                  placeholder="Enter execution name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Environment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
              
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>Low (1)</option>
                  <option value={2}>Below Normal (2)</option>
                  <option value={3}>Normal (3)</option>
                  <option value={4}>High (4)</option>
                  <option value={5}>Critical (5)</option>
                </select>
              </div>
              
              {/* Scheduled Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Scenarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenarios
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {Object.entries(scenarios).map(([path, scenario]) => (
                    <label key={path} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.includes(path)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScenarios([...selectedScenarios, path]);
                          } else {
                            setSelectedScenarios(selectedScenarios.filter(s => s !== path));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 truncate">
                        {scenario.name}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedScenarios.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedScenarios.length} scenarios selected
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToQueue}
                disabled={!executionName.trim() || selectedScenarios.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionQueue;