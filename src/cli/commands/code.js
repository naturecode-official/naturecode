#!/usr/bin/env node

import { codeCommandHandler } from "../../utils/code-commands.js";
import { exitWithError } from "../../utils/error-handler.js";

export async function runCodeCommand(options) {
  try {
    const command = options.command;
    const args = {
      dir: options.dir || process.cwd(),
      file: options.file,
      recursive: options.recursive !== false,
      limit: options.limit || 50,
      extensions: options.extensions,
      excludeDirs: options.excludeDirs
        ? options.excludeDirs.split(",")
        : ["node_modules", ".git", "dist", "build"],
      severity: options.severity,
      type: options.type,
    };

    if (!command) {
      console.log("Available code analysis commands:");
      const commands = codeCommandHandler.getAvailableCommands();
      commands.forEach((cmd) => {
        console.log(`  ${cmd.command.padEnd(15)} - ${cmd.description}`);
      });
      console.log("\nUsage: naturecode code <command> [options]");
      console.log("\nExamples:");
      console.log("  naturecode code analyze");
      console.log("  naturecode code analyze-file --file src/utils/git.js");
      console.log("  naturecode code complexity --file src/cli/index.js");
      console.log("  naturecode code issues --severity high");
      console.log("  naturecode code metrics");
      return;
    }

    const result = await codeCommandHandler.handleCommand(command, args);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    exitWithError(error, "Code Analysis");
  }
}

// Command definition for CLI
export function createCodeCommand(program) {
  const codeCommand = program
    .command("code <command>")
    .description("Code analysis and quality tools")
    .option(
      "-d, --dir <directory>",
      "Directory to analyze (default: current directory)",
    )
    .option(
      "-f, --file <file>",
      "File to analyze (for analyze-file and complexity commands)",
    )
    .option("-r, --no-recursive", "Disable recursive directory scanning")
    .option("-l, --limit <number>", "Limit number of files analyzed", parseInt)
    .option(
      "-e, --extensions <extensions>",
      "Comma-separated file extensions to include",
    )
    .option(
      "-x, --exclude-dirs <dirs>",
      "Comma-separated directories to exclude",
    )
    .option(
      "-s, --severity <severity>",
      "Filter issues by severity (high, medium, low, info)",
    )
    .option("-t, --type <type>", "Filter issues by type")
    .option("-j, --json", "Output results in JSON format")
    .action(runCodeCommand);

  // Add command-specific help
  codeCommand.on("--help", () => {
    console.log("");
    console.log("Commands:");
    console.log("  analyze         Analyze code in current directory");
    console.log("  analyze-file    Analyze specific file");
    console.log("  complexity      Calculate code complexity metrics");
    console.log("  issues          List code issues and suggestions");
    console.log("  metrics         Show code metrics summary");
    console.log("");
    console.log("Examples:");
    console.log("  $ naturecode code analyze");
    console.log("  $ naturecode code analyze-file --file src/utils/git.js");
    console.log("  $ naturecode code complexity --file src/cli/index.js");
    console.log("  $ naturecode code issues --severity high --type security");
    console.log("  $ naturecode code metrics --dir ./src");
  });

  return codeCommand;
}

// For direct testing
if (import.meta.url === `file://${process.argv[1]}`) {
  import("commander").then(({ Command }) => {
    const program = new Command();
    createCodeCommand(program);
    program.parse(process.argv);
  });
}
