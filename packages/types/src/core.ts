/**
 * Core interfaces for Vibranium CLI
 */

export interface Step {
  type: string;
  name?: string;
  description?: string;
  skip?: boolean;
  [key: string]: any;
}

export interface Scenario {
  name: string;
  description?: string;
  version?: string;
  environments?: Record<string, Environment>;
  steps: Step[];
  beforeAll?: Step[];
  afterAll?: Step[];
  beforeEach?: Step[];
  afterEach?: Step[];
}

export interface Environment {
  name: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
  auth?: AuthConfig;
}

export interface AuthConfig {
  type: 'basic' | 'bearer' | 'apikey' | 'oauth2';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  keyName?: string;
  location?: 'header' | 'query';
}

export interface ExecutionContext {
  scenario: Scenario;
  environment: Environment;
  variables: Record<string, any>;
  results: StepResult[];
  currentStep?: number;
  startTime: Date;
}

export interface StepResult {
  step: Step;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: Error;
  data?: any;
  logs?: string[];
}