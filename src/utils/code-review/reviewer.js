// Main code reviewer class

import path from "path";
import fs from "fs/promises";
import {
  ReviewResult,
  ReviewContext,
  ReviewStatus,
  ReviewSeverity,
  ReviewCategory,
} from "./types.js";
import { RuleRegistry } from "./rules/registry.js";
import { AICodeReviewer } from "./ai-reviewer.js";

export class CodeReviewer {
  constructor(context = {}) {
    this.context = new ReviewContext(context);
    this.ruleRegistry = new RuleRegistry();
    this.aiReviewer = context.aiProvider
      ? new AICodeReviewer(context.aiProvider)
      : null;
    this.results = new Map(); // reviewId -> ReviewResult
    this.stats = {
      totalReviews: 0,
      totalFilesReviewed: 0,
      totalIssuesFound: 0,
      averageScore: 0,
    };
  }

  async reviewFile(filePath, options = {}) {
    const startTime = Date.now();

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const ext = path.extname(filePath).toLowerCase();
      const language = this.getLanguageFromExtension(ext);

      const result = new ReviewResult({
        sessionId: this.context.sessionId,
        projectPath: this.context.projectPath || path.dirname(filePath),
        filesReviewed: 1,
        status: ReviewStatus.IN_PROGRESS,
      });

      // Run rule-based checks
      const ruleIssues = await this.runRuleChecks(filePath, content, language);
      for (const issue of ruleIssues) {
        result.addIssue(issue);
      }

      // Run AI-based review if available and enabled
      if (
        this.aiReviewer &&
        options.useAI !== false &&
        this.shouldUseAIReview(filePath, content)
      ) {
        const aiIssues = await this.aiReviewer.reviewFile(
          filePath,
          content,
          language,
          {
            existingIssues: ruleIssues,
            context: this.context,
          },
        );
        for (const issue of aiIssues) {
          result.addIssue(issue);
        }
      }

      // Calculate metrics
      result.metrics.executionTime = Date.now() - startTime;
      result.status = ReviewStatus.COMPLETED;
      result.completedAt = new Date().toISOString();

      // Generate summary
      result.summary = this.generateSummary(result);

      // Store result
      this.results.set(result.id, result);
      this.updateStats(result);

      return result;
    } catch (error) {
      const result = new ReviewResult({
        sessionId: this.context.sessionId,
        projectPath: this.context.projectPath || path.dirname(filePath),
        filesReviewed: 1,
        status: ReviewStatus.FAILED,
        summary: `Review failed: ${error.message}`,
      });
      result.metrics.executionTime = Date.now() - startTime;
      return result;
    }
  }

  async reviewDirectory(dirPath, options = {}) {
    const startTime = Date.now();

    try {
      const files = await this.collectFilesToReview(dirPath, options);
      const result = new ReviewResult({
        sessionId: this.context.sessionId,
        projectPath: dirPath,
        filesReviewed: files.length,
        status: ReviewStatus.IN_PROGRESS,
      });

      // Review each file
      for (const file of files) {
        const fileResult = await this.reviewFile(file, options);
        for (const issue of fileResult.issues) {
          result.addIssue(issue);
        }
      }

      // Calculate overall metrics
      result.metrics.executionTime = Date.now() - startTime;
      result.metrics.filesPerSecond =
        files.length / (result.metrics.executionTime / 1000);
      result.status = ReviewStatus.COMPLETED;
      result.completedAt = new Date().toISOString();

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

      // Generate summary
      result.summary = this.generateSummary(result);

      // Store result
      this.results.set(result.id, result);
      this.updateStats(result);

      return result;
    } catch (error) {
      const result = new ReviewResult({
        sessionId: this.context.sessionId,
        projectPath: dirPath,
        filesReviewed: 0,
        status: ReviewStatus.FAILED,
        summary: `Directory review failed: ${error.message}`,
      });
      result.metrics.executionTime = Date.now() - startTime;
      return result;
    }
  }

  async reviewProject(projectPath, options = {}) {
    // Alias for reviewDirectory with project-specific options
    return this.reviewDirectory(projectPath, {
      ...options,
      excludePatterns: [
        "node_modules",
        ".git",
        "dist",
        "build",
        "coverage",
        ".next",
        ".nuxt",
        ...(options.excludePatterns || []),
      ],
    });
  }

  async runRuleChecks(filePath, content, language) {
    const issues = [];
    const rules = this.ruleRegistry.getRulesForLanguage(language);

    for (const rule of rules) {
      if (!rule.enabled) continue;

      try {
        const ruleIssues = await rule.check(filePath, content, {
          language,
          context: this.context,
        });
        for (const ruleIssue of ruleIssues) {
          issues.push(ruleIssue);
        }
      } catch (error) {
        console.warn(`Rule ${rule.id} failed for ${filePath}:`, error.message);
      }
    }

    return issues;
  }

  async collectFilesToReview(dirPath, options = {}) {
    const files = [];
    const excludePatterns = options.excludePatterns || [];
    const includeExtensions = options.includeExtensions || [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".cpp",
      ".c",
      ".h",
      ".hpp",
    ];

    async function scanDirectory(currentPath) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Check if path should be excluded
        const shouldExclude = excludePatterns.some((pattern) => {
          if (typeof pattern === "string") {
            return fullPath.includes(pattern);
          } else if (pattern instanceof RegExp) {
            return pattern.test(fullPath);
          }
          return false;
        });

        if (shouldExclude) continue;

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (includeExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }

    await scanDirectory(dirPath);
    return files;
  }

  getLanguageFromExtension(ext) {
    const languageMap = {
      ".js": "javascript",
      ".jsx": "javascript",
      ".ts": "typescript",
      ".tsx": "typescript",
      ".py": "python",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".cpp": "cpp",
      ".c": "c",
      ".h": "c",
      ".hpp": "cpp",
      ".cs": "csharp",
      ".php": "php",
      ".rb": "ruby",
      ".swift": "swift",
      ".kt": "kotlin",
      ".scala": "scala",
    };
    return languageMap[ext] || "unknown";
  }

  shouldUseAIReview(filePath, content) {
    // Don't use AI for very large files
    if (content.length > 10000) return false;

    // Don't use AI for binary or minified files
    const lines = content.split("\n");
    if (lines.length < 5) return false; // Too small
    if (lines.some((line) => line.length > 500)) return false; // Likely minified

    return true;
  }

  generateSummary(result) {
    const score = result.calculateScore();
    const critical = result.getIssuesBySeverity(ReviewSeverity.CRITICAL).length;
    const high = result.getIssuesBySeverity(ReviewSeverity.HIGH).length;

    let summary = `Reviewed ${result.filesReviewed} file(s), found ${result.totalIssues} issue(s). `;
    summary += `Quality score: ${score.toFixed(1)}/100. `;

    if (critical > 0) {
      summary += `CRITICAL: ${critical} critical issue(s) need immediate attention. `;
    }
    if (high > 0) {
      summary += `WARNING: ${high} high priority issue(s) should be addressed soon. `;
    }

    if (result.totalIssues === 0) {
      summary += "Great job! No issues found.";
    } else if (score > 80) {
      summary += "Code quality is good overall.";
    } else if (score > 60) {
      summary += "Code quality needs some improvement.";
    } else {
      summary += "Code quality needs significant improvement.";
    }

    return summary;
  }

  generateRecommendations(result) {
    const recommendations = [];
    const criticalIssues = result.getCriticalIssues();

    if (criticalIssues.length > 0) {
      recommendations.push(
        `Fix ${criticalIssues.length} critical issue(s) immediately.`,
      );
    }

    const securityIssues = result.getIssuesByCategory(ReviewCategory.SECURITY);
    if (securityIssues.length > 0) {
      recommendations.push(
        `Address ${securityIssues.length} security issue(s) to prevent vulnerabilities.`,
      );
    }

    const performanceIssues = result.getIssuesByCategory(
      ReviewCategory.PERFORMANCE,
    );
    if (performanceIssues.length > 0) {
      recommendations.push(
        `Optimize ${performanceIssues.length} performance issue(s) for better efficiency.`,
      );
    }

    if (result.filesReviewed > 10 && result.totalIssues === 0) {
      recommendations.push(
        "Consider adding more comprehensive tests to maintain code quality.",
      );
    }

    if (result.calculateScore() < 70) {
      recommendations.push(
        "Consider implementing a code review process for all changes.",
      );
    }

    return recommendations;
  }

  updateStats(result) {
    this.stats.totalReviews++;
    this.stats.totalFilesReviewed += result.filesReviewed;
    this.stats.totalIssuesFound += result.totalIssues;

    // Update average score
    const currentTotalScore =
      this.stats.averageScore * (this.stats.totalReviews - 1);
    this.stats.averageScore =
      (currentTotalScore + result.calculateScore()) / this.stats.totalReviews;
  }

  getResult(reviewId) {
    return this.results.get(reviewId);
  }

  getAllResults() {
    return Array.from(this.results.values());
  }

  clearResults() {
    this.results.clear();
  }

  getStats() {
    return { ...this.stats };
  }

  async saveResult(reviewId, filePath) {
    const result = this.getResult(reviewId);
    if (!result) {
      throw new Error(`Review result not found: ${reviewId}`);
    }

    const data = JSON.stringify(result.toJSON(), null, 2);
    await fs.writeFile(filePath, data);
    return filePath;
  }

  async loadResult(filePath) {
    const data = await fs.readFile(filePath, "utf-8");
    const resultData = JSON.parse(data);
    const result = ReviewResult.fromJSON(resultData);
    this.results.set(result.id, result);
    return result;
  }
}
