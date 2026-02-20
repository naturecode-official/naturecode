// Enhanced command recognition for natural language input

export class CommandRecognizer {
  constructor() {
    // Command patterns with synonyms and natural language variations
    this.commandPatterns = {
      listFiles: {
        keywords: [
          "ls",
          "dir",
          "list",
          "show files",
          "what files",
          "see files",
          "display files",
          "view files",
        ],
        patterns: [
          /(show|list|display|see|view).*(files|contents|items)/i,
          /what.*(files|in).*(directory|folder|here)/i,
          /(files|contents).*in.*(directory|folder)/i,
        ],
        action: "list",
      },
      readFile: {
        keywords: ["cat", "read", "view", "show", "open", "display"],
        patterns: [
          /(read|view|show|open|display).*file.*["']?([^"'\s]+)["']?/i,
          /what.*in.*file.*["']?([^"'\s]+)["']?/i,
          /content.*of.*["']?([^"'\s]+)["']?/i,
          /file.*["']?([^"'\s]+)["']?.*content/i,
        ],
        action: "read",
      },
      changeDirectory: {
        keywords: ["cd", "go to", "navigate to", "enter", "move to"],
        patterns: [
          /(cd|go to|navigate to|enter|move to).*["']?([^"'\s]+)["']?/i,
          /change.*directory.*to.*["']?([^"'\s]+)["']?/i,
          /(directory|folder).*["']?([^"'\s]+)["']?/i,
        ],
        action: "cd",
      },
      currentDirectory: {
        keywords: ["pwd", "where", "cwd", "current directory", "where am i"],
        patterns: [
          /(where|what).*(directory|folder|location)/i,
          /current.*(directory|folder|location)/i,
          /show.*(path|location)/i,
        ],
        action: "pwd",
      },
      createFile: {
        keywords: ["create", "make", "new", "touch"],
        patterns: [
          /(create|make|new).*file.*["']?([^"'\s]+)["']?/i,
          /file.*["']?([^"'\s]+)["']?.*(create|make)/i,
        ],
        action: "create",
      },
      editFile: {
        keywords: ["edit", "modify", "change", "update"],
        patterns: [
          /(edit|modify|change|update).*file.*["']?([^"'\s]+)["']?/i,
          /file.*["']?([^"'\s]+)["']?.*(edit|modify)/i,
        ],
        action: "edit",
      },
      deleteFile: {
        keywords: ["delete", "remove", "rm", "del"],
        patterns: [
          /(delete|remove|rm|del).*file.*["']?([^"'\s]+)["']?/i,
          /file.*["']?([^"'\s]+)["']?.*(delete|remove)/i,
        ],
        action: "delete",
      },
      searchFiles: {
        keywords: ["find", "search", "look for", "locate"],
        patterns: [
          /(find|search|look for|locate).*["']?([^"'\s]+)["']?/i,
          /files.*containing.*["']?([^"'\s]+)["']?/i,
        ],
        action: "search",
      },
    };
  }

  // Recognize command from natural language input
  recognize(input) {
    const lowerInput = input.toLowerCase().trim();

    // Check for exact keyword matches first (fast path)
    for (const [commandType, config] of Object.entries(this.commandPatterns)) {
      for (const keyword of config.keywords) {
        if (
          lowerInput === keyword ||
          (keyword.length > 3 && lowerInput.startsWith(keyword + " "))
        ) {
          return {
            type: commandType,
            action: config.action,
            confidence: 0.9,
            input: input,
            exactMatch: true,
          };
        }
      }
    }

    // Check patterns for natural language
    let bestMatch = null;
    let highestConfidence = 0;

    for (const [commandType, config] of Object.entries(this.commandPatterns)) {
      for (const pattern of config.patterns) {
        const match = lowerInput.match(pattern);
        if (match) {
          const confidence = this._calculateConfidence(match, lowerInput);

          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              type: commandType,
              action: config.action,
              confidence: confidence,
              input: input,
              matches: match,
              extractedPath: match[2] || match[1] || null,
            };
          }
        }
      }
    }

    // Check for file extensions in input (heuristic for file operations)
    if (!bestMatch && this._containsFileReference(lowerInput)) {
      // Guess it's probably a read or edit operation
      const fileMatch = lowerInput.match(/["']?([\w\.\-]+\.\w{1,10})["']?/i);
      if (fileMatch) {
        return {
          type: "readFile",
          action: "read",
          confidence: 0.6,
          input: input,
          extractedPath: fileMatch[1],
          guessed: true,
        };
      }
    }

    return (
      bestMatch || {
        type: "unknown",
        action: "ai",
        confidence: 0,
        input: input,
        isFileOperation: false,
      }
    );
  }

  // Calculate confidence score for a match
  _calculateConfidence(match, input) {
    let confidence = 0.5; // Base confidence

    // Longer matches are more confident
    const matchLength = match[0].length;
    const inputLength = input.length;
    confidence += (matchLength / inputLength) * 0.3;

    // Exact command words increase confidence
    const commandWords = [
      "file",
      "directory",
      "folder",
      "create",
      "read",
      "edit",
      "delete",
      "show",
      "list",
    ];
    const wordCount = commandWords.filter((word) =>
      input.includes(word),
    ).length;
    confidence += wordCount * 0.1;

    // Cap at 0.95 (leave room for AI to override if needed)
    return Math.min(confidence, 0.95);
  }

  // Check if input contains file references
  _containsFileReference(input) {
    const filePatterns = [
      /\.(js|ts|py|java|cpp|c|html|css|json|txt|md|yml|yaml|xml)$/i,
      /file.*["']?[\w\.\-]+["']?/i,
      /["']?[\w\.\-]+\.[\w]{1,10}["']?/i,
    ];

    return filePatterns.some((pattern) => pattern.test(input));
  }

  // Extract file path from command
  extractFilePath(commandResult) {
    if (!commandResult.extractedPath) {
      return null;
    }

    let path = commandResult.extractedPath;

    // Clean up common prefixes/suffixes
    const cleanups = [
      { pattern: /^the\s+/i, replacement: "" },
      { pattern: /^file\s+/i, replacement: "" },
      { pattern: /\s+file$/i, replacement: "" },
      { pattern: /^["']/, replacement: "" },
      { pattern: /["']$/, replacement: "" },
    ];

    for (const cleanup of cleanups) {
      path = path.replace(cleanup.pattern, cleanup.replacement);
    }

    path = path.trim();

    // Validate that this looks like a real file path
    // Reject common false positives like version numbers, single words, etc.
    if (!this._isValidFilePath(path)) {
      return null;
    }

    return path || null;
  }

  // Check if a string looks like a valid file path
  _isValidFilePath(path) {
    if (!path || path.length < 2) {
      return false;
    }

    // Common false positives to reject
    const falsePositives = [
      /^\d+\.\d+$/, // Version numbers like "1.0", "2.5"
      /^v?\d+\.\d+\.\d+$/, // Version numbers like "v1.0.0"
      /^[a-z]+$/i, // Single words without extensions
      /^\d+$/, // Just numbers
      /^[a-z]+\d+$/i, // Word followed by number
    ];

    for (const pattern of falsePositives) {
      if (pattern.test(path)) {
        return false;
      }
    }

    // Should contain at least one dot (for extension) or slash (for path)
    // or be a common file/directory name
    const validPatterns = [
      /\.[a-z0-9]+$/i, // Has file extension
      /[\/\\]/, // Contains path separator
      /^[a-z0-9_-]+\.[a-z0-9]+$/i, // Simple filename with extension
      /^[a-z0-9_-]+\/[a-z0-9_-]+/i, // Simple path
    ];

    for (const pattern of validPatterns) {
      if (pattern.test(path)) {
        return true;
      }
    }

    // Check against common file/directory names
    const commonFiles = [
      "package.json",
      "README.md",
      "index.html",
      "main.js",
      "app.py",
      "src",
      "lib",
      "bin",
      "dist",
      "build",
      "node_modules",
    ];

    if (commonFiles.includes(path.toLowerCase())) {
      return true;
    }

    return false;
  }

  // Suggest corrections for misrecognized commands
  suggestCorrection(input, availableFiles = []) {
    const lowerInput = input.toLowerCase();
    const suggestions = [];

    // Check for common typos
    const commonTypos = {
      ls: ["list", "dir"],
      dir: ["list", "ls"],
      cat: ["read", "view"],
      pwd: ["where", "cwd"],
      cd: ["go to", "navigate to"],
    };

    for (const [correct, alternatives] of Object.entries(commonTypos)) {
      if (lowerInput === correct) {
        suggestions.push(`Did you mean: ${alternatives.join(" or ")}?`);
      }
    }

    // Check for file names that might be misspelled
    if (availableFiles.length > 0) {
      const words = input.split(/\s+/);
      for (const word of words) {
        if (word.includes(".") && word.length > 3) {
          // Might be a filename
          const similarFiles = availableFiles.filter(
            (file) => this._similarity(word, file.name) > 0.7,
          );

          if (similarFiles.length > 0) {
            suggestions.push(
              `Similar files found: ${similarFiles.map((f) => f.name).join(", ")}`,
            );
          }
        }
      }
    }

    return suggestions;
  }

  // Calculate string similarity (simple Levenshtein-like)
  _similarity(a, b) {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const maxLength = Math.max(a.length, b.length);
    const distance = this._levenshtein(a.toLowerCase(), b.toLowerCase());
    return 1 - distance / maxLength;
  }

  // Levenshtein distance
  _levenshtein(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // Format recognition result for display
  formatResult(result) {
    if (result.type === "unknown") {
      return {
        message: "No specific command recognized. Using AI assistant.",
        type: "ai",
      };
    }

    const actions = {
      list: "Listing files",
      read: "Reading file",
      cd: "Changing directory",
      pwd: "Showing current directory",
      create: "Creating file",
      edit: "Editing file",
      delete: "Deleting file",
      search: "Searching files",
    };

    return {
      message: `${actions[result.action]}${result.extractedPath ? `: ${result.extractedPath}` : ""}`,
      type: result.action,
      confidence: result.confidence,
      isFileOperation: true,
    };
  }
}

// Singleton instance
export const commandRecognizer = new CommandRecognizer();
