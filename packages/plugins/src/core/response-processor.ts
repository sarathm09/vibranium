/**
 * Response processor for handling HTTP responses
 */

import type { ContentParser } from '@vibraniumjs/types';
import { ContentDetector, JsonContentParser, XmlContentParser, TextContentParser } from '@vibraniumjs/core';

export interface ProcessedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  timing: {
    total: number;
    dns?: number;
    tcp?: number;
    tls?: number;
    request?: number;
    response?: number;
  };
  contentType: string;
  size: number;
  encoding?: string;
}

export class ResponseProcessor {
  private contentDetector: ContentDetector;
  private parsers: Map<string, ContentParser>;

  constructor() {
    this.contentDetector = new ContentDetector();
    this.parsers = new Map();
    
    // Register default parsers
    this.parsers.set('json', new JsonContentParser());
    this.parsers.set('xml', new XmlContentParser());
    this.parsers.set('text', new TextContentParser());
  }

  /**
   * Process HTTP response
   */
  async processResponse(response: any): Promise<ProcessedResponse> {
    const contentType = this.extractContentType(response.headers);
    
    // Convert response body to string/buffer for content detection
    let bodyForDetection = response.body;
    if (response.body && typeof response.body === 'object' && !(response.body instanceof Buffer)) {
      bodyForDetection = JSON.stringify(response.body);
    }
    
    const detection = this.contentDetector.detect(bodyForDetection || '', { contentTypeHeader: contentType });
    const detectedType = detection.detectedType;
    
    // Parse response body
    let parsedBody = response.body;
    const parser = this.parsers.get(detectedType);
    if (parser && response.body) {
      try {
        // If body is already parsed object and we detected JSON, keep it as is
        if (detectedType === 'json' && typeof response.body === 'object') {
          parsedBody = response.body;
        } else {
          parsedBody = await parser.parse(bodyForDetection);
        }
      } catch (error) {
        // Fall back to raw body if parsing fails
        parsedBody = response.body;
      }
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: this.normalizeHeaders(response.headers),
      body: parsedBody,
      timing: response.timing || { total: 0 },
      contentType: detectedType,
      size: this.calculateResponseSize(response.body),
      encoding: this.extractEncoding(response.headers)
    };
  }

  /**
   * Register custom content parser
   */
  registerParser(contentType: string, parser: ContentParser): void {
    this.parsers.set(contentType, parser);
  }

  /**
   * Get available parsers
   */
  getAvailableParsers(): string[] {
    return Array.from(this.parsers.keys());
  }

  /**
   * Extract content type from headers
   */
  private extractContentType(headers: Record<string, any>): string {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    return contentType.split(';')[0].trim().toLowerCase();
  }

  /**
   * Extract encoding from headers
   */
  private extractEncoding(headers: Record<string, any>): string | undefined {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    const match = contentType.match(/charset=([^;]+)/i);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Calculate response size
   */
  private calculateResponseSize(body: any): number {
    if (typeof body === 'string') {
      return Buffer.byteLength(body, 'utf8');
    }
    if (Buffer.isBuffer(body)) {
      return body.length;
    }
    if (body && typeof body === 'object') {
      return Buffer.byteLength(JSON.stringify(body), 'utf8');
    }
    return 0;
  }

  /**
   * Normalize response headers
   */
  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    if (!headers || typeof headers !== 'object') {
      return normalized;
    }
    
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        normalized[key.toLowerCase()] = String(value);
      }
    }
    
    return normalized;
  }

  /**
   * Check if response is successful
   */
  isSuccessful(status: number): boolean {
    return status >= 200 && status < 300;
  }

  /**
   * Check if response is redirect
   */
  isRedirect(status: number): boolean {
    return status >= 300 && status < 400;
  }

  /**
   * Check if response is client error
   */
  isClientError(status: number): boolean {
    return status >= 400 && status < 500;
  }

  /**
   * Check if response is server error
   */
  isServerError(status: number): boolean {
    return status >= 500 && status < 600;
  }

  /**
   * Get status category
   */
  getStatusCategory(status: number): string {
    if (this.isSuccessful(status)) return 'success';
    if (this.isRedirect(status)) return 'redirect';
    if (this.isClientError(status)) return 'client_error';
    if (this.isServerError(status)) return 'server_error';
    return 'unknown';
  }
}