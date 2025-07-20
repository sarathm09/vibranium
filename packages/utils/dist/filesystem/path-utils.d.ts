/**
 * Path utilities for cross-platform file operations
 */
import { Stats } from 'fs';
export declare class PathUtils {
    /**
     * Normalize path for cross-platform compatibility
     */
    static normalize(filePath: string): string;
    /**
     * Resolve path relative to a base directory
     */
    static resolve(basePath: string, relativePath: string): string;
    /**
     * Check if path exists
     */
    static exists(filePath: string): Promise<boolean>;
    /**
     * Check if path is a directory
     */
    static isDirectory(filePath: string): Promise<boolean>;
    /**
     * Check if path is a file
     */
    static isFile(filePath: string): Promise<boolean>;
    /**
     * Ensure directory exists, create if necessary
     */
    static ensureDirectory(dirPath: string): Promise<void>;
    /**
     * Get file stats
     */
    static getStats(filePath: string): Promise<Stats>;
    /**
     * Get relative path from base to target
     */
    static getRelativePath(basePath: string, targetPath: string): string;
    /**
     * Get file extension
     */
    static getExtension(filePath: string): string;
    /**
     * Get filename without extension
     */
    static getBasename(filePath: string, includeExtension?: boolean): string;
    /**
     * Get directory name
     */
    static getDirname(filePath: string): string;
    /**
     * Join path segments
     */
    static join(...segments: string[]): string;
    /**
     * Get home directory
     */
    static getHomeDirectory(): string;
    /**
     * Get temporary directory
     */
    static getTempDirectory(): string;
    /**
     * Get current working directory
     */
    static getCurrentDirectory(): string;
    /**
     * Validate path for security (prevent path traversal)
     */
    static validatePath(filePath: string, allowedBase?: string): boolean;
    /**
     * Get safe path within a base directory
     */
    static getSafePath(basePath: string, relativePath: string): string;
    /**
     * Find files matching a pattern in a directory
     */
    static findFiles(directory: string, pattern: RegExp | string, options?: {
        recursive?: boolean;
        maxDepth?: number;
    }): Promise<string[]>;
    /**
     * Copy file with error handling
     */
    static copyFile(source: string, destination: string): Promise<void>;
    /**
     * Delete file or directory
     */
    static delete(filePath: string, options?: {
        recursive?: boolean;
    }): Promise<void>;
}
//# sourceMappingURL=path-utils.d.ts.map