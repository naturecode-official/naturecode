import readline from "readline";
import chalk from "chalk";
import fs from "fs";
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
import {
  formatCodeDiff,
  formatUserInput,
  formatCommandResult,
  formatMessage,
} from "../../utils/code-diff-formatter.js";
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

// Read AGENT.md content for AI context
function getAgentMdContent(agentManager) {
  try {
    const context = agentManager.getContextSummary();
    const agentFilePath = agentManager.agentFilePath;

    // Read the actual AGENT.md file for detailed content
    // Note: fs is already imported at the top of the file
    if (typeof fs !== "undefined" && fs.existsSync(agentFilePath)) {
      const content = fs.readFileSync(agentFilePath, "utf8");

      // Extract key sections
      const sections = {
        requirements: extractSection(content, "User Requirements Summary"),
        completed: extractSection(content, "Completed Items"),
        todos: extractSection(content, "Current TODOs"),
        plans: extractSection(content, "Future Plans"),
        recent: extractSection(content, "Recent Conversation"),
      };

      return {
        filePath: agentFilePath,
        summary: context,
        detailed: sections,
        rawPreview:
          content.length > 1000 ? content.substring(0, 1000) + "..." : content,
      };
    }

    return {
      filePath: agentFilePath,
      summary: context,
      detailed: null,
      rawPreview: "AGENT.md file not found or empty",
    };
  } catch (error) {
    return {
      filePath: agentManager.agentFilePath,
      summary: agentManager.getContextSummary(),
      detailed: null,
      rawPreview: `Error reading AGENT.md: ${error.message}`,
    };
  }
}

// Helper function to extract section from AGENT.md
function extractSection(content, sectionTitle) {
  const lines = content.split("\n");
  let inSection = false;
  let sectionContent = [];

  for (const line of lines) {
    if (line.includes(sectionTitle)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      // Stop at next section or empty line with ---
      if (line.startsWith("## ") || line.startsWith("---")) {
        break;
      }
      if (line.trim() !== "") {
        sectionContent.push(line.trim());
      }
    }
  }

  return sectionContent.length > 0 ? sectionContent : ["*No items*"];
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
  console.log("\nQuick Commands:");
  console.log("  ls, cat <file>, cd <dir> - File operations");
  console.log("  config - Show settings");
  console.log("  clear - Clean screen");
  console.log("  exit/quit - End session");
  console.log("\nJust talk naturally:");
  console.log('  "show me files here"');
  console.log('  "read package.json"');
  console.log('  "help with Python code"');
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
      // Check if it's a version number or other false positive
      if (/^\d+\.\d+/.test(filePath) || filePath.length < 3) {
        return `"${filePath}" doesn't appear to be a valid file path. Please specify a filename with extension.`;
      }
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

  let conversationHistory = [];
  const longOutputManager = createLongOutputManager();
  const agentManager = createAgentMdManager();
  const toolManager = createToolManager();

  // AI INITIALIZATION PHASE - Run basic functions first
  console.log("\n" + chalk.cyan("AI Initialization Phase..."));

  // 1. Initialize AGENT.md system
  console.log("1. Initializing AGENT.md system...");
  agentManager.initialize();

  // 2. Check for existing project context
  const agentContext = agentManager.getContextSummary();
  console.log(
    `2. Project context loaded: ${agentContext.requirements.length} requirements, ${agentContext.todos.length} TODOs`,
  );

  // 3. Run basic setup if needed
  if (
    agentContext.todos.length === 0 &&
    agentContext.requirements.length === 0
  ) {
    console.log("3. No existing context found. AI will start fresh.");
  } else {
    console.log(
      `3. Continuing from previous session (${agentContext.progress}% complete)`,
    );

    // Show current TODOs
    if (agentContext.todos.length > 0) {
      console.log("\nCurrent TODOs:");
      agentContext.todos.forEach((todo, index) => {
        console.log(`  ${index + 1}. ${todo}`);
      });
    }
  }

  console.log(
    chalk.green(
      "\n✓ AI initialization complete. Ready for user interaction.\n",
    ),
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

  rl.on("line", async (line) => {
    const input = line.trim();

    if (input === "") {
      updatePrompt();
      return;
    }

    // Display user input with ┃ prefix
    console.log(formatUserInput(input));

    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      // 添加会话总结
      console.log("\n" + chalk.cyan("=== 会话总结 ==="));

      const agentContext = agentManager.getContextSummary();
      console.log(chalk.green(`✓ 本次会话完成:`));
      console.log(`  - 需求记录: ${agentContext.requirements.length} 个`);
      console.log(`  - 完成任务: ${agentContext.completed.length} 个`);
      console.log(`  - 待办事项: ${agentContext.todos.length} 个`);
      console.log(`  - 总体进度: ${agentContext.progress}%`);

      if (agentContext.todos.length > 0) {
        console.log(chalk.yellow("\n📋 剩余待办事项:"));
        agentContext.todos.forEach((todo, index) => {
          console.log(`  ${index + 1}. ${todo}`);
        });
      }

      console.log(chalk.cyan("================\n"));
      console.log("Goodbye!");
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

      // Check if it's a simple command that should bypass AGENT.md complexity
      if (agentManager.isSimpleCommand(input)) {
        // For simple commands, just execute them directly
        console.log("\nExecuting simple command...");

        // Handle simple commands directly
        if (
          input.toLowerCase().includes("list files") ||
          input.toLowerCase().includes("ls") ||
          input.toLowerCase().includes("dir") ||
          input.toLowerCase().includes("show files")
        ) {
          const files = await provider.listFiles();
          const result = `Current directory: ${provider.getCurrentDirectory().relative}\n\n${formatFileList(files)}`;
          console.log(formatCommandResult(result));
          conversationHistory.push({ role: "assistant", content: result });
          updatePrompt();
          return;
        }

        if (
          input.toLowerCase().includes("pwd") ||
          input.toLowerCase().includes("where am i") ||
          input.toLowerCase().includes("current directory")
        ) {
          const dirInfo = provider.getCurrentDirectory();
          const result = `Current directory: ${dirInfo.relative}\nAbsolute path: ${dirInfo.absolute}`;
          console.log(formatCommandResult(result));
          conversationHistory.push({ role: "assistant", content: result });
          updatePrompt();
          return;
        }

        // For other simple commands, let AI handle them but with simplified prompt
        console.log("\nProcessing simple command...");
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

      // 5. Get detailed AGENT.md content
      const agentContent = getAgentMdContent(agentManager);

      // 6. Enhance prompt with AGENT.md context and tools
      // Check if this is a simple command that doesn't need full AGENT.md context
      const isSimpleCmd = agentManager.isSimpleCommand(input);

      const agentContextPrompt = isSimpleCmd
        ? // Simplified prompt for simple commands
          `=== SIMPLE COMMAND MODE ===
You are helping with a simple command. Just execute it directly.

Command: ${input}

=== CURRENT DIRECTORY ===
- Location: ${provider.getCurrentDirectory().relative}
- Absolute: ${provider.getCurrentDirectory().absolute}

=== INSTRUCTIONS ===
1. Execute the command directly
2. Provide clear, concise output
3. No need for AGENT.md updates
4. Use appropriate format for the command type

=== RESPONSE FORMAT (TERMINAL ONLY) ===
- For file listings: show formatted list
- For directory info: show path details
- For file reading: show content with syntax highlighting
- For help: show available commands
- For code: use Markdown code blocks with language tags
- NEVER use HTML tags or HTML-style formatting
- NEVER create interactive bash terminals or HTML textboxes
- We are in a TERMINAL - only plain text and code blocks work`
        : // Full AGENT.md prompt for complex tasks
          `=== AGENT.md PRIORITY CONTEXT ===
IMPORTANT: Always check AGENT.md first for project context. This file tracks ongoing work.

AGENT.md LOCATION: ${agentContent.filePath}
AGENT.md SUMMARY:
- Requirements: ${agentContext.requirements.length > 0 ? agentContext.requirements.join(", ") : "None yet"}
- Completed: ${agentContext.completed.length} items
- TODOs: ${agentContext.todos.length} items (${newTodos.length} new)
- Progress: ${agentContext.progress}%
- User Language: ${agentContext.userLanguage || "en"}

=== LANGUAGE INSTRUCTION ===
CRITICAL: Respond in the same language as the user. 
- If user writes in Chinese, respond in Chinese.
- If user writes in English, respond in English.
- Code blocks and technical terms remain in English.
- Keep conversation language consistent.

DETAILED AGENT.md CONTENT:
1. USER REQUIREMENTS:
${agentContent.detailed?.requirements?.map((item) => `   • ${item}`).join("\n") || "   *No requirements recorded*"}

2. COMPLETED ITEMS:
${agentContent.detailed?.completed?.map((item) => `   • ${item}`).join("\n") || "   *Nothing completed yet*"}

3. CURRENT TODOs:
${agentContent.detailed?.todos?.map((item) => `   • ${item}`).join("\n") || "   *No TODOs defined*"}

4. FUTURE PLANS:
${agentContent.detailed?.plans?.map((item) => `   • ${item}`).join("\n") || "   *No future plans*"}

5. RECENT CONVERSATION (last 3 entries):
${
  agentContent.detailed?.recent
    ?.slice(-3)
    .map((item) => `   ${item}`)
    .join("\n") || "   *No recent conversation*"
}

=== TOOLS AVAILABLE ===
${toolsContext}

=== EXECUTION GUIDELINES ===
1. FIRST: Check AGENT.md above for existing context
2. If working on existing TODOs, continue from where left off
3. If new task, create comprehensive plan in AGENT.md format
4. Then provide ONE executable instruction at a time
5. Use tools when needed
6. Update AGENT.md with progress

=== USER REQUEST ===
${input}

=== CRITICAL INSTRUCTIONS ===
1. PRIORITY: Always reference AGENT.md context first
2. For multi-session tasks: Continue from existing TODOs
3. Update AGENT.md with new findings/progress
4. Use natural language, but be specific about next steps
5. RESPOND IN USER'S LANGUAGE: ${agentContext.userLanguage || "en"}
6. TERMINAL FORMATTING: Use Markdown code blocks, NEVER HTML
7. CODE EXAMPLES: Always use \`\`\`language\ncode\n\`\`\` format
8. NO HTML: Never create HTML textboxes, bash terminals, or interactive elements
9. ENVIRONMENT: We are in a terminal - only text and code blocks work`;

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

      // For simple commands, skip the complex execution loop
      if (isSimpleCmd) {
        // Simple command mode - just get one response
        let aiResponse = "";
        if (config.stream) {
          // Use user-configured AI name as prefix
          const aiName = config.aiName || "AI";
          process.stdout.write(`\n${aiName}: `);
          for await (const chunk of provider.streamGenerate(
            enhancedPrompt,
            options,
          )) {
            process.stdout.write(chunk);
            aiResponse += chunk;
          }
          process.stdout.write("\n");
        } else {
          const response = await provider.generate(enhancedPrompt, options);
          // AI responses are displayed normally (no ┃ prefix)
          formatResponse(response);
          aiResponse = response;
        }

        conversationHistory.push({ role: "assistant", content: aiResponse });
        executionComplete = true;
      } else {
        // Complex task mode - use execution loop
        while (!executionComplete && iteration < maxIterations) {
          iteration++;

          // Get AI response
          let aiResponse = "";
          if (config.stream) {
            // Use user-configured AI name as prefix
            const aiName = config.aiName || "AI";
            process.stdout.write(`\n${aiName}: `);
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
            // AI responses are displayed normally (no ┃ prefix)
            formatResponse(response);
            aiResponse = response;
          }

          conversationHistory.push({ role: "assistant", content: aiResponse });
          lastResponse = aiResponse;

          // Check for tool usage in response
          const toolUsage = parseToolUsage(aiResponse);

          if (toolUsage) {
            // Execute tool
            const toolResult = await executeToolOperation(
              toolManager,
              toolUsage,
            );

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
              aiResponse.toLowerCase().includes("all steps complete") ||
              aiResponse.toLowerCase().includes("here are the files") ||
              aiResponse.toLowerCase().includes("current directory") ||
              aiResponse.toLowerCase().includes("command executed")
            ) {
              executionComplete = true;
              console.log("\n✓ Command executed");

              // Update AGENT.md with completion for complex tasks only
              if (!isSimpleCmd && agentContext.todos.length > 0) {
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
              }
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
