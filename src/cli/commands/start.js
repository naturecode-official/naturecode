import readline from "readline";
import { configManager } from "../../config/manager.js";
import { secureStore } from "../../config/secure-store.js";
import { DeepSeekProvider } from "../../providers/deepseek.js";
import { OpenAIProvider } from "../../providers/openai.js";
import { OllamaProvider } from "../../providers/ollama.js";
import { AnthropicProvider } from "../../providers/anthropic.js";
import { GeminiProvider } from "../../providers/gemini.js";
import {
  formatResponse,
  showWelcome,
  showHelp,
} from "../../utils/formatter.js";
import { formatFileList } from "../../utils/filesystem.js";
import { handleError } from "../../utils/error-handler.js";
import { SessionTracker, feedbackCollector } from "../../utils/feedback.js";
import { commandRecognizer } from "../../utils/command-recognizer.js";
import { SessionManager } from "../../sessions/manager/index.js";

// Get available models from secure storage
function getAvailableModels() {
  const allKeys = secureStore.listApiKeys();
  const models = [];

  for (const provider in allKeys) {
    const providerKeys = allKeys[provider];
    for (const keyId in providerKeys) {
      const keyInfo = providerKeys[keyId];
      models.push({
        provider: provider,
        keyId: keyId,
        name: keyInfo.metadata?.name || `${provider}-${keyId}`,
        model: keyInfo.metadata?.model || "default",
        description: keyInfo.metadata?.modelType || "No description",
      });
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
    case "ollama":
      return new OllamaProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "gemini":
      return new GeminiProvider(config);
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
async function handleQuickFileCommands(input, provider, sessionTracker) {
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
      // Track error
      if (sessionTracker) {
        sessionTracker.incrementErrors();
      }
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

  // Initialize session tracker
  const sessionTracker = new SessionTracker();

  // Initialize session manager if session ID is provided
  let sessionManager = null;
  let sessionContext = null;

  if (options.session) {
    try {
      sessionManager = new SessionManager();
      sessionContext = await sessionManager.loadSession(options.session);
      console.log(`Session loaded: ${sessionContext.session.name}`);

      // Update current directory to session's project path
      if (sessionContext.session.projectPath) {
        process.chdir(sessionContext.session.projectPath);
      }
    } catch (error) {
      console.warn(
        `Failed to load session ${options.session}: ${error.message}`,
      );
      console.log("Starting new session...");
    }
  }

  let config = configManager.load();

  // Use session configuration if available
  if (sessionContext && sessionContext.session.configuration) {
    const sessionConfig = sessionContext.session.configuration;
    config = {
      ...config,
      provider: sessionConfig.provider,
      model: sessionConfig.model,
      temperature: sessionConfig.temperature,
      maxTokens: sessionConfig.maxTokens,
      stream: sessionConfig.stream !== false,
    };
    console.log(
      `Using session configuration: ${sessionConfig.provider} - ${sessionConfig.model}`,
    );
  }

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

  // Use session conversation history if available
  let sessionHistory = [];
  if (sessionContext && sessionContext.session.conversation.messages) {
    sessionHistory = [...sessionContext.session.conversation.messages];
    console.log(
      `Loaded ${sessionHistory.length} previous messages from session`,
    );
  }

  rl.on("line", async (line) => {
    const input = line.trim();

    if (input === "") {
      updatePrompt();
      return;
    }

    // Track user message
    sessionTracker.incrementMessageCount();

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
      sessionHistory.length = 0;
      updatePrompt();
      return;
    }

    if (input.toLowerCase() === "config") {
      console.log("\nCurrent Configuration:");
      console.log(JSON.stringify(config, null, 2));
      updatePrompt();
      return;
    }

    try {
      // Save user message to session if available
      if (sessionContext) {
        await sessionContext.session.addMessage("user", input);
      }
      sessionHistory.push({ role: "user", content: input });

      // Check for special file commands first
      const specialResult = await handleSpecialFileCommand(input, provider);
      if (specialResult) {
        console.log("\n" + specialResult);
        // Save assistant response to session
        if (sessionContext) {
          await sessionContext.session.addMessage("assistant", specialResult);
        }
        sessionHistory.push({ role: "assistant", content: specialResult });
        // Track file operation
        sessionTracker.incrementFileOperations();
        // Track file operation in session
        if (sessionContext && recognition && recognition.action === "read") {
          const filePath = commandRecognizer.extractFilePath(recognition);
          if (filePath) {
            await sessionContext.trackFileRead(filePath);
          }
        }
        updatePrompt();
        return;
      }

      // Check for quick file commands
      const quickResult = await handleQuickFileCommands(
        input,
        provider,
        sessionTracker,
      );
      if (quickResult) {
        console.log("\n" + quickResult);
        // Save assistant response to session
        if (sessionContext) {
          await sessionContext.session.addMessage("assistant", quickResult);
        }
        sessionHistory.push({ role: "assistant", content: quickResult });
        // Track file operation
        sessionTracker.incrementFileOperations();
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
        // Save assistant response to session
        if (sessionContext) {
          await sessionContext.session.addMessage("assistant", fullResponse);
        }
        sessionHistory.push({ role: "assistant", content: fullResponse });
      } else {
        const response = await provider.generate(input, options);
        formatResponse(response);
        // Save assistant response to session
        if (sessionContext) {
          await sessionContext.session.addMessage("assistant", response);
        }
        sessionHistory.push({ role: "assistant", content: response });
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
    // Save session if available
    if (sessionContext && sessionManager) {
      try {
        await sessionContext.save();
        console.log(`\nSession saved: ${sessionContext.session.name}`);
        console.log(
          `  Messages: ${sessionContext.session.conversation.messages.length}`,
        );
        console.log(
          `  File operations: ${sessionContext.session.context.fileOperations.length}`,
        );
      } catch (error) {
        console.warn(`Failed to save session: ${error.message}`);
      }
    }

    // Save session feedback
    const sessionData = await sessionTracker.saveSessionFeedback();

    console.log("\nSession Summary:");
    console.log(
      `  Duration: ${Math.round(sessionData.duration / 1000)} seconds`,
    );
    console.log(`  Messages: ${sessionData.messages}`);
    console.log(`  File operations: ${sessionData.fileOperations}`);
    console.log(`  Errors: ${sessionData.errors}`);
    console.log(`  Success rate: ${sessionData.successRate}`);
    console.log("  Session ended.");

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
