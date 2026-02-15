// Team collaboration command handler

import { TeamProjectManager } from "./project-manager.js";
import { TeamMemberManager } from "./member-manager.js";

export class TeamCommandHandler {
  constructor(config = {}) {
    this.config = config;

    // 如果直接传递了管理器实例，使用它们
    if (config.projectManager && typeof config.projectManager === "object") {
      this.projectManager = config.projectManager;
    } else {
      this.projectManager = new TeamProjectManager(config.projectManager);
    }

    if (config.memberManager && typeof config.memberManager === "object") {
      this.memberManager = config.memberManager;
    } else {
      this.memberManager = new TeamMemberManager(config.memberManager);
    }

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      await this.projectManager.initialize();
      await this.memberManager.initialize();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize team command handler:", error);
      return false;
    }
  }

  async handleCommand(command, args = {}) {
    await this.initialize();

    const commandMap = {
      // Project commands
      "project:create": this.handleCreateProject.bind(this),
      "project:list": this.handleListProjects.bind(this),
      "project:info": this.handleProjectInfo.bind(this),
      "project:update": this.handleUpdateProject.bind(this),
      "project:delete": this.handleDeleteProject.bind(this),
      "project:add-member": this.handleAddMemberToProject.bind(this),
      "project:remove-member": this.handleRemoveMemberFromProject.bind(this),

      // Task commands
      "task:create": this.handleCreateTask.bind(this),
      "task:update": this.handleUpdateTask.bind(this),
      "task:list": this.handleListTasks.bind(this),
      "task:info": this.handleTaskInfo.bind(this),
      "task:delete": this.handleDeleteTask.bind(this),

      // Member commands
      "member:register": this.handleRegisterMember.bind(this),
      "member:authenticate": this.handleAuthenticate.bind(this),
      "member:list": this.handleListMembers.bind(this),
      "member:info": this.handleMemberInfo.bind(this),
      "member:update": this.handleUpdateMember.bind(this),
      "member:change-password": this.handleChangePassword.bind(this),

      // Team commands
      "team:create": this.handleCreateTeam.bind(this),
      "team:list": this.handleListTeams.bind(this),
      "team:info": this.handleTeamInfo.bind(this),
      "team:invite": this.handleInviteToTeam.bind(this),
      "team:accept-invitation": this.handleAcceptInvitation.bind(this),
      "team:reject-invitation": this.handleRejectInvitation.bind(this),

      // Template commands
      "template:create": this.handleCreateTemplate.bind(this),
      "template:create-project": this.handleCreateFromTemplate.bind(this),

      // Analytics commands
      "analytics:project": this.handleProjectAnalytics.bind(this),
      "analytics:member": this.handleMemberAnalytics.bind(this),
      "analytics:team": this.handleTeamAnalytics.bind(this),
      "analytics:system": this.handleSystemAnalytics.bind(this),

      // Export commands
      "export:project": this.handleExportProject.bind(this),
      "export:member": this.handleExportMember.bind(this),

      // Utility commands
      search: this.handleSearch.bind(this),
      dashboard: this.handleDashboard.bind(this),
      help: this.handleHelp.bind(this),
    };

    const handler = commandMap[command];
    if (!handler) {
      return {
        success: false,
        error: `Unknown command: ${command}`,
      };
    }

    try {
      return await handler(args);
    } catch (error) {
      return {
        success: false,
        error: error.message || "Command execution failed",
      };
    }
  }

  // Project Commands

  async handleCreateProject(args) {
    await this.initialize();

    const { name, description, ownerId, teamId, visibility = "private" } = args;

    if (!name || !ownerId) {
      throw new Error("Project name and owner ID are required");
    }

    const project = await this.projectManager.createProject({
      name,
      description,
      ownerId,
      teamId,
      visibility,
    });

    return {
      success: true,
      message: `Project "${name}" created successfully`,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
      },
    };
  }

  async handleListProjects(args) {
    await this.initialize();

    const { teamId, status, visibility, memberId } = args;
    const filter = {};

    if (teamId) filter.teamId = teamId;
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;
    if (memberId) filter.memberId = memberId;

    const projects = await this.projectManager.listProjects(filter);

    return {
      success: true,
      count: projects.length,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        visibility: p.visibility,
        members: p.members.length,
        tasks: p.tasks.length,
        milestones: p.milestones.length,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }

  async handleProjectInfo(args) {
    await this.initialize();

    const { projectId } = args;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const project = await this.projectManager.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const analytics = await this.projectManager.getProjectAnalytics(projectId);

    return {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        ownerId: project.ownerId,
        teamId: project.teamId,
        tags: project.tags,
        settings: project.settings,
        members: project.members.map((m) => ({
          memberId: m.memberId,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        tasks: project.tasks.length,
        milestones: project.milestones.length,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        version: project.version,
      },
      analytics,
    };
  }

  async handleUpdateProject(args) {
    await this.initialize();

    const { projectId, name, description, status, visibility, tags } = args;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (visibility !== undefined) updates.visibility = visibility;
    if (tags !== undefined) updates.tags = tags;

    const updated = await this.projectManager.updateProject(projectId, updates);
    if (!updated) {
      throw new Error(`Project ${projectId} not found`);
    }

    return {
      success: true,
      message: `Project "${updated.name}" updated successfully`,
      project: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        visibility: updated.visibility,
        tags: updated.tags,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async handleDeleteProject(args) {
    await this.initialize();

    const { projectId } = args;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const deleted = await this.projectManager.deleteProject(projectId);
    if (!deleted) {
      throw new Error(`Project ${projectId} not found`);
    }

    return {
      success: true,
      message: `Project "${deleted.name}" deleted successfully`,
    };
  }

  async handleAddMemberToProject(args) {
    await this.initialize();

    const { projectId, memberId, role = "member" } = args;

    if (!projectId || !memberId) {
      throw new Error("Project ID and member ID are required");
    }

    const member = await this.memberManager.addMemberToProject(projectId, {
      memberId,
      role,
    });

    return {
      success: true,
      message: `Member ${memberId} added to project`,
      member: {
        memberId: member.memberId,
        role: member.role,
        joinedAt: member.joinedAt,
      },
    };
  }

  async handleRemoveMemberFromProject(args) {
    await this.initialize();

    const { projectId, memberId } = args;

    if (!projectId || !memberId) {
      throw new Error("Project ID and member ID are required");
    }

    const removed = await this.projectManager.removeMemberFromProject(
      projectId,
      memberId,
    );

    return {
      success: true,
      message: `Member ${memberId} removed from project`,
    };
  }

  // Task Commands

  async handleCreateTask(args) {
    await this.initialize();

    const {
      projectId,
      title,
      description,
      type = "task",
      priority = "medium",
      assigneeId,
      reporterId,
      dueDate,
    } = args;

    if (!projectId || !title || !reporterId) {
      throw new Error("Project ID, title, and reporter ID are required");
    }

    const task = await this.projectManager.createTask(projectId, {
      title,
      description,
      type,
      priority,
      assigneeId,
      reporterId,
      dueDate,
    });

    return {
      success: true,
      message: `Task "${title}" created successfully`,
      task: {
        id: task.id,
        title: task.title,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        reporterId: task.reporterId,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      },
    };
  }

  async handleUpdateTask(args) {
    await this.initialize();

    const { projectId, taskId, updates } = args;

    if (!projectId || !taskId || !updates) {
      throw new Error("Project ID, task ID, and updates are required");
    }

    const task = await this.projectManager.updateTask(
      projectId,
      taskId,
      updates,
    );

    return {
      success: true,
      message: `Task ${taskId} updated successfully`,
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        updatedAt: task.updatedAt,
      },
    };
  }

  async handleListTasks(args) {
    await this.initialize();

    const { projectId, status, priority, assigneeId } = args;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;

    const tasks = await this.projectManager.listTasks(filter);

    return {
      success: true,
      count: tasks.length,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        reporterId: t.reporterId,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  }

  async handleTaskInfo(args) {
    await this.initialize();

    const { taskId } = args;

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    const task = await this.projectManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    return {
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        reporterId: task.reporterId,
        dueDate: task.dueDate,
        tags: task.tags,
        comments: task.comments.length,
        attachments: task.attachments.length,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    };
  }

  async handleDeleteTask(args) {
    await this.initialize();

    const { taskId } = args;

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    const deleted = await this.projectManager.deleteTask(taskId);
    if (!deleted) {
      throw new Error(`Task ${taskId} not found`);
    }

    return {
      success: true,
      message: `Task "${deleted.title}" deleted successfully`,
    };
  }

  // Member Commands

  async handleRegisterMember(args) {
    await this.initialize();

    const { email, name, displayName, password } = args;

    if (!email || !name || !password) {
      throw new Error("Email, name, and password are required");
    }

    const member = await this.memberManager.registerMember({
      email,
      name,
      displayName,
      password,
    });

    return {
      success: true,
      message: `Member ${name} registered successfully`,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        displayName: member.displayName,
        role: member.role,
        status: member.status,
        createdAt: member.metadata.createdAt,
      },
    };
  }

  async handleAuthenticate(args) {
    await this.initialize();

    const { email, password } = args;

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const member = await this.memberManager.authenticate(email, password);

    return {
      success: true,
      message: "Authentication successful",
      member,
    };
  }

  async handleListMembers(args) {
    await this.initialize();

    const { teamId, role, status } = args;
    const filter = {};

    if (teamId) filter.teamId = teamId;
    if (role) filter.role = role;
    if (status) filter.status = status;

    const members = await this.memberManager.listMembers(filter);

    return {
      success: true,
      count: members.length,
      members: members.map((m) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        displayName: m.displayName,
        role: m.role,
        status: m.status,
        teams: m.teams.length,
        projects: m.projects.length,
        createdAt: m.createdAt,
        lastLogin: m.lastLogin,
      })),
    };
  }

  async handleMemberInfo(args) {
    await this.initialize();

    const { memberId } = args;

    if (!memberId) {
      throw new Error("Member ID is required");
    }

    const member = await this.memberManager.getMember(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    return {
      success: true,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        displayName: member.displayName,
        role: member.role,
        status: member.status,
        bio: member.bio,
        skills: member.skills,
        preferences: member.preferences,
        teams: member.teams,
        projects: member.projects,
        createdAt: member.createdAt,
        lastLogin: member.lastLogin,
        lastActivity: member.lastActivity,
      },
    };
  }

  async handleUpdateMember(args) {
    await this.initialize();

    const { memberId, name, displayName, bio, skills, preferences } = args;

    if (!memberId) {
      throw new Error("Member ID is required");
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) updates.skills = skills;
    if (preferences !== undefined) updates.preferences = preferences;

    const updated = await this.memberManager.updateMember(memberId, updates);
    if (!updated) {
      throw new Error(`Member ${memberId} not found`);
    }

    return {
      success: true,
      message: `Member "${updated.name}" updated successfully`,
      member: {
        id: updated.id,
        name: updated.name,
        displayName: updated.displayName,
        bio: updated.bio,
        skills: updated.skills,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async handleChangePassword(args) {
    await this.initialize();

    const { memberId, oldPassword, newPassword } = args;

    if (!memberId || !oldPassword || !newPassword) {
      throw new Error("Member ID, old password, and new password are required");
    }

    const changed = await this.memberManager.changePassword(
      memberId,
      oldPassword,
      newPassword,
    );
    if (!changed) {
      throw new Error("Password change failed. Check old password.");
    }

    return {
      success: true,
      message: "Password changed successfully",
    };
  }

  // Team Commands

  async handleCreateTeam(args) {
    await this.initialize();

    const { name, description, ownerId, visibility = "private" } = args;

    if (!name || !ownerId) {
      throw new Error("Team name and owner ID are required");
    }

    const team = await this.memberManager.createTeam({
      name,
      description,
      ownerId,
      visibility,
    });

    return {
      success: true,
      message: `Team "${name}" created successfully`,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        status: team.status,
        visibility: team.visibility,
        ownerId: team.ownerId,
        members: team.members.length,
        createdAt: team.metadata.createdAt,
      },
    };
  }

  async handleListTeams(args) {
    await this.initialize();

    const { ownerId, visibility, status } = args;
    const filter = {};

    if (ownerId) filter.ownerId = ownerId;
    if (visibility) filter.visibility = visibility;
    if (status) filter.status = status;

    const teams = await this.memberManager.listTeams(filter);

    return {
      success: true,
      count: teams.length,
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        visibility: t.visibility,
        ownerId: t.ownerId,
        members: t.members.length,
        projects: t.projects.length,
        createdAt: t.metadata.createdAt,
        updatedAt: t.metadata.updatedAt,
      })),
    };
  }

  async handleTeamInfo(args) {
    await this.initialize();

    const { teamId } = args;

    if (!teamId) {
      throw new Error("Team ID is required");
    }

    const team = await this.memberManager.getTeam(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    return {
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        status: team.status,
        visibility: team.visibility,
        ownerId: team.ownerId,
        settings: team.settings,
        members: team.members.map((m) => ({
          memberId: m.memberId,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        projects: team.projects,
        invitations: team.invitations.length,
        metadata: team.metadata,
      },
    };
  }

  async handleInviteToTeam(args) {
    await this.initialize();

    const { teamId, email, invitedBy, role = "member", message } = args;

    if (!teamId || !email || !invitedBy) {
      throw new Error("Team ID, email, and invited by are required");
    }

    const invitation = await this.memberManager.inviteToTeam(teamId, {
      email,
      invitedBy,
      role,
      message,
    });

    return {
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.metadata.createdAt,
      },
    };
  }

  async handleAcceptInvitation(args) {
    await this.initialize();

    const { invitationId, memberId } = args;

    if (!invitationId || !memberId) {
      throw new Error("Invitation ID and member ID are required");
    }

    const result = await this.memberManager.acceptInvitation(
      invitationId,
      memberId,
    );

    return {
      success: true,
      message: `Invitation accepted. Welcome to team "${result.team.name}"!`,
      team: {
        id: result.team.id,
        name: result.team.name,
        description: result.team.description,
      },
      member: {
        id: result.member.id,
        name: result.member.name,
        role: result.invitation.role,
      },
    };
  }

  async handleRejectInvitation(args) {
    await this.initialize();

    const { invitationId, memberId } = args;

    if (!invitationId || !memberId) {
      throw new Error("Invitation ID and member ID are required");
    }

    const result = await this.memberManager.rejectInvitation(
      invitationId,
      memberId,
    );

    return {
      success: true,
      message: "Invitation rejected",
    };
  }

  // Template Commands

  async handleCreateTemplate(args) {
    await this.initialize();

    const {
      name,
      description,
      category = "general",
      createdBy,
      settings = {},
      isPublic = false,
    } = args;

    if (!name || !createdBy) {
      throw new Error("Template name and creator ID are required");
    }

    const template = await this.projectManager.createProjectTemplate({
      name,
      description,
      category,
      createdBy,
      settings,
      isPublic,
    });

    return {
      success: true,
      message: `Template "${name}" created successfully`,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isPublic: template.isPublic,
        usageCount: template.usageCount,
        createdAt: template.createdAt,
      },
    };
  }

  async handleCreateFromTemplate(args) {
    await this.initialize();

    const { templateId, name, description, ownerId, teamId } = args;

    if (!templateId || !name || !ownerId) {
      throw new Error("Template ID, project name, and owner ID are required");
    }

    const project = await this.projectManager.createProjectFromTemplate(
      templateId,
      {
        name,
        description,
        ownerId,
        teamId,
      },
    );

    return {
      success: true,
      message: `Project "${name}" created from template successfully`,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
      },
    };
  }

  // Analytics Commands

  async handleProjectAnalytics(args) {
    await this.initialize();

    const { projectId } = args;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const analytics = await this.projectManager.getProjectAnalytics(projectId);

    return {
      success: true,
      analytics: {
        projectId: analytics.projectId,
        timestamp: analytics.timestamp,
        tasks: analytics.tasks,
        milestones: analytics.milestones,
        recommendations: analytics.recommendations,
      },
    };
  }

  async handleMemberAnalytics(args) {
    await this.initialize();

    const { memberId } = args;

    if (!memberId) {
      throw new Error("Member ID is required");
    }

    const analytics = await this.memberManager.getMemberAnalytics(memberId);

    return {
      success: true,
      analytics: {
        memberId: analytics.memberId,
        timestamp: analytics.timestamp,
        profile: analytics.profile,
        activity: analytics.activity,
        stats: analytics.stats,
        recommendations: analytics.recommendations,
      },
    };
  }

  async handleTeamAnalytics(args) {
    await this.initialize();

    const { teamId } = args;

    if (!teamId) {
      throw new Error("Team ID is required");
    }

    const analytics = await this.memberManager.getTeamAnalytics(teamId);

    return {
      success: true,
      analytics: {
        teamId: analytics.teamId,
        timestamp: analytics.timestamp,
        overview: analytics.overview,
        activity: analytics.activity,
        recommendations: analytics.recommendations,
      },
    };
  }

  // Export Commands

  async handleExportProject(args) {
    await this.initialize();

    const { projectId, format = "json", outputPath } = args;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    const exportData = await this.projectManager.exportProjectData(
      projectId,
      format,
    );

    if (outputPath) {
      const fs = await import("fs/promises");
      await fs.writeFile(outputPath, exportData, "utf-8");

      return {
        success: true,
        message: `Project data exported to ${outputPath}`,
        format,
        fileSize: exportData.length,
      };
    }

    return {
      success: true,
      message: "Project data exported",
      format,
      data: format === "json" ? JSON.parse(exportData) : exportData,
    };
  }

  async handleExportMember(args) {
    await this.initialize();

    const { memberId, format = "json", outputPath } = args;

    if (!memberId) {
      throw new Error("Member ID is required");
    }

    const exportData = await this.memberManager.exportMemberData(
      memberId,
      format,
    );

    if (outputPath) {
      const fs = await import("fs/promises");
      await fs.writeFile(outputPath, exportData, "utf-8");

      return {
        success: true,
        message: `Member data exported to ${outputPath}`,
        format,
        fileSize: exportData.length,
      };
    }

    return {
      success: true,
      message: "Member data exported",
      format,
      data: format === "json" ? JSON.parse(exportData) : exportData,
    };
  }

  // Utility Commands

  async handleSearch(args) {
    await this.initialize();

    const { query, type = "all", limit = 20 } = args;

    if (!query) {
      throw new Error("Search query is required");
    }

    const results = {
      projects: [],
      members: [],
      tasks: [],
    };

    // Search projects
    if (type === "all" || type === "projects") {
      const projects = await this.projectManager.listProjects();
      results.projects = projects
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase()) ||
            p.tags.some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase()),
            ),
        )
        .slice(0, limit)
        .map((p) => ({
          type: "project",
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          members: p.members.length,
        }));
    }

    // Search members
    if (type === "all" || type === "members") {
      const members = await this.memberManager.listMembers();
      results.members = members
        .filter(
          (m) =>
            m.name.toLowerCase().includes(query.toLowerCase()) ||
            m.displayName.toLowerCase().includes(query.toLowerCase()) ||
            m.email.toLowerCase().includes(query.toLowerCase()) ||
            m.skills.some((skill) =>
              skill.toLowerCase().includes(query.toLowerCase()),
            ),
        )
        .slice(0, limit)
        .map((m) => ({
          type: "member",
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          email: m.email,
          role: m.role,
          skills: m.skills,
        }));
    }

    // Search tasks (requires loading all projects)
    if (type === "all" || type === "tasks") {
      const projects = await this.projectManager.listProjects();
      const allTasks = [];

      for (const project of projects) {
        project.tasks.forEach((task) => {
          if (
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase()) ||
            task.tags.some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase()),
            )
          ) {
            allTasks.push({
              ...task,
              projectId: project.id,
              projectName: project.name,
            });
          }
        });
      }

      results.tasks = allTasks.slice(0, limit).map((t) => ({
        type: "task",
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        projectName: t.projectName,
        assigneeId: t.assigneeId,
      }));
    }

    return {
      success: true,
      query,
      type,
      results: {
        projects: results.projects.length,
        members: results.members.length,
        tasks: results.tasks.length,
        items: [...results.projects, ...results.members, ...results.tasks],
      },
    };
  }

  async handleDashboard(args) {
    await this.initialize();

    const { memberId } = args;

    if (!memberId) {
      throw new Error("Member ID is required");
    }

    // Get member info
    const member = await this.memberManager.getMember(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    // Get member analytics
    const memberAnalytics =
      await this.memberManager.getMemberAnalytics(memberId);

    // Get member's teams
    const teams = await Promise.all(
      member.teams.map(async (teamId) => {
        const team = await this.memberManager.getTeam(teamId);
        return team
          ? {
              id: team.id,
              name: team.name,
              description: team.description,
              members: team.members.length,
              projects: team.projects.length,
            }
          : null;
      }),
    );

    // Get member's projects
    const projects = await Promise.all(
      member.projects.map(async (projectId) => {
        const project = await this.projectManager.getProject(projectId);
        if (!project) return null;

        const analytics =
          await this.projectManager.getProjectAnalytics(projectId);

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          tasks: analytics.tasks,
          milestones: analytics.milestones,
          lastUpdated: project.updatedAt,
        };
      }),
    );

    // Get assigned tasks
    const assignedTasks = [];
    const allProjects = await this.projectManager.listProjects({ memberId });

    for (const project of allProjects) {
      const myTasks = project.tasks.filter((t) => t.assigneeId === memberId);
      myTasks.forEach((task) => {
        assignedTasks.push({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          projectId: project.id,
          projectName: project.name,
          dueDate: task.dueDate,
          updatedAt: task.updatedAt,
        });
      });
    }

    // Sort tasks by priority and due date
    assignedTasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority] || 3;
      const bPriority = priorityOrder[b.priority] || 3;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      return 0;
    });

    return {
      success: true,
      dashboard: {
        member: {
          id: member.id,
          name: member.name,
          displayName: member.displayName,
          role: member.role,
          status: member.status,
          lastActive: member.activity.lastActive,
        },
        analytics: memberAnalytics,
        teams: teams.filter((t) => t !== null),
        projects: projects.filter((p) => p !== null),
        tasks: {
          total: assignedTasks.length,
          byStatus: this.groupTasksByStatus(assignedTasks),
          upcoming: assignedTasks
            .filter(
              (t) =>
                t.status !== "done" &&
                t.status !== "closed" &&
                t.dueDate &&
                new Date(t.dueDate) > new Date(),
            )
            .slice(0, 5),
          overdue: assignedTasks
            .filter(
              (t) =>
                t.status !== "done" &&
                t.status !== "closed" &&
                t.dueDate &&
                new Date(t.dueDate) < new Date(),
            )
            .slice(0, 5),
        },
        recommendations: [
          ...memberAnalytics.recommendations,
          ...this.generateDashboardRecommendations(assignedTasks, projects),
        ],
      },
    };
  }

  groupTasksByStatus(tasks) {
    const groups = {
      todo: 0,
      in_progress: 0,
      done: 0,
      closed: 0,
    };

    tasks.forEach((task) => {
      if (groups[task.status] !== undefined) {
        groups[task.status]++;
      }
    });

    return groups;
  }

  generateDashboardRecommendations(tasks, projects) {
    const recommendations = [];

    // Check for overdue tasks
    const overdueTasks = tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "closed" &&
        t.dueDate &&
        new Date(t.dueDate) < new Date(),
    );

    if (overdueTasks.length > 0) {
      recommendations.push({
        type: "overdue_tasks",
        severity: "high",
        message: `You have ${overdueTasks.length} overdue tasks`,
        action: "Update task status or due dates",
      });
    }

    // Check for tasks due soon (within 3 days)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const dueSoonTasks = tasks.filter(
      (t) =>
        t.status !== "done" &&
        t.status !== "closed" &&
        t.dueDate &&
        new Date(t.dueDate) <= threeDaysFromNow &&
        new Date(t.dueDate) > new Date(),
    );

    if (dueSoonTasks.length > 0) {
      recommendations.push({
        type: "due_soon_tasks",
        severity: "medium",
        message: `You have ${dueSoonTasks.length} tasks due in the next 3 days`,
        action: "Prioritize these tasks",
      });
    }

    // Check for project activity
    const inactiveProjects = projects.filter((p) => {
      const lastUpdated = new Date(p.lastUpdated);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return lastUpdated < thirtyDaysAgo && p.status === "active";
    });

    if (inactiveProjects.length > 0) {
      recommendations.push({
        type: "inactive_projects",
        severity: "low",
        message: `You have ${inactiveProjects.length} projects that haven't been updated in 30+ days`,
        action: "Check project status or archive inactive projects",
      });
    }

    return recommendations;
  }

  async handleSystemAnalytics(args) {
    await this.initialize();

    const projects = await this.projectManager.listProjects();
    const members = await this.memberManager.listMembers();
    const teams = await this.memberManager.listTeams();

    // Calculate system-wide statistics
    const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const totalMilestones = projects.reduce(
      (sum, p) => sum + p.milestones.length,
      0,
    );
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter(
      (p) => p.status === "completed",
    ).length;

    // Task status distribution
    const taskStatus = {
      todo: 0,
      in_progress: 0,
      done: 0,
      closed: 0,
    };

    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (taskStatus[task.status] !== undefined) {
          taskStatus[task.status]++;
        }
      });
    });

    // Member activity
    const activeMembers = members.filter((m) => m.status === "active").length;
    const inactiveMembers = members.filter(
      (m) => m.status === "inactive",
    ).length;

    // Team statistics
    const publicTeams = teams.filter((t) => t.visibility === "public").length;
    const privateTeams = teams.filter((t) => t.visibility === "private").length;

    return {
      success: true,
      analytics: {
        summary: {
          totalProjects: projects.length,
          totalMembers: members.length,
          totalTeams: teams.length,
          totalTasks,
          totalMilestones,
        },
        projectStatus: {
          active: activeProjects,
          completed: completedProjects,
          archived: projects.length - activeProjects - completedProjects,
        },
        taskStatus,
        memberStatus: {
          active: activeMembers,
          inactive: inactiveMembers,
        },
        teamVisibility: {
          public: publicTeams,
          private: privateTeams,
        },
        activity: {
          last30Days: {
            projectsCreated: projects.filter(
              (p) =>
                new Date(p.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ).length,
            tasksCreated: totalTasks, // Simplified - would need tracking
            membersJoined: members.filter(
              (m) =>
                new Date(m.createdAt) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ).length,
          },
        },
        recommendations: this.generateSystemRecommendations(
          projects,
          members,
          teams,
        ),
      },
    };
  }

  generateSystemRecommendations(projects, members, teams) {
    const recommendations = [];

    // Check for projects without tasks
    const projectsWithoutTasks = projects.filter((p) => p.tasks.length === 0);
    if (projectsWithoutTasks.length > 0) {
      recommendations.push({
        type: "projects_without_tasks",
        severity: "low",
        message: `${projectsWithoutTasks.length} projects have no tasks`,
        action: "Add tasks to these projects",
      });
    }

    // Check for inactive members
    const inactiveMembers = members.filter((m) => m.status === "inactive");
    if (inactiveMembers.length > 5) {
      recommendations.push({
        type: "many_inactive_members",
        severity: "medium",
        message: `${inactiveMembers.length} members are inactive`,
        action: "Consider removing or reactivating inactive members",
      });
    }

    // Check for teams without projects
    const teamsWithoutProjects = teams.filter((t) => t.projects.length === 0);
    if (teamsWithoutProjects.length > 0) {
      recommendations.push({
        type: "teams_without_projects",
        severity: "low",
        message: `${teamsWithoutProjects.length} teams have no projects`,
        action: "Create projects for these teams",
      });
    }

    return recommendations;
  }

  async handleHelp(args) {
    const commands = {
      "Project Commands": [
        "project:create - Create a new project",
        "project:list - List projects",
        "project:info - Get project details",
        "project:update - Update project",
        "project:delete - Delete project",
        "project:add-member - Add member to project",
        "project:remove-member - Remove member from project",
      ],
      "Task Commands": [
        "task:create - Create a new task",
        "task:update - Update task",
        "task:list - List tasks",
        "task:info - Get task details",
        "task:delete - Delete task",
      ],
      "Member Commands": [
        "member:register - Register new member",
        "member:authenticate - Authenticate member",
        "member:list - List members",
        "member:info - Get member details",
        "member:update - Update member",
        "member:change-password - Change password",
      ],
      "Team Commands": [
        "team:create - Create a new team",
        "team:list - List teams",
        "team:info - Get team details",
        "team:invite - Invite to team",
        "team:accept-invitation - Accept invitation",
        "team:reject-invitation - Reject invitation",
      ],
      "Template Commands": [
        "template:create - Create project template",
        "template:create-project - Create project from template",
      ],
      "Analytics Commands": [
        "analytics:project - Project analytics",
        "analytics:member - Member analytics",
        "analytics:team - Team analytics",
        "analytics:system - System analytics",
      ],
      "Export Commands": [
        "export:project - Export project data",
        "export:member - Export member data",
      ],
      "Utility Commands": [
        "search - Search across system",
        "dashboard - Member dashboard",
        "help - Show this help",
      ],
    };

    return {
      success: true,
      help: commands,
    };
  }
}
