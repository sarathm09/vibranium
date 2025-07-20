/**
 * Standard exit codes for the CLI
 */

export const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  VALIDATION_ERROR: 2,
  CONFIGURATION_ERROR: 3,
  SCENARIO_NOT_FOUND: 4,
  EXECUTION_FAILED: 5,
  INTERRUPTED: 130, // SIGINT
} as const;

export type ExitCode = typeof ExitCodes[keyof typeof ExitCodes];

export function getExitCodeDescription(code: ExitCode): string {
  switch (code) {
    case ExitCodes.SUCCESS:
      return 'Success';
    case ExitCodes.GENERAL_ERROR:
      return 'General error';
    case ExitCodes.VALIDATION_ERROR:
      return 'Validation error';
    case ExitCodes.CONFIGURATION_ERROR:
      return 'Configuration error';
    case ExitCodes.SCENARIO_NOT_FOUND:
      return 'Scenario not found';
    case ExitCodes.EXECUTION_FAILED:
      return 'Execution failed';
    case ExitCodes.INTERRUPTED:
      return 'Interrupted by user';
    default:
      return 'Unknown error';
  }
}