import fs from "fs/promises";
import path from "path";

export async function collectFeedback(feedback, feedbackFile) {
  try {
    // Validate feedback data
    if (!feedback || typeof feedback !== "object") {
      throw new Error("Feedback must be an object");
    }

    if (
      !feedback.message ||
      typeof feedback.message !== "string" ||
      feedback.message.trim() === ""
    ) {
      throw new Error("Feedback message is required and cannot be empty");
    }

    if (feedback.rating !== undefined) {
      if (
        typeof feedback.rating !== "number" ||
        feedback.rating < 1 ||
        feedback.rating > 5
      ) {
        throw new Error("Rating must be a number between 1 and 5");
      }
    }

    let feedbackData = { feedback: [] };

    try {
      const content = await fs.readFile(feedbackFile, "utf8");
      feedbackData = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
    }

    const feedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...feedback,
    };

    feedbackData.feedback.push(feedbackEntry);

    await fs.writeFile(feedbackFile, JSON.stringify(feedbackData, null, 2));

    return {
      success: true,
      id: feedbackEntry.id,
      timestamp: feedbackEntry.timestamp,
    };
  } catch (error) {
    throw new Error(`Failed to collect feedback: ${error.message}`);
  }
}

export async function showFeedback(feedbackFile, filters = {}) {
  try {
    let feedbackData = { feedback: [] };

    try {
      const content = await fs.readFile(feedbackFile, "utf8");
      feedbackData = JSON.parse(content);
    } catch (error) {
      // File doesn't exist, return empty
      if (error.code === "ENOENT") {
        return [];
      }
      // File is corrupted, throw error
      if (error instanceof SyntaxError) {
        throw new Error("Feedback file is corrupted");
      }
      // Other errors, return empty
      return [];
    }

    let feedbackList = feedbackData.feedback || [];

    // Apply filters
    if (filters.minRating !== undefined) {
      feedbackList = feedbackList.filter((f) => f.rating >= filters.minRating);
    }

    if (filters.startDate !== undefined) {
      feedbackList = feedbackList.filter(
        (f) => f.timestamp >= filters.startDate,
      );
    }

    if (filters.sessionId !== undefined) {
      feedbackList = feedbackList.filter(
        (f) => f.sessionId === filters.sessionId,
      );
    }

    // Sort by timestamp (newest first)
    return feedbackList.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    throw new Error(`Failed to show feedback: ${error.message}`);
  }
}

export async function clearFeedback(feedbackFile) {
  try {
    let feedbackData = { feedback: [] };
    let originalCount = 0;

    try {
      const content = await fs.readFile(feedbackFile, "utf8");
      feedbackData = JSON.parse(content);
      originalCount = feedbackData.feedback?.length || 0;
    } catch (error) {
      // File doesn't exist or is invalid
    }

    feedbackData.feedback = [];
    await fs.writeFile(feedbackFile, JSON.stringify(feedbackData, null, 2));

    return {
      success: true,
      clearedCount: originalCount,
    };
  } catch (error) {
    throw new Error(`Failed to clear feedback: ${error.message}`);
  }
}

export async function getFeedbackStats(feedbackFile) {
  try {
    let feedbackData = { feedback: [] };

    try {
      const content = await fs.readFile(feedbackFile, "utf8");
      feedbackData = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is invalid
    }

    const feedbackList = feedbackData.feedback || [];
    const withRating = feedbackList.filter((f) => f.rating !== undefined);
    const withoutRating = feedbackList.filter((f) => f.rating === undefined);

    let averageRating = 0;
    if (withRating.length > 0) {
      const totalRating = withRating.reduce((sum, f) => sum + f.rating, 0);
      averageRating = totalRating / withRating.length;
    }

    const ratingDistribution = {};
    withRating.forEach((f) => {
      const rating = f.rating.toString();
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    return {
      total: feedbackList.length,
      withRating: withRating.length,
      withoutRating: withoutRating.length,
      averageRating,
      ratingDistribution,
    };
  } catch (error) {
    throw new Error(`Failed to get feedback stats: ${error.message}`);
  }
}
