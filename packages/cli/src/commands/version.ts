/**
 * Version command implementation
 */

import chalk from 'chalk';
import { CliHelper, CliOptions } from '../utils/cli-utils';

export interface VersionCommandOptions extends CliOptions {
  json?: boolean;
}

export class VersionCommand {
  private helper: CliHelper;

  constructor(options: CliOptions) {
    this.helper = new CliHelper(options);
  }

  async execute(options: VersionCommandOptions): Promise<void> {
    const packageJson = await this.getPackageInfo();
    
    if (options.json) {
      console.log(JSON.stringify({
        version: packageJson.version,
        name: packageJson.name,
        description: packageJson.description,
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }, null, 2));
    } else {
      this.displayVersionInfo(packageJson);
    }
  }

  private async getPackageInfo(): Promise<any> {
    try {
      // Try to load package.json from the CLI package
      const packagePath = require.resolve('@vibraniumjs/cli/package.json');
      return require(packagePath);
    } catch {
      // Fallback version info
      return {
        name: '@vibraniumjs/cli',
        version: '0.1.0',
        description: 'Modern scenario-driven API testing CLI'
      };
    }
  }

  private displayVersionInfo(packageJson: any): void {
    const title = chalk.bold.blue('Vibranium CLI');
    const version = chalk.green(`v${packageJson.version}`);
    
    console.log(`\\n${title} ${version}`);
    console.log(chalk.dim(packageJson.description || 'Modern scenario-driven API testing'));
    
    console.log('\\n' + chalk.bold('System Info:'));
    console.log(`  Node.js: ${chalk.green(process.version)}`);
    console.log(`  Platform: ${chalk.green(process.platform)} (${process.arch})`);
    
    console.log('\\n' + chalk.bold('Dependencies:'));
    this.displayDependencyVersions();
  }

  private displayDependencyVersions(): void {
    const dependencies = [
      '@vibraniumjs/core',
      '@vibraniumjs/utils', 
      '@vibraniumjs/types',
      '@vibraniumjs/plugins',
      '@vibraniumjs/http-client'
    ];

    for (const dep of dependencies) {
      try {
        const depPackage = require(`${dep}/package.json`);
        console.log(`  ${dep}: ${chalk.green(depPackage.version)}`);
      } catch {
        console.log(`  ${dep}: ${chalk.yellow('not found')}`);
      }
    }
  }
}