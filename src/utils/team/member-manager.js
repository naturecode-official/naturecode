// Team member management system

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export class TeamMemberManager {
  constructor(config = {}) {
    this.config = {
      membersDir: ".naturecode/team/members",
      teamsDir: ".naturecode/team/teams",
      invitationsDir: ".naturecode/team/invitations",
      ...config,
    };

    this.members = new Map(); // memberId -> Member
    this.teams = new Map(); // teamId -> Team
    this.invitations = new Map(); // invitationId -> Invitation
  }

  async initialize() {
    // Ensure directories exist
    await fs.mkdir(this.config.membersDir, { recursive: true });
    await fs.mkdir(this.config.teamsDir, { recursive: true });
    await fs.mkdir(this.config.invitationsDir, { recursive: true });

    // Load existing data
    await this.loadMembers();
    await this.loadTeams();
    await this.loadInvitations();

    return true;
  }

  // Member Management

  async registerMember(memberData) {
    const memberId = this.generateMemberId(memberData.email);
    const now = new Date().toISOString();

    // Check if member already exists
    if (this.members.has(memberId)) {
      throw new Error(`Member with email ${memberData.email} already exists`);
    }

    const member = {
      id: memberId,
      email: memberData.email,
      name: memberData.name,
      displayName: memberData.displayName || memberData.name,
      avatar: memberData.avatar || null,
      bio: memberData.bio || "",
      role: "member", // Default role
      status: "active",
      preferences: {
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
        theme: "light",
        language: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...memberData.preferences,
      },
      skills: memberData.skills || [],
      tags: memberData.tags || [],
      teams: [], // Array of team IDs
      projects: [], // Array of project IDs
      activity: {
        lastActive: now,
        totalSessions: 0,
        totalHours: 0,
      },
      stats: {
        tasksCompleted: 0,
        codeReviews: 0,
        contributions: 0,
        averageRating: 0,
      },
      security: {
        passwordHash: await this.hashPassword(memberData.password),
        mfaEnabled: false,
        mfaSecret: null,
        lastPasswordChange: now,
        failedAttempts: 0,
        lockedUntil: null,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: memberData.createdBy || "system",
        version: 1,
      },
    };

    await this.saveMember(member);
    this.members.set(memberId, member);

    return member;
  }

  async updateMember(memberId, updates) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    // Don't allow updating certain fields directly
    const allowedUpdates = {
      name: updates.name,
      displayName: updates.displayName,
      avatar: updates.avatar,
      bio: updates.bio,
      preferences: updates.preferences,
      skills: updates.skills,
      tags: updates.tags,
      status: updates.status,
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    Object.assign(member, allowedUpdates, {
      metadata: {
        ...member.metadata,
        updatedAt: new Date().toISOString(),
        version: member.metadata.version + 1,
      },
    });

    await this.saveMember(member);
    return member;
  }

  async updateMemberActivity(memberId, activityData = {}) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    member.activity.lastActive = new Date().toISOString();
    member.activity.totalSessions = (member.activity.totalSessions || 0) + 1;

    if (activityData.sessionHours) {
      member.activity.totalHours =
        (member.activity.totalHours || 0) + activityData.sessionHours;
    }

    await this.saveMember(member);
    return member.activity;
  }

  async updateMemberStats(memberId, statsUpdate) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    Object.keys(statsUpdate).forEach((key) => {
      if (member.stats[key] !== undefined) {
        if (typeof member.stats[key] === "number") {
          member.stats[key] += statsUpdate[key];
        } else {
          member.stats[key] = statsUpdate[key];
        }
      }
    });

    await this.saveMember(member);
    return member.stats;
  }

  async getMember(memberId) {
    return this.members.get(memberId);
  }

  async findMemberByEmail(email) {
    const memberId = this.generateMemberId(email);
    return this.members.get(memberId);
  }

  async listMembers(filter = {}) {
    let members = Array.from(this.members.values());

    // Apply filters
    if (filter.teamId) {
      members = members.filter((m) => m.teams.includes(filter.teamId));
    }

    if (filter.status) {
      members = members.filter((m) => m.status === filter.status);
    }

    if (filter.role) {
      members = members.filter((m) => m.role === filter.role);
    }

    if (filter.skills && filter.skills.length > 0) {
      members = members.filter((m) =>
        filter.skills.some((skill) => m.skills.includes(skill)),
      );
    }

    // Sort by last active (most recent first)
    members.sort(
      (a, b) =>
        new Date(b.activity.lastActive) - new Date(a.activity.lastActive),
    );

    return members;
  }

  // Team Management

  async createTeam(teamData) {
    const teamId = this.generateId("team");
    const now = new Date().toISOString();

    const team = {
      id: teamId,
      name: teamData.name,
      description: teamData.description || "",
      ownerId: teamData.ownerId,
      status: "active",
      visibility: teamData.visibility || "private",
      tags: teamData.tags || [],
      settings: {
        maxMembers: teamData.maxMembers || 50,
        allowMemberInvites: true,
        requireApproval: false,
        defaultRole: "member",
        ...teamData.settings,
      },
      members: [
        {
          memberId: teamData.ownerId,
          role: "owner",
          joinedAt: now,
          permissions: this.getTeamRolePermissions("owner"),
        },
      ],
      projects: [], // Array of project IDs
      invitations: [], // Array of invitation IDs
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: 1,
      },
    };

    await this.saveTeam(team);
    this.teams.set(teamId, team);

    // Add team to owner's teams list
    const owner = this.members.get(teamData.ownerId);
    if (owner) {
      owner.teams.push(teamId);
      await this.saveMember(owner);
    }

    return team;
  }

  async inviteToTeam(teamId, invitationData) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Check team size limit
    if (team.members.length >= team.settings.maxMembers) {
      throw new Error(`Team ${teamId} has reached maximum member limit`);
    }

    const invitationId = this.generateId("invite");
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = {
      id: invitationId,
      teamId,
      email: invitationData.email,
      invitedBy: invitationData.invitedBy,
      role: invitationData.role || team.settings.defaultRole,
      status: "pending",
      message: invitationData.message || "",
      expiresAt: expiresAt.toISOString(),
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };

    await this.saveInvitation(invitation);
    this.invitations.set(invitationId, invitation);

    team.invitations.push(invitationId);
    team.metadata.updatedAt = now;
    await this.saveTeam(team);

    // Send invitation email (in a real implementation)
    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  async acceptInvitation(invitationId, memberId) {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error(`Invitation ${invitationId} not found`);
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending") {
      throw new Error(`Invitation ${invitationId} is no longer valid`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = "expired";
      await this.saveInvitation(invitation);
      throw new Error(`Invitation ${invitationId} has expired`);
    }

    const team = this.teams.get(invitation.teamId);
    if (!team) {
      throw new Error(`Team ${invitation.teamId} not found`);
    }

    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    // Check if member is already in team
    if (team.members.some((m) => m.memberId === memberId)) {
      throw new Error(`Member ${memberId} is already in team`);
    }

    // Add member to team
    const now = new Date().toISOString();
    team.members.push({
      memberId,
      role: invitation.role,
      joinedAt: now,
      permissions: this.getTeamRolePermissions(invitation.role),
    });

    team.metadata.updatedAt = now;
    await this.saveTeam(team);

    // Add team to member's teams list
    member.teams.push(invitation.teamId);
    await this.saveMember(member);

    // Update invitation status
    invitation.status = "accepted";
    invitation.acceptedAt = now;
    invitation.acceptedBy = memberId;
    invitation.metadata.updatedAt = now;
    await this.saveInvitation(invitation);

    // Send notification to team
    await this.sendTeamNotification(teamId, {
      type: "member_joined",
      memberId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    return {
      team,
      member,
      invitation,
    };
  }

  async updateTeamMemberRole(teamId, memberId, newRole) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const member = team.members.find((m) => m.memberId === memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found in team`);
    }

    // Cannot change owner role
    if (member.role === "owner") {
      throw new Error("Cannot change owner role");
    }

    const oldRole = member.role;
    member.role = newRole;
    member.permissions = this.getTeamRolePermissions(newRole);
    team.metadata.updatedAt = new Date().toISOString();

    await this.saveTeam(team);

    // Send notification
    await this.sendTeamNotification(teamId, {
      type: "role_changed",
      memberId,
      oldRole,
      newRole,
    });

    return member;
  }

  async removeFromTeam(teamId, memberId) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Cannot remove owner
    const memberIndex = team.members.findIndex((m) => m.memberId === memberId);
    if (memberIndex === -1) {
      throw new Error(`Member ${memberId} not found in team`);
    }

    if (team.members[memberIndex].role === "owner") {
      throw new Error("Cannot remove team owner");
    }

    team.members.splice(memberIndex, 1);
    team.metadata.updatedAt = new Date().toISOString();

    await this.saveTeam(team);

    // Remove team from member's teams list
    const member = this.members.get(memberId);
    if (member) {
      const teamIndex = member.teams.indexOf(teamId);
      if (teamIndex !== -1) {
        member.teams.splice(teamIndex, 1);
        await this.saveMember(member);
      }
    }

    // Send notification
    await this.sendTeamNotification(teamId, {
      type: "member_removed",
      memberId,
    });

    return true;
  }

  async getTeam(teamId) {
    return this.teams.get(teamId);
  }

  async listTeams(filter = {}) {
    let teams = Array.from(this.teams.values());

    // Apply filters
    if (filter.ownerId) {
      teams = teams.filter((t) => t.ownerId === filter.ownerId);
    }

    if (filter.memberId) {
      teams = teams.filter((t) =>
        t.members.some((m) => m.memberId === filter.memberId),
      );
    }

    if (filter.status) {
      teams = teams.filter((t) => t.status === filter.status);
    }

    if (filter.visibility) {
      teams = teams.filter((t) => t.visibility === filter.visibility);
    }

    // Sort by updated date (newest first)
    teams.sort(
      (a, b) => new Date(b.metadata.updatedAt) - new Date(a.metadata.updatedAt),
    );

    return teams;
  }

  // Authentication and Security

  async authenticate(email, password) {
    const memberId = this.generateMemberId(email);
    const member = this.members.get(memberId);

    if (!member) {
      throw new Error("Invalid credentials");
    }

    // Check if account is locked
    if (
      member.security.lockedUntil &&
      new Date(member.security.lockedUntil) > new Date()
    ) {
      throw new Error(
        `Account is locked until ${new Date(member.security.lockedUntil).toLocaleString()}`,
      );
    }

    // Verify password
    const passwordMatch = await this.verifyPassword(
      password,
      member.security.passwordHash,
    );

    if (!passwordMatch) {
      // Increment failed attempts
      member.security.failedAttempts =
        (member.security.failedAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (member.security.failedAttempts >= 5) {
        member.security.lockedUntil = new Date(
          Date.now() + 30 * 60 * 1000,
        ).toISOString(); // 30 minutes
      }

      await this.saveMember(member);
      throw new Error("Invalid credentials");
    }

    // Reset failed attempts on successful login
    member.security.failedAttempts = 0;
    member.security.lockedUntil = null;
    member.activity.lastActive = new Date().toISOString();

    await this.saveMember(member);

    // Return member data without sensitive information
    return this.sanitizeMember(member);
  }

  async changePassword(memberId, oldPassword, newPassword) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    // Verify old password
    const passwordMatch = await this.verifyPassword(
      oldPassword,
      member.security.passwordHash,
    );
    if (!passwordMatch) {
      throw new Error("Old password is incorrect");
    }

    // Update password
    member.security.passwordHash = await this.hashPassword(newPassword);
    member.security.lastPasswordChange = new Date().toISOString();
    member.metadata.updatedAt = new Date().toISOString();

    await this.saveMember(member);
    return true;
  }

  async resetPassword(email, newPassword) {
    const memberId = this.generateMemberId(email);
    const member = this.members.get(memberId);

    if (!member) {
      // Don't reveal that email doesn't exist
      return true;
    }

    member.security.passwordHash = await this.hashPassword(newPassword);
    member.security.lastPasswordChange = new Date().toISOString();
    member.metadata.updatedAt = new Date().toISOString();

    await this.saveMember(member);
    return true;
  }

  async enableMFA(memberId, secret) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    member.security.mfaEnabled = true;
    member.security.mfaSecret = secret;
    member.metadata.updatedAt = new Date().toISOString();

    await this.saveMember(member);
    return true;
  }

  async disableMFA(memberId) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    member.security.mfaEnabled = false;
    member.security.mfaSecret = null;
    member.metadata.updatedAt = new Date().toISOString();

    await this.saveMember(member);
    return true;
  }

  // Analytics and Reporting

  async getMemberAnalytics(memberId) {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      memberId,
      timestamp: now.toISOString(),
      profile: {
        name: member.name,
        displayName: member.displayName,
        role: member.role,
        status: member.status,
        teams: member.teams.length,
        projects: member.projects.length,
      },
      activity: {
        lastActive: member.activity.lastActive,
        totalSessions: member.activity.totalSessions,
        totalHours: member.activity.totalHours,
        dailyAverage: this.calculateDailyAverage(member.activity),
      },
      stats: member.stats,
      skills: member.skills,
      recommendations: this.generateMemberRecommendations(member),
    };
  }

  async getTeamAnalytics(teamId) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const now = new Date();

    // Get member details
    const members = await Promise.all(
      team.members.map(async (teamMember) => {
        const member = await this.getMember(teamMember.memberId);
        return {
          ...teamMember,
          member: member ? this.sanitizeMember(member) : null,
        };
      }),
    );

    // Calculate team statistics
    const activeMembers = members.filter(
      (m) => m.member && m.member.status === "active",
    ).length;

    const rolesCount = {};
    members.forEach((m) => {
      rolesCount[m.role] = (rolesCount[m.role] || 0) + 1;
    });

    return {
      teamId,
      timestamp: now.toISOString(),
      overview: {
        name: team.name,
        totalMembers: team.members.length,
        activeMembers,
        roles: rolesCount,
        projects: team.projects.length,
        invitations: team.invitations.length,
      },
      members: members.map((m) => ({
        id: m.memberId,
        role: m.role,
        joinedAt: m.joinedAt,
        name: m.member?.name,
        displayName: m.member?.displayName,
        status: m.member?.status,
        lastActive: m.member?.activity.lastActive,
      })),
      activity: this.calculateTeamActivity(team, members),
      recommendations: this.generateTeamRecommendations(team, members),
    };
  }

  // Utility Methods

  generateMemberId(email) {
    // Use email as ID (lowercase, normalized)
    return email.toLowerCase().trim();
  }

  generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  async hashPassword(password) {
    // In a real implementation, use bcrypt or similar
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    return `${salt}:${hash}`;
  }

  async verifyPassword(password, hash) {
    const [salt, originalHash] = hash.split(":");
    const newHash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    return newHash === originalHash;
  }

  getTeamRolePermissions(role) {
    const permissions = {
      owner: {
        canManageTeam: true,
        canManageMembers: true,
        canManageProjects: true,
        canEditSettings: true,
        canDeleteTeam: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: true,
      },
      admin: {
        canManageTeam: true,
        canManageMembers: true,
        canManageProjects: true,
        canEditSettings: true,
        canDeleteTeam: false,
        canInviteMembers: true,
        canRemoveMembers: true,
        canChangeRoles: true,
      },
      member: {
        canManageTeam: false,
        canManageMembers: false,
        canManageProjects: false,
        canEditSettings: false,
        canDeleteTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
      },
      viewer: {
        canManageTeam: false,
        canManageMembers: false,
        canManageProjects: false,
        canEditSettings: false,
        canDeleteTeam: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canChangeRoles: false,
      },
    };

    return permissions[role] || permissions.member;
  }

  sanitizeMember(member) {
    // Remove sensitive information
    const sanitized = { ...member };
    delete sanitized.security;
    return sanitized;
  }

  calculateDailyAverage(activity) {
    if (!activity.totalSessions || !activity.totalHours) {
      return { sessions: 0, hours: 0 };
    }

    // Assuming 30 days for calculation
    const days = 30;
    return {
      sessions: Math.round(activity.totalSessions / days),
      hours: Math.round((activity.totalHours / days) * 10) / 10,
    };
  }

  calculateTeamActivity(team, members) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeMembers = members.filter((m) => {
      if (!m.member || !m.member.activity.lastActive) return false;
      const lastActive = new Date(m.member.activity.lastActive);
      return lastActive > sevenDaysAgo;
    }).length;

    return {
      totalMembers: members.length,
      activeMembers,
      activityRate: Math.round((activeMembers / members.length) * 100),
      lastUpdated: team.metadata.updatedAt,
    };
  }

  generateMemberRecommendations(member) {
    const recommendations = [];

    // Check for incomplete profile
    if (!member.bio || member.bio.trim().length < 10) {
      recommendations.push({
        type: "incomplete_profile",
        severity: "low",
        message: "Your profile bio is incomplete",
        action: "Add a bio to help team members know you better",
      });
    }

    if (member.skills.length === 0) {
      recommendations.push({
        type: "no_skills",
        severity: "medium",
        message: "No skills listed in your profile",
        action: "Add your skills to help with task assignments",
      });
    }

    // Check for inactivity
    const lastActive = new Date(member.activity.lastActive);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (lastActive < thirtyDaysAgo && member.status === "active") {
      recommendations.push({
        type: "inactive_member",
        severity: "medium",
        message: "You haven't been active for 30+ days",
        action: "Consider updating your status or re-engaging with the team",
      });
    }

    return recommendations;
  }

  generateTeamRecommendations(team, members) {
    const recommendations = [];

    // Check for team size
    if (team.members.length === 1) {
      recommendations.push({
        type: "small_team",
        severity: "low",
        message: "Team has only one member",
        action: "Consider inviting more members to collaborate",
      });
    }

    // Check for role distribution
    const owners = members.filter((m) => m.role === "owner").length;
    const admins = members.filter((m) => m.role === "admin").length;

    if (owners === 0) {
      recommendations.push({
        type: "no_owner",
        severity: "high",
        message: "Team has no owner",
        action: "Assign an owner to manage team settings",
      });
    }

    if (owners + admins === 0) {
      recommendations.push({
        type: "no_management",
        severity: "medium",
        message: "Team has no managers",
        action: "Consider promoting members to admin roles",
      });
    }

    // Check for inactive members
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const inactiveMembers = members.filter((m) => {
      if (!m.member || !m.member.activity.lastActive) return false;
      const lastActive = new Date(m.member.activity.lastActive);
      return lastActive < sevenDaysAgo;
    }).length;

    if (inactiveMembers > 0) {
      recommendations.push({
        type: "inactive_members",
        severity: "medium",
        message: `${inactiveMembers} members haven't been active in 7+ days`,
        action: "Check in with inactive members",
      });
    }

    return recommendations;
  }

  async sendInvitationEmail(invitation) {
    // In a real implementation, send actual email
    console.log("Invitation email sent:", invitation);

    // Save email log
    const emailLog = {
      invitationId: invitation.id,
      email: invitation.email,
      sentAt: new Date().toISOString(),
      status: "sent",
    };

    const logPath = path.join(
      this.config.invitationsDir,
      "emails",
      `${invitation.id}.json`,
    );
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.writeFile(logPath, JSON.stringify(emailLog, null, 2));
  }

  async sendTeamNotification(teamId, notification) {
    // In a real implementation, send to team members
    console.log("Team notification:", teamId, notification);

    // Save notification
    const notificationId = this.generateId("team_notif");
    const fullNotification = {
      id: notificationId,
      teamId,
      ...notification,
      createdAt: new Date().toISOString(),
    };

    const notificationPath = path.join(
      this.config.teamsDir,
      "notifications",
      `${notificationId}.json`,
    );
    await fs.mkdir(path.dirname(notificationPath), { recursive: true });
    await fs.writeFile(
      notificationPath,
      JSON.stringify(fullNotification, null, 2),
    );
  }

  // Data Persistence

  async loadMembers() {
    try {
      const files = await fs.readdir(this.config.membersDir);

      for (const file of files) {
        if (file.endsWith(".json") && !file.startsWith(".")) {
          const filePath = path.join(this.config.membersDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const member = JSON.parse(content);

          if (member.id && member.email) {
            this.members.set(member.id, member);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load members:", error.message);
    }
  }

  async loadTeams() {
    try {
      const files = await fs.readdir(this.config.teamsDir);

      for (const file of files) {
        if (file.endsWith(".json") && !file.startsWith(".")) {
          const filePath = path.join(this.config.teamsDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const team = JSON.parse(content);

          if (team.id && team.name) {
            this.teams.set(team.id, team);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load teams:", error.message);
    }
  }

  async loadInvitations() {
    try {
      const files = await fs.readdir(this.config.invitationsDir);

      for (const file of files) {
        if (
          file.endsWith(".json") &&
          !file.startsWith(".") &&
          file !== "emails"
        ) {
          const filePath = path.join(this.config.invitationsDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const invitation = JSON.parse(content);

          if (invitation.id && invitation.email) {
            this.invitations.set(invitation.id, invitation);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load invitations:", error.message);
    }
  }

  async saveMember(member) {
    const filePath = path.join(this.config.membersDir, `${member.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(member, null, 2));
  }

  async saveTeam(team) {
    const filePath = path.join(this.config.teamsDir, `${team.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(team, null, 2));
  }

  async saveInvitation(invitation) {
    const filePath = path.join(
      this.config.invitationsDir,
      `${invitation.id}.json`,
    );
    await fs.writeFile(filePath, JSON.stringify(invitation, null, 2));
  }

  async exportMemberData(memberId, format = "json") {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found`);
    }

    const analytics = await this.getMemberAnalytics(memberId);
    const teams = await Promise.all(
      member.teams.map(async (teamId) => {
        const team = await this.getTeam(teamId);
        return team ? this.sanitizeTeam(team) : null;
      }),
    );

    const exportData = {
      member: this.sanitizeMember(member),
      analytics,
      teams: teams.filter((t) => t !== null),
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
    };

    switch (format.toLowerCase()) {
      case "json":
        return JSON.stringify(exportData, null, 2);

      case "markdown":
        return this.formatMemberAsMarkdown(exportData);

      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  sanitizeTeam(team) {
    // Remove sensitive information
    const sanitized = { ...team };
    delete sanitized.invitations;
    return sanitized;
  }

  formatMemberAsMarkdown(data) {
    const { member, analytics, teams } = data;

    let markdown = `# Member: ${member.name}\n\n`;
    markdown += `**Email**: ${member.email}\n`;
    markdown += `**Display Name**: ${member.displayName}\n`;
    markdown += `**Role**: ${member.role}\n`;
    markdown += `**Status**: ${member.status}\n`;
    markdown += `**Joined**: ${new Date(member.metadata.createdAt).toLocaleDateString()}\n\n`;

    if (member.bio) {
      markdown += `## Bio\n\n${member.bio}\n\n`;
    }

    if (member.skills.length > 0) {
      markdown += `## Skills\n\n`;
      member.skills.forEach((skill) => {
        markdown += `- ${skill}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Activity\n\n`;
    markdown += `- **Last Active**: ${new Date(analytics.activity.lastActive).toLocaleString()}\n`;
    markdown += `- **Total Sessions**: ${analytics.activity.totalSessions}\n`;
    markdown += `- **Total Hours**: ${analytics.activity.totalHours}\n`;
    markdown += `- **Daily Average**: ${analytics.activity.dailyAverage.sessions} sessions, ${analytics.activity.dailyAverage.hours} hours\n\n`;

    markdown += `## Statistics\n\n`;
    Object.entries(analytics.stats).forEach(([key, value]) => {
      markdown += `- **${key.replace(/([A-Z])/g, " $1").toLowerCase()}**: ${value}\n`;
    });

    if (teams.length > 0) {
      markdown += `\n## Teams (${teams.length})\n\n`;
      teams.forEach((team) => {
        markdown += `- **${team.name}** (${team.id}) - ${team.members.length} members\n`;
      });
    }

    if (analytics.recommendations.length > 0) {
      markdown += `\n## Recommendations\n\n`;
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
