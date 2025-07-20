/**
 * JSON reporter for programmatic consumption with enhanced structure
 */

import { ScenarioResult, BatchResult } from '@vibraniumjs/types';
import { ReportData } from '../report-generator';

export interface JsonReportFormat {
  metadata: {
    version: string;
    format: 'vibranium-json-report';
    generatedAt: string;
    vibraniumVersion: string;
    platform: string;
    nodeVersion: string;
  };
  execution: {
    type: 'scenario' | 'batch';
    summary: any;
    results: any;
  };
  environment: any;
  artifacts?: any[];
  configuration?: any;
}

export class JsonReporter {
  generateScenarioReport(data: ReportData): string {
    const result = data.result as ScenarioResult;
    
    const report: JsonReportFormat = {
      metadata: {
        version: '1.0.0',
        format: 'vibranium-json-report',
        generatedAt: data.metadata.generatedAt.toISOString(),
        vibraniumVersion: data.metadata.vibraniumVersion,
        platform: data.metadata.platform,
        nodeVersion: data.metadata.nodeVersion
      },
      execution: {
        type: 'scenario',
        summary: this.createScenarioSummary(result),
        results: this.transformScenarioResult(result, data.options.includeMetadata)
      },
      environment: this.transformEnvironment(result.environment),
      artifacts: data.options.includeArtifacts ? result.artifacts : undefined,
      configuration: data.options.includeMetadata ? result.metadata.config : undefined
    };

    return JSON.stringify(report, null, 2);
  }

  generateBatchReport(data: ReportData): string {
    const result = data.result as BatchResult;
    
    const report: JsonReportFormat = {
      metadata: {
        version: '1.0.0',
        format: 'vibranium-json-report',
        generatedAt: data.metadata.generatedAt.toISOString(),
        vibraniumVersion: data.metadata.vibraniumVersion,
        platform: data.metadata.platform,
        nodeVersion: data.metadata.nodeVersion
      },
      execution: {
        type: 'batch',
        summary: this.createBatchSummary(result),
        results: this.transformBatchResult(result, data.options.includeMetadata)
      },
      environment: {
        name: result.metadata.environment,
        mode: result.metadata.mode
      },
      artifacts: data.options.includeArtifacts ? result.artifacts : undefined,
      configuration: data.options.includeMetadata ? result.metadata.config : undefined
    };

    return JSON.stringify(report, null, 2);
  }

  private createScenarioSummary(result: ScenarioResult) {
    return {
      scenario: {
        name: result.scenario.name,
        description: result.scenario.description,
        version: result.scenario.version
      },
      execution: {
        id: result.id,
        status: result.status,
        startedAt: result.metadata.startedAt.toISOString(),
        endedAt: result.metadata.endedAt?.toISOString(),
        duration: result.summary.duration
      },
      metrics: {
        steps: {
          total: result.summary.totalSteps,
          passed: result.summary.passedSteps,
          failed: result.summary.failedSteps,
          skipped: result.summary.skippedSteps
        },
        assertions: {
          total: result.summary.totalAssertions,
          passed: result.summary.passedAssertions,
          failed: result.summary.failedAssertions
        },
        performance: {
          averageStepDuration: result.summary.averageStepDuration,
          successRate: result.summary.successRate
        }
      },
      error: result.error ? {
        type: result.error.type,
        message: result.error.message,
        code: result.error.code,
        stepName: result.error.stepName,
        suggestions: result.error.suggestions
      } : null
    };
  }

  private createBatchSummary(result: BatchResult) {
    return {
      batch: {
        id: result.id,
        mode: result.metadata.mode,
        environment: result.metadata.environment
      },
      execution: {
        status: result.status,
        startedAt: result.metadata.startedAt.toISOString(),
        endedAt: result.metadata.endedAt?.toISOString(),
        duration: result.summary.duration
      },
      metrics: {
        scenarios: {
          total: result.summary.totalScenarios,
          passed: result.summary.passedScenarios,
          failed: result.summary.failedScenarios,
          skipped: result.summary.skippedScenarios
        },
        steps: {
          total: result.summary.totalSteps,
          passed: result.summary.passedSteps,
          failed: result.summary.failedSteps
        },
        performance: {
          successRate: result.summary.successRate
        }
      }
    };
  }

  private transformScenarioResult(result: ScenarioResult, includeMetadata: boolean = false) {
    return {
      scenario: {
        name: result.scenario.name,
        description: result.scenario.description,
        version: result.scenario.version,
        steps: result.scenario.steps.map(step => ({
          name: step.name,
          type: step.type,
          description: step.description,
          skip: step.skip,
          timeout: step.timeout,
          retries: step.retries,
          metadata: includeMetadata ? step.metadata : undefined
        }))
      },
      steps: result.stepResults.map(stepResult => this.transformStepResult(stepResult, includeMetadata)),
      validations: result.validationResults.map(validation => ({
        operator: validation.operator,
        expected: validation.expected,
        actual: validation.actual,
        passed: validation.passed,
        message: validation.message,
        path: validation.path
      })),
      variables: includeMetadata ? {} : undefined, // Variables would be included here
      resources: includeMetadata ? result.resources : undefined
    };
  }

  private transformBatchResult(result: BatchResult, includeMetadata: boolean = false) {
    return {
      scenarios: result.scenarioResults.map(scenarioResult => ({
        id: scenarioResult.id,
        name: scenarioResult.scenario.name,
        status: scenarioResult.status,
        duration: scenarioResult.summary.duration,
        summary: {
          totalSteps: scenarioResult.summary.totalSteps,
          passedSteps: scenarioResult.summary.passedSteps,
          failedSteps: scenarioResult.summary.failedSteps,
          skippedSteps: scenarioResult.summary.skippedSteps,
          successRate: scenarioResult.summary.successRate
        },
        error: scenarioResult.error ? {
          type: scenarioResult.error.type,
          message: scenarioResult.error.message,
          stepName: scenarioResult.error.stepName
        } : null,
        steps: includeMetadata ? scenarioResult.stepResults.map(step => 
          this.transformStepResult(step, includeMetadata)
        ) : undefined
      })),
      configuration: includeMetadata ? {} : undefined // Configuration would be included here
    };
  }

  private transformStepResult(stepResult: any, includeMetadata: boolean = false) {
    const transformed: any = {
      step: {
        name: stepResult.step.name,
        type: stepResult.step.type,
        description: stepResult.step.description
      },
      execution: {
        status: stepResult.status,
        startTime: stepResult.startTime?.toISOString(),
        endTime: stepResult.endTime?.toISOString(),
        duration: stepResult.duration
      },
      validations: stepResult.validationResults?.map((validation: any) => ({
        operator: validation.operator,
        expected: validation.expected,
        actual: validation.actual,
        passed: validation.passed,
        message: validation.message,
        path: validation.path
      })) || [],
      error: stepResult.error ? {
        message: stepResult.error.message,
        stack: includeMetadata ? stepResult.error.stack : undefined,
        type: stepResult.error.type,
        code: stepResult.error.code
      } : null
    };

    // Include request/response data if available
    if (stepResult.request) {
      transformed.request = this.sanitizeRequestData(stepResult.request, includeMetadata);
    }

    if (stepResult.response) {
      transformed.response = this.sanitizeResponseData(stepResult.response, includeMetadata);
    }

    // Include logs if metadata is requested
    if (includeMetadata && stepResult.logs) {
      transformed.logs = stepResult.logs;
    }

    // Include screenshots and artifacts
    if (stepResult.screenshots) {
      transformed.screenshots = stepResult.screenshots;
    }

    if (includeMetadata && stepResult.metadata) {
      transformed.metadata = stepResult.metadata;
    }

    return transformed;
  }

  private transformEnvironment(environment: any) {
    return {
      name: environment.name,
      baseUrl: environment.baseUrl,
      timeout: environment.timeout,
      retries: environment.retries,
      variables: environment.variables,
      headers: environment.headers
    };
  }

  private sanitizeRequestData(request: any, includeMetadata: boolean = false) {
    const sanitized: any = {
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body)
    };

    if (includeMetadata) {
      sanitized.timestamp = request.timestamp;
      sanitized.timeout = request.timeout;
      sanitized.retries = request.retries;
    }

    return sanitized;
  }

  private sanitizeResponseData(response: any, includeMetadata: boolean = false) {
    const sanitized: any = {
      status: response.status,
      statusText: response.statusText,
      headers: this.sanitizeHeaders(response.headers),
      body: this.sanitizeBody(response.body)
    };

    if (includeMetadata) {
      sanitized.timestamp = response.timestamp;
      sanitized.duration = response.duration;
      sanitized.size = response.size;
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token'
    ];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    
    try {
      // If it's a string, try to parse it
      const parsed = typeof body === 'string' ? JSON.parse(body) : body;
      
      // If it's an object, sanitize sensitive fields
      if (typeof parsed === 'object' && parsed !== null) {
        return this.sanitizeObject(parsed);
      }
      
      return parsed;
    } catch (error) {
      // If parsing fails, return the original body
      return body;
    }
  }

  private sanitizeObject(obj: any): any {
    const sanitized = { ...obj };
    
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'apikey',
      'api_key'
    ];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      }
    }
    
    return sanitized;
  }
}