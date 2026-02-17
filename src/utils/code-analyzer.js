#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

export class CodeAnalyzer {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  async analyzeFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, "utf-8");
      const ext = path.extname(filePath).toLowerCase();

      const analysis = {
        filePath,
        size: stats.size,
        lines: content.split("\n").length,
        extension: ext,
        language: this.getLanguage(ext),
        issues: [],
        metrics: {},
      };

      // Run language-specific analysis
      switch (ext) {
        case ".js":
        case ".jsx":
        case ".ts":
        case ".tsx":
          analysis.issues = await this.analyzeJavaScript(content, filePath);
          analysis.metrics = this.calculateJavaScriptMetrics(content);
          break;
        case ".py":
          analysis.issues = await this.analyzePython(content, filePath);
          analysis.metrics = this.calculatePythonMetrics(content);
          break;
        case ".java":
          analysis.issues = await this.analyzeJava(content, filePath);
          analysis.metrics = this.calculateJavaMetrics(content);
          break;
        case ".go":
          analysis.issues = await this.analyzeGo(content, filePath);
          analysis.metrics = this.calculateGoMetrics(content);
          break;
        case ".rs":
          analysis.issues = await this.analyzeRust(content, filePath);
          analysis.metrics = this.calculateRustMetrics(content);
          break;
        default:
          analysis.issues = await this.analyzeGeneric(content, filePath);
          analysis.metrics = this.calculateGenericMetrics(content);
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze file ${filePath}: ${error.message}`);
    }
  }

  async analyzeDirectory(dirPath = this.baseDir, options = {}) {
    try {
      const files = await this.scanDirectory(dirPath, options);
      const analyses = [];

      for (const file of files.slice(0, options.limit || 50)) {
        try {
          const analysis = await this.analyzeFile(file);
          analyses.push(analysis);
        } catch (error) {
          console.warn(`Skipping ${file}: ${error.message}`);
        }
      }

      return {
        directory: dirPath,
        totalFiles: files.length,
        analyzedFiles: analyses.length,
        analyses,
        summary: this.generateSummary(analyses),
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze directory ${dirPath}: ${error.message}`,
      );
    }
  }

  async scanDirectory(dirPath, options = {}) {
    const files = [];
    const extensions = options.extensions || [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
      ".go",
      ".rs",
      ".c",
      ".cpp",
      ".h",
      ".hpp",
      ".cs",
      ".php",
      ".rb",
      ".swift",
    ];

    async function scan(currentPath) {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            if (!options.recursive) continue;
            if (options.excludeDirs && options.excludeDirs.includes(entry.name))
              continue;
            await scan(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${currentPath}: ${error.message}`);
      }
    }

    await scan(dirPath);
    return files;
  }

  getLanguage(ext) {
    const languageMap = {
      ".js": "JavaScript",
      ".jsx": "JavaScript (React)",
      ".ts": "TypeScript",
      ".tsx": "TypeScript (React)",
      ".py": "Python",
      ".java": "Java",
      ".go": "Go",
      ".rs": "Rust",
      ".c": "C",
      ".cpp": "C++",
      ".h": "C/C++ Header",
      ".hpp": "C++ Header",
      ".cs": "C#",
      ".php": "PHP",
      ".rb": "Ruby",
      ".swift": "Swift",
      ".md": "Markdown",
      ".json": "JSON",
      ".yml": "YAML",
      ".yaml": "YAML",
      ".xml": "XML",
      ".html": "HTML",
      ".css": "CSS",
      ".sql": "SQL",
    };

    return languageMap[ext] || "Unknown";
  }

  async analyzeJavaScript(content, filePath) {
    const issues = [];

    // Check for common issues
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for console.log in production code
      if (
        line.includes("console.log") &&
        !line.includes("//") &&
        !line.includes("/*")
      ) {
        issues.push({
          type: "warning",
          message: "console.log found in code",
          line: lineNumber,
          severity: "low",
          suggestion: "Remove or use proper logging library",
        });
      }

      // Check for long lines
      if (line.length > 100) {
        issues.push({
          type: "style",
          message: "Line exceeds 100 characters",
          line: lineNumber,
          severity: "low",
          suggestion: "Break line into multiple lines",
        });
      }

      // Check for TODO comments
      if (
        line.includes("TODO") ||
        line.includes("FIXME") ||
        line.includes("XXX")
      ) {
        issues.push({
          type: "todo",
          message: "TODO/FIXME comment found",
          line: lineNumber,
          severity: "info",
          suggestion: "Address the TODO comment",
        });
      }

      // Check for potential security issues
      if (line.includes("eval(") || line.includes("Function(")) {
        issues.push({
          type: "security",
          message: "Potential security issue: eval or Function constructor",
          line: lineNumber,
          severity: "high",
          suggestion: "Avoid using eval or Function constructor",
        });
      }
    });

    // Check for missing error handling
    const asyncFunctionRegex =
      /async\s+function\s+\w+|const\s+\w+\s*=\s*async\s*\(/g;
    let match;
    while ((match = asyncFunctionRegex.exec(content)) !== null) {
      const functionStart = match.index;
      const functionContent = content.substring(
        functionStart,
        Math.min(functionStart + 500, content.length),
      );

      if (
        !functionContent.includes("try") &&
        !functionContent.includes(".catch")
      ) {
        issues.push({
          type: "error-handling",
          message: "Async function may be missing error handling",
          line: this.getLineNumber(content, functionStart),
          severity: "medium",
          suggestion: "Add try-catch block or .catch handler",
        });
      }
    }

    return issues;
  }

  calculateJavaScriptMetrics(content) {
    const lines = content.split("\n");
    const codeLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("//"),
    );
    const commentLines = lines.filter(
      (line) => line.trim().startsWith("//") || line.includes("/*"),
    );

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / Math.max(lines.length, 1),
      averageLineLength:
        lines.reduce((sum, line) => sum + line.length, 0) /
        Math.max(lines.length, 1),
    };
  }

  async analyzePython(content, filePath) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for print statements
      if (line.includes("print(") && !line.includes("#")) {
        issues.push({
          type: "warning",
          message: "print() found in code",
          line: lineNumber,
          severity: "low",
          suggestion: "Use logging module instead",
        });
      }

      // Check for bare except
      if (line.includes("except:") && !line.includes("#")) {
        issues.push({
          type: "error-handling",
          message: "Bare except clause",
          line: lineNumber,
          severity: "medium",
          suggestion: "Specify exception types",
        });
      }
    });

    return issues;
  }

  calculatePythonMetrics(content) {
    const lines = content.split("\n");
    const codeLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("#"),
    );
    const commentLines = lines.filter((line) => line.trim().startsWith("#"));

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / Math.max(lines.length, 1),
      averageLineLength:
        lines.reduce((sum, line) => sum + line.length, 0) /
        Math.max(lines.length, 1),
    };
  }

  async analyzeJava(content, filePath) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for System.out.println
      if (
        line.includes("System.out.println") &&
        !line.trim().startsWith("//")
      ) {
        issues.push({
          type: "warning",
          message: "System.out.println found",
          line: lineNumber,
          severity: "low",
          suggestion: "Use logging framework",
        });
      }
    });

    return issues;
  }

  calculateJavaMetrics(content) {
    const lines = content.split("\n");
    const codeLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("//"),
    );
    const commentLines = lines.filter(
      (line) => line.trim().startsWith("//") || line.includes("/*"),
    );

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / Math.max(lines.length, 1),
      averageLineLength:
        lines.reduce((sum, line) => sum + line.length, 0) /
        Math.max(lines.length, 1),
    };
  }

  async analyzeGo(content, filePath) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for fmt.Println
      if (line.includes("fmt.Println") && !line.trim().startsWith("//")) {
        issues.push({
          type: "warning",
          message: "fmt.Println found",
          line: lineNumber,
          severity: "low",
          suggestion: "Use log package instead",
        });
      }
    });

    return issues;
  }

  calculateGoMetrics(content) {
    const lines = content.split("\n");
    const codeLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("//"),
    );
    const commentLines = lines.filter(
      (line) => line.trim().startsWith("//") || line.includes("/*"),
    );

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / Math.max(lines.length, 1),
      averageLineLength:
        lines.reduce((sum, line) => sum + line.length, 0) /
        Math.max(lines.length, 1),
    };
  }

  async analyzeRust(content, filePath) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for println!
      if (line.includes("println!") && !line.trim().startsWith("//")) {
        issues.push({
          type: "warning",
          message: "println! macro found",
          line: lineNumber,
          severity: "low",
          suggestion: "Use logging crate instead",
        });
      }
    });

    return issues;
  }

  calculateRustMetrics(content) {
    const lines = content.split("\n");
    const codeLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("//"),
    );
    const commentLines = lines.filter(
      (line) => line.trim().startsWith("//") || line.includes("/*"),
    );

    return {
      totalLines: lines.length,
      codeLines: codeLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / Math.max(lines.length, 1),
      averageLineLength:
        lines.reduce((sum, line) => sum + line.length, 0) /
        Math.max(lines.length, 1),
    };
  }

  async analyzeGeneric(content, filePath) {
    const issues = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for long lines
      if (line.length > 120) {
        issues.push({
          type: "style",
          message: "Line exceeds 120 characters",
          line: lineNumber,
          severity: "low",
          suggestion: "Break line into multiple lines",
        });
      }

      // Check for TODO comments
      if (
        line.includes("TODO") ||
        line.includes("FIXME") ||
        line.includes("XXX")
      ) {
        issues.push({
          type: "todo",
          message: "TODO/FIXME comment found",
          line: lineNumber,
          severity: "info",
          suggestion: "Address the TODO comment",
        });
      }
    });

    return issues;
  }

  calculateGenericMetrics(content) {
    const lines = content.split("\n");
    return {
      totalLines: lines.length,
      averageLineLength:
        lines.reduce((sum, line) => sum + line.length, 0) /
        Math.max(lines.length, 1),
    };
  }

  generateSummary(analyses) {
    const summary = {
      totalFiles: analyses.length,
      totalLines: 0,
      totalIssues: 0,
      issuesByType: {},
      issuesBySeverity: {},
      languages: {},
    };

    analyses.forEach((analysis) => {
      summary.totalLines += analysis.lines;
      summary.totalIssues += analysis.issues.length;

      // Count issues by type
      analysis.issues.forEach((issue) => {
        summary.issuesByType[issue.type] =
          (summary.issuesByType[issue.type] || 0) + 1;
        summary.issuesBySeverity[issue.severity] =
          (summary.issuesBySeverity[issue.severity] || 0) + 1;
      });

      // Count languages
      const lang = analysis.language;
      summary.languages[lang] = (summary.languages[lang] || 0) + 1;
    });

    return summary;
  }

  getLineNumber(content, position) {
    const lines = content.substring(0, position).split("\n");
    return lines.length;
  }

  async getComplexityMetrics(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      // Simple complexity metrics
      let functionCount = 0;
      let loopCount = 0;
      let conditionCount = 0;

      lines.forEach((line) => {
        const trimmed = line.trim();

        // Count functions (simple heuristic)
        if (
          trimmed.match(
            /^(async\s+)?(function|const|let|var)\s+\w+\s*=\s*(async\s*)?\(.*\)\s*=>/,
          ) ||
          trimmed.match(/^(async\s+)?function\s+\w+\s*\(/) ||
          trimmed.match(
            /^(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\(/,
          )
        ) {
          functionCount++;
        }

        // Count loops
        if (trimmed.match(/for\s*\(|while\s*\(|do\s*\{/)) {
          loopCount++;
        }

        // Count conditions
        if (trimmed.match(/if\s*\(|else\s+if\s*\(|switch\s*\(/)) {
          conditionCount++;
        }
      });

      return {
        functionCount,
        loopCount,
        conditionCount,
        cyclomaticComplexity: functionCount + loopCount + conditionCount,
      };
    } catch (error) {
      console.warn(
        `Cannot calculate complexity for ${filePath}: ${error.message}`,
      );
      return {
        functionCount: 0,
        loopCount: 0,
        conditionCount: 0,
        cyclomaticComplexity: 0,
      };
    }
  }
}

export default CodeAnalyzer;
