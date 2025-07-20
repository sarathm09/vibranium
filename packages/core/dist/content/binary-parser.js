/**
 * Binary content parser for buffer/stream responses
 */
import { logger } from '@vibraniumjs/utils';
export class BinaryContentParser {
    static FILE_SIGNATURES = [
        // Images
        { signature: [0xFF, 0xD8, 0xFF], mimeType: 'image/jpeg', extension: 'jpg', description: 'JPEG Image' },
        { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mimeType: 'image/png', extension: 'png', description: 'PNG Image' },
        { signature: [0x47, 0x49, 0x46, 0x38], mimeType: 'image/gif', extension: 'gif', description: 'GIF Image' },
        { signature: [0x42, 0x4D], mimeType: 'image/bmp', extension: 'bmp', description: 'BMP Image' },
        { signature: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp', extension: 'webp', description: 'WebP Image' },
        // Documents
        { signature: [0x25, 0x50, 0x44, 0x46], mimeType: 'application/pdf', extension: 'pdf', description: 'PDF Document' },
        { signature: [0x50, 0x4B, 0x03, 0x04], mimeType: 'application/zip', extension: 'zip', description: 'ZIP Archive' },
        { signature: [0x50, 0x4B, 0x05, 0x06], mimeType: 'application/zip', extension: 'zip', description: 'ZIP Archive (empty)' },
        { signature: [0x50, 0x4B, 0x07, 0x08], mimeType: 'application/zip', extension: 'zip', description: 'ZIP Archive (spanned)' },
        // Office documents (ZIP-based)
        { signature: [0x50, 0x4B], mimeType: 'application/vnd.openxmlformats-officedocument', extension: 'docx', description: 'Office Document' },
        // Archives
        { signature: [0x1F, 0x8B, 0x08], mimeType: 'application/gzip', extension: 'gz', description: 'GZIP Archive' },
        { signature: [0x42, 0x5A, 0x68], mimeType: 'application/x-bzip2', extension: 'bz2', description: 'BZIP2 Archive' },
        { signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], mimeType: 'application/x-7z-compressed', extension: '7z', description: '7-Zip Archive' },
        // Executable
        { signature: [0x4D, 0x5A], mimeType: 'application/x-msdownload', extension: 'exe', description: 'Windows Executable' },
        { signature: [0x7F, 0x45, 0x4C, 0x46], mimeType: 'application/x-executable', extension: 'elf', description: 'ELF Executable' },
        // Media
        { signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], mimeType: 'video/mp4', extension: 'mp4', description: 'MP4 Video' },
        { signature: [0x49, 0x44, 0x33], mimeType: 'audio/mpeg', extension: 'mp3', description: 'MP3 Audio' },
        { signature: [0xFF, 0xFB], mimeType: 'audio/mpeg', extension: 'mp3', description: 'MP3 Audio (MPEG-1 Layer 3)' },
        { signature: [0x4F, 0x67, 0x67, 0x53], mimeType: 'audio/ogg', extension: 'ogg', description: 'OGG Audio' },
    ];
    /**
     * Parse binary content from buffer
     */
    parse(content, options = {}) {
        const { maxSize = 50 * 1024 * 1024, preserveBuffer = true } = options; // 50MB default limit
        try {
            logger.debug('Parsing binary content', {
                size: content.length,
                maxSize
            });
            // Check size limit
            if (content.length > maxSize) {
                throw new Error(`Binary content too large: ${content.length} bytes (max: ${maxSize})`);
            }
            // Detect file type and metadata
            const metadata = this.analyzeContent(content);
            const result = {
                buffer: preserveBuffer ? content : Buffer.alloc(0),
                size: content.length,
                contentType: metadata.mimeType || 'application/octet-stream',
                metadata
            };
            logger.debug('Binary parsing successful', {
                size: result.size,
                mimeType: metadata.mimeType,
                isText: metadata.isText,
                isImage: metadata.isImage
            });
            return result;
        }
        catch (error) {
            logger.error('Binary parsing failed', { error: error.message });
            throw new Error(`Binary parsing failed: ${error.message}`);
        }
    }
    /**
     * Detect file type from buffer
     */
    detectFileType(buffer) {
        for (const signature of BinaryContentParser.FILE_SIGNATURES) {
            if (this.matchesSignature(buffer, signature.signature)) {
                return signature;
            }
        }
        return null;
    }
    /**
     * Check if buffer contains text content
     */
    isTextContent(buffer, sampleSize = 1024) {
        const sample = buffer.subarray(0, Math.min(sampleSize, buffer.length));
        // Check for null bytes (common in binary files)
        for (let i = 0; i < sample.length; i++) {
            if (sample[i] === 0) {
                return false;
            }
        }
        // Check for high ratio of printable ASCII characters
        let printableCount = 0;
        for (let i = 0; i < sample.length; i++) {
            const byte = sample[i];
            if ((byte >= 0x20 && byte <= 0x7E) || // Printable ASCII
                byte === 0x09 || // Tab
                byte === 0x0A || // Line feed
                byte === 0x0D // Carriage return
            ) {
                printableCount++;
            }
        }
        const printableRatio = printableCount / sample.length;
        return printableRatio > 0.7; // 70% threshold
    }
    /**
     * Extract buffer as specific data type
     */
    extractAs(buffer, format) {
        switch (format) {
            case 'base64':
                return buffer.toString('base64');
            case 'hex':
                return buffer.toString('hex');
            case 'utf8':
                return buffer.toString('utf8');
            case 'ascii':
                return buffer.toString('ascii');
            case 'binary':
                return buffer.toString('binary');
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    /**
     * Get buffer statistics
     */
    getBufferStats(buffer) {
        const stats = {
            size: buffer.length,
            entropy: 0,
            nullBytes: 0,
            printableBytes: 0,
            uniqueBytes: 0
        };
        if (buffer.length === 0) {
            return stats;
        }
        // Count byte frequencies
        const frequencies = new Array(256).fill(0);
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            frequencies[byte]++;
            if (byte === 0) {
                stats.nullBytes++;
            }
            if ((byte >= 0x20 && byte <= 0x7E) ||
                byte === 0x09 || byte === 0x0A || byte === 0x0D) {
                stats.printableBytes++;
            }
        }
        // Calculate entropy (Shannon entropy)
        let entropy = 0;
        let uniqueCount = 0;
        for (let i = 0; i < 256; i++) {
            if (frequencies[i] > 0) {
                uniqueCount++;
                const probability = frequencies[i] / buffer.length;
                entropy -= probability * Math.log2(probability);
            }
        }
        stats.entropy = entropy;
        stats.uniqueBytes = uniqueCount;
        return stats;
    }
    /**
     * Compare two buffers
     */
    compareBuffers(buffer1, buffer2) {
        const maxLength = Math.max(buffer1.length, buffer2.length);
        let differences = Math.abs(buffer1.length - buffer2.length);
        const minLength = Math.min(buffer1.length, buffer2.length);
        for (let i = 0; i < minLength; i++) {
            if (buffer1[i] !== buffer2[i]) {
                differences++;
            }
        }
        const similarity = maxLength > 0 ? 1 - (differences / maxLength) : 1;
        return {
            equal: buffer1.equals(buffer2),
            differences,
            similarity
        };
    }
    /**
     * Analyze buffer content to determine metadata
     */
    analyzeContent(buffer) {
        const fileType = this.detectFileType(buffer);
        const isText = this.isTextContent(buffer);
        return {
            isText,
            isImage: fileType?.mimeType.startsWith('image/') || false,
            isArchive: (fileType?.mimeType.includes('zip') ||
                fileType?.mimeType.includes('gzip') ||
                fileType?.mimeType.includes('7z') ||
                fileType?.mimeType.includes('bzip')) || false,
            mimeType: fileType?.mimeType,
            fileSignature: fileType?.description,
            encoding: isText ? 'utf8' : undefined
        };
    }
    /**
     * Check if buffer matches a file signature
     */
    matchesSignature(buffer, signature) {
        if (buffer.length < signature.length) {
            return false;
        }
        for (let i = 0; i < signature.length; i++) {
            if (buffer[i] !== signature[i]) {
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=binary-parser.js.map