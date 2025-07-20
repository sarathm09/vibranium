/**
 * JSON parser with enhanced error reporting and validation
 */
import { logger } from '@vibraniumjs/utils';
export class JsonParser {
    /**
     * Parse JSON content to JavaScript object
     */
    async parse(content, options = {}) {
        const { file, strict = true, allowComments = false } = options;
        try {
            logger.debug('Parsing JSON content', { file, length: content.length });
            let processedContent = content;
            // Remove comments if allowed (simple implementation)
            if (allowComments) {
                processedContent = this.removeComments(content);
            }
            // Parse JSON with enhanced error handling
            const result = JSON.parse(processedContent);
            // Additional validation for strict mode
            if (strict) {
                this.validateStrictJson(processedContent);
            }
            logger.debug('JSON parsing completed successfully', {
                file,
                type: Array.isArray(result) ? 'array' : typeof result,
                keys: result && typeof result === 'object' ? Object.keys(result) : 'non-object'
            });
            return result;
        }
        catch (error) {
            logger.error('JSON parsing failed', { error: error.message, file });
            if (error instanceof SyntaxError) {
                const position = this.extractErrorPosition(error.message, content);
                const enhancedError = new Error(`JSON syntax error: ${error.message}${file ? ` in ${file}` : ''}`);
                // Add position information
                if (position) {
                    enhancedError.mark = position;
                }
                throw enhancedError;
            }
            throw error;
        }
    }
    /**
     * Stringify JavaScript object to JSON
     */
    stringify(data, options = {}) {
        const { indent = 2, sorted = false } = options;
        try {
            if (sorted) {
                return JSON.stringify(data, this.createSortedReplacer(), indent);
            }
            return JSON.stringify(data, null, indent);
        }
        catch (error) {
            logger.error('JSON stringification failed', { error: error.message });
            throw new Error(`Failed to convert object to JSON: ${error.message}`);
        }
    }
    /**
     * Validate JSON syntax without full parsing
     */
    validateSyntax(content) {
        try {
            JSON.parse(content);
            return { valid: true };
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                const position = this.extractErrorPosition(error.message, content);
                return {
                    valid: false,
                    error: error.message,
                    line: position?.line,
                    column: position?.column
                };
            }
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown JSON error'
            };
        }
    }
    /**
     * Remove JSON comments - simple implementation
     */
    removeComments(content) {
        // This is a simplified comment removal - in production, use a proper JSON-with-comments parser
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, ''); // Remove line comments
    }
    /**
     * Extract error position from JSON parse error message
     */
    extractErrorPosition(message, content) {
        // Try to extract position from standard JSON error messages
        const positionMatch = message.match(/at position (\d+)/);
        if (positionMatch) {
            const position = parseInt(positionMatch[1], 10);
            return this.getLineColumnFromPosition(content, position);
        }
        // Try other common error message formats
        const lineMatch = message.match(/line (\d+)/);
        const columnMatch = message.match(/column (\d+)/);
        if (lineMatch && columnMatch) {
            return {
                line: parseInt(lineMatch[1], 10),
                column: parseInt(columnMatch[1], 10)
            };
        }
        return null;
    }
    /**
     * Convert character position to line/column
     */
    getLineColumnFromPosition(content, position) {
        const lines = content.substring(0, position).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }
    /**
     * Validate strict JSON format
     */
    validateStrictJson(content) {
        // Check for common JSON issues in strict mode
        const issues = [];
        // Check for trailing commas
        if (/,\s*[}\]]/.test(content)) {
            issues.push('Trailing commas are not allowed in strict JSON');
        }
        // Check for unquoted keys
        if (/[{,]\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(content)) {
            issues.push('Object keys must be quoted in strict JSON');
        }
        // Check for single quotes
        if (/'[^']*'/.test(content)) {
            issues.push('Single quotes are not allowed in strict JSON - use double quotes');
        }
        if (issues.length > 0) {
            throw new Error(`Strict JSON validation failed:\n${issues.join('\n')}`);
        }
    }
    /**
     * Create a replacer function for sorted JSON output
     */
    createSortedReplacer() {
        return (key, value) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const sorted = {};
                Object.keys(value).sort().forEach(sortedKey => {
                    sorted[sortedKey] = value[sortedKey];
                });
                return sorted;
            }
            return value;
        };
    }
}
//# sourceMappingURL=json-parser.js.map