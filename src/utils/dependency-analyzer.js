#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

export class DependencyAnalyzer {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  async analyzeDependencies(options = {}) {
    try {
      const packageJsonPath = path.join(this.baseDir, "package.json");
      const requirementsPath = path.join(this.baseDir, "requirements.txt");
      const pomXmlPath = path.join(this.baseDir, "pom.xml");
      const buildGradlePath = path.join(this.baseDir, "build.gradle");
      const cargoTomlPath = path.join(this.baseDir, "Cargo.toml");
      const goModPath = path.join(this.baseDir, "go.mod");

      const results = {
        projectType: "unknown",
        dependencies: [],
        devDependencies: [],
        totalDependencies: 0,
        packageManager: "unknown",
        filesFound: [],
      };

      // Check for package.json (Node.js)
      if (await this.fileExists(packageJsonPath)) {
        results.projectType = "nodejs";
        results.packageManager = await this.detectNodePackageManager();
        const packageJson = JSON.parse(
          await fs.readFile(packageJsonPath, "utf-8"),
        );

        if (packageJson.dependencies) {
          results.dependencies = Object.entries(packageJson.dependencies).map(
            ([name, version]) => ({
              name,
              version,
              type: "production",
            }),
          );
        }

        if (packageJson.devDependencies) {
          results.devDependencies = Object.entries(
            packageJson.devDependencies,
          ).map(([name, version]) => ({
            name,
            version,
            type: "development",
          }));
        }

        results.filesFound.push("package.json");
      }

      // Check for requirements.txt (Python)
      if (await this.fileExists(requirementsPath)) {
        results.projectType = "python";
        results.packageManager = "pip";
        const requirements = await fs.readFile(requirementsPath, "utf-8");
        const deps = requirements
          .split("\n")
          .filter((line) => line.trim() && !line.trim().startsWith("#"))
          .map((line) => {
            const parts = line.trim().split(/[=<>]/);
            return {
              name: parts[0].trim(),
              version: parts[1] ? parts[1].trim() : "latest",
              type: "production",
            };
          });

        results.dependencies.push(...deps);
        results.filesFound.push("requirements.txt");
      }

      // Check for pom.xml (Java Maven)
      if (await this.fileExists(pomXmlPath)) {
        results.projectType = "java";
        results.packageManager = "maven";
        // Simple parsing for demonstration
        results.filesFound.push("pom.xml");
      }

      // Check for build.gradle (Java Gradle)
      if (await this.fileExists(buildGradlePath)) {
        results.projectType = "java";
        results.packageManager = "gradle";
        results.filesFound.push("build.gradle");
      }

      // Check for Cargo.toml (Rust)
      if (await this.fileExists(cargoTomlPath)) {
        results.projectType = "rust";
        results.packageManager = "cargo";
        results.filesFound.push("Cargo.toml");
      }

      // Check for go.mod (Go)
      if (await this.fileExists(goModPath)) {
        results.projectType = "go";
        results.packageManager = "go modules";
        results.filesFound.push("go.mod");
      }

      // Combine all dependencies
      const allDeps = [...results.dependencies, ...results.devDependencies];
      results.totalDependencies = allDeps.length;

      // Analyze dependency health
      results.analysis = await this.analyzeDependencyHealth(
        allDeps,
        results.projectType,
      );

      return results;
    } catch (error) {
      throw new Error(`Failed to analyze dependencies: ${error.message}`);
    }
  }

  async detectNodePackageManager() {
    try {
      if (await this.fileExists(path.join(this.baseDir, "yarn.lock"))) {
        return "yarn";
      } else if (
        await this.fileExists(path.join(this.baseDir, "pnpm-lock.yaml"))
      ) {
        return "pnpm";
      } else if (
        await this.fileExists(path.join(this.baseDir, "package-lock.json"))
      ) {
        return "npm";
      }
      return "npm";
    } catch (error) {
      return "unknown";
    }
  }

  async analyzeDependencyHealth(dependencies, projectType) {
    const analysis = {
      outdatedCount: 0,
      securityIssues: 0,
      largeDependencies: 0,
      deprecatedCount: 0,
      recommendations: [],
    };

    // Simple analysis based on version patterns
    dependencies.forEach((dep) => {
      const version = dep.version;

      // Check for outdated patterns
      if (version === "*" || version === "latest" || version === "x") {
        analysis.outdatedCount++;
        analysis.recommendations.push({
          dependency: dep.name,
          issue: "Uses wildcard version",
          severity: "medium",
          suggestion: "Pin to specific version for reproducibility",
        });
      }

      // Check for very old version patterns
      if (version.startsWith("^0.") || version.startsWith("~0.")) {
        analysis.outdatedCount++;
        analysis.recommendations.push({
          dependency: dep.name,
          issue: "Uses pre-1.0 version",
          severity: "low",
          suggestion: "Consider upgrading to stable version if available",
        });
      }

      // Check for large dependency names (heuristic for potential bloat)
      if (dep.name.includes("-") && dep.name.split("-").length > 3) {
        analysis.largeDependencies++;
      }
    });

    // Generate summary
    if (analysis.outdatedCount > 5) {
      analysis.summary =
        "Multiple dependencies may be outdated. Consider updating.";
    } else if (analysis.outdatedCount > 0) {
      analysis.summary = "Some dependencies may need updates.";
    } else {
      analysis.summary = "Dependencies appear to be well-managed.";
    }

    return analysis;
  }

  async getDependencyTree() {
    try {
      const packageJsonPath = path.join(this.baseDir, "package.json");

      if (!(await this.fileExists(packageJsonPath))) {
        throw new Error("package.json not found");
      }

      // Try to use npm ls if available
      try {
        const output = execSync("npm ls --depth=1 --json", {
          cwd: this.baseDir,
          encoding: "utf-8",
        });

        const tree = JSON.parse(output);
        return this.formatDependencyTree(tree);
      } catch (error) {
        // Fallback to manual analysis
        return await this.analyzeDependencies();
      }
    } catch (error) {
      throw new Error(`Failed to get dependency tree: ${error.message}`);
    }
  }

  formatDependencyTree(tree) {
    const formatted = {
      name: tree.name || "unknown",
      version: tree.version || "unknown",
      dependencies: [],
    };

    if (tree.dependencies) {
      Object.entries(tree.dependencies).forEach(([name, info]) => {
        if (info && typeof info === "object") {
          formatted.dependencies.push({
            name,
            version: info.version || "unknown",
            resolved: info.resolved || null,
            dependencies: info.dependencies
              ? Object.keys(info.dependencies).length
              : 0,
          });
        }
      });
    }

    return formatted;
  }

  async checkForSecurityIssues() {
    try {
      // Try to use npm audit if available
      try {
        const output = execSync("npm audit --json", {
          cwd: this.baseDir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"], // Capture stderr
        });

        const audit = JSON.parse(output);
        return this.formatSecurityReport(audit);
      } catch (error) {
        // npm audit failed or not available
        return {
          available: false,
          message:
            "Security audit not available. Consider running 'npm audit' manually.",
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `Security check failed: ${error.message}`,
      };
    }
  }

  formatSecurityReport(audit) {
    const report = {
      available: true,
      metadata: audit.metadata || {},
      vulnerabilities: [],
      summary: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        total: 0,
      },
    };

    if (audit.vulnerabilities) {
      Object.entries(audit.vulnerabilities).forEach(([name, vuln]) => {
        report.vulnerabilities.push({
          name,
          severity: vuln.severity,
          via: vuln.via ? vuln.via[0] : null,
          title: vuln.title,
          url: vuln.url,
          range: vuln.range,
        });

        if (vuln.severity === "critical") report.summary.critical++;
        else if (vuln.severity === "high") report.summary.high++;
        else if (vuln.severity === "moderate") report.summary.moderate++;
        else if (vuln.severity === "low") report.summary.low++;
      });

      report.summary.total = report.vulnerabilities.length;
    }

    return report;
  }

  async getDependencyStats() {
    const analysis = await this.analyzeDependencies();
    const stats = {
      projectType: analysis.projectType,
      packageManager: analysis.packageManager,
      totalDependencies: analysis.totalDependencies,
      productionDependencies: analysis.dependencies.length,
      developmentDependencies: analysis.devDependencies.length,
      filesFound: analysis.filesFound,
    };

    // Calculate additional stats
    if (analysis.dependencies.length > 0) {
      const versions = analysis.dependencies.map((d) => d.version);
      stats.wildcardVersions = versions.filter(
        (v) => v === "*" || v === "latest" || v === "x",
      ).length;
      stats.pinnedVersions = versions.length - stats.wildcardVersions;
    }

    // Add analysis results
    if (analysis.analysis) {
      stats.outdatedCount = analysis.analysis.outdatedCount;
      stats.securityIssues = analysis.analysis.securityIssues;
      stats.recommendations = analysis.analysis.recommendations.length;
    }

    return stats;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getUnusedDependencies() {
    try {
      // Try to use depcheck if available
      try {
        const output = execSync("npx depcheck --json", {
          cwd: this.baseDir,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"], // Ignore stderr
        });

        const result = JSON.parse(output);
        return {
          unused: result.dependencies || [],
          missing: result.missing || {},
          using: result.using || {},
        };
      } catch (error) {
        // depcheck not available or failed
        return {
          unused: [],
          missing: {},
          using: {},
          message:
            "Depcheck not available. Install with 'npm install -g depcheck'",
        };
      }
    } catch (error) {
      return {
        unused: [],
        missing: {},
        using: {},
        message: `Failed to check unused dependencies: ${error.message}`,
      };
    }
  }
}

export default DependencyAnalyzer;
