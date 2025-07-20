/**
 * Comprehensive report generation for CLI execution results
 */

import { join } from 'path';
import { ScenarioResult, BatchResult, ExecutionSummary, ExecutionArtifact } from '@vibraniumjs/types';
import { CliHelper } from '../utils/cli-utils';
import { ResolvedConfig } from '../utils/config-resolver';
import { ConsoleReporter } from './reporters/console-reporter';
import { HtmlReporter } from './reporters/html-reporter';
import { JsonReporter } from './reporters/json-reporter';
import { JunitReporter } from './reporters/junit-reporter';

export type ReportFormat = 'html' | 'json' | 'junit' | 'console';
export type ConsoleOutputLevel = 'minimal' | 'normal' | 'verbose';

export interface ReportOptions {
  format: ReportFormat;
  outputDir?: string;
  outputFile?: string;
  includeArtifacts?: boolean;
  includeMetadata?: boolean;
  consoleLevel?: ConsoleOutputLevel;
  colorOutput?: boolean;
}

export interface ReportTemplate {
  name: string;
  format: ReportFormat;
  generate: (data: ReportData) => string;
}

export interface ReportData {
  result: ScenarioResult | BatchResult;
  metadata: {
    generatedAt: Date;
    vibraniumVersion: string;
    platform: string;
    nodeVersion: string;
  };
  options: ReportOptions;
}

export class ReportGenerator {
  private templates: Map<string, ReportTemplate> = new Map();
  private consoleReporter!: ConsoleReporter;
  private htmlReporter!: HtmlReporter;
  private jsonReporter!: JsonReporter;
  private junitReporter!: JunitReporter;
  
  constructor(
    private config: ResolvedConfig,
    private helper: CliHelper
  ) {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Initialize reporters
    this.consoleReporter = new ConsoleReporter(this.helper);
    this.htmlReporter = new HtmlReporter();
    this.jsonReporter = new JsonReporter();
    this.junitReporter = new JunitReporter();
    
    // Register built-in templates for scenarios
    this.registerTemplate({
      name: 'html-detailed',
      format: 'html',
      generate: (data) => {
        if (this.isBatchResult(data.result)) {
          return this.htmlReporter.generateBatchReport(data);
        } else {
          return this.htmlReporter.generateScenarioReport(data);
        }
      }
    });
    
    this.registerTemplate({
      name: 'json-structured',
      format: 'json',
      generate: (data) => {
        if (this.isBatchResult(data.result)) {
          return this.jsonReporter.generateBatchReport(data);
        } else {
          return this.jsonReporter.generateScenarioReport(data);
        }
      }
    });
    
    this.registerTemplate({
      name: 'junit-standard',
      format: 'junit',
      generate: (data) => {
        if (this.isBatchResult(data.result)) {
          return this.junitReporter.generateBatchReport(data);
        } else {
          return this.junitReporter.generateScenarioReport(data);
        }
      }
    });
  }

  registerTemplate(template: ReportTemplate): void {
    this.templates.set(template.name, template);
  }

  async generate(result: ScenarioResult, options: ReportOptions): Promise<string> {
    const reportData = this.createReportData(result, options);
    
    if (options.format === 'console') {
      const output = this.generateConsoleOutput(reportData);
      console.log(output);
      return output;
    }
    
    const content = await this.generateReportContent(reportData);
    
    if (options.outputDir || options.outputFile) {
      const filePath = await this.writeReportToFile(content, result, options);
      this.helper.logSuccess(`${options.format.toUpperCase()} report generated: ${filePath}`);
      return filePath;
    }
    
    return content;
  }

  async generateBatch(result: BatchResult, options: ReportOptions): Promise<string> {
    const reportData = this.createReportData(result, options);
    
    if (options.format === 'console') {
      const output = this.generateConsoleOutput(reportData);
      console.log(output);
      return output;
    }
    
    const content = await this.generateReportContent(reportData);
    
    if (options.outputDir || options.outputFile) {
      const filePath = await this.writeReportToFile(content, result, options);
      this.helper.logSuccess(`Batch ${options.format.toUpperCase()} report generated: ${filePath}`);
      return filePath;
    }
    
    return content;
  }

  private createReportData(result: ScenarioResult | BatchResult, options: ReportOptions): ReportData {
    return {
      result,
      metadata: {
        generatedAt: new Date(),
        vibraniumVersion: this.getVibraniumVersion(),
        platform: process.platform,
        nodeVersion: process.version
      },
      options
    };
  }

  private async generateReportContent(data: ReportData): Promise<string> {
    const templateName = this.getTemplateName(data.options.format);
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`No template found for format: ${data.options.format}`);
    }
    
    return template.generate(data);
  }

  private generateConsoleOutput(data: ReportData): string {
    if (this.isBatchResult(data.result)) {
      return this.consoleReporter.generateBatchReport(data);
    } else {
      return this.consoleReporter.generateScenarioReport(data);
    }
  }

  private async writeReportToFile(content: string, result: ScenarioResult | BatchResult, options: ReportOptions): Promise<string> {
    const fs = await import('fs/promises');
    
    let filePath: string;
    
    if (options.outputFile) {
      filePath = options.outputFile;
      // Ensure the directory exists
      const dir = join(filePath, '..');
      await fs.mkdir(dir, { recursive: true });
    } else {
      const outputDir = options.outputDir || './reports';
      await fs.mkdir(outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = this.isBatchResult(result) ? 'batch' : (result as ScenarioResult).scenario.name;
      const extension = this.getFileExtension(options.format);
      
      filePath = join(outputDir, `${name}-${timestamp}.${extension}`);
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  private getTemplateName(format: ReportFormat): string {
    switch (format) {
      case 'html':
        return 'html-detailed';
      case 'json':
        return 'json-structured';
      case 'junit':
        return 'junit-standard';
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'junit':
        return 'xml';
      default:
        return 'txt';
    }
  }

  private isBatchResult(result: ScenarioResult | BatchResult): result is BatchResult {
    return 'scenarioResults' in result;
  }

  private getVibraniumVersion(): string {
    try {
      const packageJson = require('../../../../package.json');
      return packageJson.version || '0.0.0';
    } catch (error) {
      return '0.0.0';
    }
  }

  // Legacy methods for backward compatibility - deprecated
  async generateHtmlReport(result: ScenarioResult, outputDir: string): Promise<void> {
    await this.generate(result, {
      format: 'html',
      outputDir,
      includeArtifacts: true,
      includeMetadata: true
    });
  }

  async generateJsonReport(result: ScenarioResult, outputDir: string): Promise<void> {
    await this.generate(result, {
      format: 'json',
      outputDir,
      includeArtifacts: true,
      includeMetadata: true
    });
  }

  async generateJunitReport(result: ScenarioResult, outputDir: string): Promise<void> {
    await this.generate(result, {
      format: 'junit',
      outputDir,
      includeArtifacts: false,
      includeMetadata: true
    });
  }

  async generateBatchHtmlReport(result: BatchResult, outputDir: string): Promise<void> {
    await this.generateBatch(result, {
      format: 'html',
      outputDir,
      includeArtifacts: true,
      includeMetadata: true
    });
  }

  async generateBatchJsonReport(result: BatchResult, outputDir: string): Promise<void> {
    await this.generateBatch(result, {
      format: 'json',
      outputDir,
      includeArtifacts: true,
      includeMetadata: true
    });
  }

  async generateBatchJunitReport(result: BatchResult, outputDir: string): Promise<void> {
    await this.generateBatch(result, {
      format: 'junit',
      outputDir,
      includeArtifacts: false,
      includeMetadata: true
    });
  }
}