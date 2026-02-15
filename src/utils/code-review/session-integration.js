// Session integration for code review

import { CodeReviewer } from "./reviewer.js";
import { ReviewResult } from "./types.js";

export class SessionIntegratedReviewer {
  constructor(sessionManager, config = {}) {
    this.sessionManager = sessionManager;
    this.config = config;
    this.reviewers = new Map(); // sessionId -> CodeReviewer
  }

  async getReviewerForSession(sessionId) {
    if (this.reviewers.has(sessionId)) {
      return this.reviewers.get(sessionId);
    }

    // Get session context
    const sessionContext = this.sessionManager.activeSessions.get(sessionId);
    if (!sessionContext) {
      throw new Error(`Session not found or not active: ${sessionId}`);
    }

    // Create reviewer with session context
    const reviewer = new CodeReviewer({
      sessionId,
      projectPath: sessionContext.session.projectPath,
      fileSystem: sessionContext.fileSystem,
      aiProvider: this.config.aiProvider,
      sessionManager: this.sessionManager,
    });

    this.reviewers.set(sessionId, reviewer);
    return reviewer;
  }

  async reviewCurrentSession(options = {}) {
    const currentSessionId = this.sessionManager.currentSessionId;
    if (!currentSessionId) {
      throw new Error("No active session");
    }

    return this.reviewSession(currentSessionId, options);
  }

  async reviewSession(sessionId, options = {}) {
    const reviewer = await this.getReviewerForSession(sessionId);
    const sessionContext = this.sessionManager.activeSessions.get(sessionId);

    if (!sessionContext) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const projectPath = sessionContext.session.projectPath;

    // Perform review
    const result = await reviewer.reviewProject(projectPath, options);

    // Save review result to session
    await this.saveReviewToSession(sessionId, result);

    // Track file operations in session
    await this.trackReviewInSession(sessionContext, result);

    return result;
  }

  async saveReviewToSession(sessionId, reviewResult) {
    const sessionContext = this.sessionManager.activeSessions.get(sessionId);
    if (!sessionContext) {
      return;
    }

    // Store review result in session state
    if (!sessionContext.session.state.codeReviews) {
      sessionContext.session.state.codeReviews = [];
    }

    sessionContext.session.state.codeReviews.push({
      id: reviewResult.id,
      timestamp: reviewResult.createdAt,
      filesReviewed: reviewResult.filesReviewed,
      totalIssues: reviewResult.totalIssues,
      score: reviewResult.calculateScore(),
      summary: reviewResult.summary,
    });

    // Keep only last 10 reviews
    if (sessionContext.session.state.codeReviews.length > 10) {
      sessionContext.session.state.codeReviews =
        sessionContext.session.state.codeReviews.slice(-10);
    }

    // Save session
    await sessionContext.save();
  }

  async trackReviewInSession(sessionContext, reviewResult) {
    // Track file operations for each reviewed file
    for (const issue of reviewResult.issues) {
      if (issue.filePath) {
        await sessionContext.trackFileRead(issue.filePath);
      }
    }

    // Add review as a session activity
    sessionContext.session.addActivity({
      type: "code_review",
      timestamp: new Date().toISOString(),
      description: `Code review completed: ${reviewResult.filesReviewed} files, ${reviewResult.totalIssues} issues`,
      metadata: {
        reviewId: reviewResult.id,
        score: reviewResult.calculateScore(),
      },
    });
  }

  async getSessionReviewHistory(sessionId) {
    const sessionContext = this.sessionManager.activeSessions.get(sessionId);
    if (!sessionContext) {
      return [];
    }

    return sessionContext.session.state.codeReviews || [];
  }

  async getSessionReviewStats(sessionId) {
    const history = await this.getSessionReviewHistory(sessionId);

    if (history.length === 0) {
      return null;
    }

    const stats = {
      totalReviews: history.length,
      totalFilesReviewed: 0,
      totalIssuesFound: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 100,
      lastReview: null,
      trend: "stable",
    };

    let totalScore = 0;
    for (const review of history) {
      stats.totalFilesReviewed += review.filesReviewed;
      stats.totalIssuesFound += review.totalIssues;
      totalScore += review.score;

      if (review.score > stats.bestScore) stats.bestScore = review.score;
      if (review.score < stats.worstScore) stats.worstScore = review.score;

      if (!stats.lastReview || review.timestamp > stats.lastReview.timestamp) {
        stats.lastReview = review;
      }
    }

    stats.averageScore = totalScore / history.length;

    // Calculate trend (simple: compare last two reviews)
    if (history.length >= 2) {
      const lastTwo = history.slice(-2);
      if (lastTwo[1].score > lastTwo[0].score) {
        stats.trend = "improving";
      } else if (lastTwo[1].score < lastTwo[0].score) {
        stats.trend = "declining";
      }
    }

    return stats;
  }

  async compareSessions(sessionId1, sessionId2) {
    const stats1 = await this.getSessionReviewStats(sessionId1);
    const stats2 = await this.getSessionReviewStats(sessionId2);

    if (!stats1 || !stats2) {
      return null;
    }

    return {
      session1: {
        id: sessionId1,
        ...stats1,
      },
      session2: {
        id: sessionId2,
        ...stats2,
      },
      comparison: {
        scoreDifference: stats1.averageScore - stats2.averageScore,
        filesPerReviewDifference:
          stats1.totalFilesReviewed / stats1.totalReviews -
          stats2.totalFilesReviewed / stats2.totalReviews,
        issuesPerFileDifference:
          stats1.totalIssuesFound / stats1.totalFilesReviewed -
          stats2.totalIssuesFound / stats2.totalFilesReviewed,
      },
    };
  }

  async exportReviewResult(sessionId, reviewId, format = "json") {
    const reviewer = await this.getReviewerForSession(sessionId);
    const result = reviewer.getResult(reviewId);

    if (!result) {
      throw new Error(`Review result not found: ${reviewId}`);
    }

    const sessionContext = this.sessionManager.activeSessions.get(sessionId);
    const exportDir = sessionContext
      ? `${sessionContext.session.projectPath}/.naturecode/reviews`
      : `./reviews`;

    const fileName = `review-${reviewId}.${format}`;
    const filePath = `${exportDir}/${fileName}`;

    await reviewer.saveResult(reviewId, filePath);
    return filePath;
  }

  async importReviewResult(sessionId, filePath) {
    const reviewer = await this.getReviewerForSession(sessionId);
    const result = await reviewer.loadResult(filePath);

    // Update session ID to match current session
    result.sessionId = sessionId;

    // Save to session
    await this.saveReviewToSession(sessionId, result);

    return result;
  }

  clearSessionReviewer(sessionId) {
    this.reviewers.delete(sessionId);
  }

  clearAllReviewers() {
    this.reviewers.clear();
  }

  getActiveReviewers() {
    return Array.from(this.reviewers.keys());
  }
}
