// Session manager

import { Session, SessionTemplate, SessionContext } from "../types/index.js";
import { SessionStorage } from "../storage/index.js";

export class SessionManager {
  constructor (config = {}) {
    this.config = config;
    this.storage = new SessionStorage(config.storagePath);
    this.activeSessions = new Map(); // sessionId -> SessionContext
    this.currentSessionId = null;
    this.autoSaveEnabled = config.autoSave !== false;
    this.autoSaveInterval = config.autoSaveInterval || 30000; // 30 seconds
  }

  // Session creation and management
  async createSession (options = {}) {
    const session = new Session(options);

    // Apply template if specified
    if (options.templateId) {
      await this.applyTemplate(session, options.templateId);
    }

    // Save to storage
    await this.storage.saveSession(session);

    // Create session context
    const context = new SessionContext(
      session,
      options.fileSystem,
      options.configManager,
      this.storage,
    );

    // Start auto-save if enabled
    if (this.autoSaveEnabled) {
      context.autoSaveEnabled = true;
      context.autoSaveIntervalMs = this.autoSaveInterval;
      context.startAutoSave();
    }

    // Track as active session
    this.activeSessions.set(session.id, context);

    // Set as current session if no current session
    if (!this.currentSessionId) {
      this.currentSessionId = session.id;
    }

    return context;
  }

  async loadSession (sessionId) {
    // Check if already active
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId);
    }

    // Load from storage
    const session = await this.storage.loadSession(sessionId);

    // Create session context
    const context = new SessionContext(
      session,
      this.config.fileSystem,
      this.config.configManager,
      this.storage,
    );

    // Start auto-save if enabled
    if (this.autoSaveEnabled) {
      context.autoSaveEnabled = true;
      context.autoSaveIntervalMs = this.autoSaveInterval;
      context.startAutoSave();
    }

    // Track as active session
    this.activeSessions.set(sessionId, context);

    // Set as current session
    this.currentSessionId = sessionId;

    return context;
  }

  async saveSession (sessionId) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    return await context.save();
  }

  async closeSession (sessionId, save = true) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      return; // Already closed
    }

    // Save if requested
    if (save) {
      await context.save();
    }

    // Cleanup context
    context.cleanup();

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    // Update current session if needed
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = this.getFirstActiveSessionId();
    }
  }

  getFirstActiveSessionId () {
    const keys = Array.from(this.activeSessions.keys());
    return keys.length > 0 ? keys[0] : null;
  }

  async switchSession (sessionId) {
    // Ensure session is loaded
    const context = await this.loadSession(sessionId);
    this.currentSessionId = sessionId;

    return context;
  }

  getCurrentSession () {
    if (!this.currentSessionId) {
      return null;
    }

    return this.activeSessions.get(this.currentSessionId);
  }

  // Session operations
  async archiveSession (sessionId) {
    const session = await this.storage.archiveSession(sessionId);

    // If session is active, close it
    if (this.activeSessions.has(sessionId)) {
      await this.closeSession(sessionId, false);
    }

    return session;
  }

  async restoreSession (sessionId) {
    return await this.storage.restoreSession(sessionId);
  }

  async deleteSession (sessionId) {
    // Close if active
    if (this.activeSessions.has(sessionId)) {
      await this.closeSession(sessionId, false);
    }

    // Delete from storage
    return await this.storage.deleteSession(sessionId);
  }

  async renameSession (sessionId, newName) {
    const session = await this.storage.loadSession(sessionId);
    session.name = newName;

    return await this.storage.saveSession(session);
  }

  async tagSession (sessionId, tags) {
    const session = await this.storage.loadSession(sessionId);

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        session.addTag(tag);
      }
    } else {
      session.addTag(tags);
    }

    return await this.storage.saveSession(session);
  }

  async untagSession (sessionId, tags) {
    const session = await this.storage.loadSession(sessionId);

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        session.removeTag(tag);
      }
    } else {
      session.removeTag(tags);
    }

    return await this.storage.saveSession(session);
  }

  // Template management
  async createTemplate (sessionId, templateData = {}) {
    const session = await this.storage.loadSession(sessionId);

    const template = new SessionTemplate({
      ...session.toJSON(),
      ...templateData,
      status: "template",
    });

    return await this.storage.saveSession(template);
  }

  async applyTemplate (session, templateId) {
    const template = await this.storage.loadSession(templateId);

    if (!(template instanceof SessionTemplate)) {
      throw new Error(`Session ${templateId} is not a template`);
    }

    return template.applyToSession(session);
  }

  async listTemplates (filter = {}) {
    const sessions = await this.storage.listSessions({
      ...filter,
      status: "template",
    });

    return sessions.map((sessionData) => {
      const template = new SessionTemplate(sessionData);
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        templateType: template.templateType,
        categories: template.categories,
        usageCount: template.usageCount,
        createdAt: template.createdAt,
      };
    });
  }

  // Session listing and search
  async listSessions (filter = {}) {
    return await this.storage.listSessions(filter);
  }

  async searchSessions (query, options = {}) {
    return await this.storage.searchSessions(query, options);
  }

  async getSessionInfo (sessionId) {
    const session = await this.storage.loadSession(sessionId);
    const isActive = this.activeSessions.has(sessionId);
    const isCurrent = this.currentSessionId === sessionId;

    return {
      ...session.toJSON(),
      isActive,
      isCurrent,
      activeSince: isActive
        ? this.activeSessions.get(sessionId)?.session.createdAt
        : null,
    };
  }

  // Export and import
  async exportSession (sessionId, format = "json", outputPath = null) {
    return await this.storage.exportSession(sessionId, format, outputPath);
  }

  async importSession (filePath, options = {}) {
    const session = await this.storage.importSession(filePath, options);

    // Create context if auto-load is enabled
    if (options.autoLoad !== false) {
      await this.loadSession(session.id);
    }

    return session;
  }

  // Statistics and monitoring
  async getStatistics () {
    return await this.storage.getStatistics();
  }

  getActiveSessions () {
    return Array.from(this.activeSessions.values()).map((context) => ({
      id: context.session.id,
      name: context.session.name,
      isCurrent: this.currentSessionId === context.session.id,
      messageCount: context.getMessageCount(),
      recentFiles: context.getRecentFiles(5),
      summary: context.getConversationSummary(),
    }));
  }

  // Project context management
  async updateProjectContext (sessionId) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    return await context.updateProjectContext();
  }

  // File operation tracking
  async trackFileRead (sessionId, filePath) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    return await context.trackFileRead(filePath);
  }

  async trackFileWrite (sessionId, filePath, content) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    return await context.trackFileWrite(filePath, content);
  }

  async trackFileDelete (sessionId, filePath) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    return await context.trackFileDelete(filePath);
  }

  // Context management
  async updateContext (sessionId, contextUpdate) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    // Merge context updates
    const currentContext = context.getContext();
    const updatedContext = {
      ...currentContext,
      ...contextUpdate,
    };

    // Handle nested object merging
    for (const key in contextUpdate) {
      if (
        typeof contextUpdate[key] === "object" &&
        contextUpdate[key] !== null &&
        !Array.isArray(contextUpdate[key]) &&
        typeof currentContext[key] === "object" &&
        currentContext[key] !== null &&
        !Array.isArray(currentContext[key])
      ) {
        updatedContext[key] = {
          ...currentContext[key],
          ...contextUpdate[key],
        };
      }
    }

    context.setContext(updatedContext);
    await context.save();

    return context.session;
  }

  // File operation tracking
  async trackFileOperation (sessionId, operation) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    // Use session's addFileOperation method
    context.session.addFileOperation(operation.type, operation.path, operation);

    await context.save();

    return context.session;
  }

  // Conversation management
  async addMessage (sessionId, role, content) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      throw new Error(`Session not active: ${sessionId}`);
    }

    const message = context.session.addMessage(role, content);
    await context.save();

    return message;
  }

  async getConversation (sessionId, limit = null) {
    const context = this.activeSessions.get(sessionId);

    if (!context) {
      // Try to load session data
      const session = await this.storage.loadSession(sessionId);
      return limit
        ? session.conversation.messages.slice(-limit)
        : session.conversation.messages;
    }

    const messages = context.session.conversation.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  // Cleanup
  async cleanupOldSessions (maxAgeDays = 30) {
    return await this.storage.cleanupOldSessions(maxAgeDays);
  }

  async cleanup () {
    // Close all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.closeSession(sessionId, true);
    }

    this.activeSessions.clear();
    this.currentSessionId = null;
  }

  // Utility methods
  async sessionExists (sessionId) {
    try {
      await this.storage.loadSession(sessionId);
      return true;
    } catch {
      return false;
    }
  }

  getSessionCounts () {
    const active = this.activeSessions.size;
    const current = this.currentSessionId ? 1 : 0;

    return {
      active,
      current,
      total: active, // Would need storage stats for total
    };
  }

  // Configuration
  setAutoSave (enabled, intervalMs = null) {
    this.autoSaveEnabled = enabled;

    if (intervalMs !== null) {
      this.autoSaveInterval = intervalMs;
    }

    // Update all active sessions
    for (const context of this.activeSessions.values()) {
      context.autoSaveEnabled = enabled;

      if (intervalMs !== null) {
        context.autoSaveIntervalMs = intervalMs;
      }

      if (enabled) {
        context.startAutoSave();
      } else {
        context.stopAutoSave();
      }
    }
  }
}
