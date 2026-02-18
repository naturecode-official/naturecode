import { FileSystem } from "../utils/filesystem.js";
import { performCodeReview } from "../cli/commands/review.js";
import { createTeamCollaboration } from "../cli/commands/team.js";
import { codeAnalysis } from "../cli/commands/code.js";
import { projectManagement } from "../cli/commands/project.js";

export class AIProvider {
  constructor(config) {
    this.config = config;
    this.fileSystem = null;
    this.fileContext = {
      currentDirectory: process.cwd(),
      recentFiles: [],
      fileOperations: [],
    };
  }

  // Initialize file system with current working directory
  initializeFileSystem(baseDir = process.cwd()) {
    this.fileSystem = new FileSystem(baseDir);
    this.fileContext.currentDirectory = baseDir;
    return this.fileSystem;
  }

  // File system operations
  async listFiles(path = ".", options = {}) {
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

  async readFile(filePath, encoding = "utf-8") {
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

  async writeFile(filePath, content, options = {}) {
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

  async createFile(filePath, content = "") {
    return this.writeFile(filePath, content, { backup: false });
  }

  async deleteFile(filePath, options = {}) {
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

  async getFileInfo(filePath) {
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

  async changeDirectory(newDir) {
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

  getCurrentDirectory() {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    return this.fileSystem.getCurrentDirectory();
  }

  async searchFiles(pattern, searchDir = ".", options = {}) {
    if (!this.fileSystem) {
      this.initializeFileSystem();
    }

    try {
      return await this.fileSystem.searchFiles(pattern, searchDir, options);
    } catch (error) {
      throw new Error(`Failed to search files: ${error.message}`);
    }
  }

  getFileContext() {
    return {
      ...this.fileContext,
      operationLog: this.fileSystem ? this.fileSystem.getOperationLog(20) : [],
    };
  }

  // Code review functionality for AI internal use
  async reviewCode(options = {}) {
    try {
      const reviewOptions = {
        command: options.command || "file",
        file: options.file,
        dir: options.dir || this.fileContext.currentDirectory,
        useAI: options.useAI !== false,
        severity: options.severity,
        category: options.category,
        format: options.format || "text",
        exclude: options.exclude,
        include: options.include,
        limit: options.limit || 50,
        config: options.config,
      };

      const result = await performCodeReview(reviewOptions);

      // Format the result for AI consumption
      if (reviewOptions.format === "json") {
        return result;
      } else if (result && result.message) {
        return result.message;
      } else if (typeof result === "string") {
        return result;
      } else {
        return JSON.stringify(result, null, 2);
      }
    } catch (error) {
      throw new Error(`Code review failed: ${error.message}`);
    }
  }

  // Team collaboration functionality for AI internal use
  async manageTeam(options = {}) {
    try {
      const collaboration = await createTeamCollaboration();
      const action = options.action || "createProject";

      switch (action) {
        case "createProject":
          return await collaboration.createProject(options);
        case "listProjects":
          return await collaboration.listProjects(options);
        case "getProjectInfo":
          return await collaboration.getProjectInfo(options);
        case "createTask":
          return await collaboration.createTask(options);
        case "updateTask":
          return await collaboration.updateTask(options);
        case "listTasks":
          return await collaboration.listTasks(options);
        case "createTeam":
          return await collaboration.createTeam(options);
        case "inviteToTeam":
          return await collaboration.inviteToTeam(options);
        case "getProjectAnalytics":
          return await collaboration.getProjectAnalytics(options);
        case "getMemberAnalytics":
          return await collaboration.getMemberAnalytics(options);
        case "getTeamAnalytics":
          return await collaboration.getTeamAnalytics(options);
        case "search":
          return await collaboration.search(options);
        case "getDashboard":
          return await collaboration.getDashboard(options);
        default:
          throw new Error(`Unknown team action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Team management failed: ${error.message}`);
    }
  }

  // Code analysis functionality for AI internal use
  async analyzeCode(options = {}) {
    try {
      const analysisOptions = {
        command: options.command || "analyze",
        dir: options.dir || this.fileContext.currentDirectory,
        file: options.file,
        recursive: options.recursive !== false,
        limit: options.limit || 50,
        extensions: options.extensions,
        excludeDirs: options.excludeDirs,
        severity: options.severity,
        type: options.type,
        json: options.format === "json",
      };

      if (options.comprehensive) {
        const result = await codeAnalysis.analyzeComprehensive(analysisOptions);
        return result;
      } else {
        const result = await codeAnalysis.analyzeCode(analysisOptions);
        return result;
      }
    } catch (error) {
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  // Project management functionality for AI internal use
  async manageProject(options = {}) {
    try {
      const projectOptions = {
        command: options.command || "analyze",
        dir: options.dir || this.fileContext.currentDirectory,
        template: options.template,
        name: options.name,
        description: options.description,
        author: options.author,
        maxDepth: options.maxDepth,
        excludeDirs: options.excludeDirs,
        initGit: options.initGit !== false,
        installDeps: options.installDeps !== false,
        createInitialCommit: options.createInitialCommit !== false,
        json: options.format === "json",
      };

      if (options.comprehensive) {
        const result =
          await projectManagement.analyzeComprehensive(projectOptions);
        return result;
      } else {
        const result = await projectManagement.manageProject(projectOptions);
        return result;
      }
    } catch (error) {
      throw new Error(`Project management failed: ${error.message}`);
    }
  }

  // AI generation methods (to be implemented by subclasses)
  async generate(prompt, options = {}) {
    throw new Error("Method not implemented");
  }

  async streamGenerate(prompt, options = {}) {
    throw new Error("Method not implemented");
  }

  // Configuration methods
  validateConfig(config) {
    throw new Error("Method not implemented");
  }

  getAvailableModels() {
    throw new Error("Method not implemented");
  }

  // System prompt for file system access
  _createSystemPrompt(fileContext, currentDir) {
    return `You are NatureCode AI assistant with full access to the local file system. You are currently in directory: ${currentDir.relative}

## FILE SYSTEM TOOLS AVAILABLE:

You have direct access to these file operations - USE THEM PROACTIVELY:

### 1. FILE READING:
- Read any file: "read package.json", "show me index.js", "what's in config.js"
- You will get the complete file content
- Use this to understand code, configs, logs, etc.

### 2. FILE WRITING/CREATING:
- Create new files: "create app.js", "make config.json"
- Edit existing files: "edit index.html", "update package.json"
- When asked to create/edit, PROVIDE COMPLETE FILE CONTENT in code blocks
- Example response format:
  \`\`\`javascript
  // Complete file content here
  console.log("Hello World");
  \`\`\`

### 3. FILE LISTING:
- List directory contents: "list files", "what's in this folder", "show directory"
- See file names, sizes, types
- Use to understand project structure

### 4. FILE DELETION:
- Delete files: "delete temp.txt", "remove old.log"
- Confirm before deleting important files

### 5. DIRECTORY NAVIGATION:
- Change directory: "cd src", "go to utils", "navigate to documents"
- Work within project structure

### 6. FILE SEARCH:
- Find files: "find .js files", "search for config", "locate test files"

### 7. CODE REVIEW (AI INTERNAL USE ONLY):
- Review code quality: "review this file", "analyze code quality"
- Check for issues: security, performance, readability, best practices
- Available review types:
  * Single file: review specific file
  * Directory: review all files in directory
  * Project: comprehensive project review
- Review categories: security, performance, readability, maintainability, best-practice, complexity
- Severity levels: critical, high, medium, low, info

### 8. TEAM COLLABORATION (AI INTERNAL USE ONLY):
- Team project management: create projects, manage tasks, track progress
- Available team actions:
  * Project management: createProject, listProjects, getProjectInfo
  * Task management: createTask, updateTask, listTasks
  * Team management: createTeam, inviteToTeam
  * Analytics: getProjectAnalytics, getMemberAnalytics, getTeamAnalytics
  * Search: search across teams, projects, members
  * Dashboard: get member dashboard
- Use for: team coordination, project tracking, task assignment

## HOW TO HELP USERS:

### BE PROACTIVE:
- If user asks about code, READ the relevant files first
- If user wants to create something, PROVIDE the complete code
- If user has an error, CHECK the related files
- Don't wait for user to ask - just do it

### EXAMPLES OF GOOD RESPONSES:
User: "帮我修复这个错误"
You: [Reads relevant files first, then provides fix with complete code]

User: "创建一个React组件"
You: [Provides complete component code in code block]

User: "我的项目结构是什么"
You: [Lists files, then analyzes structure]

User: "更新配置文件"
You: [Reads current config, then provides updated complete version]

## CURRENT CONTEXT:
- Working directory: ${currentDir.relative}
- Recent files: ${fileContext.recentFiles
      .slice(0, 8)
      .map((f) => f.name)
      .join(", ")}
- Recent operations: ${fileContext.fileOperations
      .slice(-5)
      .map((op) => `${op.type}${op.path ? ` (${op.path})` : ""}`)
      .join(", ")}

## IMPORTANT RULES:
1. ALWAYS provide COMPLETE file content when creating/editing
2. Use code blocks with appropriate language tags
3. Stay within current directory for security
4. Be proactive - use file tools without being asked
5. If unsure, read files first to understand context

You are empowered to directly interact with the file system. Use these tools to provide the best possible help!`;
  }

  // Utility methods
  _mergeOptions(options) {
    return {
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      stream: this.config.stream !== false,
      ...options,
    };
  }

  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const errorMessage = data?.error?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(this._getDetailed400Error(errorMessage, data));
        case 401:
          const providerName = this.config?.provider || "AI";
          const modelName = this.config?.model || "default model";

          throw new Error(
            `Invalid ${providerName} API key for model "${modelName}".\n` +
              'Please check your API key and reconfigure with "naturecode model".\n' +
              "Tip: Make sure your API key is valid and has access to the selected model.",
          );
        case 429:
          throw new Error("Rate limit exceeded. Please try again later");
        case 500:
          throw new Error("AI service internal error");
        case 503:
          throw new Error("AI service temporarily unavailable");
        default:
          throw new Error(`AI service error: ${errorMessage}`);
      }
    } else if (error.request) {
      throw new Error("Network error: Cannot connect to AI service");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }

  _getDetailed400Error(errorMessage, data) {
    const config = this.config || {};
    const apiKey = config.apiKey || "";
    const model = config.model || "";

    // 简洁的错误信息，只包含核心问题
    let detailedMessage = `Bad Request (400): ${errorMessage}`;

    // 只添加最关键的诊断信息
    if (
      errorMessage.includes("model") &&
      errorMessage.includes("does not exist")
    ) {
      detailedMessage += `\nModel "${model}" may not exist or be accessible with your API key.`;
    } else if (errorMessage.includes("invalid_api_key")) {
      detailedMessage += `\nAPI key format: ${apiKey.substring(0, 15)}...`;
    } else if (errorMessage.includes("insufficient_quota")) {
      detailedMessage += "\nAccount has insufficient quota.";
    }

    return detailedMessage;
  }

  // Helper method to extract file operations from user input
  _extractFileOperation(input) {
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
