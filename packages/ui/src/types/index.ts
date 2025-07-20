// Basic types for the Vibranium Web UI

export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  version?: string;
  environments?: string[];
  steps?: Array<{
    id: string;
    name: string;
    type: string;
    [key: string]: any;
  }>;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, any>;
  active: boolean;
}

export interface ExecutionResult {
  id: string;
  scenarioId: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  startTime: Date;
  endTime?: Date;
  results?: Array<{
    stepId: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }>;
}