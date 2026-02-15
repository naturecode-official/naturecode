#!/usr/bin/env node

import { Command } from "commander";
import { runModelConfiguration } from "./commands/model.js";
import { startInteractiveSession } from "./commands/start.js";
import { runGitCommand } from "./commands/git.js";
import { runCodeCommand } from "./commands/code.js";
import { runProjectCommand } from "./commands/project.js";
import { runPluginCommand } from "./commands/plugin.js";
import { runSessionCommand } from "./commands/session.js";
import { runReviewCommand, reviewCommand } from "./commands/review.js";
import { createTeamCommand } from "./commands/team.js";
import { createCollaborationCommand } from "./commands/collaboration.js";
import { createPermissionsCommand } from "./commands/permissions.js";
import { createTeamReviewCommand } from "./commands/team-review.js";
import { setupIntegrationCommands } from "./commands/integration.js";
import { setupPerformanceCommands } from "./commands/performance.js";
import { createHelpCommand } from "./commands/help.js";
import { configManager } from "../config/manager.js";
import { secureStore } from "../config/secure-store.js";
import {
  getWelcomeArt,
  getCommandPrompt,
  clearScreen,
} from "../utils/ascii-art.js";
import { exitWithError } from "../utils/error-handler.js";
import { handleFeedbackCommand } from "../utils/feedback.js";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const program = new Command();

program
  .name("naturecode")
  .description("Cross-platform AI assistant for terminal")
  .version("1.4.7", "-v, --version", "output the version number");

program
  .command("model")
  .description("Configure AI model and API settings")
  .action(async () => {
    try {
      await runModelConfiguration();
    } catch (error) {
      exitWithError(error, "Configuration");
    }
  });

program
  .command("start")
  .description("Start interactive AI session")
  .option("-m, --model <model>", "Specify model to use")
  .option("-t, --temperature <temp>", "Set temperature (0.0-2.0)", parseFloat)
  .option("--stream", "Enable streaming responses", true)
  .option("-s, --session <session-id>", "Load existing session")
  .option("--new-session", "Create new session")
  .option("--session-name <name>", "Name for new session")
  .action(async (options) => {
    try {
      await startInteractiveSession(options);
    } catch (error) {
      exitWithError(error, "Session");
    }
  });

program
  .command("feedback")
  .description("Provide feedback about NatureCode")
  .action(async () => {
    try {
      await handleFeedbackCommand();
    } catch (error) {
      exitWithError(error, "Feedback");
    }
  });

program
  .command("config")
  .description("Show current configuration")
  .action(() => {
    try {
      const config = configManager.load();
      console.log("Current Configuration:");
      console.log(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error("Error: Failed to load configuration:", error.message);
      console.log('Run "naturecode model" to configure first.');
    }
  });

program
  .command("code")
  .description("Code analysis and quality tools")
  .argument("[command]", "Code analysis command to execute")
  .option("-d, --dir <directory>", "Directory to analyze (default: current)")
  .option("-f, --file <file>", "File to analyze")
  .option("-r, --no-recursive", "Disable recursive directory scanning")
  .option("-l, --limit <number>", "Limit number of files analyzed")
  .option(
    "-e, --extensions <extensions>",
    "Comma-separated file extensions to include",
  )
  .option("-x, --exclude-dirs <dirs>", "Comma-separated directories to exclude")
  .option("-s, --severity <severity>", "Filter issues by severity")
  .option("-t, --type <type>", "Filter issues by type")
  .option("-j, --json", "Output results in JSON format")
  .action(async (command, options) => {
    try {
      await runCodeCommand({ command, ...options });
    } catch (error) {
      exitWithError(error, "Code Analysis");
    }
  });

program
  .command("project")
  .description("Project management and structure tools")
  .argument("[command]", "Project management command to execute")
  .option("-d, --dir <directory>", "Project directory (default: current)")
  .option("-t, --template <template>", "Template type for create command")
  .option("-n, --name <name>", "Project name for create command")
  .option(
    "--description <description>",
    "Project description for create command",
  )
  .option("--author <author>", "Project author for create command")
  .option("--max-depth <depth>", "Maximum directory depth for analysis")
  .option("-x, --exclude-dirs <dirs>", "Comma-separated directories to exclude")
  .option("--no-init-git", "Skip Git initialization in setup")
  .option("--no-install-deps", "Skip dependency installation in setup")
  .option("--no-create-initial-commit", "Skip initial commit in setup")
  .option("-j, --json", "Output results in JSON format")
  .action(async (command, options) => {
    try {
      await runProjectCommand({ command, ...options });
    } catch (error) {
      exitWithError(error, "Project Management");
    }
  });

program
  .command("plugin")
  .description("Plugin management and development tools")
  .argument("[command]", "Plugin command to execute")
  .argument("[args...]", "Additional arguments")
  .option("-p, --plugin-id <id>", "Plugin ID for specific operations")
  .option("-s, --source <source>", "Plugin source for installation")
  .option("-n, --name <name>", "Plugin name for creation")
  .option("-q, --query <query>", "Search query")
  .option("-f, --force", "Force operation without confirmation")
  .option("-v, --verbose", "Show detailed information")
  .option("-j, --json", "Output results in JSON format")
  .action(async (command, args, options) => {
    try {
      await runPluginCommand({
        command,
        _: args || [],
        ...options,
      });
    } catch (error) {
      exitWithError(error, "Plugin Management");
    }
  });

program
  .command("session")
  .description("Session management and context tracking")
  .argument("[command]", "Session command to execute")
  .argument("[args...]", "Additional arguments")
  .option("-i, --session-id <id>", "Session ID for specific operations")
  .option("-n, --name <name>", "Session name for creation")
  .option("-p, --project <path>", "Project path for session")
  .option("-t, --template <id>", "Template ID for session creation")
  .option("--tags <tags>", "Comma-separated tags for session")
  .option("--status <status>", "Filter sessions by status")
  .option("--search <query>", "Search sessions by content")
  .option("--limit <number>", "Limit number of results")
  .option("--sort-by <field>", "Sort field (name, lastAccessed, createdAt)")
  .option("--sort-order <order>", "Sort order (asc, desc)")
  .option("--format <format>", "Export format (json, markdown, text)")
  .option("--output <path>", "Output path for export")
  .option("--days <days>", "Days threshold for cleanup")
  .option("--force", "Force operation without confirmation")
  .option("--verbose", "Show detailed information")
  .option("-j, --json", "Output results in JSON format")
  .action(async (command, args, options) => {
    try {
      await runSessionCommand({
        command,
        ...options,
        // Parse additional arguments based on command
        ...parseSessionArgs(command, args),
      });
    } catch (error) {
      exitWithError(error, "Session Management");
    }
  });

program
  .command("review")
  .description("Code review and quality analysis")
  .argument("[command]", "Review command to execute")
  .argument("[args...]", "Additional arguments")
  .option("-f, --file <file>", "File to review")
  .option("-d, --dir <directory>", "Directory to review")
  .option(
    "-s, --session <sessionId>",
    "Use specific session (default: current session)",
  )
  .option("--ai", "Enable AI-powered review")
  .option("--no-ai", "Disable AI-powered review")
  .option(
    "--severity <severity>",
    "Filter by severity (critical, high, medium, low, info)",
  )
  .option("--category <category>", "Filter by category")
  .option("--format <format>", "Output format (text, json, markdown)")
  .option("-o, --output <file>", "Output file")
  .option("--exclude <patterns>", "Comma-separated patterns to exclude")
  .option("--include <patterns>", "Comma-separated patterns to include")
  .option("--limit <number>", "Limit number of issues shown")
  .option("--config <configFile>", "Custom configuration file")
  .action(async (command, args, options) => {
    try {
      await runReviewCommand({
        command,
        ...options,
        // Parse additional arguments based on command
        ...parseReviewArgs(command, args),
      });
    } catch (error) {
      exitWithError(error, "Code Review");
    }
  });

program
  .command("code")
  .description("Code analysis and quality tools")
  .argument("[command]", "Code analysis command to execute")
  .option("-d, --dir <directory>", "Directory to analyze (default: current)")
  .option("-f, --file <file>", "File to analyze")
  .option("-r, --no-recursive", "Disable recursive directory scanning")
  .option("-l, --limit <number>", "Limit number of files analyzed")
  .option(
    "-e, --extensions <extensions>",
    "Comma-separated file extensions to include",
  )
  .option("-x, --exclude-dirs <dirs>", "Comma-separated directories to exclude")
  .option("-s, --severity <severity>", "Filter issues by severity")
  .option("-t, --type <type>", "Filter issues by type")
  .option("-j, --json", "Output results in JSON format")
  .action(async (command, options) => {
    try {
      await runCodeCommand({ command, ...options });
    } catch (error) {
      exitWithError(error, "Code Analysis");
    }
  });

// Function to list available models
function listAvailableModels() {
  try {
    const config = configManager.load();
    const allKeys = secureStore.listApiKeys();

    console.log("\nCurrent configuration:");
    if (config.provider && config.model) {
      console.log(
        `  Active: ${config.provider} - ${config.model} (${config.apiKeyName || "unnamed"})`,
      );
    } else {
      console.log("  No active configuration");
    }

    console.log("\nStored API keys:");
    let hasKeys = false;

    for (const provider in allKeys) {
      const providerKeys = allKeys[provider];
      for (const keyId in providerKeys) {
        const keyInfo = providerKeys[keyId];
        console.log(`  ${provider} - ${keyId}`);
        if (keyInfo.metadata && keyInfo.metadata.name) {
          console.log(`    Name: ${keyInfo.metadata.name}`);
        }
        if (keyInfo.metadata && keyInfo.metadata.model) {
          console.log(`    Model: ${keyInfo.metadata.model}`);
        }
        if (keyInfo.metadata && keyInfo.metadata.createdAt) {
          const date = new Date(
            keyInfo.metadata.createdAt,
          ).toLocaleDateString();
          console.log(`    Created: ${date}`);
        }
        console.log("");
        hasKeys = true;
      }
    }

    if (!hasKeys) {
      console.log("  No stored API keys found");
    }
  } catch (error) {
    console.log("  Could not load model information:", error.message);
  }
}

// Function to delete model by name or all models
function deleteModelByName(name, force = false) {
  if (name.toLowerCase() === "all") {
    deleteAllModels(force);
    return;
  }

  // First, check if this is the currently active model
  const config = configManager.load();
  const isActiveModel =
    config.apiKeyName === name ||
    config.apiKeyId === name ||
    (config.provider &&
      config.model &&
      `${config.provider}-${config.model}` === name);

  // Get all keys to find matching ones
  const allKeys = secureStore.listApiKeys();
  let matchingKeys = [];

  for (const provider in allKeys) {
    const providerKeys = allKeys[provider];
    for (const keyId in providerKeys) {
      const keyInfo = providerKeys[keyId];
      if (
        keyId === name ||
        (keyInfo.metadata && keyInfo.metadata.name === name) ||
        `${provider}-${keyId}` === name
      ) {
        matchingKeys.push({
          provider: provider,
          keyId: keyId,
          keyInfo: keyInfo,
        });
      }
    }
  }

  if (matchingKeys.length === 0 && !isActiveModel) {
    console.log(`Error: No model found with name "${name}"`);
    console.log("\nAvailable models:");
    listAvailableModels();
    process.exit(1);
  }

  if (!force) {
    console.log(`WARNING: This will delete model configuration "${name}"`);

    if (isActiveModel) {
      console.log("This is currently your active model configuration.");
    }

    if (matchingKeys.length > 0) {
      console.log("The following API keys will be deleted:");
      matchingKeys.forEach((key, index) => {
        console.log(`  ${index + 1}. ${key.provider} - ${key.keyId}`);
        if (key.keyInfo.metadata && key.keyInfo.metadata.name) {
          console.log(`     Name: ${key.keyInfo.metadata.name}`);
        }
      });
    }

    console.log("");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "Are you sure you want to delete this model? (yes/NO): ",
      (answer) => {
        rl.close();

        if (answer.toLowerCase() === "yes") {
          performNamedDeletion(name, matchingKeys, isActiveModel, config);
        } else {
          console.log("Deletion cancelled.");
          process.exit(0);
        }
      },
    );
  } else {
    performNamedDeletion(name, matchingKeys, isActiveModel, config);
  }
}

function performNamedDeletion(
  name,
  matchingKeys,
  isActiveModel,
  currentConfig,
) {
  console.log(`Deleting model configuration "${name}"...`);

  let deletedCount = 0;

  // 1. Delete matching API keys from secure storage
  matchingKeys.forEach((key) => {
    try {
      if (secureStore.deleteApiKey(key.provider, key.keyId)) {
        console.log(`Deleted API key: ${key.provider} - ${key.keyId}`);
        deletedCount++;
      }
    } catch (error) {
      console.log(`Could not delete API key ${key.keyId}:`, error.message);
    }
  });

  // 2. If this was the active model, clear the configuration
  if (isActiveModel) {
    const CONFIG_FILE = path.join(os.homedir(), ".naturecode", "config.json");
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        fs.unlinkSync(CONFIG_FILE);
        console.log("Deleted active configuration file");
        deletedCount++;
      } catch (error) {
        console.log("Could not delete configuration file:", error.message);
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`\nSuccessfully deleted model configuration "${name}"!`);

    if (isActiveModel) {
      console.log("\nYou can now:");
      console.log('  1. Run "naturecode model" to configure a new model');
      console.log('  2. Run "naturecode start" will prompt for configuration');
    }
  } else {
    console.log(`\nNo changes made for model "${name}".`);
  }
}

// Helper function to parse session command arguments
function parseSessionArgs(command, args) {
  const parsed = {};

  if (!args || args.length === 0) {
    return parsed;
  }

  switch (command) {
    case "info":
    case "switch":
    case "archive":
    case "restore":
    case "delete":
      parsed.sessionId = args[0];
      break;

    case "rename":
      if (args.length >= 2) {
        parsed.sessionId = args[0];
        parsed.newName = args[1];
      }
      break;

    case "tag":
      if (args.length >= 2) {
        parsed.sessionId = args[0];
        parsed.tags = args[1];
      }
      break;

    case "export":
      parsed.sessionId = args[0];
      if (args.length >= 2) {
        parsed.format = args[1];
      }
      if (args.length >= 3) {
        parsed.output = args[2];
      }
      break;

    case "import":
      parsed.filePath = args[0];
      if (args.length >= 2) {
        parsed.name = args[1];
      }
      break;

    case "search":
      parsed.query = args.join(" ");
      break;

    case "template":
      if (args.length >= 1) {
        parsed.subcommand = args[0];
      }
      if (args.length >= 2) {
        parsed.sessionId = args[1];
      }
      if (args.length >= 3) {
        parsed.templateId = args[2];
      }
      break;

    default:
      // For create command or others
      if (args.length >= 1) {
        parsed.name = args[0];
      }
  }

  return parsed;
}

// Helper function to parse review command arguments
function parseReviewArgs(command, args) {
  const parsed = {};

  if (!args || args.length === 0) {
    return parsed;
  }

  switch (command) {
    case "file":
      if (args.length >= 1) {
        parsed.file = args[0];
      }
      break;

    case "dir":
      if (args.length >= 1) {
        parsed.dir = args[0];
      }
      break;

    case "compare":
      if (args.length >= 2) {
        parsed.session = args[0];
        parsed.session2 = args[1];
      }
      break;

    case "export":
      if (args.length >= 1) {
        parsed.reviewId = args[0];
      }
      break;

    case "import":
      if (args.length >= 1) {
        parsed.file = args[0];
      }
      break;

    default:
      // For commands that might take additional arguments
      if (args.length >= 1) {
        // First arg could be session ID or other parameter
        if (command === "history" || command === "stats") {
          parsed.session = args[0];
        }
      }
  }

  return parsed;
}

// Function to delete all models and configurations
function deleteAllModels(force = false) {
  const CONFIG_DIR = path.join(os.homedir(), ".naturecode");
  const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

  if (!force) {
    console.log(
      "WARNING: This will delete ALL model configurations and API keys.",
    );
    console.log("The following will be deleted:");
    console.log("  - All configuration files");
    console.log("  - All encrypted API keys");
    console.log("  - All model settings");
    console.log("");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
      rl.close();

      if (answer === "DELETE ALL") {
        performAllDeletion(CONFIG_DIR, CONFIG_FILE);
      } else {
        console.log("Deletion cancelled.");
        process.exit(0);
      }
    });
  } else {
    performAllDeletion(CONFIG_DIR, CONFIG_FILE);
  }
}

function performAllDeletion(CONFIG_DIR, CONFIG_FILE) {
  console.log("Deleting all model configurations...");

  let deletedCount = 0;

  // 1. Delete configuration file
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
    console.log("Deleted configuration file");
    deletedCount++;
  }

  // 2. Delete all API keys from secure storage
  try {
    secureStore.clearAll();
    console.log("Deleted all encrypted API keys");
    deletedCount++;
  } catch (error) {
    console.log("Could not delete API keys:", error.message);
  }

  // 3. Delete old API key store if exists
  const oldStoreDir = path.join(CONFIG_DIR, "apikeys");
  if (fs.existsSync(oldStoreDir)) {
    fs.rmSync(oldStoreDir, { recursive: true, force: true });
    console.log("Deleted old API key store");
    deletedCount++;
  }

  // 4. Delete old keyvault if exists
  const oldKeyVaultDir = path.join(CONFIG_DIR, "keyvault");
  if (fs.existsSync(oldKeyVaultDir)) {
    fs.rmSync(oldKeyVaultDir, { recursive: true, force: true });
    console.log("Deleted old key vault");
    deletedCount++;
  }

  if (deletedCount > 0) {
    console.log("\nSuccessfully deleted all model configurations!");
    console.log("\nYou can now:");
    console.log('  1. Run "naturecode model" to configure new models');
    console.log('  2. Run "naturecode start" will prompt for configuration');
  } else {
    console.log("\nNo model configurations found to delete.");
  }
}

program
  .command("delmodel [name]")
  .description("Delete model configuration by name or all models")
  .option("-f, --force", "Force delete without confirmation")
  .action((name, options) => {
    try {
      if (!name) {
        console.log("Error: Missing model name");
        console.log("Usage: naturecode delmodel <name>");
        console.log("       naturecode delmodel all (to delete all models)");
        console.log("\nAvailable models:");
        listAvailableModels();
        process.exit(1);
      }

      deleteModelByName(name, options.force);
    } catch (error) {
      console.error("Error: Failed to delete model:", error.message);
      process.exit(1);
    }
  });

// Add team collaboration command
program.addCommand(createTeamCommand());

// Add real-time collaboration command
program.addCommand(createCollaborationCommand());

// Add permissions and audit logging command
program.addCommand(createPermissionsCommand());

// Add team code review command
program.addCommand(createTeamReviewCommand());

// Add third-party tool integration command
program.addCommand(setupIntegrationCommands(program));

// Add performance monitoring and optimization command
program.addCommand(setupPerformanceCommands(program));

// Add help command with AI-powered documentation support
program.addCommand(createHelpCommand());

// Interactive mode function
async function startInteractiveMode() {
  clearScreen();
  console.log(getWelcomeArt());

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ", // 添加>提示符
  });

  console.log(getCommandPrompt());
  rl.prompt();

  rl.on("line", async (line) => {
    const command = line.trim().toLowerCase();

    if (!command) {
      rl.prompt();
      return;
    }

    if (command === "exit" || command === "quit") {
      console.log("\nGoodbye!");
      rl.close();
      process.exit(0);
      return;
    }

    if (command.startsWith("help")) {
      // 处理带参数的help命令
      try {
        const { HelpCommand } = await import("./commands/help.js");
        const helpInstance = new HelpCommand();

        // 提取问题参数
        const questionMatch = command.match(/^help\s+(.+)$/i);
        const question = questionMatch ? questionMatch[1].trim() : null;

        if (question) {
          // 使用文档帮助模式
          await helpInstance.showDocsBasedHelp(question);
        } else {
          // 显示完整的简单帮助
          await helpInstance.showSimpleHelp();
        }
      } catch (error) {
        console.error("Error showing help:", error.message);
        console.log("\n" + getCommandPrompt());
      }
      rl.prompt();
      return;
    }

    // Handle commands with or without slash
    const cmd = command.startsWith("/") ? command.substring(1) : command;

    try {
      switch (cmd) {
        case "model":
          // Run model configuration and return to interactive mode
          try {
            await runModelConfiguration();
            console.log("\nReturning to interactive mode...");
            console.log(getCommandPrompt());
          } catch (error) {
            console.error(`\nError in model configuration: ${error.message}`);
            console.log(getCommandPrompt());
          }
          rl.prompt();
          return;
        case "start":
          // Start interactive session
          try {
            await startInteractiveSession();
            console.log("\nReturning to interactive mode...");
            console.log(getCommandPrompt());
          } catch (error) {
            console.error(`\nError starting session: ${error.message}`);
            console.log(getCommandPrompt());
          }
          rl.prompt();
          return;
        case "config":
          const config = configManager.load();
          console.log("\nCurrent Configuration:");
          console.log(JSON.stringify(config, null, 2));
          break;
        case "delmodel":
          console.log("\nUsage: delmodel <name>");
          console.log("       delmodel all (to delete all models)");
          console.log("\nAvailable models:");
          listAvailableModels();
          break;
        case "help":
          // 显示完整的简单帮助
          try {
            const { HelpCommand } = await import("./commands/help.js");
            const helpInstance = new HelpCommand();
            await helpInstance.showSimpleHelp();
          } catch (error) {
            console.error("Error showing help:", error.message);
            console.log("\n" + getCommandPrompt());
          }
          break;
        default:
          console.log(`\nUnknown command: ${command}`);
          console.log('Type "help" for available commands.');
      }
    } catch (error) {
      console.error(`\nError: ${error.message}`);
    }

    if (cmd !== "start") {
      rl.prompt();
    }
  });

  // Remove close event handler to prevent immediate exit
  // Exit is handled explicitly in the exit/quit command
}

// Initialize and load plugins
async function initializePlugins() {
  try {
    const { PluginManager } = await import("../plugins/manager/index.js");
    const { PluginCommandRegistry } =
      await import("../plugins/commands/index.js");

    const pluginManager = new PluginManager();
    const commandRegistry = new PluginCommandRegistry(pluginManager);

    // Set up basic services
    pluginManager.setLogger(console);
    pluginManager.setFileSystem({
      readFile: async (pluginId, filePath, encoding) => {
        return await fs.promises.readFile(filePath, encoding);
      },
      writeFile: async (pluginId, filePath, content, encoding) => {
        return await fs.promises.writeFile(filePath, content, encoding);
      },
      listFiles: async (pluginId, dirPath, listOptions) => {
        const files = await fs.promises.readdir(dirPath, {
          withFileTypes: true,
        });
        return files.map((file) => ({
          name: file.name,
          type: file.isDirectory() ? "directory" : "file",
          path: path.join(dirPath, file.name),
        }));
      },
    });

    pluginManager.setAIProvider({
      generate: async (pluginId, prompt, options) => {
        return `AI response to: ${prompt.substring(0, 50)}...`;
      },
      chat: async (pluginId, messages, options) => {
        return {
          role: "assistant",
          content: "This is a mock AI response from plugin system",
        };
      },
    });

    // Load plugins
    await pluginManager.loadPlugins();

    // Register plugin commands with CLI
    commandRegistry.registerWithCLI(program);

    return { pluginManager, commandRegistry };
  } catch (error) {
    console.warn("Failed to initialize plugins:", error.message);
    return null;
  }
}

// Main program logic
const args = process.argv.slice(2);

if (args.length === 0) {
  // Show interactive mode for no arguments
  startInteractiveMode();
} else {
  // Initialize plugins and parse command line arguments
  initializePlugins()
    .then(() => {
      program.parse();
    })
    .catch((error) => {
      console.error("Failed to initialize:", error);
      program.parse();
    });
}
