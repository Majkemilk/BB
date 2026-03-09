import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface CrashReport {
  id: string;
  timestamp: number;
  error: {
    message: string;
    stack?: string;
    name?: string;
    code?: string;
  };
  context: {
    userId?: string;
    sessionId?: string;
    screen?: string;
    action?: string;
    userAgent?: string;
    platform: string;
    version: string;
    buildNumber?: string;
  };
  device: {
    model?: string;
    osVersion?: string;
    memory?: number;
    storage?: number;
    batteryLevel?: number;
  };
  app: {
    state: 'active' | 'background' | 'inactive';
    isConnected: boolean;
    networkType?: string;
  };
  user: {
    isLoggedIn: boolean;
    hasData: boolean;
    lastAction?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
}

export interface CrashStats {
  totalCrashes: number;
  crashesBySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  crashesByType: {
    [key: string]: number;
  };
  lastCrash?: string;
  crashRate: number;
}

export class CrashReporter {
  private static readonly CRASH_REPORTS_KEY = 'crash_reports';
  private static readonly MAX_REPORTS = 50;
  private static readonly RETRY_LIMIT = 3;
  private static readonly REPORT_INTERVAL = 30000; // 30 seconds

  private static crashReports: CrashReport[] = [];
  private static isReporting = false;
  private static reportInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize crash reporter
   */
  static async initialize(): Promise<void> {
    try {
      console.log('[CrashReporter] Initializing crash reporter...');
      
      // Load existing crash reports
      await this.loadCrashReports();
      
      // Start periodic reporting
      this.startPeriodicReporting();
      
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      console.log('[CrashReporter] Crash reporter initialized');
    } catch (error) {
      console.error('[CrashReporter] Failed to initialize crash reporter:', error);
    }
  }

  /**
   * Report a crash
   */
  static async reportCrash(
    error: Error,
    context: {
      userId?: string;
      sessionId?: string;
      screen?: string;
      action?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    } = {}
  ): Promise<string> {
    try {
      const crashId = `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const crashReport: CrashReport = {
        id: crashId,
        timestamp: Date.now(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: (error as any).code
        },
        context: {
          userId: context.userId,
          sessionId: context.sessionId,
          screen: context.screen,
          action: context.action,
          userAgent: 'React Native App',
          platform: Platform.OS,
          version: '1.0.0', // This would come from app config
          buildNumber: '1'
        },
        device: {
          model: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
          osVersion: Platform.Version.toString(),
          memory: 0, // This would be fetched from device info
          storage: 0,
          batteryLevel: 0
        },
        app: {
          state: 'active',
          isConnected: true,
          networkType: 'unknown'
        },
        user: {
          isLoggedIn: !!context.userId,
          hasData: false,
          lastAction: context.action
        },
        severity: context.severity || 'medium',
        status: 'pending',
        retryCount: 0
      };

      // Add to crash reports
      this.crashReports.push(crashReport);
      
      // Save to storage
      await this.saveCrashReports();
      
      // Try to send immediately
      await this.sendCrashReport(crashId);
      
      console.log(`[CrashReporter] Crash reported: ${crashId}`);
      return crashId;
    } catch (error) {
      console.error('[CrashReporter] Failed to report crash:', error);
      return '';
    }
  }

  /**
   * Report a JavaScript error
   */
  static async reportJSError(
    error: Error,
    context: {
      userId?: string;
      screen?: string;
      action?: string;
    } = {}
  ): Promise<string> {
    return this.reportCrash(error, {
      ...context,
      severity: 'medium'
    });
  }

  /**
   * Report a network error
   */
  static async reportNetworkError(
    error: Error,
    context: {
      userId?: string;
      screen?: string;
      action?: string;
    } = {}
  ): Promise<string> {
    return this.reportCrash(error, {
      ...context,
      severity: 'low'
    });
  }

  /**
   * Report a database error
   */
  static async reportDatabaseError(
    error: Error,
    context: {
      userId?: string;
      screen?: string;
      action?: string;
    } = {}
  ): Promise<string> {
    return this.reportCrash(error, {
      ...context,
      severity: 'high'
    });
  }

  /**
   * Report a critical error
   */
  static async reportCriticalError(
    error: Error,
    context: {
      userId?: string;
      screen?: string;
      action?: string;
    } = {}
  ): Promise<string> {
    return this.reportCrash(error, {
      ...context,
      severity: 'critical'
    });
  }

  /**
   * Get crash statistics
   */
  static async getCrashStats(): Promise<CrashStats> {
    try {
      const reports = await this.getCrashReports();
      
      const crashesBySeverity = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };

      const crashesByType: { [key: string]: number } = {};

      let lastCrash: string | undefined;

      for (const report of reports) {
        crashesBySeverity[report.severity]++;
        
        const errorType = report.error.name || 'Unknown';
        crashesByType[errorType] = (crashesByType[errorType] || 0) + 1;
        
        if (!lastCrash || report.timestamp > parseInt(lastCrash)) {
          lastCrash = new Date(report.timestamp).toISOString();
        }
      }

      return {
        totalCrashes: reports.length,
        crashesBySeverity,
        crashesByType,
        lastCrash,
        crashRate: reports.length / 30 // Assuming 30 days
      };
    } catch (error) {
      console.error('[CrashReporter] Failed to get crash stats:', error);
      return {
        totalCrashes: 0,
        crashesBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        crashesByType: {},
        crashRate: 0
      };
    }
  }

  /**
   * Get crash reports
   */
  static async getCrashReports(): Promise<CrashReport[]> {
    try {
      const reports = await AsyncStorage.getItem(this.CRASH_REPORTS_KEY);
      return reports ? JSON.parse(reports) : [];
    } catch (error) {
      console.error('[CrashReporter] Failed to get crash reports:', error);
      return [];
    }
  }

  /**
   * Clear crash reports
   */
  static async clearCrashReports(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.CRASH_REPORTS_KEY);
      this.crashReports = [];
      console.log('[CrashReporter] Cleared all crash reports');
      return true;
    } catch (error) {
      console.error('[CrashReporter] Failed to clear crash reports:', error);
      return false;
    }
  }

  /**
   * Send crash report to server
   */
  private static async sendCrashReport(crashId: string): Promise<boolean> {
    try {
      const report = this.crashReports.find(r => r.id === crashId);
      if (!report) {
        console.error(`[CrashReporter] Crash report not found: ${crashId}`);
        return false;
      }

      // Simulate sending to server
      console.log(`[CrashReporter] Sending crash report: ${crashId}`);
      
      // In a real implementation, this would send to a crash reporting service
      // like Sentry, Bugsnag, or a custom endpoint
      
      // Mark as sent
      report.status = 'sent';
      await this.saveCrashReports();
      
      console.log(`[CrashReporter] Crash report sent successfully: ${crashId}`);
      return true;
    } catch (error) {
      console.error(`[CrashReporter] Failed to send crash report ${crashId}:`, error);
      
      // Mark as failed and increment retry count
      const report = this.crashReports.find(r => r.id === crashId);
      if (report) {
        report.status = 'failed';
        report.retryCount++;
        await this.saveCrashReports();
      }
      
      return false;
    }
  }

  /**
   * Load crash reports from storage
   */
  private static async loadCrashReports(): Promise<void> {
    try {
      const reports = await this.getCrashReports();
      this.crashReports = reports;
      console.log(`[CrashReporter] Loaded ${reports.length} crash reports`);
    } catch (error) {
      console.error('[CrashReporter] Failed to load crash reports:', error);
      this.crashReports = [];
    }
  }

  /**
   * Save crash reports to storage
   */
  private static async saveCrashReports(): Promise<void> {
    try {
      // Keep only the most recent reports
      if (this.crashReports.length > this.MAX_REPORTS) {
        this.crashReports = this.crashReports
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.MAX_REPORTS);
      }
      
      await AsyncStorage.setItem(this.CRASH_REPORTS_KEY, JSON.stringify(this.crashReports));
    } catch (error) {
      console.error('[CrashReporter] Failed to save crash reports:', error);
    }
  }

  /**
   * Start periodic reporting
   */
  private static startPeriodicReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    this.reportInterval = setInterval(async () => {
      if (this.isReporting) return;
      
      try {
        this.isReporting = true;
        await this.sendPendingReports();
      } catch (error) {
        console.error('[CrashReporter] Periodic reporting failed:', error);
      } finally {
        this.isReporting = false;
      }
    }, this.REPORT_INTERVAL);

    console.log(`[CrashReporter] Started periodic reporting every ${this.REPORT_INTERVAL / 1000} seconds`);
  }

  /**
   * Send pending crash reports
   */
  private static async sendPendingReports(): Promise<void> {
    try {
      const pendingReports = this.crashReports.filter(r => r.status === 'pending' && r.retryCount < this.RETRY_LIMIT);
      
      if (pendingReports.length === 0) {
        return;
      }

      console.log(`[CrashReporter] Sending ${pendingReports.length} pending crash reports`);
      
      for (const report of pendingReports) {
        await this.sendCrashReport(report.id);
      }
    } catch (error) {
      console.error('[CrashReporter] Failed to send pending reports:', error);
    }
  }

  /**
   * Set up global error handlers
   */
  private static setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof global !== 'undefined') {
      global.addEventListener = global.addEventListener || function() {};
      
      // This would be implemented based on the platform
      console.log('[CrashReporter] Global error handlers set up');
    }
  }

  /**
   * Stop crash reporter
   */
  static stop(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    console.log('[CrashReporter] Crash reporter stopped');
  }

  /**
   * Force send all pending reports
   */
  static async forceSendReports(): Promise<boolean> {
    try {
      await this.sendPendingReports();
      return true;
    } catch (error) {
      console.error('[CrashReporter] Failed to force send reports:', error);
      return false;
    }
  }

  /**
   * Get pending reports count
   */
  static getPendingReportsCount(): number {
    return this.crashReports.filter(r => r.status === 'pending').length;
  }

  /**
   * Get failed reports count
   */
  static getFailedReportsCount(): number {
    return this.crashReports.filter(r => r.status === 'failed').length;
  }
}
