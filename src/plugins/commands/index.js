// Plugin command registration and integration with CLI

import { PluginManager } from "../manager/index.js";

export class PluginCommandRegistry {
  constructor(pluginManager) {
    this.pluginManager = pluginManager;
    this.cliCommands = new Map(); // CLI command name -> plugin command info
  }

  // Register plugin commands with CLI
  registerWithCLI(program) {
    const commands = this.pluginManager.listCommands();

    for (const cmd of commands) {
      this.registerCommand(program, cmd);
    }

    // Add plugin management commands
    this.registerPluginManagementCommands(program);
  }

  registerCommand(program, pluginCommand) {
    const { name, description, plugin, pluginName } = pluginCommand;

    // Get command definition from plugin
    const commandDef = this.pluginManager.commands.get(name)?.command;
    if (!commandDef) {
      console.warn(`Command definition not found for: ${name}`);
      return null;
    }

    // Create CLI command
    const cliCommand = program
      .command(name)
      .description(`${description} (from ${pluginName})`);

    // Add options from command definition
    if (commandDef.options) {
      for (const [optName, optDef] of Object.entries(commandDef.options)) {
        const flag = optDef.required ? `<${optName}>` : `[${optName}]`;
        cliCommand.argument(flag, optDef.description || "");
      }
    }

    // Add action handler
    cliCommand.action(async (...args) => {
      try {
        // Convert args to options object
        const options = {};
        if (commandDef.options) {
          const optNames = Object.keys(commandDef.options);
          for (let i = 0; i < Math.min(args.length - 1, optNames.length); i++) {
            options[optNames[i]] = args[i];
          }
        }

        const result = await this.pluginManager.executeCommand(name, options);
        if (result !== undefined) {
          console.log(result);
        }
      } catch (error) {
        console.error(`Error executing command ${name}:`, error.message);
        process.exit(1);
      }
    });

    // Store reference
    this.cliCommands.set(name, {
      pluginCommand,
      cliCommand,
      commandDef,
    });

    return cliCommand;
  }

  registerPluginManagementCommands(program) {
    // Plugin list command
    program
      .command("plugin list")
      .description("List all installed plugins")
      .option("-v, --verbose", "Show detailed information")
      .action(async (options) => {
        const plugins = this.pluginManager.listPlugins();
        const commands = this.pluginManager.listCommands();

        console.log("Installed Plugins:");
        console.log("=================");

        if (plugins.length === 0) {
          console.log("No plugins installed.");
          return;
        }

        for (const plugin of plugins) {
          console.log(`\n${plugin.manifest.name} v${plugin.manifest.version}`);
          console.log(`  ID: ${plugin.id}`);
          console.log(`  Description: ${plugin.manifest.description}`);
          console.log(`  Author: ${plugin.manifest.author}`);
          console.log(`  Type: ${plugin.manifest.type}`);

          if (options.verbose) {
            console.log(
              `  Permissions: ${plugin.manifest.naturecode.permissions.join(", ") || "none"}`,
            );
            console.log("  Commands:");

            const pluginCommands = commands.filter(
              (cmd) => cmd.plugin === plugin.id,
            );
            for (const cmd of pluginCommands) {
              console.log(`    - ${cmd.name}: ${cmd.description}`);
            }
          }
        }

        console.log(
          `\nTotal: ${plugins.length} plugin(s), ${commands.length} command(s)`,
        );
      });

    // Plugin info command
    program
      .command("plugin info <pluginId>")
      .description("Show detailed information about a plugin")
      .action(async (pluginId) => {
        const plugin = this.pluginManager.getPlugin(pluginId);
        const manifest = this.pluginManager.getManifest(pluginId);

        if (!manifest) {
          console.error(`Plugin not found: ${pluginId}`);
          process.exit(1);
        }

        console.log(`Plugin: ${manifest.name} v${manifest.version}`);
        console.log("=".repeat(50));

        console.log(`ID: ${pluginId}`);
        console.log(`Description: ${manifest.description}`);
        console.log(`Author: ${manifest.author}`);
        console.log(`License: ${manifest.license}`);
        console.log(`Type: ${manifest.type}`);
        console.log(`Main file: ${manifest.main}`);

        console.log("\nNatureCode Compatibility:");
        console.log(`  Minimum version: ${manifest.naturecode.minVersion}`);
        console.log(`  Maximum version: ${manifest.naturecode.maxVersion}`);
        console.log(
          `  Permissions: ${manifest.naturecode.permissions.join(", ") || "none"}`,
        );

        console.log("\nDependencies:");
        if (Object.keys(manifest.dependencies).length === 0) {
          console.log("  None");
        } else {
          for (const [dep, version] of Object.entries(manifest.dependencies)) {
            console.log(`  ${dep}: ${version}`);
          }
        }

        console.log("\nCommands:");
        const commands = this.pluginManager.listCommands();
        const pluginCommands = commands.filter(
          (cmd) => cmd.plugin === pluginId,
        );

        if (pluginCommands.length === 0) {
          console.log("  No commands registered");
        } else {
          for (const cmd of pluginCommands) {
            console.log(`  - ${cmd.name}: ${cmd.description}`);
          }
        }

        console.log(`\nStatus: ${plugin ? "Loaded" : "Not loaded"}`);
      });

    // Plugin reload command
    program
      .command("plugin reload <pluginId>")
      .description("Reload a plugin")
      .action(async (pluginId) => {
        try {
          console.log(`Reloading plugin: ${pluginId}`);
          await this.pluginManager.reloadPlugin(pluginId);
          console.log(`Plugin ${pluginId} reloaded successfully`);
        } catch (error) {
          console.error(`Failed to reload plugin ${pluginId}:`, error.message);
          process.exit(1);
        }
      });

    // Plugin unload command
    program
      .command("plugin unload <pluginId>")
      .description("Unload a plugin")
      .action(async (pluginId) => {
        try {
          console.log(`Unloading plugin: ${pluginId}`);
          await this.pluginManager.unloadPlugin(pluginId);
          console.log(`Plugin ${pluginId} unloaded successfully`);
        } catch (error) {
          console.error(`Failed to unload plugin ${pluginId}:`, error.message);
          process.exit(1);
        }
      });
  }

  // Execute plugin command directly
  async executePluginCommand(commandName, args = {}) {
    return await this.pluginManager.executeCommand(commandName, args);
  }

  // Get all registered commands
  getCommands() {
    return Array.from(this.cliCommands.keys());
  }

  // Check if command exists
  hasCommand(commandName) {
    return this.cliCommands.has(commandName);
  }
}
