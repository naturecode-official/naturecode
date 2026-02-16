import axios from "axios";
import { AIProvider } from "./base.js";
import { formatFileList } from "../utils/filesystem.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicProvider extends AIProvider {
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
      throw new Error("Anthropic API key is required");
    }

    if (config.model && !this.getAvailableModels().includes(config.model)) {
      throw new Error(
        `Anthropic model must be one of: ${this.getAvailableModels().join(", ")}`,
      );
    }

    return true;
  }

  getAvailableModels() {
    return AnthropicProvider.getStaticAvailableModels();
  }

  static getStaticAvailableModels() {
    return [
      // Claude 4.6 系列
      "claude-opus-4-6",

      // Claude 4.1 系列
      "claude-opus-4-1-20250805",
      "claude-opus-4-0",

      // Claude 4.5 系列
      "claude-sonnet-4-5-20250929",
      "claude-sonnet-4-0",

      // Claude 4.5 系列 - Haiku
      "claude-haiku-4-5-20251001",

      // Claude 3.7 系列
      "claude-3-7-sonnet-20250219",

      // Claude 3.5 系列
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      // Claude 4.6 系列
      "claude-opus-4-6":
        "Claude Opus 4.6 - Latest flagship model with advanced reasoning",

      // Claude 4.1 系列
      "claude-opus-4-1-20250805":
        "Claude Opus 4.1 (2025-08-05) - Previous generation flagship model",
      "claude-opus-4-0": "Claude Opus 4.0 - Standard flagship model",

      // Claude 4.5 系列
      "claude-sonnet-4-5-20250929":
        "Claude Sonnet 4.5 (2025-09-29) - Balanced performance for most use cases",
      "claude-sonnet-4-0": "Claude Sonnet 4.0 - Standard balanced model",

      // Claude 4.5 系列 - Haiku
      "claude-haiku-4-5-20251001":
        "Claude Haiku 4.5 (2025-10-01) - Fast and efficient lightweight model",

      // Claude 3.7 系列
      "claude-3-7-sonnet-20250219":
        "Claude 3.7 Sonnet (2025-02-19) - Enhanced 3.5 series model",

      // Claude 3.5 系列
      "claude-3-5-sonnet-20241022":
        "Claude 3.5 Sonnet (2024-10-22) - Most capable model for complex tasks",
      "claude-3-5-haiku-20241022":
        "Claude 3.5 Haiku (2024-10-22) - Fast and efficient for simple tasks",
    };
  }

  getModelDescription(model) {
    const descriptions = AnthropicProvider.getStaticModelDescriptions();
    return descriptions[model] || "Unknown model";
  }

  static getStaticModelCapabilities(model) {
    const capabilities = {
      // Claude 4.6 系列
      "claude-opus-4-6": [
        "text",
        "chat",
        "advanced-reasoning",
        "latest",
        "flagship",
      ],

      // Claude 4.1 系列
      "claude-opus-4-1-20250805": [
        "text",
        "chat",
        "advanced-reasoning",
        "previous-generation",
      ],
      "claude-opus-4-0": [
        "text",
        "chat",
        "advanced-reasoning",
        "standard-flagship",
      ],

      // Claude 4.5 系列
      "claude-sonnet-4-5-20250929": [
        "text",
        "chat",
        "balanced",
        "general-purpose",
        "recommended",
      ],
      "claude-sonnet-4-0": ["text", "chat", "balanced", "standard"],

      // Claude 4.5 系列 - Haiku
      "claude-haiku-4-5-20251001": [
        "text",
        "chat",
        "fast",
        "lightweight",
        "efficient",
      ],

      // Claude 3.7 系列
      "claude-3-7-sonnet-20250219": [
        "text",
        "chat",
        "enhanced-3.5",
        "improved",
      ],

      // Claude 3.5 系列
      "claude-3-5-sonnet-20241022": [
        "text",
        "chat",
        "complex-tasks",
        "capable",
      ],
      "claude-3-5-haiku-20241022": [
        "text",
        "chat",
        "fast",
        "simple-tasks",
        "efficient",
      ],
    };

    return capabilities[model] || ["text", "chat"];
  }

  getRecommendedModel(useCase) {
    const recommendations = {
      // 通用用例 - 使用 claude-haiku-4-5-20251001 作为默认回退 (根据配置管理器)
      "general-chat": "claude-haiku-4-5-20251001",
      coding: "claude-haiku-4-5-20251001",
      analysis: "claude-haiku-4-5-20251001",
      creative: "claude-haiku-4-5-20251001",
      reasoning: "claude-haiku-4-5-20251001",
      default: "claude-haiku-4-5-20251001",

      // 高级推理
      "advanced-reasoning": "claude-opus-4-6",
      "complex-tasks": "claude-opus-4-1-20250805",
      "highly-complex": "claude-opus-4-6",

      // 平衡性能
      "balanced-performance": "claude-sonnet-4-5-20250929",
      "general-purpose": "claude-sonnet-4-5-20250929",
      "most-use-cases": "claude-sonnet-4-5-20250929",

      // 快速响应
      fast: "claude-haiku-4-5-20251001",
      "lightweight-tasks": "claude-haiku-4-5-20251001",
      "simple-queries": "claude-haiku-4-5-20251001",
      efficient: "claude-haiku-4-5-20251001",

      // 增强版本
      "enhanced-3.5": "claude-3-7-sonnet-20250219",
      "improved-3.5": "claude-3-7-sonnet-20250219",

      // 现有模型兼容
      "legacy-complex": "claude-3-5-sonnet-20241022",
      "legacy-fast": "claude-3-5-haiku-20241022",
    };

    return recommendations[useCase] || "claude-haiku-4-5-20251001";
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
          return await this._generateWithFileContext(originalPrompt, {});
      }
    } catch (error) {
      return `Error handling file operation: ${error.message}`;
    }
  }

  // Generate with file context
  async _generateWithFileContext(prompt, options = {}) {
    const mergedOptions = this._mergeOptions(options);
    const fileContext = this.getFileContext();

    // Build system prompt with file context
    let systemPrompt =
      "You are a helpful AI assistant integrated with a file system. ";
    systemPrompt +=
      "You can read, write, and manage files in the current directory. ";

    if (fileContext.recentFiles.length > 0) {
      systemPrompt += "Recent files in the current directory:\n";
      fileContext.recentFiles.forEach((file, index) => {
        systemPrompt += `${index + 1}. ${file.name} (${file.path})\n`;
      });
      systemPrompt += "\n";
    }

    systemPrompt += `Current directory: ${fileContext.currentDirectory}\n\n`;
    systemPrompt +=
      "When asked about files, you can provide accurate information based on the file system. ";
    systemPrompt +=
      "For file operations, be precise and follow the user's instructions carefully.";

    try {
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: this.config.model || "claude-haiku-4-5-20251001",
          max_tokens: mergedOptions.max_tokens,
          temperature: mergedOptions.temperature,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: 60000,
        },
      );

      return response.data.content[0].text;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Stream generation with file context
  async _streamGenerateWithContext(prompt, options = {}) {
    const mergedOptions = this._mergeOptions(options);
    const fileContext = this.getFileContext();

    // Build system prompt with file context
    let systemPrompt =
      "You are a helpful AI assistant integrated with a file system. ";
    systemPrompt +=
      "You can read, write, and manage files in the current directory. ";

    if (fileContext.recentFiles.length > 0) {
      systemPrompt += "Recent files in the current directory:\n";
      fileContext.recentFiles.forEach((file, index) => {
        systemPrompt += `${index + 1}. ${file.name} (${file.path})\n`;
      });
      systemPrompt += "\n";
    }

    systemPrompt += `Current directory: ${fileContext.currentDirectory}\n\n`;
    systemPrompt +=
      "When asked about files, you can provide accurate information based on the file system. ";
    systemPrompt +=
      "For file operations, be precise and follow the user's instructions carefully.";

    try {
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: this.config.model || "claude-haiku-4-5-20251001",
          max_tokens: mergedOptions.max_tokens,
          temperature: mergedOptions.temperature,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          stream: true,
        },
        {
          headers: {
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          responseType: "stream",
          timeout: 60000,
        },
      );

      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  // Stream generation
  async streamGenerate(prompt, options = {}) {
    // Check if this is a file system operation
    const fileOp = this._extractFileOperation(prompt);

    if (fileOp && fileOp.isFileOperation) {
      // For file operations in stream mode, we'll generate a single response
      const result = await this._handleFileSystemOperation(fileOp, prompt);
      // Return a simple stream that emits the result
      const { Readable } = await import("stream");
      const stream = new Readable({
        read() {
          this.push(result);
          this.push(null);
        },
      });
      return stream;
    }

    // Otherwise, proceed with normal stream generation
    return await this._streamGenerateWithContext(prompt, options);
  }
}
