#!/usr/bin/env node

import { gitManager } from "./git.js";
import { exitWithError } from "./error-handler.js";

class GitCommandHandler {
  constructor() {
    this.commands = {
      status: this.handleStatus.bind(this),
      diff: this.handleDiff.bind(this),
      log: this.handleLog.bind(this),
      commit: this.handleCommit.bind(this),
      push: this.handlePush.bind(this),
      pull: this.handlePull.bind(this),
      branch: this.handleBranch.bind(this),
      checkout: this.handleCheckout.bind(this),
      merge: this.handleMerge.bind(this),
      add: this.handleAdd.bind(this),
      remote: this.handleRemote.bind(this),
      analyze: this.handleAnalyze.bind(this),
      suggest: this.handleSuggest.bind(this),
    };
  }

  async handleCommand(command, args = {}) {
    try {
      if (!this.commands[command]) {
        throw new Error(`Unknown git command: ${command}`);
      }

      const result = await this.commands[command](args);
      return result;
    } catch (error) {
      exitWithError(error, "Git Command");
    }
  }

  async handleStatus(args) {
    try {
      const dir = args.dir || process.cwd();

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
          suggestion: "Initialize git repository with 'git init' first",
        };
      }

      const status = gitManager.getStatus(dir);
      const currentBranch = gitManager.getCurrentBranch(dir);
      const repoRoot = gitManager.getRepositoryRoot(dir);

      return {
        success: true,
        data: {
          repository: repoRoot,
          branch: currentBranch,
          changes: status,
          summary: {
            staged: status.staged.length,
            unstaged: status.unstaged.length,
            untracked: status.untracked.length,
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to get git status: ${error.message}`);
    }
  }

  async handleDiff(args) {
    try {
      const dir = args.dir || process.cwd();
      const staged = args.staged || false;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      const diff = gitManager.getDiff(dir, staged);
      const summary = diff
        ? diff.split("\n").filter((l) => l.startsWith("+") || l.startsWith("-"))
            .length
        : 0;

      return {
        success: true,
        data: {
          diff,
          staged,
          summary: `${summary} changes`,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get git diff: ${error.message}`);
    }
  }

  async handleLog(args) {
    try {
      const dir = args.dir || process.cwd();
      const limit = args.limit || 10;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      const log = gitManager.getLog(dir, limit);

      return {
        success: true,
        data: {
          commits: log,
          count: log.length,
          limit,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get git log: ${error.message}`);
    }
  }

  async handleCommit(args) {
    try {
      const dir = args.dir || process.cwd();
      const message = args.message;
      const files = args.files;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      if (files && files.length > 0) {
        gitManager.stageFiles(files, dir);
      }

      if (!message) {
        const generatedMessage = gitManager.generateCommitMessage({}, dir);
        return {
          success: false,
          message: "Commit message required",
          suggestion: `Suggested message: "${generatedMessage}"`,
        };
      }

      gitManager.commit(message, dir);

      return {
        success: true,
        data: {
          message,
          committed: true,
        },
      };
    } catch (error) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  async handlePush(args) {
    try {
      const dir = args.dir || process.cwd();
      const branch = args.branch;
      const remote = args.remote || "origin";

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      gitManager.push(branch, remote, dir);

      return {
        success: true,
        data: {
          remote,
          branch: branch || gitManager.getCurrentBranch(dir),
          pushed: true,
        },
      };
    } catch (error) {
      throw new Error(`Failed to push: ${error.message}`);
    }
  }

  async handlePull(args) {
    try {
      const dir = args.dir || process.cwd();
      const branch = args.branch;
      const remote = args.remote || "origin";

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      gitManager.pull(remote, branch, dir);

      return {
        success: true,
        data: {
          remote,
          branch: branch || gitManager.getCurrentBranch(dir),
          pulled: true,
        },
      };
    } catch (error) {
      throw new Error(`Failed to pull: ${error.message}`);
    }
  }

  async handleBranch(args) {
    try {
      const dir = args.dir || process.cwd();
      const action = args.action || "list";
      const name = args.name;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      if (action === "create" && name) {
        gitManager.createBranch(name, dir);
        return {
          success: true,
          data: {
            action: "created",
            branch: name,
          },
        };
      } else if (action === "list") {
        const branches = gitManager.getBranches(dir);
        return {
          success: true,
          data: branches,
        };
      }

      return {
        success: false,
        message: `Unknown branch action: ${action}`,
      };
    } catch (error) {
      throw new Error(`Failed to handle branch: ${error.message}`);
    }
  }

  async handleCheckout(args) {
    try {
      const dir = args.dir || process.cwd();
      const branch = args.branch;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      if (!branch) {
        return {
          success: false,
          message: "Branch name required",
        };
      }

      gitManager.switchBranch(branch, dir);

      return {
        success: true,
        data: {
          switchedTo: branch,
        },
      };
    } catch (error) {
      throw new Error(`Failed to checkout branch: ${error.message}`);
    }
  }

  async handleMerge(args) {
    try {
      const dir = args.dir || process.cwd();
      const branch = args.branch;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      if (!branch) {
        return {
          success: false,
          message: "Branch name required",
        };
      }

      gitManager.mergeBranch(branch, dir);

      return {
        success: true,
        data: {
          merged: branch,
        },
      };
    } catch (error) {
      throw new Error(`Failed to merge branch: ${error.message}`);
    }
  }

  async handleAdd(args) {
    try {
      const dir = args.dir || process.cwd();
      const files = args.files;

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      if (!files || files.length === 0) {
        return {
          success: false,
          message: "Files to add required",
        };
      }

      gitManager.stageFiles(files, dir);

      return {
        success: true,
        data: {
          staged: files,
        },
      };
    } catch (error) {
      throw new Error(`Failed to add files: ${error.message}`);
    }
  }

  async handleRemote(args) {
    try {
      const dir = args.dir || process.cwd();

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      const remotes = gitManager.getRemoteInfo(dir);

      return {
        success: true,
        data: {
          remotes,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get remote info: ${error.message}`);
    }
  }

  async handleAnalyze(args) {
    try {
      const dir = args.dir || process.cwd();

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
        };
      }

      const analysis = gitManager.analyzeChanges(dir);
      const currentBranch = gitManager.getCurrentBranch(dir);
      const repoRoot = gitManager.getRepositoryRoot(dir);

      return {
        success: true,
        data: {
          repository: repoRoot,
          branch: currentBranch,
          analysis,
        },
      };
    } catch (error) {
      throw new Error(`Failed to analyze changes: ${error.message}`);
    }
  }

  async handleSuggest(args) {
    try {
      const dir = args.dir || process.cwd();

      if (!gitManager.isGitRepository(dir)) {
        return {
          success: false,
          message: "Not a git repository",
          suggestion: "Initialize git repository with 'git init' first",
        };
      }

      const status = gitManager.getStatus(dir);
      const commitMessage = gitManager.generateCommitMessage({}, dir);
      const analysis = gitManager.analyzeChanges(dir);

      const suggestions = [];

      if (status.untracked.length > 0) {
        suggestions.push({
          action: "Add untracked files",
          command: `git add ${status.untracked.slice(0, 3).join(" ")}${status.untracked.length > 3 ? " ..." : ""}`,
          description: `${status.untracked.length} untracked files found`,
        });
      }

      if (status.unstaged.length > 0) {
        suggestions.push({
          action: "Stage changes",
          command: "git add .",
          description: `${status.unstaged.length} uncommitted changes`,
        });
      }

      if (status.staged.length > 0) {
        suggestions.push({
          action: "Commit staged changes",
          command: `git commit -m "${commitMessage}"`,
          description: `${status.staged.length} staged changes ready to commit`,
        });
      }

      const branches = gitManager.getBranches(dir);
      if (branches.remote.length > 0) {
        suggestions.push({
          action: "Sync with remote",
          command: "git pull",
          description: "Update local repository with remote changes",
        });
      }

      return {
        success: true,
        data: {
          suggestions,
          commitMessage,
          summary: analysis.summary,
        },
      };
    } catch (error) {
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }
  }

  getAvailableCommands() {
    return Object.keys(this.commands).map((cmd) => ({
      command: cmd,
      description: this.getCommandDescription(cmd),
    }));
  }

  getCommandDescription(command) {
    const descriptions = {
      status: "Show repository status and changes",
      diff: "Show changes between commits, commit and working tree, etc",
      log: "Show commit logs",
      commit: "Record changes to the repository",
      push: "Update remote refs along with associated objects",
      pull: "Fetch from and integrate with another repository or a local branch",
      branch: "List, create, or delete branches",
      checkout: "Switch branches or restore working tree files",
      merge: "Join two or more development histories together",
      add: "Add file contents to the index",
      remote: "Manage set of tracked repositories",
      analyze: "Analyze repository changes and provide insights",
      suggest: "Get suggestions for next git actions",
    };

    return descriptions[command] || "No description available";
  }
}

export const gitCommandHandler = new GitCommandHandler();

export default gitCommandHandler;
