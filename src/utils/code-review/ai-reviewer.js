// AI-powered code reviewer

import { ReviewIssue, ReviewSeverity, ReviewCategory } from "./types.js";

export class AICodeReviewer {
  constructor(aiProvider, config = {}) {
    this.aiProvider = aiProvider;
    this.config = {
      maxTokens: 2000,
      temperature: 0.3,
      model: "deepseek-chat",
      ...config,
    };
    this.cache = new Map(); // file hash -> review result
  }

  async reviewFile(filePath, content, language, options = {}) {
    const cacheKey = this.getCacheKey(filePath, content);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const issues = await this.performAIReview(
        filePath,
        content,
        language,
        options,
      );
      this.cache.set(cacheKey, issues);
      return issues;
    } catch (error) {
      console.warn(`AI review failed for ${filePath}:`, error.message);
      return [];
    }
  }

  async performAIReview(filePath, content, language, options = {}) {
    const prompt = this.buildReviewPrompt(filePath, content, language, options);

    const response = await this.aiProvider.generate(prompt, {
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      model: this.config.model,
    });

    return this.parseAIResponse(response, filePath, language);
  }

  buildReviewPrompt(filePath, content, language, options = {}) {
    const existingIssues = options.existingIssues || [];

    let prompt = `Please review the following ${language} code from file: ${filePath}\n\n`;
    prompt += `Code:\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;

    prompt += `Review Guidelines:\n`;
    prompt += `1. Focus on security vulnerabilities, performance issues, and maintainability problems\n`;
    prompt += `2. Identify code smells, anti-patterns, and potential bugs\n`;
    prompt += `3. Suggest specific improvements with code examples when possible\n`;
    prompt += `4. Consider best practices for ${language} development\n`;
    prompt += `5. Be concise but thorough\n\n`;

    if (existingIssues.length > 0) {
      prompt += `Existing issues found by static analysis:\n`;
      for (const issue of existingIssues.slice(0, 5)) {
        prompt += `- ${issue.message} (${issue.severity})\n`;
      }
      prompt += `\nPlease provide additional insights beyond these existing issues.\n\n`;
    }

    prompt += `Format your response as a JSON array of issues. Each issue should have:\n`;
    prompt += `- line: line number (1-based)\n`;
    prompt += `- message: concise description of the issue\n`;
    prompt += `- severity: "critical", "high", "medium", "low", or "info"\n`;
    prompt += `- category: "security", "performance", "maintainability", "readability", "best_practice", "style", "bug_risk", or "complexity"\n`;
    prompt += `- suggestion: specific suggestion for improvement\n`;
    prompt += `- codeSnippet: relevant code snippet (optional)\n\n`;

    prompt += `Example response:\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "line": 10,\n`;
    prompt += `    "message": "Potential SQL injection vulnerability",\n`;
    prompt += `    "severity": "critical",\n`;
    prompt += `    "category": "security",\n`;
    prompt += `    "suggestion": "Use parameterized queries or prepared statements",\n`;
    prompt += `    "codeSnippet": "const query = \`SELECT * FROM users WHERE id = \${userId}\`;"\n`;
    prompt += `  }\n`;
    prompt += `]\n\n`;

    prompt += `Now review the code and provide your analysis:`;

    return prompt;
  }

  parseAIResponse(response, filePath, language) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;

      const issuesData = JSON.parse(jsonStr);

      if (!Array.isArray(issuesData)) {
        return [];
      }

      return issuesData.map((issueData, index) => {
        return new ReviewIssue({
          id: `ai-${Date.now()}-${index}`,
          filePath,
          line: issueData.line || 0,
          column: issueData.column || 0,
          severity: this.normalizeSeverity(issueData.severity),
          category: this.normalizeCategory(issueData.category),
          message: issueData.message || "AI-detected issue",
          description: issueData.description || issueData.message,
          suggestion: issueData.suggestion || "",
          codeSnippet: issueData.codeSnippet || "",
          ruleId: "ai-review",
          confidence: 0.7, // AI suggestions have moderate confidence
          tags: ["ai-generated", language],
          metadata: {
            source: "ai",
            model: this.config.model,
            timestamp: new Date().toISOString(),
          },
        });
      });
    } catch (error) {
      console.warn("Failed to parse AI response:", error.message);

      // Fallback: try to extract issues from text response
      return this.extractIssuesFromText(response, filePath, language);
    }
  }

  extractIssuesFromText(text, filePath, language) {
    const issues = [];
    const lines = text.split("\n");
    let currentIssue = null;

    for (const line of lines) {
      // Look for issue patterns
      const lineMatch = line.match(/line\s+(\d+)/i);
      const severityMatch = line.match(/(critical|high|medium|low|info)/i);
      const categoryMatch = line.match(
        /(security|performance|maintainability|readability|best practice|style|bug|complexity)/i,
      );

      if (lineMatch && (severityMatch || categoryMatch)) {
        // Save previous issue if exists
        if (currentIssue) {
          issues.push(new ReviewIssue(currentIssue));
        }

        // Start new issue
        currentIssue = {
          filePath,
          line: parseInt(lineMatch[1], 10),
          severity: severityMatch
            ? this.normalizeSeverity(severityMatch[1])
            : ReviewSeverity.MEDIUM,
          category: categoryMatch
            ? this.normalizeCategory(categoryMatch[1])
            : ReviewCategory.BEST_PRACTICE,
          message: line.trim(),
          ruleId: "ai-review-text",
          confidence: 0.5,
          tags: ["ai-generated", language, "text-extracted"],
        };
      } else if (currentIssue && line.trim() && !line.match(/^\s*[-*]\s*/)) {
        // Add to current issue description
        if (!currentIssue.description) {
          currentIssue.description = line.trim();
        } else if (
          !currentIssue.suggestion &&
          line.toLowerCase().includes("suggest")
        ) {
          currentIssue.suggestion = line.trim();
        }
      }
    }

    // Add the last issue
    if (currentIssue) {
      issues.push(new ReviewIssue(currentIssue));
    }

    return issues;
  }

  normalizeSeverity(severity) {
    const severityStr = String(severity).toLowerCase();
    if (severityStr.includes("critical")) return ReviewSeverity.CRITICAL;
    if (severityStr.includes("high")) return ReviewSeverity.HIGH;
    if (severityStr.includes("medium")) return ReviewSeverity.MEDIUM;
    if (severityStr.includes("low")) return ReviewSeverity.LOW;
    if (severityStr.includes("info")) return ReviewSeverity.INFO;
    return ReviewSeverity.MEDIUM;
  }

  normalizeCategory(category) {
    const categoryStr = String(category).toLowerCase();
    if (categoryStr.includes("security")) return ReviewCategory.SECURITY;
    if (categoryStr.includes("performance")) return ReviewCategory.PERFORMANCE;
    if (categoryStr.includes("maintain")) return ReviewCategory.MAINTAINABILITY;
    if (categoryStr.includes("readability")) return ReviewCategory.READABILITY;
    if (categoryStr.includes("best") || categoryStr.includes("practice"))
      return ReviewCategory.BEST_PRACTICE;
    if (categoryStr.includes("style")) return ReviewCategory.STYLE;
    if (categoryStr.includes("bug")) return ReviewCategory.BUG_RISK;
    if (categoryStr.includes("complex")) return ReviewCategory.COMPLEXITY;
    if (categoryStr.includes("test")) return ReviewCategory.TEST_COVERAGE;
    if (categoryStr.includes("doc")) return ReviewCategory.DOCUMENTATION;
    return ReviewCategory.BEST_PRACTICE;
  }

  getCacheKey(filePath, content) {
    // Simple hash for caching
    const str = filePath + content;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hits: 0, // Would need tracking for actual hits
    };
  }
}
