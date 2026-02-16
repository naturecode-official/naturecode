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
  openai: "gpt-5-mini", // 最新、快速、可靠的默认选择
  deepseek: "deepseek-chat", // 免费、中文优化
  ollama: "llama3.2", // 本地运行
  anthropic: "claude-haiku-4-5-20251001", // 快速、便宜
  gemini: "gemini-2.5-flash", // 快速、高效
};

const VALID_PROVIDERS = ["deepseek", "openai", "ollama", "anthropic", "gemini"];
const DEEPSEEK_MODELS = ["deepseek-chat", "deepseek-reasoner"];
const OPENAI_MODELS = [
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
];

const OLLAMA_MODELS = [
  // Meta 系列
  "llama3.2",
  "llama3.2:latest",
  "llama3.1",
  "llama3.1:latest",

  // Mistral 系列
  "mistral",
  "mistral:latest",
  "mixtral",
  "mixtral:latest",

  // 代码生成系列
  "codellama",
  "codellama:latest",

  // DeepSeek 系列
  "deepseek-coder",
  "deepseek-coder:latest",
  "deepseek-chat",
  "deepseek-chat:latest",
  "deepseek-math",
  "deepseek-math:latest",
  "deepseek-reasoner",
  "deepseek-reasoner:latest",
  "deepseek-v2",
  "deepseek-v2:latest",
  "deepseek-v2-lite",
  "deepseek-v2-lite:latest",

  // 其他模型
  "phi",
  "phi:latest",
  "qwen",
  "qwen:latest",

  // GPT 开源系列 (从 OpenAI 迁移)
  "gpt-oss-120b",
  "gpt-oss-20b",

  // Google Gemma 系列
  "gemma-2b",
  "gemma-2b-it",
  "gemma-7b",
  "gemma-7b-it",
  "gemma-2-9b",
  "gemma-2-9b-it",
  "gemma-2-27b",
  "gemma-2-27b-it",
];

const ANTHROPIC_MODELS = [
  // Claude 最新系列
  "claude-opus-4-6",
  "claude-opus-4-1-20250805",
  "claude-opus-4-0",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-4-0",
  "claude-haiku-4-5-20251001",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
];

const GEMINI_MODELS = [
  // Gemini 最新系列
  "gemini-3-pro-preview",
  "gemini-3-flash-preview",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-image",
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
