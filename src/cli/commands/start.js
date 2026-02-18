import readline from "readline";
import { configManager } from "../../config/manager.js";
import { secureStore } from "../../config/secure-store.js";
import { DeepSeekProvider } from "../../providers/deepseek.js";
import { OpenAIProvider } from "../../providers/openai.js";
import { AzureOpenAIProvider } from "../../providers/azure-openai.js";
import { N1NProvider } from "../../providers/n1n.js";
import { FourSAPIProvider } from "../../providers/4sapi.js";
import { DashScopeProvider } from "../../providers/dashscope.js";
import { OllamaProvider } from "../../providers/ollama.js";
import { AnthropicProvider } from "../../providers/anthropic.js";
import { GeminiProvider } from "../../providers/gemini.js";
import { ZhipuAIProvider } from "../../providers/zhipuai.js";
import { TencentProvider } from "../../providers/tencent.js";
import { BaiduProvider } from "../../providers/baidu.js";
import { CustomProvider } from "../../providers/custom.js";
import {
  formatResponse,
  showWelcome,
  showHelp,
} from "../../utils/formatter.js";
import { formatFileList } from "../../utils/filesystem.js";
import { handleError } from "../../utils/error-handler.js";

import { commandRecognizer } from "../../utils/command-recognizer.js";
import { createPerformanceMonitor } from "./performance.js";

// Get available models from secure storage
function getAvailableModels() {
  const allKeys = secureStore.listApiKeys();
  const models = [];

  for (const provider in allKeys) {
    const providerKeys = allKeys[provider];
    for (const keyId in providerKeys) {
      const keyInfo = providerKeys[keyId];

      // 跳过重复的配置（相同的名称和模型）
      const isDuplicate = models.some(
        (m) =>
          m.name === (keyInfo.metadata?.name || `${provider}-${keyId}`) &&
          m.model === (keyInfo.metadata?.model || "default"),
      );

      if (!isDuplicate) {
        models.push({
          provider: provider,
          keyId: keyId,
          name: keyInfo.metadata?.name || `${provider}-${keyId}`,
          model: keyInfo.metadata?.model || "default",
          description: keyInfo.metadata?.modelType || "No description",
        });
      }
    }
  }

  return models;
}

// Create provider based on config
function createProvider(config) {
  switch (config.provider) {
    case "deepseek":
      return new DeepSeekProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "azure-openai":
      return new AzureOpenAIProvider(config);
    case "n1n":
      return new N1NProvider(config);
    case "4sapi":
      return new FourSAPIProvider(config);
    case "dashscope":
      return new DashScopeProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    case "zhipuai":
      return new ZhipuAIProvider(config);
    case "tencent":
      return new TencentProvider(config);
    case "baidu":
      return new BaiduProvider(config);
    case "custom":
      return new CustomProvider(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

// Enhanced help with file system commands
function showEnhancedHelp() {
  console.log("\n" + showHelp());
  console.log("\nFile System Commands:");
  console.log(
    '  • List files: "list files", "show directory", "ls", "what files are here?"',
  );
  console.log(
    '  • Read file: "read filename", "view file.txt", "cat file.js", "show me package.json"',
  );
  console.log(
    '  • Create file: "create newfile.js", "make config.json", "new script.py"',
  );
  console.log(
    '  • Edit file: "edit package.json", "modify script.py", "update config.js"',
  );
  console.log('  • Delete file: "delete temp.txt", "remove oldfile.log"');
  console.log(
    '  • Change dir: "cd src", "go to utils", "navigate to documents"',
  );
  console.log(
    '  • Search: "find .js files", "search for config", "locate test files"',
  );
  console.log('  • Current dir: "pwd", "where am i", "current directory"');
  console.log("\nSystem Commands:");
  console.log(
    '  • Performance: "performance", "perf" - Show detailed performance info',
  );
  console.log('  • Configuration: "config" - Show current AI configuration');
  console.log('  • Clear screen: "clear" - Clear the terminal');
  console.log('  • Exit: "exit", "quit" - End the session');
  console.log(
    "\nTips: Use natural language - the AI understands commands like:",
  );
  console.log('  "What files are in this folder?"');
  console.log('  "Can you show me the contents of index.html?"');
  console.log('  "Create a new React component called Button"');
  console.log('  "Help me fix the error in utils.js"');
}

// Check if input is a file system command
function isFileSystemCommand(input) {
  const recognition = commandRecognizer.recognize(input);
  return recognition.type !== "unknown" && recognition.confidence > 0.3;
}

// Get formatted command recognition
function getCommandRecognition(input) {
  return commandRecognizer.recognize(input);
}

// Handle special file system commands with enhanced recognition
async function handleSpecialFileCommand(input, provider) {
  const recognition = commandRecognizer.recognize(input);

  if (recognition.type === "unknown" || recognition.confidence < 0.5) {
    return null;
  }

  const formatted = commandRecognizer.formatResult(recognition);
  const filePath = commandRecognizer.extractFilePath(recognition);

  try {
    switch (recognition.action) {
      case "list":
        const files = await provider.listFiles();
        return `Current directory: ${provider.getCurrentDirectory().relative}\n\n${formatFileList(files)}`;

      case "pwd":
        const dirInfo = provider.getCurrentDirectory();
        return `Current directory: ${dirInfo.relative}\nAbsolute path: ${dirInfo.absolute}`;

      case "cd":
        if (!filePath) {
          return 'Please specify a directory to change to. Example: "cd src" or "go to documents"';
        }
        const result = await provider.changeDirectory(filePath);
        return `Changed to: ${result.to}\nRelative: ${result.relative}`;

      case "read":
        if (!filePath) {
          return 'Please specify a file to read. Example: "read package.json" or "show me config.js"';
        }
        const content = await provider.readFile(filePath);
        return `Content of "${filePath}":\n\`\`\`\n${content}\n\`\`\``;

      default:
        // For create, edit, delete, search - let AI handle with context
        return null;
    }
  } catch (error) {
    // Provide helpful error messages based on command type
    let errorMessage = `Failed to ${recognition.action}`;
    if (filePath) {
      errorMessage += ` "${filePath}"`;
    }
    errorMessage += `: ${error.message}`;

    // Add suggestions for common errors
    if (
      error.message.includes("not found") ||
      error.message.includes("no such file")
    ) {
      const files = await provider.listFiles().catch(() => []);
      const suggestions = commandRecognizer.suggestCorrection(input, files);
      if (suggestions.length > 0) {
        errorMessage += `\nSuggestions: ${suggestions.join(" ")}`;
      }
    }

    return errorMessage;
  }
}

// Handle quick file commands (simple syntax)
async function handleQuickFileCommands(input, provider) {
  const lowerInput = input.toLowerCase().trim();

  // Current directory
  if (lowerInput === "pwd" || lowerInput === "where" || lowerInput === "cwd") {
    const dirInfo = provider.getCurrentDirectory();
    return `Current directory: ${dirInfo.relative}\nAbsolute path: ${dirInfo.absolute}`;
  }

  // Change directory
  if (lowerInput.startsWith("cd ")) {
    const newDir = input.slice(3).trim();
    try {
      const result = await provider.changeDirectory(newDir);
      return `Changed to: ${result.to}\nRelative: ${result.relative}`;
    } catch (error) {
      handleError(error, "AI Response");
      console.log();
    }
  }

  // Quick file read
  if (lowerInput.startsWith("cat ") || lowerInput.startsWith("read ")) {
    const filePath = input.slice(4).trim();
    if (!filePath) {
      return 'Please specify a file to read. Example: "cat package.json"';
    }

    try {
      const content = await provider.readFile(filePath);
      return `${filePath}:\n\`\`\`\n${content}\n\`\`\``;
    } catch (error) {
      return `Unable to read "${filePath}": ${error.message}`;
    }
  }

  return null;
}

// Display current directory in prompt
function getPromptWithDirectory(provider) {
  if (!provider || !provider.fileSystem) {
    return "> ";
  }

  try {
    const dirInfo = provider.getCurrentDirectory();
    const relativePath = dirInfo.relative || ".";
    const displayPath =
      relativePath.length > 30 ? "..." + relativePath.slice(-27) : relativePath;

    return `[${displayPath}] > `;
  } catch (error) {
    return "> ";
  }
}

export async function startInteractiveSession(options = {}) {
  console.clear();

  let config = configManager.load();

  if (!config.apiKey || !configManager.exists()) {
    console.log(
      "Warning: No configuration found. Starting configuration wizard...\n",
    );

    const { runModelConfiguration } = await import("./model.js");
    await runModelConfiguration();

    config = configManager.load();

    if (!config.apiKey) {
      console.error(
        'Error: Configuration incomplete. Please run "naturecode model" to configure.',
      );
      return;
    }
  } else {
    // Check if we have multiple models and need to select one
    const availableModels = getAvailableModels();

    if (availableModels.length > 1) {
      console.log("Multiple models available. Please select one:\n");

      availableModels.forEach((model, index) => {
        const displayName = model.name || `${model.provider} - ${model.model}`;
        console.log(`  ${index + 1}. ${displayName}`);
        if (model.description && model.description !== "No description") {
          console.log(`     ${model.description}`);
        }
      });

      console.log(`\n  ${availableModels.length + 1}. Configure new model`);
      console.log(`  ${availableModels.length + 2}. Use current configuration`);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      let validChoice = false;
      let choice;

      while (!validChoice) {
        choice = await new Promise((resolve) => {
          rl.question("\nYour choice: ", resolve);
        });

        const choiceNum = parseInt(choice);
        if (
          !isNaN(choiceNum) &&
          choiceNum >= 1 &&
          choiceNum <= availableModels.length + 2
        ) {
          validChoice = true;
        } else {
          console.log(
            `Please enter a number between 1 and ${availableModels.length + 2}`,
          );
        }
      }

      rl.close();

      if (choice <= availableModels.length) {
        const selectedModel = availableModels[choice - 1];

        // Load the selected model configuration
        const keyInfo = secureStore.getApiKey(
          selectedModel.provider,
          selectedModel.keyId,
        );
        if (keyInfo) {
          config = {
            provider: selectedModel.provider,
            apiKey: keyInfo.key,
            apiKeyName: keyInfo.metadata?.name,
            model: keyInfo.metadata?.model || "default",
            modelType: keyInfo.metadata?.modelType || "text",
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000,
            stream: config.stream !== false,
          };

          configManager.save(config);
          console.log(`\nSwitched to model: ${selectedModel.name}`);
        }
      } else if (choice === availableModels.length + 1) {
        // Configure new model
        const { runModelConfiguration } = await import("./model.js");
        await runModelConfiguration();

        config = configManager.load();

        if (!config.apiKey) {
          console.error(
            'Error: Configuration incomplete. Please run "naturecode model" to configure.',
          );
          return;
        }
      } else if (choice === availableModels.length + 2) {
        // Use current configuration
        console.log("\nUsing current configuration.");
      }
    }
  }

  const provider = createProvider(config);

  // Initialize and start performance monitoring
  let performanceMonitor = null;
  try {
    performanceMonitor = await createPerformanceMonitor();
    await performanceMonitor.startMonitoring();

    // Show performance info in top-left corner
    const performanceInfo = performanceMonitor.formatStatsForDisplay();
    console.log(`\x1b[1;37;44m${" ".repeat(80)}\x1b[0m`);
    console.log(
      `\x1b[1;37;44m Performance: ${performanceInfo.padEnd(66)} \x1b[0m`,
    );
    console.log(`\x1b[1;37;44m${" ".repeat(80)}\x1b[0m\n`);
  } catch (error) {
    // Silently fail - performance monitoring is optional
    console.log("\x1b[1;37;44m Performance monitoring unavailable \x1b[0m\n");
  }

  showWelcome(config);
  console.log(
    '\nType "help" for available commands, including file operations.',
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
  });

  // Update prompt with current directory
  const updatePrompt = () => {
    rl.setPrompt(getPromptWithDirectory(provider));
    rl.prompt();
  };

  updatePrompt();

  let conversationHistory = [];

  rl.on("line", async (line) => {
    const input = line.trim();

    if (input === "") {
      updatePrompt();
      return;
    }

    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      console.log("\nGoodbye!");
      rl.close();
      return;
    }

    if (input.toLowerCase().startsWith("help")) {
      // Show enhanced help
      showEnhancedHelp();
      updatePrompt();
      return;
    }

    if (input.toLowerCase() === "clear") {
      console.clear();
      conversationHistory.length = 0;

      // Re-display performance info after clear
      if (performanceMonitor) {
        const performanceInfo = performanceMonitor.formatStatsForDisplay();
        console.log(`\x1b[1;37;44m${" ".repeat(80)}\x1b[0m`);
        console.log(
          `\x1b[1;37;44m Performance: ${performanceInfo.padEnd(66)} \x1b[0m`,
        );
        console.log(`\x1b[1;37;44m${" ".repeat(80)}\x1b[0m\n`);
      }

      updatePrompt();
      return;
    }

    if (input.toLowerCase() === "config") {
      console.log("\nCurrent Configuration:");
      console.log(JSON.stringify(config, null, 2));
      updatePrompt();
      return;
    }

    if (
      input.toLowerCase() === "performance" ||
      input.toLowerCase() === "perf"
    ) {
      if (performanceMonitor) {
        console.log("\n" + performanceMonitor.getDetailedInfo());

        // Show optimization suggestions
        const suggestions =
          await performanceMonitor.getOptimizationSuggestions();
        if (suggestions.length > 0) {
          console.log("\nOptimization Suggestions:");
          suggestions.forEach((suggestion, index) => {
            console.log(`  ${index + 1}. ${suggestion.title}`);
            console.log(`     Impact: ${suggestion.impact}`);
            console.log(`     Difficulty: ${suggestion.difficulty}`);
          });
        }
      } else {
        console.log("\nPerformance monitoring is not available.");
      }
      updatePrompt();
      return;
    }

    try {
      conversationHistory.push({ role: "user", content: input });

      // Check for special file commands first
      const specialResult = await handleSpecialFileCommand(input, provider);
      if (specialResult) {
        console.log("\n" + specialResult);
        conversationHistory.push({ role: "assistant", content: specialResult });
        updatePrompt();
        return;
      }

      // Check for quick file commands
      const quickResult = await handleQuickFileCommands(input, provider);
      if (quickResult) {
        console.log("\n" + quickResult);
        conversationHistory.push({ role: "assistant", content: quickResult });
        updatePrompt();
        return;
      }

      // Check if it's a file system command
      const isFileCommand = isFileSystemCommand(input);
      const recognition = getCommandRecognition(input);

      if (recognition.type !== "unknown" && recognition.confidence > 0.5) {
        const formatted = commandRecognizer.formatResult(recognition);
        console.log(`\n${formatted.message}...\n`);
      } else {
        console.log("\nThinking...\n");
      }

      const startTime = Date.now();

      if (config.stream) {
        let fullResponse = "";
        process.stdout.write("Assistant: ");

        for await (const chunk of provider.streamGenerate(input, options)) {
          process.stdout.write(chunk);
          fullResponse += chunk;
        }

        process.stdout.write("\n\n");
        conversationHistory.push({ role: "assistant", content: fullResponse });
      } else {
        const response = await provider.generate(input, options);
        formatResponse(response);
        conversationHistory.push({ role: "assistant", content: response });
      }

      const endTime = Date.now();
      console.log(`Response time: ${endTime - startTime}ms\n`);
    } catch (error) {
      console.error(`\nError: ${error.message}`);

      if (error.message.includes("Invalid API key")) {
        console.log('Tip: Run "naturecode model" to reconfigure your API key.');
      } else if (error.message.includes("Network error")) {
        console.log("Tip: Check your internet connection and try again.");
      } else if (error.message.includes("File")) {
        console.log(
          "Tip: Make sure the file path is correct and you have permission.",
        );
      }

      console.log();
    }

    updatePrompt();
  }).on("close", async () => {
    // Stop performance monitoring
    if (performanceMonitor) {
      try {
        await performanceMonitor.stopMonitoring();
      } catch (error) {
        // Ignore errors when stopping
      }
    }

    console.log("\nSession ended.");
    console.log(`  Messages exchanged: ${conversationHistory.length}`);

    // Show file operations if any
    try {
      const fileContext = provider.getFileContext();
      if (fileContext.fileOperations.length > 0) {
        console.log("\nFile Operations:");
        fileContext.fileOperations.slice(-5).forEach((op) => {
          const time = new Date(op.timestamp).toLocaleTimeString();
          console.log(`  ${time} - ${op.type}: ${op.path || ""}`);
        });
      }
    } catch (error) {
      // Ignore file context errors
    }

    process.exit(0);
  });
}
