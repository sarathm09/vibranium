/**
 * Simple types for interactive UI compatibility
 * These bridge the gap between comprehensive domain types and UI needs
 */

// Simple scenario result for UI display
export interface ScenarioResult {
  scenarioName: string;
  success: boolean;
  duration: number;
  stepResults?: StepResult[];
  startTime: Date;
  endTime: Date;
  environment: string;
}

// Simple step result for UI display
export interface StepResult {
  stepName: string;
  success: boolean;
  duration?: number;
  error?: string;
  response?: {
    status?: number;
    statusText?: string;
    body?: any;
    headers?: Record<string, string>;
  };
}

// Simple step interface for UI
export interface Step {
  name: string;
  type: string;
  [key: string]: any; // Allow additional properties
}

// Simple scenario interface for UI
export interface Scenario {
  name: string;
  description?: string;
  steps: Step[];
  lifecycle?: {
    setup?: Step[];
    teardown?: Step[];
    onFailure?: 'stop' | 'continue';
  };
  environments?: string[];
}

// Simple environment interface for UI
export interface Environment {
  name: string;
  variables: Record<string, any>;
  secrets: Record<string, any>;
}