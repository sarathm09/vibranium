/**
 * HTTP request builder with support for all content types and features
 */

import type { HttpRequest, ExecutionContext } from '@vibraniumjs/types';
import type { ApiStepConfig } from './api-plugin';
import { PluginUtils } from '../base/plugin-utils';

export interface RequestBuildOptions {
  interpolateVariables?: boolean;
  validateUrl?: boolean;
  normalizeHeaders?: boolean;
  autoContentType?: boolean;
}

export class RequestBuilder {
  private defaultOptions: RequestBuildOptions = {
    interpolateVariables: true,
    validateUrl: true,
    normalizeHeaders: true,
    autoContentType: true
  };

  /**
   * Build HTTP request from step configuration
   */
  async buildRequest(
    stepConfig: ApiStepConfig,
    context: ExecutionContext,
    options: RequestBuildOptions = {}
  ): Promise<HttpRequest> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Start with base request
    const request: HttpRequest = {
      method: this.getHttpMethod(stepConfig),
      url: stepConfig.url,
      headers: {},
      data: undefined
    };

    // Interpolate variables if enabled
    if (opts.interpolateVariables) {
      request.url = this.interpolateVariables(request.url, context);
    }

    // Validate URL if enabled
    if (opts.validateUrl && !this.isValidUrl(request.url)) {
      throw new Error(`Invalid URL: ${request.url}`);
    }

    // Build headers
    request.headers = await this.buildHeaders(stepConfig, context, opts);

    // Build query parameters
    if (stepConfig.query) {
      request.url = this.addQueryParameters(request.url, stepConfig.query, context, opts);
    }

    // Build request body
    if (stepConfig.body !== undefined) {
      request.data = await this.buildRequestBody(stepConfig.body, request.headers, context, opts);
    }

    // Set timeout
    if (stepConfig.timeout) {
      request.timeout = stepConfig.timeout;
    }

    return request;
  }

  /**
   * Build request headers
   */
  private async buildHeaders(
    stepConfig: ApiStepConfig,
    context: ExecutionContext,
    options: RequestBuildOptions
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // Add environment headers
    if (context.environment?.headers) {
      Object.assign(headers, context.environment.headers);
    }

    // Add step-specific headers
    if (stepConfig.headers) {
      const stepHeaders = options.interpolateVariables
        ? this.interpolateObjectValues(stepConfig.headers, context)
        : stepConfig.headers;
      Object.assign(headers, stepHeaders);
    }

    // Auto-detect content type if enabled
    if (options.autoContentType && stepConfig.body && !headers['content-type']) {
      headers['content-type'] = this.detectContentType(stepConfig.body);
    }

    // Add default headers
    if (!headers['user-agent']) {
      headers['user-agent'] = 'Vibranium CLI/1.0.0';
    }

    if (!headers['accept']) {
      headers['accept'] = 'application/json, text/plain, */*';
    }

    // Normalize header names if enabled
    if (options.normalizeHeaders) {
      return this.normalizeHeaderNames(headers);
    }

    return headers;
  }

  /**
   * Build request body with content type handling
   */
  private async buildRequestBody(
    body: any,
    headers: Record<string, string>,
    context: ExecutionContext,
    options: RequestBuildOptions
  ): Promise<any> {
    if (body === null || body === undefined) {
      return undefined;
    }

    // Interpolate variables in body if enabled
    const processedBody = options.interpolateVariables
      ? this.interpolateBodyVariables(body, context)
      : body;

    const contentType = this.getContentType(headers);

    switch (contentType) {
      case 'application/json':
        return this.buildJsonBody(processedBody);
      
      case 'application/x-www-form-urlencoded':
        return this.buildFormBody(processedBody);
      
      case 'multipart/form-data':
        return this.buildMultipartBody(processedBody, headers);
      
      case 'application/xml':
      case 'text/xml':
        return this.buildXmlBody(processedBody);
      
      case 'text/plain':
        return this.buildTextBody(processedBody);
      
      default:
        // For unknown content types, return as-is
        return processedBody;
    }
  }

  /**
   * Build JSON request body
   */
  private buildJsonBody(body: any): string {
    if (typeof body === 'string') {
      // Validate that it's valid JSON
      try {
        JSON.parse(body);
        return body;
      } catch {
        throw new Error('Invalid JSON string in request body');
      }
    }
    
    try {
      return JSON.stringify(body);
    } catch (error) {
      throw new Error(`Failed to serialize JSON body: ${error}`);
    }
  }

  /**
   * Build form-encoded request body
   */
  private buildFormBody(body: any): string {
    if (typeof body === 'string') {
      return body;
    }
    
    if (typeof body === 'object' && body !== null) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      return params.toString();
    }
    
    throw new Error('Form body must be an object or string');
  }

  /**
   * Build multipart form data
   */
  private buildMultipartBody(body: any, headers: Record<string, string>): FormData {
    if (typeof body !== 'object' || body === null) {
      throw new Error('Multipart body must be an object');
    }
    
    const formData = new FormData();
    
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        if (this.isFile(value)) {
          formData.append(key, value as File);
        } else if (this.isBuffer(value)) {
          formData.append(key, new Blob([value as Buffer]));
        } else {
          formData.append(key, String(value));
        }
      }
    }
    
    // Remove content-type header to let the browser set it with boundary
    delete headers['content-type'];
    
    return formData;
  }

  /**
   * Build XML request body
   */
  private buildXmlBody(body: any): string {
    if (typeof body === 'string') {
      return body;
    }
    
    if (typeof body === 'object') {
      // Simple XML conversion - in real implementation, use a proper XML library
      return this.objectToXml(body);
    }
    
    throw new Error('XML body must be a string or object');
  }

  /**
   * Build text request body
   */
  private buildTextBody(body: any): string {
    return String(body);
  }

  /**
   * Add query parameters to URL
   */
  private addQueryParameters(
    url: string,
    query: Record<string, any>,
    context: ExecutionContext,
    options: RequestBuildOptions
  ): string {
    const processedQuery = options.interpolateVariables
      ? this.interpolateObjectValues(query, context)
      : query;
    
    const urlObj = new URL(url);
    
    for (const [key, value] of Object.entries(processedQuery)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => urlObj.searchParams.append(key, String(v)));
        } else {
          urlObj.searchParams.set(key, String(value));
        }
      }
    }
    
    return urlObj.toString();
  }

  /**
   * Get HTTP method from step configuration
   */
  private getHttpMethod(stepConfig: ApiStepConfig): string {
    if (stepConfig.method) {
      return stepConfig.method.toUpperCase();
    }
    
    // Infer from step type
    const stepType = (stepConfig as any).type?.toLowerCase();
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    
    if (httpMethods.includes(stepType)) {
      return stepType.toUpperCase();
    }
    
    return 'GET';
  }

  /**
   * Interpolate variables in string
   */
  private interpolateVariables(template: string, context: ExecutionContext): string {
    if (!template || typeof template !== 'string') {
      return template;
    }
    
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      try {
        return this.resolveVariableExpression(expression.trim(), context);
      } catch {
        return match; // Return original if resolution fails
      }
    });
  }

  /**
   * Interpolate variables in object values
   */
  private interpolateObjectValues(obj: Record<string, any>, context: ExecutionContext): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateVariables(value, context);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Interpolate variables in request body (recursive)
   */
  private interpolateBodyVariables(body: any, context: ExecutionContext): any {
    if (typeof body === 'string') {
      return this.interpolateVariables(body, context);
    }
    
    if (Array.isArray(body)) {
      return body.map(item => this.interpolateBodyVariables(item, context));
    }
    
    if (typeof body === 'object' && body !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(body)) {
        result[key] = this.interpolateBodyVariables(value, context);
      }
      return result;
    }
    
    return body;
  }

  /**
   * Resolve variable expression
   */
  private resolveVariableExpression(expression: string, context: ExecutionContext): string {
    // This is a simplified implementation
    // A full implementation would parse expressions like $.env.API_URL, $.random.uuid, etc.
    
    if (expression.startsWith('$.env.')) {
      const varName = expression.replace('$.env.', '');
      return context.environment?.variables?.[varName] || process.env[varName] || '';
    }
    
    if (expression.startsWith('$.global.')) {
      const varName = expression.replace('$.global.', '');
      return context.variables?.[varName] || '';
    }
    
    if (expression.startsWith('$.response.')) {
      const path = expression.replace('$.response.', '');
      return PluginUtils.getNestedValue(context.variables?.response, path) || '';
    }
    
    if (expression.startsWith('$.random.')) {
      // Handle random value generation
      return this.generateRandomValue(expression);
    }
    
    // Direct variable access
    return context.variables?.[expression] || '';
  }

  /**
   * Generate random values
   */
  private generateRandomValue(expression: string): string {
    const randomType = expression.replace('$.random.', '');
    
    switch (randomType) {
      case 'uuid':
        return this.generateUuid();
      case 'email':
        return `test${Date.now()}@example.com`;
      case 'string':
        return Math.random().toString(36).substring(7);
      case 'number':
        return Math.floor(Math.random() * 1000).toString();
      default:
        return Math.random().toString();
    }
  }

  /**
   * Generate UUID
   */
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get content type from headers
   */
  private getContentType(headers: Record<string, string>): string {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    return contentType.split(';')[0].trim().toLowerCase();
  }

  /**
   * Detect content type from body
   */
  private detectContentType(body: any): string {
    if (typeof body === 'string') {
      try {
        JSON.parse(body);
        return 'application/json';
      } catch {
        return 'text/plain';
      }
    }
    
    if (typeof body === 'object' && body !== null) {
      if (this.isFormData(body)) {
        return 'multipart/form-data';
      }
      return 'application/json';
    }
    
    return 'text/plain';
  }

  /**
   * Normalize header names to lowercase
   */
  private normalizeHeaderNames(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value;
    }
    
    return normalized;
  }

  /**
   * Convert object to simple XML
   */
  private objectToXml(obj: any, rootName = 'root'): string {
    const xmlParts = [`<${rootName}>`];
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        xmlParts.push(this.objectToXml(value, key));
      } else {
        xmlParts.push(`<${key}>${value}</${key}>`);
      }
    }
    
    xmlParts.push(`</${rootName}>`);
    return xmlParts.join('');
  }

  /**
   * Check if value is a File
   */
  private isFile(value: any): boolean {
    return typeof File !== 'undefined' && value instanceof File;
  }

  /**
   * Check if value is a Buffer
   */
  private isBuffer(value: any): boolean {
    return Buffer.isBuffer(value);
  }

  /**
   * Check if value is FormData
   */
  private isFormData(value: any): boolean {
    return typeof FormData !== 'undefined' && value instanceof FormData;
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
