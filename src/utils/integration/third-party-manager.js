// Third-party tool integration manager for v1.4.3
// Provides integration with popular development tools and services

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ThirdPartyIntegrationManager {
  constructor(config = {}) {
    this.config = {
      enabledIntegrations: config.enabledIntegrations || [],
      toolPaths: config.toolPaths || {},
      timeout: config.timeout || 30000, // 30 seconds
      ...config,
    };

    this.integrations = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      // Initialize enabled integrations
      for (const integrationName of this.config.enabledIntegrations) {
        await this.initializeIntegration(integrationName);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize third-party integrations:", error);
      return false;
    }
  }

  async initializeIntegration(integrationName) {
    const integration = this.getIntegrationConfig(integrationName);

    if (!integration) {
      throw new Error(`Unknown integration: ${integrationName}`);
    }

    // Check if tool is available
    const isAvailable = await this.checkToolAvailability(integration);

    if (!isAvailable) {
      console.warn(`Integration ${integrationName} is not available`);
      return false;
    }

    this.integrations.set(integrationName, {
      ...integration,
      available: true,
      initialized: true,
    });

    console.log(`Integration ${integrationName} initialized successfully`);
    return true;
  }

  getIntegrationConfig(integrationName) {
    const integrations = {
      // Code quality tools
      eslint: {
        name: "ESLint",
        description: "JavaScript/TypeScript linting tool",
        command: "eslint",
        versionCommand: "--version",
        minVersion: "8.0.0",
        features: ["lint", "fix", "format"],
        configFiles: [
          ".eslintrc.js",
          ".eslintrc.json",
          ".eslintrc.yml",
          ".eslintrc.yaml",
        ],
      },
      prettier: {
        name: "Prettier",
        description: "Code formatter",
        command: "prettier",
        versionCommand: "--version",
        minVersion: "3.0.0",
        features: ["format", "check"],
        configFiles: [
          ".prettierrc",
          ".prettierrc.js",
          ".prettierrc.json",
          ".prettierrc.yml",
        ],
      },
      typescript: {
        name: "TypeScript",
        description: "TypeScript compiler and type checker",
        command: "tsc",
        versionCommand: "--version",
        minVersion: "5.0.0",
        features: ["compile", "typecheck", "watch"],
        configFiles: ["tsconfig.json"],
      },

      // Testing tools
      jest: {
        name: "Jest",
        description: "JavaScript testing framework",
        command: "jest",
        versionCommand: "--version",
        minVersion: "29.0.0",
        features: ["test", "coverage", "watch"],
        configFiles: ["jest.config.js", "jest.config.json", "jest.config.ts"],
      },
      vitest: {
        name: "Vitest",
        description: "Vite-native testing framework",
        command: "vitest",
        versionCommand: "--version",
        minVersion: "1.0.0",
        features: ["test", "coverage", "watch"],
        configFiles: ["vitest.config.js", "vitest.config.ts"],
      },

      // Build tools
      webpack: {
        name: "Webpack",
        description: "Module bundler",
        command: "webpack",
        versionCommand: "--version",
        minVersion: "5.0.0",
        features: ["build", "watch", "analyze"],
        configFiles: ["webpack.config.js", "webpack.config.ts"],
      },
      vite: {
        name: "Vite",
        description: "Next generation frontend tooling",
        command: "vite",
        versionCommand: "--version",
        minVersion: "4.0.0",
        features: ["dev", "build", "preview"],
        configFiles: ["vite.config.js", "vite.config.ts"],
      },

      // Package managers
      npm: {
        name: "npm",
        description: "Node package manager",
        command: "npm",
        versionCommand: "--version",
        minVersion: "9.0.0",
        features: ["install", "run", "audit", "outdated"],
        alwaysAvailable: true, // npm is usually available with Node.js
      },
      yarn: {
        name: "Yarn",
        description: "Fast, reliable dependency management",
        command: "yarn",
        versionCommand: "--version",
        minVersion: "3.0.0",
        features: ["install", "run", "workspaces"],
      },
      pnpm: {
        name: "pnpm",
        description: "Fast, disk space efficient package manager",
        command: "pnpm",
        versionCommand: "--version",
        minVersion: "8.0.0",
        features: ["install", "run", "workspaces"],
      },

      // Container tools
      docker: {
        name: "Docker",
        description: "Container platform",
        command: "docker",
        versionCommand: "--version",
        minVersion: "20.0.0",
        features: ["build", "run", "compose"],
      },
      dockerCompose: {
        name: "Docker Compose",
        description: "Multi-container Docker applications",
        command: "docker-compose",
        versionCommand: "--version",
        minVersion: "2.0.0",
        features: ["up", "down", "build"],
      },

      // Cloud tools
      aws: {
        name: "AWS CLI",
        description: "Amazon Web Services command line interface",
        command: "aws",
        versionCommand: "--version",
        minVersion: "2.0.0",
        features: ["deploy", "configure", "s3", "ec2"],
      },
      terraform: {
        name: "Terraform",
        description: "Infrastructure as Code",
        command: "terraform",
        versionCommand: "--version",
        minVersion: "1.0.0",
        features: ["plan", "apply", "destroy"],
      },
    };

    return integrations[integrationName];
  }

  async checkToolAvailability(integration) {
    // Some tools are always available (like npm with Node.js)
    if (integration.alwaysAvailable) {
      return true;
    }

    const command =
      this.config.toolPaths[integration.command] || integration.command;

    try {
      const { stdout } = await execAsync(
        `${command} ${integration.versionCommand}`,
        {
          timeout: this.config.timeout,
        },
      );

      // Parse version from output
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      if (!versionMatch) {
        console.warn(
          `Could not parse version for ${integration.name}: ${stdout}`,
        );
        return false;
      }

      const version = versionMatch[1];
      const isCompatible =
        this.compareVersions(version, integration.minVersion) >= 0;

      if (!isCompatible) {
        console.warn(
          `${integration.name} version ${version} is below minimum required ${integration.minVersion}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  compareVersions(version1, version2) {
    const v1 = version1.split(".").map(Number);
    const v2 = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  async executeTool(integrationName, args = [], options = {}) {
    await this.initialize();

    const integration = this.integrations.get(integrationName);
    if (!integration || !integration.available) {
      throw new Error(`Integration ${integrationName} is not available`);
    }

    const command =
      this.config.toolPaths[integration.command] || integration.command;
    const fullCommand = [command, ...args].join(" ");

    try {
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || this.config.timeout,
        env: { ...process.env, ...options.env },
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command: fullCommand,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout?.toString().trim() || "",
        stderr: error.stderr?.toString().trim() || "",
        command: fullCommand,
        code: error.code,
      };
    }
  }

  async getProjectAnalysis(projectPath = process.cwd()) {
    await this.initialize();

    const analysis = {
      tools: [],
      configs: [],
      recommendations: [],
      compatibility: {},
    };

    // Check for tool configurations
    for (const [name, integration] of this.integrations.entries()) {
      if (!integration.available) continue;

      const toolAnalysis = {
        name: integration.name,
        available: true,
        configFound: false,
        configFile: null,
      };

      // Check for configuration files
      for (const configFile of integration.configFiles || []) {
        const configPath = path.join(projectPath, configFile);
        try {
          await fs.access(configPath);
          toolAnalysis.configFound = true;
          toolAnalysis.configFile = configFile;
          break;
        } catch (error) {
          // Config file not found
        }
      }

      analysis.tools.push(toolAnalysis);

      // Add recommendation if tool is available but config not found
      if (integration.configFiles?.length > 0 && !toolAnalysis.configFound) {
        analysis.recommendations.push({
          type: "missing_config",
          tool: integration.name,
          severity: "low",
          message: `${integration.name} is available but no configuration file found`,
          action: `Create ${integration.configFiles[0]} configuration file`,
        });
      }
    }

    // Check for common project files
    const commonFiles = [
      "package.json",
      "README.md",
      ".gitignore",
      ".env",
      ".env.example",
      "docker-compose.yml",
      "docker-compose.yaml",
      "Dockerfile",
    ];

    for (const file of commonFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        analysis.configs.push(file);
      } catch (error) {
        // File not found
      }
    }

    // Analyze package.json if exists
    try {
      const packageJsonPath = path.join(projectPath, "package.json");
      const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);

      analysis.packageJson = {
        name: packageJson.name,
        version: packageJson.version,
        scripts: Object.keys(packageJson.scripts || {}),
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      };

      // Check for common scripts
      const commonScripts = ["dev", "build", "test", "start", "lint"];
      const missingScripts = commonScripts.filter(
        (script) => !analysis.packageJson.scripts.includes(script),
      );

      if (missingScripts.length > 0) {
        analysis.recommendations.push({
          type: "missing_scripts",
          severity: "medium",
          message: `Missing common npm scripts: ${missingScripts.join(", ")}`,
          action: "Add these scripts to package.json",
        });
      }
    } catch (error) {
      // package.json not found or invalid
    }

    return analysis;
  }

  async getIntegrationStatus() {
    await this.initialize();

    const status = {
      total: this.integrations.size,
      available: 0,
      unavailable: 0,
      integrations: [],
    };

    for (const [name, integration] of this.integrations.entries()) {
      const integrationStatus = {
        name: integration.name,
        description: integration.description,
        available: integration.available,
        command: integration.command,
        features: integration.features,
      };

      status.integrations.push(integrationStatus);

      if (integration.available) {
        status.available++;
      } else {
        status.unavailable++;
      }
    }

    return status;
  }

  async runCodeQualityCheck(projectPath = process.cwd()) {
    await this.initialize();

    const checks = [];
    const results = [];

    // Run ESLint if available
    if (
      this.integrations.has("eslint") &&
      this.integrations.get("eslint").available
    ) {
      checks.push(this.runEslintCheck(projectPath));
    }

    // Run TypeScript check if available
    if (
      this.integrations.has("typescript") &&
      this.integrations.get("typescript").available
    ) {
      checks.push(this.runTypescriptCheck(projectPath));
    }

    // Run Prettier check if available
    if (
      this.integrations.has("prettier") &&
      this.integrations.get("prettier").available
    ) {
      checks.push(this.runPrettierCheck(projectPath));
    }

    // Run all checks in parallel
    const checkResults = await Promise.allSettled(checks);

    for (let i = 0; i < checkResults.length; i++) {
      const result = checkResults[i];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          tool: "unknown",
          success: false,
          error: result.reason.message,
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      projectPath,
      results,
      summary: this.generateQualitySummary(results),
    };
  }

  async runEslintCheck(projectPath) {
    const result = await this.executeTool(
      "eslint",
      [".", "--ext", ".js,.jsx,.ts,.tsx", "--format", "json"],
      {
        cwd: projectPath,
      },
    );

    if (result.success) {
      try {
        const output = JSON.parse(result.stdout);
        return {
          tool: "eslint",
          success: true,
          issues: output.reduce(
            (sum, file) => sum + file.errorCount + file.warningCount,
            0,
          ),
          errorCount: output.reduce((sum, file) => sum + file.errorCount, 0),
          warningCount: output.reduce(
            (sum, file) => sum + file.warningCount,
            0,
          ),
          files: output.length,
        };
      } catch (error) {
        return {
          tool: "eslint",
          success: true,
          issues: 0,
          errorCount: 0,
          warningCount: 0,
          files: 0,
          rawOutput: result.stdout,
        };
      }
    } else {
      return {
        tool: "eslint",
        success: false,
        error: result.error,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }
  }

  async runTypescriptCheck(projectPath) {
    const result = await this.executeTool("typescript", ["--noEmit"], {
      cwd: projectPath,
    });

    return {
      tool: "typescript",
      success: result.success,
      error: result.success ? null : result.error,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  async runPrettierCheck(projectPath) {
    const result = await this.executeTool("prettier", [".", "--check"], {
      cwd: projectPath,
    });

    return {
      tool: "prettier",
      success: result.success,
      error: result.success ? null : result.error,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  generateQualitySummary(results) {
    const summary = {
      totalChecks: results.length,
      passed: 0,
      failed: 0,
      totalIssues: 0,
      recommendations: [],
    };

    for (const result of results) {
      if (result.success) {
        summary.passed++;

        if (result.tool === "eslint" && result.issues > 0) {
          summary.totalIssues += result.issues;

          if (result.errorCount > 0) {
            summary.recommendations.push({
              tool: "eslint",
              severity: "high",
              message: `ESLint found ${result.errorCount} errors`,
              action: "Run 'eslint . --fix' to automatically fix some issues",
            });
          }

          if (result.warningCount > 0) {
            summary.recommendations.push({
              tool: "eslint",
              severity: "medium",
              message: `ESLint found ${result.warningCount} warnings`,
              action: "Review and fix warnings to improve code quality",
            });
          }
        }
      } else {
        summary.failed++;

        summary.recommendations.push({
          tool: result.tool,
          severity: "medium",
          message: `${result.tool} check failed`,
          action: `Check ${result.tool} configuration: ${result.error}`,
        });
      }
    }

    // Overall assessment
    if (summary.passed === summary.totalChecks && summary.totalIssues === 0) {
      summary.assessment = "excellent";
      summary.message = "All code quality checks passed with no issues";
    } else if (
      summary.passed === summary.totalChecks &&
      summary.totalIssues > 0
    ) {
      summary.assessment = "good";
      summary.message = `All checks passed but found ${summary.totalIssues} issues to fix`;
    } else if (summary.passed > summary.failed) {
      summary.assessment = "fair";
      summary.message = `${summary.passed}/${summary.totalChecks} checks passed`;
    } else {
      summary.assessment = "needs_improvement";
      summary.message = `${summary.failed}/${summary.totalChecks} checks failed`;
    }

    return summary;
  }
}
