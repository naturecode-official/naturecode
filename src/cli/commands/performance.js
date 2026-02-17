// Performance monitoring functionality for AI startup
// Automatically shows performance info in top-left corner when AI starts

import { PerformanceCommandHandler } from "../../utils/performance/performance-commands.js";

/**
 * Performance monitor for AI startup
 */
export class PerformanceMonitor {
  constructor() {
    this.handler = null;
    this.monitoring = false;
    this.updateInterval = null;
    this.lastStats = null;
  }

  /**
   * Initialize performance monitor
   */
  async initialize() {
    this.handler = new PerformanceCommandHandler();
    await this.handler.initialize();
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring() {
    if (this.monitoring) return;

    try {
      await this.handler.handleCommand("performance:monitor", {
        action: "start",
        duration: 0, // indefinite
      });
      this.monitoring = true;

      // Start periodic stats update
      this.updateInterval = setInterval(() => {
        this.updateStats();
      }, 2000); // Update every 2 seconds

      // Initial stats
      await this.updateStats();
    } catch (error) {
      console.error("Failed to start performance monitoring:", error.message);
    }
  }

  /**
   * Stop performance monitoring
   */
  async stopMonitoring() {
    if (!this.monitoring) return;

    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      await this.handler.handleCommand("performance:monitor", {
        action: "stop",
      });
      this.monitoring = false;
    } catch (error) {
      console.error("Failed to stop performance monitoring:", error.message);
    }
  }

  /**
   * Update performance statistics
   */
  async updateStats() {
    try {
      const report = await this.handler.handleCommand("performance:report", {
        format: "summary",
      });
      this.lastStats = report.summary;
    } catch (error) {
      // Silently fail - performance monitoring is non-critical
    }
  }

  /**
   * Get current performance stats
   * @returns {Object} Performance statistics
   */
  getCurrentStats() {
    return (
      this.lastStats || {
        system: {
          memory: "N/A",
          cpu: "N/A",
          network: "N/A",
        },
        operations: {
          total: 0,
          slowest: "N/A",
          averageDuration: "N/A",
        },
        alerts: 0,
        recommendations: 0,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Format performance stats for display
   * @returns {string} Formatted performance info
   */
  formatStatsForDisplay() {
    const stats = this.getCurrentStats();

    // Simple format for top-left corner display
    return `🖥️ ${stats.system.cpu} | 🧠 ${stats.system.memory} | 📊 ${stats.operations.total} ops`;
  }

  /**
   * Get detailed performance info
   * @returns {string} Detailed performance information
   */
  getDetailedInfo() {
    const stats = this.getCurrentStats();

    return `
Performance Status
==================
System:
  Memory: ${stats.system.memory}
  CPU: ${stats.system.cpu}
  Network: ${stats.system.network}

Operations:
  Total: ${stats.operations.total}
  Slowest: ${stats.operations.slowest}
  Average: ${stats.operations.averageDuration}

Alerts: ${stats.alerts}
Recommendations: ${stats.recommendations}

Last Updated: ${new Date(stats.timestamp).toLocaleTimeString()}
    `.trim();
  }

  /**
   * Get optimization suggestions
   * @returns {Promise<Array>} Optimization suggestions
   */
  async getOptimizationSuggestions() {
    try {
      const result = await this.handler.handleCommand("performance:optimize", {
        type: "general",
        level: "medium",
      });
      return result.suggestions || [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Create and initialize performance monitor
 * @returns {Promise<PerformanceMonitor>} Performance monitor instance
 */
export async function createPerformanceMonitor() {
  const monitor = new PerformanceMonitor();
  await monitor.initialize();
  return monitor;
}
