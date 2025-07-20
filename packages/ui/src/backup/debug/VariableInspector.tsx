/**
 * Variable inspector and editor for debugging
 */

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateVariable } from '../../store/slices/executionSlice';
import {
  Search,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Variable,
  Globe,
  Settings,
  Database,
  Shuffle,
  History,
} from 'lucide-react';
import clsx from 'clsx';
import ReactJsonView from 'react-json-view';
import { formatDistanceToNow } from 'date-fns';

/**
 * VariableInspector props
 */
interface VariableInspectorProps {
  /** Additional CSS classes */
  className?: string;
  
  /** Show variable history */
  showHistory?: boolean;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Allow editing */
  allowEditing?: boolean;
}

/**
 * Variable inspector component for debugging
 */
export const VariableInspector: React.FC<VariableInspectorProps> = ({
  className,
  showHistory = true,
  compact = false,
  allowEditing = true,
}) => {
  const dispatch = useAppDispatch();
  const { session } = useAppSelector(state => state.execution);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['global', 'environment', 'context'])
  );
  const [showHidden, setShowHidden] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'current' | 'history'>('current');
  
  // Get variables from session
  const variables = session?.variables || {
    global: {},
    environment: {},
    context: {},
    response: {},
    request: {},
    random: {},
    aliases: {},
    history: [],
  };
  
  // Filter and search variables
  const filteredVariables = useMemo(() => {
    const categories = ['global', 'environment', 'context', 'response', 'request', 'random', 'aliases'];
    const result: Record<string, any> = {};
    
    categories.forEach(category => {
      if (selectedCategory !== 'all' && selectedCategory !== category) return;
      
      const categoryVars = variables[category as keyof typeof variables] as Record<string, any>;
      if (!categoryVars || typeof categoryVars !== 'object') return;
      
      const filtered: Record<string, any> = {};
      
      Object.entries(categoryVars).forEach(([key, value]) => {
        // Apply search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          if (!key.toLowerCase().includes(searchLower) && 
              !JSON.stringify(value).toLowerCase().includes(searchLower)) {
            return;
          }
        }
        
        // Apply hidden filter
        if (!showHidden && key.startsWith('_')) return;
        
        filtered[key] = value;
      });
      
      if (Object.keys(filtered).length > 0) {
        result[category] = filtered;
      }
    });
    
    return result;
  }, [variables, searchQuery, selectedCategory, showHidden]);
  
  // Get variable statistics
  const variableStats = useMemo(() => {
    const stats = {
      total: 0,
      categories: {} as Record<string, number>,
      changes: variables.history.length,
      recentChanges: variables.history.filter(
        change => Date.now() - change.timestamp.getTime() < 60000
      ).length,
    };
    
    Object.entries(filteredVariables).forEach(([category, vars]) => {
      const count = Object.keys(vars).length;
      stats.categories[category] = count;
      stats.total += count;
    });
    
    return stats;
  }, [filteredVariables, variables.history]);
  
  /**
   * Toggle category expansion
   */
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  /**
   * Start editing a variable
   */
  const startEditing = (path: string, currentValue: any) => {
    setEditingVariable(path);
    setEditValue(JSON.stringify(currentValue, null, 2));
  };
  
  /**
   * Save variable edit
   */
  const saveEdit = () => {
    if (!editingVariable) return;
    
    try {
      const newValue = JSON.parse(editValue);
      dispatch(updateVariable({
        path: editingVariable,
        value: newValue,
        source: 'manual_edit',
      }));
      setEditingVariable(null);
      setEditValue('');
    } catch (error) {
      alert('Invalid JSON format');
    }
  };
  
  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingVariable(null);
    setEditValue('');
  };
  
  /**
   * Copy variable value
   */
  const copyValue = (value: any) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    // Could add a toast notification here
  };
  
  /**
   * Get category icon
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'global':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'environment':
        return <Settings className="w-4 h-4 text-green-500" />;
      case 'context':
        return <Database className="w-4 h-4 text-purple-500" />;
      case 'response':
        return <Variable className="w-4 h-4 text-orange-500" />;
      case 'request':
        return <Variable className="w-4 h-4 text-red-500" />;
      case 'random':
        return <Shuffle className="w-4 h-4 text-yellow-500" />;
      case 'aliases':
        return <Variable className="w-4 h-4 text-gray-500" />;
      default:
        return <Variable className="w-4 h-4 text-gray-400" />;
    }
  };
  
  /**
   * Get category display name
   */
  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  if (!session) {
    return (
      <div className={clsx(
        'bg-white rounded-lg shadow-md border border-gray-200 p-6',
        className
      )}>
        <div className="text-center py-8">
          <Variable className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active execution</p>
          <p className="text-sm text-gray-400 mt-1">
            Start an execution to inspect variables
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
            Variable Inspector
          </h2>
          <p className="text-sm text-gray-500">
            {variableStats.total} variables • {variableStats.changes} changes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={clsx(
              'p-2 rounded-md transition-colors',
              showHidden 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            )}
            title={showHidden ? 'Hide internal variables' : 'Show internal variables'}
          >
            {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            title="Refresh variables"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="global">Global</option>
            <option value="environment">Environment</option>
            <option value="context">Context</option>
            <option value="response">Response</option>
            <option value="request">Request</option>
            <option value="random">Random</option>
            <option value="aliases">Aliases</option>
          </select>
        </div>
      </div>
      
      {/* Tabs */}
      {showHistory && (
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { key: 'current', label: 'Current Values', icon: Variable },
            { key: 'history', label: 'Change History', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                selectedTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Content */}
      {selectedTab === 'current' ? (
        <div className="space-y-4">
          {Object.entries(filteredVariables).length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No variables found</p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          ) : (
            Object.entries(filteredVariables).map(([category, vars]) => {
              const isExpanded = expandedCategories.has(category);
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      {getCategoryIcon(category)}
                      <span className="font-medium text-gray-900">
                        {getCategoryDisplayName(category)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({Object.keys(vars).length} variables)
                      </span>
                    </div>
                  </button>
                  
                  {/* Category Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4">
                      <div className="space-y-3">
                        {Object.entries(vars).map(([key, value]) => {
                          const variablePath = `${category}.${key}`;
                          const isEditing = editingVariable === variablePath;
                          
                          return (
                            <div
                              key={key}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {key}
                                </span>
                                
                                {allowEditing && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => copyValue(value)}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                      title="Copy value"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={saveEdit}
                                          className="p-1 text-green-600 hover:text-green-700"
                                          title="Save changes"
                                        >
                                          <Save className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={cancelEdit}
                                          className="p-1 text-red-600 hover:text-red-700"
                                          title="Cancel edit"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => startEditing(variablePath, value)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                        title="Edit value"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {isEditing ? (
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded font-mono text-sm resize-vertical"
                                  rows={Math.min(10, editValue.split('\n').length + 1)}
                                />
                              ) : (
                                <div className="max-h-48 overflow-auto">
                                  <ReactJsonView
                                    src={value}
                                    theme="rjv-default"
                                    collapsed={2}
                                    displayObjectSize={false}
                                    displayDataTypes={false}
                                    enableClipboard={false}
                                    style={{ fontSize: '12px' }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Variable Change History */
        <div className="space-y-3">
          {variables.history.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No variable changes</p>
              <p className="text-sm text-gray-400 mt-1">
                Variable changes will appear here during execution
              </p>
            </div>
          ) : (
            variables.history
              .slice()
              .reverse()
              .slice(0, 50) // Show only recent 50 changes
              .map((change) => (
                <div
                  key={change.id}
                  className="p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {change.path}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(change.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    {change.reason} {change.sourceStep && `(${change.sourceStep})`}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Old Value</div>
                      <div className="max-h-24 overflow-auto bg-red-50 p-2 rounded">
                        <ReactJsonView
                          src={change.oldValue}
                          theme="rjv-default"
                          collapsed={1}
                          displayObjectSize={false}
                          displayDataTypes={false}
                          enableClipboard={false}
                          style={{ fontSize: '10px' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">New Value</div>
                      <div className="max-h-24 overflow-auto bg-green-50 p-2 rounded">
                        <ReactJsonView
                          src={change.newValue}
                          theme="rjv-default"
                          collapsed={1}
                          displayObjectSize={false}
                          displayDataTypes={false}
                          enableClipboard={false}
                          style={{ fontSize: '10px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};

export default VariableInspector;