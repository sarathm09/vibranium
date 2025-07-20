/**
 * Syntax Highlighter for YAML and JSON
 * 
 * Terminal-based syntax highlighting with support for keywords,
 * strings, numbers, comments, and scenario-specific syntax.
 */

import React from 'react';
import { Text } from 'ink';
import { SyntaxToken, EditorPosition } from './types';
import chalk from 'chalk';

interface SyntaxHighlighterProps {
  content: string;
  language: 'yaml' | 'json';
  lineNumber: number;
  currentLine?: boolean;
  cursor?: EditorPosition;
  searchResults?: EditorPosition[];
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  content,
  language,
  lineNumber,
  currentLine = false,
  cursor,
  searchResults = []
}) => {
  const tokens = tokenizeContent(content, language);
  
  const renderTokens = () => {
    if (!tokens.length && !content) {
      return <Text color="gray">~</Text>;
    }

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    tokens.forEach((token, index) => {
      // Add any unprocessed text before this token
      if (token.start > lastEnd) {
        const beforeText = content.substring(lastEnd, token.start);
        elements.push(
          <Text key={`before-${index}`} color="white">
            {beforeText}
          </Text>
        );
      }

      // Add the token with appropriate styling
      const tokenColor = getTokenColor(token.type);
      const isHighlighted = searchResults.some(
        result => result.line === lineNumber && 
        result.column >= token.start && 
        result.column <= token.end
      );

      elements.push(
        <Text 
          key={`token-${index}`}
          color={isHighlighted ? 'black' : tokenColor}
          backgroundColor={isHighlighted ? 'yellow' : undefined}
          bold={token.type === 'keyword' || isHighlighted}
        >
          {token.value}
        </Text>
      );

      lastEnd = token.end;
    });

    // Add any remaining unprocessed text
    if (lastEnd < content.length) {
      const remainingText = content.substring(lastEnd);
      elements.push(
        <Text key="remaining" color="white">
          {remainingText}
        </Text>
      );
    }

    // Add cursor indicator if this is the current line
    if (currentLine && cursor && cursor.line === lineNumber) {
      // Insert cursor at the correct position
      const cursorElements: React.ReactNode[] = [];
      let charIndex = 0;
      
      elements.forEach((element, index) => {
        if (React.isValidElement(element) && element.props.children) {
          const text = element.props.children.toString();
          
          if (charIndex <= cursor.column && cursor.column <= charIndex + text.length) {
            // Cursor is within this element
            const beforeCursor = text.substring(0, cursor.column - charIndex);
            const afterCursor = text.substring(cursor.column - charIndex);
            
            if (beforeCursor) {
              cursorElements.push(
                React.cloneElement(element, { key: `${index}-before` }, beforeCursor)
              );
            }
            
            cursorElements.push(
              <Text key={`cursor-${index}`} backgroundColor="white" color="black">
                {afterCursor.charAt(0) || ' '}
              </Text>
            );
            
            if (afterCursor.length > 1) {
              cursorElements.push(
                React.cloneElement(element, { key: `${index}-after` }, afterCursor.substring(1))
              );
            }
          } else {
            cursorElements.push(element);
          }
          
          charIndex += text.length;
        } else {
          cursorElements.push(element);
        }
      });
      
      return <>{cursorElements}</>;
    }

    return <>{elements}</>;
  };

  return (
    <Text backgroundColor={currentLine ? 'gray' : undefined}>
      {renderTokens()}
    </Text>
  );
};

function tokenizeContent(content: string, language: 'yaml' | 'json'): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  
  if (language === 'yaml') {
    return tokenizeYAML(content);
  } else {
    return tokenizeJSON(content);
  }
}

function tokenizeYAML(content: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const patterns = {
    comment: /#.*/g,
    string: /(["'])((?:\\.|(?!\1)[^\\])*)\1/g,
    number: /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
    boolean: /\b(?:true|false|yes|no|on|off)\b/gi,
    null: /\b(?:null|~)\b/gi,
    keyword: /\b(?:name|description|version|environment|variables|steps|type|method|url|headers|body|auth|expect|timeout|retries|depends_on|if|unless|loop|parallel)\b/g,
    property: /^[\s]*([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/gm,
    operator: /[:\-\[\]{}|>]/g,
    variable: /\$\{[^}]+\}|\$\.[a-zA-Z0-9_.]+/g
  };

  // Process each pattern type
  Object.entries(patterns).forEach(([type, pattern]) => {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    
    while ((match = pattern.exec(content)) !== null) {
      tokens.push({
        type: type as SyntaxToken['type'],
        start: match.index,
        end: match.index + match[0].length,
        value: match[0]
      });
    }
  });

  // Sort tokens by start position
  tokens.sort((a, b) => a.start - b.start);
  
  // Remove overlapping tokens (keep the first one)
  const cleanTokens: SyntaxToken[] = [];
  let lastEnd = 0;
  
  tokens.forEach(token => {
    if (token.start >= lastEnd) {
      cleanTokens.push(token);
      lastEnd = token.end;
    }
  });

  return cleanTokens;
}

function tokenizeJSON(content: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const patterns = {
    string: /"((?:\\.|[^"\\])*)"/g,
    number: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    boolean: /\b(?:true|false)\b/g,
    null: /\bnull\b/g,
    property: /"([^"]+)"\s*:/g,
    operator: /[{}[\]:,]/g,
    variable: /\$\{[^}]+\}|\$\.[a-zA-Z0-9_.]+/g
  };

  Object.entries(patterns).forEach(([type, pattern]) => {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(content)) !== null) {
      tokens.push({
        type: type as SyntaxToken['type'],
        start: match.index,
        end: match.index + match[0].length,
        value: match[0]
      });
    }
  });

  tokens.sort((a, b) => a.start - b.start);
  
  const cleanTokens: SyntaxToken[] = [];
  let lastEnd = 0;
  
  tokens.forEach(token => {
    if (token.start >= lastEnd) {
      cleanTokens.push(token);
      lastEnd = token.end;
    }
  });

  return cleanTokens;
}

function getTokenColor(type: SyntaxToken['type']): string {
  switch (type) {
    case 'keyword':
      return 'blue';
    case 'string':
      return 'green';
    case 'number':
      return 'magenta';
    case 'comment':
      return 'gray';
    case 'operator':
      return 'yellow';
    case 'variable':
      return 'cyan';
    case 'property':
      return 'white';
    default:
      return 'white';
  }
}