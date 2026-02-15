#!/usr/bin/env node

import { getWelcomeArt } from "./src/utils/ascii-art.js";

console.log(getWelcomeArt());

// 检查 package.json 版本
import { readFile } from "fs/promises";
const pkg = JSON.parse(await readFile("./package.json", "utf8"));
console.log("\nPackage.json version:", pkg.version);

// 检查 CLI 版本
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, "src/cli/index.js");
const cliContent = await readFile(cliPath, "utf8");
const versionMatch = cliContent.match(/\.version\("([^"]+)"\)/);
console.log("CLI version:", versionMatch ? versionMatch[1] : "Not found");
