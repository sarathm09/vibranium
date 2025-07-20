/**
 * HTML reporter for web viewing with enhanced features
 */

import { ScenarioResult, BatchResult } from '@vibraniumjs/types';
import { ReportData } from '../report-generator';

export class HtmlReporter {
  generateScenarioReport(data: ReportData): string {
    const result = data.result as ScenarioResult;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vibranium Test Report - ${this.escapeHtml(result.scenario.name)}</title>
    <style>
        ${this.getReportStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.generateHeader(result, data)}
        ${this.generateSummarySection(result)}
        ${this.generateStepsSection(result)}
        ${this.generateMetadataSection(result, data)}
        ${this.generateArtifactsSection(result)}
    </div>
    <script>
        ${this.getReportScript()}
    </script>
</body>
</html>`;
  }

  generateBatchReport(data: ReportData): string {
    const result = data.result as BatchResult;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vibranium Batch Test Report</title>
    <style>
        ${this.getReportStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.generateBatchHeader(result, data)}
        ${this.generateBatchSummarySection(result)}
        ${this.generateScenariosSection(result)}
        ${this.generateBatchMetadataSection(result, data)}
    </div>
    <script>
        ${this.getReportScript()}
    </script>
</body>
</html>`;
  }

  private generateHeader(result: ScenarioResult, data: ReportData): string {
    const statusClass = this.getStatusClass(result.status);
    const duration = this.formatDuration(result.summary.duration);
    
    return `
    <header class="report-header">
        <div class="header-content">
            <h1>Vibranium Test Report</h1>
            <div class="scenario-info">
                <h2>${this.escapeHtml(result.scenario.name)}</h2>
                ${result.scenario.description ? `<p class="description">${this.escapeHtml(result.scenario.description)}</p>` : ''}
                <div class="status-badge ${statusClass}">${result.status.toUpperCase()}</div>
                <div class="duration">Duration: ${duration}</div>
            </div>
        </div>
        <div class="report-meta">
            <span>Generated: ${data.metadata.generatedAt.toLocaleString()}</span>
            <span>Vibranium v${data.metadata.vibraniumVersion}</span>
        </div>
    </header>`;
  }

  private generateBatchHeader(result: BatchResult, data: ReportData): string {
    const statusClass = this.getStatusClass(result.status);
    const duration = this.formatDuration(result.summary.duration);
    
    return `
    <header class="report-header">
        <div class="header-content">
            <h1>Vibranium Batch Test Report</h1>
            <div class="batch-info">
                <div class="status-badge ${statusClass}">${result.status.toUpperCase()}</div>
                <div class="duration">Total Duration: ${duration}</div>
                <div class="mode">Mode: ${result.metadata.mode}</div>
            </div>
        </div>
        <div class="report-meta">
            <span>Generated: ${data.metadata.generatedAt.toLocaleString()}</span>
            <span>Vibranium v${data.metadata.vibraniumVersion}</span>
        </div>
    </header>`;
  }

  private generateSummarySection(result: ScenarioResult): string {
    const summary = result.summary;
    const successRate = summary.successRate.toFixed(1);
    
    return `
    <section class="summary-section">
        <h3>Summary</h3>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">${summary.totalSteps}</div>
                <div class="summary-label">Total Steps</div>
            </div>
            <div class="summary-card passed">
                <div class="summary-value">${summary.passedSteps}</div>
                <div class="summary-label">Passed</div>
            </div>
            <div class="summary-card failed">
                <div class="summary-value">${summary.failedSteps}</div>
                <div class="summary-label">Failed</div>
            </div>
            <div class="summary-card skipped">
                <div class="summary-value">${summary.skippedSteps}</div>
                <div class="summary-label">Skipped</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${successRate}%</div>
                <div class="summary-label">Success Rate</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${this.formatDuration(summary.averageStepDuration)}</div>
                <div class="summary-label">Avg Step Duration</div>
            </div>
        </div>
    </section>`;
  }

  private generateBatchSummarySection(result: BatchResult): string {
    const summary = result.summary;
    const successRate = summary.successRate.toFixed(1);
    
    return `
    <section class="summary-section">
        <h3>Batch Summary</h3>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">${summary.totalScenarios}</div>
                <div class="summary-label">Total Scenarios</div>
            </div>
            <div class="summary-card passed">
                <div class="summary-value">${summary.passedScenarios}</div>
                <div class="summary-label">Passed</div>
            </div>
            <div class="summary-card failed">
                <div class="summary-value">${summary.failedScenarios}</div>
                <div class="summary-label">Failed</div>
            </div>
            <div class="summary-card skipped">
                <div class="summary-value">${summary.skippedScenarios}</div>
                <div class="summary-label">Skipped</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${successRate}%</div>
                <div class="summary-label">Success Rate</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${summary.totalSteps}</div>
                <div class="summary-label">Total Steps</div>
            </div>
        </div>
    </section>`;
  }

  private generateStepsSection(result: ScenarioResult): string {
    let stepsHtml = `
    <section class="steps-section">
        <h3>Step Results</h3>
        <div class="steps-container">`;

    for (const stepResult of result.stepResults) {
      const statusClass = this.getStatusClass(stepResult.status);
      const duration = stepResult.metadata?.duration ? 
        this.formatDuration(stepResult.metadata.duration) : 'N/A';
      
      stepsHtml += `
      <div class="step-card ${statusClass}" onclick="toggleStepDetails('${stepResult.step.name}')">
          <div class="step-header">
              <div class="step-name">${this.escapeHtml(stepResult.step.name)}</div>
              <div class="step-status ${statusClass}">${stepResult.status.toUpperCase()}</div>
              <div class="step-duration">${duration}</div>
          </div>
          ${stepResult.step.description ? `<div class="step-description">${this.escapeHtml(stepResult.step.description)}</div>` : ''}
          
          <div class="step-details" id="details-${stepResult.step.name}" style="display: none;">
              ${this.generateStepDetails(stepResult)}
          </div>
      </div>`;
    }

    stepsHtml += `
        </div>
    </section>`;

    return stepsHtml;
  }

  private generateScenariosSection(result: BatchResult): string {
    let scenariosHtml = `
    <section class="scenarios-section">
        <h3>Scenario Results</h3>
        <div class="scenarios-container">`;

    for (const scenarioResult of result.scenarioResults) {
      const statusClass = this.getStatusClass(scenarioResult.status);
      const duration = this.formatDuration(scenarioResult.summary.duration);
      
      scenariosHtml += `
      <div class="scenario-card ${statusClass}" onclick="toggleScenarioDetails('${scenarioResult.id}')">
          <div class="scenario-header">
              <div class="scenario-name">${this.escapeHtml(scenarioResult.scenario.name)}</div>
              <div class="scenario-status ${statusClass}">${scenarioResult.status.toUpperCase()}</div>
              <div class="scenario-duration">${duration}</div>
          </div>
          <div class="scenario-summary">
              Steps: ${scenarioResult.summary.totalSteps}, 
              Passed: ${scenarioResult.summary.passedSteps}, 
              Failed: ${scenarioResult.summary.failedSteps}
          </div>
          
          <div class="scenario-details" id="scenario-details-${scenarioResult.id}" style="display: none;">
              ${this.generateScenarioSteps(scenarioResult)}
          </div>
      </div>`;
    }

    scenariosHtml += `
        </div>
    </section>`;

    return scenariosHtml;
  }

  private generateStepDetails(stepResult: any): string {
    let details = '';

    if (stepResult.error) {
      details += `
      <div class="error-section">
          <h5>Error Details</h5>
          <pre class="error-message">${this.escapeHtml(stepResult.error.message)}</pre>
          ${stepResult.error.stack ? `<details><summary>Stack Trace</summary><pre>${this.escapeHtml(stepResult.error.stack)}</pre></details>` : ''}
      </div>`;
    }

    if (stepResult.validationResults && stepResult.validationResults.length > 0) {
      details += `
      <div class="validations-section">
          <h5>Validation Results</h5>
          <div class="validations-list">`;
      
      for (const validation of stepResult.validationResults) {
        const validationClass = validation.passed ? 'passed' : 'failed';
        details += `
        <div class="validation-item ${validationClass}">
            <span class="validation-operator">${validation.operator}</span>
            <span class="validation-message">${this.escapeHtml(validation.message)}</span>
            ${!validation.passed ? `
            <div class="validation-details">
                <div>Expected: ${this.escapeHtml(JSON.stringify(validation.expected))}</div>
                <div>Actual: ${this.escapeHtml(JSON.stringify(validation.actual))}</div>
            </div>` : ''}
        </div>`;
      }
      
      details += `
          </div>
      </div>`;
    }

    if (stepResult.request) {
      details += `
      <div class="request-section">
          <h5>Request</h5>
          <pre class="request-data">${this.escapeHtml(JSON.stringify(stepResult.request, null, 2))}</pre>
      </div>`;
    }

    if (stepResult.response) {
      details += `
      <div class="response-section">
          <h5>Response</h5>
          <pre class="response-data">${this.escapeHtml(JSON.stringify(stepResult.response, null, 2))}</pre>
      </div>`;
    }

    return details;
  }

  private generateScenarioSteps(scenarioResult: ScenarioResult): string {
    let stepsHtml = '<div class="scenario-steps">';
    
    for (const stepResult of scenarioResult.stepResults) {
      const statusClass = this.getStatusClass(stepResult.status);
      stepsHtml += `
      <div class="scenario-step ${statusClass}">
          <span class="step-name">${this.escapeHtml(stepResult.step.name)}</span>
          <span class="step-status">${stepResult.status.toUpperCase()}</span>
      </div>`;
    }
    
    stepsHtml += '</div>';
    return stepsHtml;
  }

  private generateMetadataSection(result: ScenarioResult, data: ReportData): string {
    if (!data.options.includeMetadata) {
      return '';
    }

    return `
    <section class="metadata-section">
        <h3>Execution Metadata</h3>
        <div class="metadata-grid">
            <div class="metadata-item">
                <label>Environment:</label>
                <value>${this.escapeHtml(result.environment.name)}</value>
            </div>
            <div class="metadata-item">
                <label>Started:</label>
                <value>${result.metadata.startedAt.toLocaleString()}</value>
            </div>
            <div class="metadata-item">
                <label>Ended:</label>
                <value>${result.metadata.endedAt?.toLocaleString() || 'N/A'}</value>
            </div>
            <div class="metadata-item">
                <label>Platform:</label>
                <value>${data.metadata.platform}</value>
            </div>
            <div class="metadata-item">
                <label>Node Version:</label>
                <value>${data.metadata.nodeVersion}</value>
            </div>
        </div>
    </section>`;
  }

  private generateBatchMetadataSection(result: BatchResult, data: ReportData): string {
    if (!data.options.includeMetadata) {
      return '';
    }

    return `
    <section class="metadata-section">
        <h3>Batch Metadata</h3>
        <div class="metadata-grid">
            <div class="metadata-item">
                <label>Environment:</label>
                <value>${this.escapeHtml(result.metadata.environment)}</value>
            </div>
            <div class="metadata-item">
                <label>Mode:</label>
                <value>${result.metadata.mode}</value>
            </div>
            <div class="metadata-item">
                <label>Started:</label>
                <value>${result.metadata.startedAt.toLocaleString()}</value>
            </div>
            <div class="metadata-item">
                <label>Ended:</label>
                <value>${result.metadata.endedAt?.toLocaleString() || 'N/A'}</value>
            </div>
            ${result.metadata.config.maxConcurrency ? `
            <div class="metadata-item">
                <label>Max Concurrency:</label>
                <value>${result.metadata.config.maxConcurrency}</value>
            </div>` : ''}
        </div>
    </section>`;
  }

  private generateArtifactsSection(result: ScenarioResult): string {
    if (result.artifacts.length === 0) {
      return '';
    }

    let artifactsHtml = `
    <section class="artifacts-section">
        <h3>Artifacts</h3>
        <div class="artifacts-list">`;

    for (const artifact of result.artifacts) {
      artifactsHtml += `
      <div class="artifact-item">
          <div class="artifact-type">${artifact.type}</div>
          <div class="artifact-name">${this.escapeHtml(artifact.name)}</div>
          <div class="artifact-size">${this.formatFileSize(artifact.size)}</div>
          <div class="artifact-path">${this.escapeHtml(artifact.path)}</div>
      </div>`;
    }

    artifactsHtml += `
        </div>
    </section>`;

    return artifactsHtml;
  }

  private getReportStyles(): string {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .report-header {
            background: #fff;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header-content h1 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        
        .scenario-info h2, .batch-info h2 {
            color: #34495e;
            margin-bottom: 10px;
        }
        
        .description {
            color: #666;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 10px 0 0;
        }
        
        .status-badge.passed { background: #d4edda; color: #155724; }
        .status-badge.failed { background: #f8d7da; color: #721c24; }
        .status-badge.error { background: #f8d7da; color: #721c24; }
        .status-badge.skipped { background: #d1ecf1; color: #0c5460; }
        .status-badge.cancelled { background: #fff3cd; color: #856404; }
        .status-badge.timeout { background: #fff3cd; color: #856404; }
        
        .duration, .mode {
            display: inline-block;
            margin: 10px 10px 0 0;
            color: #666;
        }
        
        .report-meta {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        
        .report-meta span {
            margin-right: 20px;
        }
        
        .summary-section {
            background: #fff;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-section h3 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        
        .summary-card {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: #f8f9fa;
            border: 2px solid #e9ecef;
        }
        
        .summary-card.passed {
            background: #d4edda;
            border-color: #c3e6cb;
        }
        
        .summary-card.failed {
            background: #f8d7da;
            border-color: #f1b0b7;
        }
        
        .summary-card.skipped {
            background: #d1ecf1;
            border-color: #bee5eb;
        }
        
        .summary-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .summary-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .steps-section, .scenarios-section {
            background: #fff;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .steps-section h3, .scenarios-section h3 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .step-card, .scenario-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .step-card:hover, .scenario-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .step-card.passed, .scenario-card.passed {
            border-left: 4px solid #28a745;
        }
        
        .step-card.failed, .scenario-card.failed {
            border-left: 4px solid #dc3545;
        }
        
        .step-card.skipped, .scenario-card.skipped {
            border-left: 4px solid #17a2b8;
        }
        
        .step-header, .scenario-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #f8f9fa;
        }
        
        .step-name, .scenario-name {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .step-status, .scenario-status {
            font-size: 12px;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .step-status.passed, .scenario-status.passed {
            background: #d4edda;
            color: #155724;
        }
        
        .step-status.failed, .scenario-status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        
        .step-status.skipped, .scenario-status.skipped {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .step-duration, .scenario-duration {
            color: #666;
            font-size: 14px;
        }
        
        .step-description {
            padding: 0 20px 10px;
            color: #666;
            font-style: italic;
        }
        
        .scenario-summary {
            padding: 0 20px 15px;
            color: #666;
            font-size: 14px;
        }
        
        .step-details, .scenario-details {
            border-top: 1px solid #e9ecef;
            padding: 20px;
        }
        
        .error-section, .validations-section, .request-section, .response-section {
            margin-bottom: 20px;
        }
        
        .error-section h5, .validations-section h5, .request-section h5, .response-section h5 {
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .validation-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            border-radius: 4px;
        }
        
        .validation-item.passed {
            background: #d4edda;
        }
        
        .validation-item.failed {
            background: #f8d7da;
        }
        
        .validation-operator {
            font-weight: bold;
            margin-right: 10px;
        }
        
        .validation-details {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
        
        .request-data, .response-data {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .metadata-section, .artifacts-section {
            background: #fff;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metadata-section h3, .artifacts-section h3 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .metadata-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .metadata-item label {
            font-weight: bold;
            color: #666;
        }
        
        .artifact-item {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            gap: 15px;
            align-items: center;
            padding: 10px;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        
        .artifact-type {
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .artifact-size {
            color: #666;
            font-size: 14px;
        }
        
        .artifact-path {
            color: #666;
            font-size: 12px;
            font-family: 'Courier New', monospace;
        }
        
        .scenario-steps {
            display: grid;
            gap: 5px;
        }
        
        .scenario-step {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .scenario-step.passed {
            background: #d4edda;
        }
        
        .scenario-step.failed {
            background: #f8d7da;
        }
        
        .scenario-step.skipped {
            background: #d1ecf1;
        }
        
        details {
            margin-top: 10px;
        }
        
        summary {
            cursor: pointer;
            font-weight: bold;
            padding: 5px 0;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            }
            
            .step-header, .scenario-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .metadata-grid {
                grid-template-columns: 1fr;
            }
            
            .artifact-item {
                grid-template-columns: 1fr;
                gap: 5px;
            }
        }
    `;
  }

  private getReportScript(): string {
    return `
        function toggleStepDetails(stepName) {
            const element = document.getElementById('details-' + stepName);
            if (element) {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        }
        
        function toggleScenarioDetails(scenarioId) {
            const element = document.getElementById('scenario-details-' + scenarioId);
            if (element) {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        }
        
        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const openDetails = document.querySelectorAll('.step-details[style*="block"], .scenario-details[style*="block"]');
                openDetails.forEach(detail => detail.style.display = 'none');
            }
        });
    `;
  }

  private getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = (ms / 1000).toFixed(2);
    return `${seconds}s`;
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}