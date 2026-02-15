// Plugin Manager
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PluginManifest, PluginContext, PluginType } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PluginManager {
  constructor (config = {}) {
    this.config = config;
    this.plugins = new Map(); // pluginId -> plugin instance
    this.manifests = new Map(); // pluginId -> manifest
    this.commands = new Map(); // commandName -> { pluginId, command }
    this.loaded = false;

    // Default plugin directories
    this.pluginDirs = [
      path.join(
        process.env.HOME || process.env.USERPROFILE,
        ".naturecode",
        "plugins",
      ),
      path.join(process.cwd(), ".naturecode", "plugins"),
      path.join(__dirname, "..", "..", "..", "plugins"), // Built-in plugins
    ];

    // Services
    this.fileSystem = null;
    this.aiProvider = null;
    this.logger = null;
    this.eventEmitter = null;

    // Statistics
    this.stats = {
      loaded: 0,
      failed: 0,
      commands: 0,
      lastLoad: null,
    };
  }

  // Set services
  setFileSystem (fileSystem) {
    this.fileSystem = fileSystem;
  }

  setAIProvider (aiProvider) {
    this.aiProvider = aiProvider;
  }

  setLogger (logger) {
    this.logger = logger;
  }

  setEventEmitter (eventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  getLogger () {
    return this.logger || console;
  }

  getConfig () {
    return this.config;
  }

  getEventEmitter () {
    return (
      this.eventEmitter || {
        on: () => {},
        emit: () => {},
      }
    );
  }

  // Plugin discovery and loading
  async discoverPlugins () {
    const discovered = [];

    for (const pluginDir of this.pluginDirs) {
      try {
        if (await this.directoryExists(pluginDir)) {
          const pluginNames = await fs.readdir(pluginDir);

          for (const pluginName of pluginNames) {
            const pluginPath = path.join(pluginDir, pluginName);

            if (await this.isDirectory(pluginPath)) {
              const manifestPath = path.join(pluginPath, "plugin.json");

              if (await this.fileExists(manifestPath)) {
                discovered.push({
                  path: pluginPath,
                  name: pluginName,
                  manifestPath,
                });
              }
            }
          }
        }
      } catch (error) {
        this.getLogger().warn(
          `Failed to scan plugin directory ${pluginDir}:`,
          error.message,
        );
      }
    }

    return discovered;
  }

  async loadPlugins () {
    if (this.loaded) {
      return this.stats;
    }

    this.getLogger().info("Discovering plugins...");
    const discovered = await this.discoverPlugins();

    this.getLogger().info(`Found ${discovered.length} plugin(s)`);

    for (const plugin of discovered) {
      try {
        await this.loadPlugin(plugin);
        this.stats.loaded++;
      } catch (error) {
        this.getLogger().error(
          `Failed to load plugin ${plugin.name}:`,
          error.message,
        );
        this.stats.failed++;
      }
    }

    this.loaded = true;
    this.stats.lastLoad = new Date().toISOString();
    this.stats.commands = this.commands.size;

    this.getLogger().info(
      `Loaded ${this.stats.loaded} plugin(s) with ${this.stats.commands} command(s)`,
    );

    return this.stats;
  }

  async loadPlugin (pluginInfo) {
    const { path: pluginPath, name: pluginName, manifestPath } = pluginInfo;

    // Load manifest
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const manifestData = JSON.parse(manifestContent);
    const manifest = new PluginManifest(manifestData);

    const pluginId = this.generatePluginId(manifest.name, manifest.version);

    // Check if already loaded
    if (this.plugins.has(pluginId)) {
      this.getLogger().warn(`Plugin ${pluginId} already loaded, skipping`);
      return;
    }

    // Load plugin module
    const mainPath = path.join(pluginPath, manifest.main);
    if (!(await this.fileExists(mainPath))) {
      throw new Error(`Plugin main file not found: ${mainPath}`);
    }

    // Import plugin module
    const pluginModule = await import(`file://${mainPath}`);
    const PluginClass = pluginModule.default || pluginModule;

    if (typeof PluginClass !== "function") {
      throw new Error(`Plugin ${pluginId} does not export a class or function`);
    }

    // Create plugin context
    const context = new PluginContext(this, pluginId);

    // Instantiate plugin
    const pluginInstance = new PluginClass(context);

    // Initialize plugin
    if (typeof pluginInstance.initialize === "function") {
      await pluginInstance.initialize();
    }

    // Register commands
    if (typeof pluginInstance.getCommands === "function") {
      const commands = pluginInstance.getCommands();
      await this.registerCommands(pluginId, commands);
    }

    // Store plugin
    this.plugins.set(pluginId, pluginInstance);
    this.manifests.set(pluginId, manifest);

    this.getLogger().info(
      `Loaded plugin: ${manifest.name} v${manifest.version}`,
    );

    // Emit event
    this.getEventEmitter().emit("plugin:loaded", {
      pluginId,
      manifest,
      path: pluginPath,
    });

    return pluginInstance;
  }

  async registerCommands (pluginId, commands) {
    if (!commands || typeof commands !== "object") {
      return;
    }

    for (const [commandName, commandDef] of Object.entries(commands)) {
      const commandId = `${pluginId}:${commandName}`;

      if (this.commands.has(commandName)) {
        this.getLogger().warn(
          `Command ${commandName} already registered, skipping`,
        );
        continue;
      }

      this.commands.set(commandName, {
        pluginId,
        command: commandDef,
      });

      this.stats.commands++;

      this.getLogger().debug(
        `Registered command: ${commandName} from ${pluginId}`,
      );
    }
  }

  // Plugin management
  async unloadPlugin (pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Cleanup plugin
    if (typeof plugin.cleanup === "function") {
      await plugin.cleanup();
    }

    // Remove commands
    for (const [commandName, commandInfo] of this.commands.entries()) {
      if (commandInfo.pluginId === pluginId) {
        this.commands.delete(commandName);
      }
    }

    // Remove plugin
    this.plugins.delete(pluginId);
    this.manifests.delete(pluginId);

    // Emit event
    this.getEventEmitter().emit("plugin:unloaded", { pluginId });

    this.getLogger().info(`Unloaded plugin: ${pluginId}`);
  }

  async reloadPlugin (pluginId) {
    const manifest = this.manifests.get(pluginId);

    if (!manifest) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Find plugin path
    let pluginPath = null;
    for (const pluginDir of this.pluginDirs) {
      const possiblePath = path.join(pluginDir, manifest.name);
      if (await this.directoryExists(possiblePath)) {
        pluginPath = possiblePath;
        break;
      }
    }

    if (!pluginPath) {
      throw new Error(`Plugin directory not found for: ${pluginId}`);
    }

    // Unload then load
    await this.unloadPlugin(pluginId);
    await this.loadPlugin({
      path: pluginPath,
      name: manifest.name,
      manifestPath: path.join(pluginPath, "plugin.json"),
    });
  }

  // Command execution
  async executeCommand (commandName, args = {}, subcommand = null) {
    const commandInfo = this.commands.get(commandName);

    if (!commandInfo) {
      throw new Error(`Command not found: ${commandName}`);
    }

    const { pluginId, command } = commandInfo;
    const plugin = this.plugins.get(pluginId);
    const context = new PluginContext(this, pluginId);

    if (!plugin) {
      throw new Error(`Plugin not found for command: ${commandName}`);
    }

    // Execute command
    return await command.handler(context, args, subcommand);
  }

  // Plugin information
  getPlugin (pluginId) {
    return this.plugins.get(pluginId);
  }

  getManifest (pluginId) {
    return this.manifests.get(pluginId);
  }

  listPlugins () {
    return Array.from(this.plugins.keys()).map((pluginId) => ({
      id: pluginId,
      manifest: this.manifests.get(pluginId),
      loaded: true,
    }));
  }

  listCommands () {
    const commands = [];

    for (const [commandName, commandInfo] of this.commands.entries()) {
      const manifest = this.manifests.get(commandInfo.pluginId);
      commands.push({
        name: commandName,
        plugin: commandInfo.pluginId,
        description: commandInfo.command.description || "",
        pluginName: manifest?.name || commandInfo.pluginId,
        pluginVersion: manifest?.version || "unknown",
      });
    }

    return commands;
  }

  // Permission checking
  hasPermission (pluginId, permission) {
    const manifest = this.manifests.get(pluginId);

    if (!manifest) {
      return false;
    }

    // Check if permission is in plugin's requested permissions
    if (!manifest.naturecode.permissions.includes(permission)) {
      // Plugin didn't request this permission
      return false;
    }

    // TODO: Implement user/configuration based permission checking
    // For now, all requested permissions are granted
    return true;
  }

  // Utility methods
  generatePluginId (name, version) {
    return `${name}@${version}`;
  }

  async directoryExists (dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async fileExists (filePath) {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  async isDirectory (dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  // Manifest validation
  validateManifest (manifest) {
    const errors = [];

    // Required fields
    const requiredFields = [
      "name",
      "version",
      "description",
      "author",
      "type",
      "entry",
    ];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate plugin type
    const validTypes = ["command", "provider", "theme", "integration"];
    if (manifest.type && !validTypes.includes(manifest.type)) {
      errors.push("Invalid plugin type");
    }

    // Validate version format
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push("Invalid version format (should be x.y.z)");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  // Plugin information
  getPluginInfo (pluginId) {
    const manifest = this.manifests.get(pluginId);

    if (!manifest) {
      return null;
    }

    const plugin = this.plugins.get(pluginId);
    const commands = [];

    // Collect commands from this plugin
    for (const [commandName, commandInfo] of this.commands.entries()) {
      if (commandInfo.pluginId === pluginId) {
        commands.push(commandName);
      }
    }

    return {
      id: pluginId,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      type: manifest.type,
      entry: manifest.entry,
      loaded: !!plugin,
      commands: commands,
      permissions: manifest.permissions || [],
      dependencies: manifest.dependencies || {},
      manifest: manifest,
    };
  }

  // Cleanup
  async cleanup () {
    for (const pluginId of this.plugins.keys()) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        this.getLogger().error(
          `Failed to cleanup plugin ${pluginId}:`,
          error.message,
        );
      }
    }

    this.plugins.clear();
    this.manifests.clear();
    this.commands.clear();
    this.loaded = false;

    this.getLogger().info("Plugin manager cleaned up");
  }
}
