/**
 * Content-type detector and router for automatic parsing
 */

import { logger } from '@vibraniumjs/utils';
import { JsonContentParser } from './json-parser';
import { XmlContentParser } from './xml-parser';
import { TextContentParser } from './text-parser';
import { BinaryContentParser } from './binary-parser';

export interface ContentInfo {
  contentType: string;
  detectedType: 'json' | 'xml' | 'text' | 'binary';
  encoding?: string;
  confidence: number; // 0-1 confidence score
  characteristics: {
    isText: boolean;
    isStructured: boolean;
    hasSchema: boolean;
    isQueryable: boolean;
  };
}

export interface ParseOptions {
  forceType?: 'json' | 'xml' | 'text' | 'binary';
  strictTypeChecking?: boolean;
  contentTypeHeader?: string;
  encoding?: BufferEncoding;
}

export interface ParseResult {
  data: any;
  contentInfo: ContentInfo;
  parser: 'json' | 'xml' | 'text' | 'binary';
  metadata: any;
}

export class ContentDetector {
  private jsonParser = new JsonContentParser();
  private xmlParser = new XmlContentParser();
  private textParser = new TextContentParser();
  private binaryParser = new BinaryContentParser();

  /**
   * Detect content type from buffer or string
   */
  detect(
    content: string | Buffer,
    options: {
      contentTypeHeader?: string;
      filename?: string;
      strictChecking?: boolean;
    } = {}
  ): ContentInfo {
    const { contentTypeHeader, filename, strictChecking = false } = options;
    
    logger.debug('Detecting content type', {
      hasHeader: !!contentTypeHeader,
      hasFilename: !!filename,
      contentLength: content.length
    });
    
    // Start with hints from headers and filename
    let initialGuess = this.getInitialGuess(contentTypeHeader, filename);
    
    // Analyze content structure
    const analysis = this.analyzeContent(content);
    
    // Combine hints with analysis
    const finalDetection = this.combineDetectionResults(initialGuess, analysis, strictChecking);
    
    logger.debug('Content type detected', {
      detectedType: finalDetection.detectedType,
      confidence: finalDetection.confidence,
      contentType: finalDetection.contentType
    });
    
    return finalDetection;
  }
  
  /**
   * Parse content automatically based on detected type
   */
  parseContent(content: string | Buffer, options: ParseOptions = {}): ParseResult {
    const {
      forceType,
      strictTypeChecking = false,
      contentTypeHeader,
      encoding = 'utf8'
    } = options;
    
    try {
      // Detect content type unless forced
      const contentInfo = forceType
        ? this.createForcedContentInfo(forceType)
        : this.detect(content, { contentTypeHeader, strictChecking: strictTypeChecking });
      
      const parserType = forceType || contentInfo.detectedType;
      
      logger.debug('Parsing content', {
        parser: parserType,
        forced: !!forceType,
        confidence: contentInfo.confidence
      });
      
      // Parse using appropriate parser
      let parseResult: any;
      let metadata: any;
      
      switch (parserType) {
        case 'json': {
          const result = this.jsonParser.parse(content.toString(encoding));
          parseResult = result.data;
          metadata = { size: result.size, contentType: result.contentType };
          break;
        }
        
        case 'xml': {
          const result = this.xmlParser.parse(content, { strict: strictTypeChecking });
          parseResult = result.document;
          metadata = {
            size: result.size,
            contentType: result.contentType,
            encoding: result.encoding
          };
          break;
        }
        
        case 'text': {
          const result = this.textParser.parse(content, {
            encoding,
            splitLines: true,
            trimWhitespace: false
          });
          parseResult = result.text;
          metadata = {
            size: result.size,
            contentType: result.contentType,
            metadata: result.metadata,
            lines: result.lines
          };
          break;
        }
        
        case 'binary': {
          const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, encoding);
          const result = this.binaryParser.parse(buffer);
          parseResult = result.buffer;
          metadata = {
            size: result.size,
            contentType: result.contentType,
            metadata: result.metadata
          };
          break;
        }
        
        default:
          throw new Error(`Unsupported parser type: ${parserType}`);
      }
      
      return {
        data: parseResult,
        contentInfo,
        parser: parserType,
        metadata
      };
    } catch (error) {
      logger.error('Content parsing failed', { error: error.message });
      throw new Error(`Content parsing failed: ${error.message}`);
    }
  }
  
  /**
   * Get query capabilities for detected content
   */
  getQueryCapabilities(contentInfo: ContentInfo): {
    jsonPath: boolean;
    xpath: boolean;
    textSearch: boolean;
    binaryOps: boolean;
  } {
    return {
      jsonPath: contentInfo.detectedType === 'json',
      xpath: contentInfo.detectedType === 'xml',
      textSearch: contentInfo.characteristics.isText,
      binaryOps: contentInfo.detectedType === 'binary'
    };
  }
  
  /**
   * Validate content against expected type
   */
  validateContentType(
    content: string | Buffer,
    expectedType: 'json' | 'xml' | 'text' | 'binary'
  ): { valid: boolean; actualType: string; confidence: number; errors: string[] } {
    try {
      const detection = this.detect(content);
      const valid = detection.detectedType === expectedType;
      
      const errors: string[] = [];
      if (!valid) {
        errors.push(
          `Expected ${expectedType} but detected ${detection.detectedType} (confidence: ${detection.confidence})`
        );
      }
      
      return {
        valid,
        actualType: detection.detectedType,
        confidence: detection.confidence,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        actualType: 'unknown',
        confidence: 0,
        errors: [`Content validation failed: ${error.message}`]
      };
    }
  }
  
  /**
   * Get initial guess from headers and filename
   */
  private getInitialGuess(
    contentTypeHeader?: string,
    filename?: string
  ): Partial<ContentInfo> {
    let contentType = 'application/octet-stream';
    let detectedType: ContentInfo['detectedType'] = 'binary';
    let confidence = 0.3; // Low confidence for header-only detection
    
    // Check content-type header
    if (contentTypeHeader) {
      const normalizedHeader = contentTypeHeader.toLowerCase().split(';')[0].trim();
      
      if (normalizedHeader.includes('json')) {
        contentType = 'application/json';
        detectedType = 'json';
        confidence = 0.7;
      } else if (normalizedHeader.includes('xml')) {
        contentType = 'application/xml';
        detectedType = 'xml';
        confidence = 0.7;
      } else if (normalizedHeader.includes('text')) {
        contentType = 'text/plain';
        detectedType = 'text';
        confidence = 0.6;
      }
    }
    
    // Check filename extension
    if (filename) {
      const ext = filename.toLowerCase().split('.').pop();
      
      switch (ext) {
        case 'json':
          detectedType = 'json';
          contentType = 'application/json';
          confidence = Math.max(confidence, 0.8);
          break;
        case 'xml':
        case 'xsl':
        case 'xsd':
          detectedType = 'xml';
          contentType = 'application/xml';
          confidence = Math.max(confidence, 0.8);
          break;
        case 'txt':
        case 'log':
        case 'md':
          detectedType = 'text';
          contentType = 'text/plain';
          confidence = Math.max(confidence, 0.7);
          break;
      }
    }
    
    return { contentType, detectedType, confidence };
  }
  
  /**
   * Analyze content structure to determine type
   */
  private analyzeContent(content: string | Buffer): Partial<ContentInfo> {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    
    // Check if content is text
    const isText = this.binaryParser.isTextContent(buffer);
    
    if (!isText) {
      return {
        detectedType: 'binary',
        contentType: 'application/octet-stream',
        confidence: 0.9,
        characteristics: {
          isText: false,
          isStructured: false,
          hasSchema: false,
          isQueryable: false
        }
      };
    }
    
    const textContent = buffer.toString('utf8').trim();
    
    // Try to detect JSON
    if (this.looksLikeJson(textContent)) {
      return {
        detectedType: 'json',
        contentType: 'application/json',
        confidence: 0.85,
        characteristics: {
          isText: true,
          isStructured: true,
          hasSchema: false,
          isQueryable: true
        }
      };
    }
    
    // Try to detect XML
    if (this.looksLikeXml(textContent)) {
      return {
        detectedType: 'xml',
        contentType: 'application/xml',
        confidence: 0.85,
        characteristics: {
          isText: true,
          isStructured: true,
          hasSchema: true,
          isQueryable: true
        }
      };
    }
    
    // Default to text
    return {
      detectedType: 'text',
      contentType: 'text/plain',
      confidence: 0.8,
      characteristics: {
        isText: true,
        isStructured: false,
        hasSchema: false,
        isQueryable: true
      }
    };
  }
  
  /**
   * Check if content looks like JSON
   */
  private looksLikeJson(content: string): boolean {
    if (!content) return false;
    
    const trimmed = content.trim();
    
    // Quick structural check
    if (!(trimmed.startsWith('{') && trimmed.endsWith('}')) &&
        !(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return false;
    }
    
    // Try to parse
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if content looks like XML
   */
  private looksLikeXml(content: string): boolean {
    if (!content) return false;
    
    const trimmed = content.trim();
    
    // Check for XML declaration or root element
    if (trimmed.startsWith('<?xml') || 
        (trimmed.startsWith('<') && trimmed.includes('>') && trimmed.endsWith('>'))) {
      
      // Simple tag matching check
      const openTags = (trimmed.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (trimmed.match(/<\/[^>]*>/g) || []).length;
      
      // Should have roughly equal open and close tags
      return Math.abs(openTags - closeTags) <= 1;
    }
    
    return false;
  }
  
  /**
   * Combine detection results from hints and analysis
   */
  private combineDetectionResults(
    initial: Partial<ContentInfo>,
    analysis: Partial<ContentInfo>,
    strictChecking: boolean
  ): ContentInfo {
    // In strict mode, analysis takes precedence
    if (strictChecking && analysis.confidence! > 0.7) {
      return {
        contentType: analysis.contentType!,
        detectedType: analysis.detectedType!,
        confidence: analysis.confidence!,
        characteristics: analysis.characteristics!,
        encoding: 'utf8'
      };
    }
    
    // Otherwise, use the one with higher confidence
    const useAnalysis = (analysis.confidence || 0) > (initial.confidence || 0);
    const primary = useAnalysis ? analysis : initial;
    const secondary = useAnalysis ? initial : secondary;
    
    return {
      contentType: primary.contentType || secondary.contentType || 'application/octet-stream',
      detectedType: primary.detectedType || secondary.detectedType || 'binary',
      confidence: Math.max(primary.confidence || 0, secondary.confidence || 0),
      characteristics: primary.characteristics || {
        isText: false,
        isStructured: false,
        hasSchema: false,
        isQueryable: false
      },
      encoding: 'utf8'
    };
  }
  
  /**
   * Create content info for forced type
   */
  private createForcedContentInfo(forcedType: 'json' | 'xml' | 'text' | 'binary'): ContentInfo {
    const typeMap = {
      json: {
        contentType: 'application/json',
        characteristics: { isText: true, isStructured: true, hasSchema: false, isQueryable: true }
      },
      xml: {
        contentType: 'application/xml',
        characteristics: { isText: true, isStructured: true, hasSchema: true, isQueryable: true }
      },
      text: {
        contentType: 'text/plain',
        characteristics: { isText: true, isStructured: false, hasSchema: false, isQueryable: true }
      },
      binary: {
        contentType: 'application/octet-stream',
        characteristics: { isText: false, isStructured: false, hasSchema: false, isQueryable: false }
      }
    };
    
    const config = typeMap[forcedType];
    
    return {
      contentType: config.contentType,
      detectedType: forcedType,
      confidence: 1.0, // Full confidence when forced
      characteristics: config.characteristics,
      encoding: 'utf8'
    };
  }
}
