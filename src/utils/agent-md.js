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
   * Analyze user input and extract requirements
   */
  analyzeUserInput(userInput, aiResponse = "") {
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
        return `**${time}**\n👤 ${entry.user}\n🤖 ${entry.ai || "(No response yet)"}\n`;
      })
      .join("\n");
  }

  /**
   * Format time ago in xm xxs format
   */
  _formatTimeAgo(timestamp) {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
      return `${diffSec}s ago`;
    }

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
      return `${diffHour}h ago`;
    }

    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
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
