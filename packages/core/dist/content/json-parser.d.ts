/**
 * JSON content parser with JSONPath query support
 */
export interface JsonParseOptions {
    strict?: boolean;
    allowComments?: boolean;
}
export interface JsonQueryOptions {
    wrap?: boolean;
    preventEval?: boolean;
    autostart?: boolean;
}
export interface JsonParseResult {
    data: any;
    contentType: string;
    size: number;
}
export interface JsonQueryResult {
    value: any;
    path: string;
    pointer: string;
    parent: any;
    parentProperty: string | number | null;
}
export declare class JsonContentParser {
    /**
     * Parse JSON content from string or buffer
     */
    parse(content: string | Buffer, options?: JsonParseOptions): JsonParseResult;
    /**
     * Query JSON data using JSONPath expressions
     */
    query(data: any, path: string, options?: JsonQueryOptions): JsonQueryResult[];
    /**
     * Extract single value using JSONPath
     */
    queryValue(data: any, path: string, defaultValue?: any): any;
    /**
     * Check if a JSONPath exists in the data
     */
    pathExists(data: any, path: string): boolean;
    /**
     * Get all paths in a JSON object
     */
    getAllPaths(data: any, options?: {
        maxDepth?: number;
        includeValues?: boolean;
    }): Array<{
        path: string;
        value?: any;
        type: string;
    }>;
    /**
     * Validate JSONPath expression syntax
     */
    validateJsonPath(path: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Remove JSON comments (simplified implementation)
     */
    private removeComments;
    /**
     * Validate JSON structure for common issues
     */
    private validateJsonStructure;
}
//# sourceMappingURL=json-parser.d.ts.map