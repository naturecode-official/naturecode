import chalk from "chalk";
import fs from "fs";
import path from "path";

/**
 * Format code changes with side-by-side diff view
 * Left side: original code with deletions in red
 * Right side: new code with additions in green
 * Shows line numbers and limited context (max 20 lines)
 */
export function formatCodeDiff(filePath, oldContent, newContent) {
  if (!fs.existsSync(filePath)) {
    // New file
    return formatNewFile(filePath, newContent);
  }

  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  // Simple diff algorithm - find changed lines
  const diffs = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || "";
    const newLine = newLines[i] || "";

    if (oldLine !== newLine) {
      diffs.push({
        lineNumber: i + 1,
        oldLine,
        newLine,
        type: oldLine === "" ? "add" : newLine === "" ? "delete" : "modify",
      });
    }
  }

  if (diffs.length === 0) {
    return chalk.gray("┃ No changes detected");
  }

  // Get context around changes (max 10 lines before/after)
  const contextLines = 10;
  const startLine = Math.max(1, diffs[0].lineNumber - contextLines);
  const endLine = Math.min(
    maxLines,
    diffs[diffs.length - 1].lineNumber + contextLines,
  );

  const output = [];
  output.push(chalk.cyan(`┃ Editing: ${path.basename(filePath)}`));
  output.push(chalk.gray("┃" + "─".repeat(78)));

  // Header
  output.push(
    chalk.yellow("┃ Left: Original") +
      " ".repeat(30) +
      chalk.yellow("Right: New"),
  );
  output.push(chalk.gray("┃" + "─".repeat(78)));

  // Display lines with context
  for (let i = startLine - 1; i < endLine; i++) {
    const lineNum = i + 1;
    const oldLine = oldLines[i] || "";
    const newLine = newLines[i] || "";
    const isChanged = diffs.some((d) => d.lineNumber === lineNum);

    let leftDisplay = "";
    let rightDisplay = "";

    if (isChanged) {
      if (oldLine === "") {
        // Addition
        leftDisplay = chalk.gray(" ".repeat(4));
        rightDisplay = chalk.green(
          `+ ${lineNum.toString().padStart(3)} ${newLine}`,
        );
      } else if (newLine === "") {
        // Deletion
        leftDisplay = chalk.red(
          `- ${lineNum.toString().padStart(3)} ${oldLine}`,
        );
        rightDisplay = chalk.gray(" ".repeat(4));
      } else {
        // Modification
        leftDisplay = chalk.red(
          `- ${lineNum.toString().padStart(3)} ${oldLine}`,
        );
        rightDisplay = chalk.green(
          `+ ${lineNum.toString().padStart(3)} ${newLine}`,
        );
      }
    } else {
      // Unchanged line
      leftDisplay = chalk.gray(
        `  ${lineNum.toString().padStart(3)} ${oldLine}`,
      );
      rightDisplay = chalk.gray(
        `  ${lineNum.toString().padStart(3)} ${newLine}`,
      );
    }

    // Pad to align columns
    const leftPadded = leftDisplay.padEnd(40);
    output.push(`┃ ${leftPadded}  ${rightDisplay}`);
  }

  output.push(chalk.gray("┃" + "─".repeat(78)));
  output.push(
    chalk.green(
      `┃ Changes applied: ${diffs.length} line${diffs.length !== 1 ? "s" : ""}`,
    ),
  );

  return output.join("\n");
}

/**
 * Format new file creation
 */
function formatNewFile(filePath, content) {
  const lines = content.split("\n");
  const output = [];

  output.push(chalk.cyan(`┃ Creating new file: ${path.basename(filePath)}`));
  output.push(chalk.gray("┃" + "─".repeat(78)));

  // Show first 20 lines or less
  const displayLines = Math.min(lines.length, 20);
  for (let i = 0; i < displayLines; i++) {
    const lineNum = i + 1;
    output.push(
      chalk.green(`┃ + ${lineNum.toString().padStart(3)} ${lines[i]}`),
    );
  }

  if (lines.length > 20) {
    output.push(chalk.gray(`┃ ... and ${lines.length - 20} more lines`));
  }

  output.push(chalk.gray("┃" + "─".repeat(78)));
  output.push(chalk.green(`┃ File created with ${lines.length} lines`));

  return output.join("\n");
}

/**
 * Format simple message with ┃ prefix
 */
export function formatMessage(message, type = "info") {
  const colors = {
    info: chalk.blue,
    user: chalk.cyan,
    ai: chalk.white,
    system: chalk.gray,
    error: chalk.red,
    success: chalk.green,
  };

  const color = colors[type] || chalk.white;
  return color(`┃ ${message}`);
}

/**
 * Format user input with ┃ prefix
 */
export function formatUserInput(input) {
  return chalk.cyan(`┃ 👤 ${input}`);
}

/**
 * Format AI response (normal formatting)
 */
export function formatAIResponse(response) {
  // Use existing formatResponse for AI responses
  return response;
}

/**
 * Format command execution result
 */
export function formatCommandResult(result) {
  const lines = result.split("\n");
  const output = [];

  output.push(chalk.green("┃ Command executed successfully:"));
  output.push(chalk.gray("┃" + "─".repeat(78)));

  for (const line of lines) {
    output.push(chalk.gray(`┃ ${line}`));
  }

  return output.join("\n");
}
