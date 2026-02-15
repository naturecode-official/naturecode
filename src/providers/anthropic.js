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
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      "claude-3-5-sonnet-20241022":
        "Claude 3.5 Sonnet - Most capable model for complex tasks",
      "claude-3-5-haiku-20241022":
        "Claude 3.5 Haiku - Fast and efficient for simple tasks",
      "claude-3-opus-20240229":
        "Claude 3 Opus - Most powerful model for highly complex tasks",
      "claude-3-sonnet-20240229":
        "Claude 3 Sonnet - Balanced model for most use cases",
      "claude-3-haiku-20240307":
        "Claude 3 Haiku - Fastest model for simple queries",
    };
  }

  getModelDescription(model) {
    const descriptions = AnthropicProvider.getStaticModelDescriptions();
    return descriptions[model] || "Unknown model";
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
          model: this.config.model || "claude-3-5-sonnet-20241022",
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
          model: this.config.model || "claude-3-5-sonnet-20241022",
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
