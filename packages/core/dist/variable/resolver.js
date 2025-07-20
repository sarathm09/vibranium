/**
 * Dot notation variable resolver ($.env, $.global, $.context, $.response, $.api, $.random, $.<alias>)
 */
import { logger } from '@vibraniumjs/utils';
import { VariableCache } from './cache';
import { NamespaceManager } from './namespace-manager';
export class VariableResolver {
    cache;
    namespaceManager;
    options;
    constructor(options = {}) {
        this.options = {
            enableCache: true,
            maxDepth: 10,
            allowCircular: false,
            defaultNamespace: 'context',
            ...options
        };
        this.cache = new VariableCache({
            enabled: this.options.enableCache,
            maxSize: 1000,
            ttl: 60000 // 1 minute
        });
        this.namespaceManager = new NamespaceManager();
    }
    /**
     * Resolve a dot notation variable reference
     */
    resolve(reference, context, options = {}) {
        const { depth = 0, visited = new Set() } = options;
        try {
            // Check recursion depth
            if (depth > this.options.maxDepth) {
                throw new Error(`Maximum resolution depth (${this.options.maxDepth}) exceeded for: ${reference}`);
            }
            // Check for circular references
            if (!this.options.allowCircular && visited.has(reference)) {
                throw new Error(`Circular reference detected: ${reference}`);
            }
            visited.add(reference);
            // Check cache first
            if (this.options.enableCache) {
                const cached = this.cache.get(reference, context);
                if (cached !== undefined) {
                    logger.debug('Variable resolved from cache', { reference });
                    return cached;
                }
            }
            // Parse the reference
            const parsed = this.parseReference(reference);
            logger.debug('Resolving variable', { reference, parsed });
            // Resolve the value
            const value = this.resolveValue(parsed, context, { depth: depth + 1, visited: new Set(visited) });
            // Cache the result
            if (this.options.enableCache && value !== undefined) {
                this.cache.set(reference, value, context);
            }
            return value;
        }
        catch (error) {
            logger.error('Variable resolution failed', { reference, error: error.message });
            throw new Error(`Failed to resolve variable '${reference}': ${error.message}`);
        }
    }
    /**
     * Resolve multiple variables in batch
     */
    resolveMultiple(references, context) {
        const results = {};
        references.forEach(ref => {
            try {
                results[ref] = this.resolve(ref, context);
            }
            catch (error) {
                logger.warn('Failed to resolve variable in batch', { reference: ref, error: error.message });
                results[ref] = undefined;
            }
        });
        return results;
    }
    /**
     * Check if a value is resolvable
     */
    isResolvable(reference, context) {
        try {
            this.resolve(reference, context);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get all available variable references in context
     */
    getAvailableReferences(context) {
        const references = [];
        Object.keys(context).forEach(namespace => {
            const namespaceData = context[namespace];
            if (typeof namespaceData === 'object' && namespaceData !== null) {
                this.collectReferences(namespaceData, `$.${namespace}`, references);
            }
        });
        return references.sort();
    }
    /**
     * Clear resolver cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Parse a dot notation reference
     */
    parseReference(reference) {
        // Remove $. prefix if present
        const normalized = reference.startsWith('$.') ? reference.substring(2) : reference;
        if (!normalized) {
            throw new Error('Empty variable reference');
        }
        const parts = normalized.split('.');
        const namespace = parts[0];
        const path = parts.slice(1);
        if (!namespace) {
            throw new Error('Variable reference must include namespace');
        }
        return { namespace, path };
    }
    /**
     * Resolve value from parsed reference
     */
    resolveValue(parsed, context, options) {
        const { namespace, path } = parsed;
        // Get namespace data
        const namespaceData = context[namespace];
        if (namespaceData === undefined) {
            throw new Error(`Namespace '${namespace}' not found`);
        }
        // If no path, return entire namespace
        if (path.length === 0) {
            return namespaceData;
        }
        // Traverse the path
        let current = namespaceData;
        const traversedPath = [];
        for (const segment of path) {
            traversedPath.push(segment);
            if (current === null || current === undefined) {
                throw new Error(`Cannot access property '${segment}' of ${current} at path: $.${namespace}.${traversedPath.join('.')}`);
            }
            if (typeof current !== 'object') {
                throw new Error(`Cannot access property '${segment}' of non-object value at path: $.${namespace}.${traversedPath.slice(0, -1).join('.')}`);
            }
            // Handle array indices
            if (Array.isArray(current)) {
                const index = parseInt(segment, 10);
                if (isNaN(index)) {
                    throw new Error(`Invalid array index '${segment}' at path: $.${namespace}.${traversedPath.join('.')}`);
                }
                current = current[index];
            }
            else {
                current = current[segment];
            }
        }
        // If the result is a string with variable references, resolve recursively
        if (typeof current === 'string' && current.includes('$.')) {
            return this.resolveNestedReferences(current, context, options);
        }
        return current;
    }
    /**
     * Resolve nested variable references in a string
     */
    resolveNestedReferences(value, context, options) {
        // Look for variable references in the string
        const variablePattern = /\$\.[\w\.]+/g;
        const matches = value.match(variablePattern);
        if (!matches) {
            return value;
        }
        let resolved = value;
        for (const match of matches) {
            try {
                const resolvedValue = this.resolve(match, context, options);
                // If the entire string is just the variable reference, return the resolved value directly
                if (value.trim() === match) {
                    return resolvedValue;
                }
                // Replace the reference with the resolved value (as string)
                resolved = resolved.replace(match, String(resolvedValue));
            }
            catch (error) {
                logger.warn('Failed to resolve nested reference', { reference: match, error: error.message });
                // Leave the reference unresolved
            }
        }
        return resolved;
    }
    /**
     * Recursively collect all available references
     */
    collectReferences(obj, prefix, references, maxDepth = 5, currentDepth = 0) {
        if (currentDepth >= maxDepth || obj === null || typeof obj !== 'object') {
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                const path = `${prefix}[${index}]`;
                references.push(path);
                this.collectReferences(item, path, references, maxDepth, currentDepth + 1);
            });
        }
        else {
            Object.keys(obj).forEach(key => {
                const path = `${prefix}.${key}`;
                references.push(path);
                this.collectReferences(obj[key], path, references, maxDepth, currentDepth + 1);
            });
        }
    }
}
//# sourceMappingURL=resolver.js.map