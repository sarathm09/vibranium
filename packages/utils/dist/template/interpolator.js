/**
 * Template interpolation with variable substitution
 */
export class TemplateInterpolator {
    options;
    constructor(options = {}) {
        this.options = {
            openDelimiter: options.openDelimiter || '{{',
            closeDelimiter: options.closeDelimiter || '}}',
            escapeHtml: options.escapeHtml ?? false,
            allowUndefined: options.allowUndefined ?? true,
            throwOnMissing: options.throwOnMissing ?? false
        };
    }
    /**
     * Interpolate template with variables
     */
    interpolate(template, variables) {
        if (typeof template !== 'string') {
            return String(template);
        }
        const pattern = this.createPattern();
        return template.replace(pattern, (match, expression) => {
            try {
                const value = this.evaluateExpression(expression.trim(), variables);
                return this.formatValue(value);
            }
            catch (error) {
                if (this.options.throwOnMissing) {
                    throw error;
                }
                return this.options.allowUndefined ? match : '';
            }
        });
    }
    /**
     * Interpolate object recursively
     */
    interpolateObject(obj, variables) {
        if (typeof obj === 'string') {
            return this.interpolate(obj, variables);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.interpolateObject(item, variables));
        }
        if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.interpolateObject(value, variables);
            }
            return result;
        }
        return obj;
    }
    /**
     * Check if template contains variables
     */
    hasVariables(template) {
        const pattern = this.createPattern();
        return pattern.test(template);
    }
    /**
     * Extract variable names from template
     */
    extractVariables(template) {
        const pattern = this.createPattern();
        const variables = [];
        let match;
        while ((match = pattern.exec(template)) !== null) {
            const expression = match[1].trim();
            const variableName = this.extractVariableName(expression);
            if (variableName && !variables.includes(variableName)) {
                variables.push(variableName);
            }
        }
        return variables;
    }
    /**
     * Create regex pattern for matching variables
     */
    createPattern() {
        const open = this.escapeRegex(this.options.openDelimiter);
        const close = this.escapeRegex(this.options.closeDelimiter);
        return new RegExp(`${open}\\s*([^${close}]+)\\s*${close}`, 'g');
    }
    /**
     * Escape regex special characters
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Evaluate expression safely
     */
    evaluateExpression(expression, variables) {
        // Handle dot notation (e.g., user.name, response.data.id)
        if (expression.includes('.')) {
            return this.evaluateDotNotation(expression, variables);
        }
        // Simple variable lookup
        if (!(expression in variables)) {
            throw new Error(`Variable '${expression}' not found`);
        }
        return variables[expression];
    }
    /**
     * Evaluate dot notation expressions
     */
    evaluateDotNotation(expression, variables) {
        const parts = expression.split('.');
        let current = variables;
        for (const part of parts) {
            if (current === null || current === undefined) {
                throw new Error(`Cannot access property '${part}' of ${current}`);
            }
            if (typeof current !== 'object') {
                throw new Error(`Cannot access property '${part}' of ${typeof current}`);
            }
            // Handle array index access
            if (Array.isArray(current) && /^\d+$/.test(part)) {
                const index = parseInt(part, 10);
                if (index >= current.length) {
                    throw new Error(`Array index ${index} out of bounds`);
                }
                current = current[index];
            }
            // Handle object property access
            else if (part in current) {
                current = current[part];
            }
            else {
                throw new Error(`Property '${part}' not found in ${expression}`);
            }
        }
        return current;
    }
    /**
     * Extract the root variable name from an expression
     */
    extractVariableName(expression) {
        return expression.split('.')[0];
    }
    /**
     * Format value for output
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        let result = String(value);
        if (this.options.escapeHtml) {
            result = this.escapeHtml(result);
        }
        return result;
    }
    /**
     * Escape HTML characters
     */
    escapeHtml(str) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }
}
//# sourceMappingURL=interpolator.js.map