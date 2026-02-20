// AGENT.md Manager for NatureCode
// Automatically records user requirements, progress, and plans

import fs from "fs";
import path from "path";
import os from "os";

export class AgentMdManager {
  constructor(projectDir = process.cwd()) {
    this.projectDir = projectDir;
    this.agentFilePath = path.join(projectDir, "AGENT.md");
    this.conversationHistory = [];
    this.requirements = [];
    this.completedItems = [];
    this.todos = [];
    this.futurePlans = [];
    this.defaultWorkflows = [];
    this.lastUpdateTime = null;
    this.userLanguage = "en"; // Default to English
  }

  /**
   * Initialize or load existing AGENT.md
   */
  initialize() {
    try {
      if (fs.existsSync(this.agentFilePath)) {
        this._loadFromFile();
      } else {
        this._createNewAgentFile();
      }
      this.lastUpdateTime = new Date();
      return true;
    } catch (error) {
      console.error("Error initializing AGENT.md:", error.message);
      return false;
    }
  }

  /**
   * Create a new AGENT.md file with template
   */
  _createNewAgentFile() {
    const template = `# AGENT.md - Project Development Log

## Project Overview
- **Created**: ${this._formatTimestamp(new Date())}
- **Project Directory**: ${this.projectDir}
- **Managed by**: NatureCode AI Assistant

## User Requirements Summary
*No requirements recorded yet.*

## Completed Items
*Nothing completed yet.*

## Current TODOs
*No TODOs defined yet.*

## Future Plans
*No future plans defined yet.*

## Default Workflows
*No default workflows defined yet.*

## Progress Tracking
- **Last Updated**: ${this._formatTimestamp(new Date())}
- **Requirements**: 0
- **Completed**: 0
- **TODOs**: 0
- **Progress**: 0%

---
*This file is automatically maintained by NatureCode AI Assistant.*
`;

    fs.writeFileSync(this.agentFilePath, template, "utf8");
  }

  /**
   * Load existing AGENT.md content
   */
  _loadFromFile() {
    const content = fs.readFileSync(this.agentFilePath, "utf8");

    // Parse sections
    const sections = this._parseSections(content);

    this.requirements = this._parseList(
      sections["User Requirements Summary"] || "",
    );
    this.completedItems = this._parseList(sections["Completed Items"] || "");
    this.todos = this._parseList(sections["Current TODOs"] || "");
    this.futurePlans = this._parseList(sections["Future Plans"] || "");
    this.defaultWorkflows = this._parseList(
      sections["Default Workflows"] || "",
    );

    // Extract conversation history from Recent Conversation section
    this._parseConversationHistory(sections["Recent Conversation"] || "");

    // Extract last update time
    const progressSection = sections["Progress Tracking"] || "";
    const lastUpdateMatch = progressSection.match(/Last Updated[:\-]\s*(.+)/i);
    if (lastUpdateMatch) {
      this.lastUpdateTime = new Date(lastUpdateMatch[1].trim());
    }
  }

  /**
   * Parse AGENT.md sections
   */
  _parseSections(content) {
    const sections = {};
    const lines = content.split("\n");
    let currentSection = null;
    let sectionContent = [];

    for (const line of lines) {
      const sectionMatch = line.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        if (currentSection) {
          sections[currentSection] = sectionContent.join("\n").trim();
        }
        currentSection = sectionMatch[1].trim();
        sectionContent = [];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = sectionContent.join("\n").trim();
    }

    return sections;
  }

  /**
   * Parse list items from section content
   */
  _parseList(content) {
    const items = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const itemMatch = line.match(/^[*-]\s+(.+)$/);
      if (itemMatch) {
        items.push(itemMatch[1].trim());
      }
    }

    return items;
  }

  /**
   * Parse conversation history from Recent Conversation section
   */
  _parseConversationHistory(content) {
    this.conversationHistory = [];

    if (!content || content.includes("*No recent conversation*")) {
      return;
    }

    const lines = content.split("\n");
    let currentEntry = null;

    for (const line of lines) {
      // Look for timestamp pattern: [HH:MM AM/PM]
      const timestampMatch = line.match(/^\[(.+?)\]\s+(.+)$/);
      if (timestampMatch) {
        const timeStr = timestampMatch[1];
        const rest = timestampMatch[2];

        // Check if this is a user message
        if (rest.startsWith("User:")) {
          if (currentEntry) {
            this.conversationHistory.push(currentEntry);
          }
          currentEntry = {
            timestamp: this._parseTimestamp(timeStr),
            user: rest.substring(5).trim(),
            ai: "",
          };
        } else if (rest.startsWith("AI:")) {
          if (currentEntry) {
            currentEntry.ai = rest.substring(3).trim();
            this.conversationHistory.push(currentEntry);
            currentEntry = null;
          }
        }
      } else if (currentEntry && line.trim().startsWith("AI:")) {
        // Multi-line AI response
        currentEntry.ai += "\n" + line.substring(3).trim();
      }
    }

    if (currentEntry) {
      this.conversationHistory.push(currentEntry);
    }
  }

  /**
   * Parse timestamp from string
   */
  _parseTimestamp(timeStr) {
    try {
      // Try to parse as locale time string
      const now = new Date();
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":");

      let hour = parseInt(hours);
      if (period === "PM" && hour < 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        parseInt(minutes),
      );
      return date;
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Analyze user input and extract requirements
   */
  analyzeUserInput(userInput, aiResponse = "") {
    // Detect user language
    this._detectLanguage(userInput);

    // Add to conversation history
    this.conversationHistory.push({
      timestamp: new Date(),
      user: userInput,
      ai: aiResponse,
    });

    // Extract potential requirements
    const requirements = this._extractRequirements(userInput);

    // Add new requirements
    requirements.forEach((req) => {
      if (!this.requirements.includes(req)) {
        this.requirements.push(req);
      }
    });

    return requirements;
  }

  /**
   * Detect user language from input
   */
  _detectLanguage(userInput) {
    // Simple language detection based on Chinese characters
    const chineseCharPattern = /[\u4e00-\u9fff]/;
    if (chineseCharPattern.test(userInput)) {
      this.userLanguage = "zh";
    } else {
      this.userLanguage = "en";
    }
  }

  /**
   * Extract requirements from user input
   */
  _extractRequirements(userInput) {
    const requirements = [];
    const lowerInput = userInput.toLowerCase();

    // Check for requirement indicators
    const requirementPatterns = [
      /(?:need|want|require|should|must|have to)\s+(.+?)(?:\.|$)/gi,
      /(?:implement|add|create|build|develop|make)\s+(.+?)(?:\.|$)/gi,
      /(?:fix|solve|resolve|address)\s+(.+?)(?:\.|$)/gi,
      /(?:improve|enhance|optimize|upgrade)\s+(.+?)(?:\.|$)/gi,
    ];

    for (const pattern of requirementPatterns) {
      const matches = [...userInput.matchAll(pattern)];
      matches.forEach((match) => {
        const requirement = match[1].trim();
        if (requirement && requirement.length > 5) {
          requirements.push(requirement);
        }
      });
    }

    // If no patterns matched, use the whole input as a potential requirement
    if (requirements.length === 0 && userInput.length > 10) {
      requirements.push(userInput);
    }

    return requirements;
  }

  /**
   * Check if input is a simple command that should be executed immediately
   */
  isSimpleCommand(input) {
    const simpleCommands = [
      "list files",
      "ls",
      "dir",
      "show files",
      "what's here",
      "pwd",
      "where am i",
      "current directory",
      "cd ",
      "change directory",
      "read ",
      "cat ",
      "view ",
      "show ",
      "help",
      "clear",
      "exit",
      "quit",
    ];

    const lowerInput = input.toLowerCase().trim();
    return simpleCommands.some((cmd) => lowerInput.includes(cmd));
  }

  /**
   * Generate TODOs based on requirements and context
   */
  generateTodos(context = "") {
    const newTodos = [];

    // Check default workflows first
    if (this.defaultWorkflows.length > 0) {
      this.defaultWorkflows.forEach((workflow) => {
        newTodos.push(`[Workflow] ${workflow}`);
      });
    }

    // Generate TODOs from requirements
    this.requirements.forEach((requirement) => {
      if (!this.completedItems.some((item) => item.includes(requirement))) {
        // Check if this requirement already has a TODO
        const hasTodo = this.todos.some((todo) =>
          todo.toLowerCase().includes(requirement.toLowerCase()),
        );

        if (!hasTodo) {
          newTodos.push(`Implement: ${requirement}`);
        }
      }
    });

    // Add context-specific TODOs
    if (context) {
      newTodos.push(`[Context] ${context}`);
    }

    // Add to existing TODOs (avoid duplicates)
    newTodos.forEach((todo) => {
      if (!this.todos.includes(todo)) {
        this.todos.push(todo);
      }
    });

    return newTodos;
  }

  /**
   * Mark a TODO as completed
   */
  completeTodo(todoIndex) {
    if (todoIndex >= 0 && todoIndex < this.todos.length) {
      const completed = this.todos.splice(todoIndex, 1)[0];
      this.completedItems.push(completed);
      return completed;
    }
    return null;
  }

  /**
   * Add future plan
   */
  addFuturePlan(plan) {
    if (!this.futurePlans.includes(plan)) {
      this.futurePlans.push(plan);
    }
  }

  /**
   * Check if all TODOs are completed
   */
  areAllTodosCompleted() {
    return this.todos.length === 0;
  }

  /**
   * Save AGENT.md with current state
   */
  save() {
    try {
      const now = new Date();
      const progress = this._calculateProgress();

      const content = `# AGENT.md - Project Development Log

## Project Overview
- **Created**: ${this._formatTimestamp(this.lastUpdateTime || now)}
- **Project Directory**: ${this.projectDir}
- **Managed by**: NatureCode AI Assistant

## User Requirements Summary
${this._formatList(this.requirements)}

## Completed Items
${this._formatList(this.completedItems)}

## Current TODOs
${this._formatList(this.todos)}

## Future Plans
${this._formatList(this.futurePlans)}

## Default Workflows
${this._formatList(this.defaultWorkflows)}

## Progress Tracking
- **Last Updated**: ${this._formatTimestamp(now)}
- **Requirements**: ${this.requirements.length}
- **Completed**: ${this.completedItems.length}
- **TODOs**: ${this.todos.length}
- **Progress**: ${progress}%

## Recent Conversation
${this._formatRecentConversation()}

---
*This file is automatically maintained by NatureCode AI Assistant.*
`;

      fs.writeFileSync(this.agentFilePath, content, "utf8");
      this.lastUpdateTime = now;
      console.log(`Updated AGENT.md at: ${this.agentFilePath}`);
      return true;
    } catch (error) {
      console.error("Error saving AGENT.md:", error.message);
      return false;
    }
  }

  /**
   * Format list items for markdown
   */
  _formatList(items) {
    if (items.length === 0) {
      return "*No items*";
    }
    return items.map((item) => `- ${item}`).join("\n");
  }

  /**
   * Format timestamp
   */
  _formatTimestamp(date) {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  /**
   * Calculate progress percentage
   */
  _calculateProgress() {
    const total = this.requirements.length + this.todos.length;
    if (total === 0) return 0;

    const completed = this.completedItems.length;
    return Math.round((completed / total) * 100);
  }

  /**
   * Format recent conversation
   */
  _formatRecentConversation() {
    const recent = this.conversationHistory.slice(-5); // Last 5 exchanges
    if (recent.length === 0) return "*No recent conversation*";

    return recent
      .map((entry) => {
        const time = this._formatTimeAgo(entry.timestamp);
        return `[${time}] User: ${entry.user}\n      AI: ${entry.ai || "(waiting for response)"}`;
      })
      .join("\n\n");
  }

  /**
   * Format simple timestamp
   */
  _formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";

    try {
      const timeStr = timestamp.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return timeStr;
    } catch (error) {
      return "Recent";
    }
  }

  /**
   * Get summary for AI context
   */
  getContextSummary() {
    return {
      requirements: this.requirements,
      completed: this.completedItems,
      todos: this.todos,
      progress: this._calculateProgress(),
      hasDefaultWorkflows: this.defaultWorkflows.length > 0,
      lastUpdated: this.lastUpdateTime,
      userLanguage: this.userLanguage,
    };
  }

  /**
   * Clear context when needed (but save to AGENT.md first)
   */
  clearContext() {
    // Ensure everything is saved
    this.save();

    // Clear in-memory conversation (but keep requirements/todos)
    this.conversationHistory = [];

    console.log("Context cleared (saved to AGENT.md)");
  }
}

/**
 * Create an AGENT.md manager instance
 */
export function createAgentMdManager(projectDir = process.cwd()) {
  return new AgentMdManager(projectDir);
}
