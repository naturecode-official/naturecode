// Team project management system

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export class TeamProjectManager {
  constructor(config = {}) {
    this.config = {
      projectsDir: ".naturecode/team/projects",
      membersDir: ".naturecode/team/members",
      templatesDir: ".naturecode/team/templates",
      ...config,
    };

    this.projects = new Map(); // projectId -> Project
    this.members = new Map(); // memberId -> Member
    this.templates = new Map(); // templateId -> Template
  }

  async initialize() {
    // Ensure directories exist
    await fs.mkdir(this.config.projectsDir, { recursive: true });
    await fs.mkdir(this.config.membersDir, { recursive: true });
    await fs.mkdir(this.config.templatesDir, { recursive: true });

    // Load existing data
    await this.loadProjects();
    await this.loadMembers();
    await this.loadTemplates();

    return true;
  }

  // Project Management

  async createProject(data) {
    const projectId = this.generateId("proj");
    const now = new Date().toISOString();

    const project = {
      id: projectId,
      name: data.name,
      description: data.description || "",
      ownerId: data.ownerId,
      teamId: data.teamId,
      status: "active",
      visibility: data.visibility || "private",
      tags: data.tags || [],
      settings: {
        codeReviewEnabled: true,
        autoCodeReview: false,
        teamStandards: data.teamStandards || {},
        notifications: {
          onTaskAssignment: true,
          onCodeReview: true,
          onStatusChange: true,
        },
        ...data.settings,
      },
      members: [
        {
          memberId: data.ownerId,
          role: "owner",
          joinedAt: now,
          permissions: this.getRolePermissions("owner"),
        },
      ],
      tasks: [],
      milestones: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    // Create project directory
    const projectDir = path.join(this.config.projectsDir, projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Save project data
    await this.saveProject(project);
    this.projects.set(projectId, project);

    return project;
  }

  async updateProject(projectId, updates) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Apply updates
    Object.assign(project, updates, {
      updatedAt: new Date().toISOString(),
      version: project.version + 1,
    });

    await this.saveProject(project);
    return project;
  }

  async deleteProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Archive instead of delete
    project.status = "archived";
    project.updatedAt = new Date().toISOString();

    await this.saveProject(project);
    return project;
  }

  async getProject(projectId) {
    return this.projects.get(projectId);
  }

  async listProjects(filter = {}) {
    let projects = Array.from(this.projects.values());

    // Apply filters
    if (filter.teamId) {
      projects = projects.filter((p) => p.teamId === filter.teamId);
    }

    if (filter.status) {
      projects = projects.filter((p) => p.status === filter.status);
    }

    if (filter.visibility) {
      projects = projects.filter((p) => p.visibility === filter.visibility);
    }

    if (filter.memberId) {
      projects = projects.filter((p) =>
        p.members.some((m) => m.memberId === filter.memberId),
      );
    }

    // Sort by updated date (newest first)
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return projects;
  }

  // Member Management

  async addMemberToProject(projectId, memberData) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Check if member already exists
    const existingMember = project.members.find(
      (m) => m.memberId === memberData.memberId,
    );
    if (existingMember) {
      throw new Error(`Member ${memberData.memberId} already in project`);
    }

    const member = {
      memberId: memberData.memberId,
      role: memberData.role || "member",
      joinedAt: new Date().toISOString(),
      permissions: this.getRolePermissions(memberData.role || "member"),
    };

    project.members.push(member);
    project.updatedAt = new Date().toISOString();

    await this.saveProject(project);

    // Send notification if enabled
    if (project.settings.notifications.onMemberJoin) {
      await this.sendNotification({
        type: "member_joined",
        projectId,
        memberId: memberData.memberId,
        role: member.role,
      });
    }

    return member;
  }

  async updateMemberRole(projectId, memberId, newRole) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const member = project.members.find((m) => m.memberId === memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found in project`);
    }

    const oldRole = member.role;
    member.role = newRole;
    member.permissions = this.getRolePermissions(newRole);
    project.updatedAt = new Date().toISOString();

    await this.saveProject(project);

    // Send notification
    await this.sendNotification({
      type: "role_changed",
      projectId,
      memberId,
      oldRole,
      newRole,
    });

    return member;
  }

  async removeMemberFromProject(projectId, memberId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Cannot remove owner
    const memberIndex = project.members.findIndex(
      (m) => m.memberId === memberId,
    );
    if (memberIndex === -1) {
      throw new Error(`Member ${memberId} not found in project`);
    }

    if (project.members[memberIndex].role === "owner") {
      throw new Error("Cannot remove project owner");
    }

    project.members.splice(memberIndex, 1);
    project.updatedAt = new Date().toISOString();

    await this.saveProject(project);

    // Send notification
    await this.sendNotification({
      type: "member_removed",
      projectId,
      memberId,
    });

    return true;
  }

  // Task Management

  async createTask(projectId, taskData) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const taskId = this.generateId("task");
    const now = new Date().toISOString();

    const task = {
      id: taskId,
      projectId,
      title: taskData.title,
      description: taskData.description || "",
      type: taskData.type || "task",
      status: "todo",
      priority: taskData.priority || "medium",
      assigneeId: taskData.assigneeId || null,
      reporterId: taskData.reporterId,
      tags: taskData.tags || [],
      dueDate: taskData.dueDate || null,
      estimatedHours: taskData.estimatedHours || null,
      actualHours: 0,
      dependencies: taskData.dependencies || [],
      attachments: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    project.tasks.push(task);
    project.updatedAt = now;

    await this.saveProject(project);

    // Send notification if assigned
    if (task.assigneeId && project.settings.notifications.onTaskAssignment) {
      await this.sendNotification({
        type: "task_assigned",
        projectId,
        taskId,
        assigneeId: task.assigneeId,
        reporterId: task.reporterId,
      });
    }

    return task;
  }

  async updateTask(projectId, taskId, updates) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const oldStatus = task.status;
    const oldAssignee = task.assigneeId;

    Object.assign(task, updates, {
      updatedAt: new Date().toISOString(),
      version: task.version + 1,
    });

    project.updatedAt = new Date().toISOString();

    await this.saveProject(project);

    // Send notifications for important changes
    if (updates.status && updates.status !== oldStatus) {
      await this.sendNotification({
        type: "task_status_changed",
        projectId,
        taskId,
        oldStatus,
        newStatus: updates.status,
        changedBy: updates.updatedBy || task.reporterId,
      });
    }

    if (updates.assigneeId && updates.assigneeId !== oldAssignee) {
      await this.sendNotification({
        type: "task_reassigned",
        projectId,
        taskId,
        oldAssignee,
        newAssignee: updates.assigneeId,
        changedBy: updates.updatedBy || task.reporterId,
      });
    }

    return task;
  }

  async addTaskComment(projectId, taskId, commentData) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const commentId = this.generateId("cmt");
    const now = new Date().toISOString();

    const comment = {
      id: commentId,
      taskId,
      authorId: commentData.authorId,
      content: commentData.content,
      type: commentData.type || "comment",
      attachments: commentData.attachments || [],
      createdAt: now,
      updatedAt: now,
    };

    task.comments.push(comment);
    task.updatedAt = now;
    project.updatedAt = now;

    await this.saveProject(project);

    // Send notification
    await this.sendNotification({
      type: "task_comment",
      projectId,
      taskId,
      commentId,
      authorId: commentData.authorId,
      mentionedUsers: this.extractMentions(commentData.content),
    });

    return comment;
  }

  // Milestone Management

  async createMilestone(projectId, milestoneData) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const milestoneId = this.generateId("milestone");
    const now = new Date().toISOString();

    const milestone = {
      id: milestoneId,
      projectId,
      title: milestoneData.title,
      description: milestoneData.description || "",
      status: "planned",
      dueDate: milestoneData.dueDate || null,
      tasks: [], // Task IDs
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    project.milestones.push(milestone);
    project.updatedAt = now;

    await this.saveProject(project);
    return milestone;
  }

  async updateMilestoneProgress(projectId, milestoneId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const milestone = project.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    // Calculate progress based on tasks
    const milestoneTasks = project.tasks.filter((t) =>
      milestone.tasks.includes(t.id),
    );

    if (milestoneTasks.length === 0) {
      milestone.progress = 0;
    } else {
      const completedTasks = milestoneTasks.filter(
        (t) => t.status === "done" || t.status === "closed",
      ).length;

      milestone.progress = Math.round(
        (completedTasks / milestoneTasks.length) * 100,
      );
    }

    milestone.updatedAt = new Date().toISOString();
    project.updatedAt = milestone.updatedAt;

    await this.saveProject(project);

    // Check if milestone is completed
    if (milestone.progress === 100 && milestone.status !== "completed") {
      milestone.status = "completed";
      await this.sendNotification({
        type: "milestone_completed",
        projectId,
        milestoneId,
      });
    }

    return milestone;
  }

  // Template Management

  async createProjectTemplate(templateData) {
    const templateId = this.generateId("tpl");
    const now = new Date().toISOString();

    const template = {
      id: templateId,
      name: templateData.name,
      description: templateData.description || "",
      category: templateData.category || "general",
      tags: templateData.tags || [],
      settings: templateData.settings || {},
      structure: templateData.structure || {},
      files: templateData.files || [],
      configs: templateData.configs || {},
      createdBy: templateData.createdBy,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isPublic: templateData.isPublic || false,
    };

    await this.saveTemplate(template);
    this.templates.set(templateId, template);

    return template;
  }

  async createProjectFromTemplate(templateId, projectData) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Merge template settings with project data
    const mergedData = {
      ...template.settings,
      ...projectData,
      settings: {
        ...template.settings,
        ...projectData.settings,
      },
    };

    // Create project
    const project = await this.createProject(mergedData);

    // Apply template structure
    await this.applyTemplateStructure(project.id, template);

    // Update template usage count
    template.usageCount++;
    template.updatedAt = new Date().toISOString();
    await this.saveTemplate(template);

    return project;
  }

  // Analytics and Reporting

  async getProjectAnalytics(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Task analytics
    const tasks = project.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === "done" || t.status === "closed",
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "in_progress",
    ).length;
    const todoTasks = tasks.filter((t) => t.status === "todo").length;

    // Member activity
    const memberActivity = {};
    const recentActivities = [];

    // Calculate completion rate
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Burndown data (last 30 days)
    const burndownData = this.calculateBurndownData(
      project,
      thirtyDaysAgo,
      now,
    );

    return {
      projectId,
      timestamp: now.toISOString(),
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        completionRate,
        byPriority: this.groupByPriority(tasks),
        byType: this.groupByType(tasks),
      },
      milestones: {
        total: project.milestones.length,
        completed: project.milestones.filter((m) => m.status === "completed")
          .length,
        inProgress: project.milestones.filter((m) => m.status === "in_progress")
          .length,
        averageProgress: this.calculateAverageProgress(project.milestones),
      },
      activity: {
        recentActivities,
        memberActivity,
      },
      burndown: burndownData,
      recommendations: this.generateRecommendations(project),
    };
  }

  // Utility Methods

  generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  getRolePermissions(role) {
    const permissions = {
      owner: {
        canManageProject: true,
        canManageMembers: true,
        canManageTasks: true,
        canManageMilestones: true,
        canEditSettings: true,
        canDeleteProject: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canAssignTasks: true,
        canReviewCode: true,
        canMergeCode: true,
      },
      admin: {
        canManageProject: true,
        canManageMembers: true,
        canManageTasks: true,
        canManageMilestones: true,
        canEditSettings: true,
        canDeleteProject: false,
        canInviteMembers: true,
        canRemoveMembers: true,
        canAssignTasks: true,
        canReviewCode: true,
        canMergeCode: true,
      },
      member: {
        canManageProject: false,
        canManageMembers: false,
        canManageTasks: false,
        canManageMilestones: false,
        canEditSettings: false,
        canDeleteProject: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canAssignTasks: false,
        canReviewCode: true,
        canMergeCode: false,
      },
      viewer: {
        canManageProject: false,
        canManageMembers: false,
        canManageTasks: false,
        canManageMilestones: false,
        canEditSettings: false,
        canDeleteProject: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canAssignTasks: false,
        canReviewCode: false,
        canMergeCode: false,
      },
    };

    return permissions[role] || permissions.member;
  }

  extractMentions(content) {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  calculateBurndownData(project, startDate, endDate) {
    // Simplified burndown calculation
    const data = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const tasksOnDate = project.tasks.filter((t) => {
        const taskDate = new Date(t.createdAt).toISOString().split("T")[0];
        return taskDate <= dateStr;
      });

      const completedOnDate = tasksOnDate.filter((t) => {
        if (!t.updatedAt) return false;
        const updateDate = new Date(t.updatedAt).toISOString().split("T")[0];
        return (
          updateDate === dateStr &&
          (t.status === "done" || t.status === "closed")
        );
      }).length;

      data.push({
        date: dateStr,
        totalTasks: tasksOnDate.length,
        completedTasks: tasksOnDate.filter(
          (t) => t.status === "done" || t.status === "closed",
        ).length,
        completedToday: completedOnDate,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  groupByPriority(tasks) {
    const groups = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    tasks.forEach((task) => {
      if (groups[task.priority] !== undefined) {
        groups[task.priority]++;
      }
    });

    return groups;
  }

  groupByType(tasks) {
    const groups = {};

    tasks.forEach((task) => {
      if (!groups[task.type]) {
        groups[task.type] = 0;
      }
      groups[task.type]++;
    });

    return groups;
  }

  calculateAverageProgress(milestones) {
    if (milestones.length === 0) return 0;

    const totalProgress = milestones.reduce(
      (sum, m) => sum + (m.progress || 0),
      0,
    );
    return Math.round(totalProgress / milestones.length);
  }

  generateRecommendations(project) {
    const recommendations = [];

    // Check for overdue tasks
    const overdueTasks = project.tasks.filter((t) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return (
        dueDate < new Date() && t.status !== "done" && t.status !== "closed"
      );
    });

    if (overdueTasks.length > 0) {
      recommendations.push({
        type: "overdue_tasks",
        severity: "high",
        message: `${overdueTasks.length} tasks are overdue`,
        action: "Review and update due dates or task status",
      });
    }

    // Check for unassigned tasks
    const unassignedTasks = project.tasks.filter(
      (t) => !t.assigneeId && t.status !== "done" && t.status !== "closed",
    );

    if (unassignedTasks.length > 0) {
      recommendations.push({
        type: "unassigned_tasks",
        severity: "medium",
        message: `${unassignedTasks.length} tasks are unassigned`,
        action: "Assign team members to these tasks",
      });
    }

    // Check for stagnant tasks
    const stagnantTasks = project.tasks.filter((t) => {
      if (t.status === "done" || t.status === "closed") return false;

      const updatedAt = new Date(t.updatedAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return updatedAt < thirtyDaysAgo;
    });

    if (stagnantTasks.length > 0) {
      recommendations.push({
        type: "stagnant_tasks",
        severity: "medium",
        message: `${stagnantTasks.length} tasks haven't been updated in 30+ days`,
        action: "Review and update or close these tasks",
      });
    }

    return recommendations;
  }

  async sendNotification(notification) {
    // In a real implementation, this would send notifications via email, Slack, etc.
    // For now, we'll just log it
    console.log("Notification:", notification);

    // Save notification for later retrieval
    const notificationId = this.generateId("notif");
    const fullNotification = {
      id: notificationId,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const notificationPath = path.join(
      this.config.projectsDir,
      "notifications",
      `${notificationId}.json`,
    );
    await fs.mkdir(path.dirname(notificationPath), { recursive: true });
    await fs.writeFile(
      notificationPath,
      JSON.stringify(fullNotification, null, 2),
    );

    return fullNotification;
  }

  async applyTemplateStructure(projectId, template) {
    // Apply template files and configurations
    // This would create directory structure, files, etc.
    // For now, just update project settings
    const project = this.projects.get(projectId);
    if (!project) return;

    // Merge template configs
    project.settings = {
      ...template.settings,
      ...project.settings,
    };

    await this.saveProject(project);
  }

  // Data Persistence

  async loadProjects() {
    try {
      const files = await fs.readdir(this.config.projectsDir);

      for (const file of files) {
        if (file.endsWith(".json") && !file.startsWith(".")) {
          const filePath = path.join(this.config.projectsDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const project = JSON.parse(content);

          // Validate project structure
          if (project.id && project.name) {
            this.projects.set(project.id, project);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load projects:", error.message);
    }
  }

  async loadMembers() {
    try {
      const files = await fs.readdir(this.config.membersDir);

      for (const file of files) {
        if (file.endsWith(".json") && !file.startsWith(".")) {
          const filePath = path.join(this.config.membersDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const member = JSON.parse(content);

          if (member.id && member.name) {
            this.members.set(member.id, member);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load members:", error.message);
    }
  }

  async loadTemplates() {
    try {
      const files = await fs.readdir(this.config.templatesDir);

      for (const file of files) {
        if (file.endsWith(".json") && !file.startsWith(".")) {
          const filePath = path.join(this.config.templatesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const template = JSON.parse(content);

          if (template.id && template.name) {
            this.templates.set(template.id, template);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load templates:", error.message);
    }
  }

  async saveProject(project) {
    const filePath = path.join(this.config.projectsDir, `${project.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2));
  }

  async saveTemplate(template) {
    const filePath = path.join(this.config.templatesDir, `${template.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));
  }

  async exportProjectData(projectId, format = "json") {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const exportData = {
      project,
      analytics: await this.getProjectAnalytics(projectId),
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
    };

    switch (format.toLowerCase()) {
      case "json":
        return JSON.stringify(exportData, null, 2);

      case "markdown":
        return this.formatProjectAsMarkdown(exportData);

      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  formatProjectAsMarkdown(data) {
    const { project, analytics } = data;

    let markdown = `# Project: ${project.name}\n\n`;
    markdown += `**ID**: ${project.id}\n`;
    markdown += `**Status**: ${project.status}\n`;
    markdown += `**Visibility**: ${project.visibility}\n`;
    markdown += `**Created**: ${new Date(project.createdAt).toLocaleDateString()}\n`;
    markdown += `**Last Updated**: ${new Date(project.updatedAt).toLocaleDateString()}\n\n`;

    if (project.description) {
      markdown += `## Description\n\n${project.description}\n\n`;
    }

    markdown += `## Team Members (${project.members.length})\n\n`;
    project.members.forEach((member) => {
      markdown += `- **${member.memberId}** (${member.role}) - Joined: ${new Date(member.joinedAt).toLocaleDateString()}\n`;
    });

    markdown += `\n## Tasks (${analytics.tasks.total})\n\n`;
    markdown += `- **Completed**: ${analytics.tasks.completed}\n`;
    markdown += `- **In Progress**: ${analytics.tasks.inProgress}\n`;
    markdown += `- **To Do**: ${analytics.tasks.todo}\n`;
    markdown += `- **Completion Rate**: ${analytics.tasks.completionRate}%\n\n`;

    markdown += `## Milestones (${analytics.milestones.total})\n\n`;
    markdown += `- **Completed**: ${analytics.milestones.completed}\n`;
    markdown += `- **In Progress**: ${analytics.milestones.inProgress}\n`;
    markdown += `- **Average Progress**: ${analytics.milestones.averageProgress}%\n\n`;

    if (analytics.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      analytics.recommendations.forEach((rec) => {
        markdown += `- **${rec.severity.toUpperCase()}**: ${rec.message}\n`;
        markdown += `  - *Action*: ${rec.action}\n`;
      });
    }

    markdown += `\n---\n`;
    markdown += `*Exported on ${new Date(data.exportDate).toLocaleString()}*\n`;

    return markdown;
  }
}
