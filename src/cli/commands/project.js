import { projectCommandHandler } from "../../utils/project-commands.js";

export class ProjectManagement {
  constructor() {
    this.handler = projectCommandHandler;
  }

  async manageProject(options = {}) {
    try {
      const command = options.command || "analyze";
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

      const result = await this.handler.handleCommand(command, args);

      if (options.json) {
        return JSON.stringify(result, null, 2);
      }

      return this.formatResult(result, command);
    } catch (error) {
      throw new Error(`Project management failed: ${error.message}`);
    }
  }

  async analyzeComprehensive(options = {}) {
    try {
      const args = {
        dir: options.dir || process.cwd(),
        maxDepth: options.maxDepth ? parseInt(options.maxDepth) : 5,
        excludeDirs: options.excludeDirs
          ? options.excludeDirs.split(",")
          : ["node_modules", ".git", "dist", "build"],
      };

      const results = {};

      // 1. 项目健康度分析
      try {
        results.health = await this.handler.handleCommand("health", args);
      } catch (error) {
        results.health = { error: error.message };
      }

      // 2. 项目结构分析
      try {
        results.structure = await this.handler.handleCommand("structure", {
          ...args,
          maxDepth: 3,
        });
      } catch (error) {
        results.structure = { error: error.message };
      }

      // 3. 依赖升级检查
      try {
        results.upgrades = await this.handler.handleCommand("upgrades", args);
      } catch (error) {
        results.upgrades = { error: error.message };
      }

      // 4. 依赖冲突检查
      try {
        results.conflicts = await this.handler.handleCommand("conflicts", args);
      } catch (error) {
        results.conflicts = { error: error.message };
      }

      if (options.json) {
        return JSON.stringify(results, null, 2);
      }

      return this.formatComprehensiveResults(results);
    } catch (error) {
      throw new Error(
        `Comprehensive project analysis failed: ${error.message}`,
      );
    }
  }

  formatResult(result, command) {
    switch (command) {
      case "health":
        return this.formatHealth(result);
      case "structure":
        return this.formatStructure(result);
      case "analyze":
        return this.formatAnalysis(result);
      case "upgrades":
        return this.formatUpgrades(result);
      case "conflicts":
        return this.formatConflicts(result);
      case "create":
        return this.formatCreate(result);
      default:
        return JSON.stringify(result, null, 2);
    }
  }

  formatHealth(health) {
    if (!health || health.score === undefined) {
      return "No health data available";
    }

    let output = `Project Health Assessment:
Score: ${health.score}/100
Status: ${this.getHealthStatus(health.score)}`;

    if (health.issues && health.issues.length > 0) {
      const criticalIssues = health.issues.filter(
        (i) => i.severity === "critical",
      ).length;
      const warningIssues = health.issues.filter(
        (i) => i.severity === "warning",
      ).length;
      output += `\nCritical Issues: ${criticalIssues}`;
      output += `\nWarning Issues: ${warningIssues}`;

      if (criticalIssues > 0) {
        const criticalList = health.issues
          .filter((i) => i.severity === "critical")
          .slice(0, 5)
          .map((i) => `  - ${i.message}`)
          .join("\n");
        output += `\nTop Critical Issues:\n${criticalList}`;
      }
    }

    if (health.strengths && health.strengths.length > 0) {
      output += `\n\nStrengths:`;
      health.strengths.slice(0, 5).forEach((strength) => {
        output += `\n  ✓ ${strength}`;
      });
    }

    return output;
  }

  formatStructure(structure) {
    if (!structure || !structure.summary) {
      return "No structure data available";
    }

    const summary = structure.summary;
    return `Project Structure Analysis:
Path: ${summary.path || "unknown"}
Type: ${summary.type || "unknown"}
Total size: ${this.formatFileSize(summary.size || 0)}
Files: ${summary.fileCount || 0}
Directories: ${summary.directoryCount || 0}
Directory depth: ${summary.depth || 0}
Main languages: ${summary.mainLanguages || "unknown"}`;
  }

  formatAnalysis(analysis) {
    if (!analysis) {
      return "No analysis data available";
    }

    let output = `Project Analysis Complete:\n`;
    output += `Path: ${analysis.path || "unknown"}\n`;
    output += `Type: ${analysis.type || "unknown"}\n`;
    output += `Files: ${analysis.fileCount || 0}\n`;
    output += `Directories: ${analysis.directoryCount || 0}\n`;

    if (analysis.recommendations && analysis.recommendations.length > 0) {
      output += `\nTop Recommendations:\n`;
      analysis.recommendations.slice(0, 5).forEach((rec) => {
        output += `  [${rec.severity}] ${rec.message}\n`;
      });
    }

    return output;
  }

  formatUpgrades(upgrades) {
    if (!upgrades || !upgrades.updates || upgrades.updates.length === 0) {
      return "No dependency updates available";
    }

    const securityUpdates = upgrades.updates.filter(
      (u) => u.type === "security",
    ).length;
    const majorUpdates = upgrades.updates.filter(
      (u) => u.type === "major",
    ).length;
    const minorUpdates = upgrades.updates.filter(
      (u) => u.type === "minor",
    ).length;

    let output = `Dependency Updates Available:
Total: ${upgrades.updates.length}
Security: ${securityUpdates}
Major: ${majorUpdates}
Minor: ${minorUpdates}`;

    if (securityUpdates > 0) {
      const securityList = upgrades.updates
        .filter((u) => u.type === "security")
        .slice(0, 5)
        .map((u) => `  - ${u.name}: ${u.current} → ${u.latest} (${u.severity})`)
        .join("\n");
      output += `\n\nSecurity Updates:\n${securityList}`;
    }

    return output;
  }

  formatConflicts(conflicts) {
    if (
      !conflicts ||
      !conflicts.conflicts ||
      conflicts.conflicts.length === 0
    ) {
      return "No dependency conflicts found";
    }

    let output = `Dependency Conflicts Found: ${conflicts.conflicts.length}\n\n`;

    conflicts.conflicts.slice(0, 5).forEach((conflict) => {
      output += `Package: ${conflict.package}\n`;
      output += `  Required by: ${conflict.requiredBy.join(", ")}\n`;
      output += `  Versions: ${conflict.versions.join(", ")}\n`;
      output += `  Severity: ${conflict.severity}\n\n`;
    });

    return output;
  }

  formatCreate(create) {
    if (!create) {
      return "Project creation completed";
    }

    return `Project Created Successfully:
Name: ${create.name || "unknown"}
Path: ${create.path || "unknown"}
Template: ${create.template || "unknown"}
Status: ${create.status || "completed"}`;
  }

  formatComprehensiveResults(results) {
    let output = "Comprehensive Project Analysis Results:\n\n";

    if (results.health && !results.health.error) {
      output += "1. PROJECT HEALTH:\n";
      output += this.formatHealth(results.health) + "\n\n";
    }

    if (results.structure && !results.structure.error) {
      output += "2. PROJECT STRUCTURE:\n";
      output += this.formatStructure(results.structure) + "\n\n";
    }

    if (results.upgrades && !results.upgrades.error) {
      output += "3. DEPENDENCY UPDATES:\n";
      output += this.formatUpgrades(results.upgrades) + "\n\n";
    }

    if (results.conflicts && !results.conflicts.error) {
      output += "4. DEPENDENCY CONFLICTS:\n";
      output += this.formatConflicts(results.conflicts) + "\n\n";
    }

    return output;
  }

  getHealthStatus(score) {
    if (score >= 90) return "EXCELLENT";
    if (score >= 75) return "GOOD";
    if (score >= 60) return "FAIR";
    if (score >= 40) return "NEEDS IMPROVEMENT";
    return "POOR";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  getAvailableCommands() {
    return this.handler.getAvailableCommands();
  }
}

export const projectManagement = new ProjectManagement();
