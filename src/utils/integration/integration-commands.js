// Integration command handler for v1.4.3
// Provides CLI commands for third-party tool integration

import { ThirdPartyIntegrationManager } from "./third-party-manager.js";

export class IntegrationCommandHandler {
  constructor(config = {}) {
    this.config = config;
    this.integrationManager = new ThirdPartyIntegrationManager(config);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      await this.integrationManager.initialize();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize integration command handler:", error);
      return false;
    }
  }

  async handleCommand(command, args = {}) {
    await this.initialize();

    const commandMap = {
      "integration:status": this.handleStatus.bind(this),
      "integration:analyze": this.handleAnalyze.bind(this),
      "integration:quality": this.handleQualityCheck.bind(this),
      "integration:run": this.handleRunTool.bind(this),
      "integration:list": this.handleListTools.bind(this),
      "integration:help": this.handleHelp.bind(this),
    };

    const handler = commandMap[command];
    if (!handler) {
      return {
        success: false,
        error: `Unknown integration command: ${command}`,
      };
    }

    try {
      return await handler(args);
    } catch (error) {
      return {
        success: false,
        error: error.message || "Command execution failed",
      };
    }
  }

  async handleStatus(args) {
    const status = await this.integrationManager.getIntegrationStatus();

    return {
      success: true,
      status: {
        total: status.total,
        available: status.available,
        unavailable: status.unavailable,
        integrations: status.integrations.map((integration) => ({
          name: integration.name,
          available: integration.available,
          description: integration.description,
          features: integration.features.slice(0, 3), // Show first 3 features
        })),
      },
      message: `${status.available}/${status.total} tools available`,
    };
  }

  async handleAnalyze(args) {
    const { path: projectPath = process.cwd() } = args;

    const analysis =
      await this.integrationManager.getProjectAnalysis(projectPath);

    return {
      success: true,
      analysis: {
        projectPath,
        tools: analysis.tools,
        configs: analysis.configs,
        packageJson: analysis.packageJson,
        recommendations: analysis.recommendations.slice(0, 5), // Show top 5 recommendations
        totalRecommendations: analysis.recommendations.length,
      },
      summary: {
        toolsFound: analysis.tools.filter((t) => t.available && t.configFound)
          .length,
        configsFound: analysis.configs.length,
        recommendations: analysis.recommendations.length,
      },
    };
  }

  async handleQualityCheck(args) {
    const { path: projectPath = process.cwd(), fix = false } = args;

    const qualityReport =
      await this.integrationManager.runCodeQualityCheck(projectPath);

    // If fix is requested and ESLint is available, run eslint --fix
    if (fix && this.integrationManager.integrations.has("eslint")) {
      const eslint = this.integrationManager.integrations.get("eslint");
      if (eslint.available) {
        const fixResult = await this.integrationManager.executeTool(
          "eslint",
          [".", "--ext", ".js,.jsx,.ts,.tsx", "--fix"],
          { cwd: projectPath },
        );

        qualityReport.fixApplied = fixResult.success;
        if (fixResult.success) {
          qualityReport.fixMessage = "ESLint auto-fix applied successfully";
        } else {
          qualityReport.fixMessage = `ESLint auto-fix failed: ${fixResult.error}`;
        }
      }
    }

    return {
      success: true,
      quality: qualityReport,
      message: `Code quality check completed: ${qualityReport.summary.message}`,
    };
  }

  async handleRunTool(args) {
    const { tool, command: toolCommand, ...toolArgs } = args;

    if (!tool) {
      throw new Error("Tool name is required");
    }

    // Convert args object to command line arguments
    const cliArgs = [];
    for (const [key, value] of Object.entries(toolArgs)) {
      if (value === true) {
        cliArgs.push(`--${key}`);
      } else if (value !== false && value !== undefined && value !== null) {
        cliArgs.push(`--${key}=${value}`);
      }
    }

    // If a specific command is provided (like "test" for jest), add it
    if (toolCommand) {
      cliArgs.unshift(toolCommand);
    }

    const result = await this.integrationManager.executeTool(tool, cliArgs);

    return {
      success: result.success,
      tool,
      command: result.command,
      output: result.stdout,
      error: result.error,
      stderr: result.stderr,
      exitCode: result.code,
    };
  }

  async handleListTools(args) {
    const { category, availableOnly = false } = args;

    const status = await this.integrationManager.getIntegrationStatus();

    let tools = status.integrations;

    // Filter by category if specified
    if (category) {
      const categories = {
        quality: ["eslint", "prettier", "typescript"],
        testing: ["jest", "vitest"],
        build: ["webpack", "vite"],
        package: ["npm", "yarn", "pnpm"],
        container: ["docker", "dockerCompose"],
        cloud: ["aws", "terraform"],
      };

      if (categories[category]) {
        tools = tools.filter((tool) =>
          categories[category].some(
            (name) =>
              this.integrationManager.integrations.get(name)?.name ===
              tool.name,
          ),
        );
      }
    }

    // Filter by availability if requested
    if (availableOnly) {
      tools = tools.filter((tool) => tool.available);
    }

    // Group by category for better display
    const categorizedTools = {
      "Code Quality": tools.filter((tool) =>
        ["ESLint", "Prettier", "TypeScript"].includes(tool.name),
      ),
      Testing: tools.filter((tool) => ["Jest", "Vitest"].includes(tool.name)),
      "Build Tools": tools.filter((tool) =>
        ["Webpack", "Vite"].includes(tool.name),
      ),
      "Package Managers": tools.filter((tool) =>
        ["npm", "Yarn", "pnpm"].includes(tool.name),
      ),
      "Container Tools": tools.filter((tool) =>
        ["Docker", "Docker Compose"].includes(tool.name),
      ),
      "Cloud Tools": tools.filter((tool) =>
        ["AWS CLI", "Terraform"].includes(tool.name),
      ),
    };

    // Remove empty categories
    Object.keys(categorizedTools).forEach((category) => {
      if (categorizedTools[category].length === 0) {
        delete categorizedTools[category];
      }
    });

    return {
      success: true,
      tools: categorizedTools,
      total: tools.length,
      available: tools.filter((t) => t.available).length,
    };
  }

  async handleHelp(args) {
    const commands = {
      "Integration Commands": [
        "integration:status - Show integration status",
        "integration:analyze - Analyze project for tool integration",
        "integration:quality - Run code quality checks",
        "integration:run - Run a specific tool",
        "integration:list - List available tools",
        "integration:help - Show this help",
      ],
      Examples: [
        "naturecode integration:status",
        "naturecode integration:analyze --path ./my-project",
        "naturecode integration:quality --fix",
        "naturecode integration:run --tool eslint --command . --ext .js,.ts",
        "naturecode integration:list --category quality",
      ],
      "Supported Tools": [
        "Code Quality: ESLint, Prettier, TypeScript",
        "Testing: Jest, Vitest",
        "Build Tools: Webpack, Vite",
        "Package Managers: npm, Yarn, pnpm",
        "Container Tools: Docker, Docker Compose",
        "Cloud Tools: AWS CLI, Terraform",
      ],
    };

    return {
      success: true,
      help: commands,
      message: "Third-party tool integration commands",
    };
  }
}
