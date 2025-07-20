/**
 * XML content parser with XPath query support
 */
export interface XmlParseOptions {
    strict?: boolean;
    ignoreWhitespace?: boolean;
    preserveCase?: boolean;
}
export interface XmlParseResult {
    document: Document;
    contentType: string;
    size: number;
    encoding?: string;
}
export interface XPathQueryResult {
    value: any;
    nodeType: number;
    nodeName?: string;
    textContent?: string;
    attributes?: Record<string, string>;
}
export declare class XmlContentParser {
    private parser;
    constructor();
    /**
     * Parse XML content from string or buffer
     */
    parse(content: string | Buffer, options?: XmlParseOptions): XmlParseResult;
    /**
     * Query XML document using XPath expressions
     */
    query(document: Document, xpathExpression: string, contextNode?: Node): XPathQueryResult[];
    /**
     * Extract single value using XPath
     */
    queryValue(document: Document, xpathExpression: string, defaultValue?: any): any;
    /**
     * Check if an XPath expression matches any nodes
     */
    pathExists(document: Document, xpathExpression: string): boolean;
    /**
     * Get all element paths in an XML document
     */
    getAllPaths(document: Document, options?: {
        includeAttributes?: boolean;
        maxDepth?: number;
    }): string[];
    /**
     * Convert XML node to plain object
     */
    nodeToObject(node: Node): any;
    /**
     * Validate XPath expression syntax
     */
    validateXPath(xpathExpression: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Extract attributes from a node
     */
    private extractAttributes;
    /**
     * Extract encoding from XML declaration
     */
    private extractEncoding;
    /**
     * Validate XML document for common issues
     */
    private validateXmlDocument;
}
//# sourceMappingURL=xml-parser.d.ts.map