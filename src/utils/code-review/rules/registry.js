// Rule registry for code review rules

import { ReviewRule } from "../types.js";
import * as builtinRules from "./index.js";

export class RuleRegistry {
  constructor() {
    this.rules = new Map(); // ruleId -> ReviewRule
    this.loadBuiltinRules();
  }

  loadBuiltinRules() {
    // Load all exported rules from the builtin rules module
    for (const [ruleName, RuleClass] of Object.entries(builtinRules)) {
      // Skip the base class and abstract classes
      if (
        ruleName === "ReviewRule" ||
        ruleName === "SecurityRule" ||
        ruleName === "PerformanceRule" ||
        ruleName === "MaintainabilityRule" ||
        ruleName === "ReadabilityRule" ||
        ruleName === "BestPracticeRule" ||
        ruleName === "ComplexityRule"
      ) {
        continue;
      }

      try {
        const rule = new RuleClass();
        if (rule.id && rule.name && rule.check) {
          this.registerRule(rule);
        }
      } catch (error) {
        console.warn(`Failed to load builtin rule ${ruleName}:`, error.message);
      }
    }
  }

  registerRule(rule) {
    if (!(rule instanceof ReviewRule)) {
      throw new Error("Rule must be an instance of ReviewRule");
    }

    if (!rule.id) {
      throw new Error("Rule must have an id");
    }

    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id ${rule.id} already registered`);
    }

    this.rules.set(rule.id, rule);
  }

  unregisterRule(ruleId) {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId) {
    return this.rules.get(ruleId);
  }

  getAllRules() {
    return Array.from(this.rules.values());
  }

  getEnabledRules() {
    return this.getAllRules().filter((rule) => rule.enabled);
  }

  getRulesForLanguage(language) {
    return this.getEnabledRules().filter((rule) => {
      if (!rule.languages || rule.languages.length === 0) {
        return true; // Rule applies to all languages
      }
      return rule.languages.includes(language);
    });
  }

  getRulesByCategory(category) {
    return this.getEnabledRules().filter((rule) => rule.category === category);
  }

  getRulesBySeverity(severity) {
    return this.getEnabledRules().filter((rule) => rule.severity === severity);
  }

  enableRule(ruleId) {
    const rule = this.getRule(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId) {
    const rule = this.getRule(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  updateRuleConfig(ruleId, config) {
    const rule = this.getRule(ruleId);
    if (rule) {
      rule.config = { ...rule.config, ...config };
    }
  }

  getRuleStats() {
    const stats = {
      total: this.rules.size,
      enabled: 0,
      byCategory: {},
      bySeverity: {},
      byLanguage: {},
    };

    for (const rule of this.rules.values()) {
      if (rule.enabled) stats.enabled++;

      // Count by category
      stats.byCategory[rule.category] =
        (stats.byCategory[rule.category] || 0) + 1;

      // Count by severity
      stats.bySeverity[rule.severity] =
        (stats.bySeverity[rule.severity] || 0) + 1;

      // Count by language
      if (rule.languages && rule.languages.length > 0) {
        for (const language of rule.languages) {
          stats.byLanguage[language] = (stats.byLanguage[language] || 0) + 1;
        }
      } else {
        stats.byLanguage["all"] = (stats.byLanguage["all"] || 0) + 1;
      }
    }

    return stats;
  }

  toJSON() {
    return {
      rules: this.getAllRules().map((rule) => rule.toJSON()),
      stats: this.getRuleStats(),
    };
  }
}
