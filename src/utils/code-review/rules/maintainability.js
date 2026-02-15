// Maintainability-related code review rules

import { ReviewRule, ReviewSeverity, ReviewCategory } from "../types.js";

export class MaintainabilityRule extends ReviewRule {
  constructor() {
    super({
      id: "maintainability-base",
      name: "Maintainability Base Rule",
      description: "Base class for maintainability rules",
      category: ReviewCategory.MAINTAINABILITY,
      severity: ReviewSeverity.MEDIUM,
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    });
  }
}

export class LongFunctionRule extends MaintainabilityRule {
  constructor() {
    super();
    this.id = "long-function";
    this.name = "Long Function Detection";
    this.description =
      "Detect functions that are too long and should be refactored";
    this.config = {
      maxLines: 50,
      languages: {
        javascript: 50,
        typescript: 50,
        python: 40,
        java: 60,
        go: 50,
        rust: 60,
      },
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const ext = context.language || "javascript";
    const maxLines = this.config.languages[ext] || this.config.maxLines;

    let inFunction = false;
    let functionStart = 0;
    let functionName = "";
    let currentLine = 0;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function start in various languages
      if (!inFunction) {
        const jsFunctionMatch = trimmed.match(
          /^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|let\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|var\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/,
        );
        const pythonFunctionMatch = trimmed.match(/^def\s+(\w+)\s*\(/);
        const javaFunctionMatch = trimmed.match(
          /^(?:public|private|protected)\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(/,
        );
        const goFunctionMatch = trimmed.match(/^func\s+(\w+)\s*\(/);
        const rustFunctionMatch = trimmed.match(/^fn\s+(\w+)\s*\(/);

        if (
          jsFunctionMatch ||
          pythonFunctionMatch ||
          javaFunctionMatch ||
          goFunctionMatch ||
          rustFunctionMatch
        ) {
          inFunction = true;
          functionStart = i;
          functionName =
            jsFunctionMatch?.[1] ||
            jsFunctionMatch?.[2] ||
            jsFunctionMatch?.[3] ||
            jsFunctionMatch?.[4] ||
            pythonFunctionMatch?.[1] ||
            javaFunctionMatch?.[1] ||
            goFunctionMatch?.[1] ||
            rustFunctionMatch?.[1] ||
            "anonymous";
        }
      }

      if (inFunction) {
        // Count braces for JavaScript/Java/Go/Rust
        if (["javascript", "typescript", "java", "go", "rust"].includes(ext)) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;

          // Function ends when brace count returns to 0
          if (braceCount === 0 && i > functionStart) {
            const functionLength = i - functionStart + 1;
            if (functionLength > maxLines) {
              issues.push({
                ruleId: this.id,
                severity: this.severity,
                category: this.category,
                message: `Function "${functionName}" is too long (${functionLength} lines, max ${maxLines}). Consider breaking it into smaller functions.`,
                filePath,
                line: functionStart + 1,
                endLine: i + 1,
                suggestion:
                  "Refactor this function into smaller, more focused functions with single responsibilities.",
                codeSnippet: lines
                  .slice(functionStart, Math.min(functionStart + 5, i + 1))
                  .join("\n"),
              });
            }
            inFunction = false;
            functionStart = 0;
            functionName = "";
            braceCount = 0;
          }
        }
        // For Python, function ends at next function definition or end of indentation
        else if (ext === "python" && inFunction) {
          // Check if this line starts a new function or class
          if (
            i > functionStart &&
            (trimmed.match(/^def\s+\w+\s*\(/) || trimmed.match(/^class\s+\w+/))
          ) {
            const functionLength = i - functionStart;
            if (functionLength > maxLines) {
              issues.push({
                ruleId: this.id,
                severity: this.severity,
                category: this.category,
                message: `Function "${functionName}" is too long (${functionLength} lines, max ${maxLines}). Consider breaking it into smaller functions.`,
                filePath,
                line: functionStart + 1,
                endLine: i,
                suggestion:
                  "Refactor this function into smaller, more focused functions with single responsibilities.",
                codeSnippet: lines
                  .slice(functionStart, Math.min(functionStart + 5, i))
                  .join("\n"),
              });
            }
            inFunction = false;
            functionStart = 0;
            functionName = "";
          }
          // Check if we've reached end of file
          else if (i === lines.length - 1) {
            const functionLength = i - functionStart + 1;
            if (functionLength > maxLines) {
              issues.push({
                ruleId: this.id,
                severity: this.severity,
                category: this.category,
                message: `Function "${functionName}" is too long (${functionLength} lines, max ${maxLines}). Consider breaking it into smaller functions.`,
                filePath,
                line: functionStart + 1,
                endLine: i + 1,
                suggestion:
                  "Refactor this function into smaller, more focused functions with single responsibilities.",
                codeSnippet: lines
                  .slice(functionStart, Math.min(functionStart + 5, i + 1))
                  .join("\n"),
              });
            }
          }
        }
      }
    }

    return issues;
  }
}

export class HighComplexityRule extends MaintainabilityRule {
  constructor() {
    super();
    this.id = "high-complexity";
    this.name = "High Cyclomatic Complexity";
    this.description = "Detect functions with high cyclomatic complexity";
    this.config = {
      maxComplexity: 10,
      complexityWeights: {
        if: 1,
        "else if": 1,
        else: 1,
        for: 1,
        while: 1,
        do: 1,
        switch: 1,
        case: 1,
        default: 1,
        "&&": 1,
        "||": 1,
        catch: 1,
        "?:": 1,
      },
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const ext = context.language || "javascript";

    // This is a simplified complexity check
    // In a real implementation, you'd want to use a proper AST parser
    let inFunction = false;
    let functionStart = 0;
    let functionName = "";
    let complexity = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function start
      if (!inFunction) {
        const functionMatch = trimmed.match(
          /^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/,
        );
        if (functionMatch) {
          inFunction = true;
          functionStart = i;
          functionName =
            functionMatch[1] ||
            functionMatch[2] ||
            functionMatch[3] ||
            functionMatch[4] ||
            functionMatch[5] ||
            functionMatch[6] ||
            "anonymous";
          complexity = 0;
        }
      }

      if (inFunction) {
        // Count complexity factors
        const lowerLine = line.toLowerCase();

        // Count control flow statements
        if (lowerLine.includes(" if ") || trimmed.startsWith("if("))
          complexity += 1;
        if (lowerLine.includes(" else if ") || trimmed.startsWith("else if("))
          complexity += 1;
        if (trimmed.startsWith("else") && !trimmed.startsWith("else if"))
          complexity += 1;
        if (lowerLine.includes(" for ") || trimmed.startsWith("for("))
          complexity += 1;
        if (lowerLine.includes(" while ") || trimmed.startsWith("while("))
          complexity += 1;
        if (lowerLine.includes(" switch ") || trimmed.startsWith("switch("))
          complexity += 1;
        if (trimmed.startsWith("case ") || trimmed.startsWith("default:"))
          complexity += 1;
        if (lowerLine.includes(" catch ") || trimmed.startsWith("catch("))
          complexity += 1;

        // Count logical operators (simplified)
        const andCount = (line.match(/&&/g) || []).length;
        const orCount = (line.match(/\|\|/g) || []).length;
        complexity += andCount + orCount;

        // Detect function end
        let functionEnded = false;

        if (["javascript", "typescript", "java", "go", "rust"].includes(ext)) {
          // Function ends when we see a line starting with another function/class
          if (i > functionStart) {
            const nextFunctionMatch = trimmed.match(
              /^(?:export\s+)?(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|class\s+\w+|public\s+(?:static\s+)?(?:[\w<>]+\s+)?\w+\s*\(|func\s+\w+\s*\(|fn\s+\w+\s*\()/,
            );
            if (nextFunctionMatch) {
              functionEnded = true;
            }
          }
        } else if (ext === "python") {
          // Python function ends at next function/class definition
          if (
            i > functionStart &&
            (trimmed.match(/^def\s+\w+\s*\(/) || trimmed.match(/^class\s+\w+/))
          ) {
            functionEnded = true;
          }
        }

        // Check complexity at function end
        if (functionEnded || i === lines.length - 1) {
          if (complexity > this.config.maxComplexity) {
            issues.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              message: `Function "${functionName}" has high cyclomatic complexity (${complexity}, max ${this.config.maxComplexity}). Consider refactoring.`,
              filePath,
              line: functionStart + 1,
              endLine: i + 1,
              suggestion:
                "Simplify the control flow by extracting complex conditions into separate functions or using early returns.",
              codeSnippet: lines
                .slice(functionStart, Math.min(functionStart + 3, i + 1))
                .join("\n"),
            });
          }

          if (functionEnded) {
            // Start tracking the new function
            const functionMatch = trimmed.match(
              /^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/,
            );
            if (functionMatch) {
              functionStart = i;
              functionName =
                functionMatch[1] ||
                functionMatch[2] ||
                functionMatch[3] ||
                functionMatch[4] ||
                functionMatch[5] ||
                functionMatch[6] ||
                "anonymous";
              complexity = 0;
            } else {
              inFunction = false;
            }
          }
        }
      }
    }

    return issues;
  }
}

export class DeepNestingRule extends MaintainabilityRule {
  constructor() {
    super();
    this.id = "deep-nesting";
    this.name = "Deep Nesting Detection";
    this.description = "Detect deeply nested code blocks";
    this.config = {
      maxDepth: 4,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");

    let currentDepth = 0;
    let maxDepthInBlock = 0;
    let blockStartLine = 0;
    let inBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Count opening braces/brackets/parentheses
      const openCount = (line.match(/{|\(|\[/g) || []).length;
      const closeCount = (line.match(/}|\)|\]/g) || []).length;

      currentDepth += openCount - closeCount;

      // Track maximum depth
      if (currentDepth > maxDepthInBlock) {
        maxDepthInBlock = currentDepth;
        if (!inBlock && currentDepth > 0) {
          inBlock = true;
          blockStartLine = i + 1;
        }
      }

      // Check if we've exited a deeply nested block
      if (inBlock && currentDepth <= 0) {
        if (maxDepthInBlock > this.config.maxDepth) {
          issues.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            message: `Deeply nested code block detected (depth: ${maxDepthInBlock}, max: ${this.config.maxDepth})`,
            filePath,
            line: blockStartLine,
            endLine: i + 1,
            suggestion:
              "Reduce nesting by extracting deeply nested code into separate functions or using guard clauses.",
            codeSnippet: lines
              .slice(
                Math.max(0, blockStartLine - 2),
                Math.min(i + 1, blockStartLine + 3),
              )
              .join("\n"),
          });
        }

        inBlock = false;
        maxDepthInBlock = 0;
        blockStartLine = 0;
      }
    }

    // Check if file ends with a deeply nested block
    if (inBlock && maxDepthInBlock > this.config.maxDepth) {
      issues.push({
        ruleId: this.id,
        severity: this.severity,
        category: this.category,
        message: `Deeply nested code block detected (depth: ${maxDepthInBlock}, max: ${this.config.maxDepth})`,
        filePath,
        line: blockStartLine,
        endLine: lines.length,
        suggestion:
          "Reduce nesting by extracting deeply nested code into separate functions or using guard clauses.",
        codeSnippet: lines
          .slice(
            Math.max(0, blockStartLine - 2),
            Math.min(lines.length, blockStartLine + 3),
          )
          .join("\n"),
      });
    }

    return issues;
  }
}
