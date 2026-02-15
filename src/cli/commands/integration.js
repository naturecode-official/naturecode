// Integration CLI commands for v1.4.3
// Provides command-line interface for third-party tool integration

import { IntegrationCommandHandler } from "../../utils/integration/integration-commands.js";

export function setupIntegrationCommands(program) {
  const integrationCommand = program
    .command("integration")
    .description("Third-party tool integration commands")
    .alias("int");

  // integration status command
  integrationCommand
    .command("status")
    .description("Show integration status")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new IntegrationCommandHandler();
        const result = await handler.handleCommand("integration:status");

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Third-Party Tool Integration Status");
          console.log("===================================");
          console.log(
            `Available: ${result.status.available}/${result.status.total} tools`,
          );
          console.log();

          result.status.integrations.forEach((integration) => {
            const status = integration.available ? "[OK]" : "[NO]";
            console.log(`${status} ${integration.name}`);
            console.log(`  ${integration.description}`);
            if (integration.available) {
              console.log(`  Features: ${integration.features.join(", ")}`);
            }
            console.log();
          });

          console.log(result.message);
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // integration analyze command
  integrationCommand
    .command("analyze")
    .description("Analyze project for tool integration")
    .option("-p, --path <path>", "Project path (default: current directory)")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new IntegrationCommandHandler();
        const result = await handler.handleCommand("integration:analyze", {
          path: options.path,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Project Integration Analysis");
          console.log("============================");
          console.log(`Project: ${result.analysis.projectPath}`);
          console.log();

          // Show available tools with configs
          const toolsWithConfigs = result.analysis.tools.filter(
            (t) => t.available && t.configFound,
          );
          const toolsWithoutConfigs = result.analysis.tools.filter(
            (t) => t.available && !t.configFound,
          );

          if (toolsWithConfigs.length > 0) {
            console.log("Configured Tools:");
            toolsWithConfigs.forEach((tool) => {
              console.log(`  ✓ ${tool.name} (${tool.configFile})`);
            });
            console.log();
          }

          if (toolsWithoutConfigs.length > 0) {
            console.log("Available Tools (needs configuration):");
            toolsWithoutConfigs.forEach((tool) => {
              console.log(`  ⚠ ${tool.name}`);
            });
            console.log();
          }

          // Show project configs
          if (result.analysis.configs.length > 0) {
            console.log("Project Configuration Files:");
            result.analysis.configs.forEach((config) => {
              console.log(`  • ${config}`);
            });
            console.log();
          }

          // Show package.json info if available
          if (result.analysis.packageJson) {
            console.log("Package Information:");
            console.log(`  Name: ${result.analysis.packageJson.name}`);
            console.log(`  Version: ${result.analysis.packageJson.version}`);
            console.log(
              `  Dependencies: ${result.analysis.packageJson.dependencies}`,
            );
            console.log(
              `  Dev Dependencies: ${result.analysis.packageJson.devDependencies}`,
            );
            console.log(
              `  Scripts: ${result.analysis.packageJson.scripts.length}`,
            );
            console.log();
          }

          // Show recommendations
          if (result.analysis.recommendations.length > 0) {
            console.log("Recommendations:");
            result.analysis.recommendations.forEach((rec, index) => {
              console.log(`${index + 1}. ${rec.message}`);
              console.log(`   Action: ${rec.action}`);
              console.log();
            });

            if (result.analysis.totalRecommendations > 5) {
              console.log(
                `... and ${result.analysis.totalRecommendations - 5} more recommendations`,
              );
              console.log();
            }
          }

          console.log("Summary:");
          console.log(`  Configured Tools: ${result.summary.toolsFound}`);
          console.log(`  Config Files: ${result.summary.configsFound}`);
          console.log(`  Recommendations: ${result.summary.recommendations}`);
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // integration quality command
  integrationCommand
    .command("quality")
    .description("Run code quality checks")
    .option("-p, --path <path>", "Project path (default: current directory)")
    .option("-f, --fix", "Automatically fix issues where possible")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new IntegrationCommandHandler();
        const result = await handler.handleCommand("integration:quality", {
          path: options.path,
          fix: options.fix,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Code Quality Report");
          console.log("===================");
          console.log(`Project: ${result.quality.projectPath}`);
          console.log(
            `Time: ${new Date(result.quality.timestamp).toLocaleString()}`,
          );
          console.log();

          // Show check results
          result.quality.results.forEach((check) => {
            const status = check.success ? "✓" : "✗";
            console.log(`${status} ${check.tool}`);

            if (check.success) {
              if (check.tool === "eslint") {
                console.log(`  Files: ${check.files}`);
                console.log(
                  `  Issues: ${check.issues} (${check.errorCount} errors, ${check.warningCount} warnings)`,
                );
              } else {
                console.log(`  Status: Passed`);
              }
            } else {
              console.log(`  Error: ${check.error}`);
              if (check.stderr) {
                console.log(`  Details: ${check.stderr.split("\n")[0]}`);
              }
            }
            console.log();
          });

          // Show fix status if applied
          if (result.quality.fixApplied !== undefined) {
            console.log(
              "Auto-fix:",
              result.quality.fixApplied ? "✓ Applied" : "✗ Failed",
            );
            if (result.quality.fixMessage) {
              console.log(`  ${result.quality.fixMessage}`);
            }
            console.log();
          }

          // Show summary
          const summary = result.quality.summary;
          console.log("Summary:");
          console.log(`  Assessment: ${summary.assessment.toUpperCase()}`);
          console.log(
            `  Checks: ${summary.passed}/${summary.totalChecks} passed`,
          );
          console.log(`  Total Issues: ${summary.totalIssues}`);
          console.log(`  Message: ${summary.message}`);
          console.log();

          // Show recommendations
          if (summary.recommendations.length > 0) {
            console.log("Recommendations:");
            summary.recommendations.forEach((rec, index) => {
              console.log(
                `${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`,
              );
              console.log(`   ${rec.action}`);
              console.log();
            });
          }
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // integration run command
  integrationCommand
    .command("run")
    .description("Run a specific tool")
    .requiredOption(
      "-t, --tool <tool>",
      "Tool name (eslint, prettier, jest, etc.)",
    )
    .option("-c, --command <command>", "Tool command (test, build, lint, etc.)")
    .option("-a, --args <args...>", "Additional arguments")
    .option("-p, --path <path>", "Working directory")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new IntegrationCommandHandler();

        // Parse additional arguments
        const toolArgs = {};
        if (options.args) {
          options.args.forEach((arg) => {
            if (arg.startsWith("--")) {
              const [key, value] = arg.slice(2).split("=");
              toolArgs[key] = value || true;
            }
          });
        }

        const result = await handler.handleCommand("integration:run", {
          tool: options.tool,
          command: options.command,
          ...toolArgs,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Running: ${result.command}`);
          console.log("=".repeat(result.command.length + 10));
          console.log();

          if (result.success) {
            if (result.output) {
              console.log(result.output);
            }
            console.log();
            console.log("✓ Command completed successfully");
          } else {
            if (result.stderr) {
              console.error(result.stderr);
            }
            if (result.output) {
              console.log(result.output);
            }
            console.log();
            console.error(`✗ Command failed: ${result.error}`);
            console.log(`Exit code: ${result.exitCode || 1}`);
          }
        }

        // Exit with tool's exit code
        if (!result.success) {
          process.exit(result.exitCode || 1);
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // integration list command
  integrationCommand
    .command("list")
    .description("List available tools")
    .option(
      "-c, --category <category>",
      "Filter by category (quality, testing, build, package, container, cloud)",
    )
    .option("-a, --available", "Show only available tools")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new IntegrationCommandHandler();
        const result = await handler.handleCommand("integration:list", {
          category: options.category,
          availableOnly: options.available,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Available Tools");
          console.log("===============");
          console.log(`Total: ${result.total} (${result.available} available)`);
          console.log();

          Object.entries(result.tools).forEach(([category, tools]) => {
            console.log(`${category}:`);
            tools.forEach((tool) => {
              const status = tool.available ? "✓" : "✗";
              console.log(`  ${status} ${tool.name} - ${tool.description}`);
              if (tool.available && tool.features.length > 0) {
                console.log(`    Features: ${tool.features.join(", ")}`);
              }
            });
            console.log();
          });
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // integration help command
  integrationCommand
    .command("help")
    .description("Show integration help")
    .action(async () => {
      try {
        const handler = new IntegrationCommandHandler();
        const result = await handler.handleCommand("integration:help");

        console.log("Third-Party Tool Integration Help");
        console.log("=================================");
        console.log();

        Object.entries(result.help).forEach(([section, commands]) => {
          console.log(`${section}:`);
          commands.forEach((command) => {
            console.log(`  ${command}`);
          });
          console.log();
        });
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  return integrationCommand;
}
