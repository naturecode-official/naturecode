#!/usr/bin/env node

import { gitCommandHandler } from "../../utils/git-commands.js";
import { exitWithError } from "../../utils/error-handler.js";
import { formatResponse } from "../../utils/formatter.js";

export async function runGitCommand(options) {
  try {
    const command = options.command;
    const args = {
      dir: options.dir || process.cwd(),
      message: options.message,
      files: options.files ? options.files.split(",") : [],
      staged: options.staged,
      limit: options.limit || 10,
      branch: options.branch,
      remote: options.remote || "origin",
      action: options.action,
    };

    if (!command) {
      console.log("Available git commands:");
      const commands = gitCommandHandler.getAvailableCommands();
      commands.forEach((cmd) => {
        console.log(`  ${cmd.command.padEnd(12)} - ${cmd.description}`);
      });
      console.log("\nUsage: naturecode git <command> [options]");
      return;
    }

    const result = await gitCommandHandler.handleCommand(command, args);

    if (result.success) {
      if (options.json) {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        displayGitResult(command, result.data);
      }
    } else {
      console.log(`Git ${command} failed: ${result.message}`);
      if (result.suggestion) {
        console.log(`Suggestion: ${result.suggestion}`);
      }
    }
  } catch (error) {
    exitWithError(error, "Git Command");
  }
}

function displayGitResult(command, data) {
  switch (command) {
    case "status":
      displayStatus(data);
      break;
    case "diff":
      displayDiff(data);
      break;
    case "log":
      displayLog(data);
      break;
    case "analyze":
      displayAnalyze(data);
      break;
    case "suggest":
      displaySuggest(data);
      break;
    case "branch":
      displayBranch(data);
      break;
    case "remote":
      displayRemote(data);
      break;
    default:
      console.log(formatResponse(`Git ${command} completed successfully`));
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
  }
}

function displayStatus(data) {
  console.log("\n" + "=".repeat(60));
  console.log(`Repository: ${data.repository}`);
  console.log(`Branch:     ${data.branch}`);
  console.log("=".repeat(60));

  if (data.summary.staged > 0) {
    console.log("\nStaged changes:");
    data.changes.staged.forEach((change) => {
      console.log(`  ${change.status} ${change.file}`);
    });
  }

  if (data.summary.unstaged > 0) {
    console.log("\nUnstaged changes:");
    data.changes.unstaged.forEach((change) => {
      console.log(`  ${change.status} ${change.file}`);
    });
  }

  if (data.summary.untracked > 0) {
    console.log("\nUntracked files:");
    data.changes.untracked.forEach((file) => {
      console.log(`  ?? ${file}`);
    });
  }

  console.log("\n" + "-".repeat(60));
  console.log(
    `Summary: ${data.summary.staged} staged, ${data.summary.unstaged} unstaged, ${data.summary.untracked} untracked`,
  );
}

function displayDiff(data) {
  console.log("\n" + "=".repeat(60));
  console.log(`Git Diff ${data.staged ? "(staged)" : "(unstaged)"}`);
  console.log("=".repeat(60));

  if (data.diff) {
    console.log(data.diff);
  } else {
    console.log("No changes found");
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Total: ${data.summary}`);
}

function displayLog(data) {
  console.log("\n" + "=".repeat(60));
  console.log(`Git Log (last ${data.limit} commits)`);
  console.log("=".repeat(60));

  if (data.commits.length > 0) {
    data.commits.forEach((commit, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${commit}`);
    });
  } else {
    console.log("No commits found");
  }

  console.log("\n" + "-".repeat(60));
  console.log(`Total commits shown: ${data.count}`);
}

function displayAnalyze(data) {
  console.log("\n" + "=".repeat(60));
  console.log(`Repository Analysis: ${data.repository}`);
  console.log(`Current Branch:      ${data.branch}`);
  console.log("=".repeat(60));

  const analysis = data.analysis;

  console.log("\nChange Summary:");
  console.log(`  Staged changes:   ${analysis.summary.staged}`);
  console.log(`  Unstaged changes: ${analysis.summary.unstaged}`);
  console.log(`  Untracked files:  ${analysis.summary.untracked}`);

  if (Object.keys(analysis.fileTypes).length > 0) {
    console.log("\nFile Types:");
    Object.entries(analysis.fileTypes).forEach(([ext, count]) => {
      console.log(`  ${ext.padEnd(8)}: ${count} files`);
    });
  }

  if (analysis.suggestedActions.length > 0) {
    console.log("\nSuggested Actions:");
    analysis.suggestedActions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action}`);
    });
  }

  console.log("\n" + "-".repeat(60));
}

function displaySuggest(data) {
  console.log("\n" + "=".repeat(60));
  console.log("Git Action Suggestions");
  console.log("=".repeat(60));

  if (data.suggestions.length > 0) {
    console.log("\nRecommended actions:");
    data.suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.action}`);
      console.log(`   ${suggestion.description}`);
      console.log(`   Command: ${suggestion.command}`);
    });
  } else {
    console.log("\nNo suggestions - repository is clean!");
  }

  if (data.commitMessage && data.commitMessage !== "No changes to commit") {
    console.log("\nSuggested commit message:");
    console.log(`  "${data.commitMessage}"`);
  }

  console.log("\n" + "-".repeat(60));
  console.log(
    `Summary: ${data.summary.staged} staged, ${data.summary.unstaged} unstaged, ${data.summary.untracked} untracked`,
  );
}

function displayBranch(data) {
  console.log("\n" + "=".repeat(60));
  console.log("Git Branches");
  console.log("=".repeat(60));

  if (data.current) {
    console.log(`\nCurrent branch: ${data.current}`);
  }

  if (data.local.length > 0) {
    console.log("\nLocal branches:");
    data.local.forEach((branch) => {
      const prefix = branch === data.current ? "* " : "  ";
      console.log(`${prefix}${branch}`);
    });
  }

  if (data.remote.length > 0) {
    console.log("\nRemote branches:");
    data.remote.forEach((branch) => {
      console.log(`  ${branch}`);
    });
  }

  console.log("\n" + "-".repeat(60));
  console.log(
    `Total: ${data.local.length} local, ${data.remote.length} remote`,
  );
}

function displayRemote(data) {
  console.log("\n" + "=".repeat(60));
  console.log("Git Remotes");
  console.log("=".repeat(60));

  if (Object.keys(data.remotes).length > 0) {
    Object.entries(data.remotes).forEach(([name, info]) => {
      console.log(`\n${name}:`);
      if (info.fetch) console.log(`  Fetch: ${info.fetch}`);
      if (info.push) console.log(`  Push:  ${info.push}`);
    });
  } else {
    console.log("\nNo remotes configured");
    console.log("Add a remote with: git remote add origin <url>");
  }

  console.log("\n" + "-".repeat(60));
}

export default {
  runGitCommand,
};
