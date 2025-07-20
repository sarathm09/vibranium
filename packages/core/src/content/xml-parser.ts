/**
 * XML content parser with XPath query support
 */

import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import { logger } from '@vibraniumjs/utils';

export interface XmlParseOptions {
  strict?: boolean;
  ignoreWhitespace?: boolean;
  preserveCase?: boolean;
}

export interface XmlParseResult {
  document: Document;
  contentType: string;
  size: number;
  encoding?: string;
}

export interface XPathQueryResult {
  value: any;
  nodeType: number;
  nodeName?: string;
  textContent?: string;
  attributes?: Record<string, string>;
}

export class XmlContentParser {
  private parser: DOMParser;
  
  constructor() {
    // Configure XML parser with error handling using new API
    this.parser = new DOMParser({
      onError: (msg: string) => {
        logger.error('XML parser error', { message: msg });
        // Don't throw here to allow parsing to continue
      },
      onWarning: (msg: string) => {
        logger.warn('XML parser warning', { message: msg });
      }
    });
  }
  
  /**
   * Parse XML content from string or buffer
   */
  parse(content: string | Buffer, options: XmlParseOptions = {}): XmlParseResult {
    const { strict = true, ignoreWhitespace = true } = options;
    
    try {
      logger.debug('Parsing XML content', {
        type: typeof content,
        size: content.length
      });
      
      let xmlString = content.toString('utf8');
      
      // Remove whitespace between tags if requested
      if (ignoreWhitespace) {
        xmlString = xmlString.replace(/>\s+</g, '><');
      }
      
      // Parse XML document
      const document = this.parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      if (strict) {
        this.validateXmlDocument(document);
      }
      
      // Extract encoding from XML declaration
      const encoding = this.extractEncoding(xmlString);
      
      const result: XmlParseResult = {
        document,
        contentType: 'application/xml',
        size: xmlString.length,
        encoding
      };
      
      logger.debug('XML parsing successful', {
        rootElement: document.documentElement?.tagName,
        encoding
      });
      
      return result;
    } catch (error) {
      logger.error('XML parsing failed', { error: error.message });
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }
  
  /**
   * Query XML document using XPath expressions
   */
  query(
    document: Document,
    xpathExpression: string,
    contextNode?: Node
  ): XPathQueryResult[] {
    try {
      logger.debug('Executing XPath query', { expression: xpathExpression });
      
      const context = contextNode || document;
      const results = xpath.select(xpathExpression, context);
      
      // Handle different result types
      if (!Array.isArray(results)) {
        // Single result (number, string, boolean)
        return [{
          value: results,
          nodeType: 0, // Primitive value
          textContent: String(results)
        }];
      }
      
      // Node results
      const formattedResults: XPathQueryResult[] = results.map(node => {
        if (typeof node === 'object' && 'nodeType' in node) {
          const xmlNode = node as Node;
          return {
            value: xmlNode,
            nodeType: xmlNode.nodeType,
            nodeName: xmlNode.nodeName,
            textContent: xmlNode.textContent || undefined,
            attributes: this.extractAttributes(xmlNode)
          };
        } else {
          // Primitive value
          return {
            value: node,
            nodeType: 0,
            textContent: String(node)
          };
        }
      });
      
      logger.debug('XPath query completed', {
        expression: xpathExpression,
        resultCount: formattedResults.length
      });
      
      return formattedResults;
    } catch (error) {
      logger.error('XPath query failed', { expression: xpathExpression, error: error.message });
      throw new Error(`XPath query failed for expression '${xpathExpression}': ${error.message}`);
    }
  }
  
  /**
   * Extract single value using XPath
   */
  queryValue(document: Document, xpathExpression: string, defaultValue?: any): any {
    try {
      const results = this.query(document, xpathExpression);
      
      if (results.length === 0) {
        return defaultValue;
      }
      
      const firstResult = results[0];
      
      // Return appropriate value based on node type
      if (firstResult.nodeType === 0) {
        // Primitive value
        return firstResult.value;
      } else if (firstResult.nodeType === 3 || firstResult.nodeType === 4) {
        // Text or CDATA node
        return firstResult.textContent;
      } else if (firstResult.nodeType === 2) {
        // Attribute node
        return firstResult.value;
      } else {
        // Element node - return text content or the node itself
        return firstResult.textContent || firstResult.value;
      }
    } catch (error) {
      logger.warn('XPath value extraction failed', { expression: xpathExpression, error: error.message });
      return defaultValue;
    }
  }
  
  /**
   * Check if an XPath expression matches any nodes
   */
  pathExists(document: Document, xpathExpression: string): boolean {
    try {
      const results = this.query(document, xpathExpression);
      return results.length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get all element paths in an XML document
   */
  getAllPaths(
    document: Document,
    options: { includeAttributes?: boolean; maxDepth?: number } = {}
  ): string[] {
    const { includeAttributes = false, maxDepth = 20 } = options;
    const paths: string[] = [];
    
    const traverse = (node: Node, currentPath: string, depth: number) => {
      if (depth > maxDepth) {
        return;
      }
      
      if (node.nodeType === 1) { // Element node
        const elementPath = currentPath ? `${currentPath}/${node.nodeName}` : `/${node.nodeName}`;
        paths.push(elementPath);
        
        // Add attribute paths if requested
        if (includeAttributes && node.attributes) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes.item(i)!;
            paths.push(`${elementPath}/@${attr.name}`);
          }
        }
        
        // Traverse child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes.item(i);
          if (child) {
            traverse(child, elementPath, depth + 1);
          }
        }
      }
    };
    
    if (document.documentElement) {
      traverse(document.documentElement, '', 0);
    }
    
    return paths;
  }
  
  /**
   * Convert XML node to plain object
   */
  nodeToObject(node: Node): any {
    if (node.nodeType === 3 || node.nodeType === 4) {
      // Text or CDATA node
      return node.textContent;
    }
    
    if (node.nodeType === 1) {
      // Element node
      const obj: any = {};
      
      // Add attributes
      if (node.attributes && node.attributes.length > 0) {
        obj['@attributes'] = this.extractAttributes(node);
      }
      
      // Add child nodes
      const children: any = {};
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes.item(i);
        if (child) {
          const childName = child.nodeName;
          const childValue = this.nodeToObject(child);
          
          if (childName === '#text') {
            // Handle text content
            if (typeof childValue === 'string' && childValue.trim()) {
              if (Object.keys(children).length === 0) {
                return childValue; // Return text directly if no other children
              }
              obj['#text'] = childValue;
            }
          } else {
            // Handle element children
            if (children[childName]) {
              // Multiple children with same name - convert to array
              if (!Array.isArray(children[childName])) {
                children[childName] = [children[childName]];
              }
              children[childName].push(childValue);
            } else {
              children[childName] = childValue;
            }
          }
        }
      }
      
      return Object.keys(children).length > 0 ? { ...obj, ...children } : obj;
    }
    
    return null;
  }
  
  /**
   * Validate XPath expression syntax
   */
  validateXPath(xpathExpression: string): { valid: boolean; error?: string } {
    try {
      // Create a minimal XML document for testing
      const testDoc = this.parser.parseFromString('<root></root>', 'text/xml');
      xpath.select(xpathExpression, testDoc);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid XPath syntax'
      };
    }
  }
  
  /**
   * Extract attributes from a node
   */
  private extractAttributes(node: Node): Record<string, string> | undefined {
    if (!node.attributes || node.attributes.length === 0) {
      return undefined;
    }
    
    const attributes: Record<string, string> = {};
    
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes.item(i);
      if (attr) {
        attributes[attr.name] = attr.value;
      }
    }
    
    return attributes;
  }
  
  /**
   * Extract encoding from XML declaration
   */
  private extractEncoding(xmlString: string): string | undefined {
    const encodingMatch = xmlString.match(/encoding=["']([^"']+)["']/i);
    return encodingMatch ? encodingMatch[1] : undefined;
  }
  
  /**
   * Validate XML document for common issues
   */
  private validateXmlDocument(document: Document): void {
    // Check for parser errors
    const parseErrors = document.getElementsByTagName('parsererror');
    if (parseErrors.length > 0) {
      const errorMessage = parseErrors.item(0)?.textContent || 'Unknown parser error';
      throw new Error(`XML parsing error: ${errorMessage}`);
    }
    
    // Check for document element
    if (!document.documentElement) {
      throw new Error('XML document has no root element');
    }
  }
}
