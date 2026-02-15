// Session management CLI commands

import { SessionManager } from "../../sessions/manager/index.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSessionCommand (options) {
  const { command, ...args } = options;

  // Initialize session manager
  const sessionManager = new SessionManager();

  // Execute command
  switch (command) {
  case "list":
    return await handleListCommand(sessionManager, args);
  case "info":
    return await handleInfoCommand(sessionManager, args);
  case "create":
    return await handleCreateCommand(sessionManager, args);
  case "switch":
    return await handleSwitchCommand(sessionManager, args);
  case "archive":
    return await handleArchiveCommand(sessionManager, args);
  case "restore":
    return await handleRestoreCommand(sessionManager, args);
  case "delete":
    return await handleDeleteCommand(sessionManager, args);
  case "rename":
    return await handleRenameCommand(sessionManager, args);
  case "tag":
    return await handleTagCommand(sessionManager, args);
  case "export":
    return await handleExportCommand(sessionManager, args);
  case "import":
    return await handleImportCommand(sessionManager, args);
  case "search":
    return await handleSearchCommand(sessionManager, args);
  case "stats":
    return await handleStatsCommand(sessionManager, args);
  case "cleanup":
    return await handleCleanupCommand(sessionManager, args);
  case "template":
    return await handleTemplateCommand(sessionManager, args);
  default:
    console.error(`Unknown session command: ${command}`);
    console.log("\nAvailable session commands:");
    console.log("  list        - List sessions");
    console.log("  info <id>   - Show session information");
    console.log("  create      - Create new session");
    console.log("  switch <id> - Switch to session");
    console.log("  archive <id> - Archive session");
    console.log("  restore <id> - Restore archived session");
    console.log("  delete <id> - Delete session");
    console.log("  rename <id> <name> - Rename session");
    console.log("  tag <id> <tags> - Add tags to session");
    console.log("  export <id> - Export session");
    console.log("  import <file> - Import session");
    console.log("  search <query> - Search sessions");
    console.log("  stats       - Show session statistics");
    console.log("  cleanup     - Cleanup old sessions");
    console.log("  template    - Template management");
    process.exit(1);
  }
}

async function handleListCommand (sessionManager, args) {
  const filter = {};

  if (args.status) filter.status = args.status;
  if (args.project) filter.projectPath = args.project;
  if (args.tags) filter.tags = args.tags.split(",");
  if (args.search) filter.search = args.search;
  if (args.limit) filter.limit = parseInt(args.limit);
  if (args.sortBy) filter.sortBy = args.sortBy;
  if (args.sortOrder) filter.sortOrder = args.sortOrder;

  const sessions = await sessionManager.listSessions(filter);
  const activeSessions = sessionManager.getActiveSessions();

  if (args.json) {
    console.log(JSON.stringify({ sessions, activeSessions }, null, 2));
    return;
  }

  console.log("Sessions:");
  console.log("=========");

  if (sessions.length === 0) {
    console.log("No sessions found.");
    return;
  }

  // Group by status
  const byStatus = {};
  for (const session of sessions) {
    if (!byStatus[session.status]) {
      byStatus[session.status] = [];
    }
    byStatus[session.status].push(session);
  }

  // Show active sessions first
  if (byStatus.active && byStatus.active.length > 0) {
    console.log("\nActive Sessions:");
    for (const session of byStatus.active) {
      const isActive = activeSessions.some((s) => s.id === session.id);
      const isCurrent = sessionManager.currentSessionId === session.id;

      let prefix = "  ";
      if (isCurrent) prefix = "▶ ";
      else if (isActive) prefix = "● ";

      console.log(`${prefix}${session.name} (${session.id})`);
      console.log(`    Project: ${session.projectPath}`);
      console.log(`    Messages: ${session.messageCount}`);
      console.log(
        `    Last: ${new Date(session.lastAccessed).toLocaleString()}`,
      );

      if (session.tags.length > 0) {
        console.log(`    Tags: ${session.tags.join(", ")}`);
      }
    }
  }

  // Show archived sessions
  if (byStatus.archived && byStatus.archived.length > 0) {
    console.log("\nArchived Sessions:");
    for (const session of byStatus.archived) {
      console.log(`  ${session.name} (${session.id})`);
      console.log(`    Project: ${session.projectPath}`);
      console.log(
        `    Archived: ${new Date(session.lastAccessed).toLocaleDateString()}`,
      );
    }
  }

  // Show templates
  if (byStatus.template && byStatus.template.length > 0) {
    console.log("\nTemplates:");
    for (const session of byStatus.template) {
      console.log(`  ${session.name} (${session.id})`);
      console.log(`    Type: ${session.templateType || "general"}`);
    }
  }

  console.log(`\nTotal: ${sessions.length} session(s)`);
  console.log(`Active: ${activeSessions.length} session(s) in memory`);
}

async function handleInfoCommand (sessionManager, args) {
  const sessionId = args.sessionId;

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log("Usage: naturecode session info <session-id>");
    process.exit(1);
  }

  try {
    const info = await sessionManager.getSessionInfo(sessionId);

    if (args.json) {
      console.log(JSON.stringify(info, null, 2));
      return;
    }

    console.log(`Session: ${info.name}`);
    console.log("=".repeat(60));

    console.log(`ID: ${info.id}`);
    console.log(
      `Status: ${info.status} ${info.isCurrent ? "(current)" : ""} ${info.isActive ? "(active)" : ""}`,
    );
    console.log(`Created: ${new Date(info.createdAt).toLocaleString()}`);
    console.log(
      `Last Accessed: ${new Date(info.lastAccessed).toLocaleString()}`,
    );
    console.log(`Project: ${info.projectPath}`);
    console.log(`Project Type: ${info.context.projectType}`);

    if (info.tags.length > 0) {
      console.log(`Tags: ${info.tags.join(", ")}`);
    }

    console.log("\nConfiguration:");
    console.log(`  Provider: ${info.configuration.provider}`);
    console.log(`  Model: ${info.configuration.model}`);
    console.log(`  Temperature: ${info.configuration.temperature}`);
    console.log(`  Max Tokens: ${info.configuration.maxTokens}`);

    console.log("\nConversation:");
    console.log(`  Summary: ${info.conversation.summary || "No summary"}`);
    console.log(`  Messages: ${info.conversation.messages.length}`);
    console.log(`  Tokens: ${info.conversation.tokenCount}`);

    console.log("\nContext:");
    console.log(`  Working Directory: ${info.context.workingDirectory}`);
    console.log(
      `  Recent Files: ${info.context.recentFiles.slice(0, 5).join(", ") || "None"}`,
    );
    console.log(`  File Operations: ${info.context.fileOperations.length}`);
    console.log(
      `  Dependencies: ${info.context.dependencies.length > 0 ? info.context.dependencies.join(", ") : "None"}`,
    );

    console.log("\nMetadata:");
    console.log(`  Size: ${Math.round(info.metadata.size / 1024)} KB`);
    console.log(`  Message Count: ${info.metadata.messageCount}`);
    console.log(`  Participant Count: ${info.metadata.participantCount}`);

    if (args.verbose) {
      console.log("\nRecent Messages:");
      const recentMessages = info.conversation.messages.slice(-5);
      for (const message of recentMessages) {
        const time = new Date(message.timestamp).toLocaleTimeString();
        console.log(
          `  [${time}] ${message.role}: ${message.content.substring(0, 50)}...`,
        );
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleCreateCommand (sessionManager, args) {
  const name = args.name || `Session ${new Date().toLocaleString()}`;
  const projectPath = args.project || process.cwd();
  const templateId = args.template;

  const options = {
    name,
    projectPath,
  };

  if (templateId) {
    options.templateId = templateId;
  }

  try {
    const context = await sessionManager.createSession(options);
    const session = context.session;

    console.log(`Session created: ${session.name} (${session.id})`);
    console.log(`Project: ${session.projectPath}`);
    console.log(`Status: ${session.status}`);

    if (templateId) {
      console.log(`Template applied: ${templateId}`);
    }

    console.log("\nTo switch to this session:");
    console.log(`  naturecode session switch ${session.id}`);
    console.log("\nTo start chatting in this session:");
    console.log(`  naturecode start --session ${session.id}`);
  } catch (error) {
    console.error(`Error creating session: ${error.message}`);
    process.exit(1);
  }
}

async function handleSwitchCommand (sessionManager, args) {
  const sessionId = args.sessionId;

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log("Usage: naturecode session switch <session-id>");
    process.exit(1);
  }

  try {
    const context = await sessionManager.switchSession(sessionId);
    const session = context.session;

    console.log(`Switched to session: ${session.name} (${session.id})`);
    console.log(`Project: ${session.projectPath}`);
    console.log(`Messages: ${session.conversation.messages.length}`);

    if (session.conversation.summary) {
      console.log(`Summary: ${session.conversation.summary}`);
    }

    console.log("\nTo start chatting:");
    console.log("  naturecode start");
  } catch (error) {
    console.error(`Error switching session: ${error.message}`);
    process.exit(1);
  }
}

async function handleArchiveCommand (sessionManager, args) {
  const sessionId = args.sessionId;

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log("Usage: naturecode session archive <session-id>");
    process.exit(1);
  }

  try {
    const session = await sessionManager.archiveSession(sessionId);

    console.log(`Session archived: ${session.name} (${session.id})`);
    console.log(`Archived at: ${new Date().toLocaleString()}`);

    console.log("\nTo restore this session:");
    console.log(`  naturecode session restore ${session.id}`);
  } catch (error) {
    console.error(`Error archiving session: ${error.message}`);
    process.exit(1);
  }
}

async function handleRestoreCommand (sessionManager, args) {
  const sessionId = args.sessionId;

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log("Usage: naturecode session restore <session-id>");
    process.exit(1);
  }

  try {
    const session = await sessionManager.restoreSession(sessionId);

    console.log(`Session restored: ${session.name} (${session.id})`);
    console.log(`Restored at: ${new Date().toLocaleString()}`);
    console.log(`Status: ${session.status}`);

    console.log("\nTo switch to this session:");
    console.log(`  naturecode session switch ${session.id}`);
  } catch (error) {
    console.error(`Error restoring session: ${error.message}`);
    process.exit(1);
  }
}

async function handleDeleteCommand (sessionManager, args) {
  const sessionId = args.sessionId;

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log("Usage: naturecode session delete <session-id>");
    process.exit(1);
  }

  // Confirm deletion
  if (!args.force) {
    console.log(`WARNING: This will delete session: ${sessionId}`);

    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question("Are you sure? This cannot be undone. (yes/NO): ", resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== "yes") {
      console.log("Deletion cancelled.");
      return;
    }
  }

  try {
    const deleted = await sessionManager.deleteSession(sessionId);

    if (deleted) {
      console.log(`Session deleted: ${sessionId}`);
    } else {
      console.log(`Session not found: ${sessionId}`);
    }
  } catch (error) {
    console.error(`Error deleting session: ${error.message}`);
    process.exit(1);
  }
}

async function handleRenameCommand (sessionManager, args) {
  const sessionId = args.sessionId;
  const newName = args.newName;

  if (!sessionId || !newName) {
    console.error("Error: Session ID and new name are required");
    console.log("Usage: naturecode session rename <session-id> <new-name>");
    process.exit(1);
  }

  try {
    const session = await sessionManager.renameSession(sessionId, newName);

    console.log(`Session renamed: ${session.id}`);
    console.log(`New name: ${session.name}`);
  } catch (error) {
    console.error(`Error renaming session: ${error.message}`);
    process.exit(1);
  }
}

async function handleTagCommand (sessionManager, args) {
  const sessionId = args.sessionId;
  const tags = args.tags;

  if (!sessionId || !tags) {
    console.error("Error: Session ID and tags are required");
    console.log("Usage: naturecode session tag <session-id> <tag1,tag2,...>");
    process.exit(1);
  }

  const tagList = tags.split(",").map((tag) => tag.trim());

  try {
    const session = await sessionManager.tagSession(sessionId, tagList);

    console.log(`Tags added to session ${session.id}:`);
    console.log(`  ${session.tags.join(", ")}`);
  } catch (error) {
    console.error(`Error tagging session: ${error.message}`);
    process.exit(1);
  }
}

async function handleExportCommand (sessionManager, args) {
  const sessionId = args.sessionId;
  const format = args.format || "json";
  const output = args.output;

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log(
      "Usage: naturecode session export <session-id> [--format json|markdown|text] [--output <path>]",
    );
    process.exit(1);
  }

  try {
    const outputPath = await sessionManager.exportSession(
      sessionId,
      format,
      output,
    );

    console.log(`Session exported: ${sessionId}`);
    console.log(`Format: ${format}`);
    console.log(`Output: ${outputPath}`);

    const stats = await fs.stat(outputPath);
    console.log(`Size: ${Math.round(stats.size / 1024)} KB`);
  } catch (error) {
    console.error(`Error exporting session: ${error.message}`);
    process.exit(1);
  }
}

async function handleImportCommand (sessionManager, args) {
  const filePath = args.filePath;
  const name = args.name;

  if (!filePath) {
    console.error("Error: File path is required");
    console.log(
      "Usage: naturecode session import <file-path> [--name <session-name>]",
    );
    process.exit(1);
  }

  try {
    const session = await sessionManager.importSession(filePath, { name });

    console.log(`Session imported: ${session.name} (${session.id})`);
    console.log(`Source: ${filePath}`);
    console.log(`Messages: ${session.conversation.messages.length}`);

    console.log("\nTo switch to this session:");
    console.log(`  naturecode session switch ${session.id}`);
  } catch (error) {
    console.error(`Error importing session: ${error.message}`);
    process.exit(1);
  }
}

async function handleSearchCommand (sessionManager, args) {
  const query = args.query;

  if (!query) {
    console.error("Error: Search query is required");
    console.log("Usage: naturecode session search <query> [--limit <number>]");
    process.exit(1);
  }

  const options = {};
  if (args.limit) options.limit = parseInt(args.limit);

  try {
    const results = await sessionManager.searchSessions(query, options);

    console.log(`Search results for: "${query}"`);
    console.log("=".repeat(50));

    if (results.length === 0) {
      console.log("No matching sessions found.");
      return;
    }

    for (const result of results) {
      const session = result.session;
      console.log(`\n${session.name} (${session.id})`);
      console.log(
        `  Match: ${result.matchType} (score: ${Math.round(result.score)})`,
      );
      console.log(`  Status: ${session.status}`);
      console.log(`  Project: ${session.projectPath}`);
      console.log(`  Messages: ${session.conversation.messages.length}`);
      console.log(
        `  Last: ${new Date(session.lastAccessed).toLocaleDateString()}`,
      );
    }

    console.log(`\nFound ${results.length} matching session(s)`);
  } catch (error) {
    console.error(`Error searching sessions: ${error.message}`);
    process.exit(1);
  }
}

async function handleStatsCommand (sessionManager, args) {
  try {
    const stats = await sessionManager.getStatistics();
    const activeSessions = sessionManager.getActiveSessions();
    const counts = sessionManager.getSessionCounts();

    if (args.json) {
      console.log(JSON.stringify({ stats, activeSessions, counts }, null, 2));
      return;
    }

    console.log("Session Statistics:");
    console.log("==================");

    console.log("\nStorage:");
    console.log(`  Total Sessions: ${stats.totalSessions}`);
    console.log(`  Active Sessions: ${stats.activeSessions}`);
    console.log(`  Archived Sessions: ${stats.archivedSessions}`);
    console.log(`  Total Messages: ${stats.totalMessages}`);
    console.log(
      `  Total Storage: ${Math.round((stats.totalStorage / 1024 / 1024) * 100) / 100} MB`,
    );

    console.log("\nMemory:");
    console.log(`  Active in Memory: ${counts.active}`);
    console.log(`  Current Session: ${counts.current > 0 ? "Yes" : "No"}`);

    if (activeSessions.length > 0) {
      console.log("\nActive Sessions in Memory:");
      for (const session of activeSessions) {
        const prefix = session.isCurrent ? "▶ " : "  ";
        console.log(`${prefix}${session.name}`);
        console.log(`    Messages: ${session.messageCount}`);
        console.log(`    Recent: ${session.recentFiles.join(", ") || "None"}`);
      }
    }

    console.log(
      `\nLast Updated: ${new Date(stats.lastUpdated || Date.now()).toLocaleString()}`,
    );
  } catch (error) {
    console.error(`Error getting statistics: ${error.message}`);
    process.exit(1);
  }
}

async function handleCleanupCommand (sessionManager, args) {
  const maxAgeDays = args.days || 30;

  console.log(`Cleaning up sessions older than ${maxAgeDays} days...`);

  try {
    const deletedCount = await sessionManager.cleanupOldSessions(maxAgeDays);

    console.log(`Cleaned up ${deletedCount} old session(s)`);

    if (deletedCount > 0) {
      const stats = await sessionManager.getStatistics();
      console.log(`Remaining sessions: ${stats.totalSessions}`);
      console.log(
        `Storage saved: ${Math.round((deletedCount * 1024) / 1024)} KB estimated`,
      );
    }
  } catch (error) {
    console.error(`Error cleaning up sessions: ${error.message}`);
    process.exit(1);
  }
}

async function handleTemplateCommand (sessionManager, args) {
  const subcommand = args.subcommand;

  if (!subcommand) {
    console.log("Session Template Management");
    console.log("==========================");
    console.log("\nAvailable subcommands:");
    console.log("  list        - List available templates");
    console.log("  create <id> - Create template from session");
    console.log(
      "  apply <template-id> <session-id> - Apply template to session",
    );
    console.log("  info <id>   - Show template information");
    return;
  }

  switch (subcommand) {
  case "list":
    await handleTemplateList(sessionManager, args);
    break;
  case "create":
    await handleTemplateCreate(sessionManager, args);
    break;
  case "apply":
    await handleTemplateApply(sessionManager, args);
    break;
  case "info":
    await handleTemplateInfo(sessionManager, args);
    break;
  default:
    console.error(`Unknown template subcommand: ${subcommand}`);
    process.exit(1);
  }
}

async function handleTemplateList (sessionManager, args) {
  try {
    const templates = await sessionManager.listTemplates();

    console.log("Available Templates:");
    console.log("===================");

    if (templates.length === 0) {
      console.log("No templates available.");
      console.log("\nTo create a template:");
      console.log("  naturecode session template create <session-id>");
      return;
    }

    for (const template of templates) {
      console.log(`\n${template.name} (${template.id})`);
      console.log(`  Type: ${template.templateType}`);
      console.log(`  Description: ${template.description || "No description"}`);
      console.log(`  Categories: ${template.categories.join(", ") || "None"}`);
      console.log(`  Usage Count: ${template.usageCount}`);
      console.log(
        `  Created: ${new Date(template.createdAt).toLocaleDateString()}`,
      );
    }
  } catch (error) {
    console.error(`Error listing templates: ${error.message}`);
    process.exit(1);
  }
}

async function handleTemplateCreate (sessionManager, args) {
  const sessionId = args.sessionId;
  const name = args.name;
  const description = args.description;
  const type = args.type || "general";

  if (!sessionId) {
    console.error("Error: Session ID is required");
    console.log(
      "Usage: naturecode session template create <session-id> [--name <name>] [--description <desc>] [--type <type>]",
    );
    process.exit(1);
  }

  const templateData = {
    name: name || `Template from ${sessionId}`,
    description,
    templateType: type,
  };

  try {
    const template = await sessionManager.createTemplate(
      sessionId,
      templateData,
    );

    console.log(`Template created: ${template.name} (${template.id})`);
    console.log(`Type: ${template.templateType}`);
    console.log(`Description: ${template.description || "No description"}`);

    console.log("\nTo apply this template:");
    console.log(
      `  naturecode session template apply ${template.id} <session-id>`,
    );
  } catch (error) {
    console.error(`Error creating template: ${error.message}`);
    process.exit(1);
  }
}

async function handleTemplateApply (sessionManager, args) {
  const templateId = args.templateId;
  const sessionId = args.sessionId;

  if (!templateId || !sessionId) {
    console.error("Error: Template ID and Session ID are required");
    console.log(
      "Usage: naturecode session template apply <template-id> <session-id>",
    );
    process.exit(1);
  }

  try {
    // Load the session
    const session = await sessionManager.storage.loadSession(sessionId);

    // Apply template
    await sessionManager.applyTemplate(session, templateId);

    // Save the updated session
    await sessionManager.storage.saveSession(session);

    console.log(`Template applied: ${templateId} -> ${sessionId}`);
    console.log(`Session updated: ${session.name}`);
  } catch (error) {
    console.error(`Error applying template: ${error.message}`);
    process.exit(1);
  }
}

async function handleTemplateInfo (sessionManager, args) {
  const templateId = args.templateId;

  if (!templateId) {
    console.error("Error: Template ID is required");
    console.log("Usage: naturecode session template info <template-id>");
    process.exit(1);
  }

  try {
    const info = await sessionManager.getSessionInfo(templateId);

    console.log(`Template: ${info.name}`);
    console.log("=".repeat(50));

    console.log(`ID: ${info.id}`);
    console.log(`Type: ${info.templateType || "general"}`);
    console.log(`Description: ${info.description || "No description"}`);
    console.log(`Categories: ${info.categories?.join(", ") || "None"}`);
    console.log(`Usage Count: ${info.usageCount || 0}`);
    console.log(`Created: ${new Date(info.createdAt).toLocaleString()}`);

    console.log("\nConfiguration:");
    console.log(`  Provider: ${info.configuration.provider}`);
    console.log(`  Model: ${info.configuration.model}`);
    console.log(`  Temperature: ${info.configuration.temperature}`);

    console.log("\nAI Context:");
    console.log(
      `  System Prompt: ${info.state.aiContext?.systemPrompt?.substring(0, 100) || "None"}...`,
    );
    console.log(
      `  Context Window: ${info.state.aiContext?.contextWindow?.join(", ") || "None"}`,
    );
  } catch (error) {
    console.error(`Error getting template info: ${error.message}`);
    process.exit(1);
  }
}
