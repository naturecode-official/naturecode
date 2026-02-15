# NatureCode Session Management Design

## Overview

This document outlines the design for NatureCode's multi-session management system (v1.4.0). The session management system will allow users to save, restore, and manage multiple AI chat sessions with project context preservation.

## Architecture Goals

1. **Session Persistence**: Save and restore chat sessions across application restarts
2. **Context Awareness**: Maintain project context and file system state
3. **Session Isolation**: Keep sessions separate with their own state
4. **Performance**: Efficient session storage and retrieval
5. **User Experience**: Intuitive session management interface

## Session Components

### 1. Chat Session

- Conversation history with AI
- Model configuration and settings
- Timestamps and metadata

### 2. Project Context

- Current working directory
- Recent file operations
- Open files and editors
- Project configuration

### 3. File System State

- File cache state
- Directory structure
- File modifications
- Backup history

### 4. AI Context

- Model-specific context window
- System prompts and instructions
- Conversation summary
- Relevant code snippets

## Session Storage Structure

### Session Directory Layout

```
~/.naturecode/sessions/
├── active/
│   ├── session-1234567890.json    # Active session
│   └── session-0987654321.json    # Another active session
├── archived/
│   ├── project-a/
│   │   ├── session-20240213-1.json
│   │   └── session-20240213-2.json
│   └── project-b/
│       └── session-20240212-1.json
├── templates/
│   ├── code-review.json
│   ├── debugging.json
│   └── brainstorming.json
└── metadata.json                  # Session index and metadata
```

### Session File Format

```json
{
  "id": "session-1234567890",
  "name": "API Development Session",
  "createdAt": "2024-02-13T10:30:00Z",
  "lastAccessed": "2024-02-13T11:45:00Z",
  "projectPath": "/Users/developer/projects/api-service",
  "status": "active",
  "tags": ["api", "development", "nodejs"],

  "configuration": {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "temperature": 0.7,
    "maxTokens": 2000,
    "stream": true
  },

  "conversation": {
    "messages": [
      {
        "role": "user",
        "content": "Help me design a REST API for user management",
        "timestamp": "2024-02-13T10:30:15Z"
      },
      {
        "role": "assistant",
        "content": "I'll help you design a REST API for user management...",
        "timestamp": "2024-02-13T10:30:45Z"
      }
    ],
    "summary": "Designing user management REST API with authentication",
    "tokenCount": 1250
  },

  "context": {
    "workingDirectory": "/Users/developer/projects/api-service",
    "recentFiles": [
      "src/routes/users.js",
      "src/models/User.js",
      "package.json"
    ],
    "fileOperations": [
      {
        "type": "read",
        "path": "src/routes/users.js",
        "timestamp": "2024-02-13T10:31:00Z"
      }
    ],
    "projectType": "nodejs",
    "dependencies": ["express", "mongoose", "jsonwebtoken"]
  },

  "state": {
    "fileCache": {
      "src/routes/users.js": {
        "hash": "abc123",
        "lastModified": "2024-02-13T10:30:00Z"
      }
    },
    "aiContext": {
      "systemPrompt": "You are a senior backend developer...",
      "contextWindow": ["user-management", "authentication", "rest-api"]
    }
  }
}
```

## Session Management Features

### 1. Session Creation and Naming

```bash
# Start new session with custom name
naturecode start --session "API Development"

# Start session with specific project
naturecode start --project ./my-project --session "Project Analysis"

# Create session from template
naturecode start --template code-review --session "Code Review Session"
```

### 2. Session Listing and Switching

```bash
# List all sessions
naturecode session list

# List sessions by project
naturecode session list --project ./my-project

# List sessions by tag
naturecode session list --tag api

# Switch to existing session
naturecode session switch session-1234567890

# Resume last session
naturecode session resume
```

### 3. Session Management

```bash
# Save current session
naturecode session save --name "Important Discussion"

# Archive session
naturecode session archive session-1234567890

# Restore archived session
naturecode session restore session-20240213-1

# Delete session
naturecode session delete session-1234567890

# Rename session
naturecode session rename session-1234567890 "New Session Name"

# Tag session
naturecode session tag session-1234567890 api backend
```

### 4. Session Export and Import

```bash
# Export session to file
naturecode session export session-1234567890 --output session.json

# Import session from file
naturecode session import session.json --name "Imported Session"

# Export session as markdown
naturecode session export session-1234567890 --format markdown --output notes.md

# Share session (encrypted)
naturecode session share session-1234567890 --recipient user@example.com
```

### 5. Session Templates

```bash
# List available templates
naturecode template list

# Create session from template
naturecode start --template code-review

# Create custom template
naturecode template create my-template --description "My custom session template"

# Apply template to existing session
naturecode session apply-template session-1234567890 --template debugging
```

## Session Context Management

### 1. Project Context Preservation

```javascript
// Context tracking
const sessionContext = {
  project: {
    path: "/Users/developer/projects/api-service",
    type: "nodejs",
    config: {
      dependencies: ["express", "mongoose"],
      scripts: {
        start: "node src/index.js",
        test: "jest",
      },
    },
  },

  files: {
    open: ["src/routes/users.js", "src/models/User.js"],
    recent: ["package.json", "README.md"],
    modified: ["src/routes/users.js"],
  },

  git: {
    branch: "feature/user-management",
    status: "clean",
    recentCommits: ["Add user model", "Implement auth middleware"],
  },
};
```

### 2. Context-Aware AI Prompts

```javascript
// Automatic context injection
function enhancePromptWithContext(userPrompt, sessionContext) {
  const contextSummary = `
Project Context:
- Project: ${sessionContext.project.path}
- Type: ${sessionContext.project.type}
- Open files: ${sessionContext.files.open.join(", ")}
- Recent changes: ${sessionContext.files.modified.join(", ")}
- Git branch: ${sessionContext.git.branch}
`;

  return `${contextSummary}\n\nUser Request: ${userPrompt}`;
}
```

### 3. Context Window Management

```javascript
// Maintain relevant context within token limits
class ContextManager {
  constructor(maxTokens = 4000) {
    this.maxTokens = maxTokens;
    this.contextItems = [];
  }

  addContext(item, tokens) {
    this.contextItems.push({ item, tokens, timestamp: Date.now() });
    this.trimContext();
  }

  trimContext() {
    let totalTokens = this.contextItems.reduce(
      (sum, item) => sum + item.tokens,
      0,
    );

    // Remove oldest items if over limit
    while (totalTokens > this.maxTokens && this.contextItems.length > 0) {
      const removed = this.contextItems.shift();
      totalTokens -= removed.tokens;
    }
  }

  getContext() {
    return this.contextItems.map((item) => item.item).join("\n");
  }
}
```

## Session Storage Implementation

### 1. Storage Backend

```javascript
class SessionStorage {
  constructor(basePath = "~/.naturecode/sessions") {
    this.basePath = path.resolve(basePath);
    this.ensureDirectoryStructure();
  }

  ensureDirectoryStructure() {
    const dirs = ["active", "archived", "templates", "backups"];
    dirs.forEach((dir) => {
      fs.mkdirSync(path.join(this.basePath, dir), { recursive: true });
    });
  }

  async saveSession(session) {
    const sessionId = session.id || this.generateSessionId();
    const sessionPath = path.join(this.basePath, "active", `${sessionId}.json`);

    // Add metadata
    session.id = sessionId;
    session.lastAccessed = new Date().toISOString();

    // Save session
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

    // Update metadata index
    await this.updateMetadata(session);

    return sessionId;
  }

  async loadSession(sessionId) {
    const sessionPath = path.join(this.basePath, "active", `${sessionId}.json`);

    if (!fs.existsSync(sessionPath)) {
      // Check archived sessions
      const archivedPath = await this.findArchivedSession(sessionId);
      if (archivedPath) {
        return this.loadFromPath(archivedPath);
      }
      throw new Error(`Session ${sessionId} not found`);
    }

    return this.loadFromPath(sessionPath);
  }

  async archiveSession(sessionId) {
    const session = await this.loadSession(sessionId);
    const projectName = this.getProjectName(session.projectPath);
    const archivePath = path.join(
      this.basePath,
      "archived",
      projectName,
      `${sessionId}.json`,
    );

    // Move to archived
    await fs.mkdir(path.dirname(archivePath), { recursive: true });
    await fs.rename(
      path.join(this.basePath, "active", `${sessionId}.json`),
      archivePath,
    );

    // Update metadata
    session.status = "archived";
    await this.updateMetadata(session);
  }
}
```

### 2. Session Metadata Index

```javascript
// metadata.json
{
  "sessions": {
    "session-1234567890": {
      "id": "session-1234567890",
      "name": "API Development Session",
      "projectPath": "/Users/developer/projects/api-service",
      "createdAt": "2024-02-13T10:30:00Z",
      "lastAccessed": "2024-02-13T11:45:00Z",
      "status": "active",
      "tags": ["api", "development"],
      "size": "15.2KB",
      "messageCount": 42
    }
  },
  "projects": {
    "/Users/developer/projects/api-service": {
      "sessionCount": 3,
      "lastSession": "session-1234567890",
      "totalMessages": 127
    }
  },
  "statistics": {
    "totalSessions": 15,
    "activeSessions": 3,
    "archivedSessions": 12,
    "totalMessages": 842,
    "totalStorage": "2.1MB"
  }
}
```

## Session Recovery and Continuity

### 1. Auto-Save Mechanism

```javascript
class AutoSaveManager {
  constructor(sessionId, interval = 30000) {
    // 30 seconds
    this.sessionId = sessionId;
    this.interval = interval;
    this.timer = null;
    this.lastSave = null;
  }

  start() {
    this.timer = setInterval(() => {
      this.saveIfModified();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async saveIfModified() {
    const currentState = this.getCurrentSessionState();
    const lastState = this.lastSave;

    if (!lastState || this.hasStateChanged(currentState, lastState)) {
      await this.saveSession(currentState);
      this.lastSave = currentState;
    }
  }

  hasStateChanged(current, previous) {
    // Compare relevant state fields
    return (
      current.conversation.messages.length !==
        previous.conversation.messages.length ||
      current.context.workingDirectory !== previous.context.workingDirectory ||
      JSON.stringify(current.context.recentFiles) !==
        JSON.stringify(previous.context.recentFiles)
    );
  }
}
```

### 2. Crash Recovery

```javascript
class SessionRecovery {
  constructor() {
    this.recoveryFile = path.join(this.basePath, "recovery.json");
  }

  async saveRecoveryPoint(session) {
    const recoveryData = {
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      lastMessage:
        session.conversation.messages[session.conversation.messages.length - 1],
      context: {
        workingDirectory: session.context.workingDirectory,
        recentFiles: session.context.recentFiles.slice(0, 5),
      },
    };

    await fs.writeFile(
      this.recoveryFile,
      JSON.stringify(recoveryData, null, 2),
    );
  }

  async checkForRecovery() {
    if (fs.existsSync(this.recoveryFile)) {
      const recoveryData = JSON.parse(
        await fs.readFile(this.recoveryFile, "utf8"),
      );

      console.log("Recovery data found from", recoveryData.timestamp);
      console.log("Last message:", recoveryData.lastMessage.content);

      const response = await this.promptForRecovery();
      if (response === "restore") {
        return this.restoreSession(recoveryData);
      } else {
        // Clear recovery file
        await fs.unlink(this.recoveryFile);
      }
    }

    return null;
  }
}
```

## Session Security and Privacy

### 1. Encryption

```javascript
class EncryptedSessionStorage extends SessionStorage {
  constructor(basePath, encryptionKey) {
    super(basePath);
    this.encryptionKey = encryptionKey;
  }

  async saveSession(session) {
    const encryptedSession = await this.encryptSession(session);
    return super.saveSession(encryptedSession);
  }

  async loadSession(sessionId) {
    const encryptedSession = await super.loadSession(sessionId);
    return this.decryptSession(encryptedSession);
  }

  async encryptSession(session) {
    // Encrypt sensitive fields
    const sensitiveData = {
      conversation: session.conversation,
      context: session.context,
    };

    const encrypted = await crypto.encrypt(
      JSON.stringify(sensitiveData),
      this.encryptionKey,
    );

    return {
      ...session,
      encryptedData: encrypted,
      conversation: null,
      context: null,
    };
  }
}
```

### 2. Privacy Controls

```bash
# Enable/disable session saving
naturecode config set session.saveEnabled true

# Set auto-save interval
naturecode config set session.autoSaveInterval 60000

# Configure what gets saved
naturecode config set session.saveConversation true
naturecode config set session.saveFileContents false
naturecode config set session.saveApiKeys false

# Set retention policy
naturecode config set session.retentionDays 30
naturecode config set session.maxSessionsPerProject 10
```

## Performance Optimization

### 1. Lazy Loading

```javascript
class LazySessionLoader {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.metadata = null;
    this.conversation = null;
    this.context = null;
  }

  async getMetadata() {
    if (!this.metadata) {
      this.metadata = await this.loadMetadata();
    }
    return this.metadata;
  }

  async getConversation() {
    if (!this.conversation) {
      const session = await this.loadSession();
      this.conversation = session.conversation;
    }
    return this.conversation;
  }

  async getMessages(limit = 50) {
    const conversation = await this.getConversation();
    return conversation.messages.slice(-limit);
  }
}
```

### 2. Session Compression

```javascript
class SessionCompressor {
  static compressSession(session) {
    // Remove redundant data
    const compressed = {
      ...session,
      conversation: {
        ...session.conversation,
        messages: this.compressMessages(session.conversation.messages),
      },
      context: this.compressContext(session.context),
    };

    return compressed;
  }

  static compressMessages(messages) {
    // Combine consecutive messages from same role
    const compressed = [];
    let current = null;

    for (const message of messages) {
      if (current && current.role === message.role) {
        // Combine with previous message
        current.content += "\n\n" + message.content;
      } else {
        if (current) compressed.push(current);
        current = { ...message };
      }
    }

    if (current) compressed.push(current);
    return compressed;
  }
}
```

## Integration with Existing Features

### 1. Plugin System Integration

```javascript
// Plugins can hook into session lifecycle
pluginContext.events.on("session.created", (session) => {
  console.log(`New session created: ${session.name}`);
});

pluginContext.events.on("session.saved", (sessionId) => {
  console.log(`Session saved: ${sessionId}`);
});

// Plugins can add session metadata
pluginContext.session.addMetadata("myPlugin", {
  customData: "plugin-specific data",
});
```

### 2. Configuration System Integration

```javascript
// Session-specific configuration
const sessionConfig = {
  session: {
    saveEnabled: true,
    autoSaveInterval: 30000,
    retentionDays: 30,
    encryption: {
      enabled: false,
      algorithm: "aes-256-gcm",
    },
    compression: {
      enabled: true,
      level: "medium",
    },
  },
};
```

### 3. File System Integration

```javascript
// Track file operations in session context
class SessionFileTracker {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.fileOperations = [];
  }

  trackRead(filePath) {
    this.fileOperations.push({
      type: "read",
      path: filePath,
      timestamp: new Date().toISOString(),
    });
  }

  trackWrite(filePath, content) {
    this.fileOperations.push({
      type: "write",
      path: filePath,
      timestamp: new Date().toISOString(),
      size: content.length,
    });
  }

  getRecentFiles(limit = 10) {
    return this.fileOperations
      .map((op) => op.path)
      .filter((path, index, self) => self.indexOf(path) === index)
      .slice(0, limit);
  }
}
```

## User Interface

### 1. Session Dashboard

```bash
# Interactive session management
naturecode session dashboard

# Output:
# ┌─────────────────────────────────────────────────────┐
# │ NatureCode Session Dashboard                        │
# ├─────────────────────────────────────────────────────┤
# │ Active Sessions (3)                                 │
# │   • API Development (5 min ago)                     │
# │   • Code Review (1 hour ago)                        │
# │   • Debugging (2 hours ago)                         │
# │                                                     │
# │ Recent Projects                                     │
# │   • /projects/api-service (3 sessions)              │
# │   • /projects/web-app (1 session)                   │
# │                                                     │
# │ Statistics                                          │
# │   • Total sessions: 15                              │
# │   • Total messages: 842                             │
# │   • Storage used: 2.1MB                             │
# └─────────────────────────────────────────────────────┘
```

### 2. Session Search

```bash
# Search sessions by content
naturecode session search "authentication"

# Search sessions by date
naturecode session search --date 2024-02-13

# Search sessions by file
naturecode session search --file src/routes/users.js
```

## Migration and Compatibility

### 1. Migration from v1.3.x

```javascript
class SessionMigration {
  static async migrateFromV1_3() {
    // Convert old chat history to new session format
    const oldHistory = await this.loadOldChatHistory();

    return oldHistory.map((chat) => ({
      id: this.generateSessionId(),
      name: `Migrated: ${new Date(chat.timestamp).toLocaleDateString()}`,
      createdAt: chat.timestamp,
      conversation: {
        messages: chat.messages,
        summary: this.generateSummary(chat.messages),
      },
      context: {
        workingDirectory: process.cwd(),
        recentFiles: [],
      },
    }));
  }
}
```

### 2. Backward Compatibility

```javascript
// Support for loading old session formats
class SessionLoader {
  static async loadSession(sessionPath) {
    const content = await fs.readFile(sessionPath, "utf8");
    const data = JSON.parse(content);

    // Detect version and migrate if needed
    if (!data.version || data.version < "1.4.0") {
      return this.migrateToCurrentVersion(data);
    }

    return data;
  }
}
```

## Testing Strategy

### 1. Unit Tests

- Session creation and saving
- Context management
- Session recovery

### 2. Integration Tests

- Multi-session switching
- Project context preservation
- File system integration

### 3. Performance Tests

- Session loading time
- Storage efficiency
- Memory usage with multiple sessions

### 4. Security Tests

- Session encryption
- Privacy controls
- Access restrictions

## Conclusion

The session management system will significantly enhance NatureCode's usability by allowing developers to maintain context across multiple conversations and projects. By providing robust session persistence, intuitive management tools, and seamless context preservation, we can create a more productive and organized AI-assisted development environment.
