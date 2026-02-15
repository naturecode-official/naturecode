// Team collaboration CLI commands

import { Command } from "commander";
import { TeamCommandHandler } from "../../utils/team/team-commands.js";

export function createTeamCommand() {
  const teamCommand = new Command("team")
    .description("Team collaboration and project management")
    .configureHelp({ showGlobalOptions: true });

  // Initialize command handler
  let commandHandler = null;

  const getHandler = async () => {
    if (!commandHandler) {
      commandHandler = new TeamCommandHandler();
      await commandHandler.initialize();
    }
    return commandHandler;
  };

  // Project commands
  teamCommand
    .command("project:create")
    .description("Create a new team project")
    .requiredOption("-n, --name <name>", "Project name")
    .option("-d, --description <description>", "Project description")
    .requiredOption("-o, --owner-id <ownerId>", "Project owner ID")
    .option("-t, --team-id <teamId>", "Team ID (if applicable)")
    .option(
      "-v, --visibility <visibility>",
      "Project visibility (private/public)",
      "private",
    )
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleCreateProject(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("project:list")
    .description("List team projects")
    .option("-t, --team-id <teamId>", "Filter by team ID")
    .option("-s, --status <status>", "Filter by status")
    .option("-v, --visibility <visibility>", "Filter by visibility")
    .option("-m, --member-id <memberId>", "Filter by member ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleListProjects(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("project:info")
    .description("Get project information")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleProjectInfo(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("project:add-member")
    .description("Add member to project")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .requiredOption("-m, --member-id <memberId>", "Member ID")
    .option("-r, --role <role>", "Member role", "member")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleAddMemberToProject(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Task commands
  teamCommand
    .command("task:create")
    .description("Create a new task")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .requiredOption("-t, --title <title>", "Task title")
    .option("-d, --description <description>", "Task description")
    .requiredOption("-r, --reporter-id <reporterId>", "Reporter ID")
    .option("-a, --assignee-id <assigneeId>", "Assignee ID")
    .option("--type <type>", "Task type", "task")
    .option("--priority <priority>", "Task priority", "medium")
    .option("--due-date <dueDate>", "Due date (YYYY-MM-DD)")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleCreateTask(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("task:update")
    .description("Update a task")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .requiredOption("-i, --task-id <taskId>", "Task ID")
    .requiredOption("-u, --updates <updates>", "Updates as JSON string")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const parsedUpdates = JSON.parse(options.updates);
        const result = await handler.handleUpdateTask({
          ...options,
          updates: parsedUpdates,
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("task:list")
    .description("List project tasks")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .option("-s, --status <status>", "Filter by status")
    .option("--priority <priority>", "Filter by priority")
    .option("-a, --assignee-id <assigneeId>", "Filter by assignee ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleListTasks(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Member commands
  teamCommand
    .command("member:register")
    .description("Register a new team member")
    .requiredOption("-e, --email <email>", "Email address")
    .requiredOption("-n, --name <name>", "Full name")
    .requiredOption("-p, --password <password>", "Password")
    .option("-d, --display-name <displayName>", "Display name")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleRegisterMember(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("member:authenticate")
    .description("Authenticate a member")
    .requiredOption("-e, --email <email>", "Email address")
    .requiredOption("-p, --password <password>", "Password")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleAuthenticate(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("member:list")
    .description("List team members")
    .option("-t, --team-id <teamId>", "Filter by team ID")
    .option("-s, --status <status>", "Filter by status")
    .option("-r, --role <role>", "Filter by role")
    .option("--skills <skills>", "Filter by skills (comma-separated)")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        if (options.skills) {
          options.skills = options.skills.split(",").map((s) => s.trim());
        }
        const result = await handler.handleListMembers(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Team commands
  teamCommand
    .command("team:create")
    .description("Create a new team")
    .requiredOption("-n, --name <name>", "Team name")
    .requiredOption("-o, --owner-id <ownerId>", "Team owner ID")
    .option("-d, --description <description>", "Team description")
    .option("-v, --visibility <visibility>", "Team visibility", "private")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleCreateTeam(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("team:invite")
    .description("Invite someone to a team")
    .requiredOption("-t, --team-id <teamId>", "Team ID")
    .requiredOption("-e, --email <email>", "Email to invite")
    .requiredOption("-i, --invited-by <invitedBy>", "Inviter ID")
    .option("-r, --role <role>", "Role for the new member", "member")
    .option("-m, --message <message>", "Invitation message")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleInviteToTeam(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("team:accept-invitation")
    .description("Accept a team invitation")
    .requiredOption("-i, --invitation-id <invitationId>", "Invitation ID")
    .requiredOption("-m, --member-id <memberId>", "Member ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleAcceptInvitation(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Template commands
  teamCommand
    .command("template:create")
    .description("Create a project template")
    .requiredOption("-n, --name <name>", "Template name")
    .requiredOption("-c, --created-by <createdBy>", "Creator ID")
    .option("-d, --description <description>", "Template description")
    .option("--category <category>", "Template category", "general")
    .option("--public", "Make template public", false)
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleCreateTemplate({
          ...options,
          isPublic: options.public,
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("template:create-project")
    .description("Create project from template")
    .requiredOption("-i, --template-id <templateId>", "Template ID")
    .requiredOption("-n, --name <name>", "Project name")
    .requiredOption("-o, --owner-id <ownerId>", "Project owner ID")
    .option("-d, --description <description>", "Project description")
    .option("-t, --team-id <teamId>", "Team ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleCreateFromTemplate(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Analytics commands
  teamCommand
    .command("analytics:project")
    .description("Get project analytics")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleProjectAnalytics(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("analytics:member")
    .description("Get member analytics")
    .requiredOption("-m, --member-id <memberId>", "Member ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleMemberAnalytics(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("analytics:team")
    .description("Get team analytics")
    .requiredOption("-t, --team-id <teamId>", "Team ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleTeamAnalytics(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Export commands
  teamCommand
    .command("export:project")
    .description("Export project data")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .option("-f, --format <format>", "Export format (json/markdown)", "json")
    .option("-o, --output <outputPath>", "Output file path")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleExportProject(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("export:member")
    .description("Export member data")
    .requiredOption("-m, --member-id <memberId>", "Member ID")
    .option("-f, --format <format>", "Export format (json/markdown)", "json")
    .option("-o, --output <outputPath>", "Output file path")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleExportMember(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Utility commands
  teamCommand
    .command("search")
    .description("Search across teams, projects, and members")
    .requiredOption("-q, --query <query>", "Search query")
    .option(
      "-t, --type <type>",
      "Search type (all/projects/members/tasks)",
      "all",
    )
    .option("-l, --limit <limit>", "Maximum results", "20")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleSearch(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamCommand
    .command("dashboard")
    .description("Get member dashboard")
    .requiredOption("-m, --member-id <memberId>", "Member ID")
    .action(async (options) => {
      try {
        const handler = await getHandler();
        const result = await handler.handleDashboard(options);
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Help command
  teamCommand
    .command("help")
    .description("Show team command help")
    .action(() => {
      console.log(`
Team Collaboration Commands:

Project Management:
  team project:create     - Create a new team project
  team project:list       - List team projects
  team project:info       - Get project information
  team project:add-member - Add member to project

Task Management:
  team task:create        - Create a new task
  team task:update        - Update a task
  team task:list          - List project tasks

Member Management:
  team member:register    - Register a new team member
  team member:authenticate - Authenticate a member
  team member:list        - List team members

Team Management:
  team team:create        - Create a new team
  team team:invite        - Invite someone to a team
  team team:accept-invitation - Accept a team invitation

Templates:
  team template:create    - Create a project template
  team template:create-project - Create project from template

Analytics:
  team analytics:project  - Get project analytics
  team analytics:member   - Get member analytics
  team analytics:team     - Get team analytics

Export:
  team export:project     - Export project data
  team export:member      - Export member data

Utilities:
  team search             - Search across teams, projects, and members
  team dashboard          - Get member dashboard

Examples:
  naturecode team project:create --name "My Project" --owner-id "user@example.com"
  naturecode team task:create --project-id "proj_123" --title "Fix bug" --reporter-id "user@example.com"
  naturecode team member:register --email "new@example.com" --name "New User" --password "secret123"
      `);
    });

  return teamCommand;
}
