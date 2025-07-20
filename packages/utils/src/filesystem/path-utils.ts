/**
 * Path utilities for cross-platform file operations
 */

import { promises as fs, Stats } from 'fs';
import path from 'path';
import os from 'os';

export class PathUtils {
  /**
   * Normalize path for cross-platform compatibility
   */
  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Resolve path relative to a base directory
   */
  static resolve(basePath: string, relativePath: string): string {
    return path.resolve(basePath, relativePath);
  }

  /**
   * Check if path exists
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if path is a directory
   */
  static async isDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if path is a file
   */
  static async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists, create if necessary
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
      }
      throw new Error(`Failed to create directory ${dirPath}: ${String(error)}`);
    }
  }

  /**
   * Get file stats
   */
  static async getStats(filePath: string): Promise<Stats> {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get stats for ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to get stats for ${filePath}: ${String(error)}`);
    }
  }

  /**
   * Get relative path from base to target
   */
  static getRelativePath(basePath: string, targetPath: string): string {
    return path.relative(basePath, targetPath);
  }

  /**
   * Get file extension
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Get filename without extension
   */
  static getBasename(filePath: string, includeExtension = true): string {
    return includeExtension ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
  }

  /**
   * Get directory name
   */
  static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Join path segments
   */
  static join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Get home directory
   */
  static getHomeDirectory(): string {
    return os.homedir();
  }

  /**
   * Get temporary directory
   */
  static getTempDirectory(): string {
    return os.tmpdir();
  }

  /**
   * Get current working directory
   */
  static getCurrentDirectory(): string {
    return process.cwd();
  }

  /**
   * Validate path for security (prevent path traversal)
   */
  static validatePath(filePath: string, allowedBase?: string): boolean {
    const normalized = path.normalize(filePath);
    
    // Check for path traversal attempts
    if (normalized.includes('..')) {
      return false;
    }

    // If allowedBase is specified, ensure path is within it
    if (allowedBase) {
      const resolvedPath = path.resolve(normalized);
      const resolvedBase = path.resolve(allowedBase);
      return resolvedPath.startsWith(resolvedBase);
    }

    return true;
  }

  /**
   * Get safe path within a base directory
   */
  static getSafePath(basePath: string, relativePath: string): string {
    const resolved = path.resolve(basePath, relativePath);
    const normalized = path.normalize(resolved);
    
    if (!normalized.startsWith(path.resolve(basePath))) {
      throw new Error(`Path traversal detected: ${relativePath}`);
    }
    
    return normalized;
  }

  /**
   * Find files matching a pattern in a directory
   */
  static async findFiles(
    directory: string,
    pattern: RegExp | string,
    options: { recursive?: boolean; maxDepth?: number } = {}
  ): Promise<string[]> {
    const { recursive = false, maxDepth = 10 } = options;
    const files: string[] = [];
    
    const findInDirectory = async (dir: string, depth = 0): Promise<void> => {
      if (depth > maxDepth) return;
      
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isFile()) {
            const matches = typeof pattern === 'string' 
              ? entry.name.includes(pattern)
              : pattern.test(entry.name);
              
            if (matches) {
              files.push(fullPath);
            }
          } else if (entry.isDirectory() && recursive) {
            await findInDirectory(fullPath, depth + 1);
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };
    
    await findInDirectory(directory);
    return files.sort();
  }

  /**
   * Copy file with error handling
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    try {
      // Ensure destination directory exists
      await this.ensureDirectory(path.dirname(destination));
      await fs.copyFile(source, destination);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to copy file from ${source} to ${destination}: ${error.message}`);
      }
      throw new Error(`Failed to copy file from ${source} to ${destination}: ${String(error)}`);
    }
  }

  /**
   * Delete file or directory
   */
  static async delete(filePath: string, options: { recursive?: boolean } = {}): Promise<void> {
    const { recursive = false } = options;
    
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive });
      } else {
        await fs.unlink(filePath);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete ${filePath}: ${error.message}`);
      }
      throw new Error(`Failed to delete ${filePath}: ${String(error)}`);
    }
  }
}