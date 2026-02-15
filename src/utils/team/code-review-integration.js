// Integration between team collaboration and code review systems

import { TeamCodeReviewer } from "../code-review/team-reviewer.js";
import { TeamProjectManager } from "./project-manager.js";
import { TeamMemberManager } from "./member-manager.js";
import { PermissionManager } from "./permissions.js";
import fs from "fs/promises";
import path from "path";

export class TeamCodeReviewIntegration {
  constructor(config = {}) {
    this.config = {
      projectManager: config.projectManager || new TeamProjectManager(),
      memberManager: config.memberManager || new TeamMemberManager(),
      permissionManager: config.permissionManager || new PermissionManager(),
      ...config,
    };

    this.codeReviewers = new Map(); // projectId -> TeamCodeReviewer
    this.reviewSessions = new Map(); // sessionId -> ReviewSession
    this.reviewAssignments = new Map(); // assignmentId -> ReviewAssignment
  }

  async initialize() {
    try {
      await this.config.projectManager.initialize();
      await this.config.memberManager.initialize();
      await this.config.permissionManager.initialize();
      return true;
    } catch (error) {
      console.error(
        "Failed to initialize team code review integration:",
        error,
      );
      throw error;
    }
  }

  // Project-based code review

  async createProjectCodeReview(projectId, reviewConfig = {}) {
    const project = await this.config.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Check if reviewer already exists for this project
    let reviewer = this.codeReviewers.get(projectId);
    if (!reviewer) {
      reviewer = new TeamCodeReviewer({
        projectPath: reviewConfig.projectPath || process.cwd(),
        teamConfigPath: reviewConfig.teamConfigPath,
        projectId,
      });

      await reviewer.initialize();
      this.codeReviewers.set(projectId, reviewer);
    }

    return reviewer;
  }

  async reviewProjectCode(projectId, filePaths, options = {}) {
    const reviewer = await this.createProjectCodeReview(projectId, options);

    const reviewResults = await reviewer.reviewFiles(filePaths, {
      ...options,
      projectId,
    });

    // Log the review
    await this.logCodeReview(projectId, {
      action: "code:review",
      filePaths,
      results: reviewResults,
      options,
      reviewer: options.reviewerId || "system",
    });

    return reviewResults;
  }

  async reviewProjectDirectory(projectId, directoryPath, options = {}) {
    const reviewer = await this.createProjectCodeReview(projectId, options);

    const reviewResults = await reviewer.reviewDirectory(directoryPath, {
      ...options,
      projectId,
    });

    // Log the review
    await this.logCodeReview(projectId, {
      action: "directory:review",
      directoryPath,
      results: reviewResults,
      options,
      reviewer: options.reviewerId || "system",
    });

    return reviewResults;
  }

  // Team review sessions

  async createReviewSession(projectId, sessionConfig = {}) {
    const sessionId = this.generateId("review_session");

    const session = {
      id: sessionId,
      projectId,
      status: "active",
      participants: new Set(),
      files: sessionConfig.files || [],
      rules: sessionConfig.rules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: sessionConfig,
    };

    this.reviewSessions.set(sessionId, session);

    // Log session creation
    await this.logAudit({
      action: "review:session:create",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: sessionConfig.createdBy || "system",
      details: { session },
    });

    return session;
  }

  async joinReviewSession(sessionId, memberId) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {
      throw new Error(`Review session ${sessionId} not found`);
    }

    session.participants.add(memberId);
    session.updatedAt = new Date().toISOString();

    // Log session join
    await this.logAudit({
      action: "review:session:join",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: memberId,
      details: { sessionId, memberId },
    });

    return session;
  }

  async leaveReviewSession(sessionId, memberId) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {
      throw new Error(`Review session ${sessionId} not found`);
    }

    session.participants.delete(memberId);
    session.updatedAt = new Date().toISOString();

    // Log session leave
    await this.logAudit({
      action: "review:session:leave",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: memberId,
      details: { sessionId, memberId },
    });

    return session;
  }

  async addFilesToReviewSession(sessionId, filePaths, addedBy) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {
      throw new Error(`Review session ${sessionId} not found`);
    }

    session.files.push(...filePaths);
    session.updatedAt = new Date().toISOString();

    // Log file addition
    await this.logAudit({
      action: "review:session:add_files",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: addedBy,
      details: { sessionId, filePaths, addedBy },
    });

    return session;
  }

  async reviewSessionFiles(sessionId, options = {}) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {
      throw new Error(`Review session ${sessionId} not found`);
    }

    const reviewer = await this.createProjectCodeReview(
      session.projectId,
      options,
    );

    const reviewResults = await reviewer.reviewFiles(session.files, {
      ...options,
      sessionId,
      projectId: session.projectId,
    });

    // Update session with results
    session.lastReviewResults = reviewResults;
    session.lastReviewedAt = new Date().toISOString();
    session.updatedAt = new Date().toISOString();

    // Log review completion
    await this.logAudit({
      action: "review:session:complete",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: options.reviewerId || "system",
      details: { sessionId, results: reviewResults },
    });

    return reviewResults;
  }

  // Review assignments

  async createReviewAssignment(projectId, assignmentConfig = {}) {
    const assignmentId = this.generateId("review_assignment");

    const assignment = {
      id: assignmentId,
      projectId,
      assigneeId: assignmentConfig.assigneeId,
      reviewerId: assignmentConfig.reviewerId,
      files: assignmentConfig.files || [],
      rules: assignmentConfig.rules || [],
      status: "pending",
      priority: assignmentConfig.priority || "medium",
      dueDate: assignmentConfig.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: assignmentConfig,
    };

    this.reviewAssignments.set(assignmentId, assignment);

    // Log assignment creation
    await this.logAudit({
      action: "review:assignment:create",
      resourceType: "review_assignment",
      resourceId: assignmentId,
      userId: assignmentConfig.createdBy || "system",
      details: { assignment },
    });

    return assignment;
  }

  async updateReviewAssignment(assignmentId, updates) {
    const assignment = this.reviewAssignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Review assignment ${assignmentId} not found`);
    }

    Object.assign(assignment, updates, {
      updatedAt: new Date().toISOString(),
    });

    this.reviewAssignments.set(assignmentId, assignment);

    // Log assignment update
    await this.logAudit({
      action: "review:assignment:update",
      resourceType: "review_assignment",
      resourceId: assignmentId,
      userId: updates.updatedBy || "system",
      details: { assignmentId, updates },
    });

    return assignment;
  }

  async completeReviewAssignment(assignmentId, results, completedBy) {
    const assignment = this.reviewAssignments.get(assignmentId);
    if (!assignment) {
      throw new Error(`Review assignment ${assignmentId} not found`);
    }

    assignment.status = "completed";
    assignment.results = results;
    assignment.completedAt = new Date().toISOString();
    assignment.completedBy = completedBy;
    assignment.updatedAt = new Date().toISOString();

    this.reviewAssignments.set(assignmentId, assignment);

    // Log assignment completion
    await this.logAudit({
      action: "review:assignment:complete",
      resourceType: "review_assignment",
      resourceId: assignmentId,
      userId: completedBy,
      details: { assignmentId, results },
    });

    return assignment;
  }

  async getReviewAssignmentsForMember(memberId, filters = {}) {
    const assignments = Array.from(this.reviewAssignments.values());

    let filtered = assignments.filter((assignment) => {
      if (filters.assigneeId && assignment.assigneeId !== filters.assigneeId) {
        return false;
      }
      if (filters.reviewerId && assignment.reviewerId !== filters.reviewerId) {
        return false;
      }
      if (filters.projectId && assignment.projectId !== filters.projectId) {
        return false;
      }
      if (filters.status && assignment.status !== filters.status) {
        return false;
      }
      return true;
    });

    // Sort by priority and due date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return filtered;
  }

  // Team standards integration

  async getProjectTeamStandards(projectId) {
    const project = await this.config.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const reviewer = await this.createProjectCodeReview(projectId);
    const teamStandards = reviewer.teamStandards;

    return {
      enabledRules: teamStandards.getEnabledRules(),
      disabledRules: teamStandards.getDisabledRules(),
      thresholds: teamStandards.getThresholds(),
      namingConventions: teamStandards.getNamingConventions(),
      codeStyle: teamStandards.getCodeStyle(),
      configPath: teamStandards.teamConfigPath,
      configLoaded: reviewer.teamConfigLoaded,
    };
  }

  async updateProjectTeamStandards(projectId, standardsUpdate, updatedBy) {
    const project = await this.config.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Update project settings
    const updated = await this.config.projectManager.updateProject(projectId, {
      settings: {
        ...project.settings,
        teamStandards: standardsUpdate,
      },
    });

    if (!updated) {
      throw new Error("Failed to update project team standards");
    }

    // Log standards update
    await this.logAudit({
      action: "team:standards:update",
      resourceType: "project",
      resourceId: projectId,
      userId: updatedBy,
      details: { projectId, standardsUpdate },
    });

    // Refresh code reviewer for this project
    this.codeReviewers.delete(projectId);

    return true;
  }

  // Collaborative code review

  async startCollaborativeReview(projectId, reviewConfig = {}) {
    const session = await this.createReviewSession(projectId, reviewConfig);

    // Create a collaboration room for the review session
    const roomId = `review_${session.id}`;

    const collaborativeReview = {
      sessionId: session.id,
      projectId,
      roomId,
      status: "active",
      participants: Array.from(session.participants),
      files: session.files,
      createdAt: new Date().toISOString(),
    };

    // Log collaborative review start
    await this.logAudit({
      action: "review:collaborative:start",
      resourceType: "review_session",
      resourceId: session.id,
      userId: reviewConfig.createdBy || "system",
      details: { collaborativeReview },
    });

    return collaborativeReview;
  }

  async addCommentToReview(
    sessionId,
    filePath,
    lineNumber,
    comment,
    commenterId,
  ) {
    const session = this.reviewSessions.get(sessionId);
    if (!session) {
      throw new Error(`Review session ${sessionId} not found`);
    }

    const commentId = this.generateId("comment");
    const reviewComment = {
      id: commentId,
      sessionId,
      filePath,
      lineNumber,
      comment,
      commenterId,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    if (!session.comments) {
      session.comments = [];
    }

    session.comments.push(reviewComment);
    session.updatedAt = new Date().toISOString();

    // Log comment addition
    await this.logAudit({
      action: "review:comment:add",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: commenterId,
      details: { reviewComment },
    });

    return reviewComment;
  }

  async resolveReviewComment(sessionId, commentId, resolvedBy) {
    const session = this.reviewSessions.get(sessionId);
    if (!session || !session.comments) {
      throw new Error(`Review session ${sessionId} or comment not found`);
    }

    const comment = session.comments.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    comment.resolved = true;
    comment.resolvedAt = new Date().toISOString();
    comment.resolvedBy = resolvedBy;
    session.updatedAt = new Date().toISOString();

    // Log comment resolution
    await this.logAudit({
      action: "review:comment:resolve",
      resourceType: "review_session",
      resourceId: sessionId,
      userId: resolvedBy,
      details: { commentId, resolvedBy },
    });

    return comment;
  }

  // Analytics and reporting

  async getProjectReviewAnalytics(projectId, timeframe = "30d") {
    const project = await this.config.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get review sessions for this project
    const sessions = Array.from(this.reviewSessions.values()).filter(
      (session) => session.projectId === projectId,
    );

    // Get review assignments for this project
    const assignments = Array.from(this.reviewAssignments.values()).filter(
      (assignment) => assignment.projectId === projectId,
    );

    // Calculate analytics
    const analytics = {
      projectId,
      timeframe,
      totalSessions: sessions.length,
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter((a) => a.status === "completed")
        .length,
      pendingAssignments: assignments.filter((a) => a.status === "pending")
        .length,
      activeSessions: sessions.filter((s) => s.status === "active").length,
      totalParticipants: new Set(
        sessions.flatMap((s) => Array.from(s.participants)),
      ).size,
      averageReviewTime: this.calculateAverageReviewTime(assignments),
      issueBreakdown: this.calculateIssueBreakdown(sessions),
      memberActivity: this.calculateMemberActivity(sessions, assignments),
      generatedAt: new Date().toISOString(),
    };

    return analytics;
  }

  calculateAverageReviewTime(assignments) {
    const completedAssignments = assignments.filter(
      (a) => a.status === "completed" && a.completedAt && a.createdAt,
    );

    if (completedAssignments.length === 0) {
      return 0;
    }

    const totalTime = completedAssignments.reduce((sum, assignment) => {
      const created = new Date(assignment.createdAt);
      const completed = new Date(assignment.completedAt);
      return sum + (completed - created);
    }, 0);

    return totalTime / completedAssignments.length / 1000; // Convert to seconds
  }

  calculateIssueBreakdown(sessions) {
    const breakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    sessions.forEach((session) => {
      if (session.lastReviewResults && session.lastReviewResults.issues) {
        session.lastReviewResults.issues.forEach((issue) => {
          if (breakdown[issue.severity] !== undefined) {
            breakdown[issue.severity]++;
          }
        });
      }
    });

    return breakdown;
  }

  calculateMemberActivity(sessions, assignments) {
    const memberActivity = {};

    // Count session participation
    sessions.forEach((session) => {
      session.participants.forEach((memberId) => {
        if (!memberActivity[memberId]) {
          memberActivity[memberId] = {
            sessions: 0,
            assignments: 0,
            comments: 0,
            resolvedIssues: 0,
          };
        }
        memberActivity[memberId].sessions++;
      });

      // Count comments
      if (session.comments) {
        session.comments.forEach((comment) => {
          if (!memberActivity[comment.commenterId]) {
            memberActivity[comment.commenterId] = {
              sessions: 0,
              assignments: 0,
              comments: 0,
              resolvedIssues: 0,
            };
          }
          memberActivity[comment.commenterId].comments++;

          if (comment.resolved && comment.resolvedBy) {
            if (!memberActivity[comment.resolvedBy]) {
              memberActivity[comment.resolvedBy] = {
                sessions: 0,
                assignments: 0,
                comments: 0,
                resolvedIssues: 0,
              };
            }
            memberActivity[comment.resolvedBy].resolvedIssues++;
          }
        });
      }
    });

    // Count assignments
    assignments.forEach((assignment) => {
      if (assignment.assigneeId) {
        if (!memberActivity[assignment.assigneeId]) {
          memberActivity[assignment.assigneeId] = {
            sessions: 0,
            assignments: 0,
            comments: 0,
            resolvedIssues: 0,
          };
        }
        memberActivity[assignment.assigneeId].assignments++;
      }

      if (assignment.reviewerId) {
        if (!memberActivity[assignment.reviewerId]) {
          memberActivity[assignment.reviewerId] = {
            sessions: 0,
            assignments: 0,
            comments: 0,
            resolvedIssues: 0,
          };
        }
        memberActivity[assignment.reviewerId].assignments++;
      }
    });

    return memberActivity;
  }

  // Utility methods

  generateId(prefix) {
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${random}`;
  }

  async logAudit(logData) {
    try {
      await this.config.permissionManager.logAudit(logData);
    } catch (error) {
      console.error("Failed to log audit:", error);
      // Don't throw - audit logging should not break the application
    }
  }

  async logCodeReview(projectId, reviewData) {
    await this.logAudit({
      action: reviewData.action,
      resourceType: "code_review",
      resourceId: projectId,
      userId: reviewData.reviewer,
      details: reviewData,
    });
  }

  // Cleanup

  async cleanupOldSessions(maxAgeDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let cleanedCount = 0;

    // Clean up old review sessions
    for (const [sessionId, session] of this.reviewSessions) {
      const sessionDate = new Date(session.createdAt);
      if (sessionDate < cutoffDate && session.status !== "active") {
        this.reviewSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    // Clean up old review assignments
    for (const [assignmentId, assignment] of this.reviewAssignments) {
      const assignmentDate = new Date(assignment.createdAt);
      if (assignmentDate < cutoffDate && assignment.status === "completed") {
        this.reviewAssignments.delete(assignmentId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}
