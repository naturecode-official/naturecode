// Session storage management

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Session, SessionStatus, SessionTemplate } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SessionStorage {
  constructor (basePath = null) {
    this.basePath = basePath || this.getDefaultBasePath();
    this.sessions = new Map(); // sessionId -> session
    this.metadata = null;
    this.ensureDirectoryStructure();
  }

  getDefaultBasePath () {
    return path.join(
      process.env.HOME || process.env.USERPROFILE,
      ".naturecode",
      "sessions",
    );
  }

  ensureDirectoryStructure () {
    const dirs = ["active", "archived", "templates", "backups", "exports"];

    for (const dir of dirs) {
      const dirPath = path.join(this.basePath, dir);
      fs.mkdir(dirPath, { recursive: true }).catch(() => {
        // Directory might already exist
      });
    }
  }

  getSessionPath (sessionId, status = SessionStatus.ACTIVE) {
    let subdir = "active";

    switch (status) {
    case SessionStatus.ARCHIVED:
      subdir = "archived";
      break;
    case SessionStatus.TEMPLATE:
      subdir = "templates";
      break;
    case SessionStatus.BACKUP:
      subdir = "backups";
      break;
    }

    return path.join(this.basePath, subdir, `${sessionId}.json`);
  }

  async loadMetadata () {
    const metadataPath = path.join(this.basePath, "metadata.json");

    try {
      const content = await fs.readFile(metadataPath, "utf-8");
      this.metadata = JSON.parse(content);
    } catch (error) {
      // Create default metadata
      this.metadata = {
        sessions: {},
        projects: {},
        statistics: {
          totalSessions: 0,
          activeSessions: 0,
          archivedSessions: 0,
          totalMessages: 0,
          totalStorage: 0,
        },
        lastUpdated: new Date().toISOString(),
      };

      await this.saveMetadata();
    }

    return this.metadata;
  }

  async saveMetadata () {
    const metadataPath = path.join(this.basePath, "metadata.json");

    this.metadata.lastUpdated = new Date().toISOString();

    await fs.writeFile(metadataPath, JSON.stringify(this.metadata, null, 2));
  }

  async updateMetadata (session) {
    await this.loadMetadata();

    // Update session entry
    this.metadata.sessions[session.id] = {
      id: session.id,
      name: session.name,
      type: session.type,
      projectPath: session.projectPath,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      status: session.status,
      tags: session.tags,
      size: JSON.stringify(session).length,
      messageCount: session.conversation.messages.length,
    };

    // Update project statistics
    const projectKey = session.projectPath || "unknown";
    if (!this.metadata.projects[projectKey]) {
      this.metadata.projects[projectKey] = {
        sessionCount: 0,
        lastSession: null,
        totalMessages: 0,
      };
    }

    const project = this.metadata.projects[projectKey];
    project.sessionCount = Object.values(this.metadata.sessions).filter(
      (s) => s.projectPath === session.projectPath,
    ).length;
    project.lastSession = session.id;
    project.totalMessages += session.conversation.messages.length;

    // Update global statistics
    this.metadata.statistics.totalSessions = Object.keys(
      this.metadata.sessions,
    ).length;
    this.metadata.statistics.activeSessions = Object.values(
      this.metadata.sessions,
    ).filter((s) => s.status === SessionStatus.ACTIVE).length;
    this.metadata.statistics.archivedSessions = Object.values(
      this.metadata.sessions,
    ).filter((s) => s.status === SessionStatus.ARCHIVED).length;
    this.metadata.statistics.totalMessages = Object.values(
      this.metadata.sessions,
    ).reduce((sum, s) => sum + s.messageCount, 0);
    this.metadata.statistics.totalStorage = Object.values(
      this.metadata.sessions,
    ).reduce((sum, s) => sum + s.size, 0);

    await this.saveMetadata();
  }

  async saveSession (session) {
    const sessionPath = this.getSessionPath(session.id, session.status);

    // Ensure directory exists
    await fs.mkdir(path.dirname(sessionPath), { recursive: true });

    // Save session file
    await fs.writeFile(sessionPath, JSON.stringify(session.toJSON(), null, 2));

    // Update metadata
    await this.updateMetadata(session);

    // Cache in memory
    this.sessions.set(session.id, session);

    return session;
  }

  async loadSession (sessionId) {
    // Check cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    // Try different status directories
    const statuses = [
      SessionStatus.ACTIVE,
      SessionStatus.ARCHIVED,
      SessionStatus.TEMPLATE,
      SessionStatus.BACKUP,
    ];

    for (const status of statuses) {
      const sessionPath = this.getSessionPath(sessionId, status);

      try {
        const content = await fs.readFile(sessionPath, "utf-8");
        const data = JSON.parse(content);

        let session;
        if (data.type === "template" || status === SessionStatus.TEMPLATE) {
          session = new SessionTemplate(data);
        } else {
          session = new Session(data);
        }

        // Cache in memory
        this.sessions.set(sessionId, session);

        return session;
      } catch (error) {
        // File doesn't exist in this directory, try next
        continue;
      }
    }

    throw new Error(`Session not found: ${sessionId}`);
  }

  async deleteSession (sessionId) {
    // Try different status directories
    const statuses = [
      SessionStatus.ACTIVE,
      SessionStatus.ARCHIVED,
      SessionStatus.TEMPLATE,
      SessionStatus.BACKUP,
    ];

    let deleted = false;

    for (const status of statuses) {
      const sessionPath = this.getSessionPath(sessionId, status);

      try {
        await fs.unlink(sessionPath);
        deleted = true;
        break;
      } catch (error) {
        // File doesn't exist in this directory, try next
        continue;
      }
    }

    if (deleted) {
      // Remove from cache
      this.sessions.delete(sessionId);

      // Update metadata
      await this.loadMetadata();
      delete this.metadata.sessions[sessionId];
      await this.saveMetadata();
    }

    return deleted;
  }

  async archiveSession (sessionId) {
    const session = await this.loadSession(sessionId);

    // Move from active to archived
    const oldPath = this.getSessionPath(sessionId, SessionStatus.ACTIVE);
    const newPath = this.getSessionPath(sessionId, SessionStatus.ARCHIVED);

    try {
      await fs.rename(oldPath, newPath);
    } catch (error) {
      // Session might not be in active directory
      // Just update status
    }

    session.status = SessionStatus.ARCHIVED;
    session.lastAccessed = new Date().toISOString();

    return await this.saveSession(session);
  }

  async restoreSession (sessionId) {
    const session = await this.loadSession(sessionId);

    // Move from archived to active
    const oldPath = this.getSessionPath(sessionId, SessionStatus.ARCHIVED);
    const newPath = this.getSessionPath(sessionId, SessionStatus.ACTIVE);

    try {
      await fs.rename(oldPath, newPath);
    } catch (error) {
      // Session might not be in archived directory
      // Just update status
    }

    session.status = SessionStatus.ACTIVE;
    session.lastAccessed = new Date().toISOString();

    return await this.saveSession(session);
  }

  async listSessions (filter = {}) {
    await this.loadMetadata();

    let sessions = Object.values(this.metadata.sessions);

    // Apply filters
    if (filter.status) {
      sessions = sessions.filter((s) => s.status === filter.status);
    }

    if (filter.projectPath) {
      sessions = sessions.filter((s) => s.projectPath === filter.projectPath);
    }

    if (filter.tags && filter.tags.length > 0) {
      sessions = sessions.filter((s) =>
        filter.tags.some((tag) => s.tags.includes(tag)),
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      sessions = sessions.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.id.toLowerCase().includes(searchLower) ||
          s.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    if (filter.type) {
      sessions = sessions.filter((s) => s.type === filter.type);
    }

    // Sort
    const sortField = filter.sortBy || "lastAccessed";
    const sortOrder = filter.sortOrder || "desc";

    sessions.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle dates
      if (sortField === "createdAt" || sortField === "lastAccessed") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Limit
    if (filter.limit) {
      sessions = sessions.slice(0, filter.limit);
    }

    return sessions;
  }

  async searchSessions (query, options = {}) {
    await this.loadMetadata();

    const results = [];
    const queryLower = query.toLowerCase();

    // Search in session files
    const searchDirs = ["active", "archived", "templates"];

    for (const dir of searchDirs) {
      const dirPath = path.join(this.basePath, dir);

      try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          if (!file.endsWith(".json")) continue;

          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, "utf-8");

          // Check if content contains search query
          if (content.toLowerCase().includes(queryLower)) {
            const data = JSON.parse(content);
            const session = new Session(data);

            results.push({
              session,
              filePath,
              matchType: "content",
              score: this.calculateSearchScore(content, queryLower),
            });
          }
        }
      } catch (error) {
        // Directory might not exist
        continue;
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    if (options.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  calculateSearchScore (content, query) {
    const contentLower = content.toLowerCase();
    let score = 0;

    // Exact match in name
    if (contentLower.includes('"name":')) {
      const nameMatch = contentLower.match(/"name":\s*"([^"]*)"/);
      if (nameMatch && nameMatch[1].toLowerCase().includes(query)) {
        score += 100;
      }
    }

    // Match in conversation messages
    const messageMatches = (contentLower.match(new RegExp(query, "g")) || [])
      .length;
    score += messageMatches * 10;

    // Match in tags
    if (contentLower.includes('"tags":')) {
      const tagsMatch = contentLower.match(/"tags":\s*\[([^\]]*)\]/);
      if (tagsMatch && tagsMatch[1].toLowerCase().includes(query)) {
        score += 50;
      }
    }

    return score;
  }

  async exportSession (sessionId, format = "json", outputPath = null) {
    const session = await this.loadSession(sessionId);

    let content;
    let extension;

    switch (format.toLowerCase()) {
    case "json":
      content = JSON.stringify(session.toJSON(), null, 2);
      extension = "json";
      break;

    case "markdown":
      content = this.convertToMarkdown(session);
      extension = "md";
      break;

    case "text":
      content = this.convertToText(session);
      extension = "txt";
      break;

    default:
      throw new Error(`Unsupported export format: ${format}`);
    }

    if (!outputPath) {
      const exportsDir = path.join(this.basePath, "exports");
      await fs.mkdir(exportsDir, { recursive: true });

      outputPath = path.join(
        exportsDir,
        `${sessionId}-${new Date().toISOString().split("T")[0]}.${extension}`,
      );
    }

    await fs.writeFile(outputPath, content);

    return outputPath;
  }

  convertToMarkdown (session) {
    let markdown = `# ${session.name}\n\n`;

    markdown += `**Session ID:** ${session.id}\n`;
    markdown += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`;
    markdown += `**Last Accessed:** ${new Date(session.lastAccessed).toLocaleString()}\n`;
    markdown += `**Project:** ${session.projectPath}\n`;
    markdown += `**Status:** ${session.status}\n`;

    if (session.tags.length > 0) {
      markdown += `**Tags:** ${session.tags.join(", ")}\n`;
    }

    markdown += `\n## Summary\n\n${session.conversation.summary || "No summary available"}\n\n`;

    markdown += "## Configuration\n\n";
    markdown += `- Provider: ${session.configuration.provider}\n`;
    markdown += `- Model: ${session.configuration.model}\n`;
    markdown += `- Temperature: ${session.configuration.temperature}\n`;
    markdown += `- Max Tokens: ${session.configuration.maxTokens}\n`;

    markdown += "\n## Conversation\n\n";

    for (const message of session.conversation.messages) {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      markdown += `### ${message.role} (${timestamp})\n\n`;
      markdown += `${message.content}\n\n`;
    }

    return markdown;
  }

  convertToText (session) {
    let text = `Session: ${session.name}\n`;
    text += `ID: ${session.id}\n`;
    text += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
    text += `Project: ${session.projectPath}\n`;
    text += `Status: ${session.status}\n\n`;

    text += `Summary: ${session.conversation.summary || "No summary"}\n\n`;

    text += "Conversation:\n";
    text += "=".repeat(50) + "\n\n";

    for (const message of session.conversation.messages) {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      text += `[${timestamp}] ${message.role.toUpperCase()}:\n`;
      text += `${message.content}\n\n`;
    }

    return text;
  }

  async importSession (filePath, options = {}) {
    const content = await fs.readFile(filePath, "utf-8");
    let data;

    // Try to parse as JSON
    try {
      data = JSON.parse(content);
    } catch (error) {
      // Try to parse as markdown
      data = this.parseMarkdown(content);
    }

    if (!data.id) {
      data.id = new Session().generateSessionId();
    }

    if (options.name) {
      data.name = options.name;
    }

    const session = new Session(data);

    // Save the imported session
    return await this.saveSession(session);
  }

  parseMarkdown (content) {
    // Simple markdown parsing for session import
    const data = {
      name: "",
      conversation: {
        messages: [],
        summary: "",
      },
    };

    const lines = content.split("\n");
    let currentSection = null;
    let currentMessage = null;

    for (const line of lines) {
      // Parse title
      if (line.startsWith("# ")) {
        data.name = line.substring(2).trim();
      }

      // Parse summary
      else if (line.startsWith("## Summary")) {
        currentSection = "summary";
      } else if (
        currentSection === "summary" &&
        line.trim() &&
        !line.startsWith("#")
      ) {
        data.conversation.summary += line.trim() + " ";
      }

      // Parse conversation
      else if (line.startsWith("### ")) {
        if (currentMessage) {
          data.conversation.messages.push(currentMessage);
        }

        const match = line.match(/### (\w+) \((.+)\)/);
        if (match) {
          currentMessage = {
            role: match[1].toLowerCase(),
            content: "",
            timestamp: new Date().toISOString(), // Would parse actual timestamp
          };
        }
      } else if (currentMessage && line.trim() && !line.startsWith("#")) {
        currentMessage.content += line.trim() + "\n";
      }
    }

    // Add last message
    if (currentMessage) {
      data.conversation.messages.push(currentMessage);
    }

    // Clean up summary
    if (data.conversation.summary) {
      data.conversation.summary = data.conversation.summary.trim();
    }

    return data;
  }

  async cleanupOldSessions (maxAgeDays = 30) {
    await this.loadMetadata();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const oldSessions = Object.values(this.metadata.sessions).filter(
      (session) => {
        const lastAccessed = new Date(session.lastAccessed);
        return (
          lastAccessed < cutoffDate && session.status === SessionStatus.ARCHIVED
        );
      },
    );

    let deletedCount = 0;

    for (const session of oldSessions) {
      try {
        await this.deleteSession(session.id);
        deletedCount++;
      } catch (error) {
        console.warn(
          `Failed to delete old session ${session.id}:`,
          error.message,
        );
      }
    }

    return deletedCount;
  }

  async getStatistics () {
    await this.loadMetadata();
    return this.metadata.statistics;
  }
}
