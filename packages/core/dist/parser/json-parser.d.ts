/**
 * JSON parser with enhanced error reporting and validation
 */
export interface JsonParseOptions {
    file?: string;
    strict?: boolean;
    allowComments?: boolean;
}
export declare class JsonParser {
    /**
     * Parse JSON content to JavaScript object
     */
    parse(content: string, options?: JsonParseOptions): Promise<any>;
    /**
     * Stringify JavaScript object to JSON
     */
    stringify(data: any, options?: {
        indent?: number;
        sorted?: boolean;
    }): string;
    /**
     * Validate JSON syntax without full parsing
     */
    validateSyntax(content: string): {
        valid: boolean;
        error?: string;
        line?: number;
        column?: number;
    };
    /**
     * Remove JSON comments - simple implementation
     */
    private removeComments;
    /**
     * Extract error position from JSON parse error message
     */
    private extractErrorPosition;
    /**
     * Convert character position to line/column
     */
    private getLineColumnFromPosition;
    /**
     * Validate strict JSON format
     */
    private validateStrictJson;
    /**
     * Create a replacer function for sorted JSON output
     */
    private createSortedReplacer;
}
//# sourceMappingURL=json-parser.d.ts.map