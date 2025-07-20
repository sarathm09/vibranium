/**
 * Content-type detector and router for automatic parsing
 */
export interface ContentInfo {
    contentType: string;
    detectedType: 'json' | 'xml' | 'text' | 'binary';
    encoding?: string;
    confidence: number;
    characteristics: {
        isText: boolean;
        isStructured: boolean;
        hasSchema: boolean;
        isQueryable: boolean;
    };
}
export interface ParseOptions {
    forceType?: 'json' | 'xml' | 'text' | 'binary';
    strictTypeChecking?: boolean;
    contentTypeHeader?: string;
    encoding?: BufferEncoding;
}
export interface ParseResult {
    data: any;
    contentInfo: ContentInfo;
    parser: 'json' | 'xml' | 'text' | 'binary';
    metadata: any;
}
export declare class ContentDetector {
    private jsonParser;
    private xmlParser;
    private textParser;
    private binaryParser;
    /**
     * Detect content type from buffer or string
     */
    detect(content: string | Buffer, options?: {
        contentTypeHeader?: string;
        filename?: string;
        strictChecking?: boolean;
    }): ContentInfo;
    /**
     * Parse content automatically based on detected type
     */
    parseContent(content: string | Buffer, options?: ParseOptions): ParseResult;
    /**
     * Get query capabilities for detected content
     */
    getQueryCapabilities(contentInfo: ContentInfo): {
        jsonPath: boolean;
        xpath: boolean;
        textSearch: boolean;
        binaryOps: boolean;
    };
    /**
     * Validate content against expected type
     */
    validateContentType(content: string | Buffer, expectedType: 'json' | 'xml' | 'text' | 'binary'): {
        valid: boolean;
        actualType: string;
        confidence: number;
        errors: string[];
    };
    /**
     * Get initial guess from headers and filename
     */
    private getInitialGuess;
    /**
     * Analyze content structure to determine type
     */
    private analyzeContent;
    /**
     * Check if content looks like JSON
     */
    private looksLikeJson;
    /**
     * Check if content looks like XML
     */
    private looksLikeXml;
    /**
     * Combine detection results from hints and analysis
     */
    private combineDetectionResults;
    /**
     * Create content info for forced type
     */
    private createForcedContentInfo;
}
//# sourceMappingURL=content-detector.d.ts.map