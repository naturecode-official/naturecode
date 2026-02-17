#!/usr/bin/env node

import { ProjectManager } from "./project-manager.js";
import { exitWithError } from "./error-handler.js";
import path from "path";

export class ProjectCommandHandler {
  constructor() {
    this.manager = new ProjectManager();
    this.commands = [
      {
        command: "analyze",
        description: "Analyze project structure",
        handler: this.handleAnalyze.bind(this),
      },
      {
        command: "structure",
        description: "Show project structure tree",
        handler: this.handleStructure.bind(this),
      },
      {
        command: "health",
        description: "Check project health score",
        handler: this.handleHealth.bind(this),
      },
      {
        command: "create",
        description: "Create project from template",
        handler: this.handleCreate.bind(this),
      },
      {
        command: "setup",
        description: "Automate project setup",
        handler: this.handleSetup.bind(this),
      },
      {
        command: "templates",
        description: "List available project templates",
        handler: this.handleTemplates.bind(this),
      },
      {
        command: "upgrades",
        description: "Check for dependency upgrades",
        handler: this.handleUpgrades.bind(this),
      },
      {
        command: "conflicts",
        description: "Check for dependency conflicts",
        handler: this.handleConflicts.bind(this),
      },
      {
        command: "package-manager",
        description: "Get package manager recommendations",
        handler: this.handlePackageManager.bind(this),
      },
    ];
  }

  getAvailableCommands() {
    return this.commands.map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
    }));
  }

  async handleCommand(command, args = {}) {
    const cmd = this.commands.find((c) => c.command === command);

    if (!cmd) {
      throw new Error(`Unknown project command: ${command}`);
    }

    try {
      return await cmd.handler(args);
    } catch (error) {
      throw new Error(`Project command failed: ${error.message}`);
    }
  }

  async handleAnalyze(args) {
    const {
      dir = process.cwd(),
      maxDepth = 5,
      excludeDirs = ["node_modules", ".git", "dist", "build", ".next", ".nuxt"],
    } = args;

    console.log(`Analyzing project structure in ${dir}...`);

    const manager = new ProjectManager(dir);
    const structure = await manager.analyzeProjectStructure({
      maxDepth,
      excludeDirs,
    });

    console.log("\nProject Analysis:");
    console.log(`Path: ${structure.path}`);
    console.log(`Type: ${structure.type}`);
    console.log(`Total size: ${manager.formatFileSize(structure.size)}`);
    console.log(`Files: ${structure.fileCount}`);
    console.log(`Directories: ${structure.directoryCount}`);
    console.log(`Directory depth: ${structure.analysis.directoryDepth}`);

    console.log("\nFile types:");
    Object.entries(structure.analysis.fileTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([ext, count]) => {
        console.log(`  ${ext || "no-extension"}: ${count} files`);
      });

    if (structure.analysis.largestFiles.length > 0) {
      console.log("\nLargest files:");
      structure.analysis.largestFiles.slice(0, 5).forEach((file, index) => {
        console.log(
          `  ${index + 1}. ${file.path} (${manager.formatFileSize(file.size)})`,
        );
      });
    }

    if (structure.analysis.recommendations.length > 0) {
      console.log("\nRecommendations:");
      structure.analysis.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.message}`);
        console.log(`   Severity: ${rec.severity}`);
        console.log(`   Suggestion: ${rec.suggestion}`);
      });
    }

    return structure;
  }

  async handleStructure(args) {
    const {
      dir = process.cwd(),
      maxDepth = 3,
      excludeDirs = ["node_modules", ".git", "dist", "build"],
    } = args;

    console.log(`Project structure for ${dir}:`);

    const manager = new ProjectManager(dir);
    const structure = await manager.analyzeProjectStructure({
      maxDepth,
      excludeDirs,
    });

    // Build tree structure
    const tree = this.buildTree(structure);
    this.printTree(tree);

    return structure;
  }

  buildTree(structure) {
    const root = {
      name: path.basename(structure.path),
      type: "directory",
      children: [],
    };

    // Group files and directories by depth and parent
    const itemsByDepth = {};

    structure.directories.forEach((dir) => {
      if (!itemsByDepth[dir.depth]) itemsByDepth[dir.depth] = [];
      itemsByDepth[dir.depth].push({
        name: dir.name,
        type: "directory",
        path: dir.path,
        depth: dir.depth,
      });
    });

    structure.files.forEach((file) => {
      if (!itemsByDepth[file.depth]) itemsByDepth[file.depth] = [];
      itemsByDepth[file.depth].push({
        name: file.name,
        type: "file",
        path: file.path,
        size: file.size,
        depth: file.depth,
      });
    });

    // Build tree recursively
    function addToTree(parent, currentDepth, currentPath) {
      const items = itemsByDepth[currentDepth] || [];

      items.forEach((item) => {
        const itemPath = currentPath
          ? path.join(currentPath, item.name)
          : item.name;
        const itemParentPath = path.dirname(itemPath);

        if (
          itemParentPath === currentPath ||
          (!currentPath && itemParentPath === ".")
        ) {
          parent.children.push({
            name: item.name,
            type: item.type,
            size: item.size,
            children: item.type === "directory" ? [] : undefined,
          });

          if (item.type === "directory") {
            const childNode = parent.children[parent.children.length - 1];
            addToTree(childNode, currentDepth + 1, itemPath);
          }
        }
      });
    }

    addToTree(root, 0, "");
    return root;
  }

  printTree(node, prefix = "", isLast = true) {
    const connector = isLast ? "└── " : "├── ";
    const extension = node.type === "file" ? path.extname(node.name) : "";
    const name = node.type === "directory" ? `${node.name}/` : node.name;

    let display = `${prefix}${connector}${name}`;

    if (node.type === "file" && node.size) {
      const manager = new ProjectManager();
      display += ` (${manager.formatFileSize(node.size)}${extension})`;
    }

    console.log(display);

    if (node.children) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      node.children.forEach((child, index) => {
        const childIsLast = index === node.children.length - 1;
        this.printTree(child, newPrefix, childIsLast);
      });
    }
  }

  async handleHealth(args) {
    const { dir = process.cwd() } = args;

    console.log(`Checking project health for ${dir}...`);

    const manager = new ProjectManager(dir);
    const health = await manager.getProjectHealth();

    console.log("\nProject Health Assessment:");
    console.log(`Score: ${health.score}/100`);
    console.log(`Status: ${health.status.toUpperCase()}`);

    if (health.strengths.length > 0) {
      console.log("\nStrengths:");
      health.strengths.forEach((strength, index) => {
        console.log(`  ${index + 1}. ${strength}`);
      });
    }

    if (health.issues.length > 0) {
      console.log("\nIssues:");
      health.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    if (health.recommendations.length > 0) {
      console.log("\nRecommendations:");
      health.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.message}`);
        console.log(`   Severity: ${rec.severity}`);
        console.log(`   Suggestion: ${rec.suggestion}`);
      });
    }

    // Provide overall assessment
    console.log("\nOverall Assessment:");
    if (health.status === "excellent") {
      console.log(
        "Your project is well-structured and follows best practices.",
      );
    } else if (health.status === "good") {
      console.log(
        "Your project is in good shape with some areas for improvement.",
      );
    } else if (health.status === "fair") {
      console.log("Your project needs attention in several areas.");
    } else {
      console.log("Your project requires significant improvements.");
    }

    return health;
  }

  async handleCreate(args) {
    const { template, name, description, author, dir = process.cwd() } = args;

    if (!template) {
      throw new Error("Template type is required");
    }

    console.log(`Creating ${template} project in ${dir}...`);

    const manager = new ProjectManager(dir);
    const result = await manager.createProjectTemplate(template, {
      name,
      description,
      author,
    });

    console.log("\nProject created successfully!");
    console.log(`Template: ${result.template}`);
    console.log(`Location: ${dir}`);

    if (result.createdFiles && result.createdFiles.length > 0) {
      console.log("\nCreated files:");
      result.createdFiles.slice(0, 10).forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });

      if (result.createdFiles.length > 10) {
        console.log(`  ... and ${result.createdFiles.length - 10} more files`);
      }
    }

    console.log("\nNext steps:");
    console.log("  1. Review the created files");
    console.log("  2. Customize configuration as needed");
    console.log("  3. Run 'naturecode project setup' to automate setup");

    return result;
  }

  async handleSetup(args) {
    const {
      dir = process.cwd(),
      initGit = true,
      installDeps = true,
      createInitialCommit = true,
    } = args;

    console.log(`Setting up project automation in ${dir}...`);

    const manager = new ProjectManager(dir);
    const result = await manager.setupProjectAutomation({
      initGit,
      installDeps,
      createInitialCommit,
    });

    console.log("\nProject setup completed!");

    if (result.tasks && result.tasks.length > 0) {
      console.log("\nTasks performed:");
      result.tasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task}`);
      });
    }

    console.log(`\nProject type: ${result.projectType}`);
    console.log(`Status: ${result.success ? "SUCCESS" : "PARTIAL"}`);

    if (!result.success) {
      console.log(
        "\nNote: Some tasks may have failed. Check above for details.",
      );
    }

    return result;
  }

  async handleTemplates(args) {
    const templates = [
      {
        name: "nodejs",
        description: "Basic Node.js project",
        includes: ["package.json", "index.js", "README.md", ".gitignore"],
      },
      {
        name: "react",
        description: "React application",
        includes: [
          "React components",
          "package.json",
          "src/ directory",
          "public/ directory",
        ],
      },
      {
        name: "python",
        description: "Python project with Flask",
        includes: ["app.py", "requirements.txt", "README.md", ".gitignore"],
      },
      {
        name: "express",
        description: "Express.js web application",
        includes: [
          "Express server",
          "package.json",
          "middleware",
          "API routes",
        ],
      },
    ];

    console.log("Available project templates:");
    console.log("");

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name.toUpperCase()}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Includes: ${template.includes.join(", ")}`);
      console.log("");
    });

    console.log("Usage example:");
    console.log(
      '  naturecode project create --template nodejs --name "my-project"',
    );
    console.log('  naturecode project create --template react --name "my-app"');

    return { templates };
  }

  async handleUpgrades(args) {
    const { dir = process.cwd() } = args;

    console.log(`Checking for dependency upgrades in ${dir}...`);

    const manager = new ProjectManager(dir);
    const upgrades = await manager.getDependencyUpgrades();

    console.log("\nDependency Upgrades:");
    console.log(`Package Manager: ${upgrades.packageManager}`);
    console.log(`Total updates available: ${upgrades.summary.total}`);

    if (upgrades.summary.total > 0) {
      console.log(`  Major: ${upgrades.summary.major}`);
      console.log(`  Minor: ${upgrades.summary.minor}`);
      console.log(`  Patch: ${upgrades.summary.patch}`);

      if (upgrades.available.length > 0) {
        console.log("\nAvailable updates:");
        upgrades.available.slice(0, 10).forEach((upgrade, index) => {
          console.log(
            `  ${index + 1}. ${upgrade.name}: ${upgrade.current} -> ${upgrade.latest} (${upgrade.upgradeType})`,
          );
        });

        if (upgrades.available.length > 10) {
          console.log(`  ... and ${upgrades.available.length - 10} more`);
        }
      }

      if (upgrades.recommendations.length > 0) {
        console.log("\nRecommendations:");
        upgrades.recommendations.forEach((rec, index) => {
          console.log(`\n${index + 1}. ${rec.message}`);
          console.log(`   Priority: ${rec.priority}`);
          console.log(`   Suggestion: ${rec.suggestion}`);
          if (rec.packages && rec.packages.length > 0) {
            console.log(`   Packages: ${rec.packages.join(", ")}`);
          }
        });
      }
    } else {
      console.log("\nAll dependencies are up to date.");
    }

    return upgrades;
  }

  async handleConflicts(args) {
    const { dir = process.cwd() } = args;

    console.log(`Checking for dependency conflicts in ${dir}...`);

    const manager = new ProjectManager(dir);
    const conflicts = await manager.checkDependencyConflicts();

    console.log("\nDependency Conflicts Analysis:");

    if (conflicts.found.length > 0) {
      console.log(`\nConflicts found: ${conflicts.found.length}`);
      conflicts.found.forEach((conflict, index) => {
        console.log(`\n${index + 1}. ${conflict.type.toUpperCase()}`);
        console.log(`   Severity: ${conflict.severity}`);
        console.log(`   Message: ${conflict.message}`);
        if (conflict.resolution) {
          console.log(`   Resolution: ${conflict.resolution}`);
        }
      });
    } else {
      console.log("No conflicts found.");
    }

    if (conflicts.warnings.length > 0) {
      console.log(`\nWarnings: ${conflicts.warnings.length}`);
      conflicts.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.type.toUpperCase()}`);
        console.log(`   Severity: ${warning.severity}`);
        console.log(`   Message: ${warning.message}`);
      });
    }

    if (conflicts.resolutions.length > 0) {
      console.log("\nSuggested Resolutions:");
      conflicts.resolutions.forEach((resolution, index) => {
        console.log(`\n${index + 1}. ${resolution.solution}`);
        console.log(`   Command: ${resolution.command}`);
      });
    }

    if (conflicts.found.length === 0 && conflicts.warnings.length === 0) {
      console.log("\nDependency tree is healthy with no conflicts.");
    }

    return conflicts;
  }

  async handlePackageManager(args) {
    const { dir = process.cwd() } = args;

    console.log(`Analyzing package manager options for ${dir}...`);

    const manager = new ProjectManager(dir);
    const recommendation = await manager.recommendPackageManager();

    console.log("\nPackage Manager Analysis:");
    console.log(`Current: ${recommendation.current}`);

    if (recommendation.analysis.message) {
      console.log(`\n${recommendation.analysis.message}`);
    } else {
      console.log("\nProject Characteristics:");
      console.log(
        `  Total dependencies: ${recommendation.analysis.projectSize}`,
      );
      console.log(
        `  Monorepo: ${recommendation.analysis.isMonorepo ? "Yes" : "No"}`,
      );

      console.log("\nLock files present:");
      Object.entries(recommendation.analysis.lockFiles).forEach(
        ([pm, exists]) => {
          console.log(`  ${pm}: ${exists ? "Yes" : "No"}`);
        },
      );
    }

    if (recommendation.suggestions.length > 0) {
      console.log("\nRecommendations:");
      recommendation.suggestions.forEach((suggestion, index) => {
        console.log(
          `\n${index + 1}. ${suggestion.packageManager.toUpperCase()}`,
        );
        console.log(`   Priority: ${suggestion.priority}`);
        console.log(`   Reason: ${suggestion.reason}`);

        if (suggestion.pros && suggestion.pros.length > 0) {
          console.log("   Pros:");
          suggestion.pros.forEach((pro) => {
            console.log(`     - ${pro}`);
          });
        }

        if (suggestion.cons && suggestion.cons.length > 0) {
          console.log("   Cons:");
          suggestion.cons.forEach((con) => {
            console.log(`     - ${con}`);
          });
        }
      });
    }

    console.log(
      "\nNote: Switching package managers requires careful migration.",
    );
    console.log("Consider team preferences and existing workflows.");

    return recommendation;
  }
}

export const projectCommandHandler = new ProjectCommandHandler();

// For direct testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const handler = new ProjectCommandHandler();
  const command = process.argv[2] || "templates";
  const args = { dir: process.cwd() };

  handler.handleCommand(command, args).catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}
