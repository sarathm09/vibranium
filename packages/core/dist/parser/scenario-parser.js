/**
 * Main scenario parser that coordinates YAML/JSON parsing and validation
 */
import { YamlParser } from './yaml-parser';
import { JsonParser } from './json-parser';
import { SchemaValidator } from './schema-validator';
import { logger } from '@vibraniumjs/utils';
export class ScenarioParser {
    yamlParser = new YamlParser();
    jsonParser = new JsonParser();
    validator = new SchemaValidator();
    /**
     * Parse scenario from content string
     */
    async parse(content, options = {}) {
        const { format = 'auto', file, validate = true } = options;
        try {
            // Determine format if auto-detection requested
            const detectedFormat = format === 'auto'
                ? this.detectFormat(content, file)
                : format;
            logger.debug(`Parsing scenario`, { format: detectedFormat, file });
            // Parse content based on format
            let parsed;
            if (detectedFormat === 'yaml') {
                parsed = await this.yamlParser.parse(content, { file });
            }
            else {
                parsed = await this.jsonParser.parse(content, { file });
            }
            // Validate if requested
            const warnings = [];
            if (validate) {
                const validationResult = await this.validator.validate(parsed);
                if (!validationResult.valid) {
                    throw new Error(`Scenario validation failed:\n${validationResult.errors.join('\n')}`);
                }
                warnings.push(...validationResult.warnings);
            }
            // Convert to strongly typed scenario
            const scenario = this.normalizeScenario(parsed);
            return {
                scenario,
                warnings,
                source: {
                    format: detectedFormat,
                    content,
                    file
                }
            };
        }
        catch (error) {
            const parseError = {
                message: error instanceof Error ? error.message : 'Unknown parsing error',
                file
            };
            // Extract line/column info if available
            if (error instanceof Error && 'mark' in error) {
                const mark = error.mark;
                parseError.line = mark?.line + 1;
                parseError.column = mark?.column + 1;
            }
            throw parseError;
        }
    }
    /**
     * Parse scenario from file
     */
    async parseFile(filePath, options = {}) {
        const fs = await import('fs/promises');
        const content = await fs.readFile(filePath, 'utf8');
        return this.parse(content, { ...options, file: filePath });
    }
    /**
     * Parse multiple scenarios from content (array format)
     */
    async parseMultiple(content, options = {}) {
        const result = await this.parse(content, options);
        // Check if the parsed content is an array of scenarios
        if (Array.isArray(result.scenario)) {
            return result.scenario.map((scenario, index) => ({
                scenario: this.normalizeScenario(scenario),
                warnings: result.warnings,
                source: {
                    ...result.source,
                    content: `[${index}] from ${result.source.file || 'content'}`
                }
            }));
        }
        return [result];
    }
    /**
     * Validate scenario without parsing
     */
    async validate(scenario) {
        return this.validator.validate(scenario);
    }
    /**
     * Detect format from content or filename
     */
    detectFormat(content, file) {
        // Check file extension first
        if (file) {
            const ext = file.toLowerCase();
            if (ext.endsWith('.yaml') || ext.endsWith('.yml')) {
                return 'yaml';
            }
            if (ext.endsWith('.json')) {
                return 'json';
            }
        }
        // Analyze content structure
        const trimmed = content.trim();
        // JSON typically starts with { or [
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return 'json';
        }
        // YAML detection - look for YAML-specific syntax
        if (trimmed.includes(':\n') ||
            trimmed.includes(': ') ||
            trimmed.includes('- ') ||
            /^\w+:/m.test(trimmed)) {
            return 'yaml';
        }
        // Default to YAML for ambiguous content
        return 'yaml';
    }
    /**
     * Normalize parsed data to Scenario interface
     */
    normalizeScenario(data) {
        // Ensure required fields exist with defaults
        return {
            name: data.name || 'Unnamed Scenario',
            description: data.description,
            version: data.version || '1.0',
            environment: data.environment,
            variables: data.variables || {},
            steps: data.steps || [],
            hooks: data.hooks,
            config: data.config || {},
            metadata: data.metadata || {},
            timeout: data.timeout,
            ...data
        };
    }
}
//# sourceMappingURL=scenario-parser.js.map