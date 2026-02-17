#!/usr/bin/env node

import { ConfigManager } from "./config-manager.js";
import { exitWithError } from "./error-handler.js";

export class ConfigCommandHandler {
  constructor() {
    this.manager = new ConfigManager();
    this.commands = [
      {
        command: "show",
        description: "Show current configuration",
        handler: this.handleShow.bind(this),
      },
      {
        command: "get",
        description: "Get a specific configuration value",
        handler: this.handleGet.bind(this),
      },
      {
        command: "set",
        description: "Set a configuration value",
        handler: this.handleSet.bind(this),
      },
      {
        command: "reset",
        description: "Reset configuration to defaults",
        handler: this.handleReset.bind(this),
      },
      {
        command: "permission",
        description: "Set permission level (readonly, restricted, full)",
        handler: this.handlePermission.bind(this),
      },
      {
        command: "alias",
        description: "Manage command aliases",
        handler: this.handleAlias.bind(this),
      },
      {
        command: "whitelist",
        description: "Manage file whitelist (allowed extensions/directories)",
        handler: this.handleWhitelist.bind(this),
      },
      {
        command: "blacklist",
        description: "Manage file blacklist (denied extensions/directories)",
        handler: this.handleBlacklist.bind(this),
      },
      {
        command: "check",
        description: "Check if a file or operation is allowed",
        handler: this.handleCheck.bind(this),
      },
    ];
  }

  getAvailableCommands() {
    return this.commands.map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
    }));
  }

  async handleCommand(command, args = {}) {
    const cmd = this.commands.find((c) => c.command === command);

    if (!cmd) {
      throw new Error(`Unknown config command: ${command}`);
    }

    try {
      return await cmd.handler(args);
    } catch (error) {
      throw new Error(`Config command failed: ${error.message}`);
    }
  }

  async handleShow(args) {
    const { scope = "merged", format = "pretty" } = args;

    const config = await this.manager.loadConfig();

    if (format === "json") {
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log("Current Configuration:");
      console.log("");
      this.printConfig(config);
    }

    return config;
  }

  printConfig(config, prefix = "") {
    Object.entries(config).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        console.log(`${prefix}${key}:`);
        this.printConfig(value, prefix + "  ");
      } else if (Array.isArray(value)) {
        console.log(`${prefix}${key}: [${value.length} items]`);
        if (value.length > 0 && value.length <= 5) {
          value.forEach((item) => {
            console.log(`${prefix}  - ${item}`);
          });
        }
      } else {
        console.log(`${prefix}${key}: ${value}`);
      }
    });
  }

  async handleGet(args) {
    const { key } = args;

    if (!key) {
      throw new Error("Key parameter is required");
    }

    const value = await this.manager.getConfigValue(key);

    console.log(`Configuration value for '${key}':`);
    if (value === undefined) {
      console.log("  (not set)");
    } else if (typeof value === "object") {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(`  ${value}`);
    }

    return { key, value };
  }

  async handleSet(args) {
    const { key, value, scope = "project" } = args;

    if (!key) {
      throw new Error("Key parameter is required");
    }

    if (value === undefined) {
      throw new Error("Value parameter is required");
    }

    // Parse value if it looks like JSON
    let parsedValue = value;
    if (typeof value === "string") {
      if (value === "true") parsedValue = true;
      else if (value === "false") parsedValue = false;
      else if (value === "null") parsedValue = null;
      else if (!isNaN(value)) parsedValue = Number(value);
      else if (value.startsWith("[") || value.startsWith("{")) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          // Keep as string if parse fails
        }
      }
    }

    const result = await this.manager.setConfigValue(key, parsedValue, scope);

    console.log("Configuration updated:");
    console.log(`  Key: ${key}`);
    console.log(`  Value: ${parsedValue}`);
    console.log(`  Scope: ${scope}`);
    console.log(`  Path: ${result.path}`);

    return result;
  }

  async handleReset(args) {
    const { scope = "project", confirm = false } = args;

    if (!confirm) {
      console.log("Warning: This will reset configuration to defaults.");
      console.log("Use --confirm to proceed.");
      return { cancelled: true };
    }

    const result = await this.manager.resetConfig(scope);

    console.log("Configuration reset to defaults:");
    console.log(`  Scope: ${scope}`);
    console.log(`  Path: ${result.path}`);

    return result;
  }

  async handlePermission(args) {
    const { level, scope = "project" } = args;

    if (!level) {
      // Show current permission level
      const config = await this.manager.loadConfig();
      const currentLevel = config.permissions?.level || "unknown";

      console.log(`Current permission level: ${currentLevel}`);
      console.log("");
      console.log("Available levels:");
      console.log("  - readonly:   Read files only, no modifications");
      console.log("  - restricted: Read and write, but no deletions");
      console.log("  - full:       Full access (default)");

      return { level: currentLevel };
    }

    const result = await this.manager.setPermissionLevel(level, scope);

    console.log("Permission level updated:");
    console.log(`  Level: ${level}`);
    console.log(`  Scope: ${scope}`);

    return result;
  }

  async handleAlias(args) {
    const { action = "list", name, command, scope = "project" } = args;

    switch (action) {
      case "list":
        const aliases = await this.manager.getCommandAliases();
        console.log("Command Aliases:");
        if (Object.keys(aliases).length === 0) {
          console.log("  (no aliases defined)");
        } else {
          Object.entries(aliases).forEach(([alias, cmd]) => {
            console.log(`  ${alias} -> ${cmd}`);
          });
        }
        return aliases;

      case "add":
        if (!name || !command) {
          throw new Error("Name and command parameters are required");
        }
        const addResult = await this.manager.addCommandAlias(
          name,
          command,
          scope,
        );
        console.log("Alias added:");
        console.log(`  ${name} -> ${command}`);
        return addResult;

      case "remove":
        if (!name) {
          throw new Error("Name parameter is required");
        }
        const removeResult = await this.manager.removeCommandAlias(name, scope);
        if (removeResult.success === false) {
          console.log(removeResult.message);
        } else {
          console.log(`Alias removed: ${name}`);
        }
        return removeResult;

      default:
        throw new Error(`Unknown alias action: ${action}`);
    }
  }

  async handleWhitelist(args) {
    const {
      action = "show",
      type = "extensions",
      item,
      scope = "project",
    } = args;

    const config = await this.manager.loadConfig();
    const rules = config.fileAccess?.rules || {};

    switch (action) {
      case "show":
        if (type === "extensions") {
          console.log("Allowed Extensions:");
          const exts = rules.allowedExtensions || [];
          if (exts.length === 0) {
            console.log("  (all extensions allowed)");
          } else {
            exts.forEach((ext) => console.log(`  ${ext}`));
          }
        } else if (type === "directories") {
          console.log("Allowed Directories:");
          const dirs = rules.allowedDirectories || [];
          if (dirs.length === 0) {
            console.log("  (all directories allowed)");
          } else {
            dirs.forEach((dir) => console.log(`  ${dir}`));
          }
        }
        return rules;

      case "add":
        if (!item) {
          throw new Error("Item parameter is required");
        }
        const key =
          type === "extensions"
            ? "fileAccess.rules.allowedExtensions"
            : "fileAccess.rules.allowedDirectories";
        const currentList = (await this.manager.getConfigValue(key)) || [];
        if (!currentList.includes(item)) {
          currentList.push(item);
          await this.manager.setConfigValue(key, currentList, scope);
          console.log(`Added to whitelist: ${item}`);
        } else {
          console.log(`Already in whitelist: ${item}`);
        }
        return { added: item };

      case "remove":
        if (!item) {
          throw new Error("Item parameter is required");
        }
        const removeKey =
          type === "extensions"
            ? "fileAccess.rules.allowedExtensions"
            : "fileAccess.rules.allowedDirectories";
        const removeList = (await this.manager.getConfigValue(removeKey)) || [];
        const filtered = removeList.filter((i) => i !== item);
        await this.manager.setConfigValue(removeKey, filtered, scope);
        console.log(`Removed from whitelist: ${item}`);
        return { removed: item };

      default:
        throw new Error(`Unknown whitelist action: ${action}`);
    }
  }

  async handleBlacklist(args) {
    const {
      action = "show",
      type = "extensions",
      item,
      scope = "project",
    } = args;

    const config = await this.manager.loadConfig();
    const rules = config.fileAccess?.rules || {};

    switch (action) {
      case "show":
        if (type === "extensions") {
          console.log("Denied Extensions:");
          const exts = rules.deniedExtensions || [];
          if (exts.length === 0) {
            console.log("  (no extensions denied)");
          } else {
            exts.forEach((ext) => console.log(`  ${ext}`));
          }
        } else if (type === "directories") {
          console.log("Denied Directories:");
          const dirs = rules.deniedDirectories || [];
          if (dirs.length === 0) {
            console.log("  (no directories denied)");
          } else {
            dirs.forEach((dir) => console.log(`  ${dir}`));
          }
        }
        return rules;

      case "add":
        if (!item) {
          throw new Error("Item parameter is required");
        }
        const key =
          type === "extensions"
            ? "fileAccess.rules.deniedExtensions"
            : "fileAccess.rules.deniedDirectories";
        const currentList = (await this.manager.getConfigValue(key)) || [];
        if (!currentList.includes(item)) {
          currentList.push(item);
          await this.manager.setConfigValue(key, currentList, scope);
          console.log(`Added to blacklist: ${item}`);
        } else {
          console.log(`Already in blacklist: ${item}`);
        }
        return { added: item };

      case "remove":
        if (!item) {
          throw new Error("Item parameter is required");
        }
        const removeKey =
          type === "extensions"
            ? "fileAccess.rules.deniedExtensions"
            : "fileAccess.rules.deniedDirectories";
        const removeList = (await this.manager.getConfigValue(removeKey)) || [];
        const filtered = removeList.filter((i) => i !== item);
        await this.manager.setConfigValue(removeKey, filtered, scope);
        console.log(`Removed from blacklist: ${item}`);
        return { removed: item };

      default:
        throw new Error(`Unknown blacklist action: ${action}`);
    }
  }

  async handleCheck(args) {
    const { file, operation } = args;

    if (file) {
      const result = await this.manager.isFileAllowed(file);
      console.log(`File access check for: ${file}`);
      console.log(`  Allowed: ${result.allowed ? "Yes" : "No"}`);
      if (result.reason) {
        console.log(`  Reason: ${result.reason}`);
      }
      return result;
    }

    if (operation) {
      const result = await this.manager.isOperationAllowed(operation);
      console.log(`Operation permission check for: ${operation}`);
      console.log(`  Allowed: ${result.allowed ? "Yes" : "No"}`);
      if (result.reason) {
        console.log(`  Reason: ${result.reason}`);
      }
      return result;
    }

    throw new Error("Either file or operation parameter is required");
  }
}

export const configCommandHandler = new ConfigCommandHandler();

// For direct testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const handler = new ConfigCommandHandler();
  const command = process.argv[2] || "show";
  const args = {};

  handler.handleCommand(command, args).catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}
