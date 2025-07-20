/**
 * JSON content parser with JSONPath query support
 */

import { JSONPath } from 'jsonpath-plus';
import { logger } from '@vibraniumjs/utils';

export interface JsonParseOptions {
  strict?: boolean;
  allowComments?: boolean;
}

export interface JsonQueryOptions {
  wrap?: boolean;
  preventEval?: boolean;
  autostart?: boolean;
}

export interface JsonParseResult {
  data: any;
  contentType: string;
  size: number;
}

export interface JsonQueryResult {
  value: any;
  path: string;
  pointer: string;
  parent: any;
  parentProperty: string | number | null;
}

export class JsonContentParser {
  /**
   * Parse JSON content from string or buffer
   */
  parse(content: string | Buffer, options: JsonParseOptions = {}): JsonParseResult {
    const { strict = true, allowComments = false } = options;
    
    try {
      logger.debug('Parsing JSON content', { 
        type: typeof content,
        size: content.length
      });
      
      let jsonString = content.toString('utf8');
      
      // Remove comments if allowed
      if (allowComments) {
        jsonString = this.removeComments(jsonString);
      }
      
      // Parse JSON
      const data = JSON.parse(jsonString);
      
      // Additional strict validation
      if (strict) {
        this.validateJsonStructure(data);
      }
      
      const result: JsonParseResult = {
        data,
        contentType: 'application/json',
        size: jsonString.length
      };
      
      logger.debug('JSON parsing successful', {
        dataType: Array.isArray(data) ? 'array' : typeof data,
        keys: data && typeof data === 'object' ? Object.keys(data).length : 0
      });
      
      return result;
    } catch (error) {
      logger.error('JSON parsing failed', { error: error.message });
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }
  
  /**
   * Query JSON data using JSONPath expressions
   */
  query(
    data: any,
    path: string,
    options: JsonQueryOptions = {}
  ): JsonQueryResult[] {
    const {
      wrap = true,
      preventEval = true,
      autostart = true
    } = options;
    
    try {
      logger.debug('Executing JSONPath query', { path });
      
      const results = JSONPath({
        path,
        json: data,
        wrap,
        preventEval,
        autostart,
        resultType: 'all'
      });
      
      const formattedResults: JsonQueryResult[] = results.map(result => ({
        value: result.value,
        path: result.path || '',
        pointer: result.pointer || '',
        parent: result.parent,
        parentProperty: result.parentProperty
      }));
      
      logger.debug('JSONPath query completed', {
        path,
        resultCount: formattedResults.length
      });
      
      return formattedResults;
    } catch (error) {
      logger.error('JSONPath query failed', { path, error: error.message });
      throw new Error(`JSONPath query failed for path '${path}': ${error.message}`);
    }
  }
  
  /**
   * Extract single value using JSONPath
   */
  queryValue(data: any, path: string, defaultValue?: any): any {
    try {
      const results = this.query(data, path);
      
      if (results.length === 0) {
        return defaultValue;
      }
      
      if (results.length === 1) {
        return results[0].value;
      }
      
      // Multiple results - return array of values
      return results.map(result => result.value);
    } catch (error) {
      logger.warn('JSONPath value extraction failed', { path, error: error.message });
      return defaultValue;
    }
  }
  
  /**
   * Check if a JSONPath exists in the data
   */
  pathExists(data: any, path: string): boolean {
    try {
      const results = this.query(data, path);
      return results.length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get all paths in a JSON object
   */
  getAllPaths(
    data: any,
    options: { maxDepth?: number; includeValues?: boolean } = {}
  ): Array<{ path: string; value?: any; type: string }> {
    const { maxDepth = 10, includeValues = false } = options;
    const paths: Array<{ path: string; value?: any; type: string }> = [];
    
    const traverse = (obj: any, currentPath: string, depth: number) => {
      if (depth > maxDepth) {
        return;
      }
      
      if (obj === null) {
        paths.push({
          path: currentPath,
          value: includeValues ? obj : undefined,
          type: 'null'
        });
        return;
      }
      
      if (Array.isArray(obj)) {
        paths.push({
          path: currentPath,
          value: includeValues ? obj : undefined,
          type: 'array'
        });
        
        obj.forEach((item, index) => {
          traverse(item, `${currentPath}[${index}]`, depth + 1);
        });
      } else if (typeof obj === 'object') {
        paths.push({
          path: currentPath,
          value: includeValues ? obj : undefined,
          type: 'object'
        });
        
        Object.keys(obj).forEach(key => {
          const nextPath = currentPath ? `${currentPath}.${key}` : key;
          traverse(obj[key], nextPath, depth + 1);
        });
      } else {
        paths.push({
          path: currentPath,
          value: includeValues ? obj : undefined,
          type: typeof obj
        });
      }
    };
    
    traverse(data, '$', 0);
    return paths;
  }
  
  /**
   * Validate JSONPath expression syntax
   */
  validateJsonPath(path: string): { valid: boolean; error?: string } {
    try {
      // Test with empty object to validate syntax
      JSONPath({ path, json: {}, wrap: false });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid JSONPath syntax'
      };
    }
  }
  
  /**
   * Remove JSON comments (simplified implementation)
   */
  private removeComments(content: string): string {
    // This is a basic implementation - for production use a proper JSON-with-comments parser
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, ''); // Remove // comments
  }
  
  /**
   * Validate JSON structure for common issues
   */
  private validateJsonStructure(data: any): void {
    // Check for circular references
    const seen = new WeakSet();
    
    const checkCircular = (obj: any) => {
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) {
          throw new Error('Circular reference detected in JSON data');
        }
        
        seen.add(obj);
        
        if (Array.isArray(obj)) {
          obj.forEach(checkCircular);
        } else {
          Object.values(obj).forEach(checkCircular);
        }
      }
    };
    
    checkCircular(data);
  }
}
