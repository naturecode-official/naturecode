#!/usr/bin/env node

import { Command } from "commander";
import { runModelConfiguration } from "./commands/model.js";
import { startInteractiveSession } from "./commands/start.js";

import { configManager } from "../config/manager.js";
import { secureStore } from "../config/secure-store.js";
import {
  getWelcomeArt,
  getCommandPrompt,
  clearScreen,
} from "../utils/ascii-art.js";
import { exitWithError } from "../utils/error-handler.js";

import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const program = new Command();

program
  .name("naturecode")
  .description("Cross-platform AI assistant for terminal (Professional Mode)")
  .version("1.5.6", "-v, --version", "output the version number");

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

  .action(async (options) => {
    try {
      await startInteractiveSession(options);
    } catch (error) {
      exitWithError(error, "Session");
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

    // 检查是否在交互式终端中
    const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

    if (!isInteractive) {
      console.log(
        "ERROR: Cannot request confirmation in non-interactive mode.",
      );
      console.log("");
      console.log(
        "This command requires direct terminal input for safety reasons.",
      );
      console.log("");
      console.log("To delete all models:");
      console.log("1. Exit the AI interface (if you're in one)");
      console.log("2. Run this command directly in your terminal:");
      console.log("   naturecode delmodel all");
      console.log("");
      console.log(
        "Or use --force flag to skip confirmation (use with caution):",
      );
      console.log("   naturecode delmodel all --force");
      console.log("");
      process.exit(1);
    }

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
  .option("-f, --force", "Force delete without confirmation (use with caution)")
  .action((name, options) => {
    try {
      if (!name) {
        console.log("Error: Missing model name");
        console.log("Usage: naturecode delmodel <name>");
        console.log("       naturecode delmodel all (to delete all models)");
        console.log("");
        console.log(
          "Important: For safety, 'delmodel all' requires confirmation.",
        );
        console.log(
          "Run this command directly in terminal, not through AI interface.",
        );
        console.log("");
        console.log("Available models:");
        listAvailableModels();
        process.exit(1);
      }

      deleteModelByName(name, options.force);
    } catch (error) {
      console.error("Error: Failed to delete model:", error.message);
      process.exit(1);
    }
  });

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

        default:
          console.log(`\nUnknown command: ${command}`);
          console.log("Available commands: model, start, config, delmodel");
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

// Main program logic
const args = process.argv.slice(2);

if (args.length === 0) {
  // Show interactive mode for no arguments
  startInteractiveMode();
} else {
  // Parse command line arguments
  program.parse();
}
