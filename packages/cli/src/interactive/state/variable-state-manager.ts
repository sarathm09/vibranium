/**
 * Variable state manager for tracking and managing variable states in interactive mode
 */

import { 
  IVariableStateManager, 
  VariableStateEntry, 
  VariableMetadata, 
  VariableFilter, 
  VariableSortOptions, 
  VariableInspectorData, 
  VariableOperationResult, 
  VariableChangeEvent,
  VariableSource,
  VariableCategory,
  VariableUsage,
  VariableValueHistory,
  VariableDependency,
  VariableUsageAnalysis
} from '../types/variable-state';

/**
 * Implementation of variable state manager
 */
export class VariableStateManager implements IVariableStateManager {
  private variables = new Map<string, VariableStateEntry>();
  private subscribers: Array<(event: VariableChangeEvent) => void> = [];
  private recentChangeThreshold = 5000; // 5 seconds

  constructor() {
    this.initializeBuiltinCategories();
  }

  /**
   * Initialize built-in variable categories
   */
  private initializeBuiltinCategories(): void {
    const builtinCategories = [
      { path: '$.env', category: 'environment' as VariableCategory },
      { path: '$.global', category: 'global' as VariableCategory },
      { path: '$.context', category: 'context' as VariableCategory },
      { path: '$.scenario', category: 'scenario' as VariableCategory },
      { path: '$.api', category: 'api' as VariableCategory },
      { path: '$.ui', category: 'ui' as VariableCategory },
      { path: '$.request', category: 'request' as VariableCategory },
      { path: '$.response', category: 'response' as VariableCategory },
      { path: '$.random', category: 'random' as VariableCategory },
      { path: '$.history', category: 'history' as VariableCategory },
    ];

    // Create placeholders for built-in categories if they don't exist
    builtinCategories.forEach(({ path, category }) => {
      if (!this.variables.has(path)) {
        this.createVariableEntry(path, {}, 'system', category, true);
      }
    });
  }

  /**
   * Get all variables
   */
  getAllVariables(): Map<string, VariableStateEntry> {
    return new Map(this.variables);
  }

  /**
   * Get variable by path
   */
  getVariable(path: string): VariableStateEntry | undefined {
    const entry = this.variables.get(path);
    if (entry) {
      this.trackAccess(path);
    }
    return entry;
  }

  /**
   * Set variable value
   */
  setVariable(path: string, value: any, source: VariableSource, reason?: string): void {
    const existing = this.variables.get(path);
    const now = new Date();

    if (existing) {
      const previousValue = existing.value;
      
      // Update existing variable
      existing.previousValue = previousValue;
      existing.value = value;
      existing.metadata.updatedAt = now;
      existing.metadata.dataType = this.getDataType(value);
      existing.metadata.size = this.calculateSize(value);
      existing.hasRecentChange = true;
      existing.lastChangeTime = now;
      
      // Add to history
      existing.history.push({
        value: previousValue,
        timestamp: now,
        source: source,
        reason: reason
      });
      
      // Limit history size
      if (existing.history.length > 100) {
        existing.history = existing.history.slice(-100);
      }
      
      this.emitEvent({
        type: 'updated',
        path,
        newValue: value,
        previousValue,
        source,
        timestamp: now,
        reason
      });
    } else {
      // Create new variable
      const category = this.determineCategory(path);
      this.createVariableEntry(path, value, source, category, false, reason);
      
      this.emitEvent({
        type: 'created',
        path,
        newValue: value,
        source,
        timestamp: now,
        reason
      });
    }
    
    // Update dependencies
    this.updateDependencies(path, value);
    
    // Clear recent change flag after threshold
    setTimeout(() => {
      const entry = this.variables.get(path);
      if (entry && entry.lastChangeTime === now) {
        entry.hasRecentChange = false;
      }
    }, this.recentChangeThreshold);
  }

  /**
   * Create a new variable entry
   */
  private createVariableEntry(
    path: string, 
    value: any, 
    source: VariableSource, 
    category: VariableCategory,
    isComputed: boolean,
    reason?: string
  ): void {
    const now = new Date();
    
    const metadata: VariableMetadata = {
      path,
      category,
      dataType: this.getDataType(value),
      source,
      createdAt: now,
      updatedAt: now,
      size: this.calculateSize(value),
      isComputed,
      dependencies: [],
      dependents: [],
      usageCount: 0,
      usedInSteps: [],
      isBookmarked: false,
      tags: [],
      description: undefined
    };
    
    const entry: VariableStateEntry = {
      metadata,
      value,
      history: [],
      hasRecentChange: true,
      lastChangeTime: now
    };
    
    this.variables.set(path, entry);
  }

  /**
   * Update variable metadata
   */
  updateMetadata(path: string, metadata: Partial<VariableMetadata>): void {
    const entry = this.variables.get(path);
    if (entry) {
      Object.assign(entry.metadata, metadata);
      entry.metadata.updatedAt = new Date();
    }
  }

  /**
   * Track variable usage
   */
  trackUsage(
    path: string, 
    stepIndex: number, 
    stepName: string, 
    usageType: 'read' | 'write' | 'reference', 
    field: string
  ): void {
    const entry = this.variables.get(path);
    if (entry) {
      const usage: VariableUsage = {
        stepIndex,
        stepName,
        usageType,
        field,
        timestamp: new Date()
      };
      
      entry.metadata.usedInSteps.push(usage);
      entry.metadata.usageCount++;
      
      // Limit usage history
      if (entry.metadata.usedInSteps.length > 1000) {
        entry.metadata.usedInSteps = entry.metadata.usedInSteps.slice(-1000);
      }
    }
  }

  /**
   * Filter variables
   */
  filterVariables(filter: VariableFilter): Map<string, VariableStateEntry> {
    const result = new Map<string, VariableStateEntry>();
    
    for (const [path, entry] of this.variables) {
      if (this.matchesFilter(entry, filter)) {
        result.set(path, entry);
      }
    }
    
    return result;
  }

  /**
   * Check if variable matches filter
   */
  private matchesFilter(entry: VariableStateEntry, filter: VariableFilter): boolean {
    // Search pattern
    if (filter.searchPattern) {
      const pattern = filter.searchPattern.toLowerCase();
      const pathMatches = entry.metadata.path.toLowerCase().includes(pattern);
      const valueMatches = JSON.stringify(entry.value).toLowerCase().includes(pattern);
      const tagsMatch = entry.metadata.tags.some(tag => tag.toLowerCase().includes(pattern));
      
      if (!pathMatches && !valueMatches && !tagsMatch) {
        return false;
      }
    }
    
    // Category filter
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(entry.metadata.category)) {
        return false;
      }
    }
    
    // Source filter
    if (filter.sources && filter.sources.length > 0) {
      if (!filter.sources.includes(entry.metadata.source)) {
        return false;
      }
    }
    
    // Data type filter
    if (filter.dataTypes && filter.dataTypes.length > 0) {
      if (!filter.dataTypes.includes(entry.metadata.dataType)) {
        return false;
      }
    }
    
    // Bookmarked only
    if (filter.bookmarkedOnly && !entry.metadata.isBookmarked) {
      return false;
    }
    
    // Recent changes only
    if (filter.recentChangesOnly && !entry.hasRecentChange) {
      return false;
    }
    
    // With dependencies only
    if (filter.withDependenciesOnly && entry.metadata.dependencies.length === 0) {
      return false;
    }
    
    // Value range (for numbers)
    if (filter.valueRange && typeof entry.value === 'number') {
      const { min, max } = filter.valueRange;
      if ((min !== undefined && entry.value < min) || (max !== undefined && entry.value > max)) {
        return false;
      }
    }
    
    // Usage filter
    if (filter.usageFilter) {
      const { minUsage, maxUsage } = filter.usageFilter;
      const usage = entry.metadata.usageCount;
      if ((minUsage !== undefined && usage < minUsage) || (maxUsage !== undefined && usage > maxUsage)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Sort variables
   */
  sortVariables(
    variables: Map<string, VariableStateEntry>, 
    sort: VariableSortOptions
  ): [string, VariableStateEntry][] {
    const entries = Array.from(variables.entries());
    
    entries.sort(([pathA, entryA], [pathB, entryB]) => {
      let valueA: any;
      let valueB: any;
      
      switch (sort.field) {
        case 'name':
          valueA = pathA;
          valueB = pathB;
          break;
        case 'category':
          valueA = entryA.metadata.category;
          valueB = entryB.metadata.category;
          break;
        case 'updatedAt':
          valueA = entryA.metadata.updatedAt.getTime();
          valueB = entryB.metadata.updatedAt.getTime();
          break;
        case 'usageCount':
          valueA = entryA.metadata.usageCount;
          valueB = entryB.metadata.usageCount;
          break;
        case 'size':
          valueA = entryA.metadata.size || 0;
          valueB = entryB.metadata.size || 0;
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return entries;
  }

  /**
   * Get variable inspector data
   */
  getInspectorData(path: string): VariableInspectorData | undefined {
    const entry = this.variables.get(path);
    if (!entry) return undefined;
    
    const dependencyTree = this.buildDependencyTree(path);
    const usageAnalysis = this.analyzeUsage(entry);
    
    return {
      metadata: entry.metadata,
      value: entry.value,
      formattedValue: this.formatValue(entry.value),
      jsonPath: typeof entry.value === 'object' ? path : undefined,
      dependencyTree,
      usageAnalysis,
      statistics: this.calculateStatistics(entry)
    };
  }

  /**
   * Bookmark variable
   */
  bookmarkVariable(path: string): VariableOperationResult {
    const entry = this.variables.get(path);
    if (!entry) {
      return {
        success: false,
        message: 'Variable not found',
        error: `No variable found at path: ${path}`
      };
    }
    
    entry.metadata.isBookmarked = !entry.metadata.isBookmarked;
    const action = entry.metadata.isBookmarked ? 'bookmarked' : 'unbookmarked';
    
    return {
      success: true,
      message: `Variable ${action} successfully`,
      data: { bookmarked: entry.metadata.isBookmarked }
    };
  }

  /**
   * Copy variable value
   */
  copyVariable(path: string): VariableOperationResult {
    const entry = this.variables.get(path);
    if (!entry) {
      return {
        success: false,
        message: 'Variable not found',
        error: `No variable found at path: ${path}`
      };
    }
    
    let formattedValue: string;
    try {
      formattedValue = typeof entry.value === 'string' 
        ? entry.value 
        : JSON.stringify(entry.value, null, 2);
    } catch (error) {
      formattedValue = String(entry.value);
    }
    
    // In a real implementation, this would copy to clipboard
    // For now, we'll just return the formatted value
    return {
      success: true,
      message: 'Variable value copied',
      data: { value: formattedValue }
    };
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [path, entry] of this.variables) {
      graph.set(path, [...entry.metadata.dependencies]);
    }
    
    return graph;
  }

  /**
   * Clear variable history
   */
  clearHistory(path?: string): void {
    if (path) {
      const entry = this.variables.get(path);
      if (entry) {
        entry.history = [];
      }
    } else {
      for (const entry of this.variables.values()) {
        entry.history = [];
      }
    }
  }

  /**
   * Export variables
   */
  exportVariables(format: 'json' | 'yaml' | 'csv'): string {
    const data: any = {};
    
    for (const [path, entry] of this.variables) {
      data[path] = {
        value: entry.value,
        metadata: entry.metadata,
        hasRecentChange: entry.hasRecentChange
      };
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'yaml':
        // Would need yaml library for proper YAML export
        return JSON.stringify(data, null, 2); // Fallback to JSON
      case 'csv':
        const headers = 'Path,Value,Category,Source,Type,Updated';
        const rows = Array.from(this.variables.entries()).map(([path, entry]) => {
          const value = typeof entry.value === 'object' 
            ? JSON.stringify(entry.value).replace(/"/g, '""')
            : String(entry.value).replace(/"/g, '""');
          return `"${path}","${value}","${entry.metadata.category}","${entry.metadata.source}","${entry.metadata.dataType}","${entry.metadata.updatedAt.toISOString()}"`;
        });
        return [headers, ...rows].join('\n');
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Subscribe to variable changes
   */
  subscribe(callback: (event: VariableChangeEvent) => void): void {
    this.subscribers.push(callback);
  }

  /**
   * Unsubscribe from variable changes
   */
  unsubscribe(callback: (event: VariableChangeEvent) => void): void {
    const index = this.subscribers.indexOf(callback);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  // Private helper methods

  private trackAccess(path: string): void {
    this.emitEvent({
      type: 'accessed',
      path,
      source: 'system',
      timestamp: new Date()
    });
  }

  private emitEvent(event: VariableChangeEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in variable change callback:', error);
      }
    });
  }

  private getDataType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return String(value).length;
    }
  }

  private determineCategory(path: string): VariableCategory {
    if (path.startsWith('$.env')) return 'environment';
    if (path.startsWith('$.global')) return 'global';
    if (path.startsWith('$.context')) return 'context';
    if (path.startsWith('$.scenario')) return 'scenario';
    if (path.startsWith('$.api')) return 'api';
    if (path.startsWith('$.ui')) return 'ui';
    if (path.startsWith('$.request')) return 'request';
    if (path.startsWith('$.response')) return 'response';
    if (path.startsWith('$.random')) return 'random';
    if (path.startsWith('$.history')) return 'history';
    return 'custom';
  }

  private updateDependencies(path: string, value: any): void {
    const entry = this.variables.get(path);
    if (!entry) return;
    
    // Simple dependency detection - look for variable references in string values
    const dependencies = new Set<string>();
    
    if (typeof value === 'string') {
      const matches = value.match(/\$\.[\w.]+/g);
      if (matches) {
        matches.forEach(match => dependencies.add(match));
      }
    } else if (typeof value === 'object' && value !== null) {
      const stringified = JSON.stringify(value);
      const matches = stringified.match(/\$\.[\w.]+/g);
      if (matches) {
        matches.forEach(match => dependencies.add(match));
      }
    }
    
    entry.metadata.dependencies = Array.from(dependencies);
    
    // Update dependents in referenced variables
    for (const depPath of dependencies) {
      const depEntry = this.variables.get(depPath);
      if (depEntry && !depEntry.metadata.dependents.includes(path)) {
        depEntry.metadata.dependents.push(path);
      }
    }
  }

  private buildDependencyTree(path: string): VariableDependency[] {
    const visited = new Set<string>();
    const result: VariableDependency[] = [];
    
    const buildTree = (currentPath: string, level: number) => {
      if (visited.has(currentPath) || level > 10) return; // Prevent infinite recursion
      visited.add(currentPath);
      
      const entry = this.variables.get(currentPath);
      if (!entry) return;
      
      for (const depPath of entry.metadata.dependencies) {
        const isCircular = visited.has(depPath);
        const isAvailable = this.variables.has(depPath);
        
        result.push({
          path: depPath,
          type: isCircular ? 'circular' : level === 0 ? 'direct' : 'indirect',
          level,
          isAvailable
        });
        
        if (!isCircular) {
          buildTree(depPath, level + 1);
        }
      }
    };
    
    buildTree(path, 0);
    return result;
  }

  private analyzeUsage(entry: VariableStateEntry): VariableUsageAnalysis {
    const usageByStep = new Map<number, number>();
    const usageTypes = { read: 0, write: 0, reference: 0 };
    let firstUsed: Date | undefined;
    let lastUsed: Date | undefined;
    
    for (const usage of entry.metadata.usedInSteps) {
      // Usage by step
      const stepCount = usageByStep.get(usage.stepIndex) || 0;
      usageByStep.set(usage.stepIndex, stepCount + 1);
      
      // Usage types
      usageTypes[usage.usageType]++;
      
      // First/last usage
      if (!firstUsed || usage.timestamp < firstUsed) {
        firstUsed = usage.timestamp;
      }
      if (!lastUsed || usage.timestamp > lastUsed) {
        lastUsed = usage.timestamp;
      }
    }
    
    return {
      totalUsage: entry.metadata.usageCount,
      usageByStep,
      usageTypes,
      firstUsed,
      lastUsed,
      frequentContext: entry.metadata.usedInSteps[0]?.field
    };
  }

  private calculateStatistics(entry: VariableStateEntry): any {
    const values = [entry.value, ...entry.history.map(h => h.value)];
    
    if (typeof entry.value === 'number') {
      const numbers = values.filter(v => typeof v === 'number') as number[];
      return {
        changeCount: entry.history.length,
        average: numbers.reduce((sum, n) => sum + n, 0) / numbers.length,
        range: {
          min: Math.min(...numbers),
          max: Math.max(...numbers)
        },
        memoryUsage: entry.metadata.size || 0
      };
    }
    
    return {
      changeCount: entry.history.length,
      memoryUsage: entry.metadata.size || 0
    };
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}