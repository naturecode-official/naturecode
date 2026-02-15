#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { DependencyAnalyzer } from "./dependency-analyzer.js";

export class ProjectManager {
  constructor (baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this.dependencyAnalyzer = new DependencyAnalyzer(baseDir);
  }

  async analyzeProjectStructure (options = {}) {
    try {
      const structure = {
        path: this.baseDir,
        type: await this.detectProjectType(),
        files: [],
        directories: [],
        size: 0,
        fileCount: 0,
        directoryCount: 0,
        analysis: {},
      };

      await this.scanDirectory(this.baseDir, structure, options);

      // Analyze structure
      structure.analysis = await this.analyzeStructure(structure);

      return structure;
    } catch (error) {
      throw new Error(`Failed to analyze project structure: ${error.message}`);
    }
  }

  async detectProjectType () {
    const files = await fs.readdir(this.baseDir);

    // Check for common project files
    if (files.includes("package.json")) {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.baseDir, "package.json"), "utf-8"),
      );
      if (packageJson.dependencies && packageJson.dependencies.react) {
        return "react";
      } else if (packageJson.dependencies && packageJson.dependencies.vue) {
        return "vue";
      } else if (packageJson.dependencies && packageJson.dependencies.angular) {
        return "angular";
      } else if (
        files.includes("next.config.js") ||
        files.includes("next.config.ts")
      ) {
        return "nextjs";
      }
      return "nodejs";
    } else if (
      files.includes("requirements.txt") ||
      files.includes("pyproject.toml")
    ) {
      return "python";
    } else if (files.includes("pom.xml")) {
      return "java-maven";
    } else if (
      files.includes("build.gradle") ||
      files.includes("build.gradle.kts")
    ) {
      return "java-gradle";
    } else if (files.includes("Cargo.toml")) {
      return "rust";
    } else if (files.includes("go.mod")) {
      return "go";
    } else if (files.includes("composer.json")) {
      return "php";
    } else if (files.includes("Gemfile")) {
      return "ruby";
    } else if (files.includes("project.clj")) {
      return "clojure";
    } else if (files.includes("*.csproj")) {
      return "dotnet";
    }

    return "unknown";
  }

  async scanDirectory (currentPath, structure, options, depth = 0) {
    if (depth > (options.maxDepth || 5)) {
      return;
    }

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const relativePath = path.relative(this.baseDir, currentPath);

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativeEntryPath = relativePath
          ? path.join(relativePath, entry.name)
          : entry.name;

        // Skip excluded directories
        if (entry.isDirectory()) {
          if (options.excludeDirs && options.excludeDirs.includes(entry.name)) {
            continue;
          }
          if (entry.name.startsWith(".") && entry.name !== ".git") {
            continue;
          }

          structure.directories.push({
            name: entry.name,
            path: relativeEntryPath,
            depth: depth,
          });
          structure.directoryCount++;

          await this.scanDirectory(fullPath, structure, options, depth + 1);
        } else if (entry.isFile()) {
          // Skip hidden files (except .gitignore, .env, etc.)
          if (
            entry.name.startsWith(".") &&
            !this.isImportantDotFile(entry.name)
          ) {
            continue;
          }

          try {
            const stats = await fs.stat(fullPath);
            const ext = path.extname(entry.name).toLowerCase();

            structure.files.push({
              name: entry.name,
              path: relativeEntryPath,
              size: stats.size,
              extension: ext,
              modified: stats.mtime,
              depth: depth,
            });
            structure.fileCount++;
            structure.size += stats.size;
          } catch (error) {
            // Skip files we can't stat
            continue;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return;
    }
  }

  isImportantDotFile (filename) {
    const importantFiles = [
      ".gitignore",
      ".env",
      ".env.example",
      ".eslintrc",
      ".eslintrc.js",
      ".eslintrc.json",
      ".prettierrc",
      ".prettierrc.js",
      ".prettierrc.json",
      ".babelrc",
      ".babelrc.js",
      ".babelrc.json",
      ".npmrc",
      ".yarnrc",
      ".dockerignore",
      ".editorconfig",
      ".gitattributes",
      ".huskyrc",
    ];
    return importantFiles.includes(filename) || filename.startsWith(".env.");
  }

  async analyzeStructure (structure) {
    const analysis = {
      fileTypes: {},
      largestFiles: [],
      oldestFiles: [],
      newestFiles: [],
      directoryDepth: 0,
      recommendations: [],
    };

    // Analyze file types
    structure.files.forEach((file) => {
      const ext = file.extension || "no-extension";
      analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
    });

    // Find largest files
    analysis.largestFiles = [...structure.files]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    // Find oldest and newest files
    analysis.oldestFiles = [...structure.files]
      .sort((a, b) => a.modified - b.modified)
      .slice(0, 10);

    analysis.newestFiles = [...structure.files]
      .sort((a, b) => b.modified - a.modified)
      .slice(0, 10);

    // Calculate directory depth
    analysis.directoryDepth = Math.max(
      ...structure.directories.map((d) => d.depth),
      0,
    );

    // Generate recommendations
    analysis.recommendations = await this.generateRecommendations(
      structure,
      analysis,
    );

    return analysis;
  }

  async generateRecommendations (structure, analysis) {
    const recommendations = [];

    // Check for large files
    analysis.largestFiles.forEach((file) => {
      if (file.size > 1024 * 1024) {
        // 1MB
        recommendations.push({
          type: "large-file",
          message: `Large file detected: ${file.path} (${this.formatFileSize(file.size)})`,
          severity: "medium",
          suggestion: "Consider splitting large files or compressing assets",
        });
      }
    });

    // Check for deep directory structure
    if (analysis.directoryDepth > 6) {
      recommendations.push({
        type: "deep-directory",
        message: `Deep directory structure (max depth: ${analysis.directoryDepth})`,
        severity: "low",
        suggestion:
          "Consider flattening directory structure for better maintainability",
      });
    }

    // Check for too many files in root
    const rootFiles = structure.files.filter((f) => f.depth === 0);
    if (rootFiles.length > 20) {
      recommendations.push({
        type: "cluttered-root",
        message: `Many files (${rootFiles.length}) in project root`,
        severity: "low",
        suggestion: "Organize files into appropriate directories",
      });
    }

    // Check for missing common files
    const commonFiles = ["README.md", "LICENSE", ".gitignore", ".env.example"];
    const missingFiles = commonFiles.filter(
      (file) => !structure.files.some((f) => f.name === file),
    );

    if (missingFiles.length > 0) {
      recommendations.push({
        type: "missing-files",
        message: `Missing common project files: ${missingFiles.join(", ")}`,
        severity: "low",
        suggestion: "Add missing project files for better project management",
      });
    }

    return recommendations;
  }

  formatFileSize (bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async createProjectTemplate (templateType, options = {}) {
    const templates = {
      nodejs: this.createNodeJsTemplate.bind(this),
      react: this.createReactTemplate.bind(this),
      python: this.createPythonTemplate.bind(this),
      express: this.createExpressTemplate.bind(this),
    };

    const creator = templates[templateType];
    if (!creator) {
      throw new Error(`Unsupported template type: ${templateType}`);
    }

    try {
      await creator(options);
      return {
        success: true,
        template: templateType,
        createdFiles: await this.listCreatedFiles(this.baseDir),
      };
    } catch (error) {
      throw new Error(`Failed to create project template: ${error.message}`);
    }
  }

  async createNodeJsTemplate (options = {}) {
    const files = {
      "package.json": JSON.stringify(
        {
          name: options.name || "my-node-project",
          version: "1.0.0",
          description: options.description || "A Node.js project",
          main: "index.js",
          scripts: {
            start: "node index.js",
            dev: "nodemon index.js",
            test: "jest",
          },
          keywords: [],
          author: options.author || "",
          license: "MIT",
          dependencies: {},
          devDependencies: {},
        },
        null,
        2,
      ),

      "index.js": `// ${options.name || "My Node.js Project"}
console.log("Hello, World!");`,

      "README.md": `# ${options.name || "My Node.js Project"}

${options.description || "A Node.js project"}

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## Development
\`\`\`bash
npm run dev
\`\`\`

## Testing
\`\`\`bash
npm test
\`\`\`
`,

      ".gitignore": `node_modules/
.env
.DS_Store
*.log
`,

      ".env.example": `# Environment variables
NODE_ENV=development
PORT=3000
`,
    };

    await this.createFiles(files);
  }

  async createReactTemplate (options = {}) {
    const files = {
      "package.json": JSON.stringify(
        {
          name: options.name || "my-react-app",
          version: "1.0.0",
          private: true,
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0",
            "react-scripts": "5.0.0",
          },
          scripts: {
            start: "react-scripts start",
            build: "react-scripts build",
            test: "react-scripts test",
            eject: "react-scripts eject",
          },
          browserslist: {
            production: [">0.2%", "not dead", "not op_mini all"],
            development: [
              "last 1 chrome version",
              "last 1 firefox version",
              "last 1 safari version",
            ],
          },
        },
        null,
        2,
      ),

      "src/App.js": `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${options.name || "My React App"}</h1>
        <p>Edit <code>src/App.js</code> and save to reload.</p>
      </header>
    </div>
  );
}

export default App;
`,

      "src/App.css": `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
`,

      "src/index.js": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,

      "public/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="${options.description || "Web site created using create-react-app"}"
    />
    <title>${options.name || "React App"}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`,
    };

    await this.createFiles(files);
  }

  async createPythonTemplate (options = {}) {
    const files = {
      "requirements.txt": `# Python dependencies
flask>=2.0.0
`,

      "app.py": `# ${options.name || "My Python Project"}
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
`,

      "README.md": `# ${options.name || "My Python Project"}

${options.description || "A Python project"}

## Installation
\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage
\`\`\`bash
python app.py
\`\`\`
`,

      ".gitignore": `__pycache__/
*.pyc
.env
venv/
env/
`,
    };

    await this.createFiles(files);
  }

  async createExpressTemplate (options = {}) {
    const files = {
      "package.json": JSON.stringify(
        {
          name: options.name || "express-app",
          version: "1.0.0",
          description: options.description || "An Express.js application",
          main: "index.js",
          scripts: {
            start: "node index.js",
            dev: "nodemon index.js",
          },
          dependencies: {
            express: "^4.18.0",
            cors: "^2.8.5",
            helmet: "^7.0.0",
          },
          devDependencies: {
            nodemon: "^3.0.0",
          },
        },
        null,
        2,
      ),

      "index.js": `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${options.name || "Express App"}' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
`,

      "README.md": `# ${options.name || "Express App"}

${options.description || "An Express.js application"}

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
# or for development
npm run dev
\`\`\`

## API Endpoints
- GET / - Welcome message
- GET /api/health - Health check
`,
    };

    await this.createFiles(files);
  }

  async createFiles (files) {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(this.baseDir, filePath);
      const dir = path.dirname(fullPath);

      // Create directory if needed
      if (dir !== this.baseDir) {
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(fullPath, content, "utf-8");
    }
  }

  async listCreatedFiles (dir) {
    const files = [];

    async function scan (currentPath) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(dir, fullPath);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(relativePath);
        }
      }
    }

    await scan(dir);
    return files;
  }

  async setupProjectAutomation (options = {}) {
    const setupTasks = [];

    try {
      // 1. Initialize Git repository
      if (options.initGit !== false) {
        try {
          execSync("git init", { cwd: this.baseDir, stdio: "pipe" });
          setupTasks.push("Initialized Git repository");
        } catch (error) {
          setupTasks.push("Git initialization skipped or failed");
        }
      }

      // 2. Install dependencies
      if (options.installDeps !== false) {
        const projectType = await this.detectProjectType();

        if (projectType === "nodejs" || projectType.includes("react")) {
          try {
            execSync("npm install", { cwd: this.baseDir, stdio: "pipe" });
            setupTasks.push("Installed npm dependencies");
          } catch (error) {
            setupTasks.push("npm install failed");
          }
        } else if (projectType === "python") {
          try {
            execSync("pip install -r requirements.txt", {
              cwd: this.baseDir,
              stdio: "pipe",
            });
            setupTasks.push("Installed Python dependencies");
          } catch (error) {
            setupTasks.push("pip install failed");
          }
        }
      }

      // 3. Create initial commit
      if (options.createInitialCommit !== false) {
        try {
          execSync("git add .", { cwd: this.baseDir, stdio: "pipe" });
          execSync('git commit -m "Initial commit"', {
            cwd: this.baseDir,
            stdio: "pipe",
          });
          setupTasks.push("Created initial Git commit");
        } catch (error) {
          setupTasks.push("Git commit skipped or failed");
        }
      }

      return {
        success: true,
        tasks: setupTasks,
        projectType: await this.detectProjectType(),
      };
    } catch (error) {
      throw new Error(`Project automation setup failed: ${error.message}`);
    }
  }

  async getProjectHealth () {
    const analysis = await this.analyzeProjectStructure();
    const health = {
      score: 100,
      issues: [],
      strengths: [],
      recommendations: [],
    };

    // Check for README
    const hasReadme = analysis.files.some(
      (f) => f.name.toLowerCase() === "readme.md",
    );
    if (!hasReadme) {
      health.score -= 10;
      health.issues.push("Missing README.md file");
    } else {
      health.strengths.push("Has README documentation");
    }

    // Check for .gitignore
    const hasGitignore = analysis.files.some((f) => f.name === ".gitignore");
    if (!hasGitignore) {
      health.score -= 10;
      health.issues.push("Missing .gitignore file");
    } else {
      health.strengths.push("Has .gitignore for version control");
    }

    // Check for license
    const hasLicense = analysis.files.some((f) =>
      f.name.toLowerCase().includes("license"),
    );
    if (!hasLicense) {
      health.score -= 5;
      health.issues.push("Missing license file");
    } else {
      health.strengths.push("Has license file");
    }

    // Check for test files
    const hasTests = analysis.files.some(
      (f) =>
        f.path.includes("test") ||
        f.path.includes("spec") ||
        f.name.includes("test"),
    );
    if (!hasTests) {
      health.score -= 15;
      health.issues.push("No test files found");
    } else {
      health.strengths.push("Has test files");
    }

    // Check for documentation
    const hasDocs = analysis.files.some(
      (f) => f.path.includes("docs") || f.path.includes("documentation"),
    );
    if (!hasDocs) {
      health.score -= 5;
      health.issues.push("No documentation directory");
    } else {
      health.strengths.push("Has documentation");
    }

    // Check for configuration files
    const configFiles = [
      ".eslintrc",
      ".prettierrc",
      "tsconfig.json",
      "webpack.config.js",
    ];
    const hasConfig = configFiles.some((config) =>
      analysis.files.some((f) => f.name.includes(config)),
    );
    if (!hasConfig) {
      health.score -= 5;
      health.issues.push("Missing code quality configuration");
    } else {
      health.strengths.push("Has code quality configuration");
    }

    // Generate recommendations
    health.recommendations = analysis.analysis.recommendations;

    // Categorize health
    if (health.score >= 90) {
      health.status = "excellent";
    } else if (health.score >= 70) {
      health.status = "good";
    } else if (health.score >= 50) {
      health.status = "fair";
    } else {
      health.status = "needs-improvement";
    }

    return health;
  }

  async getDependencyUpgrades () {
    try {
      const packageManager =
        await this.dependencyAnalyzer.detectNodePackageManager();
      const analysis = await this.dependencyAnalyzer.analyzeDependencies();

      const upgrades = {
        available: [],
        recommendations: [],
        packageManager: packageManager,
        summary: {},
      };

      // Check for outdated packages using npm
      if (analysis.projectType === "nodejs") {
        try {
          const output = execSync("npm outdated --json", {
            cwd: this.baseDir,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          });

          if (output) {
            const outdated = JSON.parse(output);

            Object.entries(outdated).forEach(([name, info]) => {
              upgrades.available.push({
                name,
                current: info.current,
                wanted: info.wanted,
                latest: info.latest,
                type: info.type || "dependencies",
                upgradeType: this.getUpgradeType(info.current, info.latest),
              });
            });
          }
        } catch (error) {
          // npm outdated returns exit code 1 when outdated packages found
          if (error.stdout) {
            try {
              const outdated = JSON.parse(error.stdout);

              Object.entries(outdated).forEach(([name, info]) => {
                upgrades.available.push({
                  name,
                  current: info.current,
                  wanted: info.wanted,
                  latest: info.latest,
                  type: info.type || "dependencies",
                  upgradeType: this.getUpgradeType(info.current, info.latest),
                });
              });
            } catch (parseError) {
              // Ignore parse errors
            }
          }
        }
      }

      // Generate upgrade recommendations
      upgrades.recommendations = this.generateUpgradeRecommendations(
        upgrades.available,
      );

      // Generate summary
      upgrades.summary = {
        total: upgrades.available.length,
        major: upgrades.available.filter((u) => u.upgradeType === "major")
          .length,
        minor: upgrades.available.filter((u) => u.upgradeType === "minor")
          .length,
        patch: upgrades.available.filter((u) => u.upgradeType === "patch")
          .length,
      };

      return upgrades;
    } catch (error) {
      throw new Error(`Failed to check dependency upgrades: ${error.message}`);
    }
  }

  getUpgradeType (current, latest) {
    if (!current || !latest) return "unknown";

    const currentParts = current.split(".").map((n) => parseInt(n, 10));
    const latestParts = latest.split(".").map((n) => parseInt(n, 10));

    if (latestParts[0] > currentParts[0]) return "major";
    if (latestParts[1] > currentParts[1]) return "minor";
    if (latestParts[2] > currentParts[2]) return "patch";

    return "unknown";
  }

  generateUpgradeRecommendations (upgrades) {
    const recommendations = [];

    // Group by upgrade type
    const majorUpgrades = upgrades.filter((u) => u.upgradeType === "major");
    const minorUpgrades = upgrades.filter((u) => u.upgradeType === "minor");
    const patchUpgrades = upgrades.filter((u) => u.upgradeType === "patch");

    if (patchUpgrades.length > 0) {
      recommendations.push({
        priority: "high",
        type: "patch-upgrades",
        message: `${patchUpgrades.length} patch update(s) available`,
        suggestion:
          "Patch updates are generally safe and should be applied promptly for bug fixes and security updates.",
        packages: patchUpgrades.slice(0, 5).map((u) => u.name),
      });
    }

    if (minorUpgrades.length > 0) {
      recommendations.push({
        priority: "medium",
        type: "minor-upgrades",
        message: `${minorUpgrades.length} minor update(s) available`,
        suggestion:
          "Minor updates add new features but maintain backward compatibility. Review changelog before updating.",
        packages: minorUpgrades.slice(0, 5).map((u) => u.name),
      });
    }

    if (majorUpgrades.length > 0) {
      recommendations.push({
        priority: "low",
        type: "major-upgrades",
        message: `${majorUpgrades.length} major update(s) available`,
        suggestion:
          "Major updates may contain breaking changes. Review migration guides and test thoroughly before upgrading.",
        packages: majorUpgrades.slice(0, 5).map((u) => u.name),
      });
    }

    return recommendations;
  }

  async checkDependencyConflicts () {
    try {
      const conflicts = {
        found: [],
        warnings: [],
        resolutions: [],
      };

      const analysis = await this.dependencyAnalyzer.analyzeDependencies();

      if (analysis.projectType === "nodejs") {
        // Check for version conflicts in package.json
        const packageJsonPath = path.join(this.baseDir, "package.json");
        const packageJson = JSON.parse(
          await fs.readFile(packageJsonPath, "utf-8"),
        );

        // Check for duplicate dependencies (in both dependencies and devDependencies)
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});
        const duplicateNames = deps.filter((name) => devDeps.includes(name));

        duplicateNames.forEach((name) => {
          conflicts.found.push({
            type: "duplicate-dependency",
            package: name,
            message: `Dependency '${name}' appears in both dependencies and devDependencies`,
            severity: "low",
            resolution:
              "Move to appropriate section (dependencies or devDependencies)",
          });
        });

        // Check for conflicting peer dependencies
        try {
          const output = execSync("npm ls --json", {
            cwd: this.baseDir,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          });

          const tree = JSON.parse(output);

          if (tree.problems) {
            tree.problems.forEach((problem) => {
              if (
                problem.includes("peer dep") ||
                problem.includes("conflict")
              ) {
                conflicts.found.push({
                  type: "peer-dependency",
                  message: problem,
                  severity: "medium",
                });
              }
            });
          }
        } catch (error) {
          // npm ls returns non-zero exit code when there are issues
          if (error.stdout) {
            try {
              const tree = JSON.parse(error.stdout);

              if (tree.problems) {
                tree.problems.forEach((problem) => {
                  if (
                    problem.includes("peer dep") ||
                    problem.includes("conflict")
                  ) {
                    conflicts.found.push({
                      type: "peer-dependency",
                      message: problem,
                      severity: "medium",
                    });
                  } else if (problem.includes("missing")) {
                    conflicts.warnings.push({
                      type: "missing-dependency",
                      message: problem,
                      severity: "high",
                    });
                  }
                });
              }
            } catch (parseError) {
              // Ignore parse errors
            }
          }
        }

        // Generate resolutions
        conflicts.resolutions = this.generateConflictResolutions(
          conflicts.found,
        );
      }

      return conflicts;
    } catch (error) {
      throw new Error(`Failed to check dependency conflicts: ${error.message}`);
    }
  }

  generateConflictResolutions (conflicts) {
    const resolutions = [];

    conflicts.forEach((conflict) => {
      if (conflict.type === "peer-dependency") {
        resolutions.push({
          conflict: conflict.message,
          solution:
            "Install or upgrade the peer dependency to a compatible version",
          command: "npm install <peer-dependency>@<version>",
        });
      } else if (conflict.type === "missing-dependency") {
        resolutions.push({
          conflict: conflict.message,
          solution: "Install the missing dependency",
          command: "npm install",
        });
      } else if (conflict.type === "duplicate-dependency") {
        resolutions.push({
          conflict: conflict.message,
          solution: conflict.resolution || "Remove duplicate entry",
          command: "Edit package.json manually",
        });
      }
    });

    return resolutions;
  }

  async recommendPackageManager () {
    try {
      const recommendation = {
        current: await this.dependencyAnalyzer.detectNodePackageManager(),
        suggestions: [],
        analysis: {},
      };

      const analysis = await this.dependencyAnalyzer.analyzeDependencies();

      if (analysis.projectType !== "nodejs") {
        return {
          current: analysis.packageManager,
          suggestions: [],
          analysis: { message: `Project uses ${analysis.packageManager}` },
        };
      }

      // Analyze project characteristics
      const stats = await this.dependencyAnalyzer.getDependencyStats();
      const projectSize = stats.totalDependencies;

      // Check for monorepo
      const isMonorepo =
        (await this.fileExists(path.join(this.baseDir, "lerna.json"))) ||
        (await this.fileExists(path.join(this.baseDir, "nx.json"))) ||
        (await this.fileExists(path.join(this.baseDir, "pnpm-workspace.yaml")));

      // Check for existing lock files
      const hasYarnLock = await this.fileExists(
        path.join(this.baseDir, "yarn.lock"),
      );
      const hasPnpmLock = await this.fileExists(
        path.join(this.baseDir, "pnpm-lock.yaml"),
      );
      const hasNpmLock = await this.fileExists(
        path.join(this.baseDir, "package-lock.json"),
      );

      recommendation.analysis = {
        projectSize,
        isMonorepo,
        lockFiles: {
          yarn: hasYarnLock,
          pnpm: hasPnpmLock,
          npm: hasNpmLock,
        },
      };

      // Generate recommendations based on analysis
      if (isMonorepo) {
        recommendation.suggestions.push({
          packageManager: "pnpm",
          reason:
            "Best for monorepos with workspace support and efficient disk usage",
          pros: [
            "Efficient disk space usage",
            "Fast installation",
            "Built-in workspace support",
          ],
          cons: ["Stricter dependency resolution might require adjustments"],
          priority: "high",
        });
      }

      if (projectSize > 50) {
        recommendation.suggestions.push({
          packageManager: "pnpm",
          reason: "Excellent for large projects with many dependencies",
          pros: [
            "Fast installation",
            "Efficient disk usage",
            "Strict dependency resolution",
          ],
          cons: ["Learning curve if coming from npm/yarn"],
          priority: "medium",
        });

        recommendation.suggestions.push({
          packageManager: "yarn",
          reason: "Good performance for large projects",
          pros: [
            "Fast and reliable",
            "Good workspace support",
            "Offline cache",
          ],
          cons: ["Larger disk usage than pnpm"],
          priority: "medium",
        });
      } else {
        recommendation.suggestions.push({
          packageManager: "npm",
          reason: "Simple and reliable for small to medium projects",
          pros: ["Built into Node.js", "Widely used", "Good documentation"],
          cons: ["Slower than alternatives", "Less efficient disk usage"],
          priority: "medium",
        });
      }

      // If already using a package manager, recommend sticking with it
      if (hasYarnLock || hasPnpmLock || hasNpmLock) {
        recommendation.suggestions.unshift({
          packageManager: recommendation.current,
          reason:
            "Currently in use - switching package managers requires careful migration",
          pros: ["No migration needed", "Team already familiar"],
          cons: [],
          priority: "high",
        });
      }

      return recommendation;
    } catch (error) {
      throw new Error(`Failed to recommend package manager: ${error.message}`);
    }
  }

  async fileExists (filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default ProjectManager;
