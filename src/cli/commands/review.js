#!/usr/bin/env node

import { reviewCommandHandler } from "../../utils/review-commands.js";
import { exitWithError } from "../../utils/error-handler.js";

export async function runReviewCommand(options) {
  try {
    const command = options.command;
    const args = {
      file: options.file,
      dir: options.dir || process.cwd(),
      session: options.session,
      useAI: options.ai !== false,
      severity: options.severity,
      category: options.category,
      format: options.format || "text",
      output: options.output,
      exclude: options.exclude ? options.exclude.split(",") : [],
      include: options.include ? options.include.split(",") : [],
      limit: options.limit || 50,
      config: options.config,
    };

    if (!command) {
      console.log("Available code review commands:");
      const commands = reviewCommandHandler.getAvailableCommands();
      commands.forEach((cmd) => {
        console.log(`  ${cmd.command.padEnd(15)} - ${cmd.description}`);
      });
      console.log("\nUsage: naturecode review <command> [options]");
      console.log("\nExamples:");
      console.log("  naturecode review file src/utils/code-review/reviewer.js");
      console.log("  naturecode review dir src/ --session current");
      console.log("  naturecode review project --ai --format json");
      console.log("  naturecode review history --session session-123");
      console.log("  naturecode review compare session-123 session-456");
      console.log("  naturecode review rules --category security");
      console.log("  naturecode review export review-123 --format json");
      return;
    }

    const result = await reviewCommandHandler.handleCommand(command, args);

    if (result && typeof result === "object") {
      if (options.format === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else if (result.message) {
        console.log(result.message);
      }
    } else if (result) {
      console.log(result);
    }
  } catch (error) {
    exitWithError(error, "review");
  }
}

// Command definition for CLI
export const reviewCommand = {
  name: "review",
  description: "Code review and quality analysis",
  options: [
    {
      flags: "-c, --command <command>",
      description: "Review command to execute",
    },
    {
      flags: "-f, --file <file>",
      description: "File to review",
    },
    {
      flags: "-d, --dir <directory>",
      description: "Directory to review",
    },
    {
      flags: "-s, --session <sessionId>",
      description: "Use specific session (default: current session)",
    },
    {
      flags: "--ai",
      description: "Enable AI-powered review",
    },
    {
      flags: "--no-ai",
      description: "Disable AI-powered review",
    },
    {
      flags: "--severity <severity>",
      description: "Filter by severity (critical, high, medium, low, info)",
    },
    {
      flags: "--category <category>",
      description: "Filter by category",
    },
    {
      flags: "--format <format>",
      description: "Output format (text, json, markdown)",
    },
    {
      flags: "-o, --output <file>",
      description: "Output file",
    },
    {
      flags: "--exclude <patterns>",
      description: "Comma-separated patterns to exclude",
    },
    {
      flags: "--include <patterns>",
      description: "Comma-separated patterns to include",
    },
    {
      flags: "--limit <number>",
      description: "Limit number of issues shown",
    },
    {
      flags: "--config <configFile>",
      description: "Custom configuration file",
    },
  ],
  examples: [
    "naturecode review file src/index.js",
    "naturecode review dir src/ --ai --format json",
    "naturecode review project --session current",
    "naturecode review history",
    "naturecode review rules --enabled",
    "naturecode review export latest --output review.json",
  ],
  handler: runReviewCommand,
};
