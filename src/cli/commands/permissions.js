// Permissions and audit logging CLI commands

import { Command } from "commander";
import { PermissionManager } from "../../utils/team/permissions.js";
import fs from "fs";
import path from "path";

export function createPermissionsCommand() {
  const permissionsCommand = new Command("permissions")
    .description("Role-based access control and audit logging")
    .configureHelp({ showGlobalOptions: true });

  let permissionManager = null;

  const getManager = async () => {
    if (!permissionManager) {
      permissionManager = new PermissionManager();
      await permissionManager.initialize();
    }
    return permissionManager;
  };

  // Role Management
  permissionsCommand
    .command("role:create")
    .description("Create a new role")
    .requiredOption("-n, --name <name>", "Role name")
    .option("-d, --description <description>", "Role description")
    .option("--permissions <permissions>", "Comma-separated permissions")
    .option("--level <level>", "Role level (0-100)", "50")
    .option("--created-by <createdBy>", "Created by user", "system")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const permissions = options.permissions
          ? options.permissions.split(",").map((p) => p.trim())
          : [];

        const role = await manager.createRole({
          name: options.name,
          description: options.description || "",
          permissions,
          level: parseInt(options.level),
          createdBy: options.createdBy,
        });

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Role "${options.name}" created successfully`,
              role,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("role:list")
    .description("List all roles")
    .action(async () => {
      try {
        const manager = await getManager();
        const roles = manager.listRoles();

        console.log("Available Roles:");
        console.log("================");

        roles.forEach((role) => {
          console.log(`\n${role.name} (${role.id}):`);
          console.log(`  Description: ${role.description}`);
          console.log(`  Level: ${role.level}`);
          console.log(`  Permissions: ${role.permissions.length}`);
          if (role.permissions.length > 0) {
            role.permissions.forEach((permission) => {
              console.log(`    - ${permission}`);
            });
          }
        });
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("role:info")
    .description("Get role information")
    .requiredOption("-i, --role-id <roleId>", "Role ID")
    .action(async (options) => {
      try {
        const manager = await getManager();
        const role = manager.getRole(options.roleId);

        if (!role) {
          console.error(`Role "${options.roleId}" not found`);
          process.exit(1);
        }

        console.log(
          JSON.stringify(
            {
              success: true,
              role,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("role:update")
    .description("Update a role")
    .requiredOption("-i, --role-id <roleId>", "Role ID")
    .option("-n, --name <name>", "New role name")
    .option("-d, --description <description>", "New description")
    .option("--permissions <permissions>", "Comma-separated permissions")
    .option("--level <level>", "New role level")
    .option("--updated-by <updatedBy>", "Updated by user", "system")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const updates = {};
        if (options.name) updates.name = options.name;
        if (options.description) updates.description = options.description;
        if (options.permissions) {
          updates.permissions = options.permissions
            .split(",")
            .map((p) => p.trim());
        }
        if (options.level) updates.level = parseInt(options.level);
        updates.updatedBy = options.updatedBy;

        const role = await manager.updateRole(options.roleId, updates);

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Role "${options.roleId}" updated successfully`,
              role,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("role:delete")
    .description("Delete a role")
    .requiredOption("-i, --role-id <roleId>", "Role ID")
    .option("--deleted-by <deletedBy>", "Deleted by user", "system")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const deleted = await manager.deleteRole(
          options.roleId,
          options.deletedBy,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Role "${options.roleId}" deleted successfully`,
              deleted,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Policy Management
  permissionsCommand
    .command("policy:create")
    .description("Create a new policy")
    .requiredOption("-n, --name <name>", "Policy name")
    .requiredOption("-r, --resource <resource>", "Resource type")
    .requiredOption("-a, --action <action>", "Action")
    .option("-d, --description <description>", "Policy description")
    .option("--conditions <conditions>", "Comma-separated conditions")
    .option("--created-by <createdBy>", "Created by user", "system")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const conditions = options.conditions
          ? options.conditions.split(",").map((c) => c.trim())
          : [];

        const policy = await manager.createPolicy({
          name: options.name,
          description: options.description || "",
          resource: options.resource,
          action: options.action,
          conditions,
          createdBy: options.createdBy,
        });

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Policy "${options.name}" created successfully`,
              policy,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("policy:list")
    .description("List policies")
    .option("-r, --resource <resource>", "Filter by resource type")
    .action(async (options) => {
      try {
        const manager = await getManager();
        const policies = manager.listPolicies(options.resource);

        console.log("Policies:");
        console.log("=========");

        if (options.resource) {
          console.log(`Resource: ${options.resource}`);
        }

        policies.forEach((policy) => {
          console.log(`\n${policy.name} (${policy.id}):`);
          console.log(`  Resource: ${policy.resource}`);
          console.log(`  Action: ${policy.action}`);
          console.log(`  Description: ${policy.description}`);
          console.log(`  Conditions: ${policy.conditions.length}`);
          if (policy.conditions.length > 0) {
            policy.conditions.forEach((condition) => {
              console.log(`    - ${condition}`);
            });
          }
        });
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Permission Checking
  permissionsCommand
    .command("check")
    .description("Check if a user has permission")
    .requiredOption("-u, --user <user>", "User ID")
    .requiredOption("-r, --resource <resource>", "Resource type")
    .requiredOption("-a, --action <action>", "Action")
    .option("--user-roles <roles>", "Comma-separated user roles")
    .option("--resource-id <resourceId>", "Resource ID")
    .option("--context <context>", "Context JSON string")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const user = {
          id: options.user,
          roles: options.userRoles
            ? options.userRoles.split(",").map((r) => r.trim())
            : [],
        };

        const resource = options.resourceId ? { id: options.resourceId } : null;
        const context = options.context ? JSON.parse(options.context) : {};

        const result = await manager.checkPermission(
          user,
          options.resource,
          options.action,
          resource,
          context,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              permissionCheck: {
                user: options.user,
                resource: options.resource,
                action: options.action,
                resourceId: options.resourceId,
                allowed: result.allowed,
                reason: result.reason,
              },
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Audit Logging
  permissionsCommand
    .command("audit:log")
    .description("Log an audit event")
    .requiredOption("-a, --action <action>", "Action performed")
    .requiredOption("-t, --resource-type <resourceType>", "Resource type")
    .requiredOption("-i, --resource-id <resourceId>", "Resource ID")
    .requiredOption("-u, --user-id <userId>", "User ID")
    .option("-d, --details <details>", "Details JSON string")
    .option("--user-ip <userIp>", "User IP address")
    .option("--user-agent <userAgent>", "User agent")
    .option("--session-id <sessionId>", "Session ID")
    .option("--request-id <requestId>", "Request ID")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const details = options.details ? JSON.parse(options.details) : {};

        const auditLog = await manager.logAudit({
          action: options.action,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          userId: options.userId,
          userIp: options.userIp,
          userAgent: options.userAgent,
          details,
          sessionId: options.sessionId,
          requestId: options.requestId,
        });

        console.log(
          JSON.stringify(
            {
              success: true,
              message: "Audit event logged successfully",
              auditLog,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("audit:list")
    .description("List audit logs")
    .option("-s, --start-date <startDate>", "Start date (YYYY-MM-DD)")
    .option("-e, --end-date <endDate>", "End date (YYYY-MM-DD)")
    .option("-u, --user-id <userId>", "Filter by user ID")
    .option("-a, --action <action>", "Filter by action")
    .option("-t, --resource-type <resourceType>", "Filter by resource type")
    .option("-i, --resource-id <resourceId>", "Filter by resource ID")
    .option("-l, --limit <limit>", "Limit results", "100")
    .option("-o, --offset <offset>", "Offset for pagination", "0")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const filters = {
          startDate: options.startDate,
          endDate: options.endDate,
          userId: options.userId,
          action: options.action,
          resourceType: options.resourceType,
          resourceId: options.resourceId,
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        };

        const result = await manager.getAuditLogs(filters);

        console.log(
          JSON.stringify(
            {
              success: true,
              auditLogs: result.logs,
              pagination: {
                total: result.total,
                limit: result.limit,
                offset: result.offset,
              },
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  permissionsCommand
    .command("audit:search")
    .description("Search audit logs")
    .requiredOption("-q, --query <query>", "Search query")
    .option("-s, --start-date <startDate>", "Start date (YYYY-MM-DD)")
    .option("-e, --end-date <endDate>", "End date (YYYY-MM-DD)")
    .option("-u, --user-id <userId>", "Filter by user ID")
    .option("-l, --limit <limit>", "Limit results", "100")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const filters = {
          startDate: options.startDate,
          endDate: options.endDate,
          userId: options.userId,
          limit: parseInt(options.limit),
        };

        const result = await manager.searchAuditLogs(options.query, filters);

        console.log(
          JSON.stringify(
            {
              success: true,
              query: options.query,
              auditLogs: result.logs,
              total: result.total,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Permission Analysis
  permissionsCommand
    .command("analyze")
    .description("Analyze user permissions")
    .requiredOption("-u, --user <user>", "User ID")
    .option("--user-roles <roles>", "Comma-separated user roles")
    .option("-r, --resource <resource>", "Resource type to analyze")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const user = {
          id: options.user,
          roles: options.userRoles
            ? options.userRoles.split(",").map((r) => r.trim())
            : [],
        };

        const analysis = await manager.analyzePermissions(
          user,
          options.resource,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              analysis,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Compliance Reporting
  permissionsCommand
    .command("report:compliance")
    .description("Generate compliance report")
    .option("-s, --start-date <startDate>", "Start date (YYYY-MM-DD)")
    .option("-e, --end-date <endDate>", "End date (YYYY-MM-DD)")
    .option("-u, --user-id <userId>", "Filter by user ID")
    .option("-a, --action <action>", "Filter by action")
    .action(async (options) => {
      try {
        const manager = await getManager();

        const filters = {
          startDate: options.startDate,
          endDate: options.endDate,
          userId: options.userId,
          action: options.action,
        };

        const report = await manager.generateComplianceReport(filters);

        console.log(
          JSON.stringify(
            {
              success: true,
              report,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Help command
  permissionsCommand
    .command("help")
    .description("Show permissions command help")
    .action(() => {
      console.log("NatureCode Permissions and Audit Logging Commands");
      console.log("==================================================");
      console.log("");
      console.log("Role Management:");
      console.log("  permissions role:create     - Create a new role");
      console.log("  permissions role:list       - List all roles");
      console.log("  permissions role:info       - Get role information");
      console.log("  permissions role:update     - Update a role");
      console.log("  permissions role:delete     - Delete a role");
      console.log("");
      console.log("Policy Management:");
      console.log("  permissions policy:create   - Create a new policy");
      console.log("  permissions policy:list     - List policies");
      console.log("");
      console.log("Permission Checking:");
      console.log(
        "  permissions check           - Check if user has permission",
      );
      console.log("");
      console.log("Audit Logging:");
      console.log("  permissions audit:log       - Log an audit event");
      console.log("  permissions audit:list      - List audit logs");
      console.log("  permissions audit:search    - Search audit logs");
      console.log("");
      console.log("Analysis:");
      console.log("  permissions analyze         - Analyze user permissions");
      console.log(
        "  permissions report:compliance - Generate compliance report",
      );
      console.log("");
      console.log("Examples:");
      console.log(
        '  naturecode permissions role:create --name "Developer" --permissions "project:view,task:create"',
      );
      console.log(
        '  naturecode permissions check --user "user@example.com" --resource "project" --action "create"',
      );
      console.log(
        '  naturecode permissions audit:log --action "project:create" --resource-type "project" --resource-id "proj_123" --user-id "admin@example.com"',
      );
      console.log(
        '  naturecode permissions analyze --user "user@example.com" --resource "project"',
      );
    });

  return permissionsCommand;
}
