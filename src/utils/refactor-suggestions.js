#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";

export class RefactorSuggestions {
  constructor (baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  async analyzeForRefactoring (filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const ext = path.extname(filePath).toLowerCase();
      const suggestions = [];

      if (ext === ".js" || ext === ".jsx" || ext === ".ts" || ext === ".tsx") {
        suggestions.push(
          ...(await this.analyzeJavaScriptForRefactoring(content, filePath)),
        );
      } else if (ext === ".py") {
        suggestions.push(
          ...(await this.analyzePythonForRefactoring(content, filePath)),
        );
      } else if (ext === ".java") {
        suggestions.push(
          ...(await this.analyzeJavaForRefactoring(content, filePath)),
        );
      }

      return {
        filePath,
        suggestions,
        totalSuggestions: suggestions.length,
        prioritySuggestions: suggestions.filter((s) => s.priority === "high")
          .length,
      };
    } catch (error) {
      throw new Error(`Failed to analyze for refactoring: ${error.message}`);
    }
  }

  async analyzeJavaScriptForRefactoring (content, filePath) {
    const suggestions = [];
    const lines = content.split("\n");

    // Check for long functions
    const functionRegex =
      /^(async\s+)?(function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>|class\s+\w+)/;
    let currentFunction = null;
    let functionStartLine = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (functionRegex.test(line.trim()) && !currentFunction) {
        currentFunction = line.trim();
        functionStartLine = i + 1;
        braceCount = 0;
      }

      if (currentFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && currentFunction) {
          const functionLength = i - functionStartLine + 1;

          if (functionLength > 50) {
            suggestions.push({
              type: "long-function",
              message: `Function is too long (${functionLength} lines)`,
              line: functionStartLine,
              priority: "high",
              suggestion:
                "Consider breaking this function into smaller, focused functions",
              codeSnippet: currentFunction.substring(0, 100) + "...",
            });
          }

          currentFunction = null;
        }
      }

      // Check for deep nesting
      const indent = line.search(/\S/);
      if (indent > 20) {
        suggestions.push({
          type: "deep-nesting",
          message: "Deeply nested code (indentation > 20 spaces)",
          line: i + 1,
          priority: "medium",
          suggestion:
            "Consider extracting nested logic into separate functions",
          codeSnippet: line.trim().substring(0, 100),
        });
      }

      // Check for magic numbers
      const magicNumberMatch = line.match(/\b\d{3,}\b/);
      if (magicNumberMatch && !line.includes("//") && !line.includes("/*")) {
        suggestions.push({
          type: "magic-number",
          message: `Magic number found: ${magicNumberMatch[0]}`,
          line: i + 1,
          priority: "low",
          suggestion: "Define this number as a named constant",
          codeSnippet: line.trim().substring(0, 100),
        });
      }

      // Check for duplicate code patterns
      if (i > 0 && lines[i].trim() === lines[i - 1].trim() && lines[i].trim()) {
        suggestions.push({
          type: "duplicate-code",
          message: "Duplicate line of code",
          line: i + 1,
          priority: "medium",
          suggestion: "Consider extracting duplicate code into a function",
          codeSnippet: line.trim().substring(0, 100),
        });
      }
    }

    // Check for complex conditionals
    const complexConditionalRegex = /if\s*\([^)]{100,}\)/;
    lines.forEach((line, index) => {
      if (complexConditionalRegex.test(line)) {
        suggestions.push({
          type: "complex-conditional",
          message: "Complex conditional expression",
          line: index + 1,
          priority: "medium",
          suggestion:
            "Extract condition into a well-named function or variable",
          codeSnippet: line.trim().substring(0, 150),
        });
      }
    });

    return suggestions;
  }

  async analyzePythonForRefactoring (content, filePath) {
    const suggestions = [];
    const lines = content.split("\n");

    // Check for long functions
    const functionRegex = /^def\s+\w+\(/;
    let currentFunction = null;
    let functionStartLine = 0;
    let indentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (functionRegex.test(trimmed) && !currentFunction) {
        currentFunction = trimmed;
        functionStartLine = i + 1;
        indentLevel = line.search(/\S/);
      }

      if (
        currentFunction &&
        line.search(/\S/) <= indentLevel &&
        trimmed &&
        i > functionStartLine
      ) {
        const functionLength = i - functionStartLine;

        if (functionLength > 30) {
          suggestions.push({
            type: "long-function",
            message: `Function is too long (${functionLength} lines)`,
            line: functionStartLine,
            priority: "high",
            suggestion:
              "Consider breaking this function into smaller, focused functions",
            codeSnippet: currentFunction.substring(0, 100) + "...",
          });
        }

        currentFunction = null;
      }

      // Check for deep nesting
      const indent = line.search(/\S/);
      if (indent > 16) {
        suggestions.push({
          type: "deep-nesting",
          message: "Deeply nested code (indentation > 4 levels)",
          line: i + 1,
          priority: "medium",
          suggestion:
            "Consider extracting nested logic into separate functions",
          codeSnippet: line.trim().substring(0, 100),
        });
      }
    }

    return suggestions;
  }

  async analyzeJavaForRefactoring (content, filePath) {
    const suggestions = [];
    const lines = content.split("\n");

    // Check for long methods
    const methodRegex =
      /^(public|private|protected)\s+(\w+\s+)*\w+\s+\w+\s*\([^)]*\)\s*\{/;
    let currentMethod = null;
    let methodStartLine = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (methodRegex.test(line.trim()) && !currentMethod) {
        currentMethod = line.trim();
        methodStartLine = i + 1;
        braceCount = 0;
      }

      if (currentMethod) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && currentMethod) {
          const methodLength = i - methodStartLine + 1;

          if (methodLength > 40) {
            suggestions.push({
              type: "long-method",
              message: `Method is too long (${methodLength} lines)`,
              line: methodStartLine,
              priority: "high",
              suggestion:
                "Consider breaking this method into smaller, focused methods",
              codeSnippet: currentMethod.substring(0, 100) + "...",
            });
          }

          currentMethod = null;
        }
      }
    }

    return suggestions;
  }

  async getRefactoringSuggestions (directory = this.baseDir, options = {}) {
    try {
      const files = await this.scanDirectory(directory, options);
      const allSuggestions = [];

      for (const file of files.slice(0, options.limit || 20)) {
        try {
          const suggestions = await this.analyzeForRefactoring(file);
          if (suggestions.suggestions.length > 0) {
            allSuggestions.push(suggestions);
          }
        } catch (error) {
          console.warn(`Skipping ${file}: ${error.message}`);
        }
      }

      // Sort by priority and number of suggestions
      allSuggestions.sort((a, b) => {
        if (a.prioritySuggestions !== b.prioritySuggestions) {
          return b.prioritySuggestions - a.prioritySuggestions;
        }
        return b.totalSuggestions - a.totalSuggestions;
      });

      return {
        directory,
        totalFiles: files.length,
        analyzedFiles: allSuggestions.length,
        totalSuggestions: allSuggestions.reduce(
          (sum, file) => sum + file.totalSuggestions,
          0,
        ),
        files: allSuggestions,
        summary: this.generateSummary(allSuggestions),
      };
    } catch (error) {
      throw new Error(
        `Failed to get refactoring suggestions: ${error.message}`,
      );
    }
  }

  async scanDirectory (dirPath, options = {}) {
    const files = [];
    const extensions = options.extensions || [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
    ];

    async function scan (currentPath) {
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

  generateSummary (files) {
    const summary = {
      totalFiles: files.length,
      totalSuggestions: files.reduce(
        (sum, file) => sum + file.totalSuggestions,
        0,
      ),
      suggestionsByType: {},
      suggestionsByPriority: {},
    };

    files.forEach((file) => {
      file.suggestions.forEach((suggestion) => {
        summary.suggestionsByType[suggestion.type] =
          (summary.suggestionsByType[suggestion.type] || 0) + 1;
        summary.suggestionsByPriority[suggestion.priority] =
          (summary.suggestionsByPriority[suggestion.priority] || 0) + 1;
      });
    });

    return summary;
  }

  getRefactoringPriority (issues) {
    const highPriority = issues.filter(
      (issue) => issue.priority === "high",
    ).length;
    const mediumPriority = issues.filter(
      (issue) => issue.priority === "medium",
    ).length;

    if (highPriority > 5) {
      return "critical";
    } else if (highPriority > 2 || mediumPriority > 10) {
      return "high";
    } else if (highPriority > 0 || mediumPriority > 5) {
      return "medium";
    } else {
      return "low";
    }
  }
}

export default RefactorSuggestions;
