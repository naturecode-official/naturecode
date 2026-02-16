import fs from "fs";
import path from "path";
import os from "os";
import { secureStore } from "./secure-store.js";

const CONFIG_DIR = path.join(os.homedir(), ".naturecode");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG = {
  provider: "deepseek",
  apiKey: "",
  model: "deepseek-chat",
  modelType: "chat",
  temperature: 0.7,
  maxTokens: 2000,
  stream: true,
  // fallbackModel 由 autoConfigureDefaults 设置
};

// 智能默认模型选择
const SMART_DEFAULT_MODELS = {
  openai: "gpt-4o-mini", // 免费、快速、可靠的默认选择
  deepseek: "deepseek-chat", // 免费、中文优化
  ollama: "llama3.2", // 本地运行
  anthropic: "claude-3-haiku", // 快速、便宜
  gemini: "gemini-1.5-flash", // 免费、快速
};

const VALID_PROVIDERS = ["deepseek", "openai", "ollama", "anthropic", "gemini"];
const DEEPSEEK_MODELS = ["deepseek-chat", "deepseek-reasoner"];
const OPENAI_MODELS = [
  // GPT-5系列 (最新)
  "gpt-5-preview",
  "gpt-5-mini-preview",
  "gpt-5.2-preview",
  "gpt-5.2-pro-preview",

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

const OLLAMA_MODELS = [
  "llama3.2",
  "llama3.2:latest",
  "llama3.1",
  "llama3.1:latest",
  "mistral",
  "mistral:latest",
  "mixtral",
  "mixtral:latest",
  "codellama",
  "codellama:latest",
  "deepseek-coder",
  "deepseek-coder:latest",
  "deepseek-chat",
  "deepseek-chat:latest",
  "phi",
  "phi:latest",
  "qwen",
  "qwen:latest",
];

const ANTHROPIC_MODELS = [
  // Claude 4.6 系列
  "claude-opus-4.6",

  // Claude 4.5 系列
  "claude-opus-4.5",
  "claude-sonnet-4.5",
  "claude-haiku-4.5",

  // Claude 4.1 系列
  "claude-opus-4.1",

  // Claude 4 系列
  "claude-opus-4",
  "claude-sonnet-4",

  // Claude 3.7 系列
  "claude-3.7-sonnet",

  // Claude 3.5 系列
  "claude-3.5-haiku",

  // Claude 3 系列
  "claude-3-haiku",

  // 现有模型 (保持向后兼容)
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
];

const GEMINI_MODELS = [
  // Gemini 3 Series (Latest)
  "gemini-3-pro",
  "gemini-3-deep-think",
  "gemini-3-flash",

  // Gemini 2.5 Series
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-computer-use",

  // Gemini 2.0 Series
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-2.0-flash-thinking",

  // Open Source Gemma Series
  "gemma-3n",
  "gemma-3",
  "gemini-2",
  "codegemma",
  "shieldgemma-2",

  // Legacy models (keep for backward compatibility)
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
];

class ConfigManager {
  constructor() {
    this._ensureConfigDir();
  }

  _ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  load() {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        return { ...DEFAULT_CONFIG };
      }

      const configData = fs.readFileSync(CONFIG_FILE, "utf8");
      const config = JSON.parse(configData);

      // If config has apiKeyId, load API key from encrypted storage
      if (config.apiKeyId && config.provider) {
        const apiKeyInfo = secureStore.getApiKey(
          config.provider,
          config.apiKeyId,
        );
        if (apiKeyInfo && apiKeyInfo.key) {
          config.apiKey = apiKeyInfo.key;
          // Also update metadata if available
          if (apiKeyInfo.metadata) {
            config.apiKeyName = apiKeyInfo.metadata.name || config.apiKeyName;
            config.model = apiKeyInfo.metadata.model || config.model;
            config.modelType =
              apiKeyInfo.metadata.modelType || config.modelType;
          }
        } else {
          console.warn("Warning: API key not found in encrypted storage");
          config.apiKey = "";
        }
      }

      const validatedConfig = this._validateConfig(config);

      // 自动应用智能默认配置
      const autoConfigured = this.autoConfigureDefaults(validatedConfig);

      // 确保 fallbackModel 被设置
      if (!autoConfigured.fallbackModel) {
        autoConfigured.fallbackModel = this.getSmartDefaultModel(
          autoConfigured.provider,
        );
      }

      return autoConfigured;
    } catch (error) {
      console.error(
        "Warning: Failed to load config, using defaults:",
        error.message,
      );
      const defaultConfig = { ...DEFAULT_CONFIG };
      return this.autoConfigureDefaults(defaultConfig);
    }
  }

  save(config) {
    try {
      const validatedConfig = this._validateConfig(config);

      // Store API key in encrypted storage if provided
      if (validatedConfig.apiKey && validatedConfig.apiKey.trim() !== "") {
        const keyId =
          validatedConfig.apiKeyName || `default-${validatedConfig.provider}`;
        secureStore.saveApiKey(
          validatedConfig.provider,
          keyId,
          validatedConfig.apiKey,
          {
            name: validatedConfig.apiKeyName,
            model: validatedConfig.model,
            modelType: validatedConfig.modelType,
            isDefault: true,
            createdAt: new Date().toISOString(),
          },
        );

        // Store key reference in config
        validatedConfig.apiKeyId = keyId;
        validatedConfig.apiKey = "[ENCRYPTED_STORAGE]"; // Indicate key is encrypted
      }

      const configData = JSON.stringify(validatedConfig, null, 2);

      fs.writeFileSync(CONFIG_FILE, configData, "utf8");
      fs.chmodSync(CONFIG_FILE, 0o600);

      return true;
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  // 获取智能默认模型（用户无需选择）
  getSmartDefaultModel(provider) {
    return SMART_DEFAULT_MODELS[provider] || DEFAULT_CONFIG.model;
  }

  // 检查是否需要配置（没有API密钥或模型）
  needsConfiguration() {
    const config = this.load();
    return (
      !config.apiKey ||
      config.apiKey === "" ||
      config.apiKey === "[ENCRYPTED_STORAGE]"
    );
  }

  // 自动配置默认设置
  autoConfigureDefaults(config) {
    const validatedConfig = { ...config };

    // 如果模型未设置或无效，设置智能默认模型
    if (!validatedConfig.model || validatedConfig.model === "") {
      validatedConfig.model = this.getSmartDefaultModel(
        validatedConfig.provider,
      );
    }

    // 设置回退模型（如果未设置）
    if (
      validatedConfig.fallbackModel === undefined ||
      validatedConfig.fallbackModel === null
    ) {
      validatedConfig.fallbackModel = this.getSmartDefaultModel(
        validatedConfig.provider,
      );
    }

    return validatedConfig;
  }

  _validateConfig(config) {
    const validated = { ...DEFAULT_CONFIG, ...config };

    // 确保 fallbackModel 在 autoConfigureDefaults 中处理
    // 这里不设置默认值，让 autoConfigureDefaults 处理

    // API key can be empty if it will be loaded from secure storage
    if (validated.apiKey === undefined || validated.apiKey === null) {
      validated.apiKey = "";
    }

    if (typeof validated.apiKey !== "string") {
      throw new Error("API key must be a string");
    }

    if (!VALID_PROVIDERS.includes(validated.provider)) {
      throw new Error(`Provider must be one of: ${VALID_PROVIDERS.join(", ")}`);
    }

    if (validated.provider === "deepseek") {
      if (!DEEPSEEK_MODELS.includes(validated.model)) {
        throw new Error(
          `DeepSeek model must be one of: ${DEEPSEEK_MODELS.join(", ")}`,
        );
      }
    } else if (validated.provider === "openai") {
      if (!OPENAI_MODELS.includes(validated.model)) {
        throw new Error(
          `OpenAI model must be one of: ${OPENAI_MODELS.join(", ")}`,
        );
      }
    } else if (validated.provider === "ollama") {
      if (!OLLAMA_MODELS.includes(validated.model)) {
        throw new Error(
          `Ollama model must be one of: ${OLLAMA_MODELS.join(", ")}`,
        );
      }
    } else if (validated.provider === "anthropic") {
      if (!ANTHROPIC_MODELS.includes(validated.model)) {
        throw new Error(
          `Anthropic model must be one of: ${ANTHROPIC_MODELS.join(", ")}`,
        );
      }
    } else if (validated.provider === "gemini") {
      if (!GEMINI_MODELS.includes(validated.model)) {
        throw new Error(
          `Gemini model must be one of: ${GEMINI_MODELS.join(", ")}`,
        );
      }
    }

    if (validated.temperature < 0 || validated.temperature > 2) {
      throw new Error("Temperature must be between 0.0 and 2.0");
    }

    if (validated.maxTokens < 1 || validated.maxTokens > 4000) {
      throw new Error("Max tokens must be between 1 and 4000");
    }

    // Validate fallback model if provided
    if (
      validated.fallbackModel !== undefined &&
      validated.fallbackModel !== null
    ) {
      if (validated.provider === "openai") {
        if (!OPENAI_MODELS.includes(validated.fallbackModel)) {
          throw new Error(
            `OpenAI fallback model must be one of: ${OPENAI_MODELS.join(", ")}`,
          );
        }
      } else if (validated.provider === "deepseek") {
        if (!DEEPSEEK_MODELS.includes(validated.fallbackModel)) {
          throw new Error(
            `DeepSeek fallback model must be one of: ${DEEPSEEK_MODELS.join(", ")}`,
          );
        }
      } else if (validated.provider === "ollama") {
        if (!OLLAMA_MODELS.includes(validated.fallbackModel)) {
          throw new Error(
            `Ollama fallback model must be one of: ${OLLAMA_MODELS.join(", ")}`,
          );
        }
      } else if (validated.provider === "anthropic") {
        if (!ANTHROPIC_MODELS.includes(validated.fallbackModel)) {
          throw new Error(
            `Anthropic fallback model must be one of: ${ANTHROPIC_MODELS.join(", ")}`,
          );
        }
      } else if (validated.provider === "gemini") {
        if (!GEMINI_MODELS.includes(validated.fallbackModel)) {
          throw new Error(
            `Gemini fallback model must be one of: ${GEMINI_MODELS.join(", ")}`,
          );
        }
      }
    }

    return validated;
  }

  exists() {
    return fs.existsSync(CONFIG_FILE);
  }

  getConfigPath() {
    return CONFIG_FILE;
  }

  clear() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to clear configuration: ${error.message}`);
    }
  }

  getModelsForProvider(provider) {
    switch (provider) {
      case "deepseek":
        return DEEPSEEK_MODELS;
      case "openai":
        return OPENAI_MODELS;
      case "ollama":
        return OLLAMA_MODELS;
      case "anthropic":
        return ANTHROPIC_MODELS;
      case "gemini":
        return GEMINI_MODELS;
      default:
        return [];
    }
  }
}

export const configManager = new ConfigManager();
