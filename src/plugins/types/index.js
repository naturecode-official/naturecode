// Plugin type definitions

export const PluginType = {
  COMMAND: "command",
  AI_PROVIDER: "ai-provider",
  FILE_HANDLER: "file-handler",
  INTEGRATION: "integration",
  UI_THEME: "ui-theme",
};

export const PermissionLevel = {
  NONE: "none",
  READ: "read",
  WRITE: "write",
  NETWORK: "network",
  SYSTEM: "system",
  FULL: "full",
};

export class PluginManifest {
  constructor(data) {
    this.name = data.name;
    this.version = data.version;
    this.description = data.description || "";
    this.author = data.author || "";
    this.license = data.license || "MIT";
    this.type = data.type || PluginType.COMMAND;
    this.main = data.main || "index.js";
    this.dependencies = data.dependencies || {};

    // NatureCode specific
    this.naturecode = data.naturecode || {};
    this.naturecode.minVersion = data.naturecode?.minVersion || "1.4.0";
    this.naturecode.maxVersion = data.naturecode?.maxVersion || "2.0.0";
    this.naturecode.permissions = data.naturecode?.permissions || [];

    // Commands
    this.commands = data.commands || [];

    // Validation
    this.validate();
  }

  validate() {
    const required = ["name", "version", "description", "author"];
    for (const field of required) {
      if (!this[field]) {
        throw new Error(`Plugin manifest missing required field: ${field}`);
      }
    }

    if (!Object.values(PluginType).includes(this.type)) {
      throw new Error(`Invalid plugin type: ${this.type}`);
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(this.version)) {
      throw new Error(
        `Invalid version format: ${this.version}. Use semantic versioning (x.y.z)`,
      );
    }

    // Validate NatureCode version compatibility
    const currentVersion = process.env.NATURECODE_VERSION || "1.4.0";
    if (
      this.naturecode.minVersion &&
      this.compareVersions(currentVersion, this.naturecode.minVersion) < 0
    ) {
      throw new Error(
        `Plugin requires NatureCode ${this.naturecode.minVersion} or higher (current: ${currentVersion})`,
      );
    }

    if (
      this.naturecode.maxVersion &&
      this.compareVersions(currentVersion, this.naturecode.maxVersion) > 0
    ) {
      throw new Error(
        `Plugin supports up to NatureCode ${this.naturecode.maxVersion} (current: ${currentVersion})`,
      );
    }
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }

  toJSON() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      license: this.license,
      type: this.type,
      main: this.main,
      dependencies: this.dependencies,
      naturecode: this.naturecode,
      commands: this.commands,
    };
  }
}

export class PluginContext {
  constructor(pluginManager, pluginId) {
    this.pluginManager = pluginManager;
    this.pluginId = pluginId;
    this.logger = pluginManager.getLogger();
    this.config = pluginManager.getConfig();
    this.events = pluginManager.getEventEmitter();
  }

  // File system access (with permissions)
  async readFile(path, encoding = "utf-8") {
    return await this.pluginManager.fileSystem.readFile(
      this.pluginId,
      path,
      encoding,
    );
  }

  async writeFile(path, content, encoding = "utf-8") {
    return await this.pluginManager.fileSystem.writeFile(
      this.pluginId,
      path,
      content,
      encoding,
    );
  }

  async listFiles(path = ".", options = {}) {
    return await this.pluginManager.fileSystem.listFiles(
      this.pluginId,
      path,
      options,
    );
  }

  // Configuration access
  getConfig(key, defaultValue = null) {
    return this.config.get(`plugins.${this.pluginId}.${key}`, defaultValue);
  }

  setConfig(key, value) {
    return this.config.set(`plugins.${this.pluginId}.${key}`, value);
  }

  // AI provider access
  async generate(prompt, options = {}) {
    return await this.pluginManager.ai.generate(this.pluginId, prompt, options);
  }

  async chat(messages, options = {}) {
    return await this.pluginManager.ai.chat(this.pluginId, messages, options);
  }

  // Logging
  info(message, data = {}) {
    this.logger.info(`[${this.pluginId}] ${message}`, data);
  }

  warn(message, data = {}) {
    this.logger.warn(`[${this.pluginId}] ${message}`, data);
  }

  error(message, data = {}) {
    this.logger.error(`[${this.pluginId}] ${message}`, data);
  }

  // Event system
  on(event, handler) {
    return this.events.on(`plugin:${this.pluginId}:${event}`, handler);
  }

  emit(event, data) {
    return this.events.emit(`plugin:${this.pluginId}:${event}`, data);
  }
}

export class PluginCommand {
  constructor(name, description, handler, options = {}) {
    this.name = name;
    this.description = description;
    this.handler = handler;
    this.options = options.options || [];
    this.arguments = options.arguments || [];
    this.permissions = options.permissions || [];
    this.subcommands = options.subcommands || {};
  }

  async execute(context, args = {}, subcommand = null) {
    // Check permissions
    for (const permission of this.permissions) {
      if (!context.pluginManager.hasPermission(context.pluginId, permission)) {
        throw new Error(`Permission denied: ${permission}`);
      }
    }

    // Execute handler
    if (subcommand && this.subcommands[subcommand]) {
      return await this.subcommands[subcommand].handler(context, args);
    }

    return await this.handler(context, args);
  }
}
