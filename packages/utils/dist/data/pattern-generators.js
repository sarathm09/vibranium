/**
 * Pattern-based generators for custom data formats
 */
export class PatternGenerators {
    config;
    mappings = new Map();
    constructor(config = {}) {
        this.config = config;
        this.setupDefaultMappings();
        this.setupCustomMappings();
    }
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
    generate(pattern) {
        let result = '';
        let i = 0;
        while (i < pattern.length) {
            const char = pattern[i];
            if (char === '{') {
                // Handle named placeholders: {name}
                const endIndex = pattern.indexOf('}', i);
                if (endIndex === -1) {
                    throw new Error(`Unterminated placeholder at position ${i}`);
                }
                const placeholder = pattern.substring(i + 1, endIndex);
                result += this.resolvePlaceholder(placeholder);
                i = endIndex + 1;
            }
            else if (char === '[') {
                // Handle character sets: [abc123]
                const endIndex = pattern.indexOf(']', i);
                if (endIndex === -1) {
                    throw new Error(`Unterminated character set at position ${i}`);
                }
                const charSet = pattern.substring(i + 1, endIndex);
                result += this.randomFromString(charSet);
                i = endIndex + 1;
            }
            else if (char === '(') {
                // Handle choices: (option1|option2|option3)
                const endIndex = this.findMatchingParen(pattern, i);
                if (endIndex === -1) {
                    throw new Error(`Unterminated choice group at position ${i}`);
                }
                const choices = pattern.substring(i + 1, endIndex).split('|');
                result += this.randomChoice(choices);
                i = endIndex + 1;
            }
            else if (char === '\\') {
                // Handle escape sequences
                if (i + 1 < pattern.length) {
                    result += pattern[i + 1];
                    i += 2;
                }
                else {
                    result += char;
                    i++;
                }
            }
            else {
                // Handle single character patterns
                result += this.resolvePatternChar(char);
                i++;
            }
        }
        return result;
    }
    /**
     * Generate multiple values based on pattern
     */
    generateMultiple(pattern, count) {
        return Array.from({ length: count }, () => this.generate(pattern));
    }
    /**
     * Generate data based on regex-like pattern
     */
    generateFromRegex(regexPattern) {
        // Convert common regex patterns to our pattern syntax
        let pattern = regexPattern;
        // Replace common regex patterns
        pattern = pattern.replace(/\\d/g, '#');
        pattern = pattern.replace(/\\w/g, 'X');
        pattern = pattern.replace(/\\s/g, ' ');
        pattern = pattern.replace(/\[0-9\]/g, '#');
        pattern = pattern.replace(/\[a-z\]/g, 'a');
        pattern = pattern.replace(/\[A-Z\]/g, 'A');
        pattern = pattern.replace(/\[a-zA-Z\]/g, 'a');
        pattern = pattern.replace(/\[a-zA-Z0-9\]/g, 'X');
        // Handle quantifiers
        pattern = this.expandQuantifiers(pattern);
        return this.generate(pattern);
    }
    /**
     * Generate formatted string (sprintf-like)
     */
    generateFormatted(format, ...args) {
        return format.replace(/%([sdifgc%])/g, (match, type) => {
            const arg = args.shift();
            switch (type) {
                case 's': return String(arg || this.generate('XXXXXXXX'));
                case 'd': return String(arg || this.randomNumber(1, 1000));
                case 'i': return String(arg || this.randomNumber(1, 100));
                case 'f': return String(arg || this.randomFloat(1, 100, 2));
                case 'g': return String(arg || this.randomFloat(1, 100, 2));
                case 'c': return String(arg || this.generate('A'));
                case '%': return '%';
                default: return match;
            }
        });
    }
    /**
     * Add custom placeholder mapping
     */
    addPlaceholder(name, generator) {
        this.mappings.set(name, generator);
    }
    /**
     * Remove custom placeholder
     */
    removePlaceholder(name) {
        this.mappings.delete(name);
    }
    /**
     * Get available placeholders
     */
    getAvailablePlaceholders() {
        return Array.from(this.mappings.keys()).sort();
    }
    /**
     * Validate pattern syntax
     */
    validatePattern(pattern) {
        const errors = [];
        let i = 0;
        const stack = [];
        while (i < pattern.length) {
            const char = pattern[i];
            if (char === '{') {
                const endIndex = pattern.indexOf('}', i);
                if (endIndex === -1) {
                    errors.push(`Unterminated placeholder at position ${i}`);
                }
                else {
                    const placeholder = pattern.substring(i + 1, endIndex);
                    if (!this.mappings.has(placeholder)) {
                        errors.push(`Unknown placeholder '${placeholder}' at position ${i}`);
                    }
                    i = endIndex;
                }
            }
            else if (char === '[') {
                const endIndex = pattern.indexOf(']', i);
                if (endIndex === -1) {
                    errors.push(`Unterminated character set at position ${i}`);
                }
                else {
                    i = endIndex;
                }
            }
            else if (char === '(') {
                stack.push('(');
                const endIndex = this.findMatchingParen(pattern, i);
                if (endIndex === -1) {
                    errors.push(`Unterminated choice group at position ${i}`);
                }
            }
            else if (char === ')') {
                if (stack.length === 0 || stack.pop() !== '(') {
                    errors.push(`Unmatched closing parenthesis at position ${i}`);
                }
            }
            i++;
        }
        if (stack.length > 0) {
            errors.push('Unmatched opening parenthesis');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Resolve single pattern character
     */
    resolvePatternChar(char) {
        switch (char) {
            case '#':
                return this.randomNumber(0, 9).toString();
            case 'A':
                return this.randomFromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            case 'a':
                return this.randomFromString('abcdefghijklmnopqrstuvwxyz');
            case 'X':
                return this.randomFromString('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
            case '?':
                return this.randomFromString('!@#$%^&*()_+-=[]{}|;:,.<>?');
            default:
                return char; // Return the character as-is
        }
    }
    /**
     * Resolve named placeholder
     */
    resolvePlaceholder(name) {
        const mapping = this.mappings.get(name);
        if (!mapping) {
            throw new Error(`Unknown placeholder: ${name}`);
        }
        if (typeof mapping === 'string') {
            return this.generate(mapping);
        }
        else if (Array.isArray(mapping)) {
            return this.randomChoice(mapping);
        }
        else if (typeof mapping === 'function') {
            return mapping();
        }
        return String(mapping);
    }
    /**
     * Generate random number
     */
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * Generate random float
     */
    randomFloat(min, max, decimals) {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    }
    /**
     * Get random character from string
     */
    randomFromString(str) {
        return str.charAt(Math.floor(Math.random() * str.length));
    }
    /**
     * Get random choice from array
     */
    randomChoice(choices) {
        return choices[Math.floor(Math.random() * choices.length)];
    }
    /**
     * Find matching parenthesis
     */
    findMatchingParen(str, startIndex) {
        let count = 1;
        let i = startIndex + 1;
        while (i < str.length && count > 0) {
            if (str[i] === '(') {
                count++;
            }
            else if (str[i] === ')') {
                count--;
            }
            i++;
        }
        return count === 0 ? i - 1 : -1;
    }
    /**
     * Expand regex quantifiers to our pattern syntax
     */
    expandQuantifiers(pattern) {
        // Handle {n} quantifiers
        pattern = pattern.replace(/(.)\{(\d+)\}/g, (match, char, count) => {
            return char.repeat(parseInt(count));
        });
        // Handle {n,m} quantifiers (use average)
        pattern = pattern.replace(/(.)\{(\d+),(\d+)\}/g, (match, char, min, max) => {
            const count = Math.floor((parseInt(min) + parseInt(max)) / 2);
            return char.repeat(count);
        });
        // Handle + quantifier (1 or more, use 3)
        pattern = pattern.replace(/(.)\+/g, '$1$1$1');
        // Handle * quantifier (0 or more, use 2)
        pattern = pattern.replace(/(.)\*/g, '$1$1');
        // Handle ? quantifier (0 or 1, use 1)
        pattern = pattern.replace(/(.)\?/g, '$1');
        return pattern;
    }
    /**
     * Setup default placeholder mappings
     */
    setupDefaultMappings() {
        // Basic data types
        this.mappings.set('uuid', () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        });
        this.mappings.set('email', () => {
            return `${this.generate('aaaaaaaa')}@${this.generate('aaaaaa')}.com`;
        });
        this.mappings.set('phone', () => this.generate('###-###-####'));
        this.mappings.set('ssn', () => this.generate('###-##-####'));
        this.mappings.set('creditCard', () => this.generate('####-####-####-####'));
        this.mappings.set('zipCode', () => this.generate('#####'));
        // Names
        this.mappings.set('firstName', [
            'John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Edward', 'Fiona',
            'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Linda', 'Michael', 'Nancy'
        ]);
        this.mappings.set('lastName', [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'
        ]);
        this.mappings.set('fullName', () => {
            const first = this.resolvePlaceholder('firstName');
            const last = this.resolvePlaceholder('lastName');
            return `${first} ${last}`;
        });
        // Dates and times
        this.mappings.set('date', () => {
            const year = this.randomNumber(2020, 2024);
            const month = this.randomNumber(1, 12).toString().padStart(2, '0');
            const day = this.randomNumber(1, 28).toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        });
        this.mappings.set('time', () => {
            const hour = this.randomNumber(0, 23).toString().padStart(2, '0');
            const minute = this.randomNumber(0, 59).toString().padStart(2, '0');
            return `${hour}:${minute}`;
        });
        this.mappings.set('timestamp', () => new Date().toISOString());
        // Internet-related
        this.mappings.set('domain', () => `${this.generate('aaaaaa')}.com`);
        this.mappings.set('url', () => `https://${this.resolvePlaceholder('domain')}`);
        this.mappings.set('ipAddress', () => this.generate('###.###.###.###'));
        this.mappings.set('macAddress', () => this.generate('XX:XX:XX:XX:XX:XX'));
        // Business
        this.mappings.set('company', [
            'Acme Corp', 'Global Tech', 'Innovative Solutions', 'Dynamic Systems',
            'Advanced Technologies', 'Premier Services', 'Elite Consulting'
        ]);
        this.mappings.set('department', [
            'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations',
            'Customer Service', 'Research', 'Design', 'Legal'
        ]);
        // Lorem ipsum
        this.mappings.set('loremWord', [
            'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
            'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore'
        ]);
        this.mappings.set('loremSentence', () => {
            const words = Array.from({ length: this.randomNumber(5, 12) }, () => this.resolvePlaceholder('loremWord'));
            return words.join(' ') + '.';
        });
    }
    /**
     * Setup custom mappings from config
     */
    setupCustomMappings() {
        if (this.config.customMappings) {
            for (const [name, mapping] of Object.entries(this.config.customMappings)) {
                this.mappings.set(name, mapping);
            }
        }
    }
}
//# sourceMappingURL=pattern-generators.js.map