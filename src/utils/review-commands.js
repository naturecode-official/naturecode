// Code review command handler

import { CodeReviewer } from "./code-review/reviewer.js";
import { SessionIntegratedReviewer } from "./code-review/session-integration.js";
import { ReviewSeverity, ReviewCategory } from "./code-review/types.js";

export class ReviewCommandHandler {
  constructor(config = {}) {
    this.config = config;
    this.reviewers = new Map(); // sessionId -> CodeReviewer
    this.sessionIntegratedReviewers = new Map(); // sessionId -> SessionIntegratedReviewer
  }

  getAvailableCommands() {
    return [
      {
        command: "file",
        description: "Review a single file",
      },
      {
        command: "dir",
        description: "Review a directory",
      },
      {
        command: "project",
        description: "Review current project",
      },
      {
        command: "history",
        description: "Show review history",
      },
      {
        command: "stats",
        description: "Show review statistics",
      },
      {
        command: "compare",
        description: "Compare reviews between sessions",
      },
      {
        command: "rules",
        description: "List available review rules",
      },
      {
        command: "export",
        description: "Export review results",
      },
      {
        command: "import",
        description: "Import review results",
      },
      {
        command: "config",
        description: "Configure review settings",
      },
    ];
  }

  async handleCommand(command, args = {}) {
    switch (command) {
      case "file":
        return await this.handleFileReview(args);
      case "dir":
        return await this.handleDirectoryReview(args);
      case "project":
        return await this.handleProjectReview(args);
      case "history":
        return await this.handleReviewHistory(args);
      case "stats":
        return await this.handleReviewStats(args);
      case "compare":
        return await this.handleCompareReviews(args);
      case "rules":
        return await this.handleListRules(args);
      case "export":
        return await this.handleExportReview(args);
      case "import":
        return await this.handleImportReview(args);
      case "config":
        return await this.handleConfig(args);
      default:
        throw new Error(`Unknown review command: ${command}`);
    }
  }

  async handleFileReview(args) {
    const { file, session, useAI = true, format = "text" } = args;

    if (!file) {
      throw new Error("File path is required");
    }

    const reviewer = await this.getReviewerForSession(session);
    const result = await reviewer.reviewFile(file, { useAI });

    return this.formatReviewResult(result, format);
  }

  async handleDirectoryReview(args) {
    const { dir, session, useAI = true, format = "text", exclude = [] } = args;

    if (!dir) {
      throw new Error("Directory path is required");
    }

    const reviewer = await this.getReviewerForSession(session);
    const result = await reviewer.reviewDirectory(dir, {
      useAI,
      excludePatterns: exclude,
    });

    return this.formatReviewResult(result, format);
  }

  async handleProjectReview(args) {
    const { session, useAI = true, format = "text" } = args;

    const reviewer = await this.getReviewerForSession(session, true);
    const projectPath = process.cwd();
    const result = await reviewer.reviewProject(projectPath, { useAI });

    return this.formatReviewResult(result, format);
  }

  async handleReviewHistory(args) {
    const { session, limit = 10, format = "text" } = args;

    const sessionReviewer = await this.getSessionIntegratedReviewer(session);
    if (!sessionReviewer) {
      throw new Error("Session not found or not active");
    }

    const history = await sessionReviewer.getSessionReviewHistory(
      this.getSessionId(session),
    );

    if (format === "json") {
      return {
        history: history.slice(0, limit),
        total: history.length,
      };
    }

    if (history.length === 0) {
      return "No review history found.";
    }

    let output = `Review History (${history.length} total):\n\n`;
    history.slice(0, limit).forEach((review, index) => {
      output += `${index + 1}. ${review.id}\n`;
      output += `   Date: ${new Date(review.timestamp).toLocaleString()}\n`;
      output += `   Files: ${review.filesReviewed}, Issues: ${review.totalIssues}\n`;
      output += `   Score: ${review.score.toFixed(1)}/100\n`;
      output += `   Summary: ${review.summary}\n\n`;
    });

    return output;
  }

  async handleReviewStats(args) {
    const { session, format = "text" } = args;

    const sessionReviewer = await this.getSessionIntegratedReviewer(session);
    if (!sessionReviewer) {
      throw new Error("Session not found or not active");
    }

    const stats = await sessionReviewer.getSessionReviewStats(
      this.getSessionId(session),
    );

    if (!stats) {
      return "No review statistics available.";
    }

    if (format === "json") {
      return stats;
    }

    let output = "Review Statistics:\n\n";
    output += `Total Reviews: ${stats.totalReviews}\n`;
    output += `Total Files Reviewed: ${stats.totalFilesReviewed}\n`;
    output += `Total Issues Found: ${stats.totalIssuesFound}\n`;
    output += `Average Score: ${stats.averageScore.toFixed(1)}/100\n`;
    output += `Best Score: ${stats.bestScore.toFixed(1)}/100\n`;
    output += `Worst Score: ${stats.worstScore.toFixed(1)}/100\n`;
    output += `Trend: ${stats.trend}\n`;

    if (stats.lastReview) {
      output += `\nLast Review:\n`;
      output += `  Date: ${new Date(stats.lastReview.timestamp).toLocaleString()}\n`;
      output += `  Files: ${stats.lastReview.filesReviewed}\n`;
      output += `  Issues: ${stats.lastReview.totalIssues}\n`;
      output += `  Score: ${stats.lastReview.score.toFixed(1)}/100\n`;
    }

    return output;
  }

  async handleCompareReviews(args) {
    const { session: session1, session2, format = "text" } = args;

    if (!session2) {
      throw new Error("Two session IDs are required for comparison");
    }

    const sessionReviewer = await this.getSessionIntegratedReviewer(session1);
    if (!sessionReviewer) {
      throw new Error("First session not found or not active");
    }

    const comparison = await sessionReviewer.compareSessions(
      this.getSessionId(session1),
      this.getSessionId(session2),
    );

    if (!comparison) {
      return "Insufficient data for comparison.";
    }

    if (format === "json") {
      return comparison;
    }

    let output = "Session Comparison:\n\n";
    output += `Session 1 (${comparison.session1.id}):\n`;
    output += `  Average Score: ${comparison.session1.averageScore.toFixed(1)}/100\n`;
    output += `  Files/Review: ${(comparison.session1.totalFilesReviewed / comparison.session1.totalReviews).toFixed(1)}\n`;
    output += `  Issues/File: ${(comparison.session1.totalIssuesFound / comparison.session1.totalFilesReviewed).toFixed(2)}\n\n`;

    output += `Session 2 (${comparison.session2.id}):\n`;
    output += `  Average Score: ${comparison.session2.averageScore.toFixed(1)}/100\n`;
    output += `  Files/Review: ${(comparison.session2.totalFilesReviewed / comparison.session2.totalReviews).toFixed(1)}\n`;
    output += `  Issues/File: ${(comparison.session2.totalIssuesFound / comparison.session2.totalFilesReviewed).toFixed(2)}\n\n`;

    output += `Comparison:\n`;
    output += `  Score Difference: ${comparison.comparison.scoreDifference.toFixed(1)} points\n`;
    output += `  Files/Review Difference: ${comparison.comparison.filesPerReviewDifference.toFixed(1)}\n`;
    output += `  Issues/File Difference: ${comparison.comparison.issuesPerFileDifference.toFixed(2)}\n`;

    return output;
  }

  async handleListRules(args) {
    const { category, enabled, format = "text" } = args;

    // For now, return placeholder
    // In a real implementation, this would query the RuleRegistry

    const rules = [
      {
        id: "no-hardcoded-secrets",
        name: "No Hardcoded Secrets",
        category: "security",
        severity: "critical",
        enabled: true,
        description: "Detect hardcoded passwords, API keys, and secrets",
      },
      {
        id: "sql-injection",
        name: "SQL Injection Prevention",
        category: "security",
        severity: "critical",
        enabled: true,
        description: "Detect potential SQL injection vulnerabilities",
      },
      {
        id: "n-plus-one-query",
        name: "N+1 Query Problem",
        category: "performance",
        severity: "high",
        enabled: true,
        description: "Detect N+1 query problems in database access",
      },
      {
        id: "memory-leak",
        name: "Memory Leak Detection",
        category: "performance",
        severity: "medium",
        enabled: true,
        description: "Detect potential memory leaks",
      },
    ];

    let filteredRules = rules;
    if (category) {
      filteredRules = filteredRules.filter((rule) =>
        rule.category.toLowerCase().includes(category.toLowerCase()),
      );
    }
    if (enabled !== undefined) {
      filteredRules = filteredRules.filter((rule) => rule.enabled === enabled);
    }

    if (format === "json") {
      return {
        rules: filteredRules,
        total: filteredRules.length,
      };
    }

    if (filteredRules.length === 0) {
      return "No rules found matching criteria.";
    }

    let output = `Available Rules (${filteredRules.length} total):\n\n`;
    filteredRules.forEach((rule, index) => {
      output += `${index + 1}. ${rule.name} [${rule.id}]\n`;
      output += `   Category: ${rule.category}, Severity: ${rule.severity}\n`;
      output += `   Enabled: ${rule.enabled ? "Yes" : "No"}\n`;
      output += `   Description: ${rule.description}\n\n`;
    });

    return output;
  }

  async handleExportReview(args) {
    const { session, reviewId, format = "json", output } = args;

    if (!reviewId) {
      throw new Error("Review ID is required");
    }

    const sessionReviewer = await this.getSessionIntegratedReviewer(session);
    if (!sessionReviewer) {
      throw new Error("Session not found or not active");
    }

    const filePath = await sessionReviewer.exportReviewResult(
      this.getSessionId(session),
      reviewId,
      format,
    );

    return {
      message: `Review exported to: ${filePath}`,
      filePath,
    };
  }

  async handleImportReview(args) {
    const { session, file, format = "json" } = args;

    if (!file) {
      throw new Error("File path is required");
    }

    const sessionReviewer = await this.getSessionIntegratedReviewer(session);
    if (!sessionReviewer) {
      throw new Error("Session not found or not active");
    }

    const result = await sessionReviewer.importReviewResult(
      this.getSessionId(session),
      file,
    );

    return {
      message: `Review imported: ${result.id}`,
      reviewId: result.id,
      filesReviewed: result.filesReviewed,
      totalIssues: result.totalIssues,
      score: result.calculateScore(),
    };
  }

  async handleConfig(args) {
    // Configuration management placeholder
    return "Configuration management not yet implemented.";
  }

  async getReviewerForSession(sessionId, requireSession = false) {
    const actualSessionId = this.getSessionId(sessionId);

    if (requireSession && !actualSessionId) {
      throw new Error("Active session is required for this command");
    }

    if (this.reviewers.has(actualSessionId)) {
      return this.reviewers.get(actualSessionId);
    }

    // Create new reviewer
    const reviewer = new CodeReviewer({
      sessionId: actualSessionId,
      projectPath: process.cwd(),
      // In a real implementation, we would get AI provider from config
    });

    this.reviewers.set(actualSessionId, reviewer);
    return reviewer;
  }

  async getSessionIntegratedReviewer(sessionId) {
    const actualSessionId = this.getSessionId(sessionId);

    if (!actualSessionId) {
      return null;
    }

    if (this.sessionIntegratedReviewers.has(actualSessionId)) {
      return this.sessionIntegratedReviewers.get(actualSessionId);
    }

    // In a real implementation, we would get sessionManager from somewhere
    // For now, return null to indicate session integration is not available
    return null;
  }

  getSessionId(sessionParam) {
    if (!sessionParam) {
      // Try to get current session from somewhere
      // For now, return null
      return null;
    }

    if (sessionParam === "current") {
      // Get current session ID
      // For now, return a placeholder
      return "current-session";
    }

    return sessionParam;
  }

  formatReviewResult(result, format) {
    if (format === "json") {
      return result.toJSON();
    }

    if (format === "markdown") {
      return this.formatAsMarkdown(result);
    }

    return this.formatAsText(result);
  }

  formatAsText(result) {
    let output = `Code Review Results\n`;
    output += `===================\n\n`;
    output += `Review ID: ${result.id}\n`;
    output += `Session: ${result.sessionId || "N/A"}\n`;
    output += `Project: ${result.projectPath}\n`;
    output += `Files Reviewed: ${result.filesReviewed}\n`;
    output += `Total Issues: ${result.totalIssues}\n`;
    output += `Quality Score: ${result.calculateScore().toFixed(1)}/100\n`;
    output += `Execution Time: ${result.metrics.executionTime}ms\n\n`;

    output += `Summary:\n`;
    output += `${result.summary}\n\n`;

    if (result.totalIssues > 0) {
      output += `Issues by Severity:\n`;
      for (const [severity, count] of Object.entries(result.issuesBySeverity)) {
        if (count > 0) {
          output += `  ${severity}: ${count}\n`;
        }
      }
      output += `\n`;

      output += `Top Issues:\n`;
      const criticalIssues = result.getCriticalIssues();
      const highIssues = result.getIssuesBySeverity(ReviewSeverity.HIGH);

      const topIssues = [...criticalIssues, ...highIssues].slice(0, 10);

      if (topIssues.length === 0) {
        output += `  No critical or high severity issues found.\n`;
      } else {
        topIssues.forEach((issue, index) => {
          output += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
          output += `   File: ${issue.filePath}:${issue.line}\n`;
          if (issue.suggestion) {
            output += `   Suggestion: ${issue.suggestion}\n`;
          }
          output += `\n`;
        });
      }
    }

    if (result.recommendations.length > 0) {
      output += `Recommendations:\n`;
      result.recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
      });
      output += `\n`;
    }

    return output;
  }

  formatAsMarkdown(result) {
    let output = `# Code Review Results\n\n`;
    output += `- **Review ID**: ${result.id}\n`;
    output += `- **Session**: ${result.sessionId || "N/A"}\n`;
    output += `- **Project**: ${result.projectPath}\n`;
    output += `- **Files Reviewed**: ${result.filesReviewed}\n`;
    output += `- **Total Issues**: ${result.totalIssues}\n`;
    output += `- **Quality Score**: ${result.calculateScore().toFixed(1)}/100\n`;
    output += `- **Execution Time**: ${result.metrics.executionTime}ms\n\n`;

    output += `## Summary\n\n`;
    output += `${result.summary}\n\n`;

    if (result.totalIssues > 0) {
      output += `## Issues Breakdown\n\n`;
      output += `| Severity | Count |\n`;
      output += `|----------|-------|\n`;
      for (const [severity, count] of Object.entries(result.issuesBySeverity)) {
        if (count > 0) {
          output += `| ${severity} | ${count} |\n`;
        }
      }
      output += `\n`;

      const criticalIssues = result.getCriticalIssues();
      const highIssues = result.getIssuesBySeverity(ReviewSeverity.HIGH);
      const topIssues = [...criticalIssues, ...highIssues].slice(0, 10);

      if (topIssues.length > 0) {
        output += `## Top Issues\n\n`;
        topIssues.forEach((issue, index) => {
          output += `### ${index + 1}. ${issue.message}\n\n`;
          output += `- **Severity**: ${issue.severity}\n`;
          output += `- **Category**: ${issue.category}\n`;
          output += `- **Location**: ${issue.filePath}:${issue.line}\n`;
          output += `- **Confidence**: ${(issue.confidence * 100).toFixed(0)}%\n\n`;

          if (issue.description) {
            output += `**Description**: ${issue.description}\n\n`;
          }

          if (issue.suggestion) {
            output += `**Suggestion**: ${issue.suggestion}\n\n`;
          }

          if (issue.codeSnippet) {
            output += `\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n`;
          }
        });
      }
    }

    if (result.recommendations.length > 0) {
      output += `## Recommendations\n\n`;
      result.recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
      });
      output += `\n`;
    }

    return output;
  }
}

// Create singleton instance
export const reviewCommandHandler = new ReviewCommandHandler();
