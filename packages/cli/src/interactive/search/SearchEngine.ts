/**
 * Core Search Engine for Vibranium CLI
 * Provides full-text search, filtering, and indexing capabilities
 */

import { Scenario, Step, ScenarioResult } from '../types';
import { SearchIndex } from './SearchIndex';
import { FilterEngine } from './FilterEngine';
import { DiscoveryEngine } from './DiscoveryEngine';

export interface SearchQuery {
  text?: string;
  regex?: string;
  filters?: SearchFilters;
  options?: SearchOptions;
}

export interface SearchFilters {
  fileTypes?: string[];
  environments?: string[];
  tags?: string[];
  status?: ('passed' | 'failed' | 'pending')[];
  executionDateRange?: {
    start: Date;
    end: Date;
  };
  performanceThreshold?: {
    min?: number;
    max?: number;
  };
  stepTypes?: string[];
  hasErrors?: boolean;
  favorites?: boolean;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  includeContent?: boolean;
  includeComments?: boolean;
  includeFileNames?: boolean;
  maxResults?: number;
  sortBy?: 'relevance' | 'name' | 'modified' | 'performance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  type: 'scenario' | 'step' | 'file';
  name: string;
  path: string;
  relevanceScore: number;
  matches: SearchMatch[];
  metadata: SearchResultMetadata;
}

export interface SearchMatch {
  field: string;
  text: string;
  startIndex: number;
  endIndex: number;
  context: string;
  lineNumber?: number;
}

export interface SearchResultMetadata {
  scenario?: Scenario;
  step?: Step;
  stepIndex?: number;
  parentScenario?: string;
  fileSize?: number;
  lastModified?: Date;
  executionHistory?: ScenarioResult[];
  tags?: string[];
  isFavorite?: boolean;
  collections?: string[];
  performanceMetrics?: {
    avgDuration: number;
    successRate: number;
    lastExecuted?: Date;
  };
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  indexSize: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  fileTypes: Record<string, number>;
  environments: Record<string, number>;
  tags: Record<string, number>;
  status: Record<string, number>;
  stepTypes: Record<string, number>;
}

/**
 * Main Search Engine class that orchestrates all search functionality
 */
export class SearchEngine {
  private searchIndex: SearchIndex;
  private filterEngine: FilterEngine;
  private discoveryEngine: DiscoveryEngine;
  private searchHistory: SearchQuery[] = [];
  private savedSearches: Map<string, SearchQuery> = new Map();

  constructor() {
    this.searchIndex = new SearchIndex();
    this.filterEngine = new FilterEngine();
    this.discoveryEngine = new DiscoveryEngine();
  }

  /**
   * Index scenarios for searching
   */
  async indexScenarios(scenarios: string[], scenarioData: Map<string, Scenario>): Promise<void> {
    await this.searchIndex.buildIndex(scenarios, scenarioData);
    this.discoveryEngine.analyzeScenarios(Array.from(scenarioData.values()));
  }

  /**
   * Perform a comprehensive search
   */
  async search(query: SearchQuery): Promise<{ results: SearchResult[]; stats: SearchStats }> {
    const startTime = Date.now();

    // Add to search history
    this.addToHistory(query);

    let results: SearchResult[] = [];

    // Perform text search if query provided
    if (query.text || query.regex) {
      const textResults = await this.searchIndex.search(
        query.text || query.regex || '',
        query.options || {}
      );
      results = results.concat(textResults);
    }

    // Apply filters
    if (query.filters) {
      results = this.filterEngine.applyFilters(results, query.filters);
    }

    // Sort results
    results = this.sortResults(results, query.options?.sortBy || 'relevance', query.options?.sortOrder || 'desc');

    // Limit results
    if (query.options?.maxResults) {
      results = results.slice(0, query.options.maxResults);
    }

    const searchTime = Date.now() - startTime;
    const stats = this.generateStats(results, searchTime);

    return { results, stats };
  }

  /**
   * Get smart suggestions based on query
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    return this.searchIndex.getSuggestions(partialQuery);
  }

  /**
   * Find similar scenarios
   */
  findSimilarScenarios(scenarioId: string): SearchResult[] {
    return this.discoveryEngine.findSimilarScenarios(scenarioId);
  }

  /**
   * Detect unused variables across scenarios
   */
  findUnusedVariables(): { variable: string; declaredIn: string; usageCount: number }[] {
    return this.discoveryEngine.findUnusedVariables();
  }

  /**
   * Analyze scenario dependencies
   */
  analyzeDependencies(): { scenario: string; dependencies: string[]; dependents: string[] }[] {
    return this.discoveryEngine.analyzeDependencies();
  }

  /**
   * Find duplicate steps across scenarios
   */
  findDuplicateSteps(): { stepPattern: string; occurrences: { scenario: string; stepIndex: number }[] }[] {
    const duplicates = this.discoveryEngine.findDuplicateSteps();
    return duplicates.map(dup => ({
      stepPattern: dup.pattern,
      occurrences: dup.occurrences.map(occ => ({
        scenario: occ.scenario,
        stepIndex: occ.stepIndex
      }))
    }));
  }

  /**
   * Identify performance bottlenecks
   */
  findPerformanceBottlenecks(): { scenario: string; step: string; avgDuration: number; issues: string[] }[] {
    return this.discoveryEngine.findPerformanceBottlenecks();
  }

  /**
   * Save a search query for later use
   */
  saveSearch(name: string, query: SearchQuery): void {
    this.savedSearches.set(name, query);
  }

  /**
   * Get saved searches
   */
  getSavedSearches(): Map<string, SearchQuery> {
    return new Map(this.savedSearches);
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchQuery[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Export search results in various formats
   */
  exportResults(results: SearchResult[], format: 'json' | 'csv' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'csv':
        return this.exportToCsv(results);
      
      case 'markdown':
        return this.exportToMarkdown(results);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get search statistics and insights
   */
  getSearchInsights(): {
    totalSearches: number;
    popularTerms: { term: string; count: number }[];
    commonFilters: { filter: string; count: number }[];
    searchPatterns: string[];
  } {
    const termCounts = new Map<string, number>();
    const filterCounts = new Map<string, number>();
    
    this.searchHistory.forEach(query => {
      if (query.text) {
        const terms = query.text.toLowerCase().split(/\s+/);
        terms.forEach(term => {
          termCounts.set(term, (termCounts.get(term) || 0) + 1);
        });
      }
      
      if (query.filters) {
        Object.keys(query.filters).forEach(filter => {
          filterCounts.set(filter, (filterCounts.get(filter) || 0) + 1);
        });
      }
    });

    return {
      totalSearches: this.searchHistory.length,
      popularTerms: Array.from(termCounts.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      commonFilters: Array.from(filterCounts.entries())
        .map(([filter, count]) => ({ filter, count }))
        .sort((a, b) => b.count - a.count),
      searchPatterns: this.identifySearchPatterns()
    };
  }

  // Private helper methods

  private addToHistory(query: SearchQuery): void {
    this.searchHistory.unshift(query);
    // Keep only last 100 searches
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(0, 100);
    }
  }

  private sortResults(results: SearchResult[], sortBy: string, sortOrder: string): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'modified':
          const aModified = a.metadata.lastModified || new Date(0);
          const bModified = b.metadata.lastModified || new Date(0);
          comparison = aModified.getTime() - bModified.getTime();
          break;
        case 'performance':
          const aPerf = a.metadata.performanceMetrics?.avgDuration || Infinity;
          const bPerf = b.metadata.performanceMetrics?.avgDuration || Infinity;
          comparison = aPerf - bPerf;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  private generateStats(results: SearchResult[], searchTime: number): SearchStats {
    const facets: SearchFacets = {
      fileTypes: {},
      environments: {},
      tags: {},
      status: {},
      stepTypes: {}
    };

    results.forEach(result => {
      // File types
      const extension = result.path.split('.').pop() || 'unknown';
      facets.fileTypes[extension] = (facets.fileTypes[extension] || 0) + 1;

      // Tags
      if (result.metadata.tags) {
        result.metadata.tags.forEach(tag => {
          facets.tags[tag] = (facets.tags[tag] || 0) + 1;
        });
      }

      // Scenario-specific facets
      if (result.metadata.scenario) {
        const scenario = result.metadata.scenario;
        
        // Environments
        if (scenario.environments) {
          scenario.environments.forEach(env => {
            facets.environments[env] = (facets.environments[env] || 0) + 1;
          });
        }

        // Step types
        scenario.steps.forEach(step => {
          facets.stepTypes[step.type] = (facets.stepTypes[step.type] || 0) + 1;
        });
      }

      // Execution status
      if (result.metadata.executionHistory && result.metadata.executionHistory.length > 0) {
        const lastResult = result.metadata.executionHistory[0];
        const status = lastResult.success ? 'passed' : 'failed';
        facets.status[status] = (facets.status[status] || 0) + 1;
      } else {
        facets.status['pending'] = (facets.status['pending'] || 0) + 1;
      }
    });

    return {
      totalResults: results.length,
      searchTime,
      indexSize: this.searchIndex.getIndexSize(),
      facets
    };
  }

  private exportToCsv(results: SearchResult[]): string {
    const headers = ['Name', 'Type', 'Path', 'Relevance', 'Tags', 'Last Modified', 'Performance'];
    const rows = results.map(result => [
      result.name,
      result.type,
      result.path,
      result.relevanceScore.toString(),
      result.metadata.tags?.join(';') || '',
      result.metadata.lastModified?.toISOString() || '',
      result.metadata.performanceMetrics?.avgDuration?.toString() || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  private exportToMarkdown(results: SearchResult[]): string {
    let markdown = '# Search Results\n\n';
    markdown += `Found ${results.length} results\n\n`;

    results.forEach((result, index) => {
      markdown += `## ${index + 1}. ${result.name}\n\n`;
      markdown += `- **Type**: ${result.type}\n`;
      markdown += `- **Path**: ${result.path}\n`;
      markdown += `- **Relevance**: ${result.relevanceScore.toFixed(2)}\n`;
      
      if (result.metadata.tags && result.metadata.tags.length > 0) {
        markdown += `- **Tags**: ${result.metadata.tags.join(', ')}\n`;
      }
      
      if (result.metadata.performanceMetrics) {
        markdown += `- **Avg Duration**: ${result.metadata.performanceMetrics.avgDuration}ms\n`;
        markdown += `- **Success Rate**: ${result.metadata.performanceMetrics.successRate}%\n`;
      }
      
      if (result.matches.length > 0) {
        markdown += '\n**Matches**:\n';
        result.matches.forEach(match => {
          markdown += `- ${match.field}: "${match.text}" (line ${match.lineNumber || 'N/A'})\n`;
        });
      }
      
      markdown += '\n---\n\n';
    });

    return markdown;
  }

  private identifySearchPatterns(): string[] {
    const patterns: string[] = [];
    
    // Analyze common search patterns
    const recentSearches = this.searchHistory.slice(0, 20);
    const textSearches = recentSearches.filter(q => q.text).map(q => q.text!);
    
    if (textSearches.length > 0) {
      // Common prefixes/suffixes
      const commonPrefixes = this.findCommonPrefixes(textSearches);
      const commonSuffixes = this.findCommonSuffixes(textSearches);
      
      patterns.push(...commonPrefixes.map(p => `Common prefix: "${p}"`));
      patterns.push(...commonSuffixes.map(s => `Common suffix: "${s}"`));
    }

    // Filter usage patterns
    const filterSearches = recentSearches.filter(q => q.filters);
    if (filterSearches.length > 0) {
      patterns.push('Frequently uses advanced filters');
    }

    return patterns;
  }

  private findCommonPrefixes(texts: string[]): string[] {
    const prefixes = new Map<string, number>();
    
    texts.forEach(text => {
      const words = text.split(/\s+/);
      if (words.length > 0) {
        prefixes.set(words[0], (prefixes.get(words[0]) || 0) + 1);
      }
    });

    return Array.from(prefixes.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([prefix, _]) => prefix);
  }

  private findCommonSuffixes(texts: string[]): string[] {
    const suffixes = new Map<string, number>();
    
    texts.forEach(text => {
      const words = text.split(/\s+/);
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        suffixes.set(lastWord, (suffixes.get(lastWord) || 0) + 1);
      }
    });

    return Array.from(suffixes.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([suffix, _]) => suffix);
  }
}