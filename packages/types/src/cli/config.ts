/**
 * CLI configuration types
 */

export interface CLIConfig {
  logLevel: string;
  outputFormat: string;
  interactive: boolean;
}

export interface UserConfig {
  preferences: Record<string, any>;
  defaults: Record<string, any>;
}