// Team code reviewer with standards integration

import { CodeReviewer } from "./reviewer.js";
import { TeamStandardsManager, findTeamConfig } from "./team-standards.js";
import { RuleRegistry } from "./rules/registry.js";

export class TeamCodeReviewer extends CodeReviewer {
  constructor(context = {}) {
    super(context);
    this.teamStandards = new TeamStandardsManager(context.teamConfigPath);
    this.teamConfigLoaded = false;
  }

  async initialize() {
    // Try to load team config
    if (!this.teamStandards.teamConfigPath) {
      const foundConfig = await findTeamConfig(
        this.context.projectPath || process.cwd(),
      );
      if (foundConfig) {
        this.teamStandards.teamConfigPath = foundConfig;
      }
    }

    if (this.teamStandards.teamConfigPath) {
      this.teamConfigLoaded = await this.teamStandards.loadTeamConfig();
    }

    // Apply team standards to rule registry
    await this.applyTeamStandards();

    return this.teamConfigLoaded;
  }

  async applyTeamStandards() {
    if (!this.teamConfigLoaded) {
      return;
    }

    const enabledRules = this.teamStandards.getEnabledRules();
    const disabledRules = this.teamStandards.getDisabledRules();
    const thresholds = this.teamStandards.getThresholds();

    // Enable/disable rules based on team standards
    for (const rule of this.ruleRegistry.getAllRules()) {
      if (enabledRules.includes(rule.id)) {
        this.ruleRegistry.enableRule(rule.id);
      }

      if (disabledRules.includes(rule.id)) {
        this.ruleRegistry.disableRule(rule.id);
      }

      // Apply custom rule config
      const customConfig = this.teamStandards.getCustomRuleConfig(rule.id);
      if (customConfig) {
        this.ruleRegistry.updateRuleConfig(rule.id, customConfig);
      }

      // Apply threshold-based config updates
      this.applyThresholdConfig(rule, thresholds);
    }
  }

  applyThresholdConfig(rule, thresholds) {
    // Update rule config based on team thresholds
    switch (rule.id) {
      case "long-function":
        if (thresholds.maxFunctionLength !== undefined) {
          const config = { ...rule.config };
          config.maxLines = thresholds.maxFunctionLength;
          this.ruleRegistry.updateRuleConfig(rule.id, config);
        }
        break;

      case "high-complexity":
      case "cognitive-complexity":
        if (thresholds.maxCognitiveComplexity !== undefined) {
          const config = { ...rule.config };
          config.maxComplexity = thresholds.maxCognitiveComplexity;
          this.ruleRegistry.updateRuleConfig(rule.id, config);
        }
        break;

      case "parameter-count":
        if (thresholds.maxParameters !== undefined) {
          const config = { ...rule.config };
          config.maxParameters = thresholds.maxParameters;
          this.ruleRegistry.updateRuleConfig(rule.id, config);
        }
        break;

      case "deep-nesting":
        if (thresholds.maxNestingDepth !== undefined) {
          const config = { ...rule.config };
          config.maxDepth = thresholds.maxNestingDepth;
          this.ruleRegistry.updateRuleConfig(rule.id, config);
        }
        break;

      case "method-chaining":
        if (thresholds.maxMethodChainLength !== undefined) {
          const config = { ...rule.config };
          config.maxChainLength = thresholds.maxMethodChainLength;
          this.ruleRegistry.updateRuleConfig(rule.id, config);
        }
        break;
    }
  }

  async reviewFile(filePath, options = {}) {
    // Check if file should be reviewed based on team standards
    if (
      this.teamConfigLoaded &&
      !this.teamStandards.shouldReviewFile(filePath)
    ) {
      return {
        filePath,
        issues: [],
        standardsViolations: [],
        skipped: true,
        skipReason: "File excluded by team standards",
      };
    }

    const result = await super.reviewFile(filePath, options);

    // Add team standards validation
    if (this.teamConfigLoaded) {
      const standardsViolations =
        this.teamStandards.validateCodeAgainstStandards(
          result.content || "",
          result.language || "javascript",
          filePath,
        );

      result.standardsViolations = standardsViolations;
      result.teamStandardsApplied = true;
    }

    return result;
  }

  async reviewProject(projectPath, options = {}) {
    const startTime = Date.now();

    try {
      // Initialize team standards
      await this.initialize();

      const result = await super.reviewProject(projectPath, options);

      // Generate team report
      if (this.teamConfigLoaded) {
        const teamReport = this.teamStandards.generateTeamReport(
          result.fileResults || [],
        );
        result.teamReport = teamReport;
        result.teamStandardsApplied = true;
        result.teamConfigPath = this.teamStandards.teamConfigPath;
      }

      return result;
    } catch (error) {
      console.error("Team project review failed:", error);
      throw error;
    }
  }

  async createTeamConfig(configPath, options = {}) {
    const defaultOptions = {
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
        enabled: this.ruleRegistry
          .getAllRules()
          .filter((rule) => rule.enabled)
          .map((rule) => rule.id),
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

    const config = { ...defaultOptions, ...options };

    this.teamStandards.standards = config;
    this.teamStandards.teamConfigPath = configPath;

    const success = await this.teamStandards.saveTeamConfig();

    if (success) {
      this.teamConfigLoaded = true;
      await this.applyTeamStandards();
    }

    return success;
  }

  async updateTeamConfig(updates) {
    if (!this.teamConfigLoaded) {
      throw new Error("No team config loaded. Use createTeamConfig() first.");
    }

    // Apply updates to standards
    this.teamStandards.standards = {
      ...this.teamStandards.standards,
      ...updates,
    };

    // Save updated config
    const success = await this.teamStandards.saveTeamConfig();

    if (success) {
      await this.applyTeamStandards();
    }

    return success;
  }

  getTeamStandards() {
    return this.teamStandards.toJSON();
  }

  getEnabledRules() {
    if (this.teamConfigLoaded) {
      return this.teamStandards.getEnabledRules();
    }
    return super.getEnabledRules();
  }

  getRuleConfig(ruleId) {
    const rule = this.ruleRegistry.getRule(ruleId);
    if (!rule) return null;

    const config = { ...rule.config };

    // Apply team custom config if available
    if (this.teamConfigLoaded) {
      const customConfig = this.teamStandards.getCustomRuleConfig(ruleId);
      if (customConfig) {
        Object.assign(config, customConfig);
      }
    }

    return config;
  }

  async exportTeamReport(reviewResults, format = "json") {
    if (!this.teamConfigLoaded) {
      throw new Error("No team config loaded. Cannot generate team report.");
    }

    const report = this.teamStandards.generateTeamReport(reviewResults);

    switch (format.toLowerCase()) {
      case "json":
        return JSON.stringify(report, null, 2);

      case "markdown":
        return this.formatReportAsMarkdown(report);

      case "html":
        return this.formatReportAsHTML(report);

      default:
        return JSON.stringify(report, null, 2);
    }
  }

  formatReportAsMarkdown(report) {
    let markdown = `# Team Code Standards Report\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `- **Total Files**: ${report.summary.totalFiles}\n`;
    markdown += `- **Files with Issues**: ${report.summary.filesWithIssues}\n`;
    markdown += `- **Total Issues**: ${report.summary.totalIssues}\n`;
    markdown += `- **Standards Compliance**: ${report.standardsCompliance}%\n\n`;

    markdown += `### Issues by Severity\n\n`;
    for (const [severity, count] of Object.entries(
      report.summary.issuesBySeverity,
    )) {
      markdown += `- **${severity}**: ${count}\n`;
    }

    markdown += `\n### Issues by Category\n\n`;
    for (const [category, count] of Object.entries(
      report.summary.issuesByCategory,
    )) {
      markdown += `- **${category}**: ${count}\n`;
    }

    if (report.files.length > 0) {
      markdown += `\n## Files with Issues\n\n`;

      for (const file of report.files) {
        markdown += `### ${file.path}\n\n`;
        markdown += `**Total Issues**: ${file.totalIssues}\n\n`;

        for (const issue of file.issues) {
          markdown += `- **Line ${issue.line}**: ${issue.message} (${issue.severity})\n`;
          markdown += `  - *Suggestion*: ${issue.suggestion}\n`;
        }

        markdown += `\n`;
      }
    }

    if (report.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;

      for (const rec of report.recommendations) {
        markdown += `- **${rec.priority.toUpperCase()}**: ${rec.message}\n`;
      }
    }

    return markdown;
  }

  formatReportAsHTML(report) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Code Standards Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1, h2, h3 { color: #333; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .severity-critical { color: #dc3545; }
        .severity-high { color: #fd7e14; }
        .severity-medium { color: #ffc107; }
        .severity-low { color: #28a745; }
        .file-issues { margin-top: 20px; }
        .issue { border-left: 3px solid #ddd; padding-left: 10px; margin: 10px 0; }
        .recommendation { background: #e7f3ff; padding: 10px; border-radius: 3px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Team Code Standards Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Files</strong>: ${report.summary.totalFiles}</p>
        <p><strong>Files with Issues</strong>: ${report.summary.filesWithIssues}</p>
        <p><strong>Total Issues</strong>: ${report.summary.totalIssues}</p>
        <p><strong>Standards Compliance</strong>: ${report.standardsCompliance}%</p>
    </div>
    
    <h2>Issues by Severity</h2>
    <ul>`;

    for (const [severity, count] of Object.entries(
      report.summary.issuesBySeverity,
    )) {
      html += `<li class="severity-${severity}"><strong>${severity}</strong>: ${count}</li>`;
    }

    html += `</ul>
    
    <h2>Issues by Category</h2>
    <ul>`;

    for (const [category, count] of Object.entries(
      report.summary.issuesByCategory,
    )) {
      html += `<li><strong>${category}</strong>: ${count}</li>`;
    }

    html += `</ul>`;

    if (report.files.length > 0) {
      html += `<div class="file-issues">
        <h2>Files with Issues</h2>`;

      for (const file of report.files) {
        html += `<h3>${file.path}</h3>
        <p><strong>Total Issues</strong>: ${file.totalIssues}</p>`;

        for (const issue of file.issues) {
          html += `<div class="issue">
            <p><strong>Line ${issue.line}</strong>: ${issue.message} <span class="severity-${issue.severity}">(${issue.severity})</span></p>
            <p><em>Suggestion</em>: ${issue.suggestion}</p>
          </div>`;
        }
      }

      html += `</div>`;
    }

    if (report.recommendations.length > 0) {
      html += `<h2>Recommendations</h2>`;

      for (const rec of report.recommendations) {
        html += `<div class="recommendation">
          <p><strong>${rec.priority.toUpperCase()}</strong>: ${rec.message}</p>
        </div>`;
      }
    }

    html += `</body>
</html>`;

    return html;
  }
}
