#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import os from "os";

export class ConfigManager {
  constructor(projectDir = process.cwd()) {
    this.projectDir = projectDir;
    this.globalConfigPath = path.join(
      os.homedir(),
      ".naturecode",
      "config.json",
    );
    this.projectConfigPath = path.join(projectDir, ".naturecode.json");
    this.defaultConfig = this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      version: "1.0.0",
      fileAccess: {
        enabled: true,
        rules: {
          allowedExtensions: [
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
            ".md",
            ".txt",
            ".html",
            ".css",
            ".scss",
            ".py",
            ".java",
            ".go",
            ".rs",
            ".c",
            ".cpp",
            ".h",
            ".yml",
            ".yaml",
            ".xml",
            ".sql",
            ".sh",
            ".bash",
          ],
          deniedExtensions: [".env", ".pem", ".key", ".cert", ".p12"],
          allowedDirectories: [],
          deniedDirectories: [
            "node_modules",
            ".git",
            "dist",
            "build",
            ".next",
            ".nuxt",
            "coverage",
            ".cache",
            "tmp",
            "temp",
          ],
          maxFileSize: 10485760, // 10MB
          followSymlinks: false,
        },
      },
      permissions: {
        level: "full", // 'readonly', 'restricted', 'full'
        allowRead: true,
        allowWrite: true,
        allowDelete: false,
        allowExecute: false,
        requireConfirmation: {
          delete: true,
          overwrite: true,
          largeFiles: true,
        },
      },
      commands: {
        aliases: {},
        shortcuts: {},
        customCommands: [],
      },
      features: {
        gitIntegration: true,
        codeAnalysis: true,
        projectManagement: true,
        autoBackup: true,
        feedback: true,
      },
      security: {
        sandboxMode: true,
        restrictToProjectDir: true,
        preventPathTraversal: true,
        validateCommands: true,
      },
      display: {
        colorOutput: true,
        verboseLogging: false,
        showHints: true,
        compactMode: false,
      },
    };
  }

  async loadConfig() {
    try {
      // Start with default config (deep copy to avoid mutations)
      let config = JSON.parse(JSON.stringify(this.defaultConfig));

      // Load global config if exists
      if (await this.fileExists(this.globalConfigPath)) {
        const globalConfig = await this.readConfigFile(this.globalConfigPath);
        config = this.mergeConfigs(config, globalConfig);
      }

      // Load project config if exists (overrides global)
      if (await this.fileExists(this.projectConfigPath)) {
        const projectConfig = await this.readConfigFile(this.projectConfigPath);
        config = this.mergeConfigs(config, projectConfig);
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  async saveConfig(config, scope = "project") {
    try {
      const configPath =
        scope === "global" ? this.globalConfigPath : this.projectConfigPath;

      // Ensure directory exists
      const dir = path.dirname(configPath);
      await fs.mkdir(dir, { recursive: true });

      // Validate config before saving
      this.validateConfig(config);

      // Write config file
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");

      return {
        success: true,
        path: configPath,
        scope,
      };
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  async readConfigFile(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read config file: ${error.message}`);
    }
  }

  mergeConfigs(base, override) {
    const merged = { ...base };

    Object.keys(override).forEach((key) => {
      if (
        override[key] &&
        typeof override[key] === "object" &&
        !Array.isArray(override[key])
      ) {
        merged[key] = this.mergeConfigs(base[key] || {}, override[key]);
      } else {
        merged[key] = override[key];
      }
    });

    return merged;
  }

  validateConfig(config) {
    // Validate version
    if (!config.version) {
      throw new Error("Config must have a version field");
    }

    // Validate permissions level
    if (config.permissions && config.permissions.level) {
      const validLevels = ["readonly", "restricted", "full"];
      if (!validLevels.includes(config.permissions.level)) {
        throw new Error(
          `Invalid permission level: ${config.permissions.level}. Must be one of: ${validLevels.join(", ")}`,
        );
      }
    }

    // Validate file access rules
    if (config.fileAccess && config.fileAccess.rules) {
      const rules = config.fileAccess.rules;

      if (
        rules.maxFileSize &&
        (typeof rules.maxFileSize !== "number" || rules.maxFileSize < 0)
      ) {
        throw new Error("maxFileSize must be a positive number");
      }

      if (rules.allowedExtensions && !Array.isArray(rules.allowedExtensions)) {
        throw new Error("allowedExtensions must be an array");
      }

      if (rules.deniedExtensions && !Array.isArray(rules.deniedExtensions)) {
        throw new Error("deniedExtensions must be an array");
      }
    }

    return true;
  }

  async updateConfig(updates, scope = "project") {
    try {
      const currentConfig = await this.loadConfig();
      const updatedConfig = this.mergeConfigs(currentConfig, updates);
      return await this.saveConfig(updatedConfig, scope);
    } catch (error) {
      throw new Error(`Failed to update configuration: ${error.message}`);
    }
  }

  async resetConfig(scope = "project") {
    try {
      const defaultConfig = this.getDefaultConfig();
      return await this.saveConfig(defaultConfig, scope);
    } catch (error) {
      throw new Error(`Failed to reset configuration: ${error.message}`);
    }
  }

  async getConfigValue(key, config = null) {
    try {
      if (!config) {
        config = await this.loadConfig();
      }

      const keys = key.split(".");
      let value = config;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return undefined;
        }
      }

      return value;
    } catch (error) {
      return undefined;
    }
  }

  async setConfigValue(key, value, scope = "project") {
    try {
      const config = await this.loadConfig();
      const keys = key.split(".");
      let current = config;

      // Navigate to the parent of the target key
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k] || typeof current[k] !== "object") {
          current[k] = {};
        }
        current = current[k];
      }

      // Set the value
      current[keys[keys.length - 1]] = value;

      return await this.saveConfig(config, scope);
    } catch (error) {
      throw new Error(`Failed to set config value: ${error.message}`);
    }
  }

  async addCommandAlias(alias, command, scope = "project") {
    try {
      const config = await this.loadConfig();

      if (!config.commands) {
        config.commands = { aliases: {}, shortcuts: {}, customCommands: [] };
      }

      if (!config.commands.aliases) {
        config.commands.aliases = {};
      }

      config.commands.aliases[alias] = command;

      return await this.saveConfig(config, scope);
    } catch (error) {
      throw new Error(`Failed to add command alias: ${error.message}`);
    }
  }

  async removeCommandAlias(alias, scope = "project") {
    try {
      const config = await this.loadConfig();

      if (
        config.commands &&
        config.commands.aliases &&
        config.commands.aliases[alias]
      ) {
        delete config.commands.aliases[alias];
        const result = await this.saveConfig(config, scope);
        return { ...result, success: true };
      }

      return {
        success: false,
        message: `Alias '${alias}' not found`,
      };
    } catch (error) {
      throw new Error(`Failed to remove command alias: ${error.message}`);
    }
  }

  async getCommandAliases() {
    try {
      const config = await this.loadConfig();
      return config.commands?.aliases || {};
    } catch (error) {
      return {};
    }
  }

  async resolveAlias(command) {
    try {
      const aliases = await this.getCommandAliases();
      return aliases[command] || command;
    } catch (error) {
      return command;
    }
  }

  async isFileAllowed(filePath) {
    try {
      const config = await this.loadConfig();
      const rules = config.fileAccess?.rules;

      if (!config.fileAccess?.enabled) {
        return { allowed: false, reason: "File access is disabled" };
      }

      if (!rules) {
        return { allowed: true };
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();

      if (rules.deniedExtensions && rules.deniedExtensions.includes(ext)) {
        return { allowed: false, reason: `File extension '${ext}' is denied` };
      }

      if (
        rules.allowedExtensions &&
        rules.allowedExtensions.length > 0 &&
        !rules.allowedExtensions.includes(ext)
      ) {
        return {
          allowed: false,
          reason: `File extension '${ext}' is not in allowed list`,
        };
      }

      // Check directory
      const relativePath = path.relative(this.projectDir, filePath);
      const directories = relativePath.split(path.sep);

      if (rules.deniedDirectories) {
        for (const dir of directories) {
          if (rules.deniedDirectories.includes(dir)) {
            return { allowed: false, reason: `Directory '${dir}' is denied` };
          }
        }
      }

      if (rules.allowedDirectories && rules.allowedDirectories.length > 0) {
        const firstDir = directories[0];
        if (!rules.allowedDirectories.includes(firstDir)) {
          return {
            allowed: false,
            reason: `Directory '${firstDir}' is not in allowed list`,
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: `Error checking file access: ${error.message}`,
      };
    }
  }

  async isOperationAllowed(operation) {
    try {
      const config = await this.loadConfig();
      const permissions = config.permissions;

      if (!permissions) {
        return { allowed: true };
      }

      const operationMap = {
        read: permissions.allowRead,
        write: permissions.allowWrite,
        delete: permissions.allowDelete,
        execute: permissions.allowExecute,
      };

      const allowed = operationMap[operation];

      if (allowed === false) {
        return {
          allowed: false,
          reason: `Operation '${operation}' is not permitted in current permission level (${permissions.level})`,
        };
      }

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        reason: `Error checking operation permission: ${error.message}`,
      };
    }
  }

  async requiresConfirmation(operation) {
    try {
      const config = await this.loadConfig();
      const confirmations = config.permissions?.requireConfirmation;

      if (!confirmations) {
        return false;
      }

      return confirmations[operation] || false;
    } catch (error) {
      return false;
    }
  }

  async setPermissionLevel(level, scope = "project") {
    try {
      const validLevels = ["readonly", "restricted", "full"];

      if (!validLevels.includes(level)) {
        throw new Error(`Invalid permission level: ${level}`);
      }

      const config = await this.loadConfig();

      if (!config.permissions) {
        config.permissions = this.defaultConfig.permissions;
      }

      config.permissions.level = level;

      // Apply level-specific defaults
      switch (level) {
        case "readonly":
          config.permissions.allowRead = true;
          config.permissions.allowWrite = false;
          config.permissions.allowDelete = false;
          config.permissions.allowExecute = false;
          break;
        case "restricted":
          config.permissions.allowRead = true;
          config.permissions.allowWrite = true;
          config.permissions.allowDelete = false;
          config.permissions.allowExecute = false;
          config.permissions.requireConfirmation = {
            delete: true,
            overwrite: true,
            largeFiles: true,
          };
          break;
        case "full":
          config.permissions.allowRead = true;
          config.permissions.allowWrite = true;
          config.permissions.allowDelete = true;
          config.permissions.allowExecute = false;
          break;
      }

      return await this.saveConfig(config, scope);
    } catch (error) {
      throw new Error(`Failed to set permission level: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default ConfigManager;
