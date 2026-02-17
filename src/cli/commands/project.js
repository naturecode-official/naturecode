#!/usr/bin/env node

import { projectCommandHandler } from "../../utils/project-commands.js";
import { exitWithError } from "../../utils/error-handler.js";

export async function runProjectCommand(options) {
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
      // 自动运行综合分析
      console.log("Running comprehensive project analysis...\n");

      try {
        // 1. 运行项目健康度分析
        console.log("Project Health:");
        try {
          const healthResult = await projectCommandHandler.handleCommand(
            "health",
            args,
          );
          if (healthResult && healthResult.score !== undefined) {
            console.log(`  Health Score: ${healthResult.score}/100`);
            if (healthResult.issues && healthResult.issues.length > 0) {
              const criticalIssues = healthResult.issues.filter(
                (i) => i.severity === "critical",
              ).length;
              const warningIssues = healthResult.issues.filter(
                (i) => i.severity === "warning",
              ).length;
              console.log(`  Critical Issues: ${criticalIssues}`);
              console.log(`  Warning Issues: ${warningIssues}`);
            }
          } else {
            console.log("  No health data available");
          }
        } catch (healthError) {
          console.log("  Health analysis skipped:", healthError.message);
        }

        // 2. 运行项目结构分析
        console.log("\nProject Structure:");
        try {
          const structureResult = await projectCommandHandler.handleCommand(
            "structure",
            { ...args, maxDepth: 3 },
          );
          if (structureResult && structureResult.summary) {
            console.log(
              `  Total Files: ${structureResult.summary.totalFiles || 0}`,
            );
            console.log(
              `  Total Directories: ${structureResult.summary.totalDirectories || 0}`,
            );
            console.log(
              `  Main Languages: ${structureResult.summary.mainLanguages || "Unknown"}`,
            );
          } else {
            console.log("  No structure data available");
          }
        } catch (structureError) {
          console.log("  Structure analysis skipped:", structureError.message);
        }

        // 3. 运行依赖升级检查
        console.log("\nDependency Status:");
        try {
          const upgradesResult = await projectCommandHandler.handleCommand(
            "upgrades",
            args,
          );
          if (upgradesResult && upgradesResult.updates) {
            const securityUpdates = upgradesResult.updates.filter(
              (u) => u.type === "security",
            ).length;
            const majorUpdates = upgradesResult.updates.filter(
              (u) => u.type === "major",
            ).length;
            console.log(`  Security Updates Available: ${securityUpdates}`);
            console.log(`  Major Updates Available: ${majorUpdates}`);
            console.log(
              `  Total Updates Available: ${upgradesResult.updates.length}`,
            );
          } else {
            console.log("  No dependency update data available");
          }
        } catch (upgradesError) {
          console.log("  Dependency analysis skipped:", upgradesError.message);
        }

        // 4. 显示摘要和建议
        console.log("\nSummary & Recommendations:");
        console.log(
          "  1. Run 'naturecode project analyze' for detailed analysis",
        );
        console.log(
          "  2. Run 'naturecode project health' for complete health report",
        );
        console.log(
          "  3. Run 'naturecode project upgrades' for dependency updates",
        );
        console.log(
          "  4. Run 'naturecode project conflicts' for dependency conflicts",
        );

        console.log("\nAvailable detailed commands:");
        const commands = projectCommandHandler.getAvailableCommands();
        commands.forEach((cmd) => {
          console.log(
            `  naturecode project ${cmd.command.padEnd(12)} - ${cmd.description}`,
          );
        });

        console.log("\nQuick start examples:");
        console.log(
          "  naturecode project analyze              # Detailed project analysis",
        );
        console.log(
          "  naturecode project health              # Complete health report",
        );
        console.log(
          "  naturecode project upgrades            # Check for updates",
        );
        console.log(
          "  naturecode project structure --max-depth 3  # View project structure",
        );

        return null;
      } catch (error) {
        console.error("Error during comprehensive analysis:", error.message);
        // 如果自动分析失败，回退到显示帮助
        console.log("\nAvailable project management commands:");
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
        return null;
      }
    } else {
      // 执行指定的子命令
      const result = await projectCommandHandler.handleCommand(command, args);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }

      return result;
    }
  } catch (error) {
    exitWithError(error, "Project Management");
  }
}

// Command definition for CLI
export function createProjectCommand(program) {
  const projectCommand = program
    .command("project [command]")
    .description(
      "Project management and structure tools (runs comprehensive analysis if no command specified)",
    )
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
