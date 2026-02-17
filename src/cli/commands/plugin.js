// Plugin management CLI commands

import { PluginManager } from "../../plugins/manager/index.js";
import { PluginCommandRegistry } from "../../plugins/commands/index.js";
import { PluginSecurityManager } from "../../plugins/manager/security.js";
import fs from "fs/promises";
import path from "path";

export async function runPluginCommand(options) {
  // Handle both object and positional arguments
  let command = options.command;
  let args = { ...options };
  delete args.command;

  // If command is not in options, check positional arguments
  if (!command && options._ && options._.length > 0) {
    command = options._[0];
    args.pluginId = options._[1];
    args.subcommand = options._[2];
    args.query = options._[3];
  }

  // Initialize plugin manager
  const pluginManager = new PluginManager();
  const securityManager = new PluginSecurityManager();
  const commandRegistry = new PluginCommandRegistry(pluginManager);

  // Set up basic services
  pluginManager.setLogger(console);
  pluginManager.setFileSystem({
    readFile: async (pluginId, filePath, encoding) => {
      // Check permission
      if (!securityManager.hasPermission(pluginId, "file:read")) {
        throw new Error("Permission denied: file:read");
      }

      // Check path is allowed
      if (!securityManager.isPathAllowed(pluginId, filePath)) {
        throw new Error(`Access denied to path: ${filePath}`);
      }

      securityManager.trackFileRead(pluginId);
      return await fs.readFile(filePath, encoding);
    },
    writeFile: async (pluginId, filePath, content, encoding) => {
      // Check permission
      if (!securityManager.hasPermission(pluginId, "file:write")) {
        throw new Error("Permission denied: file:write");
      }

      // Check path is allowed
      if (!securityManager.isPathAllowed(pluginId, filePath)) {
        throw new Error(`Access denied to path: ${filePath}`);
      }

      securityManager.trackFileWrite(pluginId);
      return await fs.writeFile(filePath, content, encoding);
    },
    listFiles: async (pluginId, dirPath, listOptions) => {
      // Check permission
      if (!securityManager.hasPermission(pluginId, "file:read")) {
        throw new Error("Permission denied: file:read");
      }

      // Check path is allowed
      if (!securityManager.isPathAllowed(pluginId, dirPath)) {
        throw new Error(`Access denied to path: ${dirPath}`);
      }

      securityManager.trackFileRead(pluginId);
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      return files.map((file) => ({
        name: file.name,
        type: file.isDirectory() ? "directory" : "file",
        path: path.join(dirPath, file.name),
      }));
    },
  });

  pluginManager.setAIProvider({
    generate: async (pluginId, prompt, options) => {
      // Check permission
      if (!securityManager.hasPermission(pluginId, "ai:generate")) {
        throw new Error("Permission denied: ai:generate");
      }

      // In a real implementation, this would call the actual AI provider
      return `AI response to: ${prompt.substring(0, 50)}...`;
    },
    chat: async (pluginId, messages, options) => {
      // Check permission
      if (!securityManager.hasPermission(pluginId, "ai:chat")) {
        throw new Error("Permission denied: ai:chat");
      }

      // In a real implementation, this would call the actual AI provider
      return {
        role: "assistant",
        content: "This is a mock AI response from plugin system",
      };
    },
  });

  // Load plugins
  await pluginManager.loadPlugins();

  // Execute command
  if (!command) {
    // 自动运行综合分析
    return await handleComprehensiveAnalysis(
      pluginManager,
      securityManager,
      args,
    );
  }

  switch (command) {
    case "list":
      return await handleListCommand(pluginManager, args);
    case "info":
      return await handleInfoCommand(pluginManager, args);
    case "install":
      return await handleInstallCommand(args);
    case "uninstall":
      return await handleUninstallCommand(args);
    case "enable":
      return await handleEnableCommand(pluginManager, args);
    case "disable":
      return await handleDisableCommand(pluginManager, args);
    case "reload":
      return await handleReloadCommand(pluginManager, args);
    case "search":
      return await handleSearchCommand(args);
    case "create":
      return await handleCreateCommand(args);
    case "permissions":
      return await handlePermissionsCommand(securityManager, args);
    default:
      console.error(`Unknown plugin command: ${command}`);
      console.log("\nAvailable plugin commands:");
      console.log("  list        - List installed plugins");
      console.log("  info <name> - Show plugin information");
      console.log("  install     - Install a plugin");
      console.log("  uninstall   - Uninstall a plugin");
      console.log("  enable      - Enable a plugin");
      console.log("  disable     - Disable a plugin");
      console.log("  reload      - Reload a plugin");
      console.log("  search      - Search for plugins");
      console.log("  create      - Create a new plugin");
      console.log("  permissions - Manage plugin permissions");
      process.exit(1);
  }
}

async function handleListCommand(pluginManager, args) {
  const plugins = pluginManager.listPlugins();
  const commands = pluginManager.listCommands();

  if (args.json) {
    console.log(JSON.stringify({ plugins, commands }, null, 2));
    return;
  }

  console.log("Installed Plugins:");
  console.log("=================");

  if (plugins.length === 0) {
    console.log("No plugins installed.");
    console.log("\nUse 'naturecode plugin install' to install plugins.");
    return;
  }

  for (const plugin of plugins) {
    console.log(`\n${plugin.manifest.name} v${plugin.manifest.version}`);
    console.log(`  ID: ${plugin.id}`);
    console.log(`  Description: ${plugin.manifest.description}`);
    console.log(`  Author: ${plugin.manifest.author}`);
    console.log(`  Type: ${plugin.manifest.type}`);
    console.log(`  Status: ${plugin.loaded ? "Loaded" : "Disabled"}`);

    if (args.verbose) {
      console.log(
        `  Permissions: ${plugin.manifest.naturecode.permissions.join(", ") || "none"}`,
      );
      console.log("  Commands:");

      const pluginCommands = commands.filter((cmd) => cmd.plugin === plugin.id);
      for (const cmd of pluginCommands) {
        console.log(`    - ${cmd.name}: ${cmd.description}`);
      }
    }
  }

  console.log(
    `\nTotal: ${plugins.length} plugin(s), ${commands.length} command(s)`,
  );
}

async function handleInfoCommand(pluginManager, args) {
  const pluginId = args.pluginId;

  if (!pluginId) {
    console.error("Error: Plugin ID is required");
    console.log("Usage: naturecode plugin info <plugin-id>");
    process.exit(1);
  }

  const plugin = pluginManager.getPlugin(pluginId);
  const manifest = pluginManager.getManifest(pluginId);

  if (!manifest) {
    console.error(`Error: Plugin not found: ${pluginId}`);

    // Suggest similar plugins
    const plugins = pluginManager.listPlugins();
    const similar = plugins.filter(
      (p) => p.id.includes(pluginId) || p.manifest.name.includes(pluginId),
    );

    if (similar.length > 0) {
      console.log("\nDid you mean one of these?");
      for (const p of similar) {
        console.log(`  ${p.id}`);
      }
    }

    process.exit(1);
  }

  console.log(`Plugin: ${manifest.name} v${manifest.version}`);
  console.log("=".repeat(60));

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
  const commands = pluginManager.listCommands();
  const pluginCommands = commands.filter((cmd) => cmd.plugin === pluginId);

  if (pluginCommands.length === 0) {
    console.log("  No commands registered");
  } else {
    for (const cmd of pluginCommands) {
      console.log(`  - ${cmd.name}: ${cmd.description}`);
    }
  }

  console.log(`\nStatus: ${plugin ? "Loaded" : "Not loaded"}`);

  if (args.verbose) {
    console.log("\nManifest JSON:");
    console.log(JSON.stringify(manifest.toJSON(), null, 2));
  }
}

async function handleInstallCommand(args) {
  const source = args.source;

  if (!source) {
    console.error("Error: Plugin source is required");
    console.log("Usage: naturecode plugin install <source>");
    console.log("\nSources can be:");
    console.log("  - Local path: ./my-plugin");
    console.log("  - GitHub: github:username/repo");
    console.log("  - NPM: naturecode-plugin-name");
    process.exit(1);
  }

  console.log(`Installing plugin from: ${source}`);

  // Determine plugin directory
  const pluginDir = path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".naturecode",
    "plugins",
  );

  await fs.mkdir(pluginDir, { recursive: true });

  if (source.startsWith("github:")) {
    // GitHub installation
    const repo = source.substring(7);
    console.log(`Installing from GitHub: ${repo}`);

    // In a real implementation, this would clone the repo
    console.log("GitHub installation not yet implemented");
    console.log("Please install manually or use local path");
  } else if (source.startsWith("npm:")) {
    // NPM installation
    const packageName = source.substring(4);
    console.log(`Installing from NPM: ${packageName}`);

    // In a real implementation, this would use npm install
    console.log("NPM installation not yet implemented");
    console.log("Please install manually or use local path");
  } else {
    // Local path installation
    const sourcePath = path.resolve(source);

    if (!(await fileExists(sourcePath))) {
      console.error(`Error: Source not found: ${sourcePath}`);
      process.exit(1);
    }

    // Check for plugin.json
    const manifestPath = path.join(sourcePath, "plugin.json");
    if (!(await fileExists(manifestPath))) {
      console.error(`Error: plugin.json not found in ${sourcePath}`);
      process.exit(1);
    }

    // Read manifest
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent);

    // Create destination directory
    const destDir = path.join(pluginDir, manifest.name);
    await fs.mkdir(destDir, { recursive: true });

    // Copy files
    console.log(`Copying plugin files to: ${destDir}`);

    // In a real implementation, this would copy all files
    // For now, just copy the manifest
    await fs.copyFile(manifestPath, path.join(destDir, "plugin.json"));

    // Copy main file if it exists
    const mainSource = path.join(sourcePath, manifest.main);
    if (await fileExists(mainSource)) {
      await fs.copyFile(mainSource, path.join(destDir, manifest.main));
    }

    console.log(
      `Plugin ${manifest.name} v${manifest.version} installed successfully!`,
    );
    console.log("\nRun 'naturecode plugin list' to see installed plugins.");
  }
}

async function handleUninstallCommand(args) {
  const pluginId = args.pluginId;

  if (!pluginId) {
    console.error("Error: Plugin ID is required");
    console.log("Usage: naturecode plugin uninstall <plugin-id>");
    process.exit(1);
  }

  // Find plugin directory
  const pluginDir = path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".naturecode",
    "plugins",
  );

  // Extract plugin name from ID (name@version)
  const pluginName = pluginId.split("@")[0];
  const pluginPath = path.join(pluginDir, pluginName);

  if (!(await fileExists(pluginPath))) {
    console.error(`Error: Plugin not found: ${pluginId}`);
    console.log(`Checked path: ${pluginPath}`);
    process.exit(1);
  }

  // Confirm deletion
  if (!args.force) {
    console.log(`WARNING: This will delete plugin: ${pluginId}`);
    console.log(`Path: ${pluginPath}`);

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question("Are you sure? (yes/NO): ", resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== "yes") {
      console.log("Uninstall cancelled.");
      return;
    }
  }

  // Delete plugin directory
  await fs.rm(pluginPath, { recursive: true, force: true });

  console.log(`Plugin ${pluginId} uninstalled successfully.`);
}

async function handleEnableCommand(pluginManager, args) {
  console.log("Enable command not yet implemented");
  // This would involve updating plugin configuration
}

async function handleDisableCommand(pluginManager, args) {
  console.log("Disable command not yet implemented");
  // This would involve updating plugin configuration
}

async function handleReloadCommand(pluginManager, args) {
  const pluginId = args.pluginId;

  if (!pluginId) {
    console.error("Error: Plugin ID is required");
    console.log("Usage: naturecode plugin reload <plugin-id>");
    process.exit(1);
  }

  try {
    console.log(`Reloading plugin: ${pluginId}`);
    await pluginManager.reloadPlugin(pluginId);
    console.log(`Plugin ${pluginId} reloaded successfully`);
  } catch (error) {
    console.error(`Failed to reload plugin ${pluginId}:`, error.message);
    process.exit(1);
  }
}

async function handleSearchCommand(args) {
  const query = args.query;

  if (!query) {
    console.error("Error: Search query is required");
    console.log("Usage: naturecode plugin search <query>");
    process.exit(1);
  }

  console.log(`Searching for plugins: ${query}`);
  console.log("\nPlugin search not yet implemented.");
  console.log("For now, you can:");
  console.log("1. Check the NatureCode documentation for available plugins");
  console.log("2. Look for plugins on GitHub with 'naturecode-plugin' prefix");
  console.log("3. Create your own plugin with 'naturecode plugin create'");
}

async function handleCreateCommand(args) {
  const name = args.name;

  if (!name) {
    console.error("Error: Plugin name is required");
    console.log("Usage: naturecode plugin create <name>");
    process.exit(1);
  }

  // Validate name
  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error(
      "Error: Plugin name can only contain lowercase letters, numbers, and hyphens",
    );
    process.exit(1);
  }

  const pluginName = name.startsWith("naturecode-")
    ? name
    : `naturecode-${name}`;
  const pluginDir = path.join(process.cwd(), pluginName);

  if (await fileExists(pluginDir)) {
    console.error(`Error: Directory already exists: ${pluginDir}`);
    process.exit(1);
  }

  console.log(`Creating new plugin: ${pluginName}`);
  console.log(`Directory: ${pluginDir}`);

  // Create directory structure
  await fs.mkdir(pluginDir, { recursive: true });
  await fs.mkdir(path.join(pluginDir, "src"), { recursive: true });
  await fs.mkdir(path.join(pluginDir, "tests"), { recursive: true });

  // Create plugin.json
  const manifest = {
    name: pluginName,
    version: "1.0.0",
    description: `A NatureCode plugin for ${name.replace("-", " ")}`,
    author: "Your Name",
    license: "MIT",
    type: "command",
    main: "src/index.js",
    dependencies: {},
    naturecode: {
      minVersion: "1.4.0",
      maxVersion: "2.0.0",
      permissions: ["read"],
    },
    commands: [
      {
        name: name.replace("-", ""),
        description: `Main command for ${pluginName}`,
        options: [
          {
            name: "example",
            description: "Example option",
            required: false,
          },
        ],
      },
    ],
  };

  await fs.writeFile(
    path.join(pluginDir, "plugin.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Create main plugin file
  const mainContent = `// ${pluginName} - A NatureCode plugin

export default class ${toCamelCase(pluginName)}Plugin {
  constructor(context) {
    this.context = context;
    this.name = "${pluginName}";
    this.version = "1.0.0";
  }
  
  async initialize() {
    this.context.info(\`Plugin \${this.name} v\${this.version} initialized\`);
  }
  
  async cleanup() {
    this.context.info(\`Plugin \${this.name} cleaned up\`);
  }
  
  getCommands() {
    return {
      "${name.replace("-", "")}": {
        description: "Main command for ${pluginName}",
        handler: this.handleMainCommand.bind(this),
        options: {
          example: { type: "string", required: false }
        }
      }
    };
  }
  
  async handleMainCommand(context, args) {
    const example = args.example || "default";
    return \`Hello from \${this.name}! Example: \${example}\`;
  }
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
`;

  await fs.writeFile(path.join(pluginDir, "src", "index.js"), mainContent);

  // Create README
  const readmeContent = `# ${pluginName}

A NatureCode plugin for ${name.replace("-", " ")}.

## Installation

\`\`\`bash
naturecode plugin install ./${pluginName}
\`\`\`

## Usage

\`\`\`bash
naturecode ${name.replace("-", "")} --example "value"
\`\`\`

## Development

1. Make changes to the plugin
2. Test locally: \`naturecode plugin reload ${pluginName}@1.0.0\`
3. Update version in plugin.json
4. Package for distribution

## License

MIT
`;

  await fs.writeFile(path.join(pluginDir, "README.md"), readmeContent);

  // Create test file
  const testContent = `import { describe, test, expect, beforeEach, afterEach } from "vitest";

describe("${pluginName}", () => {
  test("should have tests", () => {
    expect(true).toBe(true);
  });
});
`;

  await fs.writeFile(
    path.join(pluginDir, "tests", "main.test.js"),
    testContent,
  );

  // Create package.json for npm
  const packageJson = {
    name: pluginName,
    version: "1.0.0",
    description: `A NatureCode plugin for ${name.replace("-", " ")}`,
    main: "src/index.js",
    scripts: {
      test: "vitest",
    },
    keywords: ["naturecode", "plugin", name],
    author: "Your Name",
    license: "MIT",
    devDependencies: {
      vitest: "^1.0.0",
    },
  };

  await fs.writeFile(
    path.join(pluginDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );

  console.log("\nPlugin created successfully!");
  console.log("\nNext steps:");
  console.log(`1. cd ${pluginName}`);
  console.log("2. Edit src/index.js to implement your plugin");
  console.log(`3. Test locally: naturecode plugin install ./${pluginName}`);
  console.log(`4. Run: naturecode ${name.replace("-", "")}`);
  console.log("\nFor more information, see the PLUGIN_SYSTEM_DESIGN.md file.");
}

async function handlePermissionsCommand(securityManager, args) {
  const subcommand = args.subcommand;

  if (!subcommand) {
    console.log("Plugin Permissions Management");
    console.log("=============================");
    console.log("\nAvailable subcommands:");
    console.log("  list        - List all available permissions");
    console.log("  show <id>   - Show permissions for a plugin");
    console.log("  grant <id> <permission> - Grant permission to plugin");
    console.log("  revoke <id> <permission> - Revoke permission from plugin");
    return;
  }

  switch (subcommand) {
    case "list":
      const permissions = securityManager.listPermissions();
      console.log("Available Permissions:");
      console.log("=====================");

      for (const perm of permissions) {
        console.log(`\n${perm.name}`);
        console.log(`  Description: ${perm.description}`);
        console.log(`  Dangerous: ${perm.dangerous ? "Yes" : "No"}`);
        console.log(`  Default: ${perm.default ? "Granted" : "Denied"}`);
      }
      break;

    default:
      console.log(`Permission subcommand '${subcommand}' not yet implemented`);
  }
}

// Utility functions
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

async function handleComprehensiveAnalysis(
  pluginManager,
  securityManager,
  args,
) {
  console.log("Running comprehensive plugin analysis...\n");

  try {
    // 1. 获取插件列表
    const plugins = pluginManager.listPlugins();
    const commands = pluginManager.listCommands();

    console.log("Plugin Ecosystem Overview:");
    console.log("=========================");

    // 2. 显示插件统计
    console.log(`Total Plugins: ${plugins.length}`);
    console.log(`Total Commands: ${commands.length}`);

    // 3. 按状态统计
    const loadedPlugins = plugins.filter((p) => p.loaded).length;
    const disabledPlugins = plugins.length - loadedPlugins;
    console.log(`Loaded Plugins: ${loadedPlugins}`);
    console.log(`Disabled Plugins: ${disabledPlugins}`);

    // 4. 按类型统计
    const pluginTypes = {};
    plugins.forEach((plugin) => {
      const type = plugin.manifest.type || "unknown";
      pluginTypes[type] = (pluginTypes[type] || 0) + 1;
    });

    console.log("\nPlugin Types:");
    Object.entries(pluginTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // 5. 显示前几个插件
    console.log("\nInstalled Plugins:");
    if (plugins.length === 0) {
      console.log("  No plugins installed.");
    } else {
      const displayPlugins = plugins.slice(0, 5); // 只显示前5个
      displayPlugins.forEach((plugin) => {
        console.log(
          `  ${plugin.manifest.name} v${plugin.manifest.version} (${plugin.loaded ? "Loaded" : "Disabled"})`,
        );
      });

      if (plugins.length > 5) {
        console.log(`  ... and ${plugins.length - 5} more plugins`);
      }
    }

    // 6. 权限分析
    console.log("\nSecurity Analysis:");
    const permissions = securityManager.listPermissions();
    console.log(`  Available Permissions: ${permissions.length}`);

    // 检查危险权限使用
    const dangerousPermissions = permissions.filter((p) => p.dangerous).length;
    console.log(`  Dangerous Permissions: ${dangerousPermissions}`);

    // 7. 显示摘要和建议
    console.log("\nSummary & Recommendations:");

    if (plugins.length === 0) {
      console.log(
        "  1. Run 'naturecode plugin install' to install your first plugin",
      );
      console.log(
        "  2. Run 'naturecode plugin search <keyword>' to discover plugins",
      );
      console.log(
        "  3. Run 'naturecode plugin create' to create your own plugin",
      );
    } else {
      console.log("  1. Run 'naturecode plugin list' for detailed plugin list");
      console.log(
        "  2. Run 'naturecode plugin info <name>' for plugin details",
      );
      console.log(
        "  3. Run 'naturecode plugin search' to discover more plugins",
      );
      console.log(
        "  4. Run 'naturecode plugin permissions' to manage security",
      );
    }

    console.log("\nAvailable detailed commands:");
    console.log("  naturecode plugin list        - List installed plugins");
    console.log("  naturecode plugin info <name> - Show plugin information");
    console.log("  naturecode plugin install     - Install a plugin");
    console.log("  naturecode plugin search      - Search for plugins");
    console.log("  naturecode plugin create      - Create a new plugin");
    console.log("  naturecode plugin permissions - Manage plugin permissions");

    console.log("\nQuick start examples:");
    console.log("  naturecode plugin list              # List all plugins");
    console.log("  naturecode plugin info <plugin-id>  # Show plugin details");
    console.log("  naturecode plugin install           # Install new plugin");
    console.log(
      "  naturecode plugin search ai         # Search for AI plugins",
    );

    return null;
  } catch (error) {
    console.error("Error during comprehensive plugin analysis:", error.message);

    // 回退到基本帮助
    console.log("\nAvailable plugin commands:");
    console.log("  list        - List installed plugins");
    console.log("  info <name> - Show plugin information");
    console.log("  install     - Install a plugin");
    console.log("  uninstall   - Uninstall a plugin");
    console.log("  enable      - Enable a plugin");
    console.log("  disable     - Disable a plugin");
    console.log("  reload      - Reload a plugin");
    console.log("  search      - Search for plugins");
    console.log("  create      - Create a new plugin");
    console.log("  permissions - Manage plugin permissions");

    return null;
  }
}
