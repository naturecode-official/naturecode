import { FileSystem } from "../utils/filesystem.js";

export class AIProvider {
  constructor (config) {
    this.config = config;
    this.fileSystem = null;
    this.fileContext = {
      currentDirectory: process.cwd(),
      recentFiles: [],
      fileOperations: [],
    };
  }

  // Initialize file system with current working directory
  initializeFileSystem (baseDir = process.cwd()) {
    this.fileSystem = new FileSystem(baseDir);
    this.fileContext.currentDirectory = baseDir;
    return this.fileSystem;
  }

  // File system operations
  async listFiles (path = ".", options = {}) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      const files = await this.fileSystem.listFiles(path, options);

      // Update context
      this.fileContext.recentFiles = files.slice(0, 10);
      this.fileContext.fileOperations.push({
        type: "list",
        path,
        timestamp: new Date().toISOString(),
        count: files.length,
      });

      return files;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile (filePath, encoding = "utf-8") {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      const content = await this.fileSystem.readFile(filePath, encoding);

      // Update context
      this.fileContext.recentFiles.unshift({
        name: filePath.split("/").pop(),
        path: filePath,
        type: "file",
        lastAccessed: new Date().toISOString(),
      });

      this.fileContext.fileOperations.push({
        type: "read",
        path: filePath,
        timestamp: new Date().toISOString(),
        size: content.length,
      });

      return content;
    } catch (error) {
      throw new Error(`Failed to read file "${filePath}": ${error.message}`);
    }
  }

  async writeFile (filePath, content, options = {}) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      const result = await this.fileSystem.writeFile(
        filePath,
        content,
        options,
      );

      // Update context
      this.fileContext.recentFiles.unshift({
        name: filePath.split("/").pop(),
        path: filePath,
        type: "file",
        lastModified: new Date().toISOString(),
      });

      this.fileContext.fileOperations.push({
        type: "write",
        path: filePath,
        timestamp: new Date().toISOString(),
        bytes: result.bytesWritten,
        backup: result.backupPath,
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to write file "${filePath}": ${error.message}`);
    }
  }

  async createFile (filePath, content = "") {
    return this.writeFile(filePath, content, { backup: false });
  }

  async deleteFile (filePath, options = {}) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      const result = await this.fileSystem.deleteFile(filePath, options);

      this.fileContext.fileOperations.push({
        type: "delete",
        path: filePath,
        timestamp: new Date().toISOString(),
        backup: result.backupPath,
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to delete file "${filePath}": ${error.message}`);
    }
  }

  async getFileInfo (filePath) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      return await this.fileSystem.getFileInfo(filePath);
    } catch (error) {
      throw new Error(
        `Failed to get file info for "${filePath}": ${error.message}`,
      );
    }
  }

  async changeDirectory (newDir) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      const result = await this.fileSystem.changeDirectory(newDir);
      this.fileContext.currentDirectory = result.to;

      this.fileContext.fileOperations.push({
        type: "cd",
        from: result.from,
        to: result.to,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      throw new Error(
        `Failed to change directory to "${newDir}": ${error.message}`,
      );
    }
  }

  getCurrentDirectory () {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    return this.fileSystem.getCurrentDirectory();
  }

  async searchFiles (pattern, searchDir = ".", options = {}) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      return await this.fileSystem.searchFiles(pattern, searchDir, options);
    } catch (error) {
      throw new Error(`Failed to search files: ${error.message}`);
    }
  }

  getFileContext () {
    return {
      ...this.fileContext,
      operationLog: this.fileSystem ? this.fileSystem.getOperationLog(20) : [],
    };
  }

  // AI generation methods (to be implemented by subclasses)
  async generate (prompt, options = {}) {
    throw new Error("Method not implemented");
  }

  async streamGenerate (prompt, options = {}) {
    throw new Error("Method not implemented");
  }

  // Configuration methods
  validateConfig (config) {
    throw new Error("Method not implemented");
  }

  getAvailableModels () {
    throw new Error("Method not implemented");
  }

  // Utility methods
  _mergeOptions (options) {
    return {
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      stream: this.config.stream !== false,
      ...options,
    };
  }

  _handleError (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
      case 401:
        throw new Error(
          'Invalid API key. Please reconfigure with "naturecode model"',
        );
      case 429:
        throw new Error("Rate limit exceeded. Please try again later");
      case 500:
        throw new Error("AI service internal error");
      case 503:
        throw new Error("AI service temporarily unavailable");
      default:
        throw new Error(
          `AI service error: ${data?.error?.message || error.message}`,
        );
      }
    } else if (error.request) {
      throw new Error("Network error: Cannot connect to AI service");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }

  // Helper method to extract file operations from user input
  _extractFileOperation (input) {
    const lowerInput = input.toLowerCase();

    // Check for file-related keywords
    const fileKeywords = [
      "file",
      "files",
      "directory",
      "folder",
      "read",
      "write",
      "edit",
      "create",
      "delete",
      "list",
      "show",
      "view",
      "open",
      "save",
      "content",
      "text",
      "code",
      "script",
      "document",
    ];

    const hasFileKeyword = fileKeywords.some((keyword) =>
      lowerInput.includes(keyword),
    );

    if (!hasFileKeyword) {
      return null;
    }

    // Extract potential file paths (simple pattern matching)
    const filePathPattern = /[\w\-\.\/]+\.\w{1,10}/g;
    const potentialPaths = input.match(filePathPattern) || [];

    // Determine operation type
    let operation = "unknown";
    if (
      lowerInput.includes("read") ||
      lowerInput.includes("view") ||
      lowerInput.includes("open")
    ) {
      operation = "read";
    } else if (
      lowerInput.includes("write") ||
      lowerInput.includes("edit") ||
      lowerInput.includes("save")
    ) {
      operation = "write";
    } else if (lowerInput.includes("create") || lowerInput.includes("new")) {
      operation = "create";
    } else if (lowerInput.includes("delete") || lowerInput.includes("remove")) {
      operation = "delete";
    } else if (
      lowerInput.includes("list") ||
      lowerInput.includes("show") ||
      lowerInput.includes("ls")
    ) {
      operation = "list";
    }

    return {
      isFileOperation: true,
      operation,
      potentialPaths,
      input,
    };
  }
}
