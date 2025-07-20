/**
 * YAML parser with error handling and line/column tracking
 */
import * as yaml from 'yaml';
import { logger } from '@vibraniumjs/utils';
export class YamlParser {
    /**
     * Parse YAML content to JavaScript object
     */
    async parse(content, options = {}) {
        const { file, strict = true } = options;
        try {
            logger.debug('Parsing YAML content', { file, length: content.length });
            // Configure YAML parser
            const document = yaml.parseDocument(content, {
                strict,
                uniqueKeys: true,
                schema: 'core',
                merge: false,
                version: '1.2'
            });
            // Check for parsing errors
            if (document.errors.length > 0) {
                const error = document.errors[0];
                const yamlError = new Error(`YAML parsing error: ${error.message}${file ? ` in ${file}` : ''}`);
                // Add position information for better error reporting
                if (error.pos) {
                    yamlError.mark = {
                        line: error.pos[0],
                        column: error.pos[1]
                    };
                }
                throw yamlError;
            }
            // Check for warnings
            if (document.warnings.length > 0) {
                document.warnings.forEach(warning => {
                    logger.warn('YAML warning', {
                        message: warning.message,
                        file,
                        line: warning.pos?.[0],
                        column: warning.pos?.[1]
                    });
                });
            }
            const result = document.toJS();
            logger.debug('YAML parsing completed successfully', {
                file,
                keys: result && typeof result === 'object' ? Object.keys(result) : 'non-object'
            });
            return result;
        }
        catch (error) {
            logger.error('YAML parsing failed', { error: error.message, file });
            if (error instanceof yaml.YAMLParseError) {
                const enhancedError = new Error(`YAML syntax error: ${error.message}${file ? ` in ${file}` : ''}`);
                // Preserve original error details
                enhancedError.mark = {
                    line: error.linePos?.[0]?.line || 0,
                    column: error.linePos?.[0]?.col || 0
                };
                throw enhancedError;
            }
            throw error;
        }
    }
    /**
     * Stringify JavaScript object to YAML
     */
    stringify(data, options = {}) {
        const { indent = 2, flow = false } = options;
        try {
            return yaml.stringify(data, {
                indent,
                defaultFlowStyle: flow,
                lineWidth: 120,
                minContentWidth: 40,
                doubleQuotedAsJSON: false,
                doubleQuotedMinMultiLineLength: 40,
                falseStr: 'false',
                nullStr: 'null',
                trueStr: 'true'
            });
        }
        catch (error) {
            logger.error('YAML stringification failed', { error: error.message });
            throw new Error(`Failed to convert object to YAML: ${error.message}`);
        }
    }
    /**
     * Validate YAML syntax without full parsing
     */
    validateSyntax(content) {
        try {
            const document = yaml.parseDocument(content, { strict: true });
            if (document.errors.length > 0) {
                const error = document.errors[0];
                return {
                    valid: false,
                    error: error.message,
                    line: error.pos?.[0],
                    column: error.pos?.[1]
                };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown YAML error'
            };
        }
    }
}
//# sourceMappingURL=yaml-parser.js.map