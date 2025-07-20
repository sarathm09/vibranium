/**
 * JUnit XML reporter for CI/CD integration with enhanced features
 */

import { ScenarioResult, BatchResult } from '@vibraniumjs/types';
import { ReportData } from '../report-generator';

export class JunitReporter {
  generateScenarioReport(data: ReportData): string {
    const result = data.result as ScenarioResult;
    
    const testSuite = this.createTestSuite(result, data);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
${testSuite}
</testsuites>`;
  }

  generateBatchReport(data: ReportData): string {
    const result = data.result as BatchResult;
    
    let testSuites = '';
    for (const scenarioResult of result.scenarioResults) {
      testSuites += this.createTestSuite(scenarioResult, data);
    }
    
    const batchStats = this.calculateBatchStats(result);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Vibranium Batch Execution" 
           tests="${batchStats.tests}" 
           failures="${batchStats.failures}" 
           errors="${batchStats.errors}" 
           skipped="${batchStats.skipped}" 
           time="${(result.summary.duration / 1000).toFixed(3)}"
           timestamp="${result.metadata.startedAt.toISOString()}"
           hostname="${data.metadata.platform}">
${testSuites}
</testsuites>`;
  }

  private createTestSuite(result: ScenarioResult, data: ReportData): string {
    const suiteStats = this.calculateSuiteStats(result);
    
    let testCases = '';
    for (const stepResult of result.stepResults) {
      testCases += this.createTestCase(stepResult, result, data);
    }
    
    // Add system properties if metadata is included
    let systemProperties = '';
    if (data.options.includeMetadata) {
      systemProperties = this.createSystemProperties(result, data);
    }
    
    // Add error details if the scenario failed
    let errorElement = '';
    if (result.error) {
      errorElement = `
    <error type="${this.escapeXml(result.error.type)}" 
           message="${this.escapeXml(result.error.message)}">
      ${this.escapeXml(result.error.stack || result.error.message)}
    </error>`;
    }
    
    return `
  <testsuite name="${this.escapeXml(result.scenario.name)}" 
             package="${this.escapeXml(result.environment.name)}"
             tests="${suiteStats.tests}" 
             failures="${suiteStats.failures}" 
             errors="${suiteStats.errors}" 
             skipped="${suiteStats.skipped}" 
             time="${(result.summary.duration / 1000).toFixed(3)}"
             timestamp="${result.metadata.startedAt.toISOString()}"
             hostname="${data.metadata.platform}">
${systemProperties}${testCases}${errorElement}
  </testsuite>`;
  }

  private createTestCase(stepResult: any, scenarioResult: ScenarioResult, data: ReportData): string {
    const testName = this.escapeXml(stepResult.step.name);
    const className = this.escapeXml(`${scenarioResult.scenario.name}.${stepResult.step.type}`);
    const duration = (stepResult.duration || 0) / 1000;
    
    let testCaseContent = '';
    
    // Handle different step statuses
    switch (stepResult.status) {
      case 'failed':
        const errorMessage = stepResult.error?.message || 'Step failed';
        const errorType = stepResult.error?.type || 'StepFailure';
        
        testCaseContent = `
      <failure type="${this.escapeXml(errorType)}" 
               message="${this.escapeXml(errorMessage)}">
        ${this.createFailureContent(stepResult)}
      </failure>`;
        break;
        
      case 'error':
        const systemErrorMessage = stepResult.error?.message || 'System error';
        const systemErrorType = stepResult.error?.type || 'SystemError';
        
        testCaseContent = `
      <error type="${this.escapeXml(systemErrorType)}" 
             message="${this.escapeXml(systemErrorMessage)}">
        ${this.createErrorContent(stepResult)}
      </error>`;
        break;
        
      case 'skipped':
        const skipReason = typeof stepResult.step.skip === 'string' ? 
          stepResult.step.skip : 'Step was skipped';
        
        testCaseContent = `
      <skipped message="${this.escapeXml(skipReason)}"/>`;
        break;
        
      case 'passed':
        // Add system output for passed tests if verbose
        if (data.options.includeMetadata) {
          testCaseContent = this.createSystemOutput(stepResult);
        }
        break;
    }
    
    // Add properties for this test case
    let properties = '';
    if (data.options.includeMetadata) {
      properties = this.createTestCaseProperties(stepResult);
    }
    
    return `
    <testcase name="${testName}" 
              classname="${className}" 
              time="${duration.toFixed(3)}"
              ${stepResult.step.description ? `description="${this.escapeXml(stepResult.step.description)}"` : ''}>
${properties}${testCaseContent}
    </testcase>`;
  }

  private createFailureContent(stepResult: any): string {
    let content = this.escapeXml(stepResult.error?.message || 'Step failed');
    
    // Add validation failures
    if (stepResult.validationResults) {
      const failedValidations = stepResult.validationResults.filter((v: any) => !v.passed);
      if (failedValidations.length > 0) {
        content += '\n\nValidation Failures:\n';
        for (const validation of failedValidations) {
          content += `- ${validation.operator}: ${validation.message}\n`;
          content += `  Expected: ${JSON.stringify(validation.expected)}\n`;
          content += `  Actual: ${JSON.stringify(validation.actual)}\n`;
        }
      }
    }
    
    // Add error stack if available
    if (stepResult.error?.stack) {
      content += '\n\nStack Trace:\n' + this.escapeXml(stepResult.error.stack);
    }
    
    // Add request/response details for API failures
    if (stepResult.request || stepResult.response) {
      content += '\n\nRequest/Response Details:\n';
      if (stepResult.request) {
        content += `Request: ${stepResult.request.method || 'GET'} ${stepResult.request.url || 'N/A'}\n`;
      }
      if (stepResult.response) {
        content += `Response: ${stepResult.response.status || 'N/A'} ${stepResult.response.statusText || ''}\n`;
      }
    }
    
    return content;
  }

  private createErrorContent(stepResult: any): string {
    let content = this.escapeXml(stepResult.error?.message || 'System error occurred');
    
    if (stepResult.error?.stack) {
      content += '\n\nStack Trace:\n' + this.escapeXml(stepResult.error.stack);
    }
    
    if (stepResult.error?.context) {
      content += '\n\nError Context:\n' + this.escapeXml(JSON.stringify(stepResult.error.context, null, 2));
    }
    
    return content;
  }

  private createSystemOutput(stepResult: any): string {
    if (!stepResult.logs && !stepResult.request && !stepResult.response) {
      return '';
    }
    
    let output = '';
    
    if (stepResult.logs && stepResult.logs.length > 0) {
      output += stepResult.logs.join('\n');
    }
    
    if (stepResult.request) {
      output += `\nRequest: ${stepResult.request.method || 'GET'} ${stepResult.request.url || 'N/A'}`;
    }
    
    if (stepResult.response) {
      output += `\nResponse: ${stepResult.response.status || 'N/A'} ${stepResult.response.statusText || ''}`;
    }
    
    if (output) {
      return `
      <system-out>${this.escapeXml(output)}</system-out>`;
    }
    
    return '';
  }

  private createSystemProperties(result: ScenarioResult, data: ReportData): string {
    return `
    <properties>
      <property name="vibranium.version" value="${data.metadata.vibraniumVersion}"/>
      <property name="vibranium.platform" value="${data.metadata.platform}"/>
      <property name="vibranium.nodeVersion" value="${data.metadata.nodeVersion}"/>
      <property name="scenario.name" value="${this.escapeXml(result.scenario.name)}"/>
      <property name="scenario.version" value="${result.scenario.version || 'N/A'}"/>
      <property name="environment.name" value="${this.escapeXml(result.environment.name)}"/>
      <property name="environment.baseUrl" value="${result.environment.baseUrl || 'N/A'}"/>
      <property name="execution.id" value="${result.id}"/>
      <property name="execution.startedAt" value="${result.metadata.startedAt.toISOString()}"/>
      <property name="execution.endedAt" value="${result.metadata.endedAt?.toISOString() || 'N/A'}"/>
      <property name="execution.successRate" value="${result.summary.successRate.toFixed(2)}"/>
      <property name="execution.averageStepDuration" value="${result.summary.averageStepDuration}"/>
    </properties>`;
  }

  private createTestCaseProperties(stepResult: any): string {
    let properties = `
      <properties>
        <property name="step.type" value="${this.escapeXml(stepResult.step.type)}"/>`;
    
    if (stepResult.step.timeout) {
      properties += `
        <property name="step.timeout" value="${stepResult.step.timeout}"/>`;
    }
    
    if (stepResult.step.retries) {
      properties += `
        <property name="step.retries" value="${stepResult.step.retries}"/>`;
    }
    
    if (stepResult.startTime) {
      properties += `
        <property name="step.startTime" value="${stepResult.startTime.toISOString()}"/>`;
    }
    
    if (stepResult.endTime) {
      properties += `
        <property name="step.endTime" value="${stepResult.endTime.toISOString()}"/>`;
    }
    
    // Add validation counts
    if (stepResult.validationResults) {
      const totalValidations = stepResult.validationResults.length;
      const passedValidations = stepResult.validationResults.filter((v: any) => v.passed).length;
      const failedValidations = totalValidations - passedValidations;
      
      properties += `
        <property name="validations.total" value="${totalValidations}"/>
        <property name="validations.passed" value="${passedValidations}"/>
        <property name="validations.failed" value="${failedValidations}"/>`;
    }
    
    // Add request method and URL for API steps
    if (stepResult.request) {
      properties += `
        <property name="request.method" value="${stepResult.request.method || 'N/A'}"/>
        <property name="request.url" value="${this.escapeXml(stepResult.request.url || 'N/A')}"/>`;
    }
    
    if (stepResult.response) {
      properties += `
        <property name="response.status" value="${stepResult.response.status || 'N/A'}"/>
        <property name="response.statusText" value="${this.escapeXml(stepResult.response.statusText || '')}"/>`;
    }
    
    properties += `
      </properties>`;
    
    return properties;
  }

  private calculateSuiteStats(result: ScenarioResult) {
    let tests = 0;
    let failures = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const stepResult of result.stepResults) {
      tests++;
      switch (stepResult.status) {
        case 'failed':
          failures++;
          break;
        // case 'error':
        //   errors++;
        //   break;
        default:
          if (stepResult.status === 'error') {
            errors++;
          }
          break;
        case 'skipped':
          skipped++;
          break;
      }
    }
    
    return { tests, failures, errors, skipped };
  }

  private calculateBatchStats(result: BatchResult) {
    let tests = 0;
    let failures = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const scenarioResult of result.scenarioResults) {
      const suiteStats = this.calculateSuiteStats(scenarioResult);
      tests += suiteStats.tests;
      failures += suiteStats.failures;
      errors += suiteStats.errors;
      skipped += suiteStats.skipped;
    }
    
    return { tests, failures, errors, skipped };
  }

  private escapeXml(text: string): string {
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }
}