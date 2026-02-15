// Best practice-related code review rules

import { ReviewRule, ReviewSeverity, ReviewCategory } from "../types.js";

export class BestPracticeRule extends ReviewRule {
  constructor() {
    super({
      id: "best-practice-base",
      name: "Best Practice Base Rule",
      description: "Base class for best practice rules",
      category: ReviewCategory.BEST_PRACTICE,
      severity: ReviewSeverity.MEDIUM,
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    });
  }
}

export class ErrorHandlingRule extends BestPracticeRule {
  constructor() {
    super();
    this.id = "error-handling";
    this.name = "Error Handling Best Practices";
    this.description = "Check for proper error handling patterns";
    this.config = {
      requireTryCatchForAsync: true,
      checkEmptyCatchBlocks: true,
      checkConsoleError: true,
      requireErrorLogging: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const {
      requireTryCatchForAsync,
      checkEmptyCatchBlocks,
      checkConsoleError,
      requireErrorLogging,
    } = this.config;

    let inAsyncFunction = false;
    let asyncFunctionStart = 0;
    let asyncFunctionName = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmed = line.trim();

      // Detect async function start
      if (
        trimmed.includes("async") &&
        (trimmed.includes("function") || trimmed.includes("=>"))
      ) {
        inAsyncFunction = true;
        asyncFunctionStart = lineNumber;

        // Extract function name
        const funcMatch = trimmed.match(
          /(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/,
        );
        asyncFunctionName =
          funcMatch?.[1] ||
          funcMatch?.[2] ||
          funcMatch?.[3] ||
          funcMatch?.[4] ||
          funcMatch?.[5] ||
          funcMatch?.[6] ||
          "anonymous";
      }

      // Check for empty catch blocks
      if (
        checkEmptyCatchBlocks &&
        trimmed.includes("catch") &&
        trimmed.includes("{")
      ) {
        // Find the matching closing brace
        let braceCount = 1;
        let j = i + 1;
        let catchContent = "";

        while (j < lines.length && braceCount > 0) {
          const nextLine = lines[j];
          braceCount += (nextLine.match(/{/g) || []).length;
          braceCount -= (nextLine.match(/}/g) || []).length;

          if (braceCount > 0) {
            catchContent += nextLine + "\n";
          }
          j++;
        }

        // Check if catch block is empty or only contains comments
        const cleanedContent = catchContent
          .replace(/\/\/.*$/gm, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .trim();
        if (cleanedContent.length === 0) {
          issues.push({
            ruleId: this.id,
            severity: ReviewSeverity.MEDIUM,
            category: this.category,
            message: "Empty catch block detected",
            filePath,
            line: lineNumber,
            endLine: j,
            suggestion:
              "Add proper error handling in the catch block. At minimum, log the error.",
            codeSnippet: lines
              .slice(i, Math.min(i + 3, lines.length))
              .join("\n"),
          });
        }
      }

      // Check for console.error without proper context
      if (checkConsoleError && trimmed.includes("console.error")) {
        // Check if error message includes context
        const errorMatch = trimmed.match(/console\.error\(([^)]+)\)/);
        if (errorMatch) {
          const errorContent = errorMatch[1];
          // Check if it's just a variable name without additional context
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(errorContent.trim())) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.LOW,
              category: this.category,
              message: "console.error without context",
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion:
                "Add descriptive context to error messages for better debugging.",
              codeSnippet: line,
            });
          }
        }
      }

      // Detect async function end
      if (inAsyncFunction && trimmed.includes("}") && !trimmed.includes("{")) {
        // Check if we've seen a try-catch in this async function
        let hasTryCatch = false;
        for (let k = asyncFunctionStart - 1; k < i; k++) {
          if (lines[k].includes("try") || lines[k].includes("catch")) {
            hasTryCatch = true;
            break;
          }
        }

        if (requireTryCatchForAsync && !hasTryCatch) {
          // Check if function contains async operations (await keywords)
          let hasAsyncOps = false;
          for (let k = asyncFunctionStart - 1; k < i; k++) {
            if (lines[k].includes("await")) {
              hasAsyncOps = true;
              break;
            }
          }

          if (hasAsyncOps) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.MEDIUM,
              category: this.category,
              message: `Async function "${asyncFunctionName}" lacks error handling`,
              filePath,
              line: asyncFunctionStart,
              endLine: lineNumber,
              suggestion:
                "Add try-catch blocks to handle potential errors in async operations.",
              codeSnippet: lines
                .slice(
                  asyncFunctionStart - 1,
                  Math.min(asyncFunctionStart + 2, i + 1),
                )
                .join("\n"),
            });
          }
        }

        inAsyncFunction = false;
        asyncFunctionStart = 0;
        asyncFunctionName = "";
      }
    }

    return issues;
  }
}

export class ResourceManagementRule extends BestPracticeRule {
  constructor() {
    super();
    this.id = "resource-management";
    this.name = "Resource Management Best Practices";
    this.description =
      "Check for proper resource management (file handles, connections, etc.)";
    this.config = {
      checkFileOperations: true,
      checkDatabaseConnections: true,
      checkHttpConnections: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const {
      checkFileOperations,
      checkDatabaseConnections,
      checkHttpConnections,
    } = this.config;

    // Patterns for resource acquisition
    const fileOpenPatterns = [
      /fs\.(?:createReadStream|createWriteStream|open|openSync)/,
      /require\s*\(\s*['"]fs['"]\s*\)/,
      /import.*from.*['"]fs['"]/,
      /open\(/,
      /fopen\(/,
    ];

    const dbConnectionPatterns = [
      /mysql\.createConnection/,
      /pg\.connect/,
      /mongoose\.connect/,
      /sequelize/,
      /createPool/,
      /getConnection/,
    ];

    const httpConnectionPatterns = [
      /http\.(?:createServer|request|get)/,
      /https\.(?:createServer|request|get)/,
      /fetch\(/,
      /axios\.(?:get|post|put|delete)/,
      /request\(/,
    ];

    // Track resource openings and check for corresponding closings
    const resourceOpenings = new Map(); // lineNumber -> {type, pattern}

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmed = line.trim();

      // Check for file operations
      if (checkFileOperations) {
        for (const pattern of fileOpenPatterns) {
          if (pattern.test(line)) {
            resourceOpenings.set(lineNumber, {
              type: "file",
              pattern: pattern.toString(),
            });
          }
        }

        // Check for file close operations
        if (
          line.includes(".close()") ||
          line.includes(".closeSync()") ||
          line.includes(".end()")
        ) {
          // Remove from openings if we find a close
          for (const [openLine, resource] of resourceOpenings) {
            if (resource.type === "file") {
              resourceOpenings.delete(openLine);
            }
          }
        }
      }

      // Check for database connections
      if (checkDatabaseConnections) {
        for (const pattern of dbConnectionPatterns) {
          if (pattern.test(line)) {
            resourceOpenings.set(lineNumber, {
              type: "database",
              pattern: pattern.toString(),
            });
          }
        }

        // Check for database close operations
        if (
          line.includes(".end()") ||
          line.includes(".close()") ||
          line.includes(".disconnect()")
        ) {
          for (const [openLine, resource] of resourceOpenings) {
            if (resource.type === "database") {
              resourceOpenings.delete(openLine);
            }
          }
        }
      }

      // Check for HTTP connections
      if (checkHttpConnections) {
        for (const pattern of httpConnectionPatterns) {
          if (pattern.test(line)) {
            resourceOpenings.set(lineNumber, {
              type: "http",
              pattern: pattern.toString(),
            });
          }
        }
      }
    }

    // Report unclosed resources
    for (const [lineNumber, resource] of resourceOpenings) {
      let message = "";
      let suggestion = "";

      switch (resource.type) {
        case "file":
          message = "File operation may not be properly closed";
          suggestion =
            "Ensure file handles are closed in finally blocks or using try-with-resources pattern.";
          break;
        case "database":
          message = "Database connection may not be properly closed";
          suggestion =
            "Ensure database connections are closed after use to prevent connection leaks.";
          break;
        case "http":
          message = "HTTP connection/request may need cleanup";
          suggestion =
            "Ensure HTTP connections are properly terminated and responses are consumed.";
          break;
      }

      issues.push({
        ruleId: this.id,
        severity: ReviewSeverity.MEDIUM,
        category: this.category,
        message,
        filePath,
        line: lineNumber,
        endLine: lineNumber,
        suggestion,
        codeSnippet: lines[lineNumber - 1],
      });
    }

    return issues;
  }
}

export class CodeDuplicationRule extends BestPracticeRule {
  constructor() {
    super();
    this.id = "code-duplication";
    this.name = "Code Duplication Detection";
    this.description = "Detect duplicated code patterns";
    this.config = {
      minDuplicateLines: 5,
      similarityThreshold: 0.8,
      checkFunctions: true,
      checkBlocks: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const {
      minDuplicateLines,
      similarityThreshold,
      checkFunctions,
      checkBlocks,
    } = this.config;

    // Simple duplication detection by comparing lines
    // In a real implementation, you'd want to use a more sophisticated algorithm

    if (checkFunctions) {
      // Extract function bodies
      const functions = this.extractFunctions(
        content,
        context.language || "javascript",
      );

      // Compare functions for similarity
      for (let i = 0; i < functions.length; i++) {
        for (let j = i + 1; j < functions.length; j++) {
          const func1 = functions[i];
          const func2 = functions[j];

          if (this.areFunctionsSimilar(func1, func2, similarityThreshold)) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.MEDIUM,
              category: this.category,
              message: `Similar functions found: "${func1.name}" and "${func2.name}"`,
              filePath,
              line: func1.startLine,
              endLine: func1.endLine,
              suggestion:
                "Consider extracting common code into a shared function to reduce duplication.",
              codeSnippet: func1.body.split("\n").slice(0, 5).join("\n"),
            });
          }
        }
      }
    }

    if (checkBlocks) {
      // Check for duplicate code blocks
      const blocks = this.extractCodeBlocks(lines, minDuplicateLines);

      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const block1 = blocks[i];
          const block2 = blocks[j];

          if (this.areBlocksSimilar(block1, block2, similarityThreshold)) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.LOW,
              category: this.category,
              message: "Similar code blocks detected",
              filePath,
              line: block1.startLine,
              endLine: block1.endLine,
              suggestion:
                "Consider extracting this duplicated logic into a reusable function.",
              codeSnippet: block1.lines.join("\n"),
            });
          }
        }
      }
    }

    return issues;
  }

  extractFunctions(content, language) {
    const functions = [];
    const lines = content.split("\n");

    // Simplified function extraction
    // In a real implementation, use AST parsing
    let inFunction = false;
    let currentFunction = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function start
      if (!inFunction) {
        const funcMatch = trimmed.match(
          /^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/,
        );
        if (funcMatch) {
          inFunction = true;
          currentFunction = {
            name:
              funcMatch[1] ||
              funcMatch[2] ||
              funcMatch[3] ||
              funcMatch[4] ||
              funcMatch[5] ||
              funcMatch[6] ||
              "anonymous",
            startLine: i + 1,
            body: "",
            lines: [],
          };
          braceCount = 0;
        }
      }

      if (inFunction && currentFunction) {
        currentFunction.body += line + "\n";
        currentFunction.lines.push(line);

        // Count braces for languages that use them
        if (
          ["javascript", "typescript", "java", "go", "rust"].includes(language)
        ) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;

          // Function ends when brace count returns to 0
          if (braceCount === 0 && i > currentFunction.startLine - 1) {
            currentFunction.endLine = i + 1;
            functions.push(currentFunction);
            inFunction = false;
            currentFunction = null;
          }
        } else if (language === "python") {
          // Python function ends at next function/class or end of indentation
          if (i > currentFunction.startLine - 1) {
            const nextLine = i < lines.length - 1 ? lines[i + 1] : "";
            const nextTrimmed = nextLine.trim();

            if (
              nextTrimmed.startsWith("def ") ||
              nextTrimmed.startsWith("class ") ||
              (nextLine.length > 0 &&
                nextLine[0] !== " " &&
                nextLine[0] !== "\t")
            ) {
              currentFunction.endLine = i + 1;
              functions.push(currentFunction);
              inFunction = false;
              currentFunction = null;
            } else if (i === lines.length - 1) {
              currentFunction.endLine = i + 1;
              functions.push(currentFunction);
              inFunction = false;
              currentFunction = null;
            }
          }
        }
      }
    }

    return functions;
  }

  extractCodeBlocks(lines, minLines) {
    const blocks = [];

    // Extract blocks of code (non-empty, non-comment lines)
    let currentBlock = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines and single-line comments
      if (
        trimmed.length === 0 ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("#")
      ) {
        if (currentBlock && currentBlock.lines.length >= minLines) {
          blocks.push(currentBlock);
        }
        currentBlock = null;
        continue;
      }

      // Skip multi-line comment starts
      if (trimmed.startsWith("/*") || trimmed.startsWith("*/")) {
        if (currentBlock && currentBlock.lines.length >= minLines) {
          blocks.push(currentBlock);
        }
        currentBlock = null;
        continue;
      }

      if (!currentBlock) {
        currentBlock = {
          startLine: i + 1,
          lines: [line],
        };
      } else {
        currentBlock.lines.push(line);
      }
    }

    // Add the last block if it exists
    if (currentBlock && currentBlock.lines.length >= minLines) {
      currentBlock.endLine = lines.length;
      blocks.push(currentBlock);
    }

    return blocks;
  }

  areFunctionsSimilar(func1, func2, threshold) {
    // Simple similarity check based on line count and content
    if (Math.abs(func1.lines.length - func2.lines.length) > 3) {
      return false;
    }

    // Compare normalized function bodies (remove variable names, etc.)
    const normalized1 = this.normalizeCode(func1.body);
    const normalized2 = this.normalizeCode(func2.body);

    const similarity = this.calculateSimilarity(normalized1, normalized2);
    return similarity >= threshold;
  }

  areBlocksSimilar(block1, block2, threshold) {
    if (Math.abs(block1.lines.length - block2.lines.length) > 2) {
      return false;
    }

    const normalized1 = this.normalizeCode(block1.lines.join("\n"));
    const normalized2 = this.normalizeCode(block2.lines.join("\n"));

    const similarity = this.calculateSimilarity(normalized1, normalized2);
    return similarity >= threshold;
  }

  normalizeCode(code) {
    // Remove comments
    let normalized = code.replace(/\/\/.*$/gm, "");
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove string literals
    normalized = normalized.replace(/["'][^"']*["']/g, '""');

    // Remove variable names (simplified)
    normalized = normalized.replace(/\b(?:const|let|var)\s+\w+/g, "var x");
    normalized = normalized.replace(/\bfunction\s+\w+/g, "function f");

    // Remove whitespace
    normalized = normalized.replace(/\s+/g, " ");

    return normalized.trim();
  }

  calculateSimilarity(str1, str2) {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(" "));
    const set2 = new Set(str2.split(" "));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }
}

export class SecurityBestPracticeRule extends BestPracticeRule {
  constructor() {
    super();
    this.id = "security-best-practice";
    this.name = "Security Best Practices";
    this.description = "Check for security-related best practices";
    this.config = {
      checkInputValidation: true,
      checkOutputEncoding: true,
      checkSecureDefaults: true,
      checkDeprecatedApis: true,
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const {
      checkInputValidation,
      checkOutputEncoding,
      checkSecureDefaults,
      checkDeprecatedApis,
    } = this.config;

    // Security patterns to check
    const securityPatterns = {
      // Input validation issues
      "eval-usage": {
        pattern: /\beval\s*\(/,
        message: "eval() function usage detected",
        severity: ReviewSeverity.HIGH,
        suggestion:
          "Avoid using eval() as it can execute arbitrary code. Use safer alternatives like JSON.parse() or Function constructor with validation.",
      },
      "function-constructor": {
        pattern: /\bnew\s+Function\s*\(/,
        message: "Function constructor usage detected",
        severity: ReviewSeverity.HIGH,
        suggestion:
          "Avoid using Function constructor with user input. It can lead to code injection vulnerabilities.",
      },
      "inner-html": {
        pattern: /\.innerHTML\s*=/,
        message: "innerHTML assignment detected",
        severity: ReviewSeverity.MEDIUM,
        suggestion:
          "Avoid using innerHTML with user input. Use textContent or properly sanitize the input.",
      },
      "document-write": {
        pattern: /document\.write\s*\(/,
        message: "document.write() usage detected",
        severity: ReviewSeverity.MEDIUM,
        suggestion:
          "Avoid using document.write() as it can lead to XSS vulnerabilities. Use DOM manipulation methods instead.",
      },

      // Output encoding issues
      "unescaped-output": {
        pattern: /<%=.*%>/,
        message: "Unescaped template output detected",
        severity: ReviewSeverity.MEDIUM,
        suggestion:
          "Ensure template outputs are properly escaped to prevent XSS attacks.",
      },

      // Secure defaults
      "insecure-random": {
        pattern: /Math\.random\s*\(\)/,
        message: "Math.random() usage for security purposes",
        severity: ReviewSeverity.MEDIUM,
        suggestion:
          "For cryptographic purposes, use crypto.getRandomValues() instead of Math.random().",
      },
      "weak-hashing": {
        pattern: /\b(?:md5|sha1)\s*\(/,
        message: "Weak hashing algorithm detected",
        severity: ReviewSeverity.MEDIUM,
        suggestion:
          "Avoid MD5 and SHA-1 for security-sensitive operations. Use SHA-256 or better.",
      },

      // Deprecated APIs
      "deprecated-crypto": {
        pattern: /\b(?:createCipher|createDecipher)\s*\(/,
        message: "Deprecated crypto API detected",
        severity: ReviewSeverity.MEDIUM,
        suggestion:
          "Use createCipheriv() and createDecipheriv() instead of the deprecated createCipher()/createDecipher().",
      },
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmed = line.trim();

      // Skip comment lines
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("/*")
      ) {
        continue;
      }

      // Check each security pattern
      for (const [patternId, patternInfo] of Object.entries(securityPatterns)) {
        if (patternInfo.pattern.test(line)) {
          // Check if it's in a string or comment
          const inString = this.isInString(line, patternInfo.pattern);
          if (!inString) {
            issues.push({
              ruleId: this.id,
              severity: patternInfo.severity,
              category: this.category,
              message: patternInfo.message,
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion: patternInfo.suggestion,
              codeSnippet: line,
            });
          }
        }
      }

      // Check for input validation
      if (checkInputValidation) {
        // Look for user input sources without validation
        const inputSources = [
          /req\.(?:body|query|params)/,
          /document\.getElementById/,
          /\$\(['"]#\w+['"]\)/,
          /process\.env/,
        ];

        for (const pattern of inputSources) {
          if (pattern.test(line)) {
            // Check if there's validation in nearby lines
            let hasValidation = false;
            const validationPatterns = [
              /\.trim\(\)/,
              /\.toLowerCase\(\)/,
              /\.toUpperCase\(\)/,
              /parseInt\(/,
              /parseFloat\(/,
              /Number\(/,
              /String\(/,
              /Array\.isArray\(/,
              /typeof/,
              /instanceof/,
              /\.test\(/,
              /\.match\(/,
              /\.replace\(/,
              /\.split\(/,
              /\.slice\(/,
              /\.substring\(/,
              /\.substr\(/,
            ];

            // Check current line and next few lines
            for (let j = 0; j < 5 && i + j < lines.length; j++) {
              if (validationPatterns.some((p) => p.test(lines[i + j]))) {
                hasValidation = true;
                break;
              }
            }

            if (!hasValidation) {
              issues.push({
                ruleId: this.id,
                severity: ReviewSeverity.MEDIUM,
                category: this.category,
                message: "User input used without apparent validation",
                filePath,
                line: lineNumber,
                endLine: lineNumber,
                suggestion:
                  "Always validate and sanitize user input before use to prevent injection attacks.",
                codeSnippet: line,
              });
            }
          }
        }
      }
    }

    return issues;
  }

  isInString(line, pattern) {
    const match = line.match(pattern);
    if (!match || !match.index) return false;

    const beforeMatch = line.substring(0, match.index);
    const afterMatch = line.substring(match.index + match[0].length);

    // Count quotes before and after
    const beforeQuotes = (beforeMatch.match(/"/g) || []).length;
    const afterQuotes = (afterMatch.match(/"/g) || []).length;
    const beforeSingleQuotes = (beforeMatch.match(/'/g) || []).length;
    const afterSingleQuotes = (afterMatch.match(/'/g) || []).length;
    const beforeBackticks = (beforeMatch.match(/`/g) || []).length;
    const afterBackticks = (afterMatch.match(/`/g) || []).length;

    return (
      (beforeQuotes % 2 === 1 && afterQuotes % 2 === 0) ||
      (beforeSingleQuotes % 2 === 1 && afterSingleQuotes % 2 === 0) ||
      (beforeBackticks % 2 === 1 && afterBackticks % 2 === 0)
    );
  }
}
