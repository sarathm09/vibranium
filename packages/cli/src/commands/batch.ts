/**
 * Batch command implementation
 */

import { CliHelper, CliOptions } from '../utils/cli-utils';
import { ResolvedConfig } from '../utils/config-resolver';
import { ExitCodes } from '../utils/exit-codes';
import { DefaultHeadlessRunner } from '../headless';

export interface BatchCommandOptions extends CliOptions {
  environment?: string;
  parallel?: boolean;
  maxConcurrency?: number;
  format?: string;
  output?: string;
  continueOnFailure?: boolean;
}

export class BatchCommand {
  private helper: CliHelper;

  constructor(private config: ResolvedConfig, options: CliOptions) {
    this.helper = new CliHelper(options);
  }

  async execute(directory: string, options: BatchCommandOptions): Promise<void> {
    try {
      this.helper.log(`Running batch execution in: ${directory}`);
      this.helper.logWarning('Note: "batch" command is deprecated. Use "vibranium run <pattern>" instead.');
      
      const runner = new DefaultHeadlessRunner(this.config, this.helper);
      const result = await runner.runBatch(directory, {
        environment: options.environment,
        parallel: options.parallel,
        maxConcurrency: options.maxConcurrency,
        continueOnFailure: options.continueOnFailure,
        reporter: options.format,
        output: options.output
      });
      
      // Handle output formatting
      if (options.format && options.format !== 'console') {
        const { ReportGenerator } = await import('../headless/report-generator');
        const reportGenerator = new ReportGenerator(this.config, this.helper);
        
        const outputFile = options.output || this.generateOutputFilename(options.format);
        await reportGenerator.generateBatch(result, options.format as any, outputFile);
        
        this.helper.logSuccess(`Report generated: ${outputFile}`);
      }
      
      this.helper.logSuccess('Batch execution completed');
      
      // Exit with appropriate code
      process.exit(result.success ? ExitCodes.SUCCESS : ExitCodes.EXECUTION_FAILED);
    } catch (error) {
      this.helper.logError(error instanceof Error ? error : new Error(String(error)));
      process.exit(ExitCodes.EXECUTION_FAILED);
    }
  }
  
  private generateOutputFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format.toLowerCase()) {
      case 'junit':
        return `vibranium-batch-${timestamp}.xml`;
      case 'json':
        return `vibranium-batch-${timestamp}.json`;
      case 'html':
        return `vibranium-batch-${timestamp}.html`;
      default:
        return `vibranium-batch-${timestamp}.txt`;
    }
  }
}