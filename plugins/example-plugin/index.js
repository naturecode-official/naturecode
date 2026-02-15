// Example plugin for NatureCode

export default class ExamplePlugin {
  constructor(context) {
    this.context = context;
    this.name = "naturecode-example";
    this.version = "1.0.0";
  }

  // Called when plugin is loaded
  async initialize() {
    this.context.info(`Plugin ${this.name} v${this.version} initialized`);
  }

  // Called when plugin is unloaded
  async cleanup() {
    this.context.info(`Plugin ${this.name} cleaned up`);
  }

  // Register commands with NatureCode
  getCommands() {
    return {
      hello: {
        description: "Say hello from the example plugin",
        handler: this.handleHello.bind(this),
        options: {
          name: { type: "string", required: false },
        },
      },
      files: {
        description: "List files in current directory",
        handler: this.handleFiles.bind(this),
        options: {
          path: { type: "string", required: false },
        },
      },
      config: {
        description: "Example of using plugin configuration",
        handler: this.handleConfig.bind(this),
        subcommands: {
          get: {
            description: "Get plugin configuration",
            handler: this.handleConfigGet.bind(this),
          },
          set: {
            description: "Set plugin configuration",
            handler: this.handleConfigSet.bind(this),
            options: {
              key: { type: "string", required: true },
              value: { type: "string", required: true },
            },
          },
        },
      },
    };
  }

  // Command handlers
  async handleHello(context, args) {
    const name = args.name || "World";
    return `Hello, ${name}! from ${this.name} plugin`;
  }

  async handleFiles(context, args) {
    const path = args.path || ".";

    try {
      const files = await context.listFiles(path);

      if (files.length === 0) {
        return `No files found in ${path}`;
      }

      let output = `Files in ${path}:\n`;
      for (const file of files) {
        output += `  ${file.name} (${file.type})\n`;
      }

      return output;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async handleConfig(context, args) {
    return "Use subcommands: get, set";
  }

  async handleConfigGet(context, args) {
    const config = context.getConfig("example", {});
    return `Plugin configuration:\n${JSON.stringify(config, null, 2)}`;
  }

  async handleConfigSet(context, args) {
    const { key, value } = args;

    if (!key || !value) {
      throw new Error("Both key and value are required");
    }

    // Parse value if it looks like JSON
    let parsedValue = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Not JSON, use as string
    }

    context.setConfig(key, parsedValue);
    return `Configuration set: ${key} = ${JSON.stringify(parsedValue)}`;
  }

  // Example of using events
  async setupEventListeners() {
    this.context.on("file:read", (data) => {
      this.context.info(`File read: ${data.path}`);
    });

    this.context.on("file:write", (data) => {
      this.context.info(`File written: ${data.path}`);
    });
  }
}
