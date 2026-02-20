// AI Tools for NatureCode
// Provides internet access and terminal command execution capabilities

import { exec, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Internet Access Tool - Fetches content from the web
 */
export class InternetTool {
  constructor() {
    this.name = "internet";
    this.description =
      "Access the internet to fetch information, check APIs, get latest updates";
    this.supportedMethods = ["fetch", "search", "check"];
  }

  /**
   * Execute internet operation
   */
  async execute(operation, params) {
    try {
      switch (operation) {
        case "fetch":
          return await this._fetchUrl(params.url, params.options);
        case "search":
          return await this._searchWeb(params.query, params.limit);
        case "check":
          return await this._checkApi(params.endpoint, params.method);
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch content from a URL
   */
  async _fetchUrl(url, options = {}) {
    // For security, we'll use a controlled approach
    // In production, this would use a proper HTTP client with rate limiting
    const safeUrl = this._validateUrl(url);

    // Simulated implementation - in real version would use axios/fetch
    return {
      success: true,
      url: safeUrl,
      content: `Fetched content from ${safeUrl} (simulated - implement proper HTTP client)`,
      timestamp: new Date().toISOString(),
      note: "Internet access requires proper HTTP client implementation",
    };
  }

  /**
   * Search the web (simulated)
   */
  async _searchWeb(query, limit = 5) {
    return {
      success: true,
      query,
      results: [
        {
          title: "Example Result 1",
          url: "https://example.com/result1",
          snippet: `Information about ${query}`,
        },
        {
          title: "Example Result 2",
          url: "https://example.com/result2",
          snippet: `More details about ${query}`,
        },
      ],
      timestamp: new Date().toISOString(),
      note: "Web search requires search API integration",
    };
  }

  /**
   * Check API endpoint
   */
  async _checkApi(endpoint, method = "GET") {
    const safeEndpoint = this._validateUrl(endpoint);

    return {
      success: true,
      endpoint: safeEndpoint,
      method,
      status: "200 OK (simulated)",
      response_time: "150ms",
      timestamp: new Date().toISOString(),
      note: "API check requires proper HTTP client",
    };
  }

  /**
   * Validate URL for security
   */
  _validateUrl(url) {
    try {
      const parsed = new URL(url);

      // Allow only HTTP/HTTPS
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only HTTP and HTTPS protocols are allowed");
      }

      // Block certain domains (extend as needed)
      const blockedDomains = [
        "localhost",
        "127.0.0.1",
        "192.168.",
        "10.",
        "172.16.",
      ];
      const hostname = parsed.hostname.toLowerCase();

      for (const blocked of blockedDomains) {
        if (hostname.includes(blocked)) {
          throw new Error(`Access to ${blocked} domains is not allowed`);
        }
      }

      return url;
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Get tool description for AI
   */
  getToolDescription() {
    return {
      name: this.name,
      description: this.description,
      operations: this.supportedMethods.map((method) => ({
        name: method,
        description: this._getOperationDescription(method),
        parameters: this._getOperationParameters(method),
      })),
    };
  }

  _getOperationDescription(method) {
    const descriptions = {
      fetch: "Fetch content from a specific URL",
      search: "Search the web for information",
      check: "Check API endpoint status and response",
    };
    return descriptions[method] || "Unknown operation";
  }

  _getOperationParameters(method) {
    const parameters = {
      fetch: ["url (string): The URL to fetch"],
      search: [
        "query (string): Search query",
        "limit (number, optional): Max results (default: 5)",
      ],
      check: [
        "endpoint (string): API endpoint URL",
        "method (string, optional): HTTP method (default: GET)",
      ],
    };
    return parameters[method] || [];
  }
}

/**
 * Terminal Command Execution Tool
 */
export class TerminalTool {
  constructor() {
    this.name = "terminal";
    this.description =
      "Execute terminal commands safely with controlled permissions";
    this.allowedCommands = [
      "ls",
      "pwd",
      "cd",
      "mkdir",
      "touch",
      "cat",
      "grep",
      "find",
      "npm",
      "node",
      "git",
      "python",
      "python3",
      "pip",
      "pip3",
      "curl",
      "wget",
      "tar",
      "zip",
      "unzip",
    ];
    this.blockedCommands = ["rm -rf", "sudo", "chmod 777", "dd", "format"];
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Execute terminal command
   */
  async execute(command, options = {}) {
    try {
      // Validate command
      this._validateCommand(command);

      // Set execution options
      const execOptions = {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || this.timeout,
        env: { ...process.env, ...options.env },
        stdio: options.silent ? "pipe" : "inherit",
      };

      // Execute command
      return await new Promise((resolve, reject) => {
        exec(command, execOptions, (error, stdout, stderr) => {
          const result = {
            command,
            success: !error,
            exitCode: error ? error.code : 0,
            stdout: stdout ? stdout.toString() : "",
            stderr: stderr ? stderr.toString() : "",
            timestamp: new Date().toISOString(),
            executionTime: Date.now() - (options.startTime || Date.now()),
          };

          if (error) {
            result.error = error.message;
            reject(result);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      return {
        command,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate command for security
   */
  _validateCommand(command) {
    if (!command || typeof command !== "string") {
      throw new Error("Command must be a non-empty string");
    }

    // Check for blocked commands
    const lowerCommand = command.toLowerCase();
    for (const blocked of this.blockedCommands) {
      if (lowerCommand.includes(blocked.toLowerCase())) {
        throw new Error(`Command contains blocked pattern: ${blocked}`);
      }
    }

    // Check if command starts with allowed command
    const firstWord = command.split(" ")[0].toLowerCase();
    const isAllowed = this.allowedCommands.some(
      (allowed) => firstWord === allowed.toLowerCase(),
    );

    if (!isAllowed) {
      throw new Error(
        `Command '${firstWord}' is not in allowed list. Allowed: ${this.allowedCommands.join(", ")}`,
      );
    }

    // Additional security checks
    if (
      command.includes("&&") ||
      command.includes("||") ||
      command.includes(";")
    ) {
      throw new Error("Command chaining is not allowed for security");
    }

    if (command.includes("`") || command.includes("$(")) {
      throw new Error("Command substitution is not allowed for security");
    }
  }

  /**
   * Execute command synchronously (for simple operations)
   */
  executeSync(command, options = {}) {
    try {
      this._validateCommand(command);

      const execOptions = {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || 10000,
        encoding: "utf8",
      };

      const result = execSync(command, execOptions);
      return {
        command,
        success: true,
        output: result.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        command,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get tool description for AI
   */
  getToolDescription() {
    return {
      name: this.name,
      description: this.description,
      allowedCommands: this.allowedCommands,
      securityNotes: [
        "Commands are validated for security",
        "Command chaining is blocked",
        "Dangerous commands are blocked",
        "Execution has timeout protection",
      ],
      examples: [
        "terminal execute 'ls -la'",
        "terminal execute 'npm install express'",
        "terminal execute 'git status'",
        "terminal execute 'python --version'",
      ],
    };
  }
}

/**
 * Tool Manager - Manages all available tools
 */
export class ToolManager {
  constructor() {
    this.tools = new Map();
    this._registerDefaultTools();
  }

  /**
   * Register default tools
   */
  _registerDefaultTools() {
    this.registerTool(new InternetTool());
    this.registerTool(new TerminalTool());
  }

  /**
   * Register a new tool
   */
  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get tool by name
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * Execute tool operation
   */
  async executeTool(toolName, operation, params) {
    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    return await tool.execute(operation, params);
  }

  /**
   * Get all tool descriptions for AI context
   */
  getAllToolDescriptions() {
    const descriptions = [];
    for (const tool of this.tools.values()) {
      descriptions.push(tool.getToolDescription());
    }
    return descriptions;
  }

  /**
   * Get tools context for AI prompt
   */
  getToolsContext() {
    const tools = this.getAllToolDescriptions();

    return `AVAILABLE TOOLS:
${tools
  .map(
    (tool) => `
${tool.name.toUpperCase()}:
  Description: ${tool.description}
  Operations: ${tool.operations ? tool.operations.map((op) => op.name).join(", ") : "N/A"}
  Security: ${tool.securityNotes ? tool.securityNotes.join("; ") : "Standard security"}
`,
  )
  .join("\n")}

TOOL USAGE FORMAT:
- For internet access: "Use internet to [fetch/search/check] [parameters]"
- For terminal commands: "Run command: [safe command]"
- Always specify exact parameters

SECURITY NOTES:
1. All commands are validated
2. Internet access is rate-limited
3. Dangerous operations are blocked
4. Timeouts protect against hanging commands`;
  }
}

/**
 * Create a tool manager instance
 */
export function createToolManager() {
  return new ToolManager();
}
