import chalk from "chalk";

export class ErrorHandler {
  static formatError(error, context = "") {
    const errorMessage = error.message || String(error);
    const errorType = errorMessage.toLowerCase();

    // Common error patterns with user-friendly messages
    if (
      errorType.includes("api key") ||
      errorType.includes("unauthorized") ||
      errorType.includes("401")
    ) {
      return {
        userMessage: chalk.red("Authentication Error: Invalid API key."),
        suggestion: `Please run ${chalk.cyan("naturecode model")} to reconfigure your API settings.`,
        exitCode: 1,
      };
    } else if (
      errorType.includes("network") ||
      errorType.includes("connection") ||
      errorType.includes("enotfound")
    ) {
      return {
        userMessage: chalk.red("Network Error: Cannot connect to AI service."),
        suggestion: "Please check your internet connection and try again.",
        exitCode: 2,
      };
    } else if (errorType.includes("rate limit") || errorType.includes("429")) {
      return {
        userMessage: chalk.red("Rate Limit Error: Too many requests."),
        suggestion: "Please wait a few minutes and try again.",
        exitCode: 3,
      };
    } else if (
      errorType.includes("timeout") ||
      errorType.includes("timed out")
    ) {
      return {
        userMessage: chalk.red("Timeout Error: The request took too long."),
        suggestion:
          "Please try again. If the problem persists, check your network connection.",
        exitCode: 4,
      };
    } else if (errorType.includes("file") && errorType.includes("not found")) {
      return {
        userMessage: chalk.red("File Error: File not found."),
        suggestion: "Please check the file path and try again.",
        exitCode: 5,
      };
    } else if (
      errorType.includes("permission") ||
      errorType.includes("eaccess")
    ) {
      return {
        userMessage: chalk.red("Permission Error: Access denied."),
        suggestion:
          "Please check file permissions or run with appropriate privileges.",
        exitCode: 6,
      };
    } else if (
      errorType.includes("directory") &&
      errorType.includes("not exist")
    ) {
      return {
        userMessage: chalk.red("Directory Error: Directory does not exist."),
        suggestion: "Please check the directory path and try again.",
        exitCode: 7,
      };
    } else if (errorType.includes("file too large")) {
      const match = errorMessage.match(/\d+/g);
      const fileSize = match ? match[0] : "unknown";
      const maxSize = match && match[1] ? match[1] : "10MB";
      return {
        userMessage: chalk.red(
          `File Error: File is too large (${fileSize} bytes).`,
        ),
        suggestion: `Maximum file size is ${maxSize}. Please use a smaller file.`,
        exitCode: 8,
      };
    } else if (
      errorType.includes("access denied") ||
      errorType.includes("outside allowed")
    ) {
      return {
        userMessage: chalk.red(
          "Security Error: Access to this path is restricted.",
        ),
        suggestion:
          "You can only access files within the current directory and its subdirectories.",
        exitCode: 9,
      };
    }

    // Generic error with context
    const contextPrefix = context ? `${context}: ` : "";
    return {
      userMessage: chalk.red(`Error: ${contextPrefix}${errorMessage}`),
      suggestion:
        "Please check your input and try again. If the problem persists, contact support.",
      exitCode: 10,
    };
  }

  static handleError(error, context = "") {
    const formatted = this.formatError(error, context);

    console.error("\n" + formatted.userMessage);
    if (formatted.suggestion) {
      console.error(chalk.yellow("Suggestion: ") + formatted.suggestion);
    }

    // Log detailed error for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error(chalk.gray("\nDebug Information:"));
      console.error(chalk.gray(`  Error: ${error.message}`));
      console.error(
        chalk.gray(
          `  Stack: ${error.stack ? error.stack.split("\n")[1] : "N/A"}`,
        ),
      );
    }

    return formatted.exitCode;
  }

  static exitWithError(error, context = "") {
    const exitCode = this.handleError(error, context);
    process.exit(exitCode);
  }

  static async withErrorHandling(operation, task, context = "") {
    try {
      return await task();
    } catch (error) {
      this.handleError(error, `${operation} failed`);
      throw error;
    }
  }

  // File system specific error handling
  static formatFileSystemError(error, operation, filePath) {
    const baseError = this.formatError(error, `${operation} "${filePath}"`);

    // Add file-specific suggestions
    if (operation === "read" && error.message.includes("no such file")) {
      baseError.suggestion = `The file "${filePath}" does not exist. Check the spelling and path.`;
    } else if (operation === "write" && error.message.includes("permission")) {
      baseError.suggestion = `You don't have permission to write to "${filePath}". Check file permissions.`;
    } else if (operation === "delete" && error.message.includes("permission")) {
      baseError.suggestion = `You don't have permission to delete "${filePath}". Check file permissions.`;
    }

    return baseError;
  }

  // AI provider specific error handling
  static formatAIError(error, provider) {
    const baseError = this.formatError(error, `${provider} API Error`);

    // Add provider-specific suggestions
    if (provider === "deepseek") {
      if (error.message.includes("model")) {
        baseError.suggestion =
          "Please check if the model name is correct. Available models: deepseek-chat, deepseek-reasoner";
      }
    } else if (provider === "openai") {
      if (error.message.includes("model")) {
        baseError.suggestion =
          "Please check if the model name is correct. Common models: gpt-5-mini, gpt-5.2, gpt-4.1";
      }
    }

    return baseError;
  }
}

// Convenience functions
export function handleError(error, context = "") {
  return ErrorHandler.handleError(error, context);
}

export function exitWithError(error, context = "") {
  ErrorHandler.exitWithError(error, context);
}

export async function withErrorHandling(operation, task, context = "") {
  return ErrorHandler.withErrorHandling(operation, task, context);
}
