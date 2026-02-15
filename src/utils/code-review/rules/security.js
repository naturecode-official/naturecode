// Security-related code review rules

import { ReviewRule, ReviewSeverity, ReviewCategory } from "../types.js";

export class SecurityRule extends ReviewRule {
  constructor() {
    super({
      id: "security-base",
      name: "Security Base Rule",
      description: "Base class for security rules",
      category: ReviewCategory.SECURITY,
      severity: ReviewSeverity.HIGH,
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    });
  }
}

export class NoHardcodedSecretsRule extends SecurityRule {
  constructor() {
    super();
    this.id = "no-hardcoded-secrets";
    this.name = "No Hardcoded Secrets";
    this.description =
      "Detect hardcoded passwords, API keys, and other secrets";
    this.config = {
      secretPatterns: [
        /password\s*=\s*["'][^"']+["']/i,
        /api[_-]?key\s*=\s*["'][^"']+["']/i,
        /secret\s*=\s*["'][^"']+["']/i,
        /token\s*=\s*["'][^"']+["']/i,
        /["'][A-Za-z0-9+/]{40,}["']/, // Base64-like strings
        /["'][0-9a-f]{32,}["']/i, // Hex strings (MD5, SHA, etc.)
      ],
      excludeComments: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { secretPatterns, excludeComments } = this.config;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comments if configured
      if (excludeComments) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("#") ||
          trimmed.startsWith("/*")
        ) {
          continue;
        }
      }

      for (const pattern of secretPatterns) {
        if (pattern.test(line)) {
          issues.push({
            filePath,
            line: lineNumber,
            message: "Hardcoded secret detected",
            description:
              "Avoid hardcoding passwords, API keys, or other secrets in source code.",
            suggestion:
              "Use environment variables, configuration files, or secret management services.",
            codeSnippet: line.trim(),
            severity: ReviewSeverity.CRITICAL,
            category: ReviewCategory.SECURITY,
            ruleId: this.id,
            confidence: 0.9,
            tags: ["security", "secrets", "hardcoded"],
          });
          break; // Only report once per line
        }
      }
    }

    return issues;
  }
}

export class SqlInjectionRule extends SecurityRule {
  constructor() {
    super();
    this.id = "sql-injection";
    this.name = "SQL Injection Prevention";
    this.description = "Detect potential SQL injection vulnerabilities";
    this.languages = ["javascript", "typescript", "python", "java", "php"];
    this.config = {
      stringConcatenationPatterns: [
        /\+\s*["'][^"']*["']\s*\+\s*\w+/,
        /\$\{.*?\}/, // Template literals
        /["'].*?\$\{.*?\}.*?["']/, // Template literals in strings
      ],
      sqlKeywords: ["SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "CREATE"],
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { stringConcatenationPatterns, sqlKeywords } = this.config;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for SQL keywords
      const hasSqlKeyword = sqlKeywords.some((keyword) =>
        new RegExp(`\\b${keyword}\\b`, "i").test(line),
      );

      if (hasSqlKeyword) {
        // Check for string concatenation with variables
        for (const pattern of stringConcatenationPatterns) {
          if (pattern.test(line)) {
            issues.push({
              filePath,
              line: lineNumber,
              message: "Potential SQL injection vulnerability",
              description:
                "String concatenation with user input in SQL queries can lead to SQL injection.",
              suggestion:
                "Use parameterized queries, prepared statements, or ORM with proper escaping.",
              codeSnippet: line.trim(),
              severity: ReviewSeverity.CRITICAL,
              category: ReviewCategory.SECURITY,
              ruleId: this.id,
              confidence: 0.8,
              tags: ["security", "sql", "injection"],
            });
            break;
          }
        }
      }
    }

    return issues;
  }
}

export class XssRule extends SecurityRule {
  constructor() {
    super();
    this.id = "xss-prevention";
    this.name = "XSS Prevention";
    this.description =
      "Detect potential Cross-Site Scripting (XSS) vulnerabilities";
    this.languages = ["javascript", "typescript"];
    this.config = {
      domManipulationMethods: [
        "innerHTML",
        "outerHTML",
        "document.write",
        "document.writeln",
        "eval",
        "setTimeout",
        "setInterval",
      ],
      userInputSources: [
        "location",
        "document.URL",
        "document.referrer",
        "window.name",
        "localStorage",
        "sessionStorage",
        "cookie",
      ],
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { domManipulationMethods, userInputSources } = this.config;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for DOM manipulation methods
      const hasDomMethod = domManipulationMethods.some((method) =>
        line.includes(method),
      );

      if (hasDomMethod) {
        // Check if user input is being used
        const hasUserInput = userInputSources.some((source) =>
          line.includes(source),
        );

        if (hasUserInput) {
          issues.push({
            filePath,
            line: lineNumber,
            message: "Potential XSS vulnerability",
            description:
              "Unsanitized user input used in DOM manipulation can lead to XSS attacks.",
            suggestion:
              "Sanitize user input, use textContent instead of innerHTML, or use a trusted library for DOM manipulation.",
            codeSnippet: line.trim(),
            severity: ReviewSeverity.HIGH,
            category: ReviewCategory.SECURITY,
            ruleId: this.id,
            confidence: 0.7,
            tags: ["security", "xss", "dom"],
          });
        }
      }
    }

    return issues;
  }
}

export class InsecureRandomRule extends SecurityRule {
  constructor() {
    super();
    this.id = "insecure-random";
    this.name = "Insecure Random Number Generation";
    this.description = "Detect use of insecure random number generators";
    this.languages = ["javascript", "typescript"];
    this.config = {
      insecureMethods: ["Math.random()"],
      secureAlternatives: ["crypto.getRandomValues()", "crypto.randomBytes()"],
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { insecureMethods } = this.config;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      for (const method of insecureMethods) {
        if (line.includes(method)) {
          issues.push({
            filePath,
            line: lineNumber,
            message: "Insecure random number generation",
            description:
              "Math.random() is not cryptographically secure and should not be used for security-sensitive operations.",
            suggestion:
              "Use crypto.getRandomValues() for cryptographic randomness in browsers, or crypto.randomBytes() in Node.js.",
            codeSnippet: line.trim(),
            severity: ReviewSeverity.MEDIUM,
            category: ReviewCategory.SECURITY,
            ruleId: this.id,
            confidence: 0.9,
            tags: ["security", "crypto", "random"],
          });
          break;
        }
      }
    }

    return issues;
  }
}
