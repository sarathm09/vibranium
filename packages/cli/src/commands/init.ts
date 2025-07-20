/**
 * Init command implementation
 */

import { join } from 'path';
import { CliHelper, CliOptions } from '../utils/cli-utils';
import { ConfigResolver, ResolvedConfig } from '../utils/config-resolver';
import { ExitCodes } from '../utils/exit-codes';

export interface InitCommandOptions extends CliOptions {
  template?: string;
  force?: boolean;
}

export class InitCommand {
  private helper: CliHelper;
  private configResolver: ConfigResolver;

  constructor(options: CliOptions) {
    this.helper = new CliHelper(options);
    this.configResolver = new ConfigResolver();
  }

  async execute(projectPath: string, options: InitCommandOptions): Promise<void> {
    try {
      const targetDir = projectPath || process.cwd();
      this.helper.log(`Initializing Vibranium project in: ${targetDir}`);
      
      await this.createProjectStructure(targetDir, options);
      await this.generateExampleFiles(targetDir, options.template);
      
      this.helper.logSuccess(`Project initialized successfully!`);
      this.helper.log(`\\nNext steps:`);
      this.helper.log(`  cd ${projectPath || '.'}`);
      this.helper.log(`  vibranium run scenarios/example.yaml`);
      
    } catch (error) {
      this.helper.logError(error instanceof Error ? error : new Error(String(error)));
      process.exit(ExitCodes.CONFIGURATION_ERROR);
    }
  }

  private async createProjectStructure(targetDir: string, options: InitCommandOptions): Promise<void> {
    const fs = await import('fs/promises');
    
    const directories = [
      'scenarios',
      'environments', 
      'output',
      'reports'
    ];

    for (const dir of directories) {
      const dirPath = join(targetDir, dir);
      await fs.mkdir(dirPath, { recursive: true });
      this.helper.logVerbose(`Created directory: ${dir}`);
    }
  }

  private async generateExampleFiles(targetDir: string, template?: string): Promise<void> {
    const fs = await import('fs/promises');
    
    // Generate config file
    const configContent = JSON.stringify(this.configResolver.getDefaultConfig(), null, 2);
    await fs.writeFile(join(targetDir, 'vibranium.config.json'), configContent);
    
    // Generate example scenario
    const exampleScenario = `name: example_api_test
description: "Basic API testing example"
steps:
  - name: health_check
    type: api
    method: GET
    url: "https://jsonplaceholder.typicode.com/posts/1"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.id"
        operator: equals
        expected: 1`;
    
    await fs.writeFile(join(targetDir, 'scenarios', 'example.yaml'), exampleScenario);
    
    // Generate example environment
    const exampleEnv = JSON.stringify({
      environment: "local",
      variables: {
        API_URL: "https://jsonplaceholder.typicode.com",
        TIMEOUT: 10000
      }
    }, null, 2);
    
    await fs.writeFile(join(targetDir, 'environments', 'local.json'), exampleEnv);
    
    this.helper.logVerbose('Generated example files');
  }
}