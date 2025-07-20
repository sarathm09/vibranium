/**
 * Search Index for full-text search capabilities
 * Provides efficient indexing and searching of scenario content
 */

import { Scenario, Step } from '../types';
import { SearchResult, SearchMatch, SearchOptions } from './SearchEngine';

interface IndexEntry {
  id: string;
  type: 'scenario' | 'step' | 'file';
  path: string;
  content: string;
  searchableFields: Record<string, string>;
  metadata: any;
}

interface InvertedIndex {
  [term: string]: {
    entries: string[]; // entry IDs
    positions: Record<string, number[]>; // entry ID -> positions
  };
}

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  suggestions: Set<string>;
}

/**
 * Full-text search index with inverted index and trie for autocomplete
 */
export class SearchIndex {
  private entries: Map<string, IndexEntry> = new Map();
  private invertedIndex: InvertedIndex = {};
  private suggestionTrie: TrieNode = { children: new Map(), isEndOfWord: false, suggestions: new Set() };
  private lastIndexTime: Date = new Date();

  /**
   * Build search index from scenarios
   */
  async buildIndex(scenarioPaths: string[], scenarioData: Map<string, Scenario>): Promise<void> {
    this.entries.clear();
    this.invertedIndex = {};
    this.suggestionTrie = { children: new Map(), isEndOfWord: false, suggestions: new Set() };

    const indexPromises = scenarioPaths.map(async (path) => {
      const scenario = scenarioData.get(path);
      if (!scenario) return;

      // Index scenario
      await this.indexScenario(path, scenario);

      // Index individual steps
      scenario.steps.forEach((step, index) => {
        this.indexStep(path, scenario, step, index);
      });

      // Index file name and path
      this.indexFile(path);
    });

    await Promise.all(indexPromises);
    this.lastIndexTime = new Date();
  }

  /**
   * Search the index
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryTerms = this.tokenize(query.toLowerCase());
    
    if (queryTerms.length === 0) {
      return results;
    }

    // Handle regex search
    if (options.includeContent && query.startsWith('/') && query.endsWith('/')) {
      return this.regexSearch(query.slice(1, -1), options);
    }

    // Find entries that match the query
    const matchingEntries = this.findMatchingEntries(queryTerms, options);
    
    for (const [entryId, score] of matchingEntries) {
      const entry = this.entries.get(entryId);
      if (!entry) continue;

      const matches = this.findMatches(entry, query, queryTerms, options);
      if (matches.length > 0) {
        results.push({
          id: entryId,
          type: entry.type,
          name: this.extractName(entry),
          path: entry.path,
          relevanceScore: score,
          matches,
          metadata: entry.metadata
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get autocomplete suggestions
   */
  getSuggestions(partialQuery: string): string[] {
    const query = partialQuery.toLowerCase().trim();
    if (query.length < 2) return [];

    const suggestions = new Set<string>();
    
    // Traverse trie to find suggestions
    let current = this.suggestionTrie;
    for (const char of query) {
      if (!current.children.has(char)) {
        return Array.from(suggestions);
      }
      current = current.children.get(char)!;
    }

    // Collect suggestions from current node
    this.collectSuggestions(current, query, suggestions, 10);
    
    return Array.from(suggestions).sort();
  }

  /**
   * Get index statistics
   */
  getIndexSize(): number {
    return this.entries.size;
  }

  /**
   * Get index metadata
   */
  getIndexMetadata(): {
    entryCount: number;
    termCount: number;
    lastIndexed: Date;
    indexSizeBytes: number;
  } {
    const indexSizeBytes = JSON.stringify(this.invertedIndex).length;
    
    return {
      entryCount: this.entries.size,
      termCount: Object.keys(this.invertedIndex).length,
      lastIndexed: this.lastIndexTime,
      indexSizeBytes
    };
  }

  // Private indexing methods

  private async indexScenario(path: string, scenario: Scenario): Promise<void> {
    const entryId = `scenario:${path}`;
    const content = this.extractScenarioContent(scenario);
    
    const entry: IndexEntry = {
      id: entryId,
      type: 'scenario',
      path,
      content,
      searchableFields: {
        name: scenario.name,
        description: scenario.description || '',
        environments: scenario.environments?.join(' ') || '',
        content: content
      },
      metadata: {
        scenario,
        stepCount: scenario.steps.length,
        environments: scenario.environments || [],
        lastModified: new Date() // Would be actual file modification date in real implementation
      }
    };

    this.entries.set(entryId, entry);
    this.indexEntry(entry);
  }

  private indexStep(path: string, scenario: Scenario, step: Step, stepIndex: number): void {
    const entryId = `step:${path}:${stepIndex}`;
    const content = this.extractStepContent(step);
    
    const entry: IndexEntry = {
      id: entryId,
      type: 'step',
      path,
      content,
      searchableFields: {
        name: step.name,
        type: step.type,
        content: content
      },
      metadata: {
        scenario,
        step,
        stepIndex,
        parentScenario: scenario.name
      }
    };

    this.entries.set(entryId, entry);
    this.indexEntry(entry);
  }

  private indexFile(path: string): void {
    const entryId = `file:${path}`;
    const fileName = path.split('/').pop() || path;
    const content = `${fileName} ${path}`;
    
    const entry: IndexEntry = {
      id: entryId,
      type: 'file',
      path,
      content,
      searchableFields: {
        fileName,
        path,
        content
      },
      metadata: {
        fileName,
        fileType: path.split('.').pop() || 'unknown',
        lastModified: new Date()
      }
    };

    this.entries.set(entryId, entry);
    this.indexEntry(entry);
  }

  private indexEntry(entry: IndexEntry): void {
    const tokens = this.tokenize(entry.content.toLowerCase());
    
    tokens.forEach((token, position) => {
      if (!this.invertedIndex[token]) {
        this.invertedIndex[token] = {
          entries: [],
          positions: {}
        };
      }

      const indexEntry = this.invertedIndex[token];
      
      if (!indexEntry.entries.includes(entry.id)) {
        indexEntry.entries.push(entry.id);
        indexEntry.positions[entry.id] = [];
      }
      
      indexEntry.positions[entry.id].push(position);
      
      // Add to suggestion trie
      this.addToTrie(token);
    });
  }

  private addToTrie(word: string): void {
    let current = this.suggestionTrie;
    
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, {
          children: new Map(),
          isEndOfWord: false,
          suggestions: new Set()
        });
      }
      current = current.children.get(char)!;
      current.suggestions.add(word);
    }
    
    current.isEndOfWord = true;
  }

  // Private search methods

  private findMatchingEntries(queryTerms: string[], options: SearchOptions): Map<string, number> {
    const entryScores = new Map<string, number>();
    
    queryTerms.forEach((term, termIndex) => {
      const indexEntry = this.invertedIndex[term];
      if (!indexEntry) return;

      indexEntry.entries.forEach(entryId => {
        const entry = this.entries.get(entryId);
        if (!entry) return;

        // Calculate relevance score
        let score = 0;
        
        // Base score from term frequency
        const termFreq = indexEntry.positions[entryId].length;
        score += Math.log(1 + termFreq) * 10;
        
        // Boost for exact matches in important fields
        if (entry.searchableFields.name?.toLowerCase().includes(term)) {
          score += 50;
        }
        
        if (entry.searchableFields.type?.toLowerCase().includes(term)) {
          score += 30;
        }
        
        // Boost for position (earlier terms are more important)
        score += (queryTerms.length - termIndex) * 5;
        
        // Type-based scoring
        if (entry.type === 'scenario') score += 20;
        else if (entry.type === 'step') score += 10;
        else if (entry.type === 'file') score += 5;

        entryScores.set(entryId, (entryScores.get(entryId) || 0) + score);
      });
    });

    // Sort by score
    return new Map([...entryScores.entries()].sort((a, b) => b[1] - a[1]));
  }

  private findMatches(entry: IndexEntry, originalQuery: string, queryTerms: string[], options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const content = entry.content.toLowerCase();
    
    // Find matches for each query term
    queryTerms.forEach(term => {
      const regex = options.wholeWord 
        ? new RegExp(`\\b${this.escapeRegex(term)}\\b`, options.caseSensitive ? 'g' : 'gi')
        : new RegExp(this.escapeRegex(term), options.caseSensitive ? 'g' : 'gi');
      
      const searchContent = options.caseSensitive ? entry.content : content;
      let match;
      
      while ((match = regex.exec(searchContent)) !== null) {
        const context = this.extractContext(entry.content, match.index, 100);
        const lineNumber = this.getLineNumber(entry.content, match.index);
        
        matches.push({
          field: this.determineField(entry, match.index),
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context,
          lineNumber
        });
        
        // Prevent infinite loop with zero-width matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    });

    return matches;
  }

  private regexSearch(pattern: string, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
      
      for (const [entryId, entry] of this.entries) {
        const matches: SearchMatch[] = [];
        let match;
        
        while ((match = regex.exec(entry.content)) !== null) {
          const context = this.extractContext(entry.content, match.index, 100);
          const lineNumber = this.getLineNumber(entry.content, match.index);
          
          matches.push({
            field: this.determineField(entry, match.index),
            text: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            context,
            lineNumber
          });
          
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
        
        if (matches.length > 0) {
          results.push({
            id: entryId,
            type: entry.type,
            name: this.extractName(entry),
            path: entry.path,
            relevanceScore: matches.length * 10,
            matches,
            metadata: entry.metadata
          });
        }
      }
    } catch (error) {
      console.error('Invalid regex pattern:', error);
    }
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Private utility methods

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1); // Filter out single characters
  }

  private extractScenarioContent(scenario: Scenario): string {
    let content = `${scenario.name} ${scenario.description || ''}`;
    
    if (scenario.environments) {
      content += ` ${scenario.environments.join(' ')}`;
    }
    
    scenario.steps.forEach(step => {
      content += ` ${this.extractStepContent(step)}`;
    });
    
    return content;
  }

  private extractStepContent(step: Step): string {
    let content = `${step.name} ${step.type}`;
    
    // Extract additional fields that might be searchable
    Object.entries(step).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'type' && typeof value === 'string') {
        content += ` ${value}`;
      }
    });
    
    return content;
  }

  private extractContext(content: string, position: number, length: number): string {
    const start = Math.max(0, position - length / 2);
    const end = Math.min(content.length, position + length / 2);
    
    let context = content.substring(start, end);
    
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';
    
    return context;
  }

  private getLineNumber(content: string, position: number): number {
    return content.substring(0, position).split('\n').length;
  }

  private determineField(entry: IndexEntry, position: number): string {
    // Simple field determination based on content structure
    const beforeMatch = entry.content.substring(0, position);
    
    if (beforeMatch.includes(entry.searchableFields.name || '')) {
      return 'name';
    } else if (entry.searchableFields.description && beforeMatch.includes(entry.searchableFields.description)) {
      return 'description';
    } else if (entry.type === 'step' && entry.searchableFields.type && beforeMatch.includes(entry.searchableFields.type)) {
      return 'type';
    } else {
      return 'content';
    }
  }

  private extractName(entry: IndexEntry): string {
    if (entry.type === 'scenario' && entry.metadata.scenario) {
      return entry.metadata.scenario.name;
    } else if (entry.type === 'step' && entry.metadata.step) {
      return entry.metadata.step.name;
    } else if (entry.type === 'file' && entry.metadata.fileName) {
      return entry.metadata.fileName;
    }
    return 'Unknown';
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private collectSuggestions(node: TrieNode, prefix: string, suggestions: Set<string>, maxSuggestions: number): void {
    if (suggestions.size >= maxSuggestions) return;
    
    if (node.isEndOfWord) {
      suggestions.add(prefix);
    }
    
    for (const [char, childNode] of node.children) {
      if (suggestions.size >= maxSuggestions) break;
      this.collectSuggestions(childNode, prefix + char, suggestions, maxSuggestions);
    }
  }
}