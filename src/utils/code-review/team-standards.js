// Team code standards management

import fs from "fs/promises";
import path from "path";

export class TeamStandardsManager {
  constructor(teamConfigPath = null) {
    this.teamConfigPath = teamConfigPath;
    this.standards = {
      namingConventions: {
        javascript: "camelCase",
        typescript: "camelCase",
        python: "snake_case",
        java: "camelCase",
        go: "camelCase",
        rust: "snake_case",
      },
      codeStyle: {
        maxLineLength: 100,
        indentSize: 2,
        useTabs: false,
        trailingComma: "es5",
        semi: true,
        singleQuote: false,
      },
      rules: {
        enabled: [
          "no-hardcoded-secrets",
          "sql-injection",
          "xss-vulnerability",
          "long-function",
          "high-complexity",
          "long-line",
          "magic-number",
          "error-handling",
        ],
        disabled: [],
        custom: {},
      },
      thresholds: {
        maxCognitiveComplexity: 15,
        maxFunctionLength: 50,
        maxParameters: 5,
        maxNestingDepth: 4,
        maxMethodChainLength: 5,
      },
      filePatterns: {
        include: [
          "**/*.js",
          "**/*.ts",
          "**/*.py",
          "**/*.java",
          "**/*.go",
          "**/*.rs",
        ],
        exclude: ["node_modules/**", "dist/**", "build/**", "*.min.js"],
      },
    };
  }

  async loadTeamConfig() {
    if (!this.teamConfigPath) {
      return false;
    }

    try {
      const configContent = await fs.readFile(this.teamConfigPath, "utf-8");
      const config = JSON.parse(configContent);
      this.standards = { ...this.standards, ...config };
      return true;
    } catch (error) {
      console.warn(
        `Failed to load team config from ${this.teamConfigPath}:`,
        error.message,
      );
      return false;
    }
  }

  async saveTeamConfig(configPath = null) {
    const savePath = configPath || this.teamConfigPath;
    if (!savePath) {
      throw new Error("No config path specified for saving team standards");
    }

    try {
      const configDir = path.dirname(savePath);
      await fs.mkdir(configDir, { recursive: true });

      const configContent = JSON.stringify(this.standards, null, 2);
      await fs.writeFile(savePath, configContent, "utf-8");
      return true;
    } catch (error) {
      console.error(
        `Failed to save team config to ${savePath}:`,
        error.message,
      );
      return false;
    }
  }

  async createDefaultConfig(configPath) {
    this.teamConfigPath = configPath;
    return await this.saveTeamConfig();
  }

  getNamingConvention(language) {
    return this.standards.namingConventions[language] || "camelCase";
  }

  getCodeStyle() {
    return this.standards.codeStyle;
  }

  getEnabledRules() {
    return this.standards.rules.enabled;
  }

  getDisabledRules() {
    return this.standards.rules.disabled;
  }

  isRuleEnabled(ruleId) {
    return (
      this.standards.rules.enabled.includes(ruleId) &&
      !this.standards.rules.disabled.includes(ruleId)
    );
  }

  enableRule(ruleId) {
    if (!this.standards.rules.enabled.includes(ruleId)) {
      this.standards.rules.enabled.push(ruleId);
    }

    const disabledIndex = this.standards.rules.disabled.indexOf(ruleId);
    if (disabledIndex !== -1) {
      this.standards.rules.disabled.splice(disabledIndex, 1);
    }
  }

  disableRule(ruleId) {
    if (!this.standards.rules.disabled.includes(ruleId)) {
      this.standards.rules.disabled.push(ruleId);
    }
  }

  getCustomRuleConfig(ruleId) {
    return this.standards.rules.custom[ruleId];
  }

  setCustomRuleConfig(ruleId, config) {
    this.standards.rules.custom[ruleId] = config;
  }

  getThresholds() {
    return this.standards.thresholds;
  }

  setThreshold(thresholdName, value) {
    if (this.standards.thresholds[thresholdName] !== undefined) {
      this.standards.thresholds[thresholdName] = value;
    }
  }

  getFilePatterns() {
    return this.standards.filePatterns;
  }

  shouldReviewFile(filePath) {
    const { include, exclude } = this.standards.filePatterns;

    // Check if file matches any exclude pattern
    for (const pattern of exclude) {
      if (this.matchesPattern(filePath, pattern)) {
        return false;
      }
    }

    // Check if file matches any include pattern
    for (const pattern of include) {
      if (this.matchesPattern(filePath, pattern)) {
        return true;
      }
    }

    return false;
  }

  matchesPattern(filePath, pattern) {
    // Simple pattern matching (for now)
    // In a real implementation, use a proper glob matching library
    if (pattern.includes("**")) {
      const regexPattern = pattern
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, ".");
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    }

    return filePath.includes(pattern.replace("*", ""));
  }

  validateCodeAgainstStandards(code, language, filePath) {
    const violations = [];

    // Check naming conventions
    const namingConvention = this.getNamingConvention(language);

    // Check line length
    const lines = code.split("\n");
    const maxLineLength = this.standards.codeStyle.maxLineLength;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > maxLineLength) {
        violations.push({
          type: "line_length",
          severity: "warning",
          message: `Line ${i + 1} exceeds maximum length (${lines[i].length} > ${maxLineLength})`,
          line: i + 1,
          file: filePath,
        });
      }
    }

    // Check indentation
    const expectedIndent = this.standards.codeStyle.useTabs
      ? "\t"
      : " ".repeat(this.standards.codeStyle.indentSize);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;

      const leadingSpaces = line.match(/^(\s+)/)?.[1] || "";

      if (this.standards.codeStyle.useTabs) {
        if (leadingSpaces.includes(" ")) {
          violations.push({
            type: "indentation",
            severity: "warning",
            message: `Line ${i + 1} uses spaces instead of tabs for indentation`,
            line: i + 1,
            file: filePath,
          });
        }
      } else {
        if (leadingSpaces.includes("\t")) {
          violations.push({
            type: "indentation",
            severity: "warning",
            message: `Line ${i + 1} uses tabs instead of spaces for indentation`,
            line: i + 1,
            file: filePath,
          });
        } else if (
          leadingSpaces.length % this.standards.codeStyle.indentSize !==
          0
        ) {
          violations.push({
            type: "indentation",
            severity: "warning",
            message: `Line ${i + 1} has inconsistent indentation (${leadingSpaces.length} spaces)`,
            line: i + 1,
            file: filePath,
          });
        }
      }
    }

    return violations;
  }

  generateTeamReport(reviewResults) {
    const report = {
      summary: {
        totalFiles: 0,
        filesWithIssues: 0,
        totalIssues: 0,
        issuesBySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
        issuesByCategory: {},
      },
      files: [],
      standardsCompliance: 0,
      recommendations: [],
    };

    for (const result of reviewResults) {
      report.summary.totalFiles++;

      if (result.issues && result.issues.length > 0) {
        report.summary.filesWithIssues++;
        report.summary.totalIssues += result.issues.length;

        const fileReport = {
          path: result.filePath,
          totalIssues: result.issues.length,
          issuesBySeverity: {},
          issuesByCategory: {},
          issues: result.issues.map((issue) => ({
            ruleId: issue.ruleId,
            severity: issue.severity,
            category: issue.category,
            message: issue.message,
            line: issue.line,
            suggestion: issue.suggestion,
          })),
        };

        for (const issue of result.issues) {
          // Count by severity
          fileReport.issuesBySeverity[issue.severity] =
            (fileReport.issuesBySeverity[issue.severity] || 0) + 1;
          report.summary.issuesBySeverity[issue.severity] =
            (report.summary.issuesBySeverity[issue.severity] || 0) + 1;

          // Count by category
          fileReport.issuesByCategory[issue.category] =
            (fileReport.issuesByCategory[issue.category] || 0) + 1;
          report.summary.issuesByCategory[issue.category] =
            (report.summary.issuesByCategory[issue.category] || 0) + 1;
        }

        report.files.push(fileReport);
      }
    }

    // Calculate standards compliance percentage
    if (report.summary.totalFiles > 0) {
      const compliantFiles =
        report.summary.totalFiles - report.summary.filesWithIssues;
      report.standardsCompliance = Math.round(
        (compliantFiles / report.summary.totalFiles) * 100,
      );
    }

    // Generate recommendations
    if (report.summary.issuesBySeverity.critical > 0) {
      report.recommendations.push({
        priority: "critical",
        message: `Address ${report.summary.issuesBySeverity.critical} critical issues immediately`,
      });
    }

    if (report.summary.issuesBySeverity.high > 0) {
      report.recommendations.push({
        priority: "high",
        message: `Fix ${report.summary.issuesBySeverity.high} high severity issues`,
      });
    }

    // Identify most common issue categories
    const sortedCategories = Object.entries(
      report.summary.issuesByCategory,
    ).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      const [topCategory, count] = sortedCategories[0];
      report.recommendations.push({
        priority: "medium",
        message: `Focus on ${topCategory} issues (${count} total)`,
      });
    }

    return report;
  }

  toJSON() {
    return {
      teamConfigPath: this.teamConfigPath,
      standards: this.standards,
    };
  }
}

// Default team config locations
export const DEFAULT_TEAM_CONFIG_PATHS = [
  ".naturecode/team-standards.json",
  "team-standards.json",
  ".team-standards.json",
];

export async function findTeamConfig(startDir = process.cwd()) {
  for (const configPath of DEFAULT_TEAM_CONFIG_PATHS) {
    const fullPath = path.join(startDir, configPath);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch (error) {
      // File doesn't exist, continue checking
    }
  }

  // Check parent directories
  const parentDir = path.dirname(startDir);
  if (parentDir !== startDir) {
    return await findTeamConfig(parentDir);
  }

  return null;
}
