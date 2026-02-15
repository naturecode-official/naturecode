// Team code review integration CLI commands

import { Command } from "commander";
import { TeamCodeReviewIntegration } from "../../utils/team/code-review-integration.js";
import { TeamProjectManager } from "../../utils/team/project-manager.js";
import { TeamMemberManager } from "../../utils/team/member-manager.js";
import { PermissionManager } from "../../utils/team/permissions.js";
import fs from "fs";
import path from "path";

export function createTeamReviewCommand() {
  const teamReviewCommand = new Command("team-review")
    .description("Team-based code review and collaboration")
    .configureHelp({ showGlobalOptions: true });

  let reviewIntegration = null;

  const getIntegration = async () => {
    if (!reviewIntegration) {
      const projectManager = new TeamProjectManager();
      const memberManager = new TeamMemberManager();
      const permissionManager = new PermissionManager();

      reviewIntegration = new TeamCodeReviewIntegration({
        projectManager,
        memberManager,
        permissionManager,
      });

      await reviewIntegration.initialize();
    }
    return reviewIntegration;
  };

  // Project code review
  teamReviewCommand
    .command("project:review")
    .description("Review project code with team standards")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .option(
      "-d, --directory <directory>",
      "Directory to review (default: current)",
    )
    .option("-f, --files <files>", "Comma-separated file paths")
    .option("-r, --reviewer-id <reviewerId>", "Reviewer ID")
    .option("--format <format>", "Output format (text, json, markdown)", "text")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        let filePaths = [];
        if (options.files) {
          filePaths = options.files.split(",").map((f) => f.trim());
        }

        let results;
        if (options.directory) {
          results = await integration.reviewProjectDirectory(
            options.projectId,
            path.resolve(options.directory),
            {
              reviewerId: options.reviewerId,
              format: options.format,
            },
          );
        } else if (filePaths.length > 0) {
          results = await integration.reviewProjectCode(
            options.projectId,
            filePaths,
            {
              reviewerId: options.reviewerId,
              format: options.format,
            },
          );
        } else {
          results = await integration.reviewProjectDirectory(
            options.projectId,
            process.cwd(),
            {
              reviewerId: options.reviewerId,
              format: options.format,
            },
          );
        }

        if (options.format === "json") {
          console.log(JSON.stringify(results, null, 2));
        } else {
          console.log("Code Review Results:");
          console.log("====================");
          console.log(`Project: ${options.projectId}`);
          console.log(`Files reviewed: ${results.filesReviewed}`);
          console.log(`Total issues: ${results.totalIssues}`);
          console.log("");

          if (results.issues && results.issues.length > 0) {
            console.log("Issues found:");
            results.issues.forEach((issue) => {
              console.log(`\n${issue.file}:${issue.line}`);
              console.log(`  Severity: ${issue.severity}`);
              console.log(`  Category: ${issue.category}`);
              console.log(`  Rule: ${issue.ruleId}`);
              console.log(`  Message: ${issue.message}`);
            });
          } else {
            console.log("No issues found!");
          }
        }
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Review sessions
  teamReviewCommand
    .command("session:create")
    .description("Create a team review session")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .option("-f, --files <files>", "Comma-separated file paths")
    .option("-c, --created-by <createdBy>", "Created by user", "system")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const sessionConfig = {
          files: options.files
            ? options.files.split(",").map((f) => f.trim())
            : [],
          createdBy: options.createdBy,
        };

        const session = await integration.createReviewSession(
          options.projectId,
          sessionConfig,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Review session created: ${session.id}`,
              session,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamReviewCommand
    .command("session:join")
    .description("Join a review session")
    .requiredOption("-s, --session-id <sessionId>", "Session ID")
    .requiredOption("-m, --member-id <memberId>", "Member ID")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const session = await integration.joinReviewSession(
          options.sessionId,
          options.memberId,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Member ${options.memberId} joined session ${options.sessionId}`,
              session,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamReviewCommand
    .command("session:review")
    .description("Review files in a session")
    .requiredOption("-s, --session-id <sessionId>", "Session ID")
    .option("-r, --reviewer-id <reviewerId>", "Reviewer ID")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const results = await integration.reviewSessionFiles(
          options.sessionId,
          {
            reviewerId: options.reviewerId,
          },
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Session ${options.sessionId} reviewed`,
              results: {
                filesReviewed: results.filesReviewed,
                totalIssues: results.totalIssues,
                issuesBySeverity: results.issuesBySeverity,
              },
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Review assignments
  teamReviewCommand
    .command("assignment:create")
    .description("Create a review assignment")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .requiredOption("-a, --assignee-id <assigneeId>", "Assignee ID")
    .option("-r, --reviewer-id <reviewerId>", "Reviewer ID")
    .option("-f, --files <files>", "Comma-separated file paths")
    .option("--priority <priority>", "Priority (high, medium, low)", "medium")
    .option("--due-date <dueDate>", "Due date (YYYY-MM-DD)")
    .option("--created-by <createdBy>", "Created by user", "system")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const assignmentConfig = {
          assigneeId: options.assigneeId,
          reviewerId: options.reviewerId,
          files: options.files
            ? options.files.split(",").map((f) => f.trim())
            : [],
          priority: options.priority,
          dueDate: options.dueDate,
          createdBy: options.createdBy,
        };

        const assignment = await integration.createReviewAssignment(
          options.projectId,
          assignmentConfig,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Review assignment created: ${assignment.id}`,
              assignment,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  teamReviewCommand
    .command("assignment:list")
    .description("List review assignments")
    .option("-p, --project-id <projectId>", "Filter by project ID")
    .option(
      "-m, --member-id <memberId>",
      "Filter by member ID (assignee or reviewer)",
    )
    .option("-s, --status <status>", "Filter by status (pending, completed)")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const filters = {};
        if (options.projectId) filters.projectId = options.projectId;
        if (options.memberId) {
          filters.assigneeId = options.memberId;
          filters.reviewerId = options.memberId;
        }
        if (options.status) filters.status = options.status;

        const assignments = await integration.getReviewAssignmentsForMember(
          options.memberId || "all",
          filters,
        );

        console.log("Review Assignments:");
        console.log("===================");

        assignments.forEach((assignment) => {
          console.log(`\n${assignment.id}:`);
          console.log(`  Project: ${assignment.projectId}`);
          console.log(`  Assignee: ${assignment.assigneeId || "Not assigned"}`);
          console.log(`  Reviewer: ${assignment.reviewerId || "Not assigned"}`);
          console.log(`  Status: ${assignment.status}`);
          console.log(`  Priority: ${assignment.priority}`);
          console.log(`  Files: ${assignment.files.length}`);
          if (assignment.dueDate) {
            console.log(`  Due: ${assignment.dueDate}`);
          }
          console.log(`  Created: ${assignment.createdAt}`);
        });
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Team standards
  teamReviewCommand
    .command("standards:get")
    .description("Get project team standards")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const standards = await integration.getProjectTeamStandards(
          options.projectId,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              standards,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Collaborative review
  teamReviewCommand
    .command("collaborative:start")
    .description("Start a collaborative review session")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .option("-f, --files <files>", "Comma-separated file paths")
    .option("-c, --created-by <createdBy>", "Created by user", "system")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const reviewConfig = {
          files: options.files
            ? options.files.split(",").map((f) => f.trim())
            : [],
          createdBy: options.createdBy,
        };

        const collaborativeReview = await integration.startCollaborativeReview(
          options.projectId,
          reviewConfig,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: "Collaborative review session started",
              collaborativeReview,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Comments
  teamReviewCommand
    .command("comment:add")
    .description("Add comment to review session")
    .requiredOption("-s, --session-id <sessionId>", "Session ID")
    .requiredOption("-f, --file <filePath>", "File path")
    .requiredOption("-l, --line <lineNumber>", "Line number")
    .requiredOption("-c, --comment <comment>", "Comment text")
    .requiredOption("-m, --member-id <memberId>", "Commenter ID")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const reviewComment = await integration.addCommentToReview(
          options.sessionId,
          options.file,
          parseInt(options.line),
          options.comment,
          options.memberId,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: "Comment added to review",
              comment: reviewComment,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Analytics
  teamReviewCommand
    .command("analytics:project")
    .description("Get project review analytics")
    .requiredOption("-p, --project-id <projectId>", "Project ID")
    .option("-t, --timeframe <timeframe>", "Timeframe (7d, 30d, 90d)", "30d")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const analytics = await integration.getProjectReviewAnalytics(
          options.projectId,
          options.timeframe,
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              analytics,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Cleanup
  teamReviewCommand
    .command("cleanup")
    .description("Clean up old review sessions and assignments")
    .option("--max-age <days>", "Maximum age in days", "30")
    .action(async (options) => {
      try {
        const integration = await getIntegration();

        const cleanedCount = await integration.cleanupOldSessions(
          parseInt(options.maxAge),
        );

        console.log(
          JSON.stringify(
            {
              success: true,
              message: `Cleaned up ${cleanedCount} old sessions and assignments`,
              cleanedCount,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    });

  // Help command
  teamReviewCommand
    .command("help")
    .description("Show team review command help")
    .action(() => {
      console.log("NatureCode Team Code Review Commands");
      console.log("=====================================");
      console.log("");
      console.log("Project Review:");
      console.log(
        "  team-review project:review    - Review project code with team standards",
      );
      console.log("");
      console.log("Review Sessions:");
      console.log(
        "  team-review session:create    - Create a team review session",
      );
      console.log("  team-review session:join      - Join a review session");
      console.log(
        "  team-review session:review    - Review files in a session",
      );
      console.log("");
      console.log("Review Assignments:");
      console.log(
        "  team-review assignment:create - Create a review assignment",
      );
      console.log("  team-review assignment:list   - List review assignments");
      console.log("");
      console.log("Team Standards:");
      console.log(
        "  team-review standards:get     - Get project team standards",
      );
      console.log("");
      console.log("Collaborative Review:");
      console.log(
        "  team-review collaborative:start - Start a collaborative review session",
      );
      console.log(
        "  team-review comment:add       - Add comment to review session",
      );
      console.log("");
      console.log("Analytics:");
      console.log(
        "  team-review analytics:project - Get project review analytics",
      );
      console.log("");
      console.log("Maintenance:");
      console.log(
        "  team-review cleanup          - Clean up old review sessions",
      );
      console.log("");
      console.log("Examples:");
      console.log(
        "  naturecode team-review project:review --project-id proj_123 --directory src/",
      );
      console.log(
        '  naturecode team-review session:create --project-id proj_123 --files "src/file1.js,src/file2.js"',
      );
      console.log(
        "  naturecode team-review assignment:create --project-id proj_123 --assignee-id user@example.com --priority high",
      );
      console.log(
        "  naturecode team-review analytics:project --project-id proj_123 --timeframe 7d",
      );
    });

  return teamReviewCommand;
}
