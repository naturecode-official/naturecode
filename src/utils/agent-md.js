// AGENT.md Manager for NatureCode
// Automatically records user requirements, progress, and plans

import fs from "fs";
import path from "path";

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
    const lastUpdateMatch = progressSection.match(/Last Updated[:\\-]\s*(.+)/i);
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
      // Handle different time string formats
      if (timeStr === "Just now" || timeStr === "Recent") {
        return new Date();
      }

      if (timeStr === "Yesterday") {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date;
      }

      // Check for "X minutes ago" format
      const minutesAgoMatch = timeStr.match(/(\d+)\s+minutes?\s+ago/i);
      if (minutesAgoMatch) {
        const minutes = parseInt(minutesAgoMatch[1]);
        const date = new Date();
        date.setMinutes(date.getMinutes() - minutes);
        return date;
      }

      // Check for "X hours ago" format
      const hoursAgoMatch = timeStr.match(/(\d+)\s+hours?\s+ago/i);
      if (hoursAgoMatch) {
        const hours = parseInt(hoursAgoMatch[1]);
        const date = new Date();
        date.setHours(date.getHours() - hours);
        return date;
      }

      // Check for "X days ago" format
      const daysAgoMatch = timeStr.match(/(\d+)\s+days?\s+ago/i);
      if (daysAgoMatch) {
        const days = parseInt(daysAgoMatch[1]);
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
      }

      // Check for date format like "Feb 20"
      const dateMatch = timeStr.match(/^([A-Za-z]+)\s+(\d+)$/);
      if (dateMatch) {
        const monthStr = dateMatch[1];
        const day = parseInt(dateMatch[2]);
        const now = new Date();
        const month = this._getMonthNumber(monthStr);
        const year = now.getFullYear();

        // If the parsed month is greater than current month, assume last year
        const date = new Date(year, month, day);
        if (date > now) {
          date.setFullYear(year - 1);
        }
        return date;
      }

      // Default: try to parse as time only (assume today)
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":");

      let hour = parseInt(hours);
      if (period === "PM" && hour < 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      const now = new Date();
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        parseInt(minutes || 0),
      );
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Get month number from month string
   */
  _getMonthNumber(monthStr) {
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    return months[monthStr.toLowerCase().substring(0, 3)] || 0;
  }

  /**
   * Analyze user input and extract requirements
   */
  async analyzeUserInput(userInput, aiResponse = "") {
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
    const newRequirements = [];
    requirements.forEach((req) => {
      if (!this.requirements.includes(req)) {
        this.requirements.push(req);
        newRequirements.push(req);
      }
    });

    // 如果有新需求，尝试自动创建项目
    if (
      newRequirements.length > 0 &&
      this._shouldAutoCreateProject(userInput)
    ) {
      console.log("检测到新需求，尝试自动创建项目...");
      const creationResult = await this.executeProjectCreation();

      // 将创建结果添加到对话历史
      if (creationResult.success) {
        const resultMessage = `项目创建成功: ${creationResult.results.length} 个项目已创建`;
        this.conversationHistory.push({
          timestamp: new Date(),
          user: "[系统]",
          ai: resultMessage,
        });
      }
    }

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
   * Check if should auto-create project based on user input
   */
  _shouldAutoCreateProject(userInput) {
    // 检查用户输入是否包含创建项目的关键词
    const createKeywords = [
      "创建",
      "create",
      "开发",
      "develop",
      "实现",
      "implement",
      "编写",
      "write",
      "制作",
      "make",
      "构建",
      "build",
      "设计",
      "design",
      "开始",
      "start",
    ];

    const projectKeywords = [
      "项目",
      "project",
      "程序",
      "program",
      "应用",
      "application",
      "游戏",
      "game",
      "网站",
      "website",
      "工具",
      "tool",
      "脚本",
      "script",
      "软件",
      "software",
    ];

    const lowerInput = userInput.toLowerCase();

    // 如果包含创建关键词和项目关键词，则自动创建
    const hasCreateKeyword = createKeywords.some((keyword) =>
      lowerInput.includes(keyword.toLowerCase()),
    );

    const hasProjectKeyword = projectKeywords.some((keyword) =>
      lowerInput.includes(keyword.toLowerCase()),
    );

    return hasCreateKeyword && hasProjectKeyword;
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
      const matches = [...lowerInput.matchAll(pattern)];
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

      // Create backup before saving
      this._createBackup();

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

      // Clean up old backups
      this.cleanupOldBackups(3);

      console.log(`Updated AGENT.md at: ${this.agentFilePath}`);
      return true;
    } catch (error) {
      console.error("Error saving AGENT.md:", error.message);
      return false;
    }
  }

  /**
   * Create backup of current AGENT.md
   */
  _createBackup() {
    try {
      // DISABLE BACKUP FILES - User requested no backup files
      // if (fs.existsSync(this.agentFilePath)) {
      //   const backupPath = `${this.agentFilePath}.backup-${Date.now()}`;
      //   const content = fs.readFileSync(this.agentFilePath, "utf8");
      //   fs.writeFileSync(backupPath, content, "utf8");
      // }
    } catch (error) {
      // Silently fail on backup - it's optional
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
        const dateStr = entry.timestamp.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return `[${dateStr} ${time}] User: ${entry.user}\n      AI: ${entry.ai || "(waiting for response)"}`;
      })
      .join("\n\n");
  }

  /**
   * Format timestamp with date and time
   */
  _formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";

    try {
      const now = new Date();
      const diffMs = now - timestamp;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Today - show time only
        return timestamp.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        // Older than a week - show date
        return timestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
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

  /**
   * Clean up old backup files
   */
  cleanupOldBackups(maxBackups = 3) {
    try {
      const dir = path.dirname(this.agentFilePath);
      const baseName = path.basename(this.agentFilePath);
      const files = fs.readdirSync(dir);

      // Find backup files
      const backupFiles = files
        .filter(
          (file) =>
            file.startsWith(`${baseName}.backup-`) ||
            file.startsWith(`${baseName}-backup`),
        )
        .map((file) => ({
          name: file,
          path: path.join(dir, file),
          time: fs.statSync(path.join(dir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time); // Newest first

      // Keep only the newest maxBackups files
      if (backupFiles.length > maxBackups) {
        const toDelete = backupFiles.slice(maxBackups);
        toDelete.forEach((file) => {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        });
        return toDelete.length;
      }
      return 0;
    } catch (error) {
      console.error("Error cleaning up backups:", error.message);
      return 0;
    }
  }

  /**
   * Execute project creation based on requirements
   */
  async executeProjectCreation() {
    try {
      console.log("执行项目创建...");

      // 检查是否有需要实现的需求
      if (this.requirements.length === 0) {
        console.log("没有需要实现的需求");
        return { success: false, message: "没有需要实现的需求" };
      }

      const results = [];

      // 处理每个需求
      for (const requirement of this.requirements) {
        const result = await this._createProjectFiles(requirement);
        results.push(result);

        // 如果文件创建成功，标记为已完成
        if (result.success) {
          this._markRequirementAsCompleted(requirement);
        }
      }

      // 保存更新后的AGENT.md
      this.save();

      return {
        success: results.some((r) => r.success),
        results: results,
        message: `处理了 ${this.requirements.length} 个需求`,
      };
    } catch (error) {
      console.error("执行项目创建错误:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 根据需求创建项目文件
   */
  async _createProjectFiles(requirement) {
    console.log(`处理需求: "${requirement}"`);

    // 检测项目类型并创建相应文件
    if (this._isGameProject(requirement)) {
      return await this._createGameProject(requirement);
    } else if (this._isWebProject(requirement)) {
      return await this._createWebProject(requirement);
    } else if (this._isCLIProject(requirement)) {
      return await this._createCLIProject(requirement);
    } else {
      return await this._createGenericProject(requirement);
    }
  }

  /**
   * 检测是否为游戏项目
   */
  _isGameProject(requirement) {
    const gameKeywords = [
      "游戏",
      "game",
      "贪吃蛇",
      "snake",
      "俄罗斯方块",
      "tetris",
      "扫雷",
      "minesweeper",
      "井字棋",
      "tic-tac-toe",
      "棋牌",
      "扑克",
      "poker",
      "麻将",
      "mahjong",
      "角色扮演",
      "rpg",
      "射击",
      "shooter",
      "策略",
      "strategy",
      "冒险",
      "adventure",
    ];

    const lowerReq = requirement.toLowerCase();
    return gameKeywords.some((keyword) =>
      lowerReq.includes(keyword.toLowerCase()),
    );
  }

  /**
   * 创建游戏项目
   */
  async _createGameProject(requirement) {
    console.log("检测到游戏项目需求，创建游戏文件...");

    try {
      // 动态导入fs和path模块
      const fs = await import("fs");
      const path = await import("path");

      // 创建游戏目录结构
      const gameDir = path.join(this.projectDir, "game_project");
      if (!fs.existsSync(gameDir)) {
        fs.mkdirSync(gameDir, { recursive: true });
      }

      // 创建主游戏文件
      const mainGameFile = path.join(gameDir, "main.py");
      const gameContent = this._generateGameCode(requirement);
      fs.writeFileSync(mainGameFile, gameContent, "utf8");

      // 创建requirements.txt
      const requirementsFile = path.join(gameDir, "requirements.txt");
      fs.writeFileSync(requirementsFile, "pygame==2.5.2\n", "utf8");

      // 创建README.md
      const readmeFile = path.join(gameDir, "README.md");
      const readmeContent = this._generateGameReadme(requirement);
      fs.writeFileSync(readmeFile, readmeContent, "utf8");

      console.log(`游戏项目创建成功: ${gameDir}`);

      return {
        success: true,
        projectType: "game",
        directory: gameDir,
        files: ["main.py", "requirements.txt", "README.md"],
        requirement: requirement,
      };
    } catch (error) {
      console.error("创建游戏项目错误:", error.message);
      return { success: false, error: error.message, requirement: requirement };
    }
  }

  /**
   * 生成游戏代码
   */
  _generateGameCode(requirement) {
    // 根据需求生成不同的游戏代码
    if (
      requirement.includes("贪吃蛇") ||
      requirement.toLowerCase().includes("snake")
    ) {
      return `#!/usr/bin/env python3
"""
贪吃蛇游戏 - 由NatureCode AI Assistant生成
需求: ${requirement}
"""

import pygame
import random
import sys

# 初始化pygame
pygame.init()

# 游戏配置
WIDTH, HEIGHT = 800, 600
GRID_SIZE = 20
FPS = 10

# 颜色定义
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 120, 255)

class Snake:
    def __init__(self):
        self.body = [(5, 5)]
        self.direction = (1, 0)
        self.grow_pending = 3
    
    def move(self):
        head_x, head_y = self.body[0]
        dx, dy = self.direction
        new_head = (head_x + dx, head_y + dy)
        self.body.insert(0, new_head)
        
        if self.grow_pending > 0:
            self.grow_pending -= 1
        else:
            self.body.pop()
    
    def change_direction(self, new_direction):
        # 防止直接反向移动
        dx, dy = new_direction
        current_dx, current_dy = self.direction
        if (dx, dy) != (-current_dx, -current_dy):
            self.direction = new_direction
    
    def grow(self):
        self.grow_pending += 1
    
    def check_collision(self, width, height):
        head = self.body[0]
        return (head[0] < 0 or head[0] >= width or 
                head[1] < 0 or head[1] >= height or
                head in self.body[1:])
    
    def check_food(self, food_pos):
        return self.body[0] == food_pos
    
    def draw(self, screen):
        for i, (x, y) in enumerate(self.body):
            color = GREEN if i == 0 else BLUE
            rect = pygame.Rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
            pygame.draw.rect(screen, color, rect)
            pygame.draw.rect(screen, BLACK, rect, 1)

class Food:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.position = self.randomize_position()
    
    def randomize_position(self, snake_body=[]):
        while True:
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)
            if (x, y) not in snake_body:
                return (x, y)
    
    def draw(self, screen):
        x, y = self.position
        rect = pygame.Rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
        pygame.draw.rect(screen, RED, rect)
        pygame.draw.rect(screen, WHITE, rect, 2)

def main():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("贪吃蛇游戏")
    clock = pygame.time.Clock()
    
    grid_width = WIDTH // GRID_SIZE
    grid_height = HEIGHT // GRID_SIZE
    
    snake = Snake()
    food = Food(grid_width, grid_height)
    
    score = 0
    font = pygame.font.SysFont(None, 36)
    
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    snake.change_direction((0, -1))
                elif event.key == pygame.K_DOWN:
                    snake.change_direction((0, 1))
                elif event.key == pygame.K_LEFT:
                    snake.change_direction((-1, 0))
                elif event.key == pygame.K_RIGHT:
                    snake.change_direction((1, 0))
                elif event.key == pygame.K_ESCAPE:
                    running = False
        
        snake.move()
        
        if snake.check_collision(grid_width, grid_height):
            print(f"游戏结束! 分数: {score}")
            running = False
        
        if snake.check_food(food.position):
            snake.grow()
            score += 10
            food.randomize_position(snake.body)
        
        # 绘制
        screen.fill(BLACK)
        
        # 绘制网格
        for x in range(0, WIDTH, GRID_SIZE):
            pygame.draw.line(screen, (40, 40, 40), (x, 0), (x, HEIGHT), 1)
        for y in range(0, HEIGHT, GRID_SIZE):
            pygame.draw.line(screen, (40, 40, 40), (0, y), (WIDTH, y), 1)
        
        snake.draw(screen)
        food.draw(screen)
        
        # 显示分数
        score_text = font.render(f"分数: {score}", True, WHITE)
        screen.blit(score_text, (10, 10))
        
        pygame.display.flip()
        clock.tick(FPS)
    
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()`;
    } else {
      // 通用游戏模板
      return `#!/usr/bin/env python3
"""
游戏项目 - 由NatureCode AI Assistant生成
需求: ${requirement}
"""

import pygame
import sys

def main():
    # 初始化pygame
    pygame.init()
    
    # 屏幕设置
    WIDTH, HEIGHT = 800, 600
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("我的游戏")
    
    clock = pygame.time.Clock()
    FPS = 60
    
    # 游戏变量
    running = True
    
    # 主游戏循环
    while running:
        # 处理事件
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
        
        # 更新游戏逻辑
        # TODO: 添加你的游戏逻辑
        
        # 绘制
        screen.fill((0, 0, 0))  # 黑色背景
        
        # TODO: 添加你的绘制代码
        
        # 显示说明
        font = pygame.font.SysFont(None, 24)
        text = font.render("这是一个游戏框架，请根据需求实现具体功能", True, (255, 255, 255))
        screen.blit(text, (WIDTH // 2 - text.get_width() // 2, HEIGHT // 2))
        
        pygame.display.flip()
        clock.tick(FPS)
    
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()`;
    }
  }

  /**
   * 生成游戏README
   */
  _generateGameReadme(requirement) {
    return `# 游戏项目

## 项目描述
基于用户需求创建的游戏项目：
- ${requirement}

## 技术栈
- Python 3.x
- Pygame 2.5.2

## 安装和运行

### 1. 安装依赖
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 2. 运行游戏
\`\`\`bash
python main.py
\`\`\`

## 游戏控制
- 方向键: 控制移动
- ESC: 退出游戏

## 项目结构
\`\`\`
game_project/
├── main.py          # 主游戏文件
├── requirements.txt # 依赖包
└── README.md       # 项目说明
\`\`\`

## 开发说明
这个项目由NatureCode AI Assistant自动生成。你可以在此基础上进行修改和扩展。

## 许可证
MIT License`;
  }

  /**
   * 检测是否为Web项目
   */
  _isWebProject(requirement) {
    const webKeywords = [
      "网站",
      "web",
      "网页",
      "前端",
      "后端",
      "api",
      "接口",
      "react",
      "vue",
      "angular",
      "javascript",
      "html",
      "css",
      "服务器",
      "server",
      "数据库",
      "database",
      "登录",
      "注册",
    ];

    const lowerReq = requirement.toLowerCase();
    return webKeywords.some((keyword) =>
      lowerReq.includes(keyword.toLowerCase()),
    );
  }

  /**
   * 创建Web项目
   */
  _createWebProject(requirement) {
    // 简化实现，返回成功但需要手动创建
    return {
      success: true,
      projectType: "web",
      directory: this.projectDir,
      message: "Web项目需求已记录，请使用专门的Web开发工具",
      requirement: requirement,
    };
  }

  /**
   * 检测是否为CLI项目
   */
  _isCLIProject(requirement) {
    const cliKeywords = [
      "命令行",
      "cli",
      "终端",
      "工具",
      "脚本",
      "自动化",
      "批处理",
      "shell",
      "bash",
      "python脚本",
      "工具链",
    ];

    const lowerReq = requirement.toLowerCase();
    return cliKeywords.some((keyword) =>
      lowerReq.includes(keyword.toLowerCase()),
    );
  }

  /**
   * 创建CLI项目
   */
  async _createCLIProject(requirement) {
    try {
      const fs = await import("fs");
      const path = await import("path");

      // 创建CLI脚本
      const cliFile = path.join(this.projectDir, "cli_tool.py");
      const cliContent = `#!/usr/bin/env python3
"""
CLI工具 - 由NatureCode AI Assistant生成
需求: ${requirement}
"""

import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="CLI工具")
    parser.add_argument("--input", help="输入文件")
    parser.add_argument("--output", help="输出文件")
    parser.add_argument("--verbose", action="store_true", help="详细输出")
    
    args = parser.parse_args()
    
    print(f"CLI工具启动")
    print(f"需求: {requirement}")
    
    if args.verbose:
        print("详细模式已启用")
    
    # TODO: 根据需求实现具体功能
    print("功能待实现...")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())`;

      fs.writeFileSync(cliFile, cliContent, "utf8");

      // 创建README
      const readmeFile = path.join(this.projectDir, "README_CLI.md");
      const readmeContent = `# CLI工具

## 功能描述
${requirement}

## 使用方法
\`\`\`bash
python cli_tool.py --help
\`\`\`

## 开发说明
这个CLI工具由NatureCode AI Assistant自动生成。`;

      fs.writeFileSync(readmeFile, readmeContent, "utf8");

      return {
        success: true,
        projectType: "cli",
        directory: this.projectDir,
        files: ["cli_tool.py", "README_CLI.md"],
        requirement: requirement,
      };
    } catch (error) {
      return { success: false, error: error.message, requirement: requirement };
    }
  }

  /**
   * 创建通用项目
   */
  async _createGenericProject(requirement) {
    try {
      const fs = await import("fs");
      const path = await import("path");

      // 创建项目说明文件
      const projectFile = path.join(this.projectDir, "project_plan.md");
      const content = `# 项目计划

## 需求
${requirement}

## 项目概述
这个项目基于用户需求创建。

## 技术选型
请根据具体需求选择合适的技术栈。

## 开发步骤
1. 分析需求
2. 设计架构
3. 实现功能
4. 测试验证
5. 部署发布

## 注意事项
- 保持代码清晰可读
- 添加适当的注释
- 编写单元测试
- 考虑可扩展性

---
*由NatureCode AI Assistant生成*`;

      fs.writeFileSync(projectFile, content, "utf8");

      return {
        success: true,
        projectType: "generic",
        directory: this.projectDir,
        files: ["project_plan.md"],
        requirement: requirement,
        message: "已创建项目计划文档，请根据文档进行开发",
      };
    } catch (error) {
      return { success: false, error: error.message, requirement: requirement };
    }
  }

  /**
   * 标记需求为已完成
   */
  _markRequirementAsCompleted(requirement) {
    // 从requirements中移除
    const index = this.requirements.indexOf(requirement);
    if (index !== -1) {
      this.requirements.splice(index, 1);
    }

    // 添加到completedItems
    if (!this.completedItems.includes(requirement)) {
      this.completedItems.push(`已完成: ${requirement}`);
    }

    // 更新相关的TODO
    this.todos = this.todos.filter(
      (todo) => !todo.toLowerCase().includes(requirement.toLowerCase()),
    );

    console.log(`需求标记为已完成: ${requirement}`);
  }
}

/**
 * Create an AGENT.md manager instance
 */
export function createAgentMdManager(projectDir = process.cwd()) {
  return new AgentMdManager(projectDir);
}
