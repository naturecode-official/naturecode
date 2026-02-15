// Readability-related code review rules

import { ReviewRule, ReviewSeverity, ReviewCategory } from "../types.js";

export class ReadabilityRule extends ReviewRule {
  constructor() {
    super({
      id: "readability-base",
      name: "Readability Base Rule",
      description: "Base class for readability rules",
      category: ReviewCategory.READABILITY,
      severity: ReviewSeverity.LOW,
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    });
  }
}

export class LongLineRule extends ReadabilityRule {
  constructor() {
    super();
    this.id = "long-line";
    this.name = "Long Line Detection";
    this.description = "Detect lines that are too long and hard to read";
    this.config = {
      maxLength: 100,
      excludeUrls: true,
      excludeImportStatements: false,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { maxLength, excludeUrls, excludeImportStatements } = this.config;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip empty lines
      if (line.trim().length === 0) continue;

      // Check line length
      if (line.length > maxLength) {
        // Check if we should exclude this line
        let shouldExclude = false;
        const trimmed = line.trim();

        if (
          (excludeUrls && trimmed.includes("http://")) ||
          trimmed.includes("https://")
        ) {
          shouldExclude = true;
        }

        if (
          excludeImportStatements &&
          (trimmed.startsWith("import ") ||
            trimmed.startsWith("from ") ||
            trimmed.startsWith("require(") ||
            trimmed.startsWith("include ") ||
            trimmed.startsWith("using "))
        ) {
          shouldExclude = true;
        }

        if (!shouldExclude) {
          issues.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            message: `Line too long (${line.length} characters, max ${maxLength})`,
            filePath,
            line: lineNumber,
            endLine: lineNumber,
            suggestion:
              "Break this line into multiple lines or extract parts into variables.",
            codeSnippet: line.substring(0, Math.min(line.length, 120)),
          });
        }
      }
    }

    return issues;
  }
}

export class MagicNumberRule extends ReadabilityRule {
  constructor() {
    super();
    this.id = "magic-number";
    this.name = "Magic Number Detection";
    this.description = "Detect unexplained numeric literals in code";
    this.config = {
      excludedNumbers: [0, 1, -1, 100, 1000, 1024, 60, 24, 12, 365],
      maxAllowed: 5, // Maximum value before it's considered a magic number
      checkInArrays: true,
      checkInComparisons: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { excludedNumbers, maxAllowed, checkInArrays, checkInComparisons } =
      this.config;

    // Patterns to detect magic numbers
    const magicNumberPatterns = [
      // Numbers in assignments: x = 42
      /(?:const|let|var)\s+\w+\s*=\s*(-?\d+(?:\.\d+)?)/g,
      // Numbers in function arguments: func(42)
      /\(\s*(-?\d+(?:\.\d+)?)\s*\)/g,
      // Numbers in comparisons: x > 42
      /[<>]=?\s*(-?\d+(?:\.\d+)?)/g,
      // Numbers in arithmetic: x + 42
      /[+\-*/%]\s*(-?\d+(?:\.\d+)?)/g,
    ];

    if (checkInArrays) {
      magicNumberPatterns.push(/\[\s*(-?\d+(?:\.\d+)?)\s*\]/g);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comment lines
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("/*")
      ) {
        continue;
      }

      // Check each pattern
      for (const pattern of magicNumberPatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          const number = parseFloat(match[1]);

          // Check if it's a magic number
          if (
            !isNaN(number) &&
            Math.abs(number) > maxAllowed &&
            !excludedNumbers.includes(number) &&
            !excludedNumbers.includes(Math.abs(number))
          ) {
            // Check if this is in a string (like "error 404")
            const matchIndex = match.index || 0;
            const beforeMatch = line.substring(0, matchIndex);
            const afterMatch = line.substring(matchIndex + match[0].length);

            // Skip if it's part of a string or comment
            const beforeQuotes = (beforeMatch.match(/"/g) || []).length;
            const afterQuotes = (afterMatch.match(/"/g) || []).length;
            const beforeSingleQuotes = (beforeMatch.match(/'/g) || []).length;
            const afterSingleQuotes = (afterMatch.match(/'/g) || []).length;
            const beforeBackticks = (beforeMatch.match(/`/g) || []).length;
            const afterBackticks = (afterMatch.match(/`/g) || []).length;

            const inString =
              (beforeQuotes % 2 === 1 && afterQuotes % 2 === 0) ||
              (beforeSingleQuotes % 2 === 1 && afterSingleQuotes % 2 === 0) ||
              (beforeBackticks % 2 === 1 && afterBackticks % 2 === 0);

            if (!inString) {
              issues.push({
                ruleId: this.id,
                severity: this.severity,
                category: this.category,
                message: `Magic number detected: ${number}`,
                filePath,
                line: lineNumber,
                endLine: lineNumber,
                suggestion:
                  "Replace this magic number with a named constant to improve readability.",
                codeSnippet: line.substring(
                  Math.max(0, matchIndex - 20),
                  Math.min(line.length, matchIndex + match[0].length + 20),
                ),
              });
            }
          }
        }
      }
    }

    return issues;
  }
}

export class InconsistentNamingRule extends ReadabilityRule {
  constructor() {
    super();
    this.id = "inconsistent-naming";
    this.name = "Inconsistent Naming Convention";
    this.description =
      "Detect inconsistent naming conventions (camelCase vs snake_case)";
    this.config = {
      languageConventions: {
        javascript: "camelCase",
        typescript: "camelCase",
        python: "snake_case",
        java: "camelCase",
        go: "camelCase",
        rust: "snake_case",
      },
      checkVariables: true,
      checkFunctions: true,
      checkClasses: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const ext = context.language || "javascript";
    const expectedConvention =
      this.config.languageConventions[ext] || "camelCase";

    // Patterns for different naming contexts
    const variablePattern = /(?:const|let|var)\s+(\w+)\s*=/g;
    const functionPattern =
      /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/g;
    const classPattern = /class\s+(\w+)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comment lines
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("/*")
      ) {
        continue;
      }

      // Check variable names
      if (this.config.checkVariables) {
        const varMatches = [...line.matchAll(variablePattern)];
        for (const match of varMatches) {
          const name = match[1];
          if (name && !this.isValidName(name, expectedConvention)) {
            issues.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              message: `Variable "${name}" doesn't follow ${expectedConvention} convention`,
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion: `Rename variable to follow ${expectedConvention} convention (e.g., "${this.suggestName(name, expectedConvention)}")`,
              codeSnippet: line,
            });
          }
        }
      }

      // Check function names
      if (this.config.checkFunctions) {
        const funcMatches = [...line.matchAll(functionPattern)];
        for (const match of funcMatches) {
          const name =
            match[1] ||
            match[2] ||
            match[3] ||
            match[4] ||
            match[5] ||
            match[6];
          if (name && !this.isValidName(name, expectedConvention)) {
            issues.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              message: `Function "${name}" doesn't follow ${expectedConvention} convention`,
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion: `Rename function to follow ${expectedConvention} convention (e.g., "${this.suggestName(name, expectedConvention)}")`,
              codeSnippet: line,
            });
          }
        }
      }

      // Check class names
      if (this.config.checkClasses) {
        const classMatches = [...line.matchAll(classPattern)];
        for (const match of classMatches) {
          const name = match[1];
          if (name && !this.isValidClassName(name)) {
            issues.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              message: `Class "${name}" doesn't follow PascalCase convention`,
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion: `Rename class to follow PascalCase convention (e.g., "${this.suggestClassName(name)}")`,
              codeSnippet: line,
            });
          }
        }
      }
    }

    return issues;
  }

  isValidName(name, convention) {
    if (convention === "camelCase") {
      // camelCase: first letter lowercase, no underscores
      return /^[a-z][a-zA-Z0-9]*$/.test(name) && !name.includes("_");
    } else if (convention === "snake_case") {
      // snake_case: lowercase with underscores
      return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(name);
    }
    return true;
  }

  isValidClassName(name) {
    // PascalCase: first letter uppercase, no underscores
    return /^[A-Z][a-zA-Z0-9]*$/.test(name) && !name.includes("_");
  }

  suggestName(name, convention) {
    if (convention === "camelCase") {
      // Convert snake_case to camelCase
      return name
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        .replace(/^[A-Z]/, (first) => first.toLowerCase());
    } else if (convention === "snake_case") {
      // Convert camelCase to snake_case
      return name
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
    }
    return name;
  }

  suggestClassName(name) {
    // Ensure first letter is uppercase
    return (
      name.charAt(0).toUpperCase() +
      name.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    );
  }
}

export class CommentQualityRule extends ReadabilityRule {
  constructor() {
    super();
    this.id = "comment-quality";
    this.name = "Comment Quality Check";
    this.description = "Check comment quality and usefulness";
    this.config = {
      minCommentLength: 10,
      checkTodoComments: true,
      checkFixmeComments: true,
      checkCommentedCode: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const {
      minCommentLength,
      checkTodoComments,
      checkFixmeComments,
      checkCommentedCode,
    } = this.config;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmed = line.trim();

      // Check for TODO comments
      if (checkTodoComments && trimmed.toLowerCase().includes("todo")) {
        issues.push({
          ruleId: this.id,
          severity: ReviewSeverity.LOW,
          category: this.category,
          message: "TODO comment found",
          filePath,
          line: lineNumber,
          endLine: lineNumber,
          suggestion: "Address this TODO comment or create a task to track it.",
          codeSnippet: line,
        });
      }

      // Check for FIXME comments
      if (checkFixmeComments && trimmed.toLowerCase().includes("fixme")) {
        issues.push({
          ruleId: this.id,
          severity: ReviewSeverity.MEDIUM,
          category: this.category,
          message: "FIXME comment found",
          filePath,
          line: lineNumber,
          endLine: lineNumber,
          suggestion: "This indicates code that needs fixing. Address it soon.",
          codeSnippet: line,
        });
      }

      // Check for commented code
      if (checkCommentedCode) {
        // Look for lines that look like code but are commented
        if (
          (trimmed.startsWith("//") || trimmed.startsWith("#")) &&
          trimmed.length > 2
        ) {
          const commentContent = trimmed.substring(2).trim();

          // Check if it looks like code (contains common code patterns)
          const looksLikeCode =
            commentContent.includes("=") ||
            commentContent.includes("(") ||
            commentContent.includes("{") ||
            commentContent.includes(";") ||
            commentContent.includes("return") ||
            commentContent.includes("if ") ||
            commentContent.includes("for ") ||
            commentContent.includes("while ");

          if (looksLikeCode && commentContent.length < minCommentLength) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.LOW,
              category: this.category,
              message: "Commented code detected",
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion:
                "Remove commented code or uncomment it if it's still needed. Use version control for code history.",
              codeSnippet: line,
            });
          }
        }
      }

      // Check for very short comments that might not be useful
      if (
        (trimmed.startsWith("//") || trimmed.startsWith("#")) &&
        trimmed.length > 2
      ) {
        const commentContent = trimmed.substring(2).trim();
        if (
          commentContent.length < minCommentLength &&
          !commentContent.toLowerCase().includes("todo") &&
          !commentContent.toLowerCase().includes("fixme")
        ) {
          // Skip common short comments
          const commonShortComments = [
            "end",
            "begin",
            "start",
            "init",
            "close",
            "open",
          ];
          if (
            !commonShortComments.some((c) =>
              commentContent.toLowerCase().includes(c),
            )
          ) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.LOW,
              category: this.category,
              message: "Very short comment that may not be useful",
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion:
                "Add more context to this comment or remove it if it's not needed.",
              codeSnippet: line,
            });
          }
        }
      }
    }

    return issues;
  }
}
