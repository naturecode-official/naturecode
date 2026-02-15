// Role-Based Access Control (RBAC) and audit logging for team collaboration

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export class PermissionManager {
  constructor(config = {}) {
    this.config = {
      auditLogDir: ".naturecode/team/audit",
      rolesFile: ".naturecode/team/roles.json",
      policiesFile: ".naturecode/team/policies.json",
      ...config,
    };

    this.roles = new Map(); // roleId -> Role
    this.policies = new Map(); // resourceType -> Policy[]
    this.auditLogs = new Map(); // logId -> AuditLog

    // Default roles
    this.defaultRoles = {
      owner: {
        id: "owner",
        name: "Owner",
        description: "Full access to all resources",
        permissions: ["*"],
        level: 100,
      },
      admin: {
        id: "admin",
        name: "Administrator",
        description: "Administrative access",
        permissions: [
          "project:create",
          "project:update",
          "project:delete",
          "project:add-member",
          "project:remove-member",
          "task:create",
          "task:update",
          "task:delete",
          "team:create",
          "team:update",
          "team:delete",
          "team:invite",
          "member:view",
          "member:update",
          "analytics:view",
          "audit:view",
        ],
        level: 90,
      },
      member: {
        id: "member",
        name: "Member",
        description: "Standard team member",
        permissions: [
          "project:view",
          "task:create",
          "task:update:own",
          "task:view",
          "team:view",
          "member:view",
          "analytics:view:own",
        ],
        level: 50,
      },
      viewer: {
        id: "viewer",
        name: "Viewer",
        description: "Read-only access",
        permissions: ["project:view", "task:view", "team:view", "member:view"],
        level: 10,
      },
    };

    // Default policies
    this.defaultPolicies = {
      project: [
        {
          id: "project:create",
          name: "Create Project",
          description: "Create new projects",
          resource: "project",
          action: "create",
          conditions: [],
        },
        {
          id: "project:view",
          name: "View Project",
          description: "View project details",
          resource: "project",
          action: "read",
          conditions: ["isMember"],
        },
        {
          id: "project:update",
          name: "Update Project",
          description: "Update project information",
          resource: "project",
          action: "update",
          conditions: ["isOwner", "isAdmin"],
        },
        {
          id: "project:delete",
          name: "Delete Project",
          description: "Delete project",
          resource: "project",
          action: "delete",
          conditions: ["isOwner"],
        },
        {
          id: "project:add-member",
          name: "Add Project Member",
          description: "Add members to project",
          resource: "project",
          action: "addMember",
          conditions: ["isOwner", "isAdmin"],
        },
        {
          id: "project:remove-member",
          name: "Remove Project Member",
          description: "Remove members from project",
          resource: "project",
          action: "removeMember",
          conditions: ["isOwner", "isAdmin"],
        },
      ],
      task: [
        {
          id: "task:create",
          name: "Create Task",
          description: "Create new tasks",
          resource: "task",
          action: "create",
          conditions: ["isMember"],
        },
        {
          id: "task:view",
          name: "View Task",
          description: "View task details",
          resource: "task",
          action: "read",
          conditions: ["isMember"],
        },
        {
          id: "task:update",
          name: "Update Task",
          description: "Update any task",
          resource: "task",
          action: "update",
          conditions: ["isOwner", "isAdmin"],
        },
        {
          id: "task:update:own",
          name: "Update Own Task",
          description: "Update own tasks",
          resource: "task",
          action: "update",
          conditions: ["isAssignee", "isReporter"],
        },
        {
          id: "task:delete",
          name: "Delete Task",
          description: "Delete tasks",
          resource: "task",
          action: "delete",
          conditions: ["isOwner", "isAdmin"],
        },
      ],
      team: [
        {
          id: "team:create",
          name: "Create Team",
          description: "Create new teams",
          resource: "team",
          action: "create",
          conditions: [],
        },
        {
          id: "team:view",
          name: "View Team",
          description: "View team details",
          resource: "team",
          action: "read",
          conditions: ["isMember"],
        },
        {
          id: "team:update",
          name: "Update Team",
          description: "Update team information",
          resource: "team",
          action: "update",
          conditions: ["isOwner", "isAdmin"],
        },
        {
          id: "team:delete",
          name: "Delete Team",
          description: "Delete team",
          resource: "team",
          action: "delete",
          conditions: ["isOwner"],
        },
        {
          id: "team:invite",
          name: "Invite to Team",
          description: "Invite members to team",
          resource: "team",
          action: "invite",
          conditions: ["isOwner", "isAdmin"],
        },
      ],
      member: [
        {
          id: "member:view",
          name: "View Member",
          description: "View member profiles",
          resource: "member",
          action: "read",
          conditions: ["isMember"],
        },
        {
          id: "member:update",
          name: "Update Member",
          description: "Update member information",
          resource: "member",
          action: "update",
          conditions: ["isSelf", "isOwner", "isAdmin"],
        },
      ],
      analytics: [
        {
          id: "analytics:view",
          name: "View Analytics",
          description: "View all analytics",
          resource: "analytics",
          action: "read",
          conditions: ["isOwner", "isAdmin"],
        },
        {
          id: "analytics:view:own",
          name: "View Own Analytics",
          description: "View own analytics",
          resource: "analytics",
          action: "read",
          conditions: ["isSelf"],
        },
      ],
      audit: [
        {
          id: "audit:view",
          name: "View Audit Logs",
          description: "View audit logs",
          resource: "audit",
          action: "read",
          conditions: ["isOwner", "isAdmin"],
        },
      ],
    };
  }

  async initialize() {
    try {
      // Ensure directories exist
      await fs.mkdir(this.config.auditLogDir, { recursive: true });

      // Load or create default roles
      await this.loadRoles();

      // Load or create default policies
      await this.loadPolicies();

      return true;
    } catch (error) {
      console.error("Failed to initialize permission manager:", error);
      throw error;
    }
  }

  async loadRoles() {
    try {
      const rolesPath = path.resolve(this.config.rolesFile);
      if (await this.fileExists(rolesPath)) {
        const data = await fs.readFile(rolesPath, "utf8");
        const roles = JSON.parse(data);

        for (const role of roles) {
          this.roles.set(role.id, role);
        }
      } else {
        // Create default roles
        for (const [roleId, role] of Object.entries(this.defaultRoles)) {
          this.roles.set(roleId, role);
        }
        await this.saveRoles();
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
      // Fall back to default roles
      for (const [roleId, role] of Object.entries(this.defaultRoles)) {
        this.roles.set(roleId, role);
      }
    }
  }

  async saveRoles() {
    try {
      const rolesPath = path.resolve(this.config.rolesFile);
      const roles = Array.from(this.roles.values());
      await fs.writeFile(rolesPath, JSON.stringify(roles, null, 2));
    } catch (error) {
      console.error("Failed to save roles:", error);
      throw error;
    }
  }

  async loadPolicies() {
    try {
      const policiesPath = path.resolve(this.config.policiesFile);
      if (await this.fileExists(policiesPath)) {
        const data = await fs.readFile(policiesPath, "utf8");
        const policies = JSON.parse(data);

        for (const policy of policies) {
          if (!this.policies.has(policy.resource)) {
            this.policies.set(policy.resource, []);
          }
          this.policies.get(policy.resource).push(policy);
        }
      } else {
        // Create default policies
        for (const [resource, resourcePolicies] of Object.entries(
          this.defaultPolicies,
        )) {
          this.policies.set(resource, resourcePolicies);
        }
        await this.savePolicies();
      }
    } catch (error) {
      console.error("Failed to load policies:", error);
      // Fall back to default policies
      for (const [resource, resourcePolicies] of Object.entries(
        this.defaultPolicies,
      )) {
        this.policies.set(resource, resourcePolicies);
      }
    }
  }

  async savePolicies() {
    try {
      const policiesPath = path.resolve(this.config.policiesFile);
      const allPolicies = [];

      for (const [resource, resourcePolicies] of this.policies) {
        allPolicies.push(...resourcePolicies);
      }

      await fs.writeFile(policiesPath, JSON.stringify(allPolicies, null, 2));
    } catch (error) {
      console.error("Failed to save policies:", error);
      throw error;
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

  // Role Management

  async createRole(roleData) {
    const roleId = roleData.id || this.generateId("role");

    const role = {
      id: roleId,
      name: roleData.name,
      description: roleData.description || "",
      permissions: roleData.permissions || [],
      level: roleData.level || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.roles.set(roleId, role);
    await this.saveRoles();

    // Log role creation
    await this.logAudit({
      action: "role:create",
      resourceType: "role",
      resourceId: roleId,
      userId: roleData.createdBy || "system",
      details: { role },
    });

    return role;
  }

  async updateRole(roleId, updates) {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    Object.assign(role, updates, {
      updatedAt: new Date().toISOString(),
    });

    this.roles.set(roleId, role);
    await this.saveRoles();

    // Log role update
    await this.logAudit({
      action: "role:update",
      resourceType: "role",
      resourceId: roleId,
      userId: updates.updatedBy || "system",
      details: { updates },
    });

    return role;
  }

  async deleteRole(roleId, deletedBy = "system") {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    this.roles.delete(roleId);
    await this.saveRoles();

    // Log role deletion
    await this.logAudit({
      action: "role:delete",
      resourceType: "role",
      resourceId: roleId,
      userId: deletedBy,
      details: { role },
    });

    return true;
  }

  getRole(roleId) {
    return this.roles.get(roleId);
  }

  listRoles() {
    return Array.from(this.roles.values());
  }

  // Policy Management

  async createPolicy(policyData) {
    const policyId = policyData.id || this.generateId("policy");

    const policy = {
      id: policyId,
      name: policyData.name,
      description: policyData.description || "",
      resource: policyData.resource,
      action: policyData.action,
      conditions: policyData.conditions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.policies.has(policy.resource)) {
      this.policies.set(policy.resource, []);
    }

    this.policies.get(policy.resource).push(policy);
    await this.savePolicies();

    // Log policy creation
    await this.logAudit({
      action: "policy:create",
      resourceType: "policy",
      resourceId: policyId,
      userId: policyData.createdBy || "system",
      details: { policy },
    });

    return policy;
  }

  async updatePolicy(policyId, updates) {
    let foundPolicy = null;
    let resourceType = null;

    // Find the policy
    for (const [resource, policies] of this.policies) {
      const policy = policies.find((p) => p.id === policyId);
      if (policy) {
        foundPolicy = policy;
        resourceType = resource;
        break;
      }
    }

    if (!foundPolicy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    Object.assign(foundPolicy, updates, {
      updatedAt: new Date().toISOString(),
    });

    await this.savePolicies();

    // Log policy update
    await this.logAudit({
      action: "policy:update",
      resourceType: "policy",
      resourceId: policyId,
      userId: updates.updatedBy || "system",
      details: { updates },
    });

    return foundPolicy;
  }

  async deletePolicy(policyId, deletedBy = "system") {
    let foundPolicy = null;
    let resourceType = null;

    // Find the policy
    for (const [resource, policies] of this.policies) {
      const policyIndex = policies.findIndex((p) => p.id === policyId);
      if (policyIndex !== -1) {
        foundPolicy = policies[policyIndex];
        resourceType = resource;
        policies.splice(policyIndex, 1);
        break;
      }
    }

    if (!foundPolicy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    await this.savePolicies();

    // Log policy deletion
    await this.logAudit({
      action: "policy:delete",
      resourceType: "policy",
      resourceId: policyId,
      userId: deletedBy,
      details: { policy: foundPolicy },
    });

    return true;
  }

  getPolicy(policyId) {
    for (const policies of this.policies.values()) {
      const policy = policies.find((p) => p.id === policyId);
      if (policy) return policy;
    }
    return null;
  }

  listPolicies(resource = null) {
    if (resource) {
      return this.policies.get(resource) || [];
    }

    const allPolicies = [];
    for (const policies of this.policies.values()) {
      allPolicies.push(...policies);
    }
    return allPolicies;
  }

  // Permission Checking

  async checkPermission(
    user,
    resourceType,
    action,
    resource = null,
    context = {},
  ) {
    // Get user's roles
    const userRoles = user.roles || [];

    // Check each role for permission
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (!role) continue;

      // Check for wildcard permission
      if (role.permissions.includes("*")) {
        return { allowed: true, reason: "Wildcard permission" };
      }

      // Check for specific permission
      const permission = `${resourceType}:${action}`;
      if (role.permissions.includes(permission)) {
        // Check conditions if any
        const policies = this.policies.get(resourceType) || [];
        const policy = policies.find((p) => p.id === permission);

        if (policy && policy.conditions.length > 0) {
          const conditionsMet = await this.checkConditions(
            policy.conditions,
            user,
            resource,
            context,
          );
          if (conditionsMet) {
            return {
              allowed: true,
              reason: `Permission granted by role ${role.name}`,
            };
          }
        } else {
          return {
            allowed: true,
            reason: `Permission granted by role ${role.name}`,
          };
        }
      }
    }

    return { allowed: false, reason: "No matching permission found" };
  }

  async checkConditions(conditions, user, resource, context) {
    for (const condition of conditions) {
      const conditionMet = await this.evaluateCondition(
        condition,
        user,
        resource,
        context,
      );
      if (!conditionMet) {
        return false;
      }
    }
    return true;
  }

  async evaluateCondition(condition, user, resource, context) {
    switch (condition) {
      case "isOwner":
        return resource && resource.ownerId === user.id;

      case "isAdmin":
        return user.roles && user.roles.includes("admin");

      case "isMember":
        return (
          resource &&
          resource.members &&
          resource.members.some((m) => m.memberId === user.id)
        );

      case "isSelf":
        return resource && resource.id === user.id;

      case "isAssignee":
        return resource && resource.assigneeId === user.id;

      case "isReporter":
        return resource && resource.reporterId === user.id;

      case "hasTeamAccess":
        return (
          context.teamId && user.teams && user.teams.includes(context.teamId)
        );

      case "hasProjectAccess":
        return (
          context.projectId &&
          user.projects &&
          user.projects.includes(context.projectId)
        );

      default:
        // Custom condition - could be a function or rule
        if (context.customConditions && context.customConditions[condition]) {
          return context.customConditions[condition](user, resource, context);
        }
        return false;
    }
  }

  // Audit Logging

  async logAudit(logData) {
    const logId = this.generateId("audit");
    const timestamp = new Date().toISOString();

    const auditLog = {
      id: logId,
      action: logData.action,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId,
      userId: logData.userId,
      userIp: logData.userIp || null,
      userAgent: logData.userAgent || null,
      details: logData.details || {},
      timestamp,
      metadata: {
        sessionId: logData.sessionId || null,
        requestId: logData.requestId || null,
        ...logData.metadata,
      },
    };

    // Store in memory
    this.auditLogs.set(logId, auditLog);

    // Save to file
    await this.saveAuditLog(auditLog);

    return auditLog;
  }

  async saveAuditLog(auditLog) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      const logDir = path.join(this.config.auditLogDir, String(year), month);
      await fs.mkdir(logDir, { recursive: true });

      const logFile = path.join(logDir, `${day}.json`);

      let logs = [];
      if (await this.fileExists(logFile)) {
        const data = await fs.readFile(logFile, "utf8");
        logs = JSON.parse(data);
      }

      logs.push(auditLog);
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error("Failed to save audit log:", error);
      // Don't throw - audit logging should not break the application
    }
  }

  async getAuditLogs(filters = {}) {
    const {
      startDate,
      endDate,
      userId,
      action,
      resourceType,
      resourceId,
      limit = 100,
      offset = 0,
    } = filters;

    // In a real implementation, you would query from database
    // For now, we'll return from memory
    let logs = Array.from(this.auditLogs.values());

    // Apply filters
    if (startDate) {
      const start = new Date(startDate);
      logs = logs.filter((log) => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      logs = logs.filter((log) => new Date(log.timestamp) <= end);
    }

    if (userId) {
      logs = logs.filter((log) => log.userId === userId);
    }

    if (action) {
      logs = logs.filter((log) => log.action === action);
    }

    if (resourceType) {
      logs = logs.filter((log) => log.resourceType === resourceType);
    }

    if (resourceId) {
      logs = logs.filter((log) => log.resourceId === resourceId);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total: logs.length,
      limit,
      offset,
    };
  }

  async getAuditLog(logId) {
    return this.auditLogs.get(logId);
  }

  async searchAuditLogs(query, filters = {}) {
    const logs = await this.getAuditLogs(filters);

    if (!query) {
      return logs;
    }

    const searchTerm = query.toLowerCase();
    const filteredLogs = logs.logs.filter((log) => {
      return (
        (log.action && log.action.toLowerCase().includes(searchTerm)) ||
        (log.resourceType &&
          log.resourceType.toLowerCase().includes(searchTerm)) ||
        (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm)) ||
        (log.userId && log.userId.toLowerCase().includes(searchTerm)) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm)
      );
    });

    return {
      logs: filteredLogs,
      total: filteredLogs.length,
      limit: logs.limit,
      offset: logs.offset,
    };
  }

  // Utility Methods

  generateId(prefix) {
    const random = crypto.randomBytes(6).toString("hex");
    return `${prefix}_${random}`;
  }

  // Role Assignment

  async assignRoleToMember(memberId, roleId, assignedBy = "system") {
    // In a real implementation, you would update the member's roles
    // For now, we'll just log the assignment

    await this.logAudit({
      action: "role:assign",
      resourceType: "member",
      resourceId: memberId,
      userId: assignedBy,
      details: {
        memberId,
        roleId,
        assignedBy,
      },
    });

    return true;
  }

  async removeRoleFromMember(memberId, roleId, removedBy = "system") {
    // In a real implementation, you would update the member's roles
    // For now, we'll just log the removal

    await this.logAudit({
      action: "role:remove",
      resourceType: "member",
      resourceId: memberId,
      userId: removedBy,
      details: {
        memberId,
        roleId,
        removedBy,
      },
    });

    return true;
  }

  // Permission Analysis

  async analyzePermissions(user, resourceType = null) {
    const userRoles = user.roles || [];
    const analysis = {
      user: {
        id: user.id,
        roles: userRoles,
      },
      effectivePermissions: [],
      rolePermissions: {},
      resourcePermissions: {},
    };

    // Analyze each role
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (!role) continue;

      analysis.rolePermissions[roleId] = {
        name: role.name,
        permissions: role.permissions,
        level: role.level,
      };

      // Add to effective permissions
      for (const permission of role.permissions) {
        if (permission === "*") {
          analysis.effectivePermissions.push("*");
          break;
        }

        if (!analysis.effectivePermissions.includes(permission)) {
          analysis.effectivePermissions.push(permission);
        }
      }
    }

    // Analyze by resource type if specified
    if (resourceType) {
      const policies = this.policies.get(resourceType) || [];
      analysis.resourcePermissions[resourceType] = [];

      for (const policy of policies) {
        const hasPermission =
          analysis.effectivePermissions.includes(policy.id) ||
          analysis.effectivePermissions.includes("*");

        analysis.resourcePermissions[resourceType].push({
          policy: policy.id,
          name: policy.name,
          hasPermission,
          conditions: policy.conditions,
        });
      }
    }

    return analysis;
  }

  // Compliance and Reporting

  async generateComplianceReport(filters = {}) {
    const auditLogs = await this.getAuditLogs(filters);

    const report = {
      generatedAt: new Date().toISOString(),
      filters,
      summary: {
        totalActions: auditLogs.total,
        uniqueUsers: new Set(auditLogs.logs.map((log) => log.userId)).size,
        resourceTypes: new Set(auditLogs.logs.map((log) => log.resourceType)),
        timeRange: {
          start:
            auditLogs.logs.length > 0
              ? auditLogs.logs[auditLogs.logs.length - 1].timestamp
              : null,
          end: auditLogs.logs.length > 0 ? auditLogs.logs[0].timestamp : null,
        },
      },
      actionsByType: {},
      usersByActivity: {},
      resourcesByAccess: {},
    };

    // Count actions by type
    for (const log of auditLogs.logs) {
      report.actionsByType[log.action] =
        (report.actionsByType[log.action] || 0) + 1;

      report.usersByActivity[log.userId] =
        (report.usersByActivity[log.userId] || 0) + 1;

      const resourceKey = `${log.resourceType}:${log.resourceId}`;
      report.resourcesByAccess[resourceKey] =
        (report.resourcesByAccess[resourceKey] || 0) + 1;
    }

    // Find top activities
    report.topActions = Object.entries(report.actionsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    report.topUsers = Object.entries(report.usersByActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    report.topResources = Object.entries(report.resourcesByAccess)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    // Check for suspicious activities
    report.suspiciousActivities = auditLogs.logs.filter((log) => {
      // Define suspicious patterns
      const suspiciousPatterns = [
        "failed login",
        "permission denied",
        "unauthorized access",
        "role:delete",
        "policy:delete",
        "mass deletion",
      ];

      return suspiciousPatterns.some(
        (pattern) =>
          log.action.toLowerCase().includes(pattern) ||
          JSON.stringify(log.details).toLowerCase().includes(pattern),
      );
    });

    return report;
  }
}
