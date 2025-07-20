/**
 * Advanced argument parsing utilities
 */

import { Command } from 'commander';
import { CliOptions, parseCommonOptions } from './cli-utils';

export interface ParsedCommand {
  command: string;
  args: string[];
  options: CliOptions & Record<string, any>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
  options?: Array<{
    flags: string;
    description: string;
    defaultValue?: any;
  }>;
}

export class ArgumentParser {
  private program: Command;

  constructor(name: string, description: string, version: string) {
    this.program = new Command();
    this.program
      .name(name)
      .description(description)
      .version(version);

    this.addGlobalOptions();
  }

  private addGlobalOptions() {
    this.program
      .option('-v, --verbose', 'Enable verbose output')
      .option('--debug', 'Enable debug mode')
      .option('--no-colors', 'Disable colors in output')
      .option('-c, --config <path>', 'Configuration file path')
      .option('-o, --output <path>', 'Output directory');
  }

  addCommand(definition: CommandDefinition, handler: (args: string[], options: any) => Promise<void>): this {
    const cmd = this.program
      .command(definition.name)
      .description(definition.description);

    // Add arguments
    if (definition.arguments) {
      for (const arg of definition.arguments) {
        const argName = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
        cmd.argument(argName, arg.description);
      }
    }

    // Add options
    if (definition.options) {
      for (const option of definition.options) {
        if (option.defaultValue !== undefined) {
          cmd.option(option.flags, option.description, option.defaultValue);
        } else {
          cmd.option(option.flags, option.description);
        }
      }
    }

    cmd.action(async (...argsAndOptions) => {
      const options = argsAndOptions.pop(); // Last item is always options
      const args = argsAndOptions as string[];
      
      try {
        await handler(args, options);
      } catch (error) {
        console.error('Command failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

    return this;
  }

  addSubcommand(name: string, description: string): Command {
    return this.program
      .command(name)
      .description(description);
  }

  parse(argv?: string[]): void {
    this.program.parse(argv);
  }

  getProgram(): Command {
    return this.program;
  }

  parseCommand(argv: string[]): ParsedCommand | null {
    // Parse without executing to extract command info
    const program = new Command();
    program.exitOverride();
    
    try {
      program.parse(argv, { from: 'user' });
      
      const [, , command, ...args] = argv;
      const options = parseCommonOptions({});
      
      return {
        command: command || 'help',
        args,
        options
      };
    } catch (err) {
      return null;
    }
  }
}

export function createBaseParser(name: string, version: string): ArgumentParser {
  return new ArgumentParser(
    name,
    'Modern scenario-driven API testing with interactive CLI',
    version
  );
}