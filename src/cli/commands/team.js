// Team collaboration functionality for AI internal use
// This module provides team collaboration capabilities for AI providers

import { TeamCommandHandler } from "../../utils/team/team-commands.js";

let commandHandler = null;

/**
 * Initialize team command handler
 * @returns {Promise<TeamCommandHandler>} Initialized handler
 */
async function getHandler() {
  if (!commandHandler) {
    commandHandler = new TeamCommandHandler();
    await commandHandler.initialize();
  }
  return commandHandler;
}

/**
 * Team collaboration functionality for AI internal use
 */
export class TeamCollaboration {
  constructor() {
    this.handler = null;
  }

  /**
   * Initialize team collaboration
   */
  async initialize() {
    this.handler = await getHandler();
  }

  /**
   * Create a new team project
   * @param {Object} options - Project options
   * @returns {Promise<Object>} Created project
   */
  async createProject(options) {
    const handler = await getHandler();
    return await handler.handleCreateProject(options);
  }

  /**
   * List team projects
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of projects
   */
  async listProjects(options = {}) {
    const handler = await getHandler();
    return await handler.handleListProjects(options);
  }

  /**
   * Get project information
   * @param {Object} options - Project options
   * @returns {Promise<Object>} Project information
   */
  async getProjectInfo(options) {
    const handler = await getHandler();
    return await handler.handleProjectInfo(options);
  }

  /**
   * Add member to project
   * @param {Object} options - Member options
   * @returns {Promise<Object>} Operation result
   */
  async addMemberToProject(options) {
    const handler = await getHandler();
    return await handler.handleAddMemberToProject(options);
  }

  /**
   * Create a new task
   * @param {Object} options - Task options
   * @returns {Promise<Object>} Created task
   */
  async createTask(options) {
    const handler = await getHandler();
    return await handler.handleCreateTask(options);
  }

  /**
   * Update a task
   * @param {Object} options - Task update options
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(options) {
    const handler = await getHandler();
    return await handler.handleUpdateTask(options);
  }

  /**
   * List project tasks
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of tasks
   */
  async listTasks(options = {}) {
    const handler = await getHandler();
    return await handler.handleListTasks(options);
  }

  /**
   * Register a new team member
   * @param {Object} options - Member options
   * @returns {Promise<Object>} Registered member
   */
  async registerMember(options) {
    const handler = await getHandler();
    return await handler.handleRegisterMember(options);
  }

  /**
   * Authenticate a member
   * @param {Object} options - Authentication options
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateMember(options) {
    const handler = await getHandler();
    return await handler.handleAuthenticateMember(options);
  }

  /**
   * List team members
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of members
   */
  async listMembers(options = {}) {
    const handler = await getHandler();
    return await handler.handleListMembers(options);
  }

  /**
   * Create a new team
   * @param {Object} options - Team options
   * @returns {Promise<Object>} Created team
   */
  async createTeam(options) {
    const handler = await getHandler();
    return await handler.handleCreateTeam(options);
  }

  /**
   * Invite someone to a team
   * @param {Object} options - Invitation options
   * @returns {Promise<Object>} Invitation result
   */
  async inviteToTeam(options) {
    const handler = await getHandler();
    return await handler.handleInviteToTeam(options);
  }

  /**
   * Get project analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getProjectAnalytics(options) {
    const handler = await getHandler();
    return await handler.handleProjectAnalytics(options);
  }

  /**
   * Get member analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getMemberAnalytics(options) {
    const handler = await getHandler();
    return await handler.handleMemberAnalytics(options);
  }

  /**
   * Get team analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getTeamAnalytics(options) {
    const handler = await getHandler();
    return await handler.handleTeamAnalytics(options);
  }

  /**
   * Search across teams, projects, and members
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async search(options) {
    const handler = await getHandler();
    return await handler.handleSearch(options);
  }

  /**
   * Get member dashboard
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard(options) {
    const handler = await getHandler();
    return await handler.handleDashboard(options);
  }
}

/**
 * Create a team collaboration instance for AI use
 * @returns {Promise<TeamCollaboration>} Team collaboration instance
 */
export async function createTeamCollaboration() {
  const collaboration = new TeamCollaboration();
  await collaboration.initialize();
  return collaboration;
}
