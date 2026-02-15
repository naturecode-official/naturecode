#!/usr/bin/env node

import { CodeAnalyzer } from "./code-analyzer.js";
import { RefactorSuggestions } from "./refactor-suggestions.js";
import { DependencyAnalyzer } from "./dependency-analyzer.js";
import { exitWithError } from "./error-handler.js";
import path from "path";

export class CodeCommandHandler {
  constructor() {
    this.analyzer = new CodeAnalyzer();
    this.refactor = new RefactorSuggestions();
    this.deps = new DependencyAnalyzer();
    this.commands = [
      {
        command: "analyze",
        description: "Analyze code in current directory",
        handler: this.handleAnalyze.bind(this),
      },
      {
        command: "analyze-file",
        description: "Analyze specific file",
        handler: this.handleAnalyzeFile.bind(this),
      },
      {
        command: "complexity",
        description: "Calculate code complexity metrics",
        handler: this.handleComplexity.bind(this),
      },
      {
        command: "issues",
        description: "List code issues and suggestions",
        handler: this.handleIssues.bind(this),
      },
      {
        command: "metrics",
        description: "Show code metrics summary",
        handler: this.handleMetrics.bind(this),
      },
      {
        command: "refactor",
        description: "Get refactoring suggestions",
        handler: this.handleRefactor.bind(this),
      },
      {
        command: "deps",
        description: "Analyze project dependencies",
        handler: this.handleDependencies.bind(this),
      },
      {
        command: "deps-tree",
        description: "Show dependency tree",
        handler: this.handleDependencyTree.bind(this),
      },
      {
        command: "deps-security",
        description: "Check for security vulnerabilities",
        handler: this.handleSecurityCheck.bind(this),
      },
      {
        command: "deps-unused",
        description: "Find unused dependencies",
        handler: this.handleUnusedDependencies.bind(this),
      },
    ];
  }

  getAvailableCommands() {
    return this.commands.map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
    }));
  }

  async handleCommand(command, args = {}) {
    const cmd = this.commands.find((c) => c.command === command);

    if (!cmd) {
      throw new Error(`Unknown code command: ${command}`);
    }

    try {
      return await cmd.handler(args);
    } catch (error) {
      throw new Error(`Code command failed: ${error.message}`);
    }
  }

  async handleAnalyze(args) {
    const {
      dir = process.cwd(),
      recursive = true,
      limit = 50,
      extensions,
      excludeDirs = ["node_modules", ".git", "dist", "build"],
    } = args;

    console.log(`Analyzing code in ${dir}...`);

    const options = {
      recursive,
      limit,
      excludeDirs,
    };

    if (extensions) {
      options.extensions = extensions.split(",").map((ext) => ext.trim());
    }

    const result = await this.analyzer.analyzeDirectory(dir, options);

    console.log("\nCode Analysis Summary:");
    console.log(`Directory: ${result.directory}`);
    console.log(`Total files: ${result.totalFiles}`);
    console.log(`Analyzed files: ${result.analyzedFiles}`);
    console.log(`Total lines: ${result.summary.totalLines}`);
    console.log(`Total issues: ${result.summary.totalIssues}`);

    if (result.summary.totalIssues > 0) {
      console.log("\nIssues by type:");
      Object.entries(result.summary.issuesByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log("\nIssues by severity:");
      Object.entries(result.summary.issuesBySeverity).forEach(
        ([severity, count]) => {
          console.log(`  ${severity}: ${count}`);
        },
      );
    }

    console.log("\nLanguages found:");
    Object.entries(result.summary.languages).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count} files`);
    });

    return result;
  }

  async handleAnalyzeFile(args) {
    const { file, dir = process.cwd() } = args;

    if (!file) {
      throw new Error("File path is required");
    }

    const filePath = path.isAbsolute(file) ? file : path.join(dir, file);
    console.log(`Analyzing file: ${filePath}`);

    const analysis = await this.analyzer.analyzeFile(filePath);

    console.log("\nFile Analysis:");
    console.log(`File: ${analysis.filePath}`);
    console.log(`Language: ${analysis.language}`);
    console.log(`Size: ${analysis.size} bytes`);
    console.log(`Lines: ${analysis.lines}`);

    if (analysis.metrics) {
      console.log("\nMetrics:");
      Object.entries(analysis.metrics).forEach(([key, value]) => {
        console.log(
          `  ${key}: ${typeof value === "number" ? value.toFixed(2) : value}`,
        );
      });
    }

    if (analysis.issues.length > 0) {
      console.log(`\nIssues (${analysis.issues.length}):`);
      analysis.issues.forEach((issue, index) => {
        console.log(
          `\n${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`,
        );
        console.log(`   Line: ${issue.line}, Severity: ${issue.severity}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
      });
    } else {
      console.log("\nNo issues found.");
    }

    return analysis;
  }

  async handleComplexity(args) {
    const { file, dir = process.cwd() } = args;

    if (!file) {
      throw new Error("File path is required");
    }

    const filePath = path.isAbsolute(file) ? file : path.join(dir, file);
    console.log(`Calculating complexity for: ${filePath}`);

    const metrics = await this.analyzer.getComplexityMetrics(filePath);

    console.log("\nComplexity Metrics:");
    console.log(`File: ${filePath}`);
    console.log(`Functions: ${metrics.functionCount}`);
    console.log(`Loops: ${metrics.loopCount}`);
    console.log(`Conditions: ${metrics.conditionCount}`);
    console.log(`Cyclomatic Complexity: ${metrics.cyclomaticComplexity}`);

    // Provide complexity assessment
    if (metrics.cyclomaticComplexity < 10) {
      console.log("\nComplexity: Low - Code is simple and maintainable");
    } else if (metrics.cyclomaticComplexity < 20) {
      console.log(
        "\nComplexity: Medium - Consider refactoring complex functions",
      );
    } else {
      console.log("\nComplexity: High - Code may be difficult to maintain");
      console.log(
        "   Consider breaking down complex functions into smaller ones",
      );
    }

    return metrics;
  }

  async handleIssues(args) {
    const { dir = process.cwd(), severity, type, limit = 20 } = args;

    console.log(`Scanning for code issues in ${dir}...`);

    const result = await this.analyzer.analyzeDirectory(dir, {
      recursive: true,
      limit: 100,
      excludeDirs: ["node_modules", ".git", "dist", "build"],
    });

    let allIssues = [];
    result.analyses.forEach((analysis) => {
      analysis.issues.forEach((issue) => {
        allIssues.push({
          ...issue,
          file: analysis.filePath,
          language: analysis.language,
        });
      });
    });

    // Filter issues
    if (severity) {
      allIssues = allIssues.filter((issue) => issue.severity === severity);
    }

    if (type) {
      allIssues = allIssues.filter((issue) => issue.type === type);
    }

    // Sort by severity (high to low)
    const severityOrder = { high: 3, medium: 2, low: 1, info: 0 };
    allIssues.sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
    );

    // Limit results
    allIssues = allIssues.slice(0, limit);

    console.log(`\nISSUES Code Issues (${allIssues.length} found):`);

    if (allIssues.length === 0) {
      console.log("No issues found.");
      return { issues: [] };
    }

    allIssues.forEach((issue, index) => {
      console.log(
        `\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message}`,
      );
      console.log(`   File: ${issue.file} (Line ${issue.line})`);
      console.log(`   Language: ${issue.language}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
    });

    return { issues: allIssues };
  }

  async handleMetrics(args) {
    const { dir = process.cwd() } = args;

    console.log(`Calculating code metrics for ${dir}...`);

    const result = await this.analyzer.analyzeDirectory(dir, {
      recursive: true,
      limit: 100,
      excludeDirs: ["node_modules", ".git", "dist", "build"],
    });

    console.log("\nMETRICS Code Metrics Summary:");
    console.log(`Directory: ${result.directory}`);
    console.log(`Total files analyzed: ${result.analyses.length}`);
    console.log(`Total lines: ${result.summary.totalLines}`);

    // Calculate averages
    const avgLines =
      result.summary.totalLines / Math.max(result.analyses.length, 1);
    const avgIssues =
      result.summary.totalIssues / Math.max(result.analyses.length, 1);

    console.log(`Average lines per file: ${avgLines.toFixed(1)}`);
    console.log(`Average issues per file: ${avgIssues.toFixed(1)}`);

    // Language distribution
    console.log("\nLanguage Distribution:");
    Object.entries(result.summary.languages)
      .sort((a, b) => b[1] - a[1])
      .forEach(([lang, count]) => {
        const percentage = ((count / result.analyses.length) * 100).toFixed(1);
        console.log(`  ${lang}: ${count} files (${percentage}%)`);
      });

    // Issue breakdown
    if (result.summary.totalIssues > 0) {
      console.log("\nIssue Breakdown:");
      console.log(`  Total issues: ${result.summary.totalIssues}`);

      const severityCounts = result.summary.issuesBySeverity;
      console.log(`  High severity: ${severityCounts.high || 0}`);
      console.log(`  Medium severity: ${severityCounts.medium || 0}`);
      console.log(`  Low severity: ${severityCounts.low || 0}`);
      console.log(`  Info: ${severityCounts.info || 0}`);
    }

    // Quality assessment
    console.log("\nQUALITY Quality Assessment:");
    const issueDensity =
      result.summary.totalIssues / Math.max(result.summary.totalLines / 100, 1);

    if (issueDensity < 0.1) {
      console.log(
        `OK Excellent code quality (${issueDensity.toFixed(2)} issues per 100 lines)`,
      );
    } else if (issueDensity < 0.5) {
      console.log(
        `WARNING Good code quality (${issueDensity.toFixed(2)} issues per 100 lines)`,
      );
      console.log("   Consider addressing some of the issues");
    } else {
      console.log(
        `Needs improvement (${issueDensity.toFixed(2)} issues per 100 lines)`,
      );
      console.log("   Focus on fixing high and medium severity issues first");
    }

    return result;
  }

  async handleRefactor(args) {
    const {
      dir = process.cwd(),
      recursive = true,
      limit = 20,
      extensions,
      excludeDirs = ["node_modules", ".git", "dist", "build"],
    } = args;

    console.log(`Analyzing for refactoring opportunities in ${dir}...`);

    const options = {
      recursive,
      limit,
      excludeDirs,
    };

    if (extensions) {
      options.extensions = extensions.split(",").map((ext) => ext.trim());
    }

    const result = await this.refactor.getRefactoringSuggestions(dir, options);

    console.log("\nREFACTOR Refactoring Suggestions:");
    console.log(`Directory: ${result.directory}`);
    console.log(`Files analyzed: ${result.analyzedFiles}`);
    console.log(`Total suggestions: ${result.totalSuggestions}`);

    if (result.totalSuggestions === 0) {
      console.log("\nNo refactoring suggestions found. Code looks good!");
      return result;
    }

    console.log("\nANALYSIS Summary by type:");
    Object.entries(result.summary.suggestionsByType).forEach(
      ([type, count]) => {
        console.log(`  ${type}: ${count}`);
      },
    );

    console.log("\nANALYSIS Summary by priority:");
    Object.entries(result.summary.suggestionsByPriority).forEach(
      ([priority, count]) => {
        console.log(`  ${priority}: ${count}`);
      },
    );

    console.log("\nTop suggestions:");
    result.files.slice(0, 5).forEach((file, fileIndex) => {
      console.log(`\n${fileIndex + 1}. ${file.filePath}`);
      console.log(`   Total suggestions: ${file.totalSuggestions}`);

      file.suggestions.slice(0, 3).forEach((suggestion, suggestionIndex) => {
        console.log(
          `   ${suggestionIndex + 1}. [${suggestion.priority}] ${suggestion.type}: ${suggestion.message}`,
        );
        console.log(`      Line ${suggestion.line}: ${suggestion.suggestion}`);
      });
    });

    const priority = this.refactor.getRefactoringPriority(
      result.files.flatMap((f) => f.suggestions),
    );

    console.log(`\nQUALITY Refactoring Priority: ${priority.toUpperCase()}`);
    if (priority === "critical" || priority === "high") {
      console.log(
        "   Consider addressing these issues soon to improve code maintainability",
      );
    }

    return result;
  }

  async handleDependencies(args) {
    const { dir = process.cwd() } = args;

    console.log(`Analyzing dependencies in ${dir}...`);

    const result = await this.deps.analyzeDependencies({ dir });

    console.log("\nDEPENDENCIES Dependency Analysis:");
    console.log(`Project type: ${result.projectType}`);
    console.log(`Package manager: ${result.packageManager}`);
    console.log(`Total dependencies: ${result.totalDependencies}`);
    console.log(`Production dependencies: ${result.dependencies.length}`);
    console.log(`Development dependencies: ${result.devDependencies.length}`);

    if (result.dependencies.length > 0) {
      console.log("\nTop production dependencies:");
      result.dependencies.slice(0, 10).forEach((dep, index) => {
        console.log(`  ${index + 1}. ${dep.name}@${dep.version}`);
      });
    }

    if (result.analysis) {
      console.log("\nANALYSIS Analysis:");
      console.log(`Outdated dependencies: ${result.analysis.outdatedCount}`);
      console.log(`Security issues: ${result.analysis.securityIssues}`);
      console.log(`Large dependencies: ${result.analysis.largeDependencies}`);

      if (result.analysis.recommendations.length > 0) {
        console.log("\nRecommendations:");
        result.analysis.recommendations.slice(0, 5).forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.dependency}: ${rec.issue}`);
          console.log(`     ${rec.suggestion}`);
        });
      }

      console.log(`\n${result.analysis.summary}`);
    }

    return result;
  }

  async handleDependencyTree(args) {
    const { dir = process.cwd() } = args;

    console.log(`Generating dependency tree for ${dir}...`);

    try {
      const tree = await this.deps.getDependencyTree();

      console.log("\nTREE Dependency Tree:");
      console.log(`${tree.name}@${tree.version}`);

      if (tree.dependencies && tree.dependencies.length > 0) {
        console.log(`\nDependencies (${tree.dependencies.length}):`);
        tree.dependencies.forEach((dep, index) => {
          console.log(`  ${index + 1}. ${dep.name}@${dep.version}`);
          if (dep.dependencies > 0) {
            console.log(`     ↳ ${dep.dependencies} sub-dependencies`);
          }
        });
      } else {
        console.log("\nNo dependencies found or tree not available.");
      }

      return tree;
    } catch (error) {
      console.log(
        `\nWARNING Could not generate dependency tree: ${error.message}`,
      );
      console.log("   Falling back to basic dependency analysis...");
      return this.handleDependencies(args);
    }
  }

  async handleSecurityCheck(args) {
    const { dir = process.cwd() } = args;

    console.log(`Checking for security vulnerabilities in ${dir}...`);

    const report = await this.deps.checkForSecurityIssues();

    if (!report.available) {
      console.log(`\nWARNING ${report.message}`);
      return report;
    }

    console.log("\nSECURITY Security Audit Results:");

    if (report.summary.total === 0) {
      console.log("No security vulnerabilities found!");
    } else {
      console.log(`Found ${report.summary.total} vulnerabilities:`);
      console.log(`   Critical: ${report.summary.critical}`);
      console.log(`   High: ${report.summary.high}`);
      console.log(`   Moderate: ${report.summary.moderate}`);
      console.log(`   Low: ${report.summary.low}`);

      if (report.vulnerabilities.length > 0) {
        console.log("\nTop vulnerabilities:");
        report.vulnerabilities.slice(0, 5).forEach((vuln, index) => {
          console.log(`\n${index + 1}. ${vuln.name}`);
          console.log(`   Severity: ${vuln.severity}`);
          console.log(`   Title: ${vuln.title}`);
          if (vuln.url) {
            console.log(`   More info: ${vuln.url}`);
          }
        });

        if (report.summary.critical > 0 || report.summary.high > 0) {
          console.log(
            "\nACTION REQUIRED: Critical or high severity vulnerabilities found!",
          );
          console.log("   Run 'npm audit fix' to attempt automatic fixes.");
        }
      }
    }

    return report;
  }

  async handleUnusedDependencies(args) {
    const { dir = process.cwd() } = args;

    console.log(`Checking for unused dependencies in ${dir}...`);

    const result = await this.deps.getUnusedDependencies();

    if (result.message) {
      console.log(`\nWARNING ${result.message}`);
      return result;
    }

    console.log("\nANALYSIS Unused Dependencies Analysis:");

    if (result.unused.length === 0) {
      console.log("No unused dependencies found!");
    } else {
      console.log(`Found ${result.unused.length} unused dependencies:`);
      result.unused.forEach((dep, index) => {
        console.log(`  ${index + 1}. ${dep}`);
      });

      console.log(
        "\nTip: Consider removing these dependencies to reduce bundle size.",
      );
    }

    if (Object.keys(result.missing).length > 0) {
      console.log(
        `\nWARNING Missing dependencies (${Object.keys(result.missing).length}):`,
      );
      Object.entries(result.missing).forEach(([dep, files], index) => {
        console.log(`  ${index + 1}. ${dep} (used in ${files.length} files)`);
      });
    }

    return result;
  }
}

export const codeCommandHandler = new CodeCommandHandler();

// For direct testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const handler = new CodeCommandHandler();
  const command = process.argv[2] || "analyze";
  const args = { dir: process.cwd() };

  handler.handleCommand(command, args).catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}
