/**
 * Main scenario parser that coordinates YAML/JSON parsing and validation
 */
import type { Scenario } from '../types';
export interface ScenarioParseResult {
    scenario: Scenario;
    warnings: string[];
    source: {
        format: 'yaml' | 'json';
        content: string;
        file?: string;
    };
}
export interface ScenarioParseError {
    message: string;
    line?: number;
    column?: number;
    file?: string;
    code?: string;
}
export declare class ScenarioParser {
    private yamlParser;
    private jsonParser;
    private validator;
    /**
     * Parse scenario from content string
     */
    parse(content: string, options?: {
        format?: 'yaml' | 'json' | 'auto';
        file?: string;
        validate?: boolean;
    }): Promise<ScenarioParseResult>;
    /**
     * Parse scenario from file
     */
    parseFile(filePath: string, options?: {
        format?: 'yaml' | 'json' | 'auto';
        validate?: boolean;
    }): Promise<ScenarioParseResult>;
    /**
     * Parse multiple scenarios from content (array format)
     */
    parseMultiple(content: string, options?: {
        format?: 'yaml' | 'json' | 'auto';
        file?: string;
        validate?: boolean;
    }): Promise<ScenarioParseResult[]>;
    /**
     * Validate scenario without parsing
     */
    validate(scenario: Scenario): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Detect format from content or filename
     */
    private detectFormat;
    /**
     * Normalize parsed data to Scenario interface
     */
    private normalizeScenario;
}
//# sourceMappingURL=scenario-parser.d.ts.map