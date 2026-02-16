import axios from "axios";
import { AIProvider } from "./base.js";
import { formatFileList } from "../utils/filesystem.js";

const DEFAULT_GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
const MODELS_ENDPOINT = "/models";

export class GeminiProvider extends AIProvider {
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
      throw new Error("Google Gemini API key is required");
    }

    if (config.model && !this.getAvailableModels().includes(config.model)) {
      throw new Error(
        `Gemini model must be one of: ${this.getAvailableModels().join(", ")}`,
      );
    }

    return true;
  }

  getAvailableModels() {
    return GeminiProvider.getStaticAvailableModels();
  }

  static getStaticAvailableModels() {
    return [
      // Gemini 3 Series (Preview)
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",

      // Gemini 2.5 Series
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-image",
    ];
  }

  static getStaticModelDescriptions() {
    return {
      // Gemini 3 Series (Preview)
      "gemini-3-pro-preview":
        "Gemini 3 Pro Preview - Latest preview model for complex reasoning and analysis",
      "gemini-3-flash-preview":
        "Gemini 3 Flash Preview - Fast and efficient preview model",

      // Gemini 2.5 Series
      "gemini-2.5-pro":
        "Gemini 2.5 Pro - High-performance model for professional use",
      "gemini-2.5-flash": "Gemini 2.5 Flash - Balanced speed and capability",
      "gemini-2.5-flash-lite":
        "Gemini 2.5 Flash Lite - Lightweight version for simple tasks",
      "gemini-2.5-flash-image":
        "Gemini 2.5 Flash Image - Specialized for image-related tasks",
    };
  }

  static getStaticModelCapabilities(model) {
    // All Gemini models support text and chat
    const capabilities = ["text", "chat"];

    // Models with vision capabilities
    const visionModels = [
      // Gemini 3 Series (Preview)
      "gemini-3-pro-preview",
      "gemini-3-flash-preview",

      // Gemini 2.5 Series
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-image",
    ];

    // Models with image capabilities
    const imageModels = ["gemini-2.5-flash-image"];

    if (visionModels.includes(model)) {
      capabilities.push("vision");
    }

    if (imageModels.includes(model)) {
      capabilities.push("image");
    }

    return capabilities;
  }

  getModelDescription(model) {
    const descriptions = GeminiProvider.getStaticModelDescriptions();
    return descriptions[model] || "Unknown model";
  }

  // 获取 API URL
  _getApiUrl() {
    // 支持自定义 base_url，默认为标准的 Gemini API
    const baseUrl = this.config.base_url || DEFAULT_GEMINI_BASE_URL;
    let apiBaseUrl = baseUrl.trim();

    // 移除末尾的斜杠
    if (apiBaseUrl.endsWith("/")) {
      apiBaseUrl = apiBaseUrl.slice(0, -1);
    }

    // 确保有 /v1beta
    if (!apiBaseUrl.endsWith("/v1beta")) {
      apiBaseUrl += "/v1beta";
    }

    return `${apiBaseUrl}${MODELS_ENDPOINT}`;
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
      const modelName = this.config.model || "gemini-2.5-flash";
      const apiUrl = `${this._getApiUrl()}/${modelName}:generateContent?key=${this.config.apiKey}`;

      const response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: systemPrompt + "\n\nUser: " + prompt + "\n\nAssistant:",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: mergedOptions.temperature,
            maxOutputTokens: mergedOptions.max_tokens,
            topP: 0.95,
            topK: 40,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 60000,
        },
      );

      // Extract response text from Gemini API response
      const candidates = response.data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No response from Gemini API");
      }

      const parts = candidates[0].content.parts;
      if (!parts || parts.length === 0) {
        throw new Error("Empty response from Gemini API");
      }

      return parts[0].text;
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
      const modelName = this.config.model || "gemini-2.5-flash";
      const apiUrl = `${this._getApiUrl()}/${modelName}:streamGenerateContent?key=${this.config.apiKey}`;

      const response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: systemPrompt + "\n\nUser: " + prompt + "\n\nAssistant:",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: mergedOptions.temperature,
            maxOutputTokens: mergedOptions.max_tokens,
            topP: 0.95,
            topK: 40,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        },
        {
          headers: {
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

  // Custom error handling for Gemini API
  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          if (data.error?.message?.includes("API key")) {
            throw new Error(
              'Invalid API key. Please reconfigure with "naturecode model"',
            );
          }
          throw new Error(
            `Gemini API error: ${data.error?.message || "Bad request"}`,
          );
        case 401:
          throw new Error(
            'Invalid API key. Please reconfigure with "naturecode model"',
          );
        case 403:
          throw new Error("Access denied. Check API key permissions");
        case 429:
          throw new Error("Rate limit exceeded. Please try again later");
        case 500:
          throw new Error("Gemini service internal error");
        case 503:
          throw new Error("Gemini service temporarily unavailable");
        default:
          throw new Error(
            `Gemini service error: ${data?.error?.message || error.message}`,
          );
      }
    } else if (error.request) {
      throw new Error("Network error: Cannot connect to Gemini service");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}
