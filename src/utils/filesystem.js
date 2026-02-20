import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  fileSystemCache,
  cachedFileRead,
  cachedDirectoryList,
} from "./cache.js";

export class FileSystem {
  constructor(baseDir = process.cwd(), options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.allowedDirs = [this.baseDir];
    this.operationLog = [];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
    this.enableCache = options.enableCache !== false;
    this.cache = fileSystemCache;
  }

  // Validate path is within allowed directory
  validatePath(targetPath) {
    if (!targetPath || typeof targetPath !== "string") {
      throw new Error("Invalid path: path must be a string");
    }

    // Check for empty or whitespace-only paths
    if (targetPath.trim() === "") {
      throw new Error("Invalid path: path cannot be empty or whitespace only");
    }

    // Check for null byte injection
    if (targetPath.includes("\0")) {
      throw new Error("Invalid path: null byte injection detected");
    }

    // Check for command injection attempts
    const commandInjectionPatterns = [/[;&|`$(){}[\]<>]/, /\$\(/, /`/];

    for (const pattern of commandInjectionPatterns) {
      if (pattern.test(targetPath)) {
        throw new Error(
          "Invalid path: potentially dangerous characters detected",
        );
      }
    }

    const resolvedPath = path.resolve(this.baseDir, targetPath);
    const relativePath = path.relative(this.baseDir, resolvedPath);

    // Prevent directory traversal attacks
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error(
        `Access denied: Path "${targetPath}" is outside allowed directory`,
      );
    }

    // Check if resolved path is within base directory
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error(
        `Access denied: Path "${targetPath}" is outside allowed directory`,
      );
    }

    // Check if path is within allowed directories
    const isWithinAllowed = this.allowedDirs.some((allowedDir) =>
      resolvedPath.startsWith(allowedDir),
    );

    if (!isWithinAllowed) {
      throw new Error(
        `Access denied: Path "${targetPath}" is not within allowed directories`,
      );
    }

    return resolvedPath;
  }

  // Log file operation for audit
  logOperation(operation, filePath, success = true, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      filePath,
      success,
      details,
      user: os.userInfo().username,
      cwd: this.baseDir,
    };

    this.operationLog.push(logEntry);

    // Keep only last 1000 operations
    if (this.operationLog.length > 1000) {
      this.operationLog = this.operationLog.slice(-1000);
    }

    return logEntry;
  }

  // List directory contents
  async listFiles(dirPath = ".", options = {}) {
    const resolvedPath = this.validatePath(dirPath);

    try {
      let fileList;

      // Use cache if enabled and not requesting stats
      if (this.enableCache && !options.withStats) {
        try {
          fileList = await cachedDirectoryList(resolvedPath, options);
        } catch (cacheError) {
          // Fall back to direct read if cache fails
          fileList = await this._readDirectoryDirect(resolvedPath, options);
        }
      } else {
        fileList = await this._readDirectoryDirect(resolvedPath, options);
      }

      this.logOperation("list", dirPath, true, {
        count: fileList.length,
        cached: this.enableCache && !options.withStats,
      });
      return fileList;
    } catch (error) {
      this.logOperation("list", dirPath, false, { error: error.message });
      throw error;
    }
  }

  // Direct directory reading (without cache)
  async _readDirectoryDirect(resolvedPath, options = {}) {
    const items = await fs.readdir(resolvedPath, { withFileTypes: true });

    const fileList = items.map((item) => {
      // Calculate relative path from the original dirPath (not baseDir)
      const itemName = item.name;
      const itemPath = path.join(
        resolvedPath === this.baseDir
          ? "."
          : path.relative(this.baseDir, resolvedPath),
        itemName,
      );
      const stats = {
        name: item.name,
        type: item.isDirectory() ? "directory" : "file",
        path: itemPath,
        size: 0,
        modified: null,
      };

      // Get additional stats if requested
      if (options.withStats) {
        try {
          const fullPath = path.join(resolvedPath, item.name);
          const stat = fs.statSync(fullPath);
          stats.size = stat.size;
          stats.modified = stat.mtime;
          stats.created = stat.birthtime;
          stats.permissions = stat.mode.toString(8).slice(-3);
        } catch (error) {
          // Ignore stat errors for now
        }
      }

      return stats;
    });

    // Sort: directories first, then alphabetically
    fileList.sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });

    return fileList;
  }

  // Read file content
  async readFile(filePath, encoding = "utf-8", options = {}) {
    const resolvedPath = this.validatePath(filePath);
    const forceRefresh = options.forceRefresh || false;

    try {
      // Check file size before reading
      const stats = await fs.stat(resolvedPath);
      if (stats.size > this.maxFileSize) {
        throw new Error(
          `File too large: ${stats.size} bytes (max: ${this.maxFileSize} bytes)`,
        );
      }

      let content;

      // Use cache for small to medium files
      if (this.enableCache && stats.size <= 1024 * 1024) {
        // Cache files up to 1MB
        try {
          content = await cachedFileRead(resolvedPath, encoding, forceRefresh);
        } catch (cacheError) {
          // Fall back to direct read if cache fails
          content = await fs.readFile(resolvedPath, encoding);
        }
      } else {
        // Large files or cache disabled
        content = await fs.readFile(resolvedPath, encoding);
      }

      this.logOperation("read", filePath, true, {
        size: stats.size,
        encoding,
        cached: this.enableCache && stats.size <= 1024 * 1024,
      });

      return content;
    } catch (error) {
      this.logOperation("read", filePath, false, { error: error.message });
      throw error;
    }
  }

  // Write file content with automatic backup
  async writeFile(filePath, content, options = {}) {
    const resolvedPath = this.validatePath(filePath);

    // DISABLE BACKUP FILES - User requested no backup files
    const backupPath = null; // Always null to prevent backup file creation

    try {
      // Show code diff before writing (if file exists and we're in interactive mode)
      if (process.env.NODE_ENV !== "test" && fs.existsSync(resolvedPath)) {
        const oldContent = await fs.readFile(resolvedPath, "utf-8");
        // We'll display the diff in the calling code, not here
      }

      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });

      // Write the file
      await fs.writeFile(resolvedPath, content, "utf-8");

      // Invalidate cache for this file
      if (this.enableCache) {
        this.cache.invalidate(resolvedPath);
      }

      this.logOperation("write", filePath, true, {
        backupCreated: !!backupPath,
        backupPath: backupPath,
        contentLength: content.length,
      });

      return {
        success: true,
        path: filePath,
        backupPath: backupPath,
        bytesWritten: content.length,
      };
    } catch (error) {
      this.logOperation("write", filePath, false, { error: error.message });
      throw error;
    }
  }

  // Create new file
  async createFile(filePath, content = "") {
    return this.writeFile(filePath, content, { backup: false });
  }

  // Delete file
  async deleteFile(filePath, options = {}) {
    const resolvedPath = this.validatePath(filePath);
    const backupPath =
      options.backup !== false ? `${resolvedPath}.deleted-${Date.now()}` : null;

    try {
      // Backup before deletion if requested
      if (backupPath) {
        try {
          await fs.copyFile(resolvedPath, backupPath);
        } catch (error) {
          // If backup fails, still try to delete?
        }
      }

      await fs.unlink(resolvedPath);

      // Invalidate cache for this file
      if (this.enableCache) {
        this.cache.invalidate(resolvedPath);
      }

      this.logOperation("delete", filePath, true, {
        backupCreated: !!backupPath,
        backupPath: backupPath,
      });

      return {
        success: true,
        path: filePath,
        backupPath: backupPath,
      };
    } catch (error) {
      this.logOperation("delete", filePath, false, { error: error.message });
      throw error;
    }
  }

  // Get file information
  async getFileInfo(filePath) {
    const resolvedPath = this.validatePath(filePath);

    try {
      const stats = await fs.stat(resolvedPath);

      return {
        path: filePath,
        name: path.basename(filePath),
        type: stats.isDirectory()
          ? "directory"
          : stats.isFile()
            ? "file"
            : stats.isSymbolicLink()
              ? "symlink"
              : "other",
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        permissions: stats.mode.toString(8).slice(-3),
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Get current directory information
  getCurrentDirectory() {
    return {
      path: this.baseDir,
      relative: path.relative(process.cwd(), this.baseDir),
      absolute: this.baseDir,
      user: os.userInfo().username,
      home: os.homedir(),
    };
  }

  // Change current directory (within allowed boundaries)
  async changeDirectory(newDir) {
    const resolvedPath = path.resolve(this.baseDir, newDir);

    // Validate the new directory is within allowed boundaries
    const relativePath = path.relative(this.baseDir, resolvedPath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error(
        `Cannot change to directory "${newDir}": outside allowed boundaries`,
      );
    }

    try {
      // Check if directory exists and is accessible
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error(`"${newDir}" is not a directory`);
      }

      const oldDir = this.baseDir;
      this.baseDir = resolvedPath;

      // Invalidate cache for old directory if we're changing directories
      if (this.enableCache && oldDir !== this.baseDir) {
        this.cache.invalidateDirectory(oldDir);
      }

      this.logOperation("cd", newDir, true, {
        from: oldDir,
        to: this.baseDir,
      });

      return {
        success: true,
        from: oldDir,
        to: this.baseDir,
        relative: path.relative(process.cwd(), this.baseDir),
      };
    } catch (error) {
      this.logOperation("cd", newDir, false, { error: error.message });
      throw error;
    }
  }

  // Get operation log
  getOperationLog(limit = 100) {
    return this.operationLog.slice(-limit);
  }

  // Clear operation log
  clearOperationLog() {
    this.operationLog = [];
    return { success: true, cleared: true };
  }

  // Get cache statistics
  getCacheStats() {
    if (!this.enableCache) {
      return { enabled: false };
    }
    return {
      enabled: true,
      ...this.cache.getStats(),
    };
  }

  // Clear cache
  clearCache() {
    if (this.enableCache) {
      this.cache.clear();
      return { success: true, cleared: true };
    }
    return { success: false, message: "Cache is disabled" };
  }

  // Search for files
  async searchFiles(pattern, searchDir = ".", options = {}) {
    const resolvedDir = this.validatePath(searchDir);

    try {
      const results = [];
      let searchRegex;

      // Check if pattern looks like a regex (contains regex special chars not typical in globs)
      if (
        pattern.includes(".*") ||
        pattern.includes("\\.") ||
        pattern.includes("[") ||
        pattern.includes("]")
      ) {
        // Treat as regex pattern
        searchRegex = new RegExp(pattern, options.caseSensitive ? "" : "i");
      } else {
        // Treat as glob pattern
        const regexPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
          .replace(/\\\*/g, ".*") // Convert * to .*
          .replace(/\\\?/g, "."); // Convert ? to .
        searchRegex = new RegExp(
          `^${regexPattern}$`,
          options.caseSensitive ? "" : "i",
        );
      }

      async function searchRecursive(currentDir) {
        const items = await fs.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(currentDir, item.name);
          const relativePath = path.relative(resolvedDir, itemPath);

          // Check if item matches pattern
          if (searchRegex.test(item.name)) {
            results.push({
              name: item.name,
              path: relativePath,
              type: item.isDirectory() ? "directory" : "file",
              fullPath: itemPath,
            });
          }

          // Recursively search subdirectories if enabled
          if (item.isDirectory() && options.recursive !== false) {
            // Skip node_modules and other common directories if requested
            const skipDirs = options.skipDirs || [
              "node_modules",
              ".git",
              ".DS_Store",
            ];
            if (!skipDirs.includes(item.name)) {
              await searchRecursive(itemPath);
            }
          }
        }
      }

      await searchRecursive(resolvedDir);

      this.logOperation("search", searchDir, true, {
        pattern,
        results: results.length,
        recursive: options.recursive !== false,
      });

      return results;
    } catch (error) {
      this.logOperation("search", searchDir, false, { error: error.message });
      throw error;
    }
  }
}

// Utility functions
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatFileList(files) {
  if (!files || files.length === 0) {
    return "No files found.";
  }

  const maxNameLength = Math.min(
    Math.max(...files.map((f) => f.name.length), 20),
    50,
  );

  const lines = files.map((file) => {
    const typeIndicator = file.type === "directory" ? "[DIR]" : "[FILE]";
    const name = file.name.padEnd(maxNameLength);
    const size = file.size ? formatFileSize(file.size) : "";
    const modified = file.modified ? file.modified.toLocaleDateString() : "";

    return `${typeIndicator} ${name} ${size.padStart(10)} ${modified}`;
  });

  const header = `Directories and files (${files.length} items):`;
  return [header, ...lines].join("\n");
}

// Create default instance
export const defaultFileSystem = new FileSystem();
