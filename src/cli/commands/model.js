import inquirer from "inquirer";
import { configManager } from "../../config/manager.js";
import { secureStore } from "../../config/secure-store.js";

export async function runModelConfiguration() {
  console.log("NatureCode AI Configuration Wizard\n");

  const currentConfig = configManager.load();

  const questions = [
    {
      type: "list",
      name: "provider",
      message: "Select AI Provider:",
      choices: [
        {
          name: "DeepSeek (Recommended) - Powerful and affordable AI models",
          value: "deepseek",
          description: "Powerful and affordable AI models",
        },
        {
          name: "OpenAI - Industry-leading AI models (GPT-4, GPT-3.5, etc.)",
          value: "openai",
          description: "Industry-leading AI models (GPT-4, GPT-3.5, etc.)",
        },
        {
          name: "Azure OpenAI - Microsoft Azure hosted OpenAI models",
          value: "azure-openai",
          description:
            "Microsoft Azure hosted OpenAI models with custom resource name",
        },
        {
          name: "n1n.ai - OpenAI-compatible API with custom endpoint",
          value: "n1n",
          description:
            "OpenAI-compatible API with custom endpoint (https://api.n1n.top/v1)",
        },
        {
          name: "4SAPI - OpenAI-compatible API (https://4sapi.com/v1)",
          value: "4sapi",
          description:
            "OpenAI-compatible API with fixed endpoint (https://4sapi.com/v1)",
        },
        {
          name: "Qwen (DashScope) - Alibaba Cloud Qwen models",
          value: "dashscope",
          description: "Alibaba Cloud Qwen models via DashScope API",
        },
        {
          name: "Anthropic - Claude models (Claude 3.5, Claude 3, etc.)",
          value: "anthropic",
          description: "Claude models (Claude 3.5, Claude 3, etc.)",
        },
        {
          name: "Google Gemini - Google's latest AI models (Gemini 2.0, 1.5, etc.)",
          value: "gemini",
          description: "Google's latest AI models (Gemini 2.0, 1.5, etc.)",
        },
        {
          name: "Ollama - Local AI models (free, runs on your machine)",
          value: "ollama",
          description: "Local AI models (free, runs on your machine)",
        },
        {
          name: "Zhipu AI (智谱AI) - Chinese AI models (GLM series)",
          value: "zhipuai",
          description: "Chinese AI models including GLM-4 series",
        },
        {
          name: "Tencent Hunyuan (腾讯混元) - Tencent Cloud AI models",
          value: "tencent",
          description: "Tencent Cloud Hunyuan AI models via Tencent Cloud API",
        },
        {
          name: "Baidu ERNIE (文心一言) - Baidu AI models",
          value: "baidu",
          description: "Baidu ERNIE AI models via Baidu Cloud API",
        },
        {
          name: "Custom Provider - Connect to any AI API",
          value: "custom",
          description: "Connect to any AI API with custom configuration",
        },
      ],
      default: currentConfig.provider || "deepseek",
    },
    {
      type: "input",
      name: "apiKey",
      message: (answers) => {
        if (answers.provider === "deepseek") {
          return "Enter your DeepSeek API key (leave empty to skip):";
        } else if (answers.provider === "openai") {
          return "Enter your OpenAI API key (leave empty to skip):";
        } else if (answers.provider === "azure-openai") {
          return "Enter your Azure OpenAI API key (leave empty to skip):";
        } else if (answers.provider === "n1n") {
          return "Enter your n1n.ai API key (leave empty to skip):";
        } else if (answers.provider === "anthropic") {
          return "Enter your Anthropic API key (leave empty to skip):";
        } else if (answers.provider === "gemini") {
          return "Enter your Google Gemini API key (leave empty to skip):";
        } else if (answers.provider === "zhipuai") {
          return "Enter your Zhipu AI API key (leave empty to skip):";
        } else if (answers.provider === "tencent") {
          return "Enter your Tencent Cloud API key (leave empty to skip):";
        } else if (answers.provider === "baidu") {
          return "Enter your Baidu ERNIE API key (leave empty to skip):";
        } else if (answers.provider === "custom") {
          return "Enter your Custom Provider API key (leave empty to skip):";
        }
        return "Ollama does not require an API key (press Enter to continue):";
      },
      default: (answers) => {
        // Only show default API key for providers that need it
        if (
          answers.provider === "deepseek" ||
          answers.provider === "openai" ||
          answers.provider === "azure-openai" ||
          answers.provider === "n1n" ||
          answers.provider === "anthropic" ||
          answers.provider === "gemini" ||
          answers.provider === "zhipuai"
        ) {
          return currentConfig.apiKey || undefined;
        }
        return undefined;
      },
      when: (answers) =>
        answers.provider === "deepseek" ||
        answers.provider === "openai" ||
        answers.provider === "azure-openai" ||
        answers.provider === "n1n" ||
        answers.provider === "anthropic" ||
        answers.provider === "gemini" ||
        answers.provider === "zhipuai" ||
        answers.provider === "tencent" ||
        answers.provider === "baidu" ||
        answers.provider === "custom",
    },
    {
      type: "input",
      name: "model",
      message: (answers) => {
        if (answers.provider === "deepseek") {
          return "Enter DeepSeek model name (e.g., deepseek-chat, deepseek-reasoner):";
        } else if (answers.provider === "openai") {
          return "Enter OpenAI model name (e.g., gpt-5-mini, gpt-5.2-pro):";
        } else if (answers.provider === "azure-openai") {
          return "Enter Azure OpenAI model name (e.g., gpt-4, gpt-35-turbo):";
        } else if (answers.provider === "n1n") {
          return "Enter n1n.ai model name (e.g., gpt-4o-mini, claude-3-5-sonnet):";
        } else if (answers.provider === "4sapi") {
          return "Enter 4SAPI model name (e.g., gpt-4o-mini, claude-3-5-sonnet):";
        } else if (answers.provider === "dashscope") {
          return "Enter DashScope model name (e.g., qwen-max, qwen-plus):";
        } else if (answers.provider === "anthropic") {
          return "Enter Anthropic model name (e.g., claude-3-5-haiku, claude-3-5-sonnet):";
        } else if (answers.provider === "gemini") {
          return "Enter Google Gemini model name (e.g., gemini-2.5-flash, gemini-2.0-pro):";
        } else if (answers.provider === "ollama") {
          return "Enter Ollama model name (e.g., llama3.2, mistral):";
        } else if (answers.provider === "zhipuai") {
          return "Enter Zhipu AI model name (e.g., glm-4-flash, glm-4-plus):";
        } else if (answers.provider === "tencent") {
          return "Enter Tencent Hunyuan model name (e.g., hunyuan-standard, hunyuan-lite):";
        } else if (answers.provider === "baidu") {
          return "Enter Baidu ERNIE model name (e.g., ernie-4.0, ernie-speed):";
        } else if (answers.provider === "custom") {
          return "Enter Custom Provider model name:";
        }
        return "Enter model name:";
      },
      default: (answers) => {
        const smartDefaults = {
          deepseek: "deepseek-chat",
          openai: "gpt-5-mini",
          "azure-openai": "gpt-4",
          n1n: "gpt-4o-mini",
          "4sapi": "gpt-4o-mini",
          dashscope: "qwen-max",
          anthropic: "claude-3-5-haiku",
          gemini: "gemini-2.5-flash",
          ollama: "llama3.2",
          zhipuai: "glm-4-flash",
          tencent: "hunyuan-standard",
          baidu: "ernie-4.0",
          custom: "custom-model",
        };
        return currentConfig.model || smartDefaults[answers.provider] || "";
      },
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return "Model name cannot be empty";
        }
        if (input.trim().length > 100) {
          return "Model name must be less than 100 characters";
        }
        return true;
      },
      when: (answers) =>
        answers.provider === "deepseek" ||
        answers.provider === "openai" ||
        answers.provider === "azure-openai" ||
        answers.provider === "n1n" ||
        answers.provider === "4sapi" ||
        answers.provider === "dashscope" ||
        answers.provider === "anthropic" ||
        answers.provider === "gemini" ||
        answers.provider === "ollama" ||
        answers.provider === "zhipuai" ||
        answers.provider === "tencent" ||
        answers.provider === "baidu" ||
        answers.provider === "custom",
    },
    {
      type: "number",
      name: "temperature",
      message: "Set temperature (0.0-2.0, press Enter for default 0.7):",
      default: currentConfig.temperature || 0.7,
      validate: (input) => {
        if (input === "" || input === undefined) {
          return true; // Allow empty input to use default
        }
        const value = parseFloat(input);
        if (isNaN(value) || value < 0 || value > 2) {
          return "Temperature must be between 0.0 and 2.0";
        }
        return true;
      },
      filter: (input) => {
        if (input === "" || input === undefined) {
          return currentConfig.temperature || 0.7;
        }
        return parseFloat(input);
      },
    },
    {
      type: "confirm",
      name: "stream",
      message: "Enable streaming responses?",
      default: currentConfig.stream !== false,
      description: "Stream responses show text as it's generated (recommended)",
    },
    {
      type: "confirm",
      name: "advancedSettings",
      message: "Configure advanced settings?",
      default: false,
      description: "Custom endpoints, organization ID, etc.",
    },
    {
      type: "input",
      name: "keyName",
      message:
        "Give this configuration a name (e.g., 'Work GPT', 'Personal Claude', 'Code Assistant'):",
      default: (answers) => `${answers.provider}-${answers.model || "default"}`,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return "Configuration name cannot be empty";
        }
        if (input.trim().length > 50) {
          return "Configuration name must be less than 50 characters";
        }
        return true;
      },
    },
    // 自定义提供者特定配置
    {
      type: "input",
      name: "customBaseUrl",
      message:
        "Enter Custom API Base URL (e.g., https://api.custom-provider.com/v1):",
      default: (_answers) => currentConfig.baseUrl || "",
      validate: (input) => {
        if (!input || input.trim() === "") {
          return "Base URL is required for custom provider";
        }
        try {
          new URL(input.trim());
          return true;
        } catch (error) {
          return "Please enter a valid URL (e.g., https://api.example.com/v1)";
        }
      },
      when: (answers) => answers.provider === "custom",
    },
    {
      type: "input",
      name: "customApiVersion",
      message: "Enter API Version (press Enter for default '2024-01-01'):",
      default: (_answers) => currentConfig.apiVersion || "2024-01-01",
      when: (answers) => answers.provider === "custom",
    },
    {
      type: "input",
      name: "customOrganization",
      message: "Enter Organization ID (optional, press Enter to skip):",
      default: (_answers) => currentConfig.organization || "",
      when: (answers) => answers.provider === "custom",
    },
    {
      type: "confirm",
      name: "confirm",
      message: "Save this configuration?",
      default: true,
    },
  ];

  // 检查是否通过管道输入，避免readline问题
  // 但在交互式模式中，即使通过管道输入也应该允许配置
  const isInInteractiveMode = process.env.NATURECODE_INTERACTIVE === "true";

  if (!process.stdin.isTTY && !isInInteractiveMode) {
    console.log("Error: Interactive mode required for configuration.");
    console.log("Please run: naturecode model");
    return;
  }

  const answers = await inquirer.prompt(questions);

  if (!answers.confirm) {
    console.log("Configuration cancelled.");
    return;
  }

  const config = {
    provider: answers.provider,
    apiKey: answers.apiKey,
    apiKeyName:
      answers.keyName || `${answers.provider}-${answers.model || "default"}`,
    model: answers.model,
    modelType: "chat", // Always use chat mode for language interaction
    temperature: answers.temperature || currentConfig.temperature || 0.7,
    maxTokens: 4000, // Fixed to allow longer AI responses
    stream:
      answers.stream !== undefined
        ? answers.stream
        : currentConfig.stream !== false,

    // Azure OpenAI specific fields
    azureResourceName: answers.azureResourceName || undefined,
    azureApiVersion: answers.azureApiVersion || undefined,
    // Baidu ERNIE specific fields
    secretKey: answers.baiduSecretKey || undefined,
    // Custom provider specific fields
    baseUrl: answers.customBaseUrl || undefined,
    apiVersion: answers.customApiVersion || undefined,
    organization: answers.customOrganization || undefined,
  };

  try {
    // Save to config manager
    configManager.save(config);

    // Also save to secure store with metadata
    const keyId = `${config.provider}-${Date.now()}`;
    secureStore.saveApiKey(config.provider, keyId, config.apiKey, {
      name: answers.keyName,
      model: config.model,
      modelType: config.modelType,
    });

    console.log("\nConfiguration saved successfully!");
    console.log(`Config file: ${configManager.getConfigPath()}`);

    console.log("\nSummary:");
    console.log(`  Name: ${answers.keyName}`);
    console.log(`  Provider: ${config.provider}`);
    console.log(`  Model: ${config.model} (language interaction)`);
    console.log(`  Temperature: ${config.temperature}`);
    console.log(`  Streaming: ${config.stream ? "Enabled" : "Disabled"}`);
    console.log(`  Max Tokens: 2000 (optimal with tools)`);

    console.log("\nYou can now start using NatureCode:");
    console.log("  naturecode start     - Start interactive session");
    console.log("  naturecode config    - View current configuration");
    console.log("  naturecode model     - Reconfigure settings");
  } catch (error) {
    console.error("Error: Failed to save configuration:", error.message);
    throw error;
  }
}
