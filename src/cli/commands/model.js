import inquirer from "inquirer";
import { configManager } from "../../config/manager.js";
import { secureStore } from "../../config/secure-store.js";
import { OpenAIProvider } from "../../providers/openai.js";
import { GeminiProvider } from "../../providers/gemini.js";
import { OllamaProvider } from "../../providers/ollama.js";
import { ZhipuAIProvider } from "../../providers/zhipuai.js";
import { DashScopeProvider } from "../../providers/dashscope.js";
import { TencentProvider } from "../../providers/tencent.js";
import { BaiduProvider } from "../../providers/baidu.js";

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
      type: "list",
      name: "modelType",
      message: "Select Model Type:",
      choices: (answers) => {
        if (answers.provider === "deepseek") {
          // For DeepSeek, model type is determined by the model selection
          // deepseek-chat -> chat, deepseek-reasoner -> reasoner
          const modelType =
            answers.model === "deepseek-reasoner" ? "reasoner" : "chat";
          return [
            {
              name:
                modelType === "reasoner"
                  ? "Reasoner - Complex problem solving and analysis (auto-selected based on model)"
                  : "Chat - General conversation and assistance (auto-selected based on model)",
              value: modelType,
              short: modelType,
            },
          ];
        } else if (
          answers.provider === "openai" ||
          answers.provider === "azure-openai" ||
          answers.provider === "n1n" ||
          answers.provider === "4sapi"
        ) {
          // OpenAI/Azure OpenAI/n1n.ai/4SAPI model type based on selected model
          // Use static method to get model capabilities, avoid creating provider instance
          const capabilities = OpenAIProvider.getStaticModelCapabilities(
            answers.model,
          );
        } else if (answers.provider === "dashscope") {
          // DashScope model type based on selected model
          const capabilities = DashScopeProvider.getStaticModelCapabilities(
            answers.model,
          );

          const choices = [];

          if (capabilities.includes("text")) {
            choices.push({
              name: "Text Generation - Standard text completion",
              value: "text",
              short: "Text",
            });
          }

          if (capabilities.includes("vision")) {
            choices.push({
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            });
          }

          if (capabilities.includes("chat")) {
            choices.push({
              name: "Chat - Interactive conversation",
              value: "chat",
              short: "Chat",
            });
          }

          if (capabilities.includes("audio")) {
            choices.push({
              name: "Audio - Speech recognition and generation",
              value: "audio",
              short: "Audio",
            });
          }

          if (choices.length === 0) {
            choices.push({
              name: "Text - Default text generation",
              value: "text",
              short: "Text",
            });
          }

          return choices;
        } else if (answers.provider === "anthropic") {
          // Anthropic models are primarily text/chat models
          const choices = [];

          choices.push({
            name: "Chat - Interactive conversation (recommended for Claude models)",
            value: "chat",
            short: "Chat",
          });

          choices.push({
            name: "Text - Standard text generation",
            value: "text",
            short: "Text",
          });

          return choices;
        } else if (answers.provider === "gemini") {
          // Use static method to get Gemini model capabilities
          const capabilities = GeminiProvider.getStaticModelCapabilities(
            answers.model,
          );

          const choices = [];

          if (capabilities.includes("text")) {
            choices.push({
              name: "Text Generation - Standard text completion",
              value: "text",
              short: "Text",
            });
          }

          if (capabilities.includes("chat")) {
            choices.push({
              name: "Chat - Interactive conversation (recommended for Gemini)",
              value: "chat",
              short: "Chat",
            });
          }

          if (capabilities.includes("vision")) {
            choices.push({
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            });
          }

          if (capabilities.includes("code")) {
            choices.push({
              name: "Code - Code generation and analysis",
              value: "code",
              short: "Code",
            });
          }

          if (capabilities.includes("security")) {
            choices.push({
              name: "Security - Security-focused analysis and protection",
              value: "security",
              short: "Security",
            });
          }

          if (choices.length === 0) {
            choices.push({
              name: "Text - Default text generation",
              value: "text",
              short: "Text",
            });
          }

          return choices;
        } else if (answers.provider === "ollama") {
          // Ollama model capabilities
          const capabilities = OllamaProvider.getStaticModelCapabilities(
            answers.model,
          );

          const choices = [];

          if (capabilities.includes("text")) {
            choices.push({
              name: "Text Generation - Standard text completion",
              value: "text",
              short: "Text",
            });
          }

          if (capabilities.includes("chat")) {
            choices.push({
              name: "Chat - Interactive conversation",
              value: "chat",
              short: "Chat",
            });
          }

          if (capabilities.includes("code")) {
            choices.push({
              name: "Code - Code generation and analysis",
              value: "code",
              short: "Code",
            });
          }

          if (capabilities.includes("vision")) {
            choices.push({
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            });
          }

          if (choices.length === 0) {
            choices.push({
              name: "Text - Default text generation",
              value: "text",
              short: "Text",
            });
          }

          return choices;
        } else if (answers.provider === "zhipuai") {
          // 智谱AI模型能力
          const capabilities = ZhipuAIProvider.getStaticModelCapabilities(
            answers.model,
          );

          const choices = [];

          if (capabilities.includes("text")) {
            choices.push({
              name: "Text Generation - Standard text completion",
              value: "text",
              short: "Text",
            });
          }

          if (capabilities.includes("chat")) {
            choices.push({
              name: "Chat - Interactive conversation (recommended for Zhipu AI)",
              value: "chat",
              short: "Chat",
            });
          }

          if (capabilities.includes("vision")) {
            choices.push({
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            });
          }

          if (capabilities.includes("roleplay")) {
            choices.push({
              name: "Roleplay - Character interaction and role playing",
              value: "roleplay",
              short: "Roleplay",
            });
          }

          if (choices.length === 0) {
            choices.push({
              name: "Chat - Default for Zhipu AI models",
              value: "chat",
              short: "Chat",
            });
          }

          return choices;
        } else if (answers.provider === "tencent") {
          // Tencent Hunyuan model capabilities
          const capabilities = TencentProvider.getStaticModelCapabilities(
            answers.model,
          );

          const choices = [];

          if (capabilities.includes("text")) {
            choices.push({
              name: "Text Generation - Standard text completion",
              value: "text",
              short: "Text",
            });
          }

          if (capabilities.includes("chat")) {
            choices.push({
              name: "Chat - Interactive conversation (recommended for Tencent Hunyuan)",
              value: "chat",
              short: "Chat",
            });
          }

          if (capabilities.includes("vision")) {
            choices.push({
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            });
          }

          if (capabilities.includes("code")) {
            choices.push({
              name: "Code - Code generation and analysis",
              value: "code",
              short: "Code",
            });
          }

          if (choices.length === 0) {
            choices.push({
              name: "Chat - Default for Tencent Hunyuan models",
              value: "chat",
              short: "Chat",
            });
          }

          return choices;
        } else if (answers.provider === "baidu") {
          // Baidu ERNIE model capabilities
          const capabilities = BaiduProvider.getStaticModelCapabilities(
            answers.model,
          );

          const choices = [];

          if (capabilities.includes("text")) {
            choices.push({
              name: "Text Generation - Standard text completion",
              value: "text",
              short: "Text",
            });
          }

          if (capabilities.includes("chat")) {
            choices.push({
              name: "Chat - Interactive conversation (recommended for Baidu ERNIE)",
              value: "chat",
              short: "Chat",
            });
          }

          if (capabilities.includes("vision")) {
            choices.push({
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            });
          }

          if (capabilities.includes("code")) {
            choices.push({
              name: "Code - Code generation and analysis",
              value: "code",
              short: "Code",
            });
          }

          if (capabilities.includes("fast")) {
            choices.push({
              name: "Fast - Quick response for simple tasks (ERNIE-Speed/Lite)",
              value: "fast",
              short: "Fast",
            });
          }

          if (capabilities.includes("balanced")) {
            choices.push({
              name: "Balanced - Balanced performance and speed (ERNIE-Turbo)",
              value: "balanced",
              short: "Balanced",
            });
          }

          if (capabilities.includes("advanced")) {
            choices.push({
              name: "Advanced - Complex task handling (ERNIE 4.0/3.5)",
              value: "advanced",
              short: "Advanced",
            });
          }

          if (choices.length === 0) {
            choices.push({
              name: "Chat - Default for Baidu ERNIE models",
              value: "chat",
              short: "Chat",
            });
          }

          return choices;
        } else if (answers.provider === "custom") {
          // 自定义提供者支持所有模型类型
          return [
            {
              name: "Text - Standard text generation",
              value: "text",
              short: "Text",
            },
            {
              name: "Chat - Interactive conversation",
              value: "chat",
              short: "Chat",
            },
            {
              name: "Code - Code generation and analysis",
              value: "code",
              short: "Code",
            },
            {
              name: "Vision - Image analysis and understanding",
              value: "vision",
              short: "Vision",
            },
            {
              name: "Reasoner - Advanced reasoning and problem solving",
              value: "reasoner",
              short: "Reasoner",
            },
          ];
        }
        return [];
      },
      default: (answers) => {
        if (answers.provider === "deepseek") {
          return answers.model === "deepseek-reasoner" ? "reasoner" : "chat";
        } else if (
          answers.provider === "openai" ||
          answers.provider === "azure-openai" ||
          answers.provider === "n1n" ||
          answers.provider === "4sapi" ||
          answers.provider === "dashscope"
        ) {
          return currentConfig.modelType || "text";
        } else if (answers.provider === "anthropic") {
          return currentConfig.modelType || "chat";
        } else if (answers.provider === "gemini") {
          return currentConfig.modelType || "chat";
        } else if (answers.provider === "ollama") {
          return currentConfig.modelType || "chat";
        } else if (answers.provider === "zhipuai") {
          return currentConfig.modelType || "chat";
        } else if (answers.provider === "tencent") {
          return currentConfig.modelType || "chat";
        } else if (answers.provider === "baidu") {
          return currentConfig.modelType || "chat";
        } else if (answers.provider === "custom") {
          return currentConfig.modelType || "text";
        }
        return "text";
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
      type: "confirm",
      name: "advancedSettings",
      message: "Configure advanced settings?",
      default: false,
      description: "Temperature, token limits, streaming, etc.",
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
      when: (answers) => answers.advancedSettings,
    },
    {
      type: "number",
      name: "maxTokens",
      message:
        "Set maximum tokens per response (1-4000, press Enter for default 2000):",
      default: currentConfig.maxTokens || 2000,
      validate: (input) => {
        if (input === "" || input === undefined) {
          return true; // Allow empty input to use default
        }
        const value = parseInt(input);
        if (isNaN(value) || value < 1 || value > 4000) {
          return "Max tokens must be between 1 and 4000";
        }
        return true;
      },
      filter: (input) => {
        if (input === "" || input === undefined) {
          return currentConfig.maxTokens || 2000;
        }
        return parseInt(input);
      },
      when: (answers) => answers.advancedSettings,
    },
    {
      type: "confirm",
      name: "stream",
      message: "Enable streaming responses?",
      default: currentConfig.stream !== false,
      description: "Stream responses show text as it's generated (recommended)",
      when: (answers) => answers.advancedSettings,
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
    modelType: answers.modelType,
    temperature: answers.temperature || currentConfig.temperature || 0.7,
    maxTokens: answers.maxTokens || currentConfig.maxTokens || 2000,
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
    console.log(`  Model: ${config.model} (${config.modelType})`);
    console.log(`  Temperature: ${config.temperature}`);
    console.log(`  Max Tokens: ${config.maxTokens}`);
    console.log(`  Streaming: ${config.stream ? "Enabled" : "Disabled"}`);

    console.log("\nYou can now start using NatureCode:");
    console.log("  naturecode start     - Start interactive session");
    console.log("  naturecode config    - View current configuration");
    console.log("  naturecode model     - Reconfigure settings");
  } catch (error) {
    console.error("Error: Failed to save configuration:", error.message);
    throw error;
  }
}
