import axios from "axios";
import { AIProvider } from "./base.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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

    if (!config.model || !this.getAvailableModels().includes(config.model)) {
      throw new Error(
        `OpenAI model must be one of: ${this.getAvailableModels().join(", ")}`,
      );
    }

    return true;
  }

  getAvailableModels() {
    return OpenAIProvider.getStaticAvailableModels();
  }

  static getStaticAvailableModels() {
    return [
      // GPT-5系列 (最新)
      "gpt-5.2",
      "gpt-5.2-pro",
      "gpt-5",
      "gpt-5-mini",
      "gpt-5-nano",
      "gpt-5.1",
      "gpt-5.1-codex",
      "gpt-5.1-codex-extended",

      // GPT-4.1系列
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",

      // GPT-4o系列
      "gpt-4o",
      "gpt-4o-mini",

      // o系列 (优化模型)
      "o3",
      "o4-mini",
      "o4-mini-high",
      "o3-deep-research",
      "o4-mini-deep-research",

      // 搜索预览系列
      "gpt-4o-search-preview",
      "gpt-4o-mini-search-preview",

      // 计算机使用预览
      "computer-use-preview",

      // 开源系列
      "gpt-oss-120b",
      "gpt-oss-20b",

      // 现有模型 (保持向后兼容)
      "gpt-4-turbo",
      "gpt-4",
      "gpt-4-32k",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-instruct",
      "gpt-5-turbo",
      "gpt-4-enterprise",
      "gpt-4o-enterprise",
      "gpt-4o-2024-08-06",
      "gpt-4-turbo-2024-04-09",
      "gpt-4-0613",
      "gpt-4-32k-0613",
      "gpt-3.5-turbo-0613",
      "gpt-3.5-turbo-0301",
    ];
  }

  getModelCategory(model) {
    const categories = {
      // GPT-5系列 (最新)
      "gpt-5.2": "GPT-5.2 (最新旗舰模型)",
      "gpt-5.2-pro": "GPT-5.2 Pro (专业增强版)",
      "gpt-5": "GPT-5 (标准旗舰模型)",
      "gpt-5-mini": "GPT-5 Mini (轻量版)",
      "gpt-5-nano": "GPT-5 Nano (超轻量版)",
      "gpt-5.1": "GPT-5.1 (上一代旗舰)",
      "gpt-5.1-codex": "GPT-5.1 Codex (代码优化版)",
      "gpt-5.1-codex-extended": "GPT-5.1 Codex Extended (扩展代码版)",

      // GPT-4.1系列
      "gpt-4.1": "GPT-4.1 (增强版)",
      "gpt-4.1-mini": "GPT-4.1 Mini (轻量增强版)",
      "gpt-4.1-nano": "GPT-4.1 Nano (超轻量增强版)",

      // GPT-4o系列
      "gpt-4o": "GPT-4 Omni (多模态旗舰)",
      "gpt-4o-mini": "GPT-4 Omni Mini (轻量多模态)",

      // o系列 (优化模型)
      o3: "o3 (优化推理模型)",
      "o4-mini": "o4 Mini (轻量优化模型)",
      "o4-mini-high": "o4 Mini High (高性能轻量优化)",
      "o3-deep-research": "o3 Deep Research (深度研究优化)",
      "o4-mini-deep-research": "o4 Mini Deep Research (轻量深度研究)",

      // 搜索预览系列
      "gpt-4o-search-preview": "GPT-4o Search Preview (搜索预览)",
      "gpt-4o-mini-search-preview": "GPT-4o Mini Search Preview (轻量搜索预览)",

      // 计算机使用预览
      "computer-use-preview": "Computer Use Preview (计算机使用预览)",

      // 开源系列
      "gpt-oss-120b": "GPT OSS 120B (开源大模型)",
      "gpt-oss-20b": "GPT OSS 20B (轻量开源模型)",

      // 现有模型 (保持向后兼容)
      "gpt-4-turbo": "GPT-4 Turbo (高性价比)",
      "gpt-4": "GPT-4 (标准版)",
      "gpt-4-32k": "GPT-4 32K (长上下文)",
      "gpt-3.5-turbo": "GPT-3.5 Turbo (经济实用)",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo 16K (长对话)",
      "gpt-3.5-turbo-instruct": "GPT-3.5 Turbo Instruct (指令优化)",
      "gpt-5-turbo": "GPT-5 Turbo (高性能优化)",
      "gpt-4-enterprise": "GPT-4 Enterprise (企业版)",
      "gpt-4o-enterprise": "GPT-4o Enterprise (企业版)",
      "gpt-4o-2024-08-06": "GPT-4o 2024-08-06 (特定版本)",
      "gpt-4-turbo-2024-04-09": "GPT-4 Turbo 2024-04-09",
      "gpt-4-0613": "GPT-4 0613 (旧版)",
      "gpt-4-32k-0613": "GPT-4 32K 0613",
      "gpt-3.5-turbo-0613": "GPT-3.5 Turbo 0613",
      "gpt-3.5-turbo-0301": "GPT-3.5 Turbo 0301 (最旧版)",
    };

    return categories[model] || "通用模型";
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
      "gpt-5":
        "GPT-5 standard model, 256K context, advanced reasoning capabilities",
      "gpt-5-mini":
        "GPT-5 Mini lightweight version, 128K context, cost-effective",
      "gpt-5-nano":
        "GPT-5 Nano ultra-lightweight, 64K context, fastest inference",
      "gpt-5.1":
        "GPT-5.1 previous generation, 192K context, stable performance",
      "gpt-5.1-codex":
        "GPT-5.1 Codex specialized for programming, 256K context",
      "gpt-5.1-codex-extended":
        "GPT-5.1 Codex Extended with enhanced code generation, 512K context",

      // GPT-4.1系列
      "gpt-4.1": "GPT-4.1 enhanced version, 128K context, improved accuracy",
      "gpt-4.1-mini":
        "GPT-4.1 Mini lightweight, 64K context, efficient processing",
      "gpt-4.1-nano":
        "GPT-4.1 Nano ultra-lightweight, 32K context, fastest response",

      // GPT-4o系列
      "gpt-4o": "GPT-4 Omni multimodal model, text/image/audio, 128K context",
      "gpt-4o-mini":
        "GPT-4 Omni Mini lightweight multimodal, 128K context, cost-effective",

      // o系列 (优化模型)
      o3: "o3 optimized reasoning model, 256K context, enhanced logic",
      "o4-mini": "o4 Mini lightweight optimized model, 128K context, efficient",
      "o4-mini-high":
        "o4 Mini High performance lightweight, 256K context, fast",
      "o3-deep-research":
        "o3 Deep Research specialized for research, 512K context",
      "o4-mini-deep-research":
        "o4 Mini Deep Research lightweight research model, 256K context",

      // 搜索预览系列
      "gpt-4o-search-preview":
        "GPT-4o Search Preview with web search capabilities, 128K context",
      "gpt-4o-mini-search-preview":
        "GPT-4o Mini Search Preview lightweight web search, 128K context",

      // 计算机使用预览
      "computer-use-preview":
        "Computer Use Preview for computer interaction tasks, 64K context",

      // 开源系列
      "gpt-oss-120b":
        "GPT OSS 120B open-source large model, 128K context, community-driven",
      "gpt-oss-20b":
        "GPT OSS 20B open-source lightweight model, 64K context, efficient",

      // 现有模型 (保持向后兼容)
      "gpt-4-turbo":
        "GPT-4 Turbo version, supports vision, 128K context, knowledge cutoff 2023-12",
      "gpt-4": "Standard GPT-4 model, 8K context, knowledge cutoff 2023-04",
      "gpt-4-32k": "GPT-4 long context version, 32K context",
      "gpt-3.5-turbo":
        "Cost-effective GPT-3.5 model, 16K context, knowledge cutoff 2021-09",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo long context version, 16K context",
      "gpt-3.5-turbo-instruct": "Specialized instruction-following model",
      "gpt-5-turbo":
        "GPT-5 Turbo optimized version, 256K context, faster response",
      "gpt-4-enterprise": "GPT-4 Enterprise edition with advanced features",
      "gpt-4o-enterprise": "GPT-4o Enterprise edition with business tools",
      "gpt-4o-2024-08-06": "Specific version of GPT-4o model",
      "gpt-4-turbo-2024-04-09": "Specific version of GPT-4 Turbo",
      "gpt-4-0613": "Legacy GPT-4 model",
      "gpt-4-32k-0613": "Legacy GPT-4 32K model",
      "gpt-3.5-turbo-0613": "Specific version of GPT-3.5 Turbo",
      "gpt-3.5-turbo-0301": "Oldest GPT-3.5 Turbo version",
    };

    return descriptions[model] || "OpenAI language model";
  }

  static getStaticModelDescriptions() {
    return {
      // GPT-5系列 (最新)
      "gpt-5.2":
        "GPT-5.2 flagship model, 512K context, advanced multimodal reasoning",
      "gpt-5.2-pro":
        "GPT-5.2 Pro enhanced version, 1M context, enterprise-grade performance",
      "gpt-5":
        "GPT-5 standard model, 256K context, advanced reasoning capabilities",
      "gpt-5-mini":
        "GPT-5 Mini lightweight version, 128K context, cost-effective",
      "gpt-5-nano":
        "GPT-5 Nano ultra-lightweight, 64K context, fastest inference",
      "gpt-5.1":
        "GPT-5.1 previous generation, 192K context, stable performance",
      "gpt-5.1-codex":
        "GPT-5.1 Codex specialized for programming, 256K context",
      "gpt-5.1-codex-extended":
        "GPT-5.1 Codex Extended with enhanced code generation, 512K context",

      // GPT-4.1系列
      "gpt-4.1": "GPT-4.1 enhanced version, 128K context, improved accuracy",
      "gpt-4.1-mini":
        "GPT-4.1 Mini lightweight, 64K context, efficient processing",
      "gpt-4.1-nano":
        "GPT-4.1 Nano ultra-lightweight, 32K context, fastest response",

      // GPT-4o系列
      "gpt-4o": "GPT-4 Omni multimodal model, text/image/audio, 128K context",
      "gpt-4o-mini":
        "GPT-4 Omni Mini lightweight multimodal, 128K context, cost-effective",

      // o系列 (优化模型)
      o3: "o3 optimized reasoning model, 256K context, enhanced logic",
      "o4-mini": "o4 Mini lightweight optimized model, 128K context, efficient",
      "o4-mini-high":
        "o4 Mini High performance lightweight, 256K context, fast",
      "o3-deep-research":
        "o3 Deep Research specialized for research, 512K context",
      "o4-mini-deep-research":
        "o4 Mini Deep Research lightweight research model, 256K context",

      // 搜索预览系列
      "gpt-4o-search-preview":
        "GPT-4o Search Preview with web search capabilities, 128K context",
      "gpt-4o-mini-search-preview":
        "GPT-4o Mini Search Preview lightweight web search, 128K context",

      // 计算机使用预览
      "computer-use-preview":
        "Computer Use Preview for computer interaction tasks, 64K context",

      // 开源系列
      "gpt-oss-120b":
        "GPT OSS 120B open-source large model, 128K context, community-driven",
      "gpt-oss-20b":
        "GPT OSS 20B open-source lightweight model, 64K context, efficient",

      // 现有模型 (保持向后兼容)
      "gpt-4-turbo":
        "GPT-4 Turbo version, supports vision, 128K context, knowledge cutoff 2023-12",
      "gpt-4": "Standard GPT-4 model, 8K context, knowledge cutoff 2023-04",
      "gpt-4-32k": "GPT-4 long context version, 32K context",
      "gpt-3.5-turbo":
        "Cost-effective GPT-3.5 model, 16K context, knowledge cutoff 2021-09",
      "gpt-3.5-turbo-16k": "GPT-3.5 Turbo long context version, 16K context",
      "gpt-3.5-turbo-instruct": "Specialized instruction-following model",
      "gpt-5-turbo":
        "GPT-5 Turbo optimized version, 256K context, faster response",
      "gpt-4-enterprise": "GPT-4 Enterprise edition with advanced features",
      "gpt-4o-enterprise": "GPT-4o Enterprise edition with business tools",
      "gpt-4o-2024-08-06": "Specific version of GPT-4o model",
      "gpt-4-turbo-2024-04-09": "Specific version of GPT-4 Turbo",
      "gpt-4-0613": "Legacy GPT-4 model",
      "gpt-4-32k-0613": "Legacy GPT-4 32K model",
      "gpt-3.5-turbo-0613": "Specific version of GPT-3.5 Turbo",
      "gpt-3.5-turbo-0301": "Oldest GPT-3.5 Turbo version",
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
      "gpt-5": [
        "text",
        "vision",
        "audio",
        "256k-context",
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
      "gpt-5.1": [
        "text",
        "vision",
        "audio",
        "192k-context",
        "stable",
        "reliable",
      ],
      "gpt-5.1-codex": [
        "text",
        "code",
        "256k-context",
        "programming",
        "code-generation",
      ],
      "gpt-5.1-codex-extended": [
        "text",
        "code",
        "512k-context",
        "programming",
        "extended-code",
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

      // GPT-4o系列
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

      // o系列 (优化模型)
      o3: [
        "text",
        "vision",
        "audio",
        "256k-context",
        "optimized-reasoning",
        "enhanced-logic",
      ],
      "o4-mini": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "optimized",
        "efficient",
      ],
      "o4-mini-high": [
        "text",
        "vision",
        "audio",
        "256k-context",
        "optimized",
        "high-performance",
      ],
      "o3-deep-research": [
        "text",
        "vision",
        "audio",
        "512k-context",
        "research",
        "deep-analysis",
      ],
      "o4-mini-deep-research": [
        "text",
        "vision",
        "audio",
        "256k-context",
        "research",
        "lightweight",
      ],

      // 搜索预览系列
      "gpt-4o-search-preview": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "web-search",
        "real-time",
      ],
      "gpt-4o-mini-search-preview": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "web-search",
        "lightweight",
      ],

      // 计算机使用预览
      "computer-use-preview": [
        "text",
        "computer-interaction",
        "64k-context",
        "preview",
      ],

      // 开源系列
      "gpt-oss-120b": [
        "text",
        "vision",
        "audio",
        "128k-context",
        "open-source",
        "community",
      ],
      "gpt-oss-20b": [
        "text",
        "vision",
        "audio",
        "64k-context",
        "open-source",
        "lightweight",
      ],

      // 现有模型 (保持向后兼容)
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
      "gpt-5-turbo": ["text", "vision", "audio", "256k-context", "fast"],
      "gpt-4-enterprise": ["text", "vision", "enterprise", "advanced-features"],
      "gpt-4o-enterprise": [
        "text",
        "vision",
        "audio",
        "enterprise",
        "business-tools",
      ],
      "gpt-4o-2024-08-06": ["text", "vision", "audio", "specific-version"],
      "gpt-4-turbo-2024-04-09": ["text", "vision", "specific-version"],
      "gpt-4-0613": ["text", "legacy"],
      "gpt-4-32k-0613": ["text", "32k-context", "legacy"],
      "gpt-3.5-turbo-0613": ["text", "specific-version"],
      "gpt-3.5-turbo-0301": ["text", "legacy"],
    };

    return capabilities[model] || ["text"];
  }

  getRecommendedModel(useCase) {
    const recommendations = {
      // 通用用例
      "general-chat": "gpt-5.2",
      coding: "gpt-5.2",
      analysis: "gpt-5.2",
      creative: "gpt-5.2",
      reasoning: "gpt-5.2",

      // 性能优化
      economical: "gpt-3.5-turbo",
      "cost-effective": "gpt-4o-mini",
      fast: "gpt-5.2",
      optimized: "gpt-5.2",
      "ultra-fast": "gpt-5-nano",

      // 长文档处理
      "long-document": "gpt-5.2-pro",
      "extended-context": "gpt-5.2-pro",
      "document-analysis": "gpt-5.2",

      // 多媒体处理
      vision: "gpt-5.2",
      "image-analysis": "gpt-5.2",
      audio: "gpt-5.2",
      "speech-processing": "gpt-5.2",

      // 代码相关
      "code-generation": "gpt-5.1-codex",
      "code-completion": "gpt-5.1-codex",
      programming: "gpt-5.1-codex-extended",

      // 研究分析
      research: "o3-deep-research",
      "deep-analysis": "o3-deep-research",
      "lightweight-research": "o4-mini-deep-research",

      // 搜索功能
      "web-search": "gpt-4o-search-preview",
      "lightweight-search": "gpt-4o-mini-search-preview",

      // 计算机交互
      "computer-interaction": "computer-use-preview",

      // 开源选项
      "open-source": "gpt-oss-120b",
      "lightweight-open-source": "gpt-oss-20b",

      // 企业应用
      enterprise: "gpt-5.2-pro",
      business: "gpt-5.2-pro",
      "advanced-features": "gpt-5.2-pro",

      // 优化推理
      "optimized-reasoning": "o3",
      "enhanced-logic": "o3",

      // 轻量优化
      "lightweight-optimized": "o4-mini",
      "high-performance-lightweight": "o4-mini-high",

      // 增强版本
      "enhanced-accuracy": "gpt-4.1",
      "lightweight-enhanced": "gpt-4.1-mini",
      "ultra-lightweight-enhanced": "gpt-4.1-nano",

      // 多模态
      multimodal: "gpt-5.2",
      "multimodal-lightweight": "gpt-5-mini",
    };

    return recommendations[useCase] || "gpt-5.2";
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

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: model,
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
  }

  // Create system prompt with file context
  _createSystemPrompt(fileContext, currentDir) {
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

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: model,
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
