/**
 * Pattern-based generators for custom data formats
 */
export interface PatternConfig {
    seed?: number;
    locale?: string;
    customMappings?: Record<string, string | string[] | (() => string)>;
}
export declare class PatternGenerators {
    private config;
    private mappings;
    constructor(config?: PatternConfig);
    /**
     * Generate data based on a pattern string
     *
     * Pattern syntax:
     * # - Random digit (0-9)
     * A - Random uppercase letter (A-Z)
     * a - Random lowercase letter (a-z)
     * X - Random alphanumeric character
     * ? - Random character from custom set
     * {name} - Named placeholder (e.g., {firstName}, {lastName})
     * [abc] - Random character from set
     * (option1|option2) - Random choice from options
     */
    generate(pattern: string): string;
    /**
     * Generate multiple values based on pattern
     */
    generateMultiple(pattern: string, count: number): string[];
    /**
     * Generate data based on regex-like pattern
     */
    generateFromRegex(regexPattern: string): string;
    /**
     * Generate formatted string (sprintf-like)
     */
    generateFormatted(format: string, ...args: any[]): string;
    /**
     * Add custom placeholder mapping
     */
    addPlaceholder(name: string, generator: string | string[] | (() => string)): void;
    /**
     * Remove custom placeholder
     */
    removePlaceholder(name: string): void;
    /**
     * Get available placeholders
     */
    getAvailablePlaceholders(): string[];
    /**
     * Validate pattern syntax
     */
    validatePattern(pattern: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Resolve single pattern character
     */
    private resolvePatternChar;
    /**
     * Resolve named placeholder
     */
    private resolvePlaceholder;
    /**
     * Generate random number
     */
    private randomNumber;
    /**
     * Generate random float
     */
    private randomFloat;
    /**
     * Get random character from string
     */
    private randomFromString;
    /**
     * Get random choice from array
     */
    private randomChoice;
    /**
     * Find matching parenthesis
     */
    private findMatchingParen;
    /**
     * Expand regex quantifiers to our pattern syntax
     */
    private expandQuantifiers;
    /**
     * Setup default placeholder mappings
     */
    private setupDefaultMappings;
    /**
     * Setup custom mappings from config
     */
    private setupCustomMappings;
}
//# sourceMappingURL=pattern-generators.d.ts.map