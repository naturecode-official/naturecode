// Performance monitoring and optimization for v1.4.3
// Provides performance tracking, optimization suggestions, and monitoring

import fs from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import os from "os";

export class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      trackMemory: config.trackMemory !== false,
      trackCPU: config.trackCPU !== false,
      trackDisk: config.trackDisk !== false,
      trackNetwork: config.trackNetwork !== false,
      samplingInterval: config.samplingInterval || 5000, // 5 seconds
      maxHistory: config.maxHistory || 100,
      ...config,
    };

    this.metrics = {
      memory: [],
      cpu: [],
      disk: [],
      network: [],
      operations: new Map(),
    };

    this.timers = new Map();
    this.history = [];
    this.monitoring = false;
    this.intervalId = null;
  }

  async initialize() {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // Start monitoring if configured
      if (this.config.trackMemory || this.config.trackCPU) {
        this.startMonitoring();
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize performance monitor:", error);
      return false;
    }
  }

  startMonitoring() {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.samplingInterval);

    // Performance monitoring started silently
  }

  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.monitoring = false;
    // Performance monitoring stopped silently
  }

  collectSystemMetrics() {
    const timestamp = Date.now();
    const metrics = {
      timestamp,
      memory: {},
      cpu: {},
      disk: {},
      network: {},
    };

    // Memory metrics
    if (this.config.trackMemory) {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      metrics.memory = {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercentage: (usedMem / totalMem) * 100,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        arrayBuffers: process.memoryUsage().arrayBuffers,
      };

      this.metrics.memory.push(metrics.memory);
      if (this.metrics.memory.length > this.config.maxHistory) {
        this.metrics.memory.shift();
      }
    }

    // CPU metrics
    if (this.config.trackCPU) {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - (100 * idle) / total;

      metrics.cpu = {
        cores: cpus.length,
        usagePercentage: usage,
        model: cpus[0]?.model || "Unknown",
        speed: cpus[0]?.speed || 0,
        loadavg: os.loadavg(),
      };

      this.metrics.cpu.push(metrics.cpu);
      if (this.metrics.cpu.length > this.config.maxHistory) {
        this.metrics.cpu.shift();
      }
    }

    // Disk metrics (simplified - would need more sophisticated tracking)
    if (this.config.trackDisk) {
      metrics.disk = {
        platform: os.platform(),
        arch: os.arch(),
        homedir: os.homedir(),
        tmpdir: os.tmpdir(),
      };

      this.metrics.disk.push(metrics.disk);
      if (this.metrics.disk.length > this.config.maxHistory) {
        this.metrics.disk.shift();
      }
    }

    // Network metrics (simplified)
    if (this.config.trackNetwork) {
      const networkInterfaces = os.networkInterfaces();
      metrics.network = {
        interfaces: Object.keys(networkInterfaces).length,
        hasInternet: this.checkInternetConnectivity(),
      };

      this.metrics.network.push(metrics.network);
      if (this.metrics.network.length > this.config.maxHistory) {
        this.metrics.network.shift();
      }
    }

    // Add to history
    this.history.push(metrics);
    if (this.history.length > this.config.maxHistory) {
      this.history.shift();
    }

    return metrics;
  }

  checkInternetConnectivity() {
    // Simplified check - in production would use actual network check
    try {
      const networkInterfaces = os.networkInterfaces();
      for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
          if (!iface.internal && iface.family === "IPv4") {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  startOperation(operationName) {
    if (!this.config.enabled) {
      return null;
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const timerId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.timers.set(timerId, {
      name: operationName,
      startTime,
      startMemory,
      startTimestamp: Date.now(),
    });

    return timerId;
  }

  endOperation(timerId) {
    if (!this.config.enabled || !this.timers.has(timerId)) {
      return null;
    }

    const timer = this.timers.get(timerId);
    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const duration = endTime - timer.startTime;
    const memoryDiff = {
      heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal,
      external: endMemory.external - timer.startMemory.external,
      arrayBuffers: endMemory.arrayBuffers - timer.startMemory.arrayBuffers,
      rss: endMemory.rss - timer.startMemory.rss,
    };

    const operationMetrics = {
      name: timer.name,
      duration,
      memoryDiff,
      startTimestamp: timer.startTimestamp,
      endTimestamp: Date.now(),
    };

    // Store operation metrics
    if (!this.metrics.operations.has(timer.name)) {
      this.metrics.operations.set(timer.name, []);
    }

    const operations = this.metrics.operations.get(timer.name);
    operations.push(operationMetrics);

    // Keep only recent operations
    if (operations.length > 50) {
      operations.shift();
    }

    // Remove timer
    this.timers.delete(timerId);

    return operationMetrics;
  }

  async measureAsyncOperation(operationName, asyncFunction) {
    const timerId = this.startOperation(operationName);

    try {
      const result = await asyncFunction();
      const metrics = this.endOperation(timerId);
      return { result, metrics };
    } catch (error) {
      this.endOperation(timerId);
      throw error;
    }
  }

  getPerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        memory: this.getMemorySummary(),
        cpu: this.getCPUSummary(),
        disk: this.getDiskSummary(),
        network: this.getNetworkSummary(),
      },
      operations: this.getOperationsSummary(),
      recommendations: this.generateRecommendations(),
      alerts: this.checkForAlerts(),
    };

    return report;
  }

  getMemorySummary() {
    if (this.metrics.memory.length === 0) {
      return null;
    }

    const latest = this.metrics.memory[this.metrics.memory.length - 1];
    const samples = this.metrics.memory;

    const usagePercentages = samples.map((m) => m.usagePercentage);
    const avgUsage =
      usagePercentages.reduce((a, b) => a + b, 0) / usagePercentages.length;
    const maxUsage = Math.max(...usagePercentages);
    const minUsage = Math.min(...usagePercentages);

    return {
      current: {
        total: this.formatBytes(latest.total),
        used: this.formatBytes(latest.used),
        free: this.formatBytes(latest.free),
        usage: `${latest.usagePercentage.toFixed(2)}%`,
        heapUsed: this.formatBytes(latest.heapUsed),
        heapTotal: this.formatBytes(latest.heapTotal),
      },
      statistics: {
        averageUsage: `${avgUsage.toFixed(2)}%`,
        maxUsage: `${maxUsage.toFixed(2)}%`,
        minUsage: `${minUsage.toFixed(2)}%`,
        samples: samples.length,
      },
      status: this.getMemoryStatus(latest.usagePercentage),
    };
  }

  getCPUSummary() {
    if (this.metrics.cpu.length === 0) {
      return null;
    }

    const latest = this.metrics.cpu[this.metrics.cpu.length - 1];
    const samples = this.metrics.cpu;

    const usagePercentages = samples.map((c) => c.usagePercentage);
    const avgUsage =
      usagePercentages.reduce((a, b) => a + b, 0) / usagePercentages.length;
    const maxUsage = Math.max(...usagePercentages);
    const minUsage = Math.min(...usagePercentages);

    return {
      current: {
        cores: latest.cores,
        usage: `${latest.usagePercentage.toFixed(2)}%`,
        model: latest.model,
        speed: `${latest.speed} MHz`,
        load1: latest.loadavg[0].toFixed(2),
        load5: latest.loadavg[1].toFixed(2),
        load15: latest.loadavg[2].toFixed(2),
      },
      statistics: {
        averageUsage: `${avgUsage.toFixed(2)}%`,
        maxUsage: `${maxUsage.toFixed(2)}%`,
        minUsage: `${minUsage.toFixed(2)}%`,
        samples: samples.length,
      },
      status: this.getCPUStatus(latest.usagePercentage),
    };
  }

  getDiskSummary() {
    if (this.metrics.disk.length === 0) {
      return null;
    }

    const latest = this.metrics.disk[this.metrics.disk.length - 1];

    return {
      platform: latest.platform,
      arch: latest.arch,
      homedir: latest.homedir,
      tmpdir: latest.tmpdir,
    };
  }

  getNetworkSummary() {
    if (this.metrics.network.length === 0) {
      return null;
    }

    const latest = this.metrics.network[this.metrics.network.length - 1];
    const samples = this.metrics.network;

    const connectivityRate =
      (samples.filter((s) => s.hasInternet).length / samples.length) * 100;

    return {
      current: {
        hasInternet: latest.hasInternet,
        interfaces: latest.interfaces,
      },
      statistics: {
        connectivityRate: `${connectivityRate.toFixed(2)}%`,
        samples: samples.length,
      },
    };
  }

  getOperationsSummary() {
    const summary = {
      totalOperations: 0,
      operations: [],
      slowest: null,
      fastest: null,
      averageDuration: 0,
    };

    let totalDuration = 0;
    let operationCount = 0;
    let slowestOperation = { duration: 0 };
    let fastestOperation = { duration: Infinity };

    for (const [name, operations] of this.metrics.operations.entries()) {
      const opDurations = operations.map((op) => op.duration);
      const avgDuration =
        opDurations.reduce((a, b) => a + b, 0) / opDurations.length;
      const maxDuration = Math.max(...opDurations);
      const minDuration = Math.min(...opDurations);

      const operationSummary = {
        name,
        count: operations.length,
        averageDuration: `${avgDuration.toFixed(2)}ms`,
        maxDuration: `${maxDuration.toFixed(2)}ms`,
        minDuration: `${minDuration.toFixed(2)}ms`,
        lastExecuted: new Date(
          operations[operations.length - 1].endTimestamp,
        ).toISOString(),
      };

      summary.operations.push(operationSummary);
      summary.totalOperations += operations.length;
      totalDuration += avgDuration * operations.length;
      operationCount += operations.length;

      if (maxDuration > slowestOperation.duration) {
        slowestOperation = { name, duration: maxDuration };
      }

      if (minDuration < fastestOperation.duration) {
        fastestOperation = { name, duration: minDuration };
      }
    }

    if (operationCount > 0) {
      summary.averageDuration = `${(totalDuration / operationCount).toFixed(2)}ms`;
    }

    if (slowestOperation.duration > 0) {
      summary.slowest = {
        operation: slowestOperation.name,
        duration: `${slowestOperation.duration.toFixed(2)}ms`,
      };
    }

    if (fastestOperation.duration < Infinity) {
      summary.fastest = {
        operation: fastestOperation.name,
        duration: `${fastestOperation.duration.toFixed(2)}ms`,
      };
    }

    // Sort operations by average duration (slowest first)
    summary.operations.sort((a, b) => {
      const aDuration = parseFloat(a.averageDuration);
      const bDuration = parseFloat(b.averageDuration);
      return bDuration - aDuration;
    });

    return summary;
  }

  getMemoryStatus(usagePercentage) {
    if (usagePercentage > 90) {
      return { level: "critical", message: "Memory usage is critically high" };
    } else if (usagePercentage > 75) {
      return { level: "warning", message: "Memory usage is high" };
    } else if (usagePercentage > 50) {
      return { level: "notice", message: "Memory usage is moderate" };
    } else {
      return { level: "good", message: "Memory usage is normal" };
    }
  }

  getCPUStatus(usagePercentage) {
    if (usagePercentage > 90) {
      return { level: "critical", message: "CPU usage is critically high" };
    } else if (usagePercentage > 75) {
      return { level: "warning", message: "CPU usage is high" };
    } else if (usagePercentage > 50) {
      return { level: "notice", message: "CPU usage is moderate" };
    } else {
      return { level: "good", message: "CPU usage is normal" };
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const memorySummary = this.getMemorySummary();
    const cpuSummary = this.getCPUSummary();
    const operationsSummary = this.getOperationsSummary();

    // Memory recommendations
    if (memorySummary && memorySummary.status.level === "critical") {
      recommendations.push({
        type: "memory_critical",
        severity: "high",
        message: "Memory usage is critically high (>90%)",
        action: "Consider reducing memory usage or adding more RAM",
      });
    } else if (memorySummary && memorySummary.status.level === "warning") {
      recommendations.push({
        type: "memory_warning",
        severity: "medium",
        message: "Memory usage is high (>75%)",
        action: "Monitor memory usage and consider optimization",
      });
    }

    // CPU recommendations
    if (cpuSummary && cpuSummary.status.level === "critical") {
      recommendations.push({
        type: "cpu_critical",
        severity: "high",
        message: "CPU usage is critically high (>90%)",
        action: "Consider optimizing CPU-intensive operations",
      });
    } else if (cpuSummary && cpuSummary.status.level === "warning") {
      recommendations.push({
        type: "cpu_warning",
        severity: "medium",
        message: "CPU usage is high (>75%)",
        action: "Monitor CPU usage and consider optimization",
      });
    }

    // Operation performance recommendations
    if (operationsSummary.slowest) {
      const slowDuration = parseFloat(operationsSummary.slowest.duration);
      if (slowDuration > 1000) {
        recommendations.push({
          type: "slow_operation",
          severity: "medium",
          message: `Operation "${operationsSummary.slowest.operation}" is slow (${operationsSummary.slowest.duration})`,
          action: "Consider optimizing this operation for better performance",
        });
      }
    }

    // General recommendations
    if (operationsSummary.totalOperations > 1000) {
      recommendations.push({
        type: "high_operation_count",
        severity: "low",
        message: `High number of operations performed (${operationsSummary.totalOperations})`,
        action: "Consider batching operations or implementing caching",
      });
    }

    return recommendations;
  }

  checkForAlerts() {
    const alerts = [];
    const memorySummary = this.getMemorySummary();
    const cpuSummary = this.getCPUSummary();

    // Memory alerts
    if (memorySummary && memorySummary.status.level === "critical") {
      alerts.push({
        type: "memory_alert",
        severity: "critical",
        message: "Critical memory usage detected",
        timestamp: new Date().toISOString(),
      });
    }

    // CPU alerts
    if (cpuSummary && cpuSummary.status.level === "critical") {
      alerts.push({
        type: "cpu_alert",
        severity: "critical",
        message: "Critical CPU usage detected",
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async saveReport(filePath) {
    try {
      const report = this.getPerformanceReport();
      const reportJson = JSON.stringify(report, null, 2);

      await fs.writeFile(filePath, reportJson, "utf8");
      return true;
    } catch (error) {
      console.error("Failed to save performance report:", error);
      return false;
    }
  }

  async loadReport(filePath) {
    try {
      const reportJson = await fs.readFile(filePath, "utf8");
      return JSON.parse(reportJson);
    } catch (error) {
      console.error("Failed to load performance report:", error);
      return null;
    }
  }

  clearMetrics() {
    this.metrics = {
      memory: [],
      cpu: [],
      disk: [],
      network: [],
      operations: new Map(),
    };

    this.timers.clear();
    this.history = [];

    console.log("Performance metrics cleared");
  }

  getMetrics() {
    return {
      ...this.metrics,
      history: this.history,
      monitoring: this.monitoring,
      config: this.config,
    };
  }
}
