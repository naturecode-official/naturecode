import fs from "fs/promises";
import path from "path";
import os from "os";
import readline from "readline";
import chalk from "chalk";

export class FeedbackCollector {
  constructor() {
    this.feedbackDir = path.join(os.homedir(), ".naturecode");
    this.feedbackFile = path.join(this.feedbackDir, "feedback.json");
    this.ensureFeedbackDir();
  }

  async ensureFeedbackDir() {
    try {
      await fs.mkdir(this.feedbackDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async collectSessionFeedback(sessionData) {
    const feedback = {
      timestamp: new Date().toISOString(),
      version: process.env.NATURECODE_VERSION || "1.4.7",
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      session: sessionData,
    };

    try {
      let allFeedback = [];
      try {
        const existing = await fs.readFile(this.feedbackFile, "utf-8");
        allFeedback = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
      }

      allFeedback.push(feedback);

      // Keep only last 100 feedback entries
      if (allFeedback.length > 100) {
        allFeedback = allFeedback.slice(-100);
      }

      await fs.writeFile(
        this.feedbackFile,
        JSON.stringify(allFeedback, null, 2),
        "utf-8",
      );

      if (process.env.NODE_ENV === "development") {
        console.log(
          chalk.gray(
            `[Feedback] Session data saved: ${sessionData.messages} messages, ${sessionData.fileOperations} file operations`,
          ),
        );
      }
    } catch (error) {
      // Silently fail for feedback collection
      if (process.env.NODE_ENV === "development") {
        console.error(chalk.gray(`[Feedback Error] ${error.message}`));
      }
    }
  }

  async collectExplicitFeedback() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(chalk.cyan("\n=== NatureCode Feedback ==="));
    console.log(chalk.white("We value your feedback to improve NatureCode!"));
    console.log(
      chalk.white("Please answer a few questions (press Enter to skip):\n"),
    );

    const questions = [
      {
        question: "How would you rate your overall experience? (1-5)",
        key: "rating",
      },
      {
        question: "What did you like most about NatureCode?",
        key: "likes",
      },
      {
        question: "What could be improved?",
        key: "improvements",
      },
      {
        question: "Did you encounter any issues or bugs?",
        key: "issues",
      },
      {
        question: "What features would you like to see in future versions?",
        key: "featureRequests",
      },
      {
        question: "Any other comments or suggestions?",
        key: "comments",
      },
    ];

    const feedback = {
      timestamp: new Date().toISOString(),
      version: process.env.NATURECODE_VERSION || "1.4.7",
      platform: os.platform(),
      arch: os.arch(),
    };

    for (const q of questions) {
      const answer = await new Promise((resolve) => {
        rl.question(chalk.yellow(`• ${q.question}\n  `), resolve);
      });

      if (answer.trim()) {
        feedback[q.key] = answer.trim();
      }
    }

    rl.close();

    // Save feedback
    try {
      let allFeedback = [];
      try {
        const existing = await fs.readFile(this.feedbackFile, "utf-8");
        allFeedback = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist or is invalid
      }

      allFeedback.push(feedback);

      // Keep only last 50 explicit feedback entries
      if (allFeedback.length > 50) {
        allFeedback = allFeedback.slice(-50);
      }

      await fs.writeFile(
        this.feedbackFile,
        JSON.stringify(allFeedback, null, 2),
        "utf-8",
      );

      console.log(chalk.green("\nThank you for your feedback!"));
      console.log(
        chalk.white(
          "Your feedback has been saved and will help improve NatureCode.",
        ),
      );
    } catch (error) {
      console.log(chalk.yellow("\nNote: Could not save feedback locally."));
      console.log(
        chalk.white("You can still provide feedback via GitHub Issues."),
      );
    }

    return feedback;
  }

  async showFeedbackSummary() {
    try {
      const data = await fs.readFile(this.feedbackFile, "utf-8");
      const feedbacks = JSON.parse(data);

      console.log(chalk.cyan("\n=== Feedback Summary ==="));
      console.log(chalk.white(`Total feedback entries: ${feedbacks.length}`));

      if (feedbacks.length > 0) {
        const ratings = feedbacks
          .filter((f) => f.rating)
          .map((f) => parseInt(f.rating));
        if (ratings.length > 0) {
          const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          console.log(
            chalk.white(
              `Average rating: ${avgRating.toFixed(1)}/5 (${ratings.length} ratings)`,
            ),
          );
        }

        const latest = feedbacks[feedbacks.length - 1];
        console.log(
          chalk.white(
            `Latest feedback: ${new Date(latest.timestamp).toLocaleDateString()}`,
          ),
        );
      }

      console.log(
        chalk.yellow("\nTo provide feedback, run: naturecode feedback"),
      );
    } catch (error) {
      // No feedback file yet
    }
  }

  async exportFeedback() {
    try {
      const data = await fs.readFile(this.feedbackFile, "utf-8");
      const exportFile = path.join(
        process.cwd(),
        `naturecode-feedback-${Date.now()}.json`,
      );
      await fs.writeFile(exportFile, data, "utf-8");

      console.log(chalk.green(`Feedback exported to: ${exportFile}`));
      console.log(
        chalk.white("You can share this file with the development team."),
      );
      return exportFile;
    } catch (error) {
      console.log(chalk.yellow("No feedback data to export."));
      return null;
    }
  }
}

// Create singleton instance
export const feedbackCollector = new FeedbackCollector();

// CLI command handler
export async function handleFeedbackCommand() {
  const collector = new FeedbackCollector();
  await collector.collectExplicitFeedback();
}

// Session tracking
export class SessionTracker {
  constructor() {
    this.sessionStart = Date.now();
    this.messageCount = 0;
    this.fileOperations = 0;
    this.errors = 0;
  }

  incrementMessageCount() {
    this.messageCount++;
  }

  incrementFileOperations() {
    this.fileOperations++;
  }

  incrementErrors() {
    this.errors++;
  }

  getSessionData() {
    return {
      duration: Date.now() - this.sessionStart,
      messages: this.messageCount,
      fileOperations: this.fileOperations,
      errors: this.errors,
      successRate:
        this.messageCount > 0
          ? (
              ((this.messageCount - this.errors) / this.messageCount) *
              100
            ).toFixed(1) + "%"
          : "N/A",
    };
  }

  async saveSessionFeedback() {
    const sessionData = this.getSessionData();
    await feedbackCollector.collectSessionFeedback(sessionData);
    return sessionData;
  }
}
