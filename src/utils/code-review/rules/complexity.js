// Complexity-related code review rules

import { ReviewRule, ReviewSeverity, ReviewCategory } from "../types.js";

export class ComplexityRule extends ReviewRule {
  constructor() {
    super({
      id: "complexity-base",
      name: "Complexity Base Rule",
      description: "Base class for complexity rules",
      category: ReviewCategory.COMPLEXITY,
      severity: ReviewSeverity.MEDIUM,
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
    });
  }
}

export class CognitiveComplexityRule extends ComplexityRule {
  constructor() {
    super();
    this.id = "cognitive-complexity";
    this.name = "Cognitive Complexity Analysis";
    this.description = "Analyze code for high cognitive complexity";
    this.config = {
      maxComplexity: 15,
      // Weights for different complexity factors
      weights: {
        if: 1,
        "else if": 1,
        else: 1,
        for: 1,
        while: 1,
        do: 1,
        switch: 1,
        case: 1,
        try: 1,
        catch: 1,
        finally: 1,
        "&&": 1,
        "||": 1,
        "?:": 1,
        nesting: 1, // Additional weight for nested structures
      },
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");

    let inFunction = false;
    let functionStart = 0;
    let functionName = "";
    let complexity = 0;
    let nestingLevel = 0;
    let maxNestingInFunction = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmed = line.trim();
      const lowerLine = line.toLowerCase();

      // Detect function start
      if (!inFunction) {
        const funcMatch = trimmed.match(
          /^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/,
        );
        if (funcMatch) {
          inFunction = true;
          functionStart = i + 1;
          functionName =
            funcMatch[1] ||
            funcMatch[2] ||
            funcMatch[3] ||
            funcMatch[4] ||
            funcMatch[5] ||
            funcMatch[6] ||
            "anonymous";
          complexity = 0;
          nestingLevel = 0;
          maxNestingInFunction = 0;
        }
      }

      if (inFunction) {
        // Update nesting level based on braces/brackets
        const openBraces = (line.match(/{|\(|\[/g) || []).length;
        const closeBraces = (line.match(/}|\)|\]/g) || []).length;

        // Track nesting for languages with braces
        if (
          ["javascript", "typescript", "java", "go", "rust"].includes(
            context.language || "javascript",
          )
        ) {
          nestingLevel += openBraces - closeBraces;
          maxNestingInFunction = Math.max(maxNestingInFunction, nestingLevel);
        }

        // Python nesting based on indentation
        else if (context.language === "python") {
          if (i > 0) {
            const prevLine = lines[i - 1];
            const currentIndent = line.match(/^(\s*)/)[0].length;
            const prevIndent = prevLine.match(/^(\s*)/)[0].length;

            if (currentIndent > prevIndent) {
              nestingLevel++;
              maxNestingInFunction = Math.max(
                maxNestingInFunction,
                nestingLevel,
              );
            } else if (currentIndent < prevIndent) {
              nestingLevel--;
            }
          }
        }

        // Add complexity for control flow statements
        if (lowerLine.includes(" if ") || trimmed.startsWith("if(")) {
          complexity +=
            this.config.weights["if"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" else if ") || trimmed.startsWith("else if(")) {
          complexity +=
            this.config.weights["else if"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (trimmed.startsWith("else") && !trimmed.startsWith("else if")) {
          complexity +=
            this.config.weights["else"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" for ") || trimmed.startsWith("for(")) {
          complexity +=
            this.config.weights["for"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" while ") || trimmed.startsWith("while(")) {
          complexity +=
            this.config.weights["while"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" do ") && !lowerLine.includes(" while")) {
          complexity +=
            this.config.weights["do"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" switch ") || trimmed.startsWith("switch(")) {
          complexity +=
            this.config.weights["switch"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (trimmed.startsWith("case ") || trimmed.startsWith("default:")) {
          complexity +=
            this.config.weights["case"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" try ")) {
          complexity +=
            this.config.weights["try"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" catch ")) {
          complexity +=
            this.config.weights["catch"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }
        if (lowerLine.includes(" finally ")) {
          complexity +=
            this.config.weights["finally"] +
            (nestingLevel > 0 ? this.config.weights["nesting"] : 0);
        }

        // Add complexity for logical operators
        const andCount = (line.match(/&&/g) || []).length;
        const orCount = (line.match(/\|\|/g) || []).length;
        complexity += (andCount + orCount) * this.config.weights["&&"];

        // Add complexity for ternary operators
        const ternaryCount = (line.match(/\?/g) || []).length;
        complexity += ternaryCount * this.config.weights["?:"];

        // Detect function end
        let functionEnded = false;

        if (
          ["javascript", "typescript", "java", "go", "rust"].includes(
            context.language || "javascript",
          )
        ) {
          // Function ends when we see a line starting with another function/class
          // and we're not in a nested structure
          if (i > functionStart - 1 && nestingLevel <= 0) {
            const nextFunctionMatch = trimmed.match(
              /^(?:export\s+)?(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|class\s+\w+|public\s+(?:static\s+)?(?:[\w<>]+\s+)?\w+\s*\(|func\s+\w+\s*\(|fn\s+\w+\s*\()/,
            );
            if (nextFunctionMatch) {
              functionEnded = true;
            }
          }
        } else if (context.language === "python") {
          // Python function ends at next function/class definition with same or less indentation
          if (i > functionStart - 1) {
            const currentIndent = line.match(/^(\s*)/)[0].length;
            const isFunctionDef =
              trimmed.match(/^def\s+\w+\s*\(/) || trimmed.match(/^class\s+\w+/);

            if (isFunctionDef && currentIndent === 0) {
              functionEnded = true;
            }
          }
        }

        // Check complexity at function end
        if (functionEnded || i === lines.length - 1) {
          if (complexity > this.config.maxComplexity) {
            issues.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              message: `Function "${functionName}" has high cognitive complexity (${complexity}, max ${this.config.maxComplexity})`,
              filePath,
              line: functionStart,
              endLine: i + 1,
              suggestion:
                "Simplify the logic by extracting complex parts into separate functions, reducing nesting, or using early returns.",
              codeSnippet: lines
                .slice(functionStart - 1, Math.min(functionStart + 3, i + 1))
                .join("\n"),
            });
          }

          // Also warn about deep nesting
          if (maxNestingInFunction > 4) {
            issues.push({
              ruleId: this.id,
              severity: ReviewSeverity.MEDIUM,
              category: this.category,
              message: `Function "${functionName}" has deep nesting (level ${maxNestingInFunction})`,
              filePath,
              line: functionStart,
              endLine: i + 1,
              suggestion:
                "Reduce nesting by extracting nested code into separate functions or using guard clauses.",
              codeSnippet: lines
                .slice(functionStart - 1, Math.min(functionStart + 3, i + 1))
                .join("\n"),
            });
          }

          if (functionEnded) {
            // Start tracking the new function
            const funcMatch = trimmed.match(
              /^(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|def\s+(\w+)\s*\(|public\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(|func\s+(\w+)\s*\(|fn\s+(\w+)\s*\()/,
            );
            if (funcMatch) {
              functionStart = i + 1;
              functionName =
                funcMatch[1] ||
                funcMatch[2] ||
                funcMatch[3] ||
                funcMatch[4] ||
                funcMatch[5] ||
                funcMatch[6] ||
                "anonymous";
              complexity = 0;
              nestingLevel = 0;
              maxNestingInFunction = 0;
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

export class MethodChainingRule extends ComplexityRule {
  constructor() {
    super();
    this.id = "method-chaining";
    this.name = "Excessive Method Chaining";
    this.description =
      "Detect excessive method chaining that reduces readability";
    this.config = {
      maxChainLength: 5,
      excludedMethods: ["then", "catch", "finally"], // Common in promises
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const { maxChainLength, excludedMethods } = this.config;

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

      // Look for method chains
      // Pattern: something.method1().method2().method3()
      const methodChainPattern = /\.\w+\([^)]*\)/g;
      const matches = [...line.matchAll(methodChainPattern)];

      if (matches.length > 0) {
        // Find the longest chain in this line
        let currentChain = [];
        let maxChainFound = 0;
        let chainStart = 0;

        for (let j = 0; j < line.length; j++) {
          if (line[j] === ".") {
            // Find the method name
            const methodMatch = line.substring(j).match(/\.(\w+)\(/);
            if (methodMatch) {
              const methodName = methodMatch[1];

              if (!excludedMethods.includes(methodName)) {
                currentChain.push(methodName);
                if (currentChain.length === 1) {
                  chainStart = j;
                }
                maxChainFound = Math.max(maxChainFound, currentChain.length);
              }
            }
          } else if (
            line[j] === ";" ||
            line[j] === "," ||
            line[j] === ")" ||
            line[j] === "]" ||
            line[j] === "}"
          ) {
            // Chain broken
            if (currentChain.length > maxChainLength) {
              issues.push({
                ruleId: this.id,
                severity: this.severity,
                category: this.category,
                message: `Excessive method chaining (${currentChain.length} methods, max ${maxChainLength})`,
                filePath,
                line: lineNumber,
                endLine: lineNumber,
                suggestion:
                  "Break long method chains into multiple lines or extract into a separate function for better readability.",
                codeSnippet: line.substring(
                  Math.max(0, chainStart - 20),
                  Math.min(line.length, j + 20),
                ),
              });
            }
            currentChain = [];
          }
        }

        // Check the last chain in the line
        if (currentChain.length > maxChainLength) {
          issues.push({
            ruleId: this.id,
            severity: this.severity,
            category: this.category,
            message: `Excessive method chaining (${currentChain.length} methods, max ${maxChainLength})`,
            filePath,
            line: lineNumber,
            endLine: lineNumber,
            suggestion:
              "Break long method chains into multiple lines or extract into a separate function for better readability.",
            codeSnippet: line.substring(
              Math.max(0, chainStart - 20),
              Math.min(line.length, line.length),
            ),
          });
        }
      }
    }

    return issues;
  }
}

export class ParameterCountRule extends ComplexityRule {
  constructor() {
    super();
    this.id = "parameter-count";
    this.name = "Excessive Function Parameters";
    this.description = "Detect functions with too many parameters";
    this.config = {
      maxParameters: 5,
      languages: {
        javascript: 5,
        typescript: 5,
        python: 5,
        java: 5,
        go: 5,
        rust: 5,
      },
    };
  }

  async check(filePath, content, context) {
    const issues = [];
    const lines = content.split("\n");
    const ext = context.language || "javascript";
    const maxParams = this.config.languages[ext] || this.config.maxParameters;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      const trimmed = line.trim();

      // Look for function definitions
      const functionPatterns = [
        // JavaScript/TypeScript
        /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
        /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/,
        // Python
        /^def\s+(\w+)\s*\(([^)]*)\)/,
        // Java
        /^(?:public|private|protected)\s+(?:static\s+)?(?:[\w<>]+\s+)?(\w+)\s*\(([^)]*)\)/,
        // Go
        /^func\s+(\w+)\s*\(([^)]*)\)/,
        // Rust
        /^fn\s+(\w+)\s*\(([^)]*)\)/,
      ];

      for (const pattern of functionPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const functionName = match[1];
          const paramsString = match[2];

          // Count parameters
          const params = paramsString
            .split(",")
            .filter((p) => p.trim().length > 0);

          if (params.length > maxParams) {
            issues.push({
              ruleId: this.id,
              severity: this.severity,
              category: this.category,
              message: `Function "${functionName}" has too many parameters (${params.length}, max ${maxParams})`,
              filePath,
              line: lineNumber,
              endLine: lineNumber,
              suggestion:
                "Reduce the number of parameters by grouping related parameters into an object/struct or using builder pattern.",
              codeSnippet: line,
            });
          }
        }
      }
    }

    return issues;
  }
}
