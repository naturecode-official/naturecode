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
      const recommendedModels = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"];

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
      // ✅ 实际可用的 OpenAI 模型 (2025年2月)

      // GPT-4o 系列 (最新、推荐)
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4o-2024-08-06",

      // GPT-4 Turbo 系列
      "gpt-4-turbo",
      "gpt-4-turbo-preview",
      "gpt-4-turbo-2024-04-09",

      // GPT-4 系列
      "gpt-4",
      "gpt-4-32k",
      "gpt-4-0613",
      "gpt-4-32k-0613",

      // GPT-3.5 系列
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-instruct",
      "gpt-3.5-turbo-0613",
      "gpt-3.5-turbo-0301",

      // 搜索预览系列 (需要特定权限)
      "gpt-4o-search-preview",
      "gpt-4o-mini-search-preview",
    ];
  }

  getModelCategory(model) {
    const categories = {
      // GPT-4o 系列 (最新)
      "gpt-4o": "GPT-4 Omni (多模态旗舰)",
      "gpt-4o-mini": "GPT-4 Omni Mini (轻量多模态)",
      "gpt-4o-2024-08-06": "GPT-4o (特定版本)",

      // GPT-4 Turbo 系列
      "gpt-4-turbo": "GPT-4 Turbo (高性价比)",
      "gpt-4-turbo-preview": "GPT-4 Turbo (预览版)",
      "gpt-4-turbo-2024-04-09": "GPT-4 Turbo (特定版本)",

      // GPT-4 系列
      "gpt-4": "GPT-4 (标准版)",
      "gpt-4-32k": "GPT-4 32K (长上下文)",
      "gpt-4-0613": "GPT-4 (旧版本)",
      "gpt-4-32k-0613": "GPT-4 32K (旧版本)",

      // GPT-3.5 系列
      "gpt-3.5-turbo": "GPT-3.5 Turbo (经济实用)",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo 16K (长对话)",
      "gpt-3.5-turbo-instruct": "GPT-3.5 Turbo Instruct (指令优化)",
      "gpt-3.5-turbo-0613": "GPT-3.5 Turbo (特定版本)",
      "gpt-3.5-turbo-0301": "GPT-3.5 Turbo (最旧版本)",

      // 搜索预览系列
      "gpt-4o-search-preview": "GPT-4o Search Preview (搜索预览)",
      "gpt-4o-mini-search-preview": "GPT-4o Mini Search Preview (轻量搜索预览)",
    };

    return categories[model] || "Custom Model";
  }

  getModelDescription(model) {
    return OpenAIProvider.getStaticModelDescription(model);
  }

  static getStaticModelDescription(model) {
    const descriptions = {
      // GPT-4o 系列 (最新)
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

      // 搜索预览系列
      "gpt-4o-search-preview":
        "GPT-4o Search Preview with web search capabilities, 128K context",
      "gpt-4o-mini-search-preview":
        "GPT-4o Mini Search Preview lightweight web search, 128K context",
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
      // GPT-4o 系列
      "gpt-4o": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "reasoning",
        "multimodal",
      ],
      "gpt-4o-mini": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "fast",
        "cost-effective",
      ],
      "gpt-4o-2024-08-06": ["text", "vision", "audio", "specific-version"],

      // GPT-4 Turbo 系列
      "gpt-4-turbo": ["text", "vision", "128k-context", "knowledge-2023-12"],
      "gpt-4-turbo-preview": ["text", "vision", "preview"],
      "gpt-4-turbo-2024-04-09": ["text", "vision", "specific-version"],

      // GPT-4 系列
      "gpt-4": ["text", "8k-context", "knowledge-2023-04"],
      "gpt-4-32k": ["text", "32k-context"],
      "gpt-4-0613": ["text", "legacy"],
      "gpt-4-32k-0613": ["text", "32k-context", "legacy"],

      // GPT-3.5 系列
      "gpt-3.5-turbo": [
        "text",
        "16k-context",
        "cost-effective",
        "knowledge-2021-09",
      ],
      "gpt-3.5-turbo-16k": ["text", "16k-context", "long-context"],
      "gpt-3.5-turbo-instruct": ["text", "instruction-following"],
      "gpt-3.5-turbo-0613": ["text", "specific-version"],
      "gpt-3.5-turbo-0301": ["text", "oldest-version"],

      // 搜索预览系列
      "gpt-4o-search-preview": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "web-search",
        "real-time-info",
      ],
      "gpt-4o-mini-search-preview": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "web-search",
        "lightweight",
      ],
    };

    return capabilities[model] || ["text"];
  }

  getRecommendedModel(useCase) {
    const recommendations = {
      // 通用用例
      "general-chat": "gpt-4o",
      coding: "gpt-4o",
      analysis: "gpt-4o",
      creative: "gpt-4o",
      reasoning: "gpt-4o",

      // 性能优化
      economical: "gpt-3.5-turbo",
      "cost-effective": "gpt-4o-mini",
      fast: "gpt-4o-mini",
      optimized: "gpt-4o",

      // 长文档处理
      "long-document": "gpt-4-turbo",
      "extended-context": "gpt-4-turbo",
      "document-analysis": "gpt-4o",

      // 多媒体处理
      vision: "gpt-4o",
      "image-analysis": "gpt-4o",
      audio: "gpt-4o",

      // 代码相关
      "code-generation": "gpt-4o",
      "code-completion": "gpt-4o",
      programming: "gpt-4o",

      // 搜索功能
      "web-search": "gpt-4o-search-preview",
      "lightweight-search": "gpt-4o-mini-search-preview",

      // 多模态
      multimodal: "gpt-4o",
      "multimodal-lightweight": "gpt-4o-mini",
    };

    return recommendations[useCase] || "gpt-4o";
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
