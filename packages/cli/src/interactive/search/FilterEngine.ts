/**
 * Advanced Filtering Engine for search results
 * Provides sophisticated filtering capabilities based on multiple criteria
 */

import { SearchResult, SearchFilters } from './SearchEngine';
import { ScenarioResult } from '../types';

export interface FilterPredicate {
  (result: SearchResult): boolean;
}

export interface FilterCombination {
  operator: 'AND' | 'OR' | 'NOT';
  filters: (FilterPredicate | FilterCombination)[];
}

/**
 * Engine for applying complex filters to search results
 */
export class FilterEngine {
  /**
   * Apply filters to search results
   */
  applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    const predicates = this.buildFilterPredicates(filters);
    
    return results.filter(result => {
      return predicates.every(predicate => predicate(result));
    });
  }

  /**
   * Build advanced filter combinations
   */
  applyAdvancedFilters(results: SearchResult[], filterCombination: FilterCombination): SearchResult[] {
    return results.filter(result => this.evaluateFilterCombination(result, filterCombination));
  }

  /**
   * Get available filter values for faceted search
   */
  getFilterFacets(results: SearchResult[]): {
    fileTypes: string[];
    environments: string[];
    tags: string[];
    status: string[];
    stepTypes: string[];
    dateRanges: { label: string; start: Date; end: Date }[];
    performanceRanges: { label: string; min: number; max: number }[];
  } {
    const facets = {
      fileTypes: new Set<string>(),
      environments: new Set<string>(),
      tags: new Set<string>(),
      status: new Set<string>(),
      stepTypes: new Set<string>(),
      dateRanges: this.generateDateRanges(),
      performanceRanges: this.generatePerformanceRanges()
    };

    results.forEach(result => {
      // File types
      const extension = result.path.split('.').pop();
      if (extension) {
        facets.fileTypes.add(extension);
      }

      // Environments
      if (result.metadata.scenario?.environments) {
        result.metadata.scenario.environments.forEach(env => facets.environments.add(env));
      }

      // Tags
      if (result.metadata.tags) {
        result.metadata.tags.forEach(tag => facets.tags.add(tag));
      }

      // Status
      if (result.metadata.executionHistory && result.metadata.executionHistory.length > 0) {
        const lastExecution = result.metadata.executionHistory[0];
        facets.status.add(lastExecution.success ? 'passed' : 'failed');
      } else {
        facets.status.add('pending');
      }

      // Step types
      if (result.metadata.scenario) {
        result.metadata.scenario.steps.forEach(step => facets.stepTypes.add(step.type));
      } else if (result.metadata.step) {
        facets.stepTypes.add(result.metadata.step.type);
      }
    });

    return {
      fileTypes: Array.from(facets.fileTypes).sort(),
      environments: Array.from(facets.environments).sort(),
      tags: Array.from(facets.tags).sort(),
      status: Array.from(facets.status).sort(),
      stepTypes: Array.from(facets.stepTypes).sort(),
      dateRanges: facets.dateRanges,
      performanceRanges: facets.performanceRanges
    };
  }

  /**
   * Create smart filter suggestions based on current results
   */
  suggestFilters(results: SearchResult[]): {
    filter: Partial<SearchFilters>;
    description: string;
    resultCount: number;
  }[] {
    const suggestions: {
      filter: Partial<SearchFilters>;
      description: string;
      resultCount: number;
    }[] = [];

    // Suggest filters based on common patterns in results
    const facets = this.getFilterFacets(results);

    // Most common file type
    if (facets.fileTypes.length > 1) {
      const fileTypeCounts = this.countByFileType(results);
      const mostCommon = Object.entries(fileTypeCounts)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (mostCommon && mostCommon[1] > 1) {
        suggestions.push({
          filter: { fileTypes: [mostCommon[0]] },
          description: `Filter by ${mostCommon[0]} files`,
          resultCount: mostCommon[1]
        });
      }
    }

    // Failed scenarios
    const failedCount = results.filter(r => 
      r.metadata.executionHistory?.some(h => !h.success)
    ).length;
    
    if (failedCount > 0) {
      suggestions.push({
        filter: { status: ['failed'] },
        description: 'Show only failed scenarios',
        resultCount: failedCount
      });
    }

    // Recently modified
    const recentCount = results.filter(r => {
      const lastModified = r.metadata.lastModified;
      if (!lastModified) return false;
      const daysSince = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    if (recentCount > 0) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      suggestions.push({
        filter: { 
          executionDateRange: { 
            start: weekAgo, 
            end: new Date() 
          } 
        },
        description: 'Modified in last 7 days',
        resultCount: recentCount
      });
    }

    // Performance outliers
    const slowScenarios = results.filter(r => {
      const avgDuration = r.metadata.performanceMetrics?.avgDuration;
      return avgDuration && avgDuration > 5000; // > 5 seconds
    }).length;

    if (slowScenarios > 0) {
      suggestions.push({
        filter: { 
          performanceThreshold: { min: 5000 } 
        },
        description: 'Show slow scenarios (>5s)',
        resultCount: slowScenarios
      });
    }

    // Favorites
    const favoriteCount = results.filter(r => r.metadata.isFavorite).length;
    if (favoriteCount > 0) {
      suggestions.push({
        filter: { favorites: true },
        description: 'Show favorites only',
        resultCount: favoriteCount
      });
    }

    return suggestions.sort((a, b) => b.resultCount - a.resultCount);
  }

  /**
   * Create filter presets for common use cases
   */
  getFilterPresets(): {
    name: string;
    description: string;
    filters: SearchFilters;
  }[] {
    return [
      {
        name: 'Failed Tests',
        description: 'Scenarios that failed in recent executions',
        filters: {
          status: ['failed'],
          executionDateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            end: new Date()
          }
        }
      },
      {
        name: 'Performance Issues',
        description: 'Slow scenarios and performance bottlenecks',
        filters: {
          performanceThreshold: { min: 3000 }, // > 3 seconds
          status: ['passed', 'failed'] // Exclude pending
        }
      },
      {
        name: 'API Tests',
        description: 'HTTP API testing scenarios',
        filters: {
          stepTypes: ['api', 'http', 'get', 'post', 'put', 'delete']
        }
      },
      {
        name: 'Recent Changes',
        description: 'Recently modified or executed scenarios',
        filters: {
          executionDateRange: {
            start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Last 3 days
            end: new Date()
          }
        }
      },
      {
        name: 'Production Ready',
        description: 'Stable scenarios suitable for production',
        filters: {
          status: ['passed'],
          environments: ['production']
        }
      },
      {
        name: 'Error Prone',
        description: 'Scenarios with frequent failures',
        filters: {
          hasErrors: true
        }
      }
    ];
  }

  // Private methods

  private buildFilterPredicates(filters: SearchFilters): FilterPredicate[] {
    const predicates: FilterPredicate[] = [];

    // File type filter
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      predicates.push((result) => {
        const extension = result.path.split('.').pop();
        return extension ? filters.fileTypes!.includes(extension) : false;
      });
    }

    // Environment filter
    if (filters.environments && filters.environments.length > 0) {
      predicates.push((result) => {
        const scenarioEnvs = result.metadata.scenario?.environments || [];
        return filters.environments!.some(env => scenarioEnvs.includes(env));
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      predicates.push((result) => {
        const resultTags = result.metadata.tags || [];
        return filters.tags!.some(tag => resultTags.includes(tag));
      });
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      predicates.push((result) => {
        const executionHistory = result.metadata.executionHistory;
        if (!executionHistory || executionHistory.length === 0) {
          return filters.status!.includes('pending');
        }
        
        const lastExecution = executionHistory[0];
        const status = lastExecution.success ? 'passed' : 'failed';
        return filters.status!.includes(status);
      });
    }

    // Execution date range filter
    if (filters.executionDateRange) {
      predicates.push((result) => {
        const executionHistory = result.metadata.executionHistory;
        if (!executionHistory || executionHistory.length === 0) {
          return false;
        }
        
        const lastExecution = executionHistory[0];
        const executionDate = lastExecution.startTime;
        
        return executionDate >= filters.executionDateRange!.start &&
               executionDate <= filters.executionDateRange!.end;
      });
    }

    // Performance threshold filter
    if (filters.performanceThreshold) {
      predicates.push((result) => {
        const performance = result.metadata.performanceMetrics;
        if (!performance) return false;
        
        const { min, max } = filters.performanceThreshold!;
        const avgDuration = performance.avgDuration;
        
        if (min !== undefined && avgDuration < min) return false;
        if (max !== undefined && avgDuration > max) return false;
        
        return true;
      });
    }

    // Step types filter
    if (filters.stepTypes && filters.stepTypes.length > 0) {
      predicates.push((result) => {
        if (result.type === 'step' && result.metadata.step) {
          return filters.stepTypes!.includes(result.metadata.step.type);
        } else if (result.metadata.scenario) {
          return result.metadata.scenario.steps.some(step => 
            filters.stepTypes!.includes(step.type)
          );
        }
        return false;
      });
    }

    // Has errors filter
    if (filters.hasErrors !== undefined) {
      predicates.push((result) => {
        const executionHistory = result.metadata.executionHistory;
        if (!executionHistory || executionHistory.length === 0) {
          return !filters.hasErrors; // No history = no errors
        }
        
        const hasErrors = executionHistory.some(execution => !execution.success);
        return filters.hasErrors ? hasErrors : !hasErrors;
      });
    }

    // Favorites filter
    if (filters.favorites !== undefined) {
      predicates.push((result) => {
        const isFavorite = result.metadata.isFavorite || false;
        return filters.favorites ? isFavorite : !isFavorite;
      });
    }

    return predicates;
  }

  private evaluateFilterCombination(result: SearchResult, combination: FilterCombination): boolean {
    const { operator, filters } = combination;
    
    const results = filters.map(filter => {
      if (typeof filter === 'function') {
        return filter(result);
      } else {
        return this.evaluateFilterCombination(result, filter);
      }
    });

    switch (operator) {
      case 'AND':
        return results.every(r => r);
      case 'OR':
        return results.some(r => r);
      case 'NOT':
        return !results.some(r => r);
      default:
        return false;
    }
  }

  private generateDateRanges(): { label: string; start: Date; end: Date }[] {
    const now = new Date();
    const ranges = [];

    // Last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    ranges.push({
      label: 'Last 24 hours',
      start: yesterday,
      end: now
    });

    // Last week
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    ranges.push({
      label: 'Last week',
      start: lastWeek,
      end: now
    });

    // Last month
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    ranges.push({
      label: 'Last month',
      start: lastMonth,
      end: now
    });

    // Last 3 months
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    ranges.push({
      label: 'Last 3 months',
      start: last3Months,
      end: now
    });

    return ranges;
  }

  private generatePerformanceRanges(): { label: string; min: number; max: number }[] {
    return [
      { label: 'Very fast (<1s)', min: 0, max: 1000 },
      { label: 'Fast (1-3s)', min: 1000, max: 3000 },
      { label: 'Moderate (3-5s)', min: 3000, max: 5000 },
      { label: 'Slow (5-10s)', min: 5000, max: 10000 },
      { label: 'Very slow (>10s)', min: 10000, max: Infinity }
    ];
  }

  private countByFileType(results: SearchResult[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    results.forEach(result => {
      const extension = result.path.split('.').pop() || 'unknown';
      counts[extension] = (counts[extension] || 0) + 1;
    });

    return counts;
  }
}