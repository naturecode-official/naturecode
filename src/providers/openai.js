import axios from "axios";
import { AIProvider } from "./base.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider extends AIProvider {
  constructor (config) {
    super(config);
    this.validateConfig(config);

    // Initialize file system
    this.initializeFileSystem();
  }

  validateConfig (config) {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("OpenAI API key is required");
    }

    if (!config.model || !this.getAvailableModels().includes(config.model)) {
      throw new Error(
        `OpenAI model must be one of: ${this.getAvailableModels().join(", ")}`,
      );
    }

    return true;
  }

  getAvailableModels () {
    return OpenAIProvider.getStaticAvailableModels();
  }

  static getStaticAvailableModels () {
    // OpenAI模型分类
    return [
      // GPT-4系列
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-4-32k",

      // GPT-3.5系列
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-instruct",

      // 专用模型
      "gpt-4o-realtime-preview",
      "gpt-4o-audio-preview",
      "gpt-4o-mini-audio-preview",

      // 视觉模型
      "gpt-4o-vision-preview",
      "gpt-4-vision-preview",

      // 微调模型
      "gpt-4o-2024-08-06",
      "gpt-4-turbo-2024-04-09",
      "gpt-3.5-turbo-0613",

      // 旧版模型
      "gpt-4-0613",
      "gpt-4-32k-0613",
      "gpt-3.5-turbo-0301",
    ];
  }

  getModelCategory (model) {
    const categories = {
      // GPT-4系列
      "gpt-4o": "GPT-4 Omni (最新旗舰模型)",
      "gpt-4o-mini": "GPT-4 Omni Mini (轻量高效)",
      "gpt-4-turbo": "GPT-4 Turbo (高性价比)",
      "gpt-4": "GPT-4 (标准版)",
      "gpt-4-32k": "GPT-4 32K (长上下文)",

      // GPT-3.5系列
      "gpt-3.5-turbo": "GPT-3.5 Turbo (经济实用)",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo 16K (长对话)",
      "gpt-3.5-turbo-instruct": "GPT-3.5 Turbo Instruct (指令优化)",

      // 专用模型
      "gpt-4o-realtime-preview": "GPT-4o Realtime (实时对话)",
      "gpt-4o-audio-preview": "GPT-4o Audio (音频处理)",
      "gpt-4o-mini-audio-preview": "GPT-4o Mini Audio (轻量音频)",

      // 视觉模型
      "gpt-4o-vision-preview": "GPT-4o Vision (视觉理解)",
      "gpt-4-vision-preview": "GPT-4 Vision (视觉分析)",

      // 微调模型
      "gpt-4o-2024-08-06": "GPT-4o 2024-08-06 (特定版本)",
      "gpt-4-turbo-2024-04-09": "GPT-4 Turbo 2024-04-09",
      "gpt-3.5-turbo-0613": "GPT-3.5 Turbo 0613",

      // 旧版模型
      "gpt-4-0613": "GPT-4 0613 (旧版)",
      "gpt-4-32k-0613": "GPT-4 32K 0613",
      "gpt-3.5-turbo-0301": "GPT-3.5 Turbo 0301 (最旧版)",
    };

    return categories[model] || "通用模型";
  }

  getModelDescription (model) {
    return OpenAIProvider.getStaticModelDescription(model);
  }

  static getStaticModelDescription (model) {
    const descriptions = {
      "gpt-4o":
        "Latest flagship model, supports text, image, audio multimodal, 128K context",
      "gpt-4o-mini":
        "Lightweight and efficient GPT-4o version, cost-effective, 128K context",
      "gpt-4-turbo":
        "GPT-4 Turbo version, supports vision, 128K context, knowledge cutoff 2023-12",
      "gpt-4": "Standard GPT-4 model, 8K context, knowledge cutoff 2023-04",
      "gpt-4-32k": "GPT-4 long context version, 32K context",

      "gpt-3.5-turbo":
        "Cost-effective GPT-3.5 model, 16K context, knowledge cutoff 2021-09",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo long context version, 16K context",
      "gpt-3.5-turbo-instruct": "Specialized instruction-following model",

      "gpt-4o-realtime-preview":
        "GPT-4o preview with real-time conversation support",
      "gpt-4o-audio-preview": "GPT-4o preview with audio processing support",
      "gpt-4o-mini-audio-preview": "Lightweight audio processing model",

      "gpt-4o-vision-preview":
        "GPT-4o preview with visual understanding support",
      "gpt-4-vision-preview": "GPT-4 visual analysis preview",

      "gpt-4o-2024-08-06": "Specific version of GPT-4o model",
      "gpt-4-turbo-2024-04-09": "Specific version of GPT-4 Turbo",
      "gpt-3.5-turbo-0613": "Specific version of GPT-3.5 Turbo",

      "gpt-4-0613": "Legacy GPT-4 model",
      "gpt-4-32k-0613": "Legacy GPT-4 32K model",
      "gpt-3.5-turbo-0301": "Oldest GPT-3.5 Turbo version",
    };

    return descriptions[model] || "OpenAI language model";
  }

  static getStaticModelDescriptions () {
    return {
      "gpt-4o":
        "Latest flagship model, supports text, image, audio multimodal, 128K context",
      "gpt-4o-mini":
        "Lightweight and efficient GPT-4o version, cost-effective, 128K context",
      "gpt-4-turbo":
        "GPT-4 Turbo version, supports vision, 128K context, knowledge cutoff 2023-12",
      "gpt-4": "Standard GPT-4 model, 8K context, knowledge cutoff 2023-04",
      "gpt-4-32k": "GPT-4 long context version, 32K context",

      "gpt-3.5-turbo":
        "Cost-effective GPT-3.5 model, 16K context, knowledge cutoff 2021-09",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo long context version, 16K context",
      "gpt-3.5-turbo-instruct": "Specialized instruction-following model",

      "gpt-4o-realtime-preview":
        "GPT-4o preview with real-time conversation support",
      "gpt-4o-audio-preview": "GPT-4o preview with audio processing support",
      "gpt-4o-mini-audio-preview": "Lightweight audio processing model",

      "gpt-4o-vision-preview":
        "GPT-4o preview with visual understanding support",
      "gpt-4-vision-preview": "GPT-4 visual analysis preview",

      "gpt-4o-2024-08-06": "Specific version of GPT-4o model",
      "gpt-4-turbo-2024-04-09": "Specific version of GPT-4 Turbo",
      "gpt-3.5-turbo-0613": "Specific version of GPT-3.5 Turbo",

      "gpt-4-0613": "Legacy GPT-4 model",
      "gpt-4-32k-0613": "Legacy GPT-4 32K model",
      "gpt-3.5-turbo-0301": "Oldest GPT-3.5 Turbo version",
    };
  }

  getModelCapabilities (model) {
    return OpenAIProvider.getStaticModelCapabilities(model);
  }

  static getStaticModelCapabilities (model) {
    const capabilities = {
      "gpt-4o": ["text", "vision", "audio", "128k-context", "reasoning"],
      "gpt-4o-mini": ["text", "vision", "audio", "128k-context", "fast"],
      "gpt-4-turbo": ["text", "vision", "128k-context", "knowledge-2023-12"],
      "gpt-4": ["text", "8k-context", "knowledge-2023-04"],
      "gpt-4-32k": ["text", "32k-context"],

      "gpt-3.5-turbo": [
        "text",
        "16k-context",
        "knowledge-2021-09",
        "economical",
      ],
      "gpt-3.5-turbo-16k": ["text", "16k-context", "long-conversation"],
      "gpt-3.5-turbo-instruct": ["text", "instruction-following"],

      "gpt-4o-realtime-preview": ["text", "realtime", "low-latency"],
      "gpt-4o-audio-preview": ["text", "audio", "speech"],
      "gpt-4o-mini-audio-preview": ["text", "audio", "lightweight"],

      "gpt-4o-vision-preview": ["text", "vision", "image-analysis"],
      "gpt-4-vision-preview": ["text", "vision", "image-understanding"],
    };

    return capabilities[model] || ["text"];
  }

  getRecommendedModel (useCase) {
    const recommendations = {
      "general-chat": "gpt-4o",
      coding: "gpt-4o",
      analysis: "gpt-4-turbo",
      creative: "gpt-4o",
      economical: "gpt-3.5-turbo",
      "long-document": "gpt-4-turbo",
      vision: "gpt-4o-vision-preview",
      audio: "gpt-4o-audio-preview",
      realtime: "gpt-4o-realtime-preview",
    };

    return recommendations[useCase] || "gpt-4o";
  }

  // Enhanced generate method that handles file system operations
  async generate (prompt, options = {}) {
    // Check if this is a file system operation
    const fileOp = this._extractFileOperation(prompt);

    if (fileOp && fileOp.isFileOperation) {
      return await this._handleFileSystemOperation(fileOp, prompt);
    }

    // Otherwise, proceed with normal AI generation
    return await this._generateWithFileContext(prompt, options);
  }

  // Handle file system operations (similar to DeepSeekProvider)
  async _handleFileSystemOperation (fileOp, originalPrompt) {
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
  async _generateWithFileContext (prompt, options = {}) {
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
        OPENAI_API_URL,
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
  _createSystemPrompt (fileContext, currentDir) {
    return `You are an AI assistant with access to the local file system. You are currently in directory: ${currentDir.relative}
    
Current file context:
- Working directory: ${currentDir.relative}
- Recent files: ${fileContext.recentFiles
    .slice(0, 5)
    .map((f) => f.name)
    .join(", ")}
- Recent operations: ${fileContext.fileOperations
    .slice(-3)
    .map((op) => op.type)
    .join(", ")}

You can perform these file operations:
1. List files in current directory
2. Read file contents
3. Create/edit files
4. Delete files
5. Change directory
6. Search for files

When user asks about files, provide helpful responses. If they ask to edit/create a file, provide the complete file content in your response.
Always stay within the current directory and its subdirectories for security.

IMPORTANT: If you're asked to create or edit a file, provide the COMPLETE file content in your response.`;
  }

  // Create enhanced user prompt
  _createEnhancedPrompt (userPrompt, fileContext, currentDir) {
    return `User: ${userPrompt}

Current location: ${currentDir.relative}
Recent files: ${fileContext.recentFiles
    .slice(0, 3)
    .map((f) => f.name)
    .join(", ")}

Please help with this request. If it involves file operations, provide the necessary information or perform the operation.`;
  }

  // Process AI response to execute any file operations
  async _processAIResponse (aiResponse, originalPrompt) {
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
  async *streamGenerate (prompt, options = {}) {
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

  async *_streamGenerateWithContext (prompt, options = {}) {
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
        OPENAI_API_URL,
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
