/**
 * Text content parser for plain text responses
 */
export interface TextParseOptions {
    encoding?: BufferEncoding;
    trimWhitespace?: boolean;
    splitLines?: boolean;
    removeEmptyLines?: boolean;
}
export interface TextParseResult {
    text: string;
    lines?: string[];
    contentType: string;
    size: number;
    encoding: string;
    metadata: {
        lineCount: number;
        wordCount: number;
        charCount: number;
        isEmpty: boolean;
    };
}
export interface TextSearchResult {
    line: number;
    column: number;
    match: string;
    context?: string;
}
export declare class TextContentParser {
    /**
     * Parse text content from string or buffer
     */
    parse(content: string | Buffer, options?: TextParseOptions): TextParseResult;
    /**
     * Search for patterns in text content
     */
    search(text: string, pattern: string | RegExp, options?: {
        caseSensitive?: boolean;
        wholeWord?: boolean;
        includeContext?: boolean;
        contextLines?: number;
    }): TextSearchResult[];
    /**
     * Extract specific lines from text
     */
    getLines(text: string, startLine: number, endLine?: number): {
        lines: string[];
        totalLines: number;
    };
    /**
     * Count occurrences of a pattern in text
     */
    count(text: string, pattern: string | RegExp, caseSensitive?: boolean): number;
    /**
     * Replace patterns in text
     */
    replace(text: string, pattern: string | RegExp, replacement: string, options?: {
        caseSensitive?: boolean;
        replaceAll?: boolean;
    }): string;
    /**
     * Validate text encoding
     */
    validateEncoding(buffer: Buffer, expectedEncoding?: BufferEncoding): boolean;
    /**
     * Detect text encoding (basic detection)
     */
    detectEncoding(buffer: Buffer): BufferEncoding;
    /**
     * Calculate text metadata
     */
    private calculateMetadata;
    /**
     * Extract context lines around a specific line
     */
    private extractContext;
}
//# sourceMappingURL=text-parser.d.ts.map