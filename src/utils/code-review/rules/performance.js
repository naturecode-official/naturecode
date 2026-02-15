// Performance-related code review rules

import { ReviewRule, ReviewSeverity, ReviewCategory } from "../types.js";

export class PerformanceRule extends ReviewRule {
  constructor() {
    super({
      id: "performance-base",
      name: "Performance Base Rule",
      description: "Base class for performance rules",
      category: ReviewCategory.PERFORMANCE,
      severity: ReviewSeverity.MEDIUM,
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    });
  }
}

export class NPlusOneQueryRule extends PerformanceRule {
  constructor() {
    super();
    this.id = "n-plus-one-query";
    this.name = "N+1 Query Problem";
    this.description = "Detect potential N+1 query problems in database access";
    this.languages = ["javascript", "typescript", "python", "java"];
    this.config = {
      loopKeywords: ["for", "while", "forEach", "map", "filter"],
      queryMethods: [".find(", ".findOne(", ".query(", ".select(", ".where("],
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");

    // Simple detection: look for database queries inside loops
    let inLoop = false;
    let loopStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if we're entering a loop
      if (
        this.config.loopKeywords.some((keyword) => trimmed.startsWith(keyword))
      ) {
        inLoop = true;
        loopStartLine = i + 1;
      }

      // Check if we're in a loop and see a database query
      if (
        inLoop &&
        this.config.queryMethods.some((method) => line.includes(method))
      ) {
        issues.push({
          filePath,
          line: i + 1,
          message: "Potential N+1 query problem",
          description:
            "Database query inside a loop can lead to performance issues (N+1 query problem).",
          suggestion:
            "Consider using eager loading, batch queries, or JOIN operations to reduce database round trips.",
          codeSnippet: line.trim(),
          severity: ReviewSeverity.HIGH,
          category: ReviewCategory.PERFORMANCE,
          ruleId: this.id,
          confidence: 0.6,
          tags: ["performance", "database", "query"],
        });
      }

      // Check if we're exiting the loop (simple detection)
      if (inLoop && trimmed === "}") {
        inLoop = false;
      }
    }

    return issues;
  }
}

export class MemoryLeakRule extends PerformanceRule {
  constructor() {
    super();
    this.id = "memory-leak";
    this.name = "Memory Leak Detection";
    this.description =
      "Detect potential memory leaks in event listeners and timers";
    this.languages = ["javascript", "typescript"];
    this.config = {
      eventMethods: [".addEventListener(", ".on(", ".once("],
      timerMethods: ["setTimeout(", "setInterval(", "setImmediate("],
      cleanupMethods: [
        ".removeEventListener(",
        ".off(",
        "clearTimeout(",
        "clearInterval(",
      ],
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");

    // Track event listeners and timers
    const eventsAndTimers = [];
    const cleanups = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for event listeners and timers
      for (const method of [
        ...this.config.eventMethods,
        ...this.config.timerMethods,
      ]) {
        if (line.includes(method)) {
          eventsAndTimers.push({
            line: i + 1,
            method: method.replace("(", ""),
            code: line.trim(),
          });
        }
      }

      // Check for cleanup methods
      for (const method of this.config.cleanupMethods) {
        if (line.includes(method)) {
          cleanups.push({
            line: i + 1,
            method: method.replace("(", ""),
            code: line.trim(),
          });
        }
      }
    }

    // Simple heuristic: if we have more events/timers than cleanups, warn
    if (eventsAndTimers.length > cleanups.length * 1.5) {
      for (const event of eventsAndTimers) {
        issues.push({
          filePath,
          line: event.line,
          message: "Potential memory leak",
          description: `Event listener or timer (${event.method}) may not be properly cleaned up.`,
          suggestion:
            "Ensure event listeners and timers are removed when no longer needed, especially in component lifecycle methods.",
          codeSnippet: event.code,
          severity: ReviewSeverity.MEDIUM,
          category: ReviewCategory.PERFORMANCE,
          ruleId: this.id,
          confidence: 0.5,
          tags: ["performance", "memory", "leak"],
        });
      }
    }

    return issues;
  }
}

export class LargeObjectRule extends PerformanceRule {
  constructor() {
    super();
    this.id = "large-object";
    this.name = "Large Object Creation";
    this.description =
      "Detect creation of large objects in performance-critical code";
    this.config = {
      maxObjectSize: 1000, // Arbitrary threshold
      performanceCriticalContexts: [
        "render",
        "animation",
        "game loop",
        "real-time",
      ],
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");

    // Simple detection: look for large array or object literals
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for large array literals
      if (line.includes("[") && line.includes("]")) {
        const betweenBrackets = line.substring(
          line.indexOf("[") + 1,
          line.lastIndexOf("]"),
        );
        const items = betweenBrackets.split(",").filter((item) => item.trim());

        if (items.length > this.config.maxObjectSize / 10) {
          // Rough estimate
          issues.push({
            filePath,
            line: i + 1,
            message: "Large array literal",
            description:
              "Large array literals can impact performance, especially if created frequently.",
            suggestion:
              "Consider lazy loading, pagination, or streaming for large data sets.",
            codeSnippet: line.trim().substring(0, 100) + "...",
            severity: ReviewSeverity.LOW,
            category: ReviewCategory.PERFORMANCE,
            ruleId: this.id,
            confidence: 0.4,
            tags: ["performance", "memory", "array"],
          });
        }
      }

      // Check for large object literals
      if (line.includes("{") && line.includes("}")) {
        const betweenBraces = line.substring(
          line.indexOf("{") + 1,
          line.lastIndexOf("}"),
        );
        const properties = betweenBraces
          .split(",")
          .filter((prop) => prop.trim());

        if (properties.length > this.config.maxObjectSize / 20) {
          // Rough estimate
          issues.push({
            filePath,
            line: i + 1,
            message: "Large object literal",
            description:
              "Large object literals can impact performance and memory usage.",
            suggestion:
              "Consider breaking large objects into smaller ones or using lazy initialization.",
            codeSnippet: line.trim().substring(0, 100) + "...",
            severity: ReviewSeverity.LOW,
            category: ReviewCategory.PERFORMANCE,
            ruleId: this.id,
            confidence: 0.4,
            tags: ["performance", "memory", "object"],
          });
        }
      }
    }

    return issues;
  }
}

export class StringConcatenationRule extends PerformanceRule {
  constructor() {
    super();
    this.id = "string-concatenation";
    this.name = "Inefficient String Concatenation";
    this.description = "Detect inefficient string concatenation in loops";
    this.languages = ["javascript", "typescript", "python", "java"];
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");

    let inLoop = false;
    let hasStringConcatInLoop = false;
    let loopStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if we're entering a loop
      if (
        trimmed.startsWith("for") ||
        trimmed.startsWith("while") ||
        trimmed.includes(".forEach")
      ) {
        inLoop = true;
        loopStartLine = i + 1;
        hasStringConcatInLoop = false;
      }

      // Check for string concatenation in loop
      if (inLoop) {
        // Look for += with strings or + with strings
        if (
          (line.includes("+=") && (line.includes('"') || line.includes("'"))) ||
          (line.includes("+") && line.includes('"') && line.includes("+"))
        ) {
          hasStringConcatInLoop = true;
        }
      }

      // Check if we're exiting the loop
      if (inLoop && trimmed === "}") {
        if (hasStringConcatInLoop) {
          issues.push({
            filePath,
            line: loopStartLine,
            message: "Inefficient string concatenation in loop",
            description:
              "String concatenation in loops can be inefficient due to string immutability.",
            suggestion:
              "Use array.join() or string builder pattern for better performance.",
            codeSnippet: lines[loopStartLine - 1].trim(),
            severity: ReviewSeverity.MEDIUM,
            category: ReviewCategory.PERFORMANCE,
            ruleId: this.id,
            confidence: 0.7,
            tags: ["performance", "string", "loop"],
          });
        }
        inLoop = false;
      }
    }

    return issues;
  }
}
