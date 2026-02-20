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
import { createLongOutputManager } from "../../utils/long-output.js";
import { createAgentMdManager } from "../../utils/agent-md.js";
import { createToolManager } from "../../utils/ai-tools.js";

// Parse AI response for tool usage
function parseToolUsage(response) {
  const toolPatterns = [
    {
      pattern:
        /Use internet to (fetch|search|check)\s+(.+?)(?:\s+with\s+parameters?\s+(.+))?$/i,
      tool: "internet",
      extract: (match) => ({
        operation: match[1].toLowerCase(),
        params: match[2] ? { query: match[2].trim() } : {},
      }),
    },
    {
      pattern: /Run command:\s*(.+)$/i,
      tool: "terminal",
      extract: (match) => ({
        operation: "execute",
        params: { command: match[1].trim() },
      }),
    },
    {
      pattern: /Fetch\s+(https?:\/\/\S+)/i,
      tool: "internet",
      extract: (match) => ({
        operation: "fetch",
        params: { url: match[1].trim() },
      }),
    },
    {
      pattern: /Search for\s+(.+)/i,
      tool: "internet",
      extract: (match) => ({
        operation: "search",
        params: { query: match[1].trim() },
      }),
    },
  ];

  for (const pattern of toolPatterns) {
    const match = response.match(pattern.pattern);
    if (match) {
      return {
        tool: pattern.tool,
        ...pattern.extract(match),
      };
    }
  }
  return null;
}

// Execute tool operation
async function executeToolOperation(toolManager, toolUsage) {
  try {
    console.log(`\nExecuting: ${toolUsage.tool} ${toolUsage.operation}...`);
    const result = await toolManager.executeTool(
      toolUsage.tool,
      toolUsage.operation,
      toolUsage.params,
    );

    if (result.success) {
      console.log(`✓ ${toolUsage.tool} operation completed`);
      return {
        success: true,
        result: result,
        summary: `Tool execution successful: ${toolUsage.tool} ${toolUsage.operation}`,
      };
    } else {
      console.log(`✗ ${toolUsage.tool} operation failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
        summary: `Tool execution failed: ${result.error}`,
      };
    }
  } catch (error) {
    console.log(`✗ Tool execution error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      summary: `Tool execution error: ${error.message}`,
    };
  }
}

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
          description: "Language interaction", // Always chat mode
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
  console.log(
    '  • AGENT Status: "agent", "status" - Show project progress and TODOs',
  );
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
            modelType: "chat", // Always chat for language interaction
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
    // Performance monitoring started silently - no banner displayed
  } catch (error) {
    // Silently fail - performance monitoring is optional
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
  const longOutputManager = createLongOutputManager();
  const agentManager = createAgentMdManager();
  const toolManager = createToolManager();

  // Initialize AGENT.md system
  console.log("\nInitializing AGENT.md system...");
  agentManager.initialize();
  console.log("Tools available: internet access, terminal commands");

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
      updatePrompt();
      return;
    }

    if (input.toLowerCase() === "config") {
      console.log("\nCurrent Configuration:");
      console.log(JSON.stringify(config, null, 2));
      updatePrompt();
      return;
    }

    if (input.toLowerCase() === "agent" || input.toLowerCase() === "status") {
      console.log("\nAGENT.md Status:");
      const context = agentManager.getContextSummary();
      console.log(`Location: ${agentManager.agentFilePath}`);
      console.log(`Requirements: ${context.requirements.length}`);
      console.log(`Completed: ${context.completed.length}`);
      console.log(`TODOs: ${context.todos.length}`);
      console.log(`Progress: ${context.progress}%`);

      if (context.todos.length > 0) {
        console.log("\nCurrent TODOs:");
        context.todos.forEach((todo, index) => {
          console.log(`  ${index + 1}. ${todo}`);
        });
      }

      console.log(
        `\nLast Updated: ${context.lastUpdated ? context.lastUpdated.toLocaleTimeString() : "Never"}`,
      );
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
      const recognition = getCommandRecognition(input);

      if (recognition.type !== "unknown" && recognition.confidence > 0.5) {
        const formatted = commandRecognizer.formatResult(recognition);
        console.log(`\n${formatted.message}...\n`);
      } else {
        console.log("\nThinking...\n");
      }

      const startTime = Date.now();

      // 1. Analyze user input with AGENT.md system
      agentManager.analyzeUserInput(input);

      // 2. Generate TODOs based on requirements and default workflows
      const newTodos = agentManager.generateTodos(
        conversationHistory.length > 0
          ? conversationHistory[conversationHistory.length - 1].content
          : "",
      );

      // 3. Get context summary for AI
      const agentContext = agentManager.getContextSummary();

      // 4. Get tools context
      const toolsContext = toolManager.getToolsContext();

      // 5. Enhance prompt with AGENT.md context and tools
      const agentContextPrompt = `AGENT.md CONTEXT:
- Requirements: ${agentContext.requirements.length > 0 ? agentContext.requirements.join(", ") : "None yet"}
- Completed: ${agentContext.completed.length} items
- TODOs: ${agentContext.todos.length} items (${newTodos.length} new)
- Progress: ${agentContext.progress}%
- Default Workflows: ${agentContext.hasDefaultWorkflows ? "Yes" : "No"}

${toolsContext}

EXECUTION MODE: Plan → Execute → Review → Next Step
1. First create a comprehensive plan and save to AGENT.md
2. Then provide ONE executable instruction at a time
3. System will execute it using appropriate tool
4. System returns results to you
5. You analyze results and provide next instruction
6. Continue until TODOs are completed

USER REQUEST: ${input}

IMPORTANT: 
1. First create plan for the entire task
2. Then provide single executable instruction
3. Use tools when needed: "Use internet to fetch [url]" or "Run command: [safe command]"
4. Focus on completing TODOs from AGENT.md`;

      // 6. Further enhance for longer responses
      const enhancedPrompt = longOutputManager.enhancePrompt(
        agentContextPrompt,
        conversationHistory.length > 0
          ? conversationHistory[conversationHistory.length - 1].content
          : "",
      );

      // EXECUTION LOOP: Plan → Execute → Review → Next Step
      let executionComplete = false;
      let iteration = 0;
      const maxIterations = 10; // Safety limit
      let lastResponse = "";

      while (!executionComplete && iteration < maxIterations) {
        iteration++;

        // Get AI response
        let aiResponse = "";
        if (config.stream) {
          process.stdout.write(`\nAssistant (Step ${iteration}): `);
          for await (const chunk of provider.streamGenerate(
            iteration === 1 ? enhancedPrompt : lastResponse,
            options,
          )) {
            process.stdout.write(chunk);
            aiResponse += chunk;
          }
          process.stdout.write("\n");
        } else {
          const response = await provider.generate(
            iteration === 1 ? enhancedPrompt : lastResponse,
            options,
          );
          formatResponse(response);
          aiResponse = response;
        }

        conversationHistory.push({ role: "assistant", content: aiResponse });
        lastResponse = aiResponse;

        // Check for tool usage in response
        const toolUsage = parseToolUsage(aiResponse);

        if (toolUsage) {
          // Execute tool
          const toolResult = await executeToolOperation(toolManager, toolUsage);

          // Prepare next prompt with tool results
          lastResponse = `Tool execution result: ${toolResult.summary}\n\n${aiResponse}\n\nWhat's the next step?`;

          // Add tool result to conversation
          conversationHistory.push({
            role: "system",
            content: `Tool executed: ${toolUsage.tool} ${toolUsage.operation}. Result: ${toolResult.summary}`,
          });
        } else {
          // Check if execution is complete
          if (
            aiResponse.toLowerCase().includes("completed") ||
            aiResponse.toLowerCase().includes("done") ||
            aiResponse.toLowerCase().includes("finished") ||
            aiResponse.toLowerCase().includes("all steps complete")
          ) {
            executionComplete = true;
            console.log("\n✓ Execution completed");

            // Update AGENT.md with completion
            agentContext.todos.forEach((todo, index) => {
              if (
                aiResponse
                  .toLowerCase()
                  .includes(todo.toLowerCase().substring(0, 20))
              ) {
                const completed = agentManager.completeTodo(index);
                if (completed) {
                  console.log(`Marked as completed: ${completed}`);
                }
              }
            });
          } else {
            // Ask for next step
            lastResponse = `${aiResponse}\n\nPlease provide the next executable instruction. If done, say "Completed".`;
          }
        }
      }

      if (iteration >= maxIterations) {
        console.log(
          "\n⚠️  Reached maximum iterations. Stopping execution loop.",
        );
      }

      const endTime = Date.now();

      // Update AGENT.md with final response
      agentManager.analyzeUserInput(
        input,
        conversationHistory[conversationHistory.length - 1].content,
      );

      // Save AGENT.md
      agentManager.save();

      // Check if context needs clearing
      if (conversationHistory.length > 15) {
        console.log("Context getting large, consider summarizing to AGENT.md");
      }

      const responseTime = endTime - startTime;
      const seconds = Math.floor(responseTime / 1000);
      const milliseconds = responseTime % 1000;
      console.log(`\nTotal execution time: ${seconds}s ${milliseconds}ms`);
      console.log(`Steps executed: ${iteration}`);
      console.log(`Messages exchanged: ${conversationHistory.length}\n`);
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
