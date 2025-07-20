/**
 * Text content parser for plain text responses
 */

import { logger } from '@vibraniumjs/utils';

export interface TextParseOptions {
  encoding?: BufferEncoding;
  trimWhitespace?: boolean;
  splitLines?: boolean;
  removeEmptyLines?: boolean;
}

export interface TextParseResult {
  text: string;
  lines?: string[];
  contentType: string;
  size: number;
  encoding: string;
  metadata: {
    lineCount: number;
    wordCount: number;
    charCount: number;
    isEmpty: boolean;
  };
}

export interface TextSearchResult {
  line: number;
  column: number;
  match: string;
  context?: string;
}

export class TextContentParser {
  /**
   * Parse text content from string or buffer
   */
  parse(content: string | Buffer, options: TextParseOptions = {}): TextParseResult {
    const {
      encoding = 'utf8',
      trimWhitespace = false,
      splitLines = false,
      removeEmptyLines = false
    } = options;
    
    try {
      logger.debug('Parsing text content', {
        type: typeof content,
        size: content.length,
        encoding
      });
      
      let text = content.toString(encoding);
      
      if (trimWhitespace) {
        text = text.trim();
      }
      
      let lines: string[] | undefined;
      if (splitLines) {
        lines = text.split(/\r?\n/);
        
        if (removeEmptyLines) {
          lines = lines.filter(line => line.trim().length > 0);
        }
      }
      
      const metadata = this.calculateMetadata(text);
      
      const result: TextParseResult = {
        text,
        lines,
        contentType: 'text/plain',
        size: text.length,
        encoding,
        metadata
      };
      
      logger.debug('Text parsing successful', {
        charCount: metadata.charCount,
        lineCount: metadata.lineCount,
        wordCount: metadata.wordCount
      });
      
      return result;
    } catch (error) {
      logger.error('Text parsing failed', { error: error.message });
      throw new Error(`Text parsing failed: ${error.message}`);
    }
  }
  
  /**
   * Search for patterns in text content
   */
  search(
    text: string,
    pattern: string | RegExp,
    options: {
      caseSensitive?: boolean;
      wholeWord?: boolean;
      includeContext?: boolean;
      contextLines?: number;
    } = {}
  ): TextSearchResult[] {
    const {
      caseSensitive = true,
      wholeWord = false,
      includeContext = false,
      contextLines = 1
    } = options;
    
    try {
      logger.debug('Searching text content', {
        pattern: pattern.toString(),
        caseSensitive,
        wholeWord
      });
      
      const lines = text.split(/\r?\n/);
      const results: TextSearchResult[] = [];
      
      let searchRegex: RegExp;
      
      if (pattern instanceof RegExp) {
        searchRegex = pattern;
      } else {
        let regexPattern = pattern;
        
        // Escape special regex characters
        regexPattern = regexPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Add word boundaries if wholeWord is true
        if (wholeWord) {
          regexPattern = `\\b${regexPattern}\\b`;
        }
        
        const flags = caseSensitive ? 'g' : 'gi';
        searchRegex = new RegExp(regexPattern, flags);
      }
      
      lines.forEach((line, lineIndex) => {
        let match;
        searchRegex.lastIndex = 0; // Reset regex state
        
        while ((match = searchRegex.exec(line)) !== null) {
          const result: TextSearchResult = {
            line: lineIndex + 1, // 1-based line numbers
            column: match.index + 1, // 1-based column numbers
            match: match[0]
          };
          
          if (includeContext) {
            result.context = this.extractContext(
              lines,
              lineIndex,
              contextLines
            );
          }
          
          results.push(result);
          
          // Prevent infinite loops with zero-width matches
          if (match[0].length === 0) {
            searchRegex.lastIndex++;
          }
        }
      });
      
      logger.debug('Text search completed', {
        pattern: pattern.toString(),
        resultCount: results.length
      });
      
      return results;
    } catch (error) {
      logger.error('Text search failed', { pattern: pattern.toString(), error: error.message });
      throw new Error(`Text search failed: ${error.message}`);
    }
  }
  
  /**
   * Extract specific lines from text
   */
  getLines(
    text: string,
    startLine: number,
    endLine?: number
  ): { lines: string[]; totalLines: number } {
    const allLines = text.split(/\r?\n/);
    const start = Math.max(0, startLine - 1); // Convert to 0-based
    const end = endLine ? Math.min(allLines.length, endLine) : start + 1;
    
    return {
      lines: allLines.slice(start, end),
      totalLines: allLines.length
    };
  }
  
  /**
   * Count occurrences of a pattern in text
   */
  count(text: string, pattern: string | RegExp, caseSensitive: boolean = true): number {
    try {
      let searchRegex: RegExp;
      
      if (pattern instanceof RegExp) {
        searchRegex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      } else {
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseSensitive ? 'g' : 'gi';
        searchRegex = new RegExp(escapedPattern, flags);
      }
      
      const matches = text.match(searchRegex);
      return matches ? matches.length : 0;
    } catch (error) {
      logger.error('Text count failed', { pattern: pattern.toString(), error: error.message });
      return 0;
    }
  }
  
  /**
   * Replace patterns in text
   */
  replace(
    text: string,
    pattern: string | RegExp,
    replacement: string,
    options: { caseSensitive?: boolean; replaceAll?: boolean } = {}
  ): string {
    const { caseSensitive = true, replaceAll = false } = options;
    
    try {
      let searchRegex: RegExp;
      
      if (pattern instanceof RegExp) {
        searchRegex = pattern;
      } else {
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
        searchRegex = new RegExp(escapedPattern, flags);
      }
      
      return text.replace(searchRegex, replacement);
    } catch (error) {
      logger.error('Text replace failed', { pattern: pattern.toString(), error: error.message });
      return text;
    }
  }
  
  /**
   * Validate text encoding
   */
  validateEncoding(buffer: Buffer, expectedEncoding: BufferEncoding = 'utf8'): boolean {
    try {
      const decoded = buffer.toString(expectedEncoding);
      const reencoded = Buffer.from(decoded, expectedEncoding);
      return buffer.equals(reencoded);
    } catch {
      return false;
    }
  }
  
  /**
   * Detect text encoding (basic detection)
   */
  detectEncoding(buffer: Buffer): BufferEncoding {
    // Check for BOM markers
    if (buffer.length >= 3) {
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8';
      }
    }
    
    if (buffer.length >= 2) {
      if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return 'utf16le';
      }
      if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        return 'utf16le'; // Close enough for basic detection
      }
    }
    
    // Default to UTF-8
    return 'utf8';
  }
  
  /**
   * Calculate text metadata
   */
  private calculateMetadata(text: string): TextParseResult['metadata'] {
    const lines = text.split(/\r?\n/);
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    
    return {
      lineCount: lines.length,
      wordCount: words.length,
      charCount: text.length,
      isEmpty: text.trim().length === 0
    };
  }
  
  /**
   * Extract context lines around a specific line
   */
  private extractContext(lines: string[], targetLine: number, contextLines: number): string {
    const start = Math.max(0, targetLine - contextLines);
    const end = Math.min(lines.length, targetLine + contextLines + 1);
    
    return lines.slice(start, end).join('\n');
  }
}
