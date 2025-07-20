/**
 * Search System Index
 * Exports all search engine components and types
 */

export { SearchEngine } from './SearchEngine';
export { SearchIndex } from './SearchIndex';
export { FilterEngine } from './FilterEngine';
export { DiscoveryEngine } from './DiscoveryEngine';
export { OrganizationManager } from './OrganizationManager';

export type {
  SearchQuery,
  SearchFilters,
  SearchOptions,
  SearchResult,
  SearchMatch,
  SearchResultMetadata,
  SearchStats,
  SearchFacets
} from './SearchEngine';

export type {
  UnusedVariable,
  DependencyAnalysis,
  DuplicatePattern,
  PerformanceBottleneck,
  OptimizationSuggestion
} from './DiscoveryEngine';

export type {
  Tag,
  Collection,
  Favorite,
  BulkOperation,
  OrganizationStats
} from './OrganizationManager';