/**
 * Main Search Interface Component
 * Provides comprehensive search functionality with instant search, filters, and results
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppContext } from '../../state/app-context';
import { SearchEngine, SearchQuery, SearchResult, SearchStats } from '../../search/SearchEngine';
import { SearchResults } from './SearchResults';
import { FilterPanel } from './FilterPanel';
import { DiscoveryPanel } from './DiscoveryPanel';
import { SearchHistory } from './SearchHistory';

interface SearchInterfaceProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ isVisible, onClose }) => {
  const { state, actions } = useAppContext();
  const [searchEngine] = useState(() => new SearchEngine());
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'filters' | 'discovery' | 'history'>('search');
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<'instant' | 'manual'>('instant');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize search engine when component mounts
  useEffect(() => {
    if (isVisible) {
      initializeSearchEngine();
    }
  }, [isVisible]);

  // Instant search when query changes
  useEffect(() => {
    if (searchMode === 'instant' && query.length > 0) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    } else if (query.length === 0) {
      setResults([]);
      setStats(null);
      setSuggestions([]);
    }
  }, [query, searchMode]);

  // Update suggestions
  useEffect(() => {
    if (query.length > 1) {
      const timeoutId = setTimeout(async () => {
        const newSuggestions = await searchEngine.getSuggestions(query);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
      }, 150);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const initializeSearchEngine = useCallback(async () => {
    try {
      // Build search index from current scenarios
      const scenarioData = new Map();
      
      // Mock scenario data for now - in real implementation, this would come from loaded scenarios
      state.scenarios.forEach((scenarioPath, index) => {
        const mockScenario = {
          name: `Scenario ${index + 1}`,
          description: `Description for scenario ${index + 1}`,
          steps: [
            { name: 'API Call', type: 'api' },
            { name: 'Validation', type: 'validate' }
          ],
          environments: ['local', 'staging']
        };
        scenarioData.set(scenarioPath, mockScenario);
      });

      await searchEngine.indexScenarios(state.scenarios, scenarioData);
      actions.setStatus('Search index built successfully', 'success');
    } catch (error) {
      console.error('Failed to initialize search engine:', error);
      actions.setStatus('Failed to initialize search', 'error');
    }
  }, [state.scenarios]);

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchQuery: SearchQuery = {
        text: query,
        options: {
          includeContent: true,
          includeComments: true,
          includeFileNames: true,
          maxResults: 50,
          sortBy: 'relevance'
        }
      };

      const { results: searchResults, stats: searchStats } = await searchEngine.search(searchQuery);
      setResults(searchResults);
      setStats(searchStats);
      setSelectedResultIndex(0);
      
      actions.setStatus(`Found ${searchResults.length} results in ${searchStats.searchTime}ms`, 'success');
    } catch (error) {
      console.error('Search failed:', error);
      actions.setStatus('Search failed', 'error');
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleKeyInput = useCallback((input: string, key: any) => {
    if (!isVisible) return;

    // Handle Escape to close search
    if (key.escape) {
      onClose();
      return;
    }

    // Handle tab switching
    if (key.tab) {
      const tabs: typeof activeTab[] = ['search', 'filters', 'discovery', 'history'];
      const currentIndex = tabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
      return;
    }

    // Handle search input when in search tab
    if (activeTab === 'search') {
      // Handle backspace
      if (key.backspace || key.delete) {
        setQuery(prev => prev.slice(0, -1));
        return;
      }

      // Handle enter for manual search or selecting suggestion
      if (key.return) {
        if (showSuggestions && suggestions.length > 0) {
          setQuery(suggestions[0]);
          setShowSuggestions(false);
        } else if (searchMode === 'manual') {
          performSearch();
        }
        return;
      }

      // Handle suggestion navigation
      if (showSuggestions) {
        if (key.upArrow && suggestions.length > 0) {
          // For simplicity, just use first suggestion
          return;
        }
        if (key.downArrow && suggestions.length > 0) {
          return;
        }
      }

      // Handle result navigation
      if (results.length > 0 && !showSuggestions) {
        if (key.upArrow) {
          setSelectedResultIndex(prev => Math.max(0, prev - 1));
          return;
        }
        if (key.downArrow) {
          setSelectedResultIndex(prev => Math.min(results.length - 1, prev + 1));
          return;
        }
        if (key.return) {
          const selectedResult = results[selectedResultIndex];
          if (selectedResult) {
            // Navigate to selected result
            if (selectedResult.type === 'scenario') {
              const scenarioIndex = state.scenarios.findIndex(s => s === selectedResult.path);
              if (scenarioIndex >= 0) {
                actions.selectScenario(scenarioIndex);
                onClose();
              }
            }
          }
          return;
        }
      }

      // Handle special keys
      if (key.ctrl) {
        switch (input.toLowerCase()) {
          case 'f':
            setShowFilters(!showFilters);
            return;
          case 'h':
            setActiveTab('history');
            return;
          case 'd':
            setActiveTab('discovery');
            return;
          case 'm':
            setSearchMode(searchMode === 'instant' ? 'manual' : 'instant');
            actions.setStatus(`Search mode: ${searchMode === 'instant' ? 'manual' : 'instant'}`, 'info');
            return;
        }
      }

      // Handle regular character input
      if (input.length === 1 && !key.ctrl && !key.meta) {
        setQuery(prev => prev + input);
        return;
      }
    }
  }, [isVisible, activeTab, query, showSuggestions, suggestions, searchMode, results, selectedResultIndex]);

  useInput(handleKeyInput);

  if (!isVisible) return null;

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="cyan">Advanced Search</Text>
        <Box marginLeft={2}>
          <Text color={activeTab === 'search' ? 'yellow' : 'gray'}>Search</Text>
          <Text color="gray"> | </Text>
          <Text color={activeTab === 'filters' ? 'yellow' : 'gray'}>Filters</Text>
          <Text color="gray"> | </Text>
          <Text color={activeTab === 'discovery' ? 'yellow' : 'gray'}>Discovery</Text>
          <Text color="gray"> | </Text>
          <Text color={activeTab === 'history' ? 'yellow' : 'gray'}>History</Text>
        </Box>
        <Box marginLeft="auto">
          <Text color="gray">Mode: </Text>
          <Text color={searchMode === 'instant' ? 'green' : 'blue'}>{searchMode}</Text>
          <Text color="gray"> | ESC: Close</Text>
        </Box>
      </Box>

      {/* Search Input */}
      {activeTab === 'search' && (
        <Box borderStyle="single" paddingX={1}>
          <Text color="yellow">Search: </Text>
          <Text color="white">{query}</Text>
          <Text color="gray">▊</Text>
          {isSearching && <Text color="yellow"> 🔍 Searching...</Text>}
          {stats && (
            <Box marginLeft="auto">
              <Text color="gray">{stats.totalResults} results ({stats.searchTime}ms)</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Box borderStyle="single" paddingX={1}>
          <Text color="gray">Suggestions: </Text>
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <React.Fragment key={suggestion}>
              <Text color={index === 0 ? 'yellow' : 'gray'}>{suggestion}</Text>
              {index < suggestions.length - 1 && <Text color="gray"> • </Text>}
            </React.Fragment>
          ))}
        </Box>
      )}

      {/* Main Content Area */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Panel - Content based on active tab */}
        <Box flexGrow={1} borderStyle="single">
          {activeTab === 'search' && (
            <SearchResults
              results={results}
              selectedIndex={selectedResultIndex}
              onSelect={(result) => {
                if (result.type === 'scenario') {
                  const scenarioIndex = state.scenarios.findIndex(s => s === result.path);
                  if (scenarioIndex >= 0) {
                    actions.selectScenario(scenarioIndex);
                    onClose();
                  }
                }
              }}
            />
          )}
          
          {activeTab === 'filters' && (
            <FilterPanel
              onFiltersChange={(filters) => {
                // Apply filters to current results
                // This would integrate with the FilterEngine
              }}
            />
          )}
          
          {activeTab === 'discovery' && (
            <DiscoveryPanel searchEngine={searchEngine} />
          )}
          
          {activeTab === 'history' && (
            <SearchHistory
              searchEngine={searchEngine}
              onSelectQuery={(historyQuery) => {
                setQuery(historyQuery.text || '');
                setActiveTab('search');
              }}
            />
          )}
        </Box>

        {/* Right Panel - Stats and Quick Actions */}
        {showFilters && stats && (
          <Box width={30} borderStyle="single" padding={1}>
            <Text bold color="cyan">Search Stats</Text>
            <Text>Results: {stats.totalResults}</Text>
            <Text>Time: {stats.searchTime}ms</Text>
            <Text>Index: {stats.indexSize} entries</Text>
            
            <Box marginTop={1}>
              <Text bold color="cyan">File Types</Text>
              {Object.entries(stats.facets.fileTypes).slice(0, 5).map(([type, count]) => (
                <Text key={type}>
                  <Text color="gray">{type}: </Text>
                  <Text color="white">{count}</Text>
                </Text>
              ))}
            </Box>

            <Box marginTop={1}>
              <Text bold color="cyan">Step Types</Text>
              {Object.entries(stats.facets.stepTypes).slice(0, 5).map(([type, count]) => (
                <Text key={type}>
                  <Text color="gray">{type}: </Text>
                  <Text color="white">{count}</Text>
                </Text>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer with shortcuts */}
      <Box borderStyle="single" paddingX={1}>
        <Text color="gray">
          Tab: Switch tabs | ↑↓: Navigate | Enter: Select | Ctrl+F: Toggle filters | 
          Ctrl+M: Toggle mode | Ctrl+H: History | Ctrl+D: Discovery
        </Text>
      </Box>
    </Box>
  );
};