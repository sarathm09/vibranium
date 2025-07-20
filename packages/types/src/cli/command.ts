/**
 * CLI command types
 */

export interface Command {
  name: string;
  description: string;
  options: CommandOption[];
  action: CommandAction;
}

export interface CommandOption {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any;
  description?: string;
}

export type CommandAction = (args: any, options: any) => Promise<void>;