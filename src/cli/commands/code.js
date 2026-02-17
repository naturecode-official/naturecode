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
      // 自动运行综合分析
      console.log("Running comprehensive code analysis...\n");

      // 1. 运行代码度量分析
      console.log("Code Metrics:");
      try {
        const metricsResult = await codeCommandHandler.handleCommand(
          "metrics",
          args,
        );
        if (metricsResult && metricsResult.summary) {
          console.log(`  Files: ${metricsResult.summary.totalFiles || 0}`);
          console.log(`  Lines: ${metricsResult.summary.totalLines || 0}`);
          console.log(
            `  Functions: ${metricsResult.summary.totalFunctions || 0}`,
          );
          console.log(`  Classes: ${metricsResult.summary.totalClasses || 0}`);
        } else {
          console.log("  No metrics data available");
        }
      } catch (metricsError) {
        console.log("  Metrics analysis skipped:", metricsError.message);
      }

      // 2. 运行依赖分析
      console.log("\nDependencies:");
      try {
        const depsResult = await codeCommandHandler.handleCommand("deps", args);
        if (depsResult && depsResult.dependencies) {
          console.log(
            `  Total Dependencies: ${depsResult.dependencies.total || 0}`,
          );
          console.log(
            `  Direct Dependencies: ${depsResult.dependencies.direct || 0}`,
          );
          console.log(
            `  Dev Dependencies: ${depsResult.dependencies.dev || 0}`,
          );
        } else {
          console.log("  No dependency data available");
        }
      } catch (depsError) {
        console.log("  Dependency analysis skipped:", depsError.message);
      }

      // 3. 运行问题分析
      console.log("\nQuick Issues Scan:");
      try {
        const issuesResult = await codeCommandHandler.handleCommand("issues", {
          ...args,
          limit: 10,
        });
        if (
          issuesResult &&
          issuesResult.issues &&
          issuesResult.issues.length > 0
        ) {
          const highIssues = issuesResult.issues.filter(
            (i) => i.severity === "high",
          ).length;
          const mediumIssues = issuesResult.issues.filter(
            (i) => i.severity === "medium",
          ).length;
          console.log(`  High priority issues: ${highIssues}`);
          console.log(`  Medium priority issues: ${mediumIssues}`);
          console.log(`  Total issues found: ${issuesResult.issues.length}`);
        } else {
          console.log("  No issues found");
        }
      } catch (issuesError) {
        console.log("  Issues analysis skipped:", issuesError.message);
      }

      // 4. 显示摘要和建议
      console.log("\nSummary & Recommendations:");
      console.log("  1. Run 'naturecode code analyze' for detailed analysis");
      console.log(
        "  2. Run 'naturecode code issues --severity high' for critical issues",
      );
      console.log(
        "  3. Run 'naturecode code deps-security' for security checks",
      );
      console.log(
        "  4. Run 'naturecode code refactor' for refactoring suggestions",
      );

      console.log("\nAvailable detailed commands:");
      const commands = codeCommandHandler.getAvailableCommands();
      commands.forEach((cmd) => {
        console.log(
          `  naturecode code ${cmd.command.padEnd(15)} - ${cmd.description}`,
        );
      });

      console.log("\nQuick start examples:");
      console.log(
        "  naturecode code analyze              # Full code analysis",
      );
      console.log(
        "  naturecode code issues --severity high  # Critical issues only",
      );
      console.log("  naturecode code deps-security        # Security audit");

      return null;
    }

    // 执行指定的子命令
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
    .command("code [command]")
    .description(
      "Code analysis and quality tools (runs comprehensive analysis if no command specified)",
    )
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
