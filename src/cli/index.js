#!/usr/bin/env node

import { Command } from "commander";
import { runModelConfiguration } from "./commands/model.js";

import { configManager } from "../config/manager.js";
import { secureStore } from "../config/secure-store.js";
import { getWelcomeArt } from "../utils/ascii-art.js";
import { exitWithError } from "../utils/error-handler.js";

import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import chalk from "chalk";

// 强制启用颜色
chalk.level = 3;

// 读取package.json中的版本号
const packageJsonPath = path.join(process.cwd(), "package.json");
let version = "2.0.1"; // 默认值

try {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    version = packageJson.version || version;
  }
} catch (error) {
  // 如果读取失败，使用默认值
  console.warn("Warning: Could not read version from package.json");
}

const program = new Command();

program
  .name("naturecode")
  .description("Cross-platform AI assistant for terminal (Professional Mode)")
  .version(version, "-v, --version", "output the version number");

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
  .description("Start interactive AI conversation")
  .action(async () => {
    try {
      // Import and run the start command
      const { startInteractiveSession } = await import("./commands/start.js");
      await startInteractiveSession();
    } catch (error) {
      exitWithError(error, "Start Command");
    }
  });

program
  .command("check")
  .description("Check AI configuration status")
  .action(async () => {
    try {
      const config = configManager.load();

      // 检查是否有有效的配置
      if (!config.provider || !config.model || !config.apiKey) {
        console.log(chalk.yellow("No AI model configured yet."));
        console.log("");
        console.log(chalk.bold("To get started:"));
        console.log(
          "  1. Run " +
            chalk.green("naturecode model") +
            " to configure your AI model",
        );
        console.log(
          "  2. Then run " +
            chalk.green("naturecode") +
            " to start AI conversation",
        );
        console.log("");
        console.log(
          chalk.italic(
            "Note: All advanced features are accessed through AI conversation.",
          ),
        );
        return;
      }

      // 显示配置信息
      console.log(chalk.green("✓ AI model configured:"));
      console.log(`  Provider: ${config.provider}`);
      console.log(`  Model: ${config.model}`);
      console.log(`  Temperature: ${config.temperature || 0.7}`);
      console.log(
        `  Streaming: ${config.stream !== false ? "Enabled" : "Disabled"}`,
      );
      console.log(`  Max Tokens: 2000 (optimal with tools)`);
      console.log("");
      console.log(chalk.bold("To use NatureCode:"));
      console.log(
        "  1. Run " + chalk.green("naturecode") + " to start AI conversation",
      );
      console.log("  2. The AI will handle all complex operations");
      console.log("  3. Simply talk to the AI naturally");
      console.log("  4. All features are accessible through conversation");
      console.log("");
      console.log(
        chalk.green("NatureCode is now ready for AI-powered assistance!"),
      );
    } catch (error) {
      exitWithError(error, "Check");
    }
  });

program
  .command("config")
  .description("Show current configuration (API keys hidden)")
  .action(() => {
    try {
      const config = configManager.load();
      console.log("Current Configuration:");

      // Create a safe copy of config with hidden API keys
      const safeConfig = { ...config };

      // Hide sensitive information
      if (safeConfig.apiKey) {
        safeConfig.apiKey = "******** (hidden for security)";
      }
      if (safeConfig.secretKey) {
        safeConfig.secretKey = "******** (hidden for security)";
      }

      console.log(JSON.stringify(safeConfig, null, 2));
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
function deleteModelByName(
  name,
  force = false,
  exitOnError = true,
  skipPrompt = false,
) {
  if (name.toLowerCase() === "all") {
    deleteAllModels(force);
    return;
  }

  // First, check if this is the currently active model
  const config = configManager.load();
  const isActiveModel =
    config.apiKeyName === name ||
    config.apiKeyId === name ||
    config.provider === name ||
    config.model === name ||
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
    console.log(chalk.red(`Error: No model found with name "${name}"`));
    console.log(chalk.bold("\nAvailable models:"));
    listAvailableModels();
    console.log(chalk.bold("\nTry one of these names:"));
    if (config.provider) {
      console.log(`  - ${chalk.green(config.provider)} (provider)`);
    }
    if (config.model) {
      console.log(`  - ${chalk.green(config.model)} (model)`);
    }
    if (config.provider && config.model) {
      console.log(
        `  - ${chalk.green(`${config.provider}-${config.model}`)} (provider-model)`,
      );
    }
    if (config.apiKeyName) {
      console.log(`  - ${chalk.green(config.apiKeyName)} (key name)`);
    }
    if (config.apiKeyId) {
      console.log(`  - ${chalk.green(config.apiKeyId)} (key ID)`);
    }

    // 如果有存储的密钥，也显示它们
    const allKeys = secureStore.listApiKeys();
    for (const provider in allKeys) {
      const providerKeys = allKeys[provider];
      for (const keyId in providerKeys) {
        const keyInfo = providerKeys[keyId];
        console.log(`  - ${chalk.green(keyId)} (key ID)`);
        if (keyInfo.metadata && keyInfo.metadata.name) {
          console.log(
            `  - ${chalk.green(keyInfo.metadata.name)} (custom name)`,
          );
        }
      }
    }

    if (exitOnError) {
      process.exit(1);
    } else {
      throw new Error(`No model found with name "${name}"`);
    }
  }

  if (!force && !skipPrompt) {
    console.log(
      chalk.yellow.bold(
        `⚠️  WARNING: This will delete model configuration "${name}"`,
      ),
    );

    if (isActiveModel) {
      console.log(
        chalk.yellow("This is currently your active model configuration."),
      );
    }

    if (matchingKeys.length > 0) {
      console.log(chalk.yellow("The following API keys will be deleted:"));
      matchingKeys.forEach((key, index) => {
        console.log(
          `  ${chalk.red(`${index + 1}.`)} ${chalk.cyan(key.provider)} - ${chalk.cyan(key.keyId)}`,
        );
        if (key.keyInfo.metadata && key.keyInfo.metadata.name) {
          console.log(`     Name: ${chalk.green(key.keyInfo.metadata.name)}`);
        }
      });
    }

    console.log("");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      chalk.yellow("Are you sure you want to delete this model? (yes/NO): "),
      (answer) => {
        rl.close();

        if (answer.toLowerCase() === "yes") {
          performNamedDeletion(name, matchingKeys, isActiveModel, config);
        } else {
          console.log(chalk.green("Deletion cancelled."));
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
  console.log(chalk.cyan(`Deleting model configuration "${name}"...`));

  let deletedCount = 0;

  // 1. Delete matching API keys from secure storage
  matchingKeys.forEach((key) => {
    try {
      if (secureStore.deleteApiKey(key.provider, key.keyId)) {
        console.log(
          chalk.green(`✓ Deleted API key: ${key.provider} - ${key.keyId}`),
        );
        deletedCount++;
      }
    } catch (error) {
      console.log(
        chalk.red(`✗ Could not delete API key ${key.keyId}:`),
        error.message,
      );
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
    console.log(
      chalk.green(`\n✓ Successfully deleted model configuration "${name}"!`),
    );

    if (isActiveModel) {
      console.log(chalk.bold("\nYou can now:"));
      console.log(
        "  1. Run " +
          chalk.green('"naturecode model"') +
          " to configure a new model",
      );
      console.log(
        "  2. Run " +
          chalk.green('"naturecode check"') +
          " to verify configuration",
      );
      console.log(
        "  3. Run " + chalk.green('"naturecode"') + " to start AI conversation",
      );
    }
  } else {
    console.log(chalk.yellow(`\nNo changes made for model "${name}".`));
  }
}

// Function to delete all models and configurations
function deleteAllModels(force = false) {
  const CONFIG_DIR = path.join(os.homedir(), ".naturecode");
  const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

  if (!force) {
    console.log(
      chalk.red.bold(
        "⚠️  WARNING: This will delete ALL model configurations and API keys.",
      ),
    );
    console.log(chalk.yellow("The following will be deleted:"));
    console.log(chalk.red("  - All configuration files"));
    console.log(chalk.red("  - All encrypted API keys"));
    console.log(chalk.red("  - All model settings"));
    console.log("");

    // 检查是否在交互式终端中
    const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

    if (!isInteractive) {
      console.log(
        chalk.red(
          "ERROR: Cannot request confirmation in non-interactive mode.",
        ),
      );
      console.log("");
      console.log(
        "This command requires direct terminal input for safety reasons.",
      );
      console.log("");
      console.log(chalk.bold("To delete all models:"));
      console.log("1. Exit the AI interface (if you're in one)");
      console.log("2. Run this command directly in your terminal:");
      console.log(chalk.green("   naturecode delmodel all"));
      console.log("");
      console.log(
        chalk.yellow(
          "Or use --force flag to skip confirmation (use with caution):",
        ),
      );
      console.log(chalk.green("   naturecode delmodel all --force"));
      console.log("");
      process.exit(1);
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      chalk.yellow.bold('Type "DELETE ALL" to confirm: '),
      (answer) => {
        rl.close();

        if (answer === "DELETE ALL") {
          performAllDeletion(CONFIG_DIR, CONFIG_FILE);
        } else {
          console.log(chalk.green("Deletion cancelled."));
          process.exit(0);
        }
      },
    );
  } else {
    performAllDeletion(CONFIG_DIR, CONFIG_FILE);
  }
}

function performAllDeletion(CONFIG_DIR, CONFIG_FILE) {
  console.log(chalk.cyan("Deleting all model configurations..."));

  let deletedCount = 0;

  // 1. Delete configuration file
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
    console.log(chalk.green("✓ Deleted configuration file"));
    deletedCount++;
  }

  // 2. Delete all API keys from secure storage
  try {
    secureStore.clearAll();
    console.log(chalk.green("✓ Deleted all encrypted API keys"));
    deletedCount++;
  } catch (error) {
    console.log(chalk.red("✗ Could not delete API keys:"), error.message);
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
    console.log(
      chalk.green("\n✓ Successfully deleted all model configurations!"),
    );
    console.log(chalk.bold("\nYou can now:"));
    console.log(
      "  1. Run " +
        chalk.green('"naturecode model"') +
        " to configure new models",
    );
    console.log(
      "  2. Run " +
        chalk.green('"naturecode check"') +
        " to verify configuration",
    );
    console.log(
      "  3. Run " + chalk.green('"naturecode"') + " to start AI conversation",
    );
  } else {
    console.log(chalk.yellow("\nNo model configurations found to delete."));
  }
}

program
  .command("delmodel [name]")
  .description("Delete model configuration by name or all models")
  .option("-f, --force", "Force delete without confirmation (use with caution)")
  .action((name, options) => {
    try {
      if (!name) {
        console.log(chalk.red("Error: Missing model name"));
        console.log(
          chalk.bold("Usage:") +
            " " +
            chalk.green("naturecode delmodel <name>"),
        );
        console.log(
          "       " +
            chalk.green("naturecode delmodel all") +
            " (to delete all models)",
        );
        console.log("");
        console.log(
          chalk.yellow("Important:") +
            " For safety, 'delmodel all' requires confirmation.",
        );
        console.log(
          "Run this command directly in terminal, not through AI interface.",
        );
        console.log("");
        console.log(chalk.bold("Available models:"));
        listAvailableModels();
        process.exit(1);
      }

      deleteModelByName(name, options.force);
    } catch (error) {
      console.error("Error: Failed to delete model:", error.message);
      process.exit(1);
    }
  });

// Main program logic
const args = process.argv.slice(2);

// Check for help or version flags
const hasHelpFlag = args.includes("-h") || args.includes("--help");
const hasVersionFlag = args.includes("-v") || args.includes("--version");

if (hasHelpFlag || hasVersionFlag || args.length > 0) {
  // Parse command line arguments if flags or commands are provided
  program.parse();
} else {
  // No arguments provided - start interactive mode by default

  // Import and run the start command
  import("./commands/start.js")
    .then((module) => {
      module.startInteractiveSession();
    })
    .catch((error) => {
      console.error(
        chalk.red("Error starting interactive mode:"),
        error.message,
      );
      process.exit(1);
    });
}
