/**
 * Environment management utilities
 */
type Environment = any;
type VariableMap = any;
export interface EnvironmentManager {
    loadEnvironment(name: string): Promise<Environment>;
    getAllEnvironments(): Promise<Record<string, Environment>>;
    resolveVariables(variables: VariableMap, environment: Environment): VariableMap;
    interpolateTemplate(template: string, variables: VariableMap): string;
}
export declare class EnvironmentHelper implements EnvironmentManager {
    loadEnvironment(name: string): Promise<Environment>;
    getAllEnvironments(): Promise<Record<string, Environment>>;
    resolveVariables(variables: VariableMap, environment: Environment): VariableMap;
    interpolateTemplate(template: string, variables: VariableMap): string;
}
export {};
//# sourceMappingURL=environment.d.ts.map