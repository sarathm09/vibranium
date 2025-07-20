/**
 * Core types for the core engine - simplified versions aligned with implementation
 */
export interface Scenario {
    name: string;
    description?: string;
    version?: string;
    environment?: string;
    variables?: Record<string, any>;
    steps: Step[];
    hooks?: {
        onStart?: string[];
        onEnd?: string[];
        beforeApi?: string[];
        afterApi?: string[];
    };
    config?: Record<string, any>;
    metadata?: Record<string, any>;
    timeout?: number;
}
export interface Step {
    name: string;
    type: string;
    description?: string;
    dependsOn?: string[];
    skip?: boolean | string;
    timeout?: number;
    retries?: number;
    expect?: ExpectBlock;
    config?: Record<string, any>;
    metadata?: Record<string, any>;
    [key: string]: any;
}
export interface ExpectBlock {
    status?: number;
    body?: any;
    headers?: Record<string, any>;
    jsonpath?: Record<string, any>;
    xpath?: Record<string, any>;
    [operator: string]: any;
}
export interface StepResult {
    step: Step;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'blocked';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    error?: Error;
    data?: any;
    request?: any;
    response?: any;
    logs?: string[];
    validationResults?: ValidationResult[];
    screenshots?: string[];
    metadata?: Record<string, any>;
}
export interface ValidationResult {
    operator: string;
    expected: any;
    actual: any;
    passed: boolean;
    message: string;
    path: string;
}
export interface ScenarioResult {
    scenario: Scenario;
    status: 'completed' | 'failed';
    startTime: Date;
    endTime: Date;
    duration: number;
    stepResults: StepResult[];
    metrics: {
        totalSteps: number;
        passedSteps: number;
        failedSteps: number;
        skippedSteps: number;
    };
    variables: Record<string, any>;
    error?: Error;
}
export interface ExecutionContext {
    scenario: Scenario;
    environment?: string;
    variables: Record<string, any>;
    results: StepResult[];
    currentStep?: number;
    startTime: Date;
}
export interface VariableMap {
    [key: string]: any;
}
export interface Environment {
    name: string;
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    variables?: Record<string, any>;
    headers?: Record<string, string>;
}
//# sourceMappingURL=types.d.ts.map