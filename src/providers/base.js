import { FileSystem } from "../utils/filesystem.js";

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

    let detailedMessage = `Bad Request (400): ${errorMessage}\n\n`;
    detailedMessage += "🔍 **Common causes and solutions:**\n\n";

    // 检查 API 密钥格式
    if (!apiKey.startsWith("sk-")) {
      detailedMessage += "1. **Invalid API Key Format**:\n";
      detailedMessage += "   - Your key doesn't start with 'sk-'\n";
      detailedMessage +=
        "   - Valid OpenAI keys start with 'sk-' or 'sk-proj-'\n";
      detailedMessage += "   - Get a valid key from platform.openai.com\n\n";
    }

    // 检查模型名称
    const model = config.model || "";
    const invalidModels = ["gpt-5", "gpt-4.1", "gpt-5.1", "gpt-5.2"];
    const isInvalidModel = invalidModels.some((invalid) =>
      model.includes(invalid),
    );

    if (isInvalidModel) {
      detailedMessage += "2. **Invalid Model Name**:\n";
      detailedMessage += `   - You're trying to use: "${model}"\n`;
      detailedMessage +=
        "   - This model may not exist or require special access\n";
      detailedMessage += "   - Try these valid models instead:\n";
      detailedMessage += "     • gpt-4o (recommended)\n";
      detailedMessage += "     • gpt-4o-mini (faster, cheaper)\n";
      detailedMessage += "     • gpt-3.5-turbo (most compatible)\n\n";
    }

    // 检查错误类型
    if (
      errorMessage.includes("model") &&
      errorMessage.includes("does not exist")
    ) {
      detailedMessage += "3. **Model Does Not Exist**:\n";
      detailedMessage += "   - The model name is incorrect or unavailable\n";
      detailedMessage +=
        "   - Check available models at platform.openai.com\n\n";
    }

    if (
      errorMessage.includes("max_tokens") &&
      errorMessage.includes("not supported")
    ) {
      detailedMessage += "4. **GPT-5 Parameter Issue**:\n";
      detailedMessage +=
        "   - GPT-5 models use 'max_completion_tokens' instead of 'max_tokens'\n";
      detailedMessage +=
        "   - This has been automatically fixed in the latest version\n";
      detailedMessage +=
        "   - Update NatureCode: curl -fsSL https://raw.githubusercontent.com/naturecode-official/naturecode/main/install.sh | bash\n\n";
    }

    if (errorMessage.includes("insufficient_quota")) {
      detailedMessage += "5. **Insufficient Quota**:\n";
      detailedMessage += "   - Your account has no remaining credits\n";
      detailedMessage += "   - Add payment method at platform.openai.com\n";
      detailedMessage += "   - Or try DeepSeek (free): naturecode model\n\n";
    }

    if (errorMessage.includes("invalid_api_key")) {
      detailedMessage += "6. **Invalid API Key**:\n";
      detailedMessage += "   - Your API key is incorrect or revoked\n";
      detailedMessage += "   - Get a new key from platform.openai.com\n\n";
    }

    if (errorMessage.includes("insufficient_quota")) {
      detailedMessage += "4. **Insufficient Quota**:\n";
      detailedMessage += "   - Your account has no remaining credits\n";
      detailedMessage += "   - Add payment method at platform.openai.com\n";
      detailedMessage += "   - Or try DeepSeek (free): naturecode model\n\n";
    }

    if (errorMessage.includes("invalid_api_key")) {
      detailedMessage += "5. **Invalid API Key**:\n";
      detailedMessage += "   - Your API key is incorrect or revoked\n";
      detailedMessage += "   - Get a new key from platform.openai.com\n\n";
    }

    // 通用建议
    detailedMessage += "💡 **Quick Fixes**:\n";
    detailedMessage += "   • Run: naturecode model (reconfigure)\n";
    detailedMessage += "   • Choose DeepSeek (free, no API key issues)\n";
    detailedMessage += "   • Use model: gpt-3.5-turbo (most compatible)\n";
    detailedMessage += "   • Check: platform.openai.com for account status\n\n";

    detailedMessage += "📋 **Your Current Config**:\n";
    detailedMessage += `   • Provider: ${config.provider || "unknown"}\n`;
    detailedMessage += `   • Model: ${model || "unknown"}\n`;
    detailedMessage += `   • Key Format: ${apiKey.substring(0, 15)}...\n`;

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
