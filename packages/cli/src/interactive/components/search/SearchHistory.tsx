/**
 * Search History and Saved Searches Component
 * Manages search history, saved searches, and search insights
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SearchEngine, SearchQuery } from '../../search/SearchEngine';

interface SearchHistoryProps {
  searchEngine: SearchEngine;
  onSelectQuery: (query: SearchQuery) => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  searchEngine,
  onSelectQuery
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'saved' | 'insights'>('history');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  const history = searchEngine.getSearchHistory();
  const savedSearches = Array.from(searchEngine.getSavedSearches().entries());
  const insights = searchEngine.getSearchInsights();

  useInput((input, key) => {
    // Navigate tabs
    if (key.leftArrow || key.rightArrow) {
      const tabs = ['history', 'saved', 'insights'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      const newIndex = key.leftArrow
        ? Math.max(0, currentIndex - 1)
        : Math.min(tabs.length - 1, currentIndex + 1);
      setActiveTab(tabs[newIndex]);
      setSelectedIndex(0);
    }
    
    // Navigate items
    else if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      const maxIndex = getMaxIndex();
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    }
    
    // Select item
    else if (key.return) {
      handleSelectItem();
    }
    
    // Save search (S key)
    else if (input.toLowerCase() === 's' && activeTab === 'history') {
      const selectedQuery = history[selectedIndex];
      if (selectedQuery) {
        setShowSaveDialog(true);
      }
    }
    
    // Delete item (D key)
    else if (input.toLowerCase() === 'd') {
      handleDeleteItem();
    }
    
    // Clear history (C key)
    else if (input.toLowerCase() === 'c' && activeTab === 'history') {
      searchEngine.clearHistory();
    }
  });

  const getMaxIndex = () => {
    switch (activeTab) {
      case 'history':
        return Math.max(0, history.length - 1);
      case 'saved':
        return Math.max(0, savedSearches.length - 1);
      case 'insights':
        return Math.max(0, insights.popularTerms.length - 1);
      default:
        return 0;
    }
  };

  const handleSelectItem = () => {
    switch (activeTab) {
      case 'history':
        const selectedQuery = history[selectedIndex];
        if (selectedQuery) {
          onSelectQuery(selectedQuery);
        }
        break;
      case 'saved':
        const selectedSaved = savedSearches[selectedIndex];
        if (selectedSaved) {
          onSelectQuery(selectedSaved[1]);
        }
        break;
      case 'insights':
        const selectedTerm = insights.popularTerms[selectedIndex];
        if (selectedTerm) {
          onSelectQuery({ text: selectedTerm.term });
        }
        break;
    }
  };

  const handleDeleteItem = () => {
    // Implementation would depend on adding delete methods to SearchEngine
    // For now, we'll just show a placeholder
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'history':
        return <HistoryTab history={history} selectedIndex={selectedIndex} />;
      case 'saved':
        return <SavedSearchesTab savedSearches={savedSearches} selectedIndex={selectedIndex} />;
      case 'insights':
        return <InsightsTab insights={insights} selectedIndex={selectedIndex} />;
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header with tabs */}
      <Box borderStyle="single" paddingX={1}>
        <Text bold color="cyan">Search History & Insights</Text>
        <Box marginLeft={2}>
          <Text color={activeTab === 'history' ? 'yellow' : 'gray'}>History</Text>
          <Text color="gray"> | </Text>
          <Text color={activeTab === 'saved' ? 'yellow' : 'gray'}>Saved</Text>
          <Text color="gray"> | </Text>
          <Text color={activeTab === 'insights' ? 'yellow' : 'gray'}>Insights</Text>
        </Box>
        <Box marginLeft="auto">
          <Text color="gray">
            {activeTab === 'history' && 'S: Save | C: Clear'}
            {activeTab === 'saved' && 'D: Delete'}
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box flexGrow={1} marginTop={1}>
        {renderTabContent()}
      </Box>

      {/* Footer */}
      <Box borderStyle="single" paddingX={1}>
        <Text color="gray">
          ←→: Switch tabs | ↑↓: Navigate | Enter: Select
          {activeTab === 'history' && ' | S: Save search | C: Clear history'}
          {activeTab === 'saved' && ' | D: Delete saved search'}
        </Text>
      </Box>
    </Box>
  );
};

// Tab Components

const HistoryTab: React.FC<{ history: SearchQuery[]; selectedIndex: number }> = ({
  history,
  selectedIndex
}) => (
  <Box flexDirection="column">
    <Box>
      <Text bold color="cyan">Recent Searches</Text>
      <Box marginLeft="auto">
        <Text color="gray">({history.length} searches)</Text>
      </Box>
    </Box>
    
    {history.length === 0 ? (
      <Box justifyContent="center" marginTop={2}>
        <Text color="gray">No search history yet. Start searching to see history here.</Text>
      </Box>
    ) : (
      <Box flexDirection="column" marginTop={1}>
        {history.slice(0, 20).map((query, index) => (
          <Box
            key={index}
            borderStyle={index === selectedIndex ? 'single' : undefined}
            borderColor={index === selectedIndex ? 'yellow' : undefined}
            paddingX={1}
            marginY={0}
          >
            <Box flexDirection="column" width="100%">
              {/* Query text */}
              <Box>
                <Text color="white">
                  {query.text || query.regex || 'Advanced query'}
                </Text>
                {query.regex && (
                  <Text color="magenta"> (regex)</Text>
                )}
              </Box>
              
              {/* Filters summary */}
              {query.filters && Object.keys(query.filters).length > 0 && (
                <Box>
                  <Text color="gray">Filters: </Text>
                  <Text color="cyan">
                    {Object.entries(query.filters)
                      .filter(([_, value]) => value !== undefined && value !== null)
                      .map(([key]) => key)
                      .join(', ')}
                  </Text>
                </Box>
              )}
              
              {/* Options summary */}
              {query.options && (
                <Box>
                  <Text color="gray">Options: </Text>
                  <Text color="blue">
                    {[
                      query.options.caseSensitive && 'case-sensitive',
                      query.options.wholeWord && 'whole-word',
                      query.options.sortBy && `sort:${query.options.sortBy}`
                    ]
                      .filter(Boolean)
                      .join(', ') || 'default'}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        ))}
        
        {history.length > 20 && (
          <Box paddingX={1}>
            <Text color="gray">... and {history.length - 20} more searches</Text>
          </Box>
        )}
      </Box>
    )}
  </Box>
);

const SavedSearchesTab: React.FC<{
  savedSearches: [string, SearchQuery][];
  selectedIndex: number;
}> = ({ savedSearches, selectedIndex }) => (
  <Box flexDirection="column">
    <Box>
      <Text bold color="cyan">Saved Searches</Text>
      <Box marginLeft="auto">
        <Text color="gray">({savedSearches.length} saved)</Text>
      </Box>
    </Box>
    
    {savedSearches.length === 0 ? (
      <Box justifyContent="center" marginTop={2}>
        <Text color="gray">No saved searches yet. Press 'S' on any search to save it.</Text>
      </Box>
    ) : (
      <Box flexDirection="column" marginTop={1}>
        {savedSearches.map(([name, query], index) => (
          <Box
            key={name}
            borderStyle={index === selectedIndex ? 'single' : undefined}
            borderColor={index === selectedIndex ? 'yellow' : undefined}
            paddingX={1}
            marginY={0}
          >
            <Box flexDirection="column" width="100%">
              {/* Search name */}
              <Text bold color="green">{name}</Text>
              
              {/* Query details */}
              <Box>
                <Text color="gray">Query: </Text>
                <Text color="white">
                  {query.text || query.regex || 'Advanced query'}
                </Text>
              </Box>
              
              {/* Filters if any */}
              {query.filters && Object.keys(query.filters).length > 0 && (
                <Box>
                  <Text color="gray">Filters: </Text>
                  <Text color="cyan">
                    {Object.keys(query.filters).join(', ')}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

const InsightsTab: React.FC<{
  insights: {
    totalSearches: number;
    popularTerms: { term: string; count: number }[];
    commonFilters: { filter: string; count: number }[];
    searchPatterns: string[];
  };
  selectedIndex: number;
}> = ({ insights, selectedIndex }) => (
  <Box flexDirection="column">
    <Text bold color="cyan">Search Insights</Text>
    
    {/* Summary stats */}
    <Box marginTop={1} borderStyle="single" paddingX={1}>
      <Text color="white">Total searches: </Text>
      <Text color="yellow">{insights.totalSearches}</Text>
    </Box>
    
    {/* Popular terms */}
    <Box marginTop={1}>
      <Text bold color="cyan">Popular Search Terms</Text>
      {insights.popularTerms.length === 0 ? (
        <Text color="gray">No search patterns detected yet.</Text>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {insights.popularTerms.slice(0, 10).map((term, index) => (
            <Box
              key={term.term}
              borderStyle={index === selectedIndex ? 'single' : undefined}
              borderColor={index === selectedIndex ? 'yellow' : undefined}
              paddingX={1}
            >
              <Text color="white">{term.term}</Text>
              <Box marginLeft="auto">
                <Text color="gray">used </Text>
                <Text color="green">{term.count}</Text>
                <Text color="gray"> times</Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
    
    {/* Common filters */}
    {insights.commonFilters.length > 0 && (
      <Box marginTop={2}>
        <Text bold color="cyan">Common Filters</Text>
        <Box flexDirection="column" marginTop={1}>
          {insights.commonFilters.slice(0, 5).map((filter, index) => (
            <Box key={filter.filter} paddingX={1}>
              <Text color="blue">{filter.filter}</Text>
              <Box marginLeft="auto">
                <Text color="gray">used </Text>
                <Text color="green">{filter.count}</Text>
                <Text color="gray"> times</Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    )}
    
    {/* Search patterns */}
    {insights.searchPatterns.length > 0 && (
      <Box marginTop={2}>
        <Text bold color="cyan">Search Patterns</Text>
        <Box flexDirection="column" marginTop={1}>
          {insights.searchPatterns.map((pattern, index) => (
            <Box key={index} paddingX={1}>
              <Text color="magenta">• {pattern}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )}
    
    {/* Search recommendations */}
    <Box marginTop={2} borderStyle="single" paddingX={1}>
      <Text bold color="cyan">💡 Search Tips</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text color="gray">• Use quotes for exact phrases: "user authentication"</Text>
        <Text color="gray">• Use regex for patterns: /api.*test/</Text>
        <Text color="gray">• Combine with filters for precise results</Text>
        <Text color="gray">• Save frequent searches for quick access</Text>
      </Box>
    </Box>
  </Box>
);