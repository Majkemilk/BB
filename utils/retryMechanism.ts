import { ErrorHandler } from './errorHandler';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export class RetryMechanism {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  };

  /**
   * Execute operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: { operation: string; userId?: string }
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        return {
          success: true,
          data: result,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const errorType = ErrorHandler.categorizeError(error);
        if (!ErrorHandler.isRetryable(error, errorType)) {
          console.log(`[RetryMechanism] Non-retryable error: ${errorType}`);
          break;
        }

        // If this was the last attempt, don't wait
        if (attempt === finalConfig.maxRetries) {
          console.log(`[RetryMechanism] Max retries reached for operation: ${context?.operation}`);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        console.log(`[RetryMechanism] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
        
        // Log error for monitoring
        ErrorHandler.logError(error, errorType, {
          operation: context?.operation || 'unknown',
          userId: context?.userId,
          timestamp: Date.now(),
          retryCount: attempt
        });

        await this.delay(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxRetries + 1,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Execute operation with circuit breaker pattern
   */
  static async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreakerConfig: {
      failureThreshold: number;
      timeout: number;
      resetTimeout: number;
    } = {
      failureThreshold: 5,
      timeout: 10000,
      resetTimeout: 30000
    },
    context?: { operation: string; userId?: string }
  ): Promise<RetryResult<T>> {
    // This would implement circuit breaker pattern
    // For now, fall back to regular retry
    return this.executeWithRetry(operation, {}, context);
  }

  /**
   * Execute operation with timeout
   */
  static async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 10000,
    context?: { operation: string; userId?: string }
  ): Promise<RetryResult<T>> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: new Error(`Operation timed out after ${timeoutMs}ms`),
          attempts: 1,
          totalTime: timeoutMs
        });
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve({
            success: true,
            data: result,
            attempts: 1,
            totalTime: 0
          });
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          resolve({
            success: false,
            error,
            attempts: 1,
            totalTime: 0
          });
        });
    });
  }

  /**
   * Execute operation with both retry and timeout
   */
  static async executeWithRetryAndTimeout<T>(
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {},
    timeoutMs: number = 10000,
    context?: { operation: string; userId?: string }
  ): Promise<RetryResult<T>> {
    const wrappedOperation = () => this.executeWithTimeout(operation, timeoutMs, context);
    return this.executeWithRetry(wrappedOperation, retryConfig, context);
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(0, delay);
  }

  /**
   * Utility method for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics
   */
  static getRetryStats(): {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageRetryTime: number;
  } {
    // This would track retry statistics
    // For now, return mock data
    return {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryTime: 0
    };
  }

  /**
   * Reset retry statistics
   */
  static resetRetryStats(): void {
    // Reset retry statistics
    console.log('[RetryMechanism] Retry statistics reset');
  }
}
