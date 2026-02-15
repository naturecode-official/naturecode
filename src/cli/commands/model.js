import inquirer from "inquirer";
import { configManager } from "../../config/manager.js";
import { DeepSeekProvider } from "../../providers/deepseek.js";
import { OpenAIProvider } from "../../providers/openai.js";
import { OllamaProvider } from "../../providers/ollama.js";
import { AnthropicProvider } from "../../providers/anthropic.js";

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
          name: "Anthropic - Claude models (Claude 3.5, Claude 3, etc.)",
          value: "anthropic",
          description: "Claude models (Claude 3.5, Claude 3, etc.)",
        },
        {
          name: "Ollama - Local AI models (free, runs on your machine)",
          value: "ollama",
          description: "Local AI models (free, runs on your machine)",
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
        } else if (answers.provider === "anthropic") {
          return "Enter your Anthropic API key (leave empty to skip):";
        }
        return "Ollama does not require an API key (press Enter to continue):";
      },
      default: currentConfig.apiKey || undefined,
      when: (answers) =>
        answers.provider === "deepseek" ||
        answers.provider === "openai" ||
        answers.provider === "anthropic" ||
        answers.provider === "ollama",
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
        } else if (answers.provider === "openai") {
          // OpenAI model type based on selected model
          // Use static method to get model capabilities, avoid creating provider instance
          const capabilities = OpenAIProvider.getStaticModelCapabilities(
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
        }
        return [];
      },
      default: (answers) => {
        if (answers.provider === "deepseek") {
          return answers.model === "deepseek-reasoner" ? "reasoner" : "chat";
        } else if (answers.provider === "openai") {
          return currentConfig.modelType || "text";
        } else if (answers.provider === "ollama") {
          return currentConfig.modelType || "chat";
        }
        return "text";
      },
      when: (answers) =>
        answers.provider === "deepseek" ||
        answers.provider === "openai" ||
        answers.provider === "ollama",
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
      type: "confirm",
      name: "confirm",
      message: "Save this configuration?",
      default: true,
    },
  ];

  // 检查是否通过管道输入，避免readline问题
  if (!process.stdin.isTTY) {
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
    // Add fallback model for OpenAI if selected model fails
    fallbackModel:
      answers.provider === "openai"
        ? "gpt-5"
        : answers.provider === "anthropic"
          ? "claude-3-5-haiku-20241022"
          : undefined,
  };

  try {
    configManager.save(config);
    console.log("\nConfiguration saved successfully!");
    console.log(`Config file: ${configManager.getConfigPath()}`);

    console.log("\nSummary:");
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
