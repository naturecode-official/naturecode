// Code review functionality for AI internal use
// This module provides code review capabilities for AI providers

import { reviewCommandHandler } from "../../utils/review-commands.js";

/**
 * Perform code review for AI internal use
 * @param {Object} options - Review options
 * @param {string} options.command - Review command (file, dir, project)
 * @param {string} [options.file] - File to review
 * @param {string} [options.dir] - Directory to review
 * @param {boolean} [options.useAI=true] - Enable AI-powered review
 * @param {string} [options.severity] - Filter by severity
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.format="text"] - Output format
 * @param {string[]} [options.exclude] - Patterns to exclude
 * @param {string[]} [options.include] - Patterns to include
 * @param {number} [options.limit=50] - Limit number of issues
 * @returns {Promise<Object>} Review results
 */
export async function performCodeReview(options) {
  const args = {
    file: options.file,
    dir: options.dir || process.cwd(),
    useAI: options.useAI !== false,
    severity: options.severity,
    category: options.category,
    format: options.format || "text",
    exclude: options.exclude || [],
    include: options.include || [],
    limit: options.limit || 50,
    config: options.config,
  };

  const command = options.command || "file";

  try {
    const result = await reviewCommandHandler.handleCommand(command, args);
    return result;
  } catch (error) {
    throw new Error(`Code review failed: ${error.message}`);
  }
}

/**
 * Get available review commands for AI reference
 * @returns {Array} List of available review commands
 */
export function getReviewCommands() {
  return reviewCommandHandler.getAvailableCommands();
}

/**
 * Get review rules by category for AI reference
 * @param {string} [category] - Filter by category
 * @returns {Array} List of review rules
 */
export function getReviewRules(category) {
  // This would need to be implemented based on the actual review rules system
  return [];
}
