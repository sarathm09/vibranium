/**
 * Binary content parser for buffer/stream responses
 */
export interface BinaryParseOptions {
    maxSize?: number;
    preserveBuffer?: boolean;
}
export interface BinaryParseResult {
    buffer: Buffer;
    size: number;
    contentType: string;
    metadata: {
        encoding?: string;
        isText: boolean;
        isImage: boolean;
        isArchive: boolean;
        mimeType?: string;
        fileSignature?: string;
    };
}
export interface FileSignature {
    signature: number[];
    mimeType: string;
    extension: string;
    description: string;
}
export declare class BinaryContentParser {
    private static readonly FILE_SIGNATURES;
    /**
     * Parse binary content from buffer
     */
    parse(content: Buffer, options?: BinaryParseOptions): BinaryParseResult;
    /**
     * Detect file type from buffer
     */
    detectFileType(buffer: Buffer): FileSignature | null;
    /**
     * Check if buffer contains text content
     */
    isTextContent(buffer: Buffer, sampleSize?: number): boolean;
    /**
     * Extract buffer as specific data type
     */
    extractAs(buffer: Buffer, format: 'base64' | 'hex' | 'utf8' | 'ascii' | 'binary'): string;
    /**
     * Get buffer statistics
     */
    getBufferStats(buffer: Buffer): {
        size: number;
        entropy: number;
        nullBytes: number;
        printableBytes: number;
        uniqueBytes: number;
    };
    /**
     * Compare two buffers
     */
    compareBuffers(buffer1: Buffer, buffer2: Buffer): {
        equal: boolean;
        differences: number;
        similarity: number;
    };
    /**
     * Analyze buffer content to determine metadata
     */
    private analyzeContent;
    /**
     * Check if buffer matches a file signature
     */
    private matchesSignature;
}
//# sourceMappingURL=binary-parser.d.ts.map