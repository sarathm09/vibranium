// Export UI-specific types and interfaces
// For now, define basic types locally until workspace dependencies are resolved

// Basic types that will eventually come from @vibraniumjs/types
export interface Scenario {
  name: string;
  description?: string;
  steps?: Step[];
  environment?: string;
}

export interface Step {
  name: string;
  type: string;
  description?: string;
}

export interface Environment {
  name: string;
  variables?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  duration: number;
  steps: any[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  timestamp: string;
}

// UI-specific types
export interface UITheme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

export interface AppState {
  currentScenario?: Scenario;
  environment?: Environment;
  theme: UITheme;
  isLoading: boolean;
  error?: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}