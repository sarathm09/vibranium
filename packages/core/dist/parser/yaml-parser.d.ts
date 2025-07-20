/**
 * YAML parser with error handling and line/column tracking
 */
export interface YamlParseOptions {
    file?: string;
    strict?: boolean;
}
export declare class YamlParser {
    /**
     * Parse YAML content to JavaScript object
     */
    parse(content: string, options?: YamlParseOptions): Promise<any>;
    /**
     * Stringify JavaScript object to YAML
     */
    stringify(data: any, options?: {
        indent?: number;
        flow?: boolean;
    }): string;
    /**
     * Validate YAML syntax without full parsing
     */
    validateSyntax(content: string): {
        valid: boolean;
        error?: string;
        line?: number;
        column?: number;
    };
}
//# sourceMappingURL=yaml-parser.d.ts.map