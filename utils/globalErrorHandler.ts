import { CrashReporter } from './crashReporter';

export class GlobalErrorHandler {
  private static isInitialized = false;

  /**
   * Initialize global error handlers
   */
  static initialize(): void {
    if (this.isInitialized) {
      console.log('[GlobalErrorHandler] Already initialized');
      return;
    }

    try {
      console.log('[GlobalErrorHandler] Initializing global error handlers...');

      // Handle unhandled promise rejections
      this.setupUnhandledRejectionHandler();

      // Handle JavaScript errors
      this.setupJSErrorHandler();

      // Handle network errors
      this.setupNetworkErrorHandler();

      this.isInitialized = true;
      console.log('[GlobalErrorHandler] Global error handlers initialized');
    } catch (error) {
      console.error('[GlobalErrorHandler] Failed to initialize global error handlers:', error);
    }
  }

  /**
   * Set up unhandled promise rejection handler
   */
  private static setupUnhandledRejectionHandler(): void {
    if (typeof global !== 'undefined') {
      // Handle unhandled promise rejections
      const originalHandler = global.onunhandledrejection;
      
      global.onunhandledrejection = (event: any) => {
        console.error('[GlobalErrorHandler] Unhandled promise rejection:', event.reason);
        
        // Report crash
        if (event.reason instanceof Error) {
          CrashReporter.reportJSError(event.reason, {
            screen: 'Global',
            action: 'UnhandledPromiseRejection'
          });
        }

        // Call original handler if it exists
        if (originalHandler) {
          originalHandler(event);
        }
      };
    }
  }

  /**
   * Set up JavaScript error handler
   */
  private static setupJSErrorHandler(): void {
    if (typeof global !== 'undefined') {
      // Handle JavaScript errors
      const originalHandler = global.onerror;
      
      global.onerror = (message: string, source?: string, lineno?: number, colno?: number, error?: Error) => {
        console.error('[GlobalErrorHandler] JavaScript error:', { message, source, lineno, colno, error });
        
        // Report crash
        if (error) {
          CrashReporter.reportJSError(error, {
            screen: source || 'Unknown',
            action: 'JavaScriptError'
          });
        } else {
          // Create error from message if no error object
          const jsError = new Error(message);
          CrashReporter.reportJSError(jsError, {
            screen: source || 'Unknown',
            action: 'JavaScriptError'
          });
        }

        // Call original handler if it exists
        if (originalHandler) {
          return originalHandler(message, source, lineno, colno, error);
        }

        return false;
      };
    }
  }

  /**
   * Set up network error handler
   */
  private static setupNetworkErrorHandler(): void {
    // This would integrate with network monitoring
    // For now, we'll set up a basic handler
    console.log('[GlobalErrorHandler] Network error handler set up');
  }

  /**
   * Handle specific error types
   */
  static handleError(error: Error, context: {
    userId?: string;
    screen?: string;
    action?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } = {}): void {
    try {
      console.error('[GlobalErrorHandler] Handling error:', error);
      
      // Determine error type and report accordingly
      if (error.message.includes('network') || error.message.includes('fetch')) {
        CrashReporter.reportNetworkError(error, context);
      } else if (error.message.includes('database') || error.message.includes('supabase')) {
        CrashReporter.reportDatabaseError(error, context);
      } else if (context.severity === 'critical') {
        CrashReporter.reportCriticalError(error, context);
      } else {
        CrashReporter.reportJSError(error, context);
      }
    } catch (reportError) {
      console.error('[GlobalErrorHandler] Failed to report error:', reportError);
    }
  }

  /**
   * Handle React Native specific errors
   */
  static handleReactNativeError(error: Error, isFatal: boolean = false): void {
    try {
      console.error('[GlobalErrorHandler] React Native error:', error);
      
      CrashReporter.reportCrash(error, {
        screen: 'ReactNative',
        action: 'ReactNativeError',
        severity: isFatal ? 'critical' : 'high'
      });
    } catch (reportError) {
      console.error('[GlobalErrorHandler] Failed to report React Native error:', reportError);
    }
  }

  /**
   * Handle navigation errors
   */
  static handleNavigationError(error: Error, route?: string): void {
    try {
      console.error('[GlobalErrorHandler] Navigation error:', error);
      
      CrashReporter.reportJSError(error, {
        screen: route || 'Navigation',
        action: 'NavigationError'
      });
    } catch (reportError) {
      console.error('[GlobalErrorHandler] Failed to report navigation error:', reportError);
    }
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: Error, action?: string): void {
    try {
      console.error('[GlobalErrorHandler] Authentication error:', error);
      
      CrashReporter.reportCrash(error, {
        screen: 'Authentication',
        action: action || 'AuthError',
        severity: 'high'
      });
    } catch (reportError) {
      console.error('[GlobalErrorHandler] Failed to report auth error:', reportError);
    }
  }

  /**
   * Handle data persistence errors
   */
  static handleDataError(error: Error, operation?: string): void {
    try {
      console.error('[GlobalErrorHandler] Data error:', error);
      
      CrashReporter.reportDatabaseError(error, {
        screen: 'DataPersistence',
        action: operation || 'DataError'
      });
    } catch (reportError) {
      console.error('[GlobalErrorHandler] Failed to report data error:', reportError);
    }
  }

  /**
   * Get error statistics
   */
  static async getErrorStats(): Promise<{
    totalErrors: number;
    errorsByType: { [key: string]: number };
    lastError?: string;
  }> {
    try {
      const stats = await CrashReporter.getCrashStats();
      return {
        totalErrors: stats.totalCrashes,
        errorsByType: stats.crashesByType,
        lastError: stats.lastCrash
      };
    } catch (error) {
      console.error('[GlobalErrorHandler] Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        lastError: undefined
      };
    }
  }

  /**
   * Clear all error reports
   */
  static async clearErrorReports(): Promise<boolean> {
    try {
      return await CrashReporter.clearCrashReports();
    } catch (error) {
      console.error('[GlobalErrorHandler] Failed to clear error reports:', error);
      return false;
    }
  }

  /**
   * Force send error reports
   */
  static async forceSendReports(): Promise<boolean> {
    try {
      return await CrashReporter.forceSendReports();
    } catch (error) {
      console.error('[GlobalErrorHandler] Failed to force send reports:', error);
      return false;
    }
  }
}
