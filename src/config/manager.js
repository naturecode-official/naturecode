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
};

const VALID_PROVIDERS = ["deepseek", "openai", "ollama"];
const DEEPSEEK_MODELS = ["deepseek-chat", "deepseek-reasoner"];
const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-4-32k",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-instruct",
  "gpt-4o-realtime-preview",
  "gpt-4o-audio-preview",
  "gpt-4o-mini-audio-preview",
  "gpt-4o-vision-preview",
  "gpt-4-vision-preview",
  "gpt-4o-2024-08-06",
  "gpt-4-turbo-2024-04-09",
  "gpt-3.5-turbo-0613",
  "gpt-4-0613",
  "gpt-4-32k-0613",
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
        const apiKey = secureStore.getApiKey(config.provider, config.apiKeyId);
        if (apiKey) {
          config.apiKey = apiKey;
        } else {
          console.warn("Warning: API key not found in encrypted storage");
          config.apiKey = "";
        }
      }

      return this._validateConfig(config);
    } catch (error) {
      console.error(
        "Warning: Failed to load config, using defaults:",
        error.message,
      );
      return { ...DEFAULT_CONFIG };
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

  _validateConfig(config) {
    const validated = { ...DEFAULT_CONFIG, ...config };

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
    }

    if (validated.temperature < 0 || validated.temperature > 2) {
      throw new Error("Temperature must be between 0.0 and 2.0");
    }

    if (validated.maxTokens < 1 || validated.maxTokens > 4000) {
      throw new Error("Max tokens must be between 1 and 4000");
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
}

export const configManager = new ConfigManager();
