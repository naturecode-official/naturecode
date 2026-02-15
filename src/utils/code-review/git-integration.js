// Git PR/MR integration for code review workflow

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { TeamCodeReviewer } from "./team-reviewer.js";

const execAsync = promisify(exec);

export class GitReviewIntegration {
  constructor(options = {}) {
    this.options = {
      gitPath: "git",
      remoteName: "origin",
      baseBranch: "main",
      ...options,
    };

    this.reviewer = new TeamCodeReviewer(options.reviewerContext);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      // Check if we're in a git repository
      await this.runGitCommand("rev-parse --git-dir");

      // Initialize team standards
      await this.reviewer.initialize();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize Git integration:", error.message);
      return false;
    }
  }

  async runGitCommand(command) {
    const fullCommand = `${this.options.gitPath} ${command}`;
    try {
      const { stdout, stderr } = await execAsync(fullCommand);
      if (stderr && !stderr.includes("warning:")) {
        console.warn("Git stderr:", stderr);
      }
      return stdout.trim();
    } catch (error) {
      throw new Error(`Git command failed: ${fullCommand}\n${error.message}`);
    }
  }

  async getCurrentBranch() {
    const branch = await this.runGitCommand("branch --show-current");
    return branch;
  }

  async getChangedFiles(targetBranch = null) {
    const baseBranch = targetBranch || this.options.baseBranch;
    const currentBranch = await this.getCurrentBranch();

    if (currentBranch === baseBranch) {
      throw new Error(
        `Current branch is ${baseBranch}. Switch to a feature branch first.`,
      );
    }

    // Get files changed between current branch and base branch
    const diffOutput = await this.runGitCommand(
      `diff --name-only ${baseBranch}...${currentBranch}`,
    );

    if (!diffOutput) {
      return [];
    }

    const files = diffOutput
      .split("\n")
      .filter((file) => file.trim().length > 0);
    return files;
  }

  async getFileDiff(filePath, targetBranch = null) {
    const baseBranch = targetBranch || this.options.baseBranch;
    const currentBranch = await this.getCurrentBranch();

    try {
      const diff = await this.runGitCommand(
        `diff ${baseBranch}...${currentBranch} -- "${filePath}"`,
      );
      return diff;
    } catch (error) {
      console.warn(`Failed to get diff for ${filePath}:`, error.message);
      return null;
    }
  }

  async reviewPullRequest(options = {}) {
    await this.initialize();

    const {
      targetBranch = null,
      includeUnchanged = false,
      reviewNewFilesOnly = true,
      outputFormat = "json",
      createComments = false,
    } = options;

    const changedFiles = await this.getChangedFiles(targetBranch);

    if (changedFiles.length === 0) {
      return {
        summary: "No files changed in this pull request",
        files: [],
        totalIssues: 0,
        standardsCompliance: 100,
      };
    }

    const reviewResults = [];
    let totalIssues = 0;

    for (const filePath of changedFiles) {
      try {
        // Check if file exists
        await fs.access(filePath);

        // Get file content
        const content = await fs.readFile(filePath, "utf-8");

        // Get diff for context
        const diff = await this.getFileDiff(filePath, targetBranch);

        // Review the file
        const result = await this.reviewer.reviewFile(filePath, {
          content,
          diff,
          reviewNewFilesOnly,
        });

        if (result.issues && result.issues.length > 0) {
          totalIssues += result.issues.length;
        }

        reviewResults.push({
          filePath,
          issues: result.issues || [],
          standardsViolations: result.standardsViolations || [],
          diff: diff,
          reviewResult: result,
        });
      } catch (error) {
        console.warn(`Failed to review ${filePath}:`, error.message);
        reviewResults.push({
          filePath,
          error: error.message,
          issues: [],
          standardsViolations: [],
        });
      }
    }

    // Generate team report
    const teamReport = this.reviewer.teamStandards.generateTeamReport(
      reviewResults.map((r) => r.reviewResult).filter((r) => r),
    );

    const prReview = {
      branch: await this.getCurrentBranch(),
      baseBranch: targetBranch || this.options.baseBranch,
      changedFiles: changedFiles.length,
      reviewedFiles: reviewResults.length,
      totalIssues,
      standardsCompliance: teamReport.standardsCompliance,
      reviewResults,
      teamReport,
      timestamp: new Date().toISOString(),
    };

    // Export report in requested format
    if (outputFormat !== "json") {
      prReview.formattedReport = await this.reviewer.exportTeamReport(
        reviewResults.map((r) => r.reviewResult).filter((r) => r),
        outputFormat,
      );
    }

    // Create Git comments if requested
    if (createComments) {
      await this.createReviewComments(prReview);
    }

    return prReview;
  }

  async createReviewComments(prReview) {
    // This is a simplified implementation
    // In a real implementation, you'd integrate with GitHub/GitLab/Bitbucket APIs

    const comments = [];

    for (const fileReview of prReview.reviewResults) {
      if (!fileReview.issues || fileReview.issues.length === 0) {
        continue;
      }

      for (const issue of fileReview.issues) {
        comments.push({
          file: fileReview.filePath,
          line: issue.line,
          body: `**${issue.severity.toUpperCase()}**: ${issue.message}\n\n**Suggestion**: ${issue.suggestion}`,
          severity: issue.severity,
          category: issue.category,
        });
      }
    }

    // Save comments to a file for manual review
    const commentsFile = ".naturecode/pr-review-comments.json";
    await fs.writeFile(
      commentsFile,
      JSON.stringify(comments, null, 2),
      "utf-8",
    );

    console.log(`Review comments saved to ${commentsFile}`);
    console.log(`Total comments: ${comments.length}`);

    return comments;
  }

  async reviewCommit(commitHash, options = {}) {
    await this.initialize();

    const { outputFormat = "json", includeParent = true } = options;

    // Get files changed in this commit
    const diffOutput = await this.runGitCommand(
      includeParent
        ? `diff --name-only ${commitHash}^..${commitHash}`
        : `show --name-only --pretty=format: ${commitHash}`,
    );

    const changedFiles = diffOutput
      .split("\n")
      .filter((file) => file.trim().length > 0);

    if (changedFiles.length === 0) {
      return {
        commit: commitHash,
        summary: "No files changed in this commit",
        files: [],
        totalIssues: 0,
      };
    }

    const reviewResults = [];
    let totalIssues = 0;

    for (const filePath of changedFiles) {
      try {
        // Get file content at this commit
        const content = await this.runGitCommand(
          `show ${commitHash}:${filePath}`,
        );

        // Get diff for this commit
        const diff = await this.runGitCommand(
          includeParent
            ? `diff ${commitHash}^..${commitHash} -- "${filePath}"`
            : `show ${commitHash} -- "${filePath}"`,
        );

        // Review the file
        const result = await this.reviewer.reviewFile(filePath, {
          content,
          diff,
        });

        if (result.issues && result.issues.length > 0) {
          totalIssues += result.issues.length;
        }

        reviewResults.push({
          filePath,
          issues: result.issues || [],
          standardsViolations: result.standardsViolations || [],
          diff: diff,
          reviewResult: result,
        });
      } catch (error) {
        console.warn(
          `Failed to review ${filePath} in commit ${commitHash}:`,
          error.message,
        );
        reviewResults.push({
          filePath,
          error: error.message,
          issues: [],
          standardsViolations: [],
        });
      }
    }

    const commitReview = {
      commit: commitHash,
      changedFiles: changedFiles.length,
      reviewedFiles: reviewResults.length,
      totalIssues,
      reviewResults,
      timestamp: new Date().toISOString(),
    };

    return commitReview;
  }

  async createReviewChecklist(prReview) {
    const checklist = {
      required: [],
      recommended: [],
      optional: [],
    };

    // Categorize issues for checklist
    for (const fileReview of prReview.reviewResults) {
      for (const issue of fileReview.issues) {
        const checklistItem = {
          file: fileReview.filePath,
          line: issue.line,
          description: issue.message,
          suggestion: issue.suggestion,
          rule: issue.ruleId,
        };

        switch (issue.severity) {
          case "critical":
          case "high":
            checklist.required.push(checklistItem);
            break;
          case "medium":
            checklist.recommended.push(checklistItem);
            break;
          case "low":
          case "info":
            checklist.optional.push(checklistItem);
            break;
        }
      }
    }

    return checklist;
  }

  async generateReviewSummary(prReview, format = "markdown") {
    const summary = {
      title: `Code Review Summary - ${prReview.branch}`,
      stats: {
        filesChanged: prReview.changedFiles,
        filesReviewed: prReview.reviewedFiles,
        totalIssues: prReview.totalIssues,
        standardsCompliance: prReview.standardsCompliance,
        issuesBySeverity: prReview.teamReport?.summary?.issuesBySeverity || {},
        issuesByCategory: prReview.teamReport?.summary?.issuesByCategory || {},
      },
      checklist: await this.createReviewChecklist(prReview),
      recommendations: prReview.teamReport?.recommendations || [],
      timestamp: prReview.timestamp,
    };

    switch (format.toLowerCase()) {
      case "markdown":
        return this.formatSummaryAsMarkdown(summary);

      case "json":
        return JSON.stringify(summary, null, 2);

      default:
        return JSON.stringify(summary, null, 2);
    }
  }

  formatSummaryAsMarkdown(summary) {
    let markdown = `# ${summary.title}\n\n`;

    markdown += `## Statistics\n\n`;
    markdown += `- **Files Changed**: ${summary.stats.filesChanged}\n`;
    markdown += `- **Files Reviewed**: ${summary.stats.filesReviewed}\n`;
    markdown += `- **Total Issues**: ${summary.stats.totalIssues}\n`;
    markdown += `- **Standards Compliance**: ${summary.stats.standardsCompliance}%\n\n`;

    if (Object.keys(summary.stats.issuesBySeverity).length > 0) {
      markdown += `### Issues by Severity\n\n`;
      for (const [severity, count] of Object.entries(
        summary.stats.issuesBySeverity,
      )) {
        markdown += `- **${severity}**: ${count}\n`;
      }
      markdown += `\n`;
    }

    if (Object.keys(summary.stats.issuesByCategory).length > 0) {
      markdown += `### Issues by Category\n\n`;
      for (const [category, count] of Object.entries(
        summary.stats.issuesByCategory,
      )) {
        markdown += `- **${category}**: ${count}\n`;
      }
      markdown += `\n`;
    }

    // Checklist
    markdown += `## Review Checklist\n\n`;

    if (summary.checklist.required.length > 0) {
      markdown += `### Required Fixes (${summary.checklist.required.length})\n\n`;
      for (const item of summary.checklist.required) {
        markdown += `- [ ] **${item.file}:${item.line}** - ${item.description}\n`;
        markdown += `  - *Suggestion*: ${item.suggestion}\n`;
      }
      markdown += `\n`;
    }

    if (summary.checklist.recommended.length > 0) {
      markdown += `### Recommended Fixes (${summary.checklist.recommended.length})\n\n`;
      for (const item of summary.checklist.recommended) {
        markdown += `- [ ] **${item.file}:${item.line}** - ${item.description}\n`;
        markdown += `  - *Suggestion*: ${item.suggestion}\n`;
      }
      markdown += `\n`;
    }

    if (summary.checklist.optional.length > 0) {
      markdown += `### Optional Improvements (${summary.checklist.optional.length})\n\n`;
      for (const item of summary.checklist.optional) {
        markdown += `- [ ] **${item.file}:${item.line}** - ${item.description}\n`;
        markdown += `  - *Suggestion*: ${item.suggestion}\n`;
      }
      markdown += `\n`;
    }

    // Recommendations
    if (summary.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      for (const rec of summary.recommendations) {
        markdown += `- **${rec.priority.toUpperCase()}**: ${rec.message}\n`;
      }
    }

    markdown += `\n---\n`;
    markdown += `*Generated on ${summary.timestamp}*\n`;

    return markdown;
  }

  async saveReviewToFile(prReview, outputPath = null) {
    const defaultPath = `.naturecode/reviews/pr-${prReview.branch}-${Date.now()}.json`;
    const filePath = outputPath || defaultPath;

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Save review
    await fs.writeFile(filePath, JSON.stringify(prReview, null, 2), "utf-8");

    // Also save markdown summary
    const summaryMarkdown = await this.generateReviewSummary(
      prReview,
      "markdown",
    );
    const summaryPath = filePath.replace(".json", ".md");
    await fs.writeFile(summaryPath, summaryMarkdown, "utf-8");

    return {
      jsonPath: filePath,
      markdownPath: summaryPath,
    };
  }

  async loadReviewFromFile(filePath) {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  }

  async compareReviews(review1, review2) {
    const comparison = {
      addedIssues: [],
      removedIssues: [],
      unchangedIssues: [],
      stats: {
        review1: {
          totalIssues: review1.totalIssues,
          standardsCompliance: review1.standardsCompliance,
        },
        review2: {
          totalIssues: review2.totalIssues,
          standardsCompliance: review2.standardsCompliance,
        },
        improvement: review2.totalIssues < review1.totalIssues,
        complianceChange:
          review2.standardsCompliance - review1.standardsCompliance,
      },
    };

    // Simple comparison based on issue counts
    // In a real implementation, you'd compare specific issues

    return comparison;
  }
}
