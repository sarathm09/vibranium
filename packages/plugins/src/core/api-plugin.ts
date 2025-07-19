/**
 * Core API plugin for HTTP step implementation
 */

import type { Step, StepResult, ExecutionContext, ValidationResult } from '@vibraniumjs/types';
import { BasePlugin } from '../base/base-plugin';
import { HttpExecutor } from './http-executor';
import { RequestBuilder } from './request-builder';
import { ResponseProcessor } from './response-processor';
import { AuthHandlers } from './auth-handlers';
import { PluginUtils } from '../base/plugin-utils';

export interface ApiStepConfig {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  timeout?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey' | 'custom';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    keyName?: string;
    location?: 'header' | 'query';
    headers?: Record<string, string>;
  };
  options?: {
    followRedirects?: boolean;
    validateSsl?: boolean;
    encoding?: string;
    compress?: boolean;
    retry?: {
      count: number;
      delay: number;
    };
  };
  expect?: Array<{
    identifier: string;
    operator: string;
    expected: any;
    message?: string;
  }>;
}

export interface ApiStepData {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
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
  };
  validation?: {
    passed: boolean;
    results: ValidationResult[];
  };
}

export class CoreApiPlugin extends BasePlugin {
  readonly metadata = {
    name: 'core-api',
    version: '1.0.0',
    description: 'Core API plugin for HTTP request execution',
    author: 'Vibranium Team',
    category: 'http' as const,
    vibraniumVersion: '^1.0.0'
  };

  readonly stepTypes = ['api', 'http', 'get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

  readonly capabilities = {
    async: true,
    parallel: true,
    caching: false,
    retries: true,
    validation: true,
    contentTypes: ['json', 'xml', 'text', 'form', 'multipart', 'binary'],
    customOperators: ['http-status', 'content-type', 'response-time', 'json-path']
  };

  private httpExecutor: HttpExecutor;
  private requestBuilder: RequestBuilder;
  private responseProcessor: ResponseProcessor;
  private authHandlers: AuthHandlers;

  constructor() {
    super({
      timeout: 30000,
      retries: 2,
      retryDelay: 1000,
      enableMetrics: true,
      enableLogging: true
    });

    this.httpExecutor = new HttpExecutor();
    this.requestBuilder = new RequestBuilder();
    this.responseProcessor = new ResponseProcessor();
    this.authHandlers = new AuthHandlers();
  }

  /**
   * Initialize plugin
   */
  protected async doInit(): Promise<void> {
    await this.httpExecutor.initialize();
    this.log('info', 'Core API plugin initialized with HTTP client');
  }

  /**
   * Execute API step
   */
  protected async doExecuteStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    const startTime = Date.now();
    const stepConfig = step as ApiStepConfig;
    
    try {
      // Build HTTP request
      const request = await this.requestBuilder.buildRequest(stepConfig, context);
      
      // Apply authentication
      if (stepConfig.auth) {
        await this.authHandlers.applyAuth(request, stepConfig.auth);
      }
      
      // Execute HTTP request
      const response = await this.httpExecutor.executeRequest(request, stepConfig.options);
      
      // Process response
      const processedResponse = await this.responseProcessor.processResponse(response);
      
      // Validate response
      let validationResults: ValidationResult[] = [];
      if (stepConfig.expect) {
        validationResults = await this.validateResponse(processedResponse, stepConfig.expect);
      }
      
      // Create step data
      const stepData: ApiStepData = {
        request: {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body
        },
        response: processedResponse,
        validation: {
          passed: validationResults.length === 0 || validationResults.every(r => r.passed),
          results: validationResults
        }
      };
      
      // Update execution context with response data
      this.updateExecutionContext(context, stepData);
      
      // Determine step status
      const hasFailed = validationResults.some(r => !r.passed);
      const status = hasFailed ? 'failed' : 'passed';
      
      return this.createSuccessResult(step, stepData, startTime, [
        `HTTP ${request.method} ${request.url}`,
        `Response: ${processedResponse.status} ${processedResponse.statusText}`,
        `Duration: ${PluginUtils.formatDuration(Date.now() - startTime)}`,
        ...(validationResults.length > 0 ? [`Validations: ${validationResults.filter(r => r.passed).length}/${validationResults.length} passed`] : [])
      ]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `API step execution failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Validate step configuration
   */
  validateStep(step: Step): ValidationResult {
    const stepConfig = step as ApiStepConfig;
    
    const validationRules = [
      {
        field: 'url',
        required: true,
        type: 'string' as const,
        validator: (url: string) => this.isValidUrl(url),
        message: 'URL must be a valid HTTP/HTTPS URL'
      },
      {
        field: 'method',
        type: 'string' as const,
        validator: (method: string) => {
          if (!method) return true; // Optional field
          const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
          return validMethods.includes(method.toUpperCase());
        },
        message: 'Method must be a valid HTTP method'
      },
      {
        field: 'headers',
        type: 'object' as const,
        message: 'Headers must be an object'
      },
      {
        field: 'auth',
        type: 'object' as const,
        validator: (auth: any) => {
          if (!auth) return true;
          const validTypes = ['bearer', 'basic', 'apikey', 'custom'];
          return validTypes.includes(auth.type);
        },
        message: 'Auth type must be one of: bearer, basic, apikey, custom'
      }
    ];
    
    const errors = PluginUtils.validateStep(step, validationRules);
    
    if (errors.length > 0) {
      return {
        passed: false,
        message: errors.join('; '),
        operator: 'schema',
        path: 'step'
      };
    }
    
    return {
      passed: true,
      message: 'API step configuration is valid',
      operator: 'schema'
    };
  }

  /**
   * Before step hook
   */
  async beforeStep(step: Step, context: ExecutionContext): Promise<void> {
    await super.beforeStep?.(step, context);
    
    const stepConfig = step as ApiStepConfig;
    const method = this.getHttpMethod(stepConfig);
    const url = stepConfig.url;
    
    this.log('info', `Executing ${method} ${url}`);
    
    // Call lifecycle hook if configured
    const lifecycleHooks = context.scenario?.lifecycle;
    if (lifecycleHooks?.beforeApi) {
      try {
        // This would execute the lifecycle hook - implementation depends on how hooks are processed
        this.log('debug', 'Executing beforeApi lifecycle hook');
      } catch (error) {
        this.log('warn', 'beforeApi lifecycle hook failed:', error);
      }
    }
  }

  /**
   * After step hook
   */
  async afterStep(step: Step, result: StepResult, context: ExecutionContext): Promise<void> {
    await super.afterStep?.(step, result, context);
    
    const stepData = result.data as ApiStepData;
    if (stepData?.response) {
      this.log('info', 
        `Response: ${stepData.response.status} ${stepData.response.statusText} ` +
        `(${PluginUtils.formatDuration(stepData.response.timing.total)})`
      );
    }
    
    // Call lifecycle hook if configured
    const lifecycleHooks = context.scenario?.lifecycle;
    if (lifecycleHooks?.afterApi) {
      try {
        this.log('debug', 'Executing afterApi lifecycle hook');
      } catch (error) {
        this.log('warn', 'afterApi lifecycle hook failed:', error);
      }
    }
  }

  /**
   * Check if plugin supports authentication type
   */
  supportsAuth(authType: string): boolean {
    return this.authHandlers.supportsAuthType(authType);
  }

  /**
   * Check if plugin supports content type
   */
  supportsContentType(contentType: string): boolean {
    const supportedTypes = ['json', 'xml', 'text', 'form', 'multipart', 'binary'];
    return supportedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Get custom validation operators
   */
  getCustomOperators(): Record<string, Function> {
    return {
      'http-status': (actual: number, expected: number | number[]) => {
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        return actual === expected;
      },
      'content-type': (actual: string, expected: string) => {
        return actual.toLowerCase().includes(expected.toLowerCase());
      },
      'response-time': (actual: number, expected: number) => {
        return actual <= expected;
      },
      'json-path': (response: any, path: string) => {
        return PluginUtils.getNestedValue(response.body, path) !== undefined;
      }
    };
  }

  /**
   * Validate response against expect blocks
   */
  private async validateResponse(response: any, expectations: any[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const expectation of expectations) {
      try {
        const actual = this.extractValueFromResponse(response, expectation.identifier);
        const result = this.validateExpectation(actual, expectation);
        results.push(result);
      } catch (error) {
        results.push({
          passed: false,
          message: `Validation error: ${error}`,
          operator: expectation.operator,
          path: expectation.identifier
        });
      }
    }
    
    return results;
  }

  /**
   * Extract value from response using identifier
   */
  private extractValueFromResponse(response: any, identifier: string): any {
    // Handle $.response.* paths
    if (identifier.startsWith('$.response.')) {
      const path = identifier.replace('$.response.', '');
      return PluginUtils.getNestedValue(response, path);
    }
    
    // Direct property access
    return PluginUtils.getNestedValue(response, identifier);
  }

  /**
   * Validate single expectation
   */
  private validateExpectation(actual: any, expectation: any): ValidationResult {
    const { operator, expected, message } = expectation;
    
    let passed = false;
    let resultMessage = message || `Expected ${actual} to ${operator} ${expected}`;
    
    switch (operator) {
      case 'equals':
        passed = actual === expected;
        break;
      case 'contains':
        passed = String(actual).includes(String(expected));
        break;
      case 'gt':
        passed = Number(actual) > Number(expected);
        break;
      case 'lt':
        passed = Number(actual) < Number(expected);
        break;
      case 'exists':
        passed = actual !== undefined && actual !== null;
        break;
      case 'in':
        passed = Array.isArray(expected) && expected.includes(actual);
        break;
      case 'regex':
        passed = new RegExp(expected).test(String(actual));
        break;
      case 'type':
        passed = typeof actual === expected;
        break;
      case 'length':
        passed = (actual?.length || 0) === expected;
        break;
      default:
        passed = false;
        resultMessage = `Unknown operator: ${operator}`;
    }
    
    return {
      passed,
      message: resultMessage,
      operator,
      expected,
      actual,
      path: expectation.identifier
    };
  }

  /**
   * Update execution context with response data
   */
  private updateExecutionContext(context: ExecutionContext, stepData: ApiStepData): void {
    // Update context variables
    context.variables = {
      ...context.variables,
      response: stepData.response,
      request: stepData.request
    };
  }

  /**
   * Get HTTP method from step configuration
   */
  private getHttpMethod(stepConfig: ApiStepConfig): string {
    // Explicit method in config
    if (stepConfig.method) {
      return stepConfig.method.toUpperCase();
    }
    
    // Infer from step type
    const stepType = (stepConfig as any).type?.toLowerCase();
    if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(stepType)) {
      return stepType.toUpperCase();
    }
    
    // Default to GET
    return 'GET';
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
