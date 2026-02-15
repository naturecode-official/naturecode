// Performance CLI commands for v1.4.3
// Provides command-line interface for performance monitoring and optimization

import { PerformanceCommandHandler } from "../../utils/performance/performance-commands.js";

export function setupPerformanceCommands(program) {
  const performanceCommand = program
    .command("performance")
    .description("Performance monitoring and optimization commands")
    .alias("perf");

  // performance monitor command
  performanceCommand
    .command("monitor")
    .description("Start/stop performance monitoring")
    .option(
      "-a, --action <action>",
      "Action: start, stop, status (default: start)",
    )
    .option(
      "-d, --duration <duration>",
      "Monitoring duration in milliseconds (0 = indefinite)",
    )
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new PerformanceCommandHandler();
        const result = await handler.handleCommand("performance:monitor", {
          action: options.action,
          duration: options.duration ? parseInt(options.duration) : undefined,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Performance Monitoring");
          console.log("=====================");
          console.log(`Status: ${result.message}`);

          if (result.duration) {
            console.log(`Duration: ${result.duration}`);
          }

          console.log();
          console.log(
            "Use 'naturecode performance:report' to see monitoring results",
          );
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // performance report command
  performanceCommand
    .command("report")
    .description("Generate performance report")
    .option(
      "-f, --format <format>",
      "Report format: json, summary (default: json)",
    )
    .option("-s, --save", "Save report to file")
    .option("-o, --file <file>", "Output file path (required with --save)")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new PerformanceCommandHandler();
        const result = await handler.handleCommand("performance:report", {
          format: options.format,
          save: options.save,
          file: options.file,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          if (options.format === "summary") {
            console.log("Performance Summary Report");
            console.log("=========================");
            console.log(`Time: ${result.summary.timestamp}`);
            console.log();

            console.log("System Status:");
            console.log(`  Memory: ${result.summary.system.memory}`);
            console.log(`  CPU: ${result.summary.system.cpu}`);
            console.log(`  Network: ${result.summary.system.network}`);
            console.log();

            console.log("Operations:");
            console.log(`  Total: ${result.summary.operations.total}`);
            console.log(`  Slowest: ${result.summary.operations.slowest}`);
            console.log(
              `  Average Duration: ${result.summary.operations.averageDuration}`,
            );
            console.log();

            console.log("Issues:");
            console.log(`  Alerts: ${result.summary.alerts}`);
            console.log(`  Recommendations: ${result.summary.recommendations}`);
            console.log();

            console.log("Overall Status:");
            console.log(
              `  Level: ${result.summary.status.level.toUpperCase()}`,
            );
            console.log(`  Message: ${result.summary.status.message}`);
          } else {
            const report = result.report;
            console.log("Performance Detailed Report");
            console.log("==========================");
            console.log(`Time: ${report.timestamp}`);
            console.log();

            // System metrics
            if (report.system.memory) {
              console.log("Memory:");
              console.log(`  Total: ${report.system.memory.current.total}`);
              console.log(
                `  Used: ${report.system.memory.current.used} (${report.system.memory.current.usage})`,
              );
              console.log(`  Free: ${report.system.memory.current.free}`);
              console.log(
                `  Heap: ${report.system.memory.current.heapUsed} / ${report.system.memory.current.heapTotal}`,
              );
              console.log(`  Status: ${report.system.memory.status.message}`);
              console.log();
            }

            if (report.system.cpu) {
              console.log("CPU:");
              console.log(`  Cores: ${report.system.cpu.current.cores}`);
              console.log(`  Usage: ${report.system.cpu.current.usage}`);
              console.log(
                `  Load: ${report.system.cpu.current.load1}, ${report.system.cpu.current.load5}, ${report.system.cpu.current.load15}`,
              );
              console.log(`  Status: ${report.system.cpu.status.message}`);
              console.log();
            }

            // Operations
            if (report.operations.totalOperations > 0) {
              console.log("Operations Performance:");
              console.log(
                `  Total Operations: ${report.operations.totalOperations}`,
              );
              console.log(
                `  Average Duration: ${report.operations.averageDuration}`,
              );

              if (report.operations.slowest) {
                console.log(
                  `  Slowest: ${report.operations.slowest.operation} (${report.operations.slowest.duration})`,
                );
              }

              if (report.operations.fastest) {
                console.log(
                  `  Fastest: ${report.operations.fastest.operation} (${report.operations.fastest.duration})`,
                );
              }
              console.log();

              // Top 5 slowest operations
              if (report.operations.operations.length > 0) {
                console.log("Top 5 Slowest Operations:");
                report.operations.operations
                  .slice(0, 5)
                  .forEach((op, index) => {
                    console.log(`  ${index + 1}. ${op.name}`);
                    console.log(
                      `     Count: ${op.count}, Avg: ${op.averageDuration}, Max: ${op.maxDuration}`,
                    );
                  });
                console.log();
              }
            }

            // Alerts
            if (report.alerts.length > 0) {
              console.log("Alerts:");
              report.alerts.forEach((alert, index) => {
                console.log(
                  `  ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`,
                );
                console.log(`     Time: ${alert.timestamp}`);
              });
              console.log();
            }

            // Recommendations
            if (report.recommendations.length > 0) {
              console.log("Recommendations:");
              report.recommendations.forEach((rec, index) => {
                console.log(
                  `  ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`,
                );
                console.log(`     Action: ${rec.action}`);
              });
              console.log();
            }
          }

          if (result.saved) {
            console.log(`Report saved to: ${result.saved}`);
          }
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // performance analyze command
  performanceCommand
    .command("analyze")
    .description("Analyze specific operation performance")
    .requiredOption("-o, --operation <operation>", "Operation name to analyze")
    .option(
      "-i, --iterations <iterations>",
      "Number of iterations (default: 10)",
    )
    .option("-w, --warmup <warmup>", "Warmup iterations (default: 3)")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new PerformanceCommandHandler();
        const result = await handler.handleCommand("performance:analyze", {
          operation: options.operation,
          iterations: options.iterations
            ? parseInt(options.iterations)
            : undefined,
          warmup: options.warmup ? parseInt(options.warmup) : undefined,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Performance Analysis");
          console.log("===================");
          console.log(`Operation: ${result.analysis.operation}`);
          console.log(
            `Iterations: ${result.analysis.iterations} (warmup: ${result.analysis.warmup})`,
          );
          console.log();

          const stats = result.analysis.measurements;
          console.log("Performance Statistics:");
          console.log(`  Average: ${stats.average}`);
          console.log(`  Minimum: ${stats.min}`);
          console.log(`  Maximum: ${stats.max}`);
          console.log(`  Std Dev: ${stats.stdDev}`);
          console.log(`  Total: ${stats.total}`);
          console.log(`  Samples: ${stats.count}`);
          console.log();

          // Show individual measurements if not too many
          if (stats.count <= 20) {
            console.log("Individual Measurements:");
            stats.measurements.forEach((measurement, index) => {
              console.log(`  ${index + 1}. ${measurement}`);
            });
            console.log();
          }

          // Recommendations
          if (result.analysis.recommendations.length > 0) {
            console.log("Recommendations:");
            result.analysis.recommendations.forEach((rec, index) => {
              console.log(
                `  ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`,
              );
              console.log(`     ${rec.action}`);
            });
          } else {
            console.log("No optimization recommendations needed.");
          }
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // performance optimize command
  performanceCommand
    .command("optimize")
    .description("Get optimization suggestions")
    .option(
      "-t, --type <type>",
      "Optimization type: general, memory, cpu, network, all (default: general)",
    )
    .option(
      "-l, --level <level>",
      "Optimization level: high, medium, low (default: medium)",
    )
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new PerformanceCommandHandler();
        const result = await handler.handleCommand("performance:optimize", {
          type: options.type,
          level: options.level,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Performance Optimization Suggestions");
          console.log("===================================");
          console.log(`Type: ${options.type || "general"}`);
          console.log(`Level: ${options.level || "medium"}`);
          console.log(`Suggestions: ${result.optimizations.length}`);
          console.log();

          // Group by category
          const byCategory = {};
          result.optimizations.forEach((opt) => {
            if (!byCategory[opt.category]) {
              byCategory[opt.category] = [];
            }
            byCategory[opt.category].push(opt);
          });

          Object.entries(byCategory).forEach(([category, optimizations]) => {
            console.log(`${category.toUpperCase()}:`);
            optimizations.forEach((opt, index) => {
              console.log(
                `  ${index + 1}. [${opt.priority.toUpperCase()}] ${opt.suggestion}`,
              );
              console.log(`     Impact: ${opt.impact}, Effort: ${opt.effort}`);
              console.log(`     Details: ${opt.details}`);
            });
            console.log();
          });

          console.log("Next Steps:");
          console.log("1. Review suggestions above");
          console.log("2. Prioritize by impact/effort ratio");
          console.log(
            "3. Implement high-impact, low-effort optimizations first",
          );
          console.log("4. Monitor performance after each optimization");
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // performance status command
  performanceCommand
    .command("status")
    .description("Show performance monitoring status")
    .option("-j, --json", "Output in JSON format")
    .action(async (options) => {
      try {
        const handler = new PerformanceCommandHandler();
        const result = await handler.handleCommand("performance:status");

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log("Performance Monitoring Status");
          console.log("============================");
          console.log(
            `Monitoring: ${result.status.monitoring ? "ACTIVE" : "INACTIVE"}`,
          );
          console.log();

          console.log("Metrics Collected:");
          console.log(
            `  Memory Samples: ${result.status.metrics.memorySamples}`,
          );
          console.log(`  CPU Samples: ${result.status.metrics.cpuSamples}`);
          console.log(`  Disk Samples: ${result.status.metrics.diskSamples}`);
          console.log(
            `  Network Samples: ${result.status.metrics.networkSamples}`,
          );
          console.log(
            `  Operations Tracked: ${result.status.metrics.operationsTracked}`,
          );
          console.log(`  History Size: ${result.status.metrics.historySize}`);
          console.log();

          if (result.status.system.memory) {
            console.log("Current System Status:");
            console.log(
              `  Memory: ${result.status.system.memory.current.usage}`,
            );
            console.log(`  CPU: ${result.status.system.cpu.current.usage}`);
            console.log();
          }

          console.log("Operations:");
          console.log(`  Total: ${result.status.operations.totalOperations}`);
          console.log(
            `  Tracked Types: ${result.status.operations.operations.length}`,
          );
          console.log();

          console.log("Issues:");
          console.log(`  Active Alerts: ${result.status.alerts}`);
          console.log(`  Recommendations: ${result.status.recommendations}`);
          console.log();

          console.log(result.message);
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // performance help command
  performanceCommand
    .command("help")
    .description("Show performance help")
    .action(async () => {
      try {
        const handler = new PerformanceCommandHandler();
        const result = await handler.handleCommand("performance:help");

        console.log("Performance Monitoring and Optimization Help");
        console.log("===========================================");
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

  return performanceCommand;
}
