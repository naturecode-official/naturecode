#!/usr/bin/env node

import { projectCommandHandler } from "../../utils/project-commands.js";
import { exitWithError } from "../../utils/error-handler.js";

export async function runProjectCommand (options) {
  try {
    const command = options.command;
    const args = {
      dir: options.dir || process.cwd(),
      template: options.template,
      name: options.name,
      description: options.description,
      author: options.author,
      maxDepth: options.maxDepth ? parseInt(options.maxDepth) : 5,
      excludeDirs: options.excludeDirs
        ? options.excludeDirs.split(",")
        : ["node_modules", ".git", "dist", "build"],
      initGit: options.initGit !== false,
      installDeps: options.installDeps !== false,
      createInitialCommit: options.createInitialCommit !== false,
    };

    if (!command) {
      console.log("Available project management commands:");
      const commands = projectCommandHandler.getAvailableCommands();
      commands.forEach((cmd) => {
        console.log(`  ${cmd.command.padEnd(12)} - ${cmd.description}`);
      });
      console.log("\nUsage: naturecode project <command> [options]");
      console.log("\nExamples:");
      console.log("  naturecode project analyze");
      console.log("  naturecode project structure --max-depth 3");
      console.log("  naturecode project health");
      console.log(
        "  naturecode project create --template nodejs --name my-project",
      );
      console.log("  naturecode project setup");
      console.log("  naturecode project templates");
      return;
    }

    const result = await projectCommandHandler.handleCommand(command, args);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    exitWithError(error, "Project Management");
  }
}

// Command definition for CLI
export function createProjectCommand (program) {
  const projectCommand = program
    .command("project <command>")
    .description("Project management and structure tools")
    .option("-d, --dir <directory>", "Project directory (default: current)")
    .option("-t, --template <template>", "Template type for create command")
    .option("-n, --name <name>", "Project name for create command")
    .option(
      "--description <description>",
      "Project description for create command",
    )
    .option("--author <author>", "Project author for create command")
    .option("--max-depth <depth>", "Maximum directory depth for analysis")
    .option(
      "-x, --exclude-dirs <dirs>",
      "Comma-separated directories to exclude",
    )
    .option("--no-init-git", "Skip Git initialization in setup")
    .option("--no-install-deps", "Skip dependency installation in setup")
    .option("--no-create-initial-commit", "Skip initial commit in setup")
    .option("-j, --json", "Output results in JSON format")
    .action(runProjectCommand);

  // Add command-specific help
  projectCommand.on("--help", () => {
    console.log("");
    console.log("Commands:");
    console.log("  analyze      Analyze project structure");
    console.log("  structure    Show project structure tree");
    console.log("  health       Check project health score");
    console.log("  create       Create project from template");
    console.log("  setup        Automate project setup");
    console.log("  templates    List available project templates");
    console.log("");
    console.log("Examples:");
    console.log("  $ naturecode project analyze");
    console.log("  $ naturecode project structure --max-depth 3");
    console.log("  $ naturecode project health --dir ./my-project");
    console.log("  $ naturecode project create --template react --name my-app");
    console.log("  $ naturecode project setup --no-install-deps");
    console.log("  $ naturecode project templates");
  });

  return projectCommand;
}

// For direct testing
if (import.meta.url === `file://${process.argv[1]}`) {
  import("commander").then(({ Command }) => {
    const program = new Command();
    createProjectCommand(program);
    program.parse(process.argv);
  });
}
