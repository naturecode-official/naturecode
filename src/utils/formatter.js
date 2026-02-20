import chalk from "chalk";

export function formatResponse(response) {
  console.log(chalk.cyan("Assistant:"));

  const lines = response.split("\n");
  let inCodeBlock = false;
  let codeLanguage = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        const language = line.slice(3).trim();
        codeLanguage = language ? ` (${language})` : "";
        console.log(chalk.gray("┌" + "─".repeat(78)));
        console.log(chalk.yellow(`│ Code${codeLanguage}:`));
        console.log(chalk.gray("├" + "─".repeat(78)));
        inCodeBlock = true;
      } else {
        console.log(chalk.gray("└" + "─".repeat(78)));
        inCodeBlock = false;
        codeLanguage = "";
      }
      continue;
    }

    if (inCodeBlock) {
      console.log(chalk.gray("│ ") + chalk.white(line));
    } else {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        console.log(chalk.white("  " + line));
      } else {
        console.log();
      }
    }
  }

  console.log();
}

export function showWelcome(config) {
  console.log(
    chalk.cyan("  ____  ____ _/ /___  __________  _________  ____/ /__"),
  );
  console.log(
    chalk.cyan(" / __ \\/ __ `/ __/ / / / ___/ _ \\/ ___/ __ \\/ __  / _ \\"),
  );
  console.log(
    chalk.cyan("/ / / / /_/ / /_/ /_/ / /  /  __/ /__/ /_/ / /_/ /  __/"),
  );
  console.log(
    chalk.cyan(
      "\\_\\_\\_\\__,_/\\__/\\__,_/_/   \\___/\\___/\\____/\\__,_/\\___/",
    ),
  );
  console.log();
  console.log(chalk.green("┌" + "─".repeat(78)));
  console.log(chalk.green("│ ") + chalk.bold("AI Assistant"));
  console.log(chalk.green("├" + "─".repeat(78)));
  console.log(chalk.green("│ ") + `Provider: ${chalk.cyan(config.provider)}`);
  console.log(
    chalk.green("│ ") +
      `Model: ${chalk.cyan(config.model)} (language interaction)`,
  );
  console.log(
    chalk.green("│ ") + `Temperature: ${chalk.cyan(config.temperature)}`,
  );
  console.log(
    chalk.green("│ ") +
      `Streaming: ${chalk.cyan(config.stream ? "Enabled" : "Disabled")}`,
  );
  console.log(
    chalk.green("│ ") + `Max Tokens: ${chalk.cyan("4000 (long responses)")}`,
  );
  console.log(chalk.green("├" + "─".repeat(78)));
  console.log(
    chalk.green("│ ") + chalk.yellow("Type your message and press Enter"),
  );
  console.log(
    chalk.green("│ ") + chalk.yellow("Commands: help, clear, config, exit"),
  );
  console.log(chalk.green("└" + "─".repeat(78)));
  console.log();
}

export function showHelp() {
  console.log(chalk.yellow("\nAvailable Commands:"));
  console.log(chalk.white("  help    - Show this help message"));
  console.log(chalk.white("  clear   - Clear the screen and session history"));
  console.log(chalk.white("  config  - Show current configuration"));
  console.log(chalk.white("  exit    - Exit the program (also: quit)"));
  console.log(chalk.white("  [empty] - Just press Enter to continue"));

  console.log(chalk.yellow("\nFile System Commands:"));
  console.log(
    chalk.white("  ls, dir, list     - List files in current directory"),
  );
  console.log(chalk.white("  cat <file>        - Read file content"));
  console.log(chalk.white("  cd <directory>    - Change directory"));
  console.log(chalk.white("  pwd, where        - Show current directory"));
  console.log(chalk.white("  Or use natural language like:"));
  console.log(chalk.white('    "show me files here"'));
  console.log(chalk.white('    "read package.json"'));
  console.log(chalk.white('    "create new script.js"'));

  console.log(chalk.yellow("\nTips:"));
  console.log(chalk.white("  • Use clear language for better responses"));
  console.log(chalk.white("  • For code, specify the programming language"));
  console.log(
    chalk.white('  • Use "explain like I\'m 5" for simple explanations'),
  );
  console.log(
    chalk.white("  • AI can read, edit, and create files in current directory"),
  );
  console.log();
}

export function formatError(error) {
  const errorType = error.message.toLowerCase();

  if (errorType.includes("api key") || errorType.includes("unauthorized")) {
    return chalk.red(
      'Error: Invalid API key. Please run "naturecode model" to reconfigure.',
    );
  } else if (
    errorType.includes("network") ||
    errorType.includes("connection")
  ) {
    return chalk.red("Error: Network error. Check your internet connection.");
  } else if (errorType.includes("rate limit")) {
    return chalk.red("Error: Rate limit exceeded. Please try again later.");
  } else if (errorType.includes("timeout")) {
    return chalk.red(
      "Error: Request timeout. The AI service is taking too long to respond.",
    );
  } else {
    return chalk.red(`Error: ${error.message}`);
  }
}

export function formatLoading(message = "Thinking...") {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i])} ${message}`);
    i = (i + 1) % frames.length;
  }, 80);

  return {
    stop: (success = true) => {
      clearInterval(interval);
      process.stdout.write("\r" + " ".repeat(message.length + 3) + "\r");
      if (success) {
        process.stdout.write(chalk.green("Done ") + "\n");
      } else {
        process.stdout.write(chalk.red("Failed ") + "\n");
      }
    },
  };
}
