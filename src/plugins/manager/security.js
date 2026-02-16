// Plugin security and sandboxing

import fs from "fs/promises";
import path from "path";
import os from "os";

export class PluginSecurityManager {
  constructor(config = {}) {
    this.config = config;
    this.permissionRegistry = new Map();
    this.sandboxedPlugins = new Map();

    // Default permission definitions
    this.defineDefaultPermissions();
  }

  defineDefaultPermissions() {
    // File system permissions
    this.registerPermission("file:read", {
      description: "Read files from the file system",
      dangerous: false,
      default: true,
    });

    this.registerPermission("file:write", {
      description: "Write files to the file system",
      dangerous: true,
      default: false,
    });

    this.registerPermission("file:delete", {
      description: "Delete files from the file system",
      dangerous: true,
      default: false,
    });

    // Network permissions
    this.registerPermission("network:http", {
      description: "Make HTTP/HTTPS requests",
      dangerous: true,
      default: false,
    });

    this.registerPermission("network:websocket", {
      description: "Create WebSocket connections",
      dangerous: true,
      default: false,
    });

    // System permissions
    this.registerPermission("system:execute", {
      description: "Execute system commands",
      dangerous: true,
      default: false,
    });

    this.registerPermission("system:env", {
      description: "Access environment variables",
      dangerous: true,
      default: false,
    });

    // AI permissions
    this.registerPermission("ai:generate", {
      description: "Use AI generation capabilities",
      dangerous: false,
      default: true,
    });

    this.registerPermission("ai:chat", {
      description: "Use AI chat capabilities",
      dangerous: false,
      default: true,
    });
  }

  registerPermission(name, definition) {
    this.permissionRegistry.set(name, {
      name,
      ...definition,
    });
  }

  getPermission(name) {
    return this.permissionRegistry.get(name);
  }

  listPermissions() {
    return Array.from(this.permissionRegistry.values());
  }

  // Check if plugin has permission
  hasPermission(pluginId, permissionName, context = {}) {
    const permission = this.getPermission(permissionName);

    if (!permission) {
      // Unknown permission - deny by default
      return false;
    }

    // Check plugin-specific configuration
    const pluginConfig = this.config.plugins?.[pluginId]?.permissions || {};

    if (pluginConfig[permissionName] !== undefined) {
      return pluginConfig[permissionName] === true;
    }

    // Check global configuration
    const globalConfig = this.config.permissions || {};

    if (globalConfig[permissionName] !== undefined) {
      return globalConfig[permissionName] === true;
    }

    // Use default permission setting
    return permission.default === true;
  }

  // Request permission (for interactive approval)
  async requestPermission(pluginId, permissionName, reason = "") {
    const permission = this.getPermission(permissionName);

    if (!permission) {
      throw new Error(`Unknown permission: ${permissionName}`);
    }

    // Check if already granted
    if (this.hasPermission(pluginId, permissionName)) {
      return true;
    }

    // For dangerous permissions, require explicit approval
    if (permission.dangerous) {
      console.warn(
        `\nWarning: Plugin ${pluginId} is requesting dangerous permission:`,
      );
      console.warn(`   Permission: ${permissionName}`);
      console.warn(`   Description: ${permission.description}`);
      if (reason) {
        console.warn(`   Reason: ${reason}`);
      }
      console.warn("");

      // In a real implementation, this would prompt the user
      // For now, we'll log and deny dangerous permissions
      console.warn(
        "   Denied: Dangerous permissions require explicit user approval",
      );
      return false;
    }

    // Grant non-dangerous permissions by default
    return true;
  }

  // Create sandbox for plugin
  createSandbox(pluginId, manifest) {
    const sandbox = {
      id: pluginId,
      manifest,
      permissions: manifest.naturecode?.permissions || [],
      resourceLimits: {
        maxMemory: 100 * 1024 * 1024, // 100MB
        maxExecutionTime: 30000, // 30 seconds
        maxFileSize: 10 * 1024 * 1024, // 10MB
      },
      usage: {
        memory: 0,
        executionTime: 0,
        filesRead: 0,
        filesWritten: 0,
        networkRequests: 0,
      },
      restrictions: {
        allowedPaths: this.getAllowedPaths(pluginId),
        blockedPaths: this.getBlockedPaths(pluginId),
        allowedHosts: this.getAllowedHosts(pluginId),
        blockedHosts: this.getBlockedHosts(pluginId),
      },
    };

    this.sandboxedPlugins.set(pluginId, sandbox);
    return sandbox;
  }

  getAllowedPaths(pluginId) {
    // Get from configuration or use defaults
    const config = this.config.plugins?.[pluginId]?.paths || {};

    return config.allowed || [process.cwd(), path.join(process.cwd(), "**")];
  }

  getBlockedPaths(pluginId) {
    const config = this.config.plugins?.[pluginId]?.paths || {};
    const isWindows = os.platform() === "win32";

    // 平台特定的阻塞路径
    const defaultBlockedPaths = isWindows
      ? [
          "C:\\Windows",
          "C:\\Program Files",
          "C:\\Program Files (x86)",
          "C:\\ProgramData",
          "C:\\System32",
          path.join(process.env.USERPROFILE || "", "AppData", ".*"),
          path.join(process.env.USERPROFILE || "", ".*"), // Hidden files
        ]
      : [
          "/",
          "/etc",
          "/usr",
          "/bin",
          "/sbin",
          "/var",
          path.join(process.env.HOME || "", ".*"), // Hidden files
        ];

    return config.blocked || defaultBlockedPaths;
  }

  getAllowedHosts(pluginId) {
    const config = this.config.plugins?.[pluginId]?.network || {};

    return config.allowedHosts || [];
  }

  getBlockedHosts(pluginId) {
    const config = this.config.plugins?.[pluginId]?.network || {};

    return (
      config.blockedHosts || [
        "localhost",
        "127.0.0.1",
        "192.168.*",
        "10.*",
        "172.16.*",
      ]
    );
  }

  // Check if path is allowed
  isPathAllowed(pluginId, filePath) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return false;
    }

    const resolvedPath = path.resolve(filePath);

    // Check blocked paths first (higher priority)
    for (const blockedPattern of sandbox.restrictions.blockedPaths) {
      if (this.matchesPattern(resolvedPath, blockedPattern)) {
        return false;
      }
    }

    // Check allowed paths
    for (const allowedPattern of sandbox.restrictions.allowedPaths) {
      if (this.matchesPattern(resolvedPath, allowedPattern)) {
        return true;
      }
    }

    // If no allowed paths match, deny
    return false;
  }

  // Check if host is allowed
  isHostAllowed(pluginId, host) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return false;
    }

    // Check blocked hosts first
    for (const blockedPattern of sandbox.restrictions.blockedHosts) {
      if (this.matchesPattern(host, blockedPattern)) {
        return false;
      }
    }

    // Check allowed hosts
    if (sandbox.restrictions.allowedHosts.length === 0) {
      // If no allowed hosts specified, allow all (except blocked)
      return true;
    }

    for (const allowedPattern of sandbox.restrictions.allowedHosts) {
      if (this.matchesPattern(host, allowedPattern)) {
        return true;
      }
    }

    return false;
  }

  // Pattern matching with wildcards
  matchesPattern(input, pattern) {
    if (pattern === input) {
      return true;
    }

    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(input);
  }

  // Track resource usage
  trackMemoryUsage(pluginId, bytes) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return;
    }

    sandbox.usage.memory += bytes;

    // Check limit
    if (sandbox.usage.memory > sandbox.resourceLimits.maxMemory) {
      throw new Error(`Memory limit exceeded for plugin ${pluginId}`);
    }
  }

  trackExecutionTime(pluginId, milliseconds) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return;
    }

    sandbox.usage.executionTime += milliseconds;

    // Check limit
    if (sandbox.usage.executionTime > sandbox.resourceLimits.maxExecutionTime) {
      throw new Error(`Execution time limit exceeded for plugin ${pluginId}`);
    }
  }

  trackFileRead(pluginId) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return;
    }

    sandbox.usage.filesRead++;
  }

  trackFileWrite(pluginId) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return;
    }

    sandbox.usage.filesWritten++;
  }

  trackNetworkRequest(pluginId) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return;
    }

    sandbox.usage.networkRequests++;
  }

  // Get sandbox statistics
  getSandboxStats(pluginId) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return null;
    }

    return {
      ...sandbox.usage,
      limits: sandbox.resourceLimits,
    };
  }

  // Reset sandbox
  resetSandbox(pluginId) {
    const sandbox = this.sandboxedPlugins.get(pluginId);

    if (!sandbox) {
      return;
    }

    sandbox.usage = {
      memory: 0,
      executionTime: 0,
      filesRead: 0,
      filesWritten: 0,
      networkRequests: 0,
    };
  }

  // Remove sandbox
  removeSandbox(pluginId) {
    this.sandboxedPlugins.delete(pluginId);
  }

  // Validate plugin manifest for security
  validateManifestSecurity(manifest) {
    const issues = [];

    // Check for required fields
    if (!manifest.name) {
      issues.push("Missing plugin name");
    }

    if (!manifest.version) {
      issues.push("Missing plugin version");
    }

    // Check version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      issues.push("Invalid version format. Use semantic versioning (x.y.z)");
    }

    // Check permissions
    const permissions = manifest.naturecode?.permissions || [];
    const validPermissions = this.listPermissions().map((p) => p.name);

    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        issues.push(`Unknown permission: ${permission}`);
      }
    }

    // Check for dangerous permissions
    const dangerousPermissions = permissions.filter((p) => {
      const perm = this.getPermission(p);
      return perm?.dangerous;
    });

    if (dangerousPermissions.length > 0) {
      issues.push(
        `Plugin requests dangerous permissions: ${dangerousPermissions.join(", ")}`,
      );
    }

    // Check dependencies (basic validation)
    if (manifest.dependencies && typeof manifest.dependencies !== "object") {
      issues.push("Dependencies must be an object");
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings:
        dangerousPermissions.length > 0
          ? ["Plugin requests dangerous permissions"]
          : [],
    };
  }
}
