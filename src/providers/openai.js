import axios from "axios";
import { AIProvider } from "./base.js";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const CHAT_COMPLETIONS_ENDPOINT = "/chat/completions";

export class OpenAIProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.validateConfig(config);

    // Initialize file system
    this.initializeFileSystem();
  }

  validateConfig(config) {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("OpenAI API key is required");
    }

    // 检查 API 密钥格式 - sk-proj- 也是有效的
    if (!config.apiKey.startsWith("sk-")) {
      console.warn("⚠️  Warning: Your API key doesn't start with 'sk-'");
      console.warn("   Valid OpenAI keys start with 'sk-' or 'sk-proj-'");
    }

    if (!config.model || !this.getAvailableModels().includes(config.model)) {
      const availableModels = this.getAvailableModels();
      const recommendedModels = ["gpt-5-mini", "gpt-5.2", "gpt-4.1"];

      let errorMessage = `Invalid OpenAI model: "${config.model}"\n\n`;
      errorMessage += "✅ **Recommended models (guaranteed to work):**\n";
      recommendedModels.forEach((model) => {
        errorMessage += `   • ${model}\n`;
      });

      errorMessage += "\n📋 **All available models:**\n";
      availableModels.slice(0, 10).forEach((model) => {
        errorMessage += `   • ${model}\n`;
      });

      if (availableModels.length > 10) {
        errorMessage += `   • ... and ${availableModels.length - 10} more\n`;
      }

      errorMessage += "\n💡 **Tip**: Run 'naturecode model' to reconfigure";

      throw new Error(errorMessage);
    }

    return true;
  }

  getAvailableModels() {
    return OpenAIProvider.getStaticAvailableModels();
  }

  // 获取 API URL
  _getApiUrl() {
    // 只支持标准的 OpenAI API
    const baseUrl = DEFAULT_OPENAI_BASE_URL;
    let apiBaseUrl = baseUrl.trim();

    // 移除末尾的斜杠
    if (apiBaseUrl.endsWith("/")) {
      apiBaseUrl = apiBaseUrl.slice(0, -1);
    }

    // 确保有 /v1
    if (!apiBaseUrl.endsWith("/v1")) {
      apiBaseUrl += "/v1";
    }

    return `${apiBaseUrl}${CHAT_COMPLETIONS_ENDPOINT}`;
  }

  static getStaticAvailableModels() {
    return [
      // GPT-5系列 (最新)
      "gpt-5.2",
      "gpt-5.2-pro",
      "gpt-5-mini",
      "gpt-5-nano",

      // GPT-4.1系列
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",

      // o系列 (优化模型)
      "o3-pro",
      "o3-mini",
      "o1-pro",
      "o1-mini",

      // 开源系列
      "gpt-oss-120b",
      "gpt-oss-20b",
    ];
  }

  getModelCategory(model) {
    const categories = {
      // GPT-5系列 (最新)
      "gpt-5.2": "GPT-5.2 (旗舰模型)",
      "gpt-5.2-pro": "GPT-5.2 Pro (专业增强版)",
      "gpt-5-mini": "GPT-5 Mini (轻量版)",
      "gpt-5-nano": "GPT-5 Nano (超轻量版)",

      // GPT-4.1系列
      "gpt-4.1": "GPT-4.1 (增强版)",
      "gpt-4.1-mini": "GPT-4.1 Mini (轻量增强版)",
      "gpt-4.1-nano": "GPT-4.1 Nano (超轻量增强版)",

      // o系列 (优化模型)
      "o3-pro": "o3 Pro (优化推理模型)",
      "o3-mini": "o3 Mini (轻量优化模型)",
      "o1-pro": "o1 Pro (高级优化模型)",
      "o1-mini": "o1 Mini (轻量高级模型)",

      // 开源系列
      "gpt-oss-120b": "GPT OSS 120B (开源大模型)",
      "gpt-oss-20b": "GPT OSS 20B (轻量开源模型)",
    };

    return categories[model] || "Custom Model";
  }

  getModelDescription(model) {
    return OpenAIProvider.getStaticModelDescription(model);
  }

  static getStaticModelDescription(model) {
    const descriptions = {
      // GPT-5系列 (最新)
      "gpt-5.2":
        "GPT-5.2 flagship model, 512K context, advanced multimodal reasoning",
      "gpt-5.2-pro":
        "GPT-5.2 Pro enhanced version, 1M context, enterprise-grade performance",
      "gpt-5-mini":
        "GPT-5 Mini lightweight version, 128K context, cost-effective",
      "gpt-5-nano":
        "GPT-5 Nano ultra-lightweight, 64K context, fastest inference",

      // GPT-4.1系列
      "gpt-4.1": "GPT-4.1 enhanced version, 128K context, improved accuracy",
      "gpt-4.1-mini":
        "GPT-4.1 Mini lightweight, 64K context, efficient processing",
      "gpt-4.1-nano":
        "GPT-4.1 Nano ultra-lightweight, 32K context, fastest response",

      // o系列 (优化模型)
      "o3-pro":
        "o3 Pro optimized reasoning model, 256K context, enhanced logic",
      "o3-mini": "o3 Mini lightweight optimized model, 128K context, efficient",
      "o1-pro":
        "o1 Pro advanced optimization model, 512K context, high performance",
      "o1-mini": "o1 Mini lightweight advanced model, 256K context, efficient",

      // 开源系列
      "gpt-oss-120b":
        "GPT OSS 120B open-source large model, 128K context, community-driven",
      "gpt-oss-20b":
        "GPT OSS 20B open-source lightweight model, 64K context, efficient",
    };

    return descriptions[model] || "OpenAI language model";
  }

  static getStaticModelDescriptions() {
    return {
      // GPT-4o 系列 (最新、推荐)
      "gpt-4o": "GPT-4 Omni multimodal model, text/image/audio, 128K context",
      "gpt-4o-mini":
        "GPT-4 Omni Mini lightweight multimodal, 128K context, cost-effective",
      "gpt-4o-2024-08-06": "Specific version of GPT-4o model",

      // GPT-4 Turbo 系列
      "gpt-4-turbo":
        "GPT-4 Turbo version, supports vision, 128K context, knowledge cutoff 2023-12",
      "gpt-4-turbo-preview": "GPT-4 Turbo preview version",
      "gpt-4-turbo-2024-04-09": "Specific version of GPT-4 Turbo",

      // GPT-4 系列
      "gpt-4": "Standard GPT-4 model, 8K context, knowledge cutoff 2023-04",
      "gpt-4-32k": "GPT-4 long context version, 32K context",
      "gpt-4-0613": "Legacy GPT-4 model",
      "gpt-4-32k-0613": "Legacy GPT-4 32K model",

      // GPT-3.5 系列
      "gpt-3.5-turbo":
        "Cost-effective GPT-3.5 model, 16K context, knowledge cutoff 2021-09",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo long context version, 16K context",
      "gpt-3.5-turbo-instruct": "Specialized instruction-following model",
      "gpt-3.5-turbo-0613": "Specific version of GPT-3.5 Turbo",
      "gpt-3.5-turbo-0301": "Oldest GPT-3.5 Turbo version",

      // 搜索预览系列 (需要特定权限)
      "gpt-4o-search-preview":
        "GPT-4o Search Preview with web search capabilities, 128K context",
      "gpt-4o-mini-search-preview":
        "GPT-4o Mini Search Preview lightweight web search, 128K context",
    };
  }

  getModelCapabilities(model) {
    return OpenAIProvider.getStaticModelCapabilities(model);
  }

  static getStaticModelCapabilities(model) {
    const capabilities = {
      // GPT-5系列 (最新)
      "gpt-5.2": [
        "text",
        "vision",
        "audio",
        "512k-context",
        "advanced-reasoning",
        "multimodal",
      ],
      "gpt-5.2-pro": [
        "text",
        "vision",
        "audio",
        "1m-context",
        "enterprise",
        "advanced-reasoning",
        "multimodal",
      ],
      "gpt-5-mini": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "fast",
        "cost-effective",
      ],
      "gpt-5-nano": [
        "text",
        "vision",
        "audio",
        "64k-context",
        "ultra-fast",
        "lightweight",
      ],

      // GPT-4.1系列
      "gpt-4.1": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "enhanced-accuracy",
      ],
      "gpt-4.1-mini": [
        "text",
        "vision",
        "audio",
        "64k-context",
        "efficient",
        "fast",
      ],
      "gpt-4.1-nano": [
        "text",
        "vision",
        "audio",
        "32k-context",
        "ultra-fast",
        "lightweight",
      ],

      // o系列 (优化模型)
      "o3-pro": [
        "text",
        "vision",
        "audio",
        "256k-context",
        "optimized-reasoning",
        "enhanced-logic",
      ],
      "o3-mini": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "optimized",
        "efficient",
      ],
      "o1-pro": [
        "text",
        "vision",
        "audio",
        "512k-context",
        "advanced-optimization",
        "high-performance",
      ],
      "o1-mini": [
        "text",
        "vision",
        "audio",
        "256k-context",
        "advanced-optimization",
        "efficient",
      ],

      // 开源系列
      "gpt-oss-120b": [
        "text",
        "128k-context",
        "open-source",
        "community",
        "customizable",
      ],
      "gpt-oss-20b": [
        "text",
        "64k-context",
        "open-source",
        "lightweight",
        "efficient",
      ],
    };

    return capabilities[model] || ["text"];
  }

  getRecommendedModel(useCase) {
    const recommendations = {
      // 通用用例
      "general-chat": "gpt-5-mini",
      coding: "gpt-5-mini",
      analysis: "gpt-5-mini",
      creative: "gpt-5-mini",
      reasoning: "gpt-5-mini",
      default: "gpt-5-mini",

      // 性能优化
      economical: "gpt-5-nano",
      "cost-effective": "gpt-5-mini",
      fast: "gpt-5-mini",
      optimized: "gpt-5.2",

      // 高级推理
      "advanced-reasoning": "gpt-5.2-pro",
      "complex-tasks": "gpt-5.2",
      "highly-complex": "gpt-5.2-pro",

      // 增强版本
      "enhanced-4.1": "gpt-4.1",
      "improved-4.1": "gpt-4.1-mini",
      "lightweight-4.1": "gpt-4.1-nano",

      // o系列优化模型
      "optimized-reasoning": "o3-pro",
      "optimized-fast": "o3-mini",
      "efficient-reasoning": "o1-pro",
      "efficient-fast": "o1-mini",

      // 开源模型
      "open-source-large": "gpt-oss-120b",
      "open-source-small": "gpt-oss-20b",
    };

    return recommendations[useCase] || "gpt-5-mini";
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

  // Handle file system operations (similar to DeepSeekProvider)
  async _handleFileSystemOperation(fileOp, originalPrompt) {
    try {
      switch (fileOp.operation) {
        case "list": {
          const files = await this.listFiles();
          const { formatFileList } = await import("../utils/filesystem.js");
          return `Current directory: ${this.getCurrentDirectory().relative}\n\n${formatFileList(files)}\n\nYou can ask me to read, edit, or create files in this directory.`;
        }

        case "read": {
          if (fileOp.potentialPaths.length > 0) {
            const filePath = fileOp.potentialPaths[0];
            try {
              const content = await this.readFile(filePath);
              return `Content of "${filePath}":\n\`\`\`\n${content}\n\`\`\``;
            } catch (error) {
              return `Unable to read "${filePath}": ${error.message}`;
            }
          } else {
            return 'Please specify which file you want to read. For example: "read package.json"';
          }
        }

        case "write":
        case "create": {
          // For write/create operations, we need the AI to generate content
          return await this._generateWithFileContext(originalPrompt, {});
        }

        case "delete": {
          if (fileOp.potentialPaths.length > 0) {
            const filePath = fileOp.potentialPaths[0];
            try {
              const result = await this.deleteFile(filePath);
              return `Deleted "${filePath}"${result.backupPath ? ` (backup saved to ${result.backupPath})` : ""}`;
            } catch (error) {
              return `Unable to delete "${filePath}": ${error.message}`;
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
      return `File operation failed: ${error.message}`;
    }
  }

  // Generate AI response with file system context
  async _generateWithFileContext(prompt, options = {}) {
    try {
      return await this._generateWithModel(prompt, options, this.config.model);
    } catch (error) {
      // Check if we should try fallback model
      if (
        this.config.fallbackModel &&
        this.config.fallbackModel !== this.config.model
      ) {
        console.warn(
          `Primary model ${this.config.model} failed, trying fallback model ${this.config.fallbackModel}...`,
        );
        try {
          return await this._generateWithModel(
            prompt,
            options,
            this.config.fallbackModel,
          );
        } catch (fallbackError) {
          console.error(
            `Fallback model ${this.config.fallbackModel} also failed:`,
            fallbackError.message,
          );
          this._handleError(error); // Throw the original error
        }
      } else {
        this._handleError(error);
      }
    }
  }

  async _generateWithModel(prompt, options = {}, model) {
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

    // 构建请求体，根据模型类型使用正确的参数
    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: mergedOptions.temperature,
      stream: false,
    };

    // 所有模型都使用 max_tokens
    requestBody.max_tokens = mergedOptions.max_tokens;

    const apiUrl = this._getApiUrl();
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    });

    return response.data.choices[0].message.content;
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
            return `${aiResponse}\n\nFailed to save file: ${error.message}`;
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
      yield* await this._streamGenerateWithModel(
        prompt,
        options,
        this.config.model,
      );
    } catch (error) {
      // Check if we should try fallback model
      if (
        this.config.fallbackModel &&
        this.config.fallbackModel !== this.config.model
      ) {
        console.warn(
          `Primary model ${this.config.model} failed, trying fallback model ${this.config.fallbackModel}...`,
        );
        try {
          yield* await this._streamGenerateWithModel(
            prompt,
            options,
            this.config.fallbackModel,
          );
        } catch (fallbackError) {
          console.error(
            `Fallback model ${this.config.fallbackModel} also failed:`,
            fallbackError.message,
          );
          this._handleError(error); // Throw the original error
        }
      } else {
        this._handleError(error);
      }
    }
  }

  async *_streamGenerateWithModel(prompt, options = {}, model) {
    const fileContext = this.getFileContext();
    const currentDir = this.getCurrentDirectory();
    const enhancedPrompt = this._createEnhancedPrompt(
      prompt,
      fileContext,
      currentDir,
    );

    const mergedOptions = this._mergeOptions(options);

    // 构建请求体，根据模型类型使用正确的参数
    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
      temperature: mergedOptions.temperature,
      stream: true,
    };

    // 所有模型都使用 max_tokens
    requestBody.max_tokens = mergedOptions.max_tokens;

    const apiUrl = this._getApiUrl();
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      responseType: "stream",
      timeout: 60000,
    });

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
              for (const char of processedResponse.slice(fullResponse.length)) {
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
  }
}
