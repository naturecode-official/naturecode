// Code review types and interfaces

export const ReviewSeverity = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
};

export const ReviewCategory = {
  SECURITY: "security",
  PERFORMANCE: "performance",
  MAINTAINABILITY: "maintainability",
  READABILITY: "readability",
  BEST_PRACTICE: "best_practice",
  STYLE: "style",
  BUG_RISK: "bug_risk",
  COMPLEXITY: "complexity",
  TEST_COVERAGE: "test_coverage",
  DOCUMENTATION: "documentation",
};

export const ReviewStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
};

export class ReviewIssue {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.filePath = data.filePath || "";
    this.line = data.line || 0;
    this.column = data.column || 0;
    this.severity = data.severity || ReviewSeverity.MEDIUM;
    this.category = data.category || ReviewCategory.BEST_PRACTICE;
    this.message = data.message || "";
    this.description = data.description || "";
    this.suggestion = data.suggestion || "";
    this.codeSnippet = data.codeSnippet || "";
    this.ruleId = data.ruleId || "";
    this.confidence = data.confidence || 0.8; // 0-1 confidence score
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateId() {
    return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      filePath: this.filePath,
      line: this.line,
      column: this.column,
      severity: this.severity,
      category: this.category,
      message: this.message,
      description: this.description,
      suggestion: this.suggestion,
      codeSnippet: this.codeSnippet,
      ruleId: this.ruleId,
      confidence: this.confidence,
      tags: this.tags,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(data) {
    return new ReviewIssue(data);
  }
}

export class ReviewResult {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.sessionId = data.sessionId || "";
    this.projectPath = data.projectPath || "";
    this.filesReviewed = data.filesReviewed || 0;
    this.totalIssues = data.totalIssues || 0;
    this.issuesBySeverity = data.issuesBySeverity || {
      [ReviewSeverity.CRITICAL]: 0,
      [ReviewSeverity.HIGH]: 0,
      [ReviewSeverity.MEDIUM]: 0,
      [ReviewSeverity.LOW]: 0,
      [ReviewSeverity.INFO]: 0,
    };
    this.issuesByCategory = data.issuesByCategory || {};
    this.issues = data.issues || []; // Array of ReviewIssue objects
    this.metrics = data.metrics || {
      executionTime: 0,
      memoryUsage: 0,
      filesPerSecond: 0,
    };
    this.summary = data.summary || "";
    this.recommendations = data.recommendations || [];
    this.status = data.status || ReviewStatus.COMPLETED;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.completedAt = data.completedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  generateId() {
    return `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addIssue(issue) {
    if (!(issue instanceof ReviewIssue)) {
      issue = new ReviewIssue(issue);
    }
    this.issues.push(issue);
    this.totalIssues++;
    this.issuesBySeverity[issue.severity] =
      (this.issuesBySeverity[issue.severity] || 0) + 1;
    this.issuesByCategory[issue.category] =
      (this.issuesByCategory[issue.category] || 0) + 1;
  }

  getIssuesBySeverity(severity) {
    return this.issues.filter((issue) => issue.severity === severity);
  }

  getIssuesByCategory(category) {
    return this.issues.filter((issue) => issue.category === category);
  }

  getCriticalIssues() {
    return this.getIssuesBySeverity(ReviewSeverity.CRITICAL);
  }

  getHighPriorityIssues() {
    return [
      ...this.getIssuesBySeverity(ReviewSeverity.CRITICAL),
      ...this.getIssuesBySeverity(ReviewSeverity.HIGH),
    ];
  }

  calculateScore() {
    // Calculate a quality score based on issues
    const weights = {
      [ReviewSeverity.CRITICAL]: 10,
      [ReviewSeverity.HIGH]: 5,
      [ReviewSeverity.MEDIUM]: 2,
      [ReviewSeverity.LOW]: 1,
      [ReviewSeverity.INFO]: 0.5,
    };

    let totalWeight = 0;
    for (const [severity, count] of Object.entries(this.issuesBySeverity)) {
      totalWeight += (weights[severity] || 1) * count;
    }

    // Normalize to 0-100 scale (lower is better)
    const maxIssues = this.filesReviewed * 5; // Assume max 5 issues per file
    const maxWeight = maxIssues * 10; // Max weight if all issues are critical

    if (maxWeight === 0) return 100;
    const rawScore = 100 - (totalWeight / maxWeight) * 100;
    return Math.max(0, Math.min(100, rawScore));
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      projectPath: this.projectPath,
      filesReviewed: this.filesReviewed,
      totalIssues: this.totalIssues,
      issuesBySeverity: this.issuesBySeverity,
      issuesByCategory: this.issuesByCategory,
      issues: this.issues.map((issue) => issue.toJSON()),
      metrics: this.metrics,
      summary: this.summary,
      recommendations: this.recommendations,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      metadata: this.metadata,
      score: this.calculateScore(),
    };
  }

  static fromJSON(data) {
    const result = new ReviewResult(data);
    result.issues = (data.issues || []).map((issueData) =>
      ReviewIssue.fromJSON(issueData),
    );
    return result;
  }
}

export class ReviewRule {
  constructor(data = {}) {
    this.id = data.id || "";
    this.name = data.name || "";
    this.description = data.description || "";
    this.category = data.category || ReviewCategory.BEST_PRACTICE;
    this.severity = data.severity || ReviewSeverity.MEDIUM;
    this.languages = data.languages || []; // Empty array means all languages
    this.enabled = data.enabled !== false;
    this.config = data.config || {};
    this.tags = data.tags || [];
  }

  async check(filePath, content, context = {}) {
    // To be implemented by specific rules
    return [];
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      severity: this.severity,
      languages: this.languages,
      enabled: this.enabled,
      config: this.config,
      tags: this.tags,
    };
  }
}

export class ReviewContext {
  constructor(data = {}) {
    this.projectPath = data.projectPath || "";
    this.sessionId = data.sessionId || "";
    this.config = data.config || {};
    this.fileSystem = data.fileSystem || null;
    this.aiProvider = data.aiProvider || null;
    this.sessionManager = data.sessionManager || null;
    this.metadata = data.metadata || {};
  }
}
