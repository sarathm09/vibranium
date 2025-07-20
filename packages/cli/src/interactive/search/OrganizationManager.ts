/**
 * Organization Manager for tagging, favorites, collections, and bulk operations
 * Provides comprehensive organization features for scenarios and search results
 */

import { Scenario, Step } from '../types';
import { SearchResult } from './SearchEngine';

export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  usageCount: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  scenarios: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  owner?: string;
}

export interface Favorite {
  itemId: string;
  itemType: 'scenario' | 'step' | 'collection';
  addedAt: Date;
  notes?: string;
}

export interface BulkOperation {
  id: string;
  type: 'tag' | 'move' | 'delete' | 'execute' | 'export';
  targets: string[];
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface OrganizationStats {
  totalTags: number;
  totalCollections: number;
  totalFavorites: number;
  tagUsage: Record<string, number>;
  collectionSizes: Record<string, number>;
  recentActivity: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
}

/**
 * Manager for all organization features
 */
export class OrganizationManager {
  private tags: Map<string, Tag> = new Map();
  private collections: Map<string, Collection> = new Map();
  private favorites: Map<string, Favorite> = new Map();
  private scenarioTags: Map<string, string[]> = new Map(); // scenario -> tag IDs
  private bulkOperations: Map<string, BulkOperation> = new Map();
  private activityLog: { type: string; description: string; timestamp: Date }[] = [];

  constructor() {
    this.initializeDefaultTags();
  }

  // Tag Management

  /**
   * Create a new tag
   */
  createTag(name: string, color: string, description?: string): Tag {
    const id = this.generateId('tag');
    const tag: Tag = {
      id,
      name,
      color,
      description,
      createdAt: new Date(),
      usageCount: 0
    };

    this.tags.set(id, tag);
    this.logActivity('tag_created', `Created tag: ${name}`);
    return tag;
  }

  /**
   * Get all tags
   */
  getTags(): Tag[] {
    return Array.from(this.tags.values()).sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get tag by ID
   */
  getTag(id: string): Tag | undefined {
    return this.tags.get(id);
  }

  /**
   * Update tag
   */
  updateTag(id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt' | 'usageCount'>>): boolean {
    const tag = this.tags.get(id);
    if (!tag) return false;

    Object.assign(tag, updates);
    this.logActivity('tag_updated', `Updated tag: ${tag.name}`);
    return true;
  }

  /**
   * Delete tag
   */
  deleteTag(id: string): boolean {
    const tag = this.tags.get(id);
    if (!tag) return false;

    // Remove tag from all scenarios
    for (const [scenario, tagIds] of this.scenarioTags) {
      const newTagIds = tagIds.filter(tagId => tagId !== id);
      if (newTagIds.length !== tagIds.length) {
        this.scenarioTags.set(scenario, newTagIds);
      }
    }

    this.tags.delete(id);
    this.logActivity('tag_deleted', `Deleted tag: ${tag.name}`);
    return true;
  }

  /**
   * Add tag to scenario
   */
  addTagToScenario(scenarioId: string, tagId: string): boolean {
    const tag = this.tags.get(tagId);
    if (!tag) return false;

    const existingTags = this.scenarioTags.get(scenarioId) || [];
    if (existingTags.includes(tagId)) return false;

    this.scenarioTags.set(scenarioId, [...existingTags, tagId]);
    tag.usageCount++;
    this.logActivity('tag_added', `Added tag "${tag.name}" to scenario`);
    return true;
  }

  /**
   * Remove tag from scenario
   */
  removeTagFromScenario(scenarioId: string, tagId: string): boolean {
    const tag = this.tags.get(tagId);
    const existingTags = this.scenarioTags.get(scenarioId);
    
    if (!tag || !existingTags || !existingTags.includes(tagId)) return false;

    const newTags = existingTags.filter(id => id !== tagId);
    this.scenarioTags.set(scenarioId, newTags);
    tag.usageCount = Math.max(0, tag.usageCount - 1);
    this.logActivity('tag_removed', `Removed tag "${tag.name}" from scenario`);
    return true;
  }

  /**
   * Get tags for scenario
   */
  getScenarioTags(scenarioId: string): Tag[] {
    const tagIds = this.scenarioTags.get(scenarioId) || [];
    return tagIds.map(id => this.tags.get(id)).filter(Boolean) as Tag[];
  }

  /**
   * Get scenarios with tag
   */
  getScenariosWithTag(tagId: string): string[] {
    const scenarios: string[] = [];
    for (const [scenarioId, tagIds] of this.scenarioTags) {
      if (tagIds.includes(tagId)) {
        scenarios.push(scenarioId);
      }
    }
    return scenarios;
  }

  // Collection Management

  /**
   * Create a new collection
   */
  createCollection(name: string, description?: string, isPublic: boolean = false): Collection {
    const id = this.generateId('collection');
    const collection: Collection = {
      id,
      name,
      description,
      scenarios: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic,
      owner: 'current-user' // Would be actual user ID in real implementation
    };

    this.collections.set(id, collection);
    this.logActivity('collection_created', `Created collection: ${name}`);
    return collection;
  }

  /**
   * Get all collections
   */
  getCollections(): Collection[] {
    return Array.from(this.collections.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get collection by ID
   */
  getCollection(id: string): Collection | undefined {
    return this.collections.get(id);
  }

  /**
   * Update collection
   */
  updateCollection(id: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>): boolean {
    const collection = this.collections.get(id);
    if (!collection) return false;

    Object.assign(collection, { ...updates, updatedAt: new Date() });
    this.logActivity('collection_updated', `Updated collection: ${collection.name}`);
    return true;
  }

  /**
   * Delete collection
   */
  deleteCollection(id: string): boolean {
    const collection = this.collections.get(id);
    if (!collection) return false;

    this.collections.delete(id);
    this.logActivity('collection_deleted', `Deleted collection: ${collection.name}`);
    return true;
  }

  /**
   * Add scenario to collection
   */
  addScenarioToCollection(collectionId: string, scenarioId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection || collection.scenarios.includes(scenarioId)) return false;

    collection.scenarios.push(scenarioId);
    collection.updatedAt = new Date();
    this.logActivity('scenario_added_to_collection', `Added scenario to collection: ${collection.name}`);
    return true;
  }

  /**
   * Remove scenario from collection
   */
  removeScenarioFromCollection(collectionId: string, scenarioId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    const index = collection.scenarios.indexOf(scenarioId);
    if (index === -1) return false;

    collection.scenarios.splice(index, 1);
    collection.updatedAt = new Date();
    this.logActivity('scenario_removed_from_collection', `Removed scenario from collection: ${collection.name}`);
    return true;
  }

  /**
   * Get collections containing scenario
   */
  getCollectionsContainingScenario(scenarioId: string): Collection[] {
    return Array.from(this.collections.values())
      .filter(collection => collection.scenarios.includes(scenarioId));
  }

  // Favorites Management

  /**
   * Add to favorites
   */
  addToFavorites(itemId: string, itemType: 'scenario' | 'step' | 'collection', notes?: string): boolean {
    if (this.favorites.has(itemId)) return false;

    const favorite: Favorite = {
      itemId,
      itemType,
      addedAt: new Date(),
      notes
    };

    this.favorites.set(itemId, favorite);
    this.logActivity('favorite_added', `Added ${itemType} to favorites`);
    return true;
  }

  /**
   * Remove from favorites
   */
  removeFromFavorites(itemId: string): boolean {
    const removed = this.favorites.delete(itemId);
    if (removed) {
      this.logActivity('favorite_removed', 'Removed item from favorites');
    }
    return removed;
  }

  /**
   * Check if item is favorite
   */
  isFavorite(itemId: string): boolean {
    return this.favorites.has(itemId);
  }

  /**
   * Get all favorites
   */
  getFavorites(): Favorite[] {
    return Array.from(this.favorites.values())
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  /**
   * Get favorites by type
   */
  getFavoritesByType(itemType: 'scenario' | 'step' | 'collection'): Favorite[] {
    return this.getFavorites().filter(fav => fav.itemType === itemType);
  }

  // Bulk Operations

  /**
   * Start bulk operation
   */
  startBulkOperation(
    type: BulkOperation['type'],
    targets: string[],
    parameters: Record<string, any>
  ): string {
    const id = this.generateId('bulk');
    const operation: BulkOperation = {
      id,
      type,
      targets,
      parameters,
      status: 'pending',
      progress: 0,
      startedAt: new Date()
    };

    this.bulkOperations.set(id, operation);
    this.logActivity('bulk_operation_started', `Started bulk ${type} operation on ${targets.length} items`);
    
    // Start processing (in real implementation, this would be async)
    this.processBulkOperation(id);
    
    return id;
  }

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(id: string): BulkOperation | undefined {
    return this.bulkOperations.get(id);
  }

  /**
   * Get all bulk operations
   */
  getBulkOperations(): BulkOperation[] {
    return Array.from(this.bulkOperations.values())
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  }

  /**
   * Cancel bulk operation
   */
  cancelBulkOperation(id: string): boolean {
    const operation = this.bulkOperations.get(id);
    if (!operation || operation.status !== 'running') return false;

    operation.status = 'failed';
    operation.error = 'Operation cancelled by user';
    operation.completedAt = new Date();
    
    this.logActivity('bulk_operation_cancelled', `Cancelled bulk ${operation.type} operation`);
    return true;
  }

  // Organization Statistics

  /**
   * Get organization statistics
   */
  getOrganizationStats(): OrganizationStats {
    const tagUsage: Record<string, number> = {};
    for (const tag of this.tags.values()) {
      tagUsage[tag.name] = tag.usageCount;
    }

    const collectionSizes: Record<string, number> = {};
    for (const collection of this.collections.values()) {
      collectionSizes[collection.name] = collection.scenarios.length;
    }

    return {
      totalTags: this.tags.size,
      totalCollections: this.collections.size,
      totalFavorites: this.favorites.size,
      tagUsage,
      collectionSizes,
      recentActivity: this.activityLog.slice(0, 10) // Last 10 activities
    };
  }

  /**
   * Export organization data
   */
  exportOrganizationData(): {
    tags: Tag[];
    collections: Collection[];
    favorites: Favorite[];
    scenarioTags: Record<string, string[]>;
  } {
    return {
      tags: Array.from(this.tags.values()),
      collections: Array.from(this.collections.values()),
      favorites: Array.from(this.favorites.values()),
      scenarioTags: Object.fromEntries(this.scenarioTags)
    };
  }

  /**
   * Import organization data
   */
  importOrganizationData(data: {
    tags?: Tag[];
    collections?: Collection[];
    favorites?: Favorite[];
    scenarioTags?: Record<string, string[]>;
  }): boolean {
    try {
      if (data.tags) {
        this.tags.clear();
        data.tags.forEach(tag => this.tags.set(tag.id, tag));
      }

      if (data.collections) {
        this.collections.clear();
        data.collections.forEach(collection => this.collections.set(collection.id, collection));
      }

      if (data.favorites) {
        this.favorites.clear();
        data.favorites.forEach(favorite => this.favorites.set(favorite.itemId, favorite));
      }

      if (data.scenarioTags) {
        this.scenarioTags.clear();
        Object.entries(data.scenarioTags).forEach(([scenario, tags]) => {
          this.scenarioTags.set(scenario, tags);
        });
      }

      this.logActivity('data_imported', 'Organization data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import organization data:', error);
      return false;
    }
  }

  // Search Enhancement

  /**
   * Enhance search results with organization metadata
   */
  enhanceSearchResults(results: SearchResult[]): SearchResult[] {
    return results.map(result => ({
      ...result,
      metadata: {
        ...result.metadata,
        tags: this.getScenarioTags(result.id).map(tag => tag.name),
        isFavorite: this.isFavorite(result.id),
        collections: this.getCollectionsContainingScenario(result.id).map(c => c.name)
      }
    }));
  }

  /**
   * Smart tag suggestions based on scenario content
   */
  suggestTags(scenario: Scenario): string[] {
    const suggestions: string[] = [];
    const content = JSON.stringify(scenario).toLowerCase();

    // Analyze step types
    const stepTypes = scenario.steps.map(step => step.type);
    if (stepTypes.includes('api')) suggestions.push('api-testing');
    if (stepTypes.includes('database')) suggestions.push('database');
    if (stepTypes.includes('ui')) suggestions.push('ui-testing');

    // Analyze environments
    if (scenario.environments?.includes('production')) suggestions.push('production');
    if (scenario.environments?.includes('staging')) suggestions.push('staging');

    // Analyze scenario name and description
    const text = `${scenario.name} ${scenario.description || ''}`.toLowerCase();
    if (text.includes('auth')) suggestions.push('authentication');
    if (text.includes('performance')) suggestions.push('performance');
    if (text.includes('security')) suggestions.push('security');
    if (text.includes('integration')) suggestions.push('integration');
    if (text.includes('regression')) suggestions.push('regression');

    // Remove duplicates and return existing tags that match
    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.filter(suggestion => 
      Array.from(this.tags.values()).some(tag => 
        tag.name.toLowerCase().includes(suggestion) || suggestion.includes(tag.name.toLowerCase())
      )
    );
  }

  // Private helper methods

  private initializeDefaultTags(): void {
    const defaultTags = [
      { name: 'api-testing', color: '#4A90E2', description: 'API and HTTP endpoint testing' },
      { name: 'authentication', color: '#F5A623', description: 'Authentication and authorization tests' },
      { name: 'performance', color: '#D0021B', description: 'Performance and load testing scenarios' },
      { name: 'regression', color: '#9013FE', description: 'Regression testing scenarios' },
      { name: 'integration', color: '#00C853', description: 'Integration testing scenarios' },
      { name: 'security', color: '#FF6F00', description: 'Security testing scenarios' },
      { name: 'critical', color: '#E91E63', description: 'Critical scenarios that must pass' },
      { name: 'experimental', color: '#607D8B', description: 'Experimental or beta scenarios' }
    ];

    defaultTags.forEach(tagData => {
      const tag: Tag = {
        id: this.generateId('tag'),
        ...tagData,
        createdAt: new Date(),
        usageCount: 0
      };
      this.tags.set(tag.id, tag);
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logActivity(type: string, description: string): void {
    this.activityLog.unshift({
      type,
      description,
      timestamp: new Date()
    });

    // Keep only last 100 activities
    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(0, 100);
    }
  }

  private async processBulkOperation(id: string): Promise<void> {
    const operation = this.bulkOperations.get(id);
    if (!operation) return;

    operation.status = 'running';
    operation.startedAt = new Date();

    try {
      switch (operation.type) {
        case 'tag':
          await this.processBulkTag(operation);
          break;
        case 'move':
          await this.processBulkMove(operation);
          break;
        case 'delete':
          await this.processBulkDelete(operation);
          break;
        case 'execute':
          await this.processBulkExecute(operation);
          break;
        case 'export':
          await this.processBulkExport(operation);
          break;
      }

      operation.status = 'completed';
      operation.progress = 100;
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      operation.completedAt = new Date();
    }
  }

  private async processBulkTag(operation: BulkOperation): Promise<void> {
    const { tagId, action } = operation.parameters;
    const totalTargets = operation.targets.length;

    for (let i = 0; i < totalTargets; i++) {
      const scenarioId = operation.targets[i];
      
      if (action === 'add') {
        this.addTagToScenario(scenarioId, tagId);
      } else if (action === 'remove') {
        this.removeTagFromScenario(scenarioId, tagId);
      }

      operation.progress = Math.round(((i + 1) / totalTargets) * 100);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async processBulkMove(operation: BulkOperation): Promise<void> {
    const { targetCollectionId } = operation.parameters;
    const totalTargets = operation.targets.length;

    for (let i = 0; i < totalTargets; i++) {
      const scenarioId = operation.targets[i];
      this.addScenarioToCollection(targetCollectionId, scenarioId);
      
      operation.progress = Math.round(((i + 1) / totalTargets) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private async processBulkDelete(operation: BulkOperation): Promise<void> {
    // In a real implementation, this would delete scenarios
    // For now, we'll just simulate the operation
    const totalTargets = operation.targets.length;

    for (let i = 0; i < totalTargets; i++) {
      operation.progress = Math.round(((i + 1) / totalTargets) * 100);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  private async processBulkExecute(operation: BulkOperation): Promise<void> {
    // In a real implementation, this would execute scenarios
    const totalTargets = operation.targets.length;

    for (let i = 0; i < totalTargets; i++) {
      operation.progress = Math.round(((i + 1) / totalTargets) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate execution time
    }
  }

  private async processBulkExport(operation: BulkOperation): Promise<void> {
    const { format } = operation.parameters;
    const totalTargets = operation.targets.length;

    // Simulate export processing
    for (let i = 0; i < totalTargets; i++) {
      operation.progress = Math.round(((i + 1) / totalTargets) * 100);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Set export result
    operation.result = {
      format,
      itemCount: totalTargets,
      exportPath: `/exports/bulk_export_${Date.now()}.${format}`
    };
  }
}