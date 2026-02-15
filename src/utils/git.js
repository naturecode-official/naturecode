#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

class GitManager {
  constructor () {
    this.gitPath = this.findGitPath();
  }

  findGitPath () {
    try {
      const gitPath = execSync("which git || where git", {
        encoding: "utf8",
      }).trim();
      return gitPath;
    } catch (error) {
      throw new Error("Git is not installed or not in PATH");
    }
  }

  isGitRepository (dir = process.cwd()) {
    try {
      const gitDir = path.join(dir, ".git");
      return fs.existsSync(gitDir);
    } catch (error) {
      return false;
    }
  }

  getRepositoryRoot (dir = process.cwd()) {
    try {
      const output = execSync("git rev-parse --show-toplevel", {
        cwd: dir,
        encoding: "utf8",
      }).trim();
      return output;
    } catch (error) {
      throw new Error("Not a git repository");
    }
  }

  getCurrentBranch (dir = process.cwd()) {
    try {
      const output = execSync("git branch --show-current", {
        cwd: dir,
        encoding: "utf8",
      }).trim();
      return output;
    } catch (error) {
      throw new Error("Could not determine current branch");
    }
  }

  getStatus (dir = process.cwd()) {
    try {
      const output = execSync("git status --porcelain", {
        cwd: dir,
        encoding: "utf8",
      }).trim();

      const lines = output ? output.split("\n") : [];
      const changes = {
        staged: [],
        unstaged: [],
        untracked: [],
      };

      lines.forEach((line) => {
        if (line.length < 2) return;

        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status === "??") {
          changes.untracked.push(file);
        } else if (status[0] !== " " && status[1] !== " ") {
          changes.staged.push({ file, status });
          changes.unstaged.push({ file, status });
        } else if (status[0] !== " ") {
          changes.staged.push({ file, status: status[0] });
        } else if (status[1] !== " ") {
          changes.unstaged.push({ file, status: status[1] });
        }
      });

      return changes;
    } catch (error) {
      throw new Error(`Failed to get git status: ${error.message}`);
    }
  }

  getDiff (dir = process.cwd(), staged = false) {
    try {
      const command = staged ? "git diff --staged" : "git diff";
      const output = execSync(command, {
        cwd: dir,
        encoding: "utf8",
      }).trim();
      return output;
    } catch (error) {
      throw new Error(`Failed to get git diff: ${error.message}`);
    }
  }

  getLog (dir = process.cwd(), limit = 10) {
    try {
      const output = execSync(`git log --oneline -n ${limit}`, {
        cwd: dir,
        encoding: "utf8",
      }).trim();
      return output ? output.split("\n") : [];
    } catch (error) {
      throw new Error(`Failed to get git log: ${error.message}`);
    }
  }

  getRemoteInfo (dir = process.cwd()) {
    try {
      const output = execSync("git remote -v", {
        cwd: dir,
        encoding: "utf8",
      }).trim();

      const remotes = {};
      if (output) {
        output.split("\n").forEach((line) => {
          const [name, url, type] = line.split(/\s+/);
          if (!remotes[name]) {
            remotes[name] = { fetch: null, push: null };
          }
          if (type === "(fetch)") {
            remotes[name].fetch = url;
          } else if (type === "(push)") {
            remotes[name].push = url;
          }
        });
      }

      return remotes;
    } catch (error) {
      throw new Error(`Failed to get remote info: ${error.message}`);
    }
  }

  stageFiles (files, dir = process.cwd()) {
    try {
      const fileList = Array.isArray(files) ? files.join(" ") : files;
      execSync(`git add ${fileList}`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to stage files: ${error.message}`);
    }
  }

  commit (message, dir = process.cwd()) {
    try {
      const escapedMessage = message.replace(/"/g, '\\"');
      execSync(`git commit -m "${escapedMessage}"`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  push (branch = null, remote = "origin", dir = process.cwd()) {
    try {
      const branchName = branch || this.getCurrentBranch(dir);
      execSync(`git push ${remote} ${branchName}`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to push: ${error.message}`);
    }
  }

  pull (remote = "origin", branch = null, dir = process.cwd()) {
    try {
      const branchName = branch || this.getCurrentBranch(dir);
      execSync(`git pull ${remote} ${branchName}`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to pull: ${error.message}`);
    }
  }

  createBranch (name, dir = process.cwd()) {
    try {
      execSync(`git checkout -b ${name}`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  switchBranch (name, dir = process.cwd()) {
    try {
      execSync(`git checkout ${name}`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to switch branch: ${error.message}`);
    }
  }

  mergeBranch (name, dir = process.cwd()) {
    try {
      execSync(`git merge ${name}`, {
        cwd: dir,
        encoding: "utf8",
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to merge branch: ${error.message}`);
    }
  }

  getBranches (dir = process.cwd()) {
    try {
      const output = execSync("git branch -a", {
        cwd: dir,
        encoding: "utf8",
      }).trim();

      const branches = {
        local: [],
        remote: [],
        current: null,
      };

      if (output) {
        output.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("*")) {
            const branchName = trimmed.substring(2);
            branches.current = branchName;
            branches.local.push(branchName);
          } else if (trimmed.startsWith("remotes/")) {
            const branchName = trimmed.substring(8);
            branches.remote.push(branchName);
          } else if (trimmed) {
            branches.local.push(trimmed);
          }
        });
      }

      return branches;
    } catch (error) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  analyzeChanges (dir = process.cwd()) {
    try {
      const status = this.getStatus(dir);

      const analysis = {
        summary: {
          staged: status.staged.length,
          unstaged: status.unstaged.length,
          untracked: status.untracked.length,
        },
        fileTypes: {},
        suggestedActions: [],
      };

      const allFiles = [
        ...status.staged.map((s) => s.file),
        ...status.unstaged.map((s) => s.file),
        ...status.untracked,
      ];

      allFiles.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        if (ext) {
          analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
        }
      });

      if (status.untracked.length > 0) {
        analysis.suggestedActions.push("Add untracked files to staging area");
      }

      if (status.unstaged.length > 0) {
        analysis.suggestedActions.push("Stage changes before committing");
      }

      if (status.staged.length > 0) {
        analysis.suggestedActions.push("Commit staged changes");
      }

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze changes: ${error.message}`);
    }
  }

  generateCommitMessage (changes, dir = process.cwd()) {
    try {
      const status = this.getStatus(dir);
      const stagedFiles = status.staged.map((s) => s.file);

      if (stagedFiles.length === 0) {
        return "No changes to commit";
      }

      const fileTypes = {};
      stagedFiles.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        if (ext) {
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      });

      const typeCount = Object.keys(fileTypes).length;
      const totalFiles = stagedFiles.length;

      let message = "";

      if (totalFiles === 1) {
        const file = stagedFiles[0];
        const ext = path.extname(file);
        const baseName = path.basename(file, ext);
        message = `Update ${baseName}${ext}`;
      } else if (typeCount === 1) {
        const ext = Object.keys(fileTypes)[0];
        message = `Update ${totalFiles} ${ext.substring(1)} files`;
      } else {
        message = `Update ${totalFiles} files`;
      }

      return message;
    } catch (error) {
      throw new Error(`Failed to generate commit message: ${error.message}`);
    }
  }

  validate () {
    try {
      if (!this.gitPath) {
        throw new Error("Git not found");
      }

      execSync("git --version", { encoding: "utf8" });
      return true;
    } catch (error) {
      throw new Error(`Git validation failed: ${error.message}`);
    }
  }
}

export const gitManager = new GitManager();

export default gitManager;
