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
export interface CliConfig {
    workspaceRoot?: string;
    scenariosDir?: string;
    environmentsDir?: string;
    outputDir?: string;
    parallelExecution?: boolean;
    maxConcurrency?: number;
    defaultEnvironment?: string;
    reporter?: {
        formats: string[];
        outputDir: string;
    };
    timeouts?: {
        scenario: number;
        step: number;
    };
}
export interface CLIEnvironmentManager {
    loadEnvironment(name: string): Promise<any>;
    getVariables(env: string): Record<string, any>;
}
export interface CLIScenarioParser {
    parseFile(filePath: string): Promise<any>;
    parse(content: string, filePath?: string): any;
}
export interface CLIExecutionOrchestrator {
    execute(scenario: any, options: any): Promise<any>;
}
//# sourceMappingURL=config.d.ts.map