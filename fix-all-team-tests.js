import fs from "fs";
import path from "path";

// 修复 team-commands.test.js
const teamCommandsTestPath = path.join(
  process.cwd(),
  "tests/team/team-commands.test.js",
);
let teamCommandsContent = fs.readFileSync(teamCommandsTestPath, "utf8");

// 修复所有测试函数的异步声明
const testPatterns = [
  // Project Commands
  {
    from: 'test("should handle project:list command", () => {',
    to: 'test("should handle project:list command", async () => {',
  },
  {
    from: 'test("should handle project:info command", () => {',
    to: 'test("should handle project:info command", async () => {',
  },
  {
    from: 'test("should handle project:update command", () => {',
    to: 'test("should handle project:update command", async () => {',
  },
  {
    from: 'test("should handle project:delete command", () => {',
    to: 'test("should handle project:delete command", async () => {',
  },
  {
    from: 'test("should handle project:add-member command", () => {',
    to: 'test("should handle project:add-member command", async () => {',
  },
  {
    from: 'test("should handle project:remove-member command", () => {',
    to: 'test("should handle project:remove-member command", async () => {',
  },

  // Task Commands
  {
    from: 'test("should handle task:create command", () => {',
    to: 'test("should handle task:create command", async () => {',
  },
  {
    from: 'test("should handle task:update command", () => {',
    to: 'test("should handle task:update command", async () => {',
  },
  {
    from: 'test("should handle task:list command", () => {',
    to: 'test("should handle task:list command", async () => {',
  },
  {
    from: 'test("should handle task:info command", () => {',
    to: 'test("should handle task:info command", async () => {',
  },
  {
    from: 'test("should handle task:delete command", () => {',
    to: 'test("should handle task:delete command", async () => {',
  },

  // Member Commands
  {
    from: 'test("should handle member:register command", () => {',
    to: 'test("should handle member:register command", async () => {',
  },
  {
    from: 'test("should handle member:authenticate command", () => {',
    to: 'test("should handle member:authenticate command", async () => {',
  },
  {
    from: 'test("should handle member:list command", () => {',
    to: 'test("should handle member:list command", async () => {',
  },
  {
    from: 'test("should handle member:info command", () => {',
    to: 'test("should handle member:info command", async () => {',
  },
  {
    from: 'test("should handle member:update command", () => {',
    to: 'test("should handle member:update command", async () => {',
  },
  {
    from: 'test("should handle member:change-password command", () => {',
    to: 'test("should handle member:change-password command", async () => {',
  },

  // Team Commands
  {
    from: 'test("should handle team:create command", () => {',
    to: 'test("should handle team:create command", async () => {',
  },
  {
    from: 'test("should handle team:list command", () => {',
    to: 'test("should handle team:list command", async () => {',
  },
  {
    from: 'test("should handle team:info command", () => {',
    to: 'test("should handle team:info command", async () => {',
  },
  {
    from: 'test("should handle team:invite command", () => {',
    to: 'test("should handle team:invite command", async () => {',
  },
  {
    from: 'test("should handle team:accept-invitation command", () => {',
    to: 'test("should handle team:accept-invitation command", async () => {',
  },
  {
    from: 'test("should handle team:reject-invitation command", () => {',
    to: 'test("should handle team:reject-invitation command", async () => {',
  },

  // Template Commands
  {
    from: 'test("should handle template:create command", () => {',
    to: 'test("should handle template:create command", async () => {',
  },
  {
    from: 'test("should handle template:create-project command", () => {',
    to: 'test("should handle template:create-project command", async () => {',
  },

  // Analytics Commands
  {
    from: 'test("should handle analytics:project command", () => {',
    to: 'test("should handle analytics:project command", async () => {',
  },
  {
    from: 'test("should handle analytics:member command", () => {',
    to: 'test("should handle analytics:member command", async () => {',
  },
  {
    from: 'test("should handle analytics:team command", () => {',
    to: 'test("should handle analytics:team command", async () => {',
  },
  {
    from: 'test("should handle analytics:system command", () => {',
    to: 'test("should handle analytics:system command", async () => {',
  },

  // Export Commands
  {
    from: 'test("should handle export:project command", () => {',
    to: 'test("should handle export:project command", async () => {',
  },
  {
    from: 'test("should handle export:member command", () => {',
    to: 'test("should handle export:member command", async () => {',
  },

  // Utility Commands
  {
    from: 'test("should handle search command", () => {',
    to: 'test("should handle search command", async () => {',
  },
  {
    from: 'test("should handle dashboard command", () => {',
    to: 'test("should handle dashboard command", async () => {',
  },
  {
    from: 'test("should handle help command", () => {',
    to: 'test("should handle help command", async () => {',
  },

  // Error Handling
  {
    from: 'test("should handle invalid command", () => {',
    to: 'test("should handle invalid command", async () => {',
  },
  {
    from: 'test("should handle missing required parameters", () => {',
    to: 'test("should handle missing required parameters", async () => {',
  },
  {
    from: 'test("should handle validation errors", () => {',
    to: 'test("should handle validation errors", async () => {',
  },
  {
    from: 'test("should handle not found errors", () => {',
    to: 'test("should handle not found errors", async () => {',
  },
];

// 应用所有替换
testPatterns.forEach((pattern) => {
  const escapedFrom = pattern.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedFrom, "g");
  teamCommandsContent = teamCommandsContent.replace(regex, pattern.to);
});

// 修复所有 commandHandler.handleCommand 调用，添加 await
teamCommandsContent = teamCommandsContent.replace(
  /commandHandler\.handleCommand\(/g,
  "await commandHandler.handleCommand(",
);

// 修复 beforeEach 中的异步调用
teamCommandsContent = teamCommandsContent.replace(
  /beforeEach\(\(\) => {/g,
  "beforeEach(async () => {",
);

// 修复测试中的同步调用
teamCommandsContent = teamCommandsContent.replace(
  /memberManager\.registerMember\(/g,
  "await memberManager.registerMember(",
);
teamCommandsContent = teamCommandsContent.replace(
  /memberManager\.authenticateMember\(/g,
  "await memberManager.authenticateMember(",
);
teamCommandsContent = teamCommandsContent.replace(
  /projectManager\.createProject\(/g,
  "await projectManager.createProject(",
);
teamCommandsContent = teamCommandsContent.replace(
  /projectManager\.createTemplate\(/g,
  "await projectManager.createTemplate(",
);

fs.writeFileSync(teamCommandsTestPath, teamCommandsContent, "utf8");
console.log(" 修复了 team-commands.test.js");

// 修复 integration.test.js
const integrationTestPath = path.join(
  process.cwd(),
  "tests/team/integration.test.js",
);
let integrationContent = fs.readFileSync(integrationTestPath, "utf8");

// 修复集成测试中的异步问题
integrationContent = integrationContent.replace(
  /test\("should create member and project", \(\) => {/g,
  'test("should create member and project", async () => {',
);
integrationContent = integrationContent.replace(
  /test\("should authenticate member and create task", \(\) => {/g,
  'test("should authenticate member and create task", async () => {',
);
integrationContent = integrationContent.replace(
  /test\("should create team and add members", \(\) => {/g,
  'test("should create team and add members", async () => {',
);
integrationContent = integrationContent.replace(
  /test\("should create project from template", \(\) => {/g,
  'test("should create project from template", async () => {',
);
integrationContent = integrationContent.replace(
  /test\("should generate project analytics", \(\) => {/g,
  'test("should generate project analytics", async () => {',
);

// 修复异步调用
integrationContent = integrationContent.replace(
  /memberManager\.registerMember\(/g,
  "await memberManager.registerMember(",
);
integrationContent = integrationContent.replace(
  /memberManager\.authenticateMember\(/g,
  "await memberManager.authenticateMember(",
);
integrationContent = integrationContent.replace(
  /projectManager\.createProject\(/g,
  "await projectManager.createProject(",
);
integrationContent = integrationContent.replace(
  /projectManager\.createTemplate\(/g,
  "await projectManager.createTemplate(",
);
integrationContent = integrationContent.replace(
  /memberManager\.createTeam\(/g,
  "await memberManager.createTeam(",
);

fs.writeFileSync(integrationTestPath, integrationContent, "utf8");
console.log(" 修复了 integration.test.js");

// 修复其他团队测试文件
const teamTestFiles = [
  "project-manager.test.js",
  "member-manager.test.js",
  "simple.test.js",
];

teamTestFiles.forEach((filename) => {
  const filePath = path.join(process.cwd(), "tests/team", filename);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");

    // 修复测试函数
    content = content.replace(/test\("/g, 'test("');

    // 修复异步调用
    content = content.replace(/\.registerMember\(/g, ".registerMember(");
    content = content.replace(/\.createProject\(/g, ".createProject(");

    fs.writeFileSync(filePath, content, "utf8");
    console.log(` 修复了 ${filename}`);
  }
});

console.log("\n 所有团队测试已修复完成！");
