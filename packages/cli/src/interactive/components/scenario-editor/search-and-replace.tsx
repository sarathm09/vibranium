/**
 * Search and Replace Component
 * 
 * Advanced search and replace functionality with regex support,
 * case sensitivity, whole word matching, and multi-file operations.
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { SearchOptions, EditorPosition } from './types';

interface SearchAndReplaceProps {
  content: string;
  width: number;
  height: number;
  onSearch: (results: EditorPosition[]) => void;
  onReplace: (newContent: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const SearchAndReplace: React.FC<SearchAndReplaceProps> = ({
  content,
  width,
  height,
  onSearch,
  onReplace,
  onClose,
  isVisible
}) => {
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    replaceWith: ''
  });

  const [currentField, setCurrentField] = useState<'search' | 'replace'>('search');
  const [searchResults, setSearchResults] = useState<EditorPosition[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [replaceMode, setReplaceMode] = useState<'single' | 'all'>('single');

  useEffect(() => {
    if (searchOptions.query && content) {
      performSearch();
    } else {
      setSearchResults([]);
      onSearch([]);
    }
  }, [searchOptions.query, searchOptions.caseSensitive, searchOptions.wholeWord, searchOptions.regex, content]);

  useInput((input, key) => {
    if (!isVisible) return;

    if (key.escape) {
      onClose();
      return;
    }

    if (key.tab) {
      if (showReplace) {
        setCurrentField(currentField === 'search' ? 'replace' : 'search');
      }
      return;
    }

    if (key.ctrl) {
      switch (input.toLowerCase()) {
        case 'r':
          setShowReplace(!showReplace);
          return;
        case 'i':
          toggleCaseSensitive();
          return;
        case 'w':
          toggleWholeWord();
          return;
        case 'x':
          toggleRegex();
          return;
        case 'f':
          // Find next
          findNext();
          return;
        case 'h':
          // Replace current
          if (showReplace) {
            replaceCurrent();
          }
          return;
        case 'a':
          // Replace all
          if (showReplace) {
            replaceAll();
          }
          return;
      }
    }

    if (key.return) {
      if (currentField === 'search') {
        findNext();
      } else if (showReplace) {
        replaceCurrent();
      }
      return;
    }

    if (key.upArrow || key.downArrow) {
      navigateResults(key.upArrow ? -1 : 1);
      return;
    }

    // Handle text input
    if (key.backspace) {
      if (currentField === 'search') {
        setSearchOptions(prev => ({
          ...prev,
          query: prev.query.slice(0, -1)
        }));
      } else {
        setSearchOptions(prev => ({
          ...prev,
          replaceWith: prev.replaceWith.slice(0, -1)
        }));
      }
    } else if (input && !key.ctrl && !key.meta) {
      if (currentField === 'search') {
        setSearchOptions(prev => ({
          ...prev,
          query: prev.query + input
        }));
      } else {
        setSearchOptions(prev => ({
          ...prev,
          replaceWith: prev.replaceWith + input
        }));
      }
    }
  });

  const performSearch = () => {
    try {
      const results: EditorPosition[] = [];
      const lines = content.split('\n');
      
      let searchPattern: RegExp;
      
      if (searchOptions.regex) {
        const flags = searchOptions.caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(searchOptions.query, flags);
      } else {
        let escapedQuery = searchOptions.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (searchOptions.wholeWord) {
          escapedQuery = `\\b${escapedQuery}\\b`;
        }
        
        const flags = searchOptions.caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(escapedQuery, flags);
      }

      lines.forEach((line, lineIndex) => {
        let match;
        searchPattern.lastIndex = 0; // Reset regex state
        
        while ((match = searchPattern.exec(line)) !== null) {
          results.push({
            line: lineIndex,
            column: match.index
          });
          
          // Prevent infinite loop with zero-length matches
          if (match.index === searchPattern.lastIndex) {
            searchPattern.lastIndex++;
          }
        }
      });

      setSearchResults(results);
      setCurrentResultIndex(0);
      onSearch(results);
    } catch (error) {
      // Handle regex errors
      setSearchResults([]);
      onSearch([]);
    }
  };

  const toggleCaseSensitive = () => {
    setSearchOptions(prev => ({
      ...prev,
      caseSensitive: !prev.caseSensitive
    }));
  };

  const toggleWholeWord = () => {
    setSearchOptions(prev => ({
      ...prev,
      wholeWord: !prev.wholeWord
    }));
  };

  const toggleRegex = () => {
    setSearchOptions(prev => ({
      ...prev,
      regex: !prev.regex
    }));
  };

  const findNext = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentResultIndex + 1) % searchResults.length;
      setCurrentResultIndex(nextIndex);
    }
  };

  const findPrevious = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
      setCurrentResultIndex(prevIndex);
    }
  };

  const navigateResults = (direction: number) => {
    if (searchResults.length === 0) return;
    
    const newIndex = currentResultIndex + direction;
    if (newIndex >= 0 && newIndex < searchResults.length) {
      setCurrentResultIndex(newIndex);
    }
  };

  const replaceCurrent = () => {
    if (searchResults.length === 0 || !showReplace) return;
    
    const currentResult = searchResults[currentResultIndex];
    const lines = content.split('\n');
    const line = lines[currentResult.line];
    
    // Find the exact match at the current position
    let searchPattern: RegExp;
    
    if (searchOptions.regex) {
      const flags = searchOptions.caseSensitive ? '' : 'i';
      searchPattern = new RegExp(searchOptions.query, flags);
    } else {
      let escapedQuery = searchOptions.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      if (searchOptions.wholeWord) {
        escapedQuery = `\\b${escapedQuery}\\b`;
      }
      
      const flags = searchOptions.caseSensitive ? '' : 'i';
      searchPattern = new RegExp(escapedQuery, flags);
    }

    const beforeMatch = line.substring(0, currentResult.column);
    const afterMatch = line.substring(currentResult.column);
    const newLine = beforeMatch + afterMatch.replace(searchPattern, searchOptions.replaceWith);
    
    lines[currentResult.line] = newLine;
    const newContent = lines.join('\n');
    
    onReplace(newContent);
    
    // Update search results after replacement
    performSearch();
  };

  const replaceAll = () => {
    if (!showReplace || !searchOptions.query) return;
    
    try {
      let searchPattern: RegExp;
      
      if (searchOptions.regex) {
        const flags = searchOptions.caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(searchOptions.query, flags);
      } else {
        let escapedQuery = searchOptions.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (searchOptions.wholeWord) {
          escapedQuery = `\\b${escapedQuery}\\b`;
        }
        
        const flags = searchOptions.caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(escapedQuery, flags);
      }

      const newContent = content.replace(searchPattern, searchOptions.replaceWith);
      onReplace(newContent);
      
      // Update search results after replacement
      performSearch();
    } catch (error) {
      // Handle regex errors
    }
  };

  const renderSearchField = () => (
    <Box flexDirection="row" paddingX={1}>
      <Box width={10}>
        <Text color={currentField === 'search' ? 'cyan' : 'gray'} bold>
          Find:
        </Text>
      </Box>
      <Box 
        flexGrow={1} 
        borderStyle="single" 
        borderColor={currentField === 'search' ? 'cyan' : 'gray'}
        paddingX={1}
      >
        <Text color="white">
          {searchOptions.query}
          {currentField === 'search' && <Text color="yellow">█</Text>}
        </Text>
      </Box>
      <Box width={15} marginLeft={1}>
        <Text color="gray">
          {searchResults.length > 0 ? 
            `${currentResultIndex + 1}/${searchResults.length}` : 
            searchOptions.query ? 'No results' : ''
          }
        </Text>
      </Box>
    </Box>
  );

  const renderReplaceField = () => {
    if (!showReplace) return null;

    return (
      <Box flexDirection="row" paddingX={1} marginTop={1}>
        <Box width={10}>
          <Text color={currentField === 'replace' ? 'cyan' : 'gray'} bold>
            Replace:
          </Text>
        </Box>
        <Box 
          flexGrow={1} 
          borderStyle="single" 
          borderColor={currentField === 'replace' ? 'cyan' : 'gray'}
          paddingX={1}
        >
          <Text color="white">
            {searchOptions.replaceWith}
            {currentField === 'replace' && <Text color="yellow">█</Text>}
          </Text>
        </Box>
      </Box>
    );
  };

  const renderOptions = () => (
    <Box flexDirection="row" paddingX={1} marginTop={1}>
      <Text color={searchOptions.caseSensitive ? 'cyan' : 'gray'}>
        [Aa] Case
      </Text>
      <Text color={searchOptions.wholeWord ? 'cyan' : 'gray'} marginLeft={2}>
        [W] Word
      </Text>
      <Text color={searchOptions.regex ? 'cyan' : 'gray'} marginLeft={2}>
        [.*] Regex
      </Text>
    </Box>
  );

  const renderActions = () => (
    <Box flexDirection="row" paddingX={1} marginTop={1} justifyContent="space-between">
      <Box flexDirection="row">
        <Text color="gray">Enter: Find Next</Text>
        <Text color="gray" marginLeft={2}>↑↓: Navigate</Text>
      </Box>
      {showReplace && (
        <Box flexDirection="row">
          <Text color="gray">Ctrl+H: Replace</Text>
          <Text color="gray" marginLeft={2}>Ctrl+A: Replace All</Text>
        </Box>
      )}
    </Box>
  );

  const renderShortcuts = () => (
    <Box borderStyle="single" borderTop={false} paddingX={1}>
      <Text color="gray" dimColor>
        Ctrl+R: Toggle Replace | Ctrl+I: Case | Ctrl+W: Word | Ctrl+X: Regex | Esc: Close
      </Text>
    </Box>
  );

  if (!isVisible) return null;

  return (
    <Box
      position="absolute"
      top={2}
      left={Math.floor(width / 6)}
      width={Math.floor(width * 2 / 3)}
      height={showReplace ? 10 : 8}
      borderStyle="double"
      borderColor="cyan"
      backgroundColor="black"
      flexDirection="column"
    >
      <Box paddingX={1} justifyContent="center" borderStyle="single" borderBottom={false}>
        <Text bold color="cyan">
          Search {showReplace ? '& Replace' : ''}
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        {renderSearchField()}
        {renderReplaceField()}
        {renderOptions()}
        {renderActions()}
      </Box>

      {renderShortcuts()}
    </Box>
  );
};