import axios from "axios";
import { AIProvider } from "./base.js";
import { formatFileList } from "../utils/filesystem.js";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const CHAT_COMPLETIONS_ENDPOINT = "/chat/completions";

export class DeepSeekProvider extends AIProvider {
  constructor(config) {
    super(config);
    // Only validate if model is provided
    if (config.model) {
      this.validateConfig(config);
    }

    // Initialize file system
    this.initializeFileSystem();
  }

  validateConfig(config) {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("DeepSeek API key is required");
    }

    // 只检查模型名是否存在，不验证是否在预定义列表中
    if (!config.model || typeof config.model !== "string") {
      throw new Error("DeepSeek model name is required");
    }

    console.log(`ℹ️  Using model: ${config.model}`);
    console.log("ℹ️  Check platform.deepseek.com for available models");

    return true;
  }

  // 获取 API URL
  _getApiUrl() {
    // 只使用 DeepSeek 官方 API
    return `${DEFAULT_DEEPSEEK_BASE_URL}${CHAT_COMPLETIONS_ENDPOINT}`;
  }

  // Enhanced generate method that handles file system operations
  async generate(prompt, options = {}) {
    // Check if this is a file system operation
    const fileOp = this._extractFileOperation(prompt);

    if (fileOp && fileOp.isFileOperation) {
      return await this._handleFileSystemOperation(fileOp, prompt);
    }

    // Otherwise, proceed with normal AI generation
    return await this._generateWithFileContext(prompt, options);
  }

  // Handle file system operations
  async _handleFileSystemOperation(fileOp, originalPrompt) {
    try {
      switch (fileOp.operation) {
        case "list": {
          const files = await this.listFiles();
          return `Current directory: ${this.getCurrentDirectory().relative}\n\n${formatFileList(files)}\n\nYou can ask me to read, edit, or create files in this directory.`;
        }

        case "read": {
          if (fileOp.potentialPaths.length > 0) {
            const filePath = fileOp.potentialPaths[0];
            try {
              const content = await this.readFile(filePath);
              return `Content of "${filePath}":\n\`\`\`\n${content}\n\`\`\``;
            } catch (error) {
              return `Error: Unable to read "${filePath}": ${error.message}`;
            }
          } else {
            return 'Please specify which file you want to read. For example: "read package.json"';
          }
        }

        case "write":
        case "create": {
          // For write/create operations, we need the AI to generate content
          // This will be handled by the normal AI generation with file context
          return await this._generateWithFileContext(originalPrompt, {});
        }

        case "delete": {
          if (fileOp.potentialPaths.length > 0) {
            const filePath = fileOp.potentialPaths[0];
            try {
              const result = await this.deleteFile(filePath);
              return `Deleted "${filePath}"${result.backupPath ? ` (backup saved to ${result.backupPath})` : ""}`;
            } catch (error) {
              return `Error: Unable to delete "${filePath}": ${error.message}`;
            }
          } else {
            return 'Please specify which file you want to delete. For example: "delete temp.txt"';
          }
        }

        default:
          // For unknown or complex file operations, use AI with context
          return await this._generateWithFileContext(originalPrompt, {});
      }
    } catch (error) {
      return `Error: File operation failed: ${error.message}`;
    }
  }

  // Generate AI response with file system context
  async _generateWithFileContext(prompt, options = {}) {
    try {
      // Get current file context to provide to AI
      const fileContext = this.getFileContext();
      const currentDir = this.getCurrentDirectory();

      // Create enhanced prompt with file context
      const enhancedPrompt = this._createEnhancedPrompt(
        prompt,
        fileContext,
        currentDir,
      );

      const mergedOptions = this._mergeOptions(options);

      const response = await axios.post(
        this._getApiUrl(),
        {
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: this._createSystemPrompt(fileContext, currentDir),
            },
            {
              role: "user",
              content: enhancedPrompt,
            },
          ],
          temperature: mergedOptions.temperature,
          max_tokens: mergedOptions.max_tokens,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const aiResponse = response.data.choices[0]?.message?.content || "";

      // Check if AI response contains file operations to execute
      return await this._processAIResponse(aiResponse, prompt);
    } catch (error) {
      this._handleError(error);
    }
  }

  // Create system prompt with file context
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

  // Create enhanced user prompt
  _createEnhancedPrompt(userPrompt, fileContext, currentDir) {
    return `User: ${userPrompt}

Current location: ${currentDir.relative}
Recent files: ${fileContext.recentFiles
      .slice(0, 3)
      .map((f) => f.name)
      .join(", ")}

Please help with this request. If it involves file operations, provide the necessary information or perform the operation.`;
  }

  // Process AI response to execute any file operations
  async _processAIResponse(aiResponse, originalPrompt) {
    // Check if AI response contains file content to write
    // This is a simple heuristic - in production you'd want more sophisticated parsing
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
    const matches = [...aiResponse.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      // Check if the original prompt mentioned creating/editing a file
      const lowerPrompt = originalPrompt.toLowerCase();
      if (
        lowerPrompt.includes("create") ||
        lowerPrompt.includes("edit") ||
        lowerPrompt.includes("write") ||
        lowerPrompt.includes("save")
      ) {
        // Try to extract filename from prompt
        const filePathMatch = originalPrompt.match(/[\w\-\.\/]+\.\w{1,10}/);
        if (filePathMatch) {
          const filePath = filePathMatch[0];
          const content = matches[0][1];

          try {
            const result = await this.writeFile(filePath, content);
            return `${aiResponse}\n\nSuccessfully saved to "${filePath}" (${result.bytesWritten} bytes)`;
          } catch (error) {
            return `${aiResponse}\n\nError: Failed to save file: ${error.message}`;
          }
        }
      }
    }

    return aiResponse;
  }

  // Override streamGenerate to also handle file context
  async *streamGenerate(prompt, options = {}) {
    // Check if this is a simple file operation
    const fileOp = this._extractFileOperation(prompt);

    if (
      fileOp &&
      (fileOp.operation === "list" || fileOp.operation === "read")
    ) {
      // For simple operations, yield the result directly
      const result = await this._handleFileSystemOperation(fileOp, prompt);
      for (const char of result) {
        yield char;
      }
      return;
    }

    // Otherwise, use streaming with context
    yield* await this._streamGenerateWithContext(prompt, options);
  }

  async *_streamGenerateWithContext(prompt, options = {}) {
    try {
      const fileContext = this.getFileContext();
      const currentDir = this.getCurrentDirectory();
      const enhancedPrompt = this._createEnhancedPrompt(
        prompt,
        fileContext,
        currentDir,
      );

      const mergedOptions = this._mergeOptions(options);

      const response = await axios.post(
        this._getApiUrl(),
        {
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: this._createSystemPrompt(fileContext, currentDir),
            },
            {
              role: "user",
              content: enhancedPrompt,
            },
          ],
          temperature: mergedOptions.temperature,
          max_tokens: mergedOptions.max_tokens,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          responseType: "stream",
          timeout: 30000,
        },
      );

      let buffer = "";
      let fullResponse = "";

      for await (const chunk of response.data) {
        buffer += chunk.toString();

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              // Process the full response for file operations
              const processedResponse = await this._processAIResponse(
                fullResponse,
                prompt,
              );
              if (processedResponse !== fullResponse) {
                // If there were file operations, yield the additional info
                for (const char of processedResponse.slice(
                  fullResponse.length,
                )) {
                  yield char;
                }
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                fullResponse += content;
                yield content;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } catch (error) {
      this._handleError(error);
    }
  }
}
