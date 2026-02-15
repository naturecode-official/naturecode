// Session type definitions

export const SessionStatus = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  TEMPLATE: "template",
  BACKUP: "backup",
};

export const SessionVisibility = {
  PRIVATE: "private",
  TEAM: "team",
  PUBLIC: "public",
};

export const SessionType = {
  REGULAR: "regular",
  TEMPLATE: "template",
  BACKUP: "backup",
};

export class Session {
  constructor (data = {}) {
    this.id = data.id || this.generateSessionId();
    this.name = data.name || `Session ${new Date().toLocaleString()}`;
    this.type = data.type || SessionType.REGULAR;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastAccessed = data.lastAccessed || new Date().toISOString();
    this.projectPath = data.projectPath || process.cwd();
    this.status = data.status || SessionStatus.ACTIVE;
    this.tags = data.tags || [];
    this.visibility = data.visibility || SessionVisibility.PRIVATE;

    // Configuration
    this.configuration = data.configuration || {
      provider: "deepseek",
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 2000,
      stream: true,
    };

    // Conversation
    this.conversation = data.conversation || {
      messages: [],
      summary: "",
      tokenCount: 0,
    };

    // Context
    this.context = data.context || {
      workingDirectory: process.cwd(),
      recentFiles: [],
      fileOperations: [],
      projectType: this.detectProjectType(),
      dependencies: [],
    };

    // State
    this.state = data.state || {
      fileCache: {},
      aiContext: {
        systemPrompt: "",
        contextWindow: [],
      },
    };

    // Metadata
    this.metadata = data.metadata || {
      version: "1.0.0",
      size: 0,
      messageCount: 0,
      participantCount: 1,
    };
  }

  generateSessionId () {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `session-${timestamp}-${random}`;
  }

  detectProjectType () {
    // Simple project type detection
    const cwd = process.cwd();

    if (this.fileExists("package.json")) return "nodejs";
    if (this.fileExists("requirements.txt")) return "python";
    if (this.fileExists("pom.xml")) return "java";
    if (this.fileExists("Cargo.toml")) return "rust";
    if (this.fileExists("go.mod")) return "go";

    return "unknown";
  }

  fileExists (filename) {
    // This would check if file exists in projectPath
    // For now, return false
    return false;
  }

  addMessage (role, content) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    this.conversation.messages.push(message);
    this.conversation.messageCount = this.conversation.messages.length;
    this.lastAccessed = new Date().toISOString();

    // Update summary if needed
    if (this.conversation.messages.length % 5 === 0) {
      this.updateSummary();
    }

    return message;
  }

  updateSummary () {
    // Simple summary based on recent messages
    const recentMessages = this.conversation.messages.slice(-10);
    const topics = this.extractTopics(recentMessages);

    this.conversation.summary = `Discussion about ${topics.join(", ")}`;
  }

  extractTopics (messages) {
    // Simple topic extraction
    const topics = new Set();

    for (const message of messages) {
      const words = message.content.toLowerCase().split(/\s+/);
      const keywords = [
        "error",
        "fix",
        "implement",
        "design",
        "test",
        "debug",
        "refactor",
      ];

      for (const keyword of keywords) {
        if (words.some((word) => word.includes(keyword))) {
          topics.add(keyword);
        }
      }
    }

    return Array.from(topics).slice(0, 3);
  }

  addFileOperation (type, filePath, details = {}) {
    const operation = {
      type,
      path: filePath,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.context.fileOperations.push(operation);

    // Update recent files
    this.context.recentFiles = [
      filePath,
      ...this.context.recentFiles.filter((f) => f !== filePath),
    ].slice(0, 10);

    return operation;
  }

  updateWorkingDirectory (path) {
    this.context.workingDirectory = path;
    this.lastAccessed = new Date().toISOString();
  }

  addTag (tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag (tag) {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  archive () {
    this.status = SessionStatus.ARCHIVED;
    this.lastAccessed = new Date().toISOString();
  }

  restore () {
    this.status = SessionStatus.ACTIVE;
    this.lastAccessed = new Date().toISOString();
  }

  toJSON () {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      createdAt: this.createdAt,
      lastAccessed: this.lastAccessed,
      projectPath: this.projectPath,
      status: this.status,
      tags: this.tags,
      visibility: this.visibility,
      configuration: this.configuration,
      conversation: this.conversation,
      context: this.context,
      state: this.state,
      metadata: this.metadata,
    };
  }

  static fromJSON (data) {
    return new Session(data);
  }
}

export class SessionTemplate extends Session {
  constructor (data = {}) {
    super(data);
    this.status = SessionStatus.TEMPLATE;
    this.templateType = data.templateType || "general";
    this.description = data.description || "";
    this.categories = data.categories || [];
    this.usageCount = data.usageCount || 0;
  }

  applyToSession (session) {
    // Apply template configuration to a session
    if (this.configuration) {
      session.configuration = {
        ...session.configuration,
        ...this.configuration,
      };
    }

    if (this.state?.aiContext) {
      session.state.aiContext = {
        ...session.state.aiContext,
        ...this.state.aiContext,
      };
    }

    // Add template tags
    if (this.tags.length > 0) {
      session.tags = [...new Set([...session.tags, ...this.tags])];
    }

    this.usageCount++;
    return session;
  }
}

export class SessionContext {
  constructor (session, fileSystem, configManager, storage = null) {
    this.session = session;
    this.fileSystem = fileSystem;
    this.configManager = configManager;
    this.storage = storage;
    this.autoSaveInterval = null;
    this.autoSaveEnabled = true;
    this.autoSaveIntervalMs = 30000; // 30 seconds
  }

  startAutoSave () {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    if (this.autoSaveEnabled) {
      this.autoSaveInterval = setInterval(() => {
        this.save();
      }, this.autoSaveIntervalMs);
    }
  }

  stopAutoSave () {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  async save () {
    // Update timestamp
    this.session.lastAccessed = new Date().toISOString();

    // Update metadata
    this.session.metadata.size = JSON.stringify(this.session.toJSON()).length;
    this.session.metadata.messageCount =
      this.session.conversation.messages.length;

    // Save to storage if storage is available
    if (this.storage) {
      return await this.storage.saveSession(this.session);
    }

    return this.session;
  }

  async trackFileRead (filePath) {
    this.session.addFileOperation("read", filePath);
    return this.save();
  }

  async trackFileWrite (filePath, content) {
    const size = content?.length || 0;
    this.session.addFileOperation("write", filePath, { size });
    return this.save();
  }

  async trackFileDelete (filePath) {
    this.session.addFileOperation("delete", filePath);
    return this.save();
  }

  async updateProjectContext () {
    // Update project type and dependencies
    const projectType = this.detectProjectType(this.session.projectPath);
    this.session.context.projectType = projectType;

    // Detect dependencies based on project type
    this.session.context.dependencies =
      await this.detectDependencies(projectType);

    return this.save();
  }

  detectProjectType (projectPath) {
    // Implement project type detection
    return "unknown";
  }

  async detectDependencies (projectType) {
    // Implement dependency detection based on project type
    return [];
  }

  getRecentFiles (limit = 10) {
    return this.session.context.recentFiles.slice(0, limit);
  }

  getConversationSummary () {
    return this.session.conversation.summary;
  }

  getMessageCount () {
    return this.session.conversation.messages.length;
  }

  getContext () {
    return this.session.context;
  }

  setContext (context) {
    this.session.context = context;
  }

  cleanup () {
    this.stopAutoSave();
  }
}
