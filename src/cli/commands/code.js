import { codeCommandHandler } from "../../utils/code-commands.js";

export class CodeAnalysis {
  constructor() {
    this.handler = codeCommandHandler;
  }

  async analyzeCode(options = {}) {
    try {
      const command = options.command || "analyze";
      const args = {
        dir: options.dir || process.cwd(),
        file: options.file,
        recursive: options.recursive !== false,
        limit: options.limit || 50,
        extensions: options.extensions,
        excludeDirs: options.excludeDirs
          ? options.excludeDirs.split(",")
          : ["node_modules", ".git", "dist", "build"],
        severity: options.severity,
        type: options.type,
      };

      const result = await this.handler.handleCommand(command, args);

      if (options.json) {
        return JSON.stringify(result, null, 2);
      }

      return this.formatResult(result, command);
    } catch (error) {
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  async analyzeComprehensive(options = {}) {
    try {
      const args = {
        dir: options.dir || process.cwd(),
        recursive: options.recursive !== false,
        limit: options.limit || 50,
        excludeDirs: options.excludeDirs
          ? options.excludeDirs.split(",")
          : ["node_modules", ".git", "dist", "build"],
      };

      const results = {};

      // 1. 代码度量分析
      try {
        results.metrics = await this.handler.handleCommand("metrics", args);
      } catch (error) {
        results.metrics = { error: error.message };
      }

      // 2. 依赖分析
      try {
        results.dependencies = await this.handler.handleCommand("deps", args);
      } catch (error) {
        results.dependencies = { error: error.message };
      }

      // 3. 问题分析
      try {
        results.issues = await this.handler.handleCommand("issues", {
          ...args,
          limit: 10,
        });
      } catch (error) {
        results.issues = { error: error.message };
      }

      // 4. 复杂度分析
      try {
        results.complexity = await this.handler.handleCommand(
          "complexity",
          args,
        );
      } catch (error) {
        results.complexity = { error: error.message };
      }

      if (options.json) {
        return JSON.stringify(results, null, 2);
      }

      return this.formatComprehensiveResults(results);
    } catch (error) {
      throw new Error(`Comprehensive code analysis failed: ${error.message}`);
    }
  }

  formatResult(result, command) {
    switch (command) {
      case "metrics":
        return this.formatMetrics(result);
      case "deps":
        return this.formatDependencies(result);
      case "issues":
        return this.formatIssues(result);
      case "complexity":
        return this.formatComplexity(result);
      case "analyze":
        return this.formatAnalysis(result);
      default:
        return JSON.stringify(result, null, 2);
    }
  }

  formatMetrics(metrics) {
    if (!metrics || !metrics.summary) {
      return "No metrics data available";
    }

    const summary = metrics.summary;
    return `Code Metrics Summary:
Directory: ${summary.directory || "unknown"}
Total files: ${summary.totalFiles || 0}
Total lines: ${summary.totalLines || 0}
Functions: ${summary.totalFunctions || 0}
Classes: ${summary.totalClasses || 0}
Average complexity: ${summary.averageComplexity || "N/A"}
Languages: ${Object.keys(summary.languages || {}).join(", ")}`;
  }

  formatDependencies(deps) {
    if (!deps || !deps.dependencies) {
      return "No dependency data available";
    }

    const data = deps.dependencies;
    return `Dependency Analysis:
Total dependencies: ${data.total || 0}
Direct dependencies: ${data.direct || 0}
Dev dependencies: ${data.dev || 0}
Peer dependencies: ${data.peer || 0}
Optional dependencies: ${data.optional || 0}`;
  }

  formatIssues(issues) {
    if (!issues || !issues.issues || issues.issues.length === 0) {
      return "No issues found";
    }

    const issueList = issues.issues
      .slice(0, 10)
      .map(
        (issue) =>
          `- [${issue.severity}] ${issue.type}: ${issue.message} (${issue.file}:${issue.line})`,
      )
      .join("\n");

    return `Top Issues Found (${issues.issues.length} total):
${issueList}`;
  }

  formatComplexity(complexity) {
    if (!complexity || !complexity.summary) {
      return "No complexity data available";
    }

    const summary = complexity.summary;
    return `Code Complexity Analysis:
Average cyclomatic complexity: ${summary.averageCyclomaticComplexity || "N/A"}
Max cyclomatic complexity: ${summary.maxCyclomaticComplexity || "N/A"}
Files with high complexity: ${summary.highComplexityFiles || 0}
Functions with high complexity: ${summary.highComplexityFunctions || 0}`;
  }

  formatAnalysis(analysis) {
    if (!analysis) {
      return "No analysis data available";
    }

    return `Code Analysis Complete:
Files analyzed: ${analysis.filesAnalyzed || 0}
Issues found: ${analysis.totalIssues || 0}
High severity issues: ${analysis.highSeverityIssues || 0}
Medium severity issues: ${analysis.mediumSeverityIssues || 0}`;
  }

  formatComprehensiveResults(results) {
    let output = "Comprehensive Code Analysis Results:\n\n";

    if (results.metrics && !results.metrics.error) {
      output += "1. CODE METRICS:\n";
      output += this.formatMetrics(results.metrics) + "\n\n";
    }

    if (results.dependencies && !results.dependencies.error) {
      output += "2. DEPENDENCIES:\n";
      output += this.formatDependencies(results.dependencies) + "\n\n";
    }

    if (results.issues && !results.issues.error) {
      output += "3. ISSUES:\n";
      output += this.formatIssues(results.issues) + "\n\n";
    }

    if (results.complexity && !results.complexity.error) {
      output += "4. COMPLEXITY:\n";
      output += this.formatComplexity(results.complexity) + "\n\n";
    }

    return output;
  }

  getAvailableCommands() {
    return this.handler.getAvailableCommands();
  }
}

export const codeAnalysis = new CodeAnalysis();
