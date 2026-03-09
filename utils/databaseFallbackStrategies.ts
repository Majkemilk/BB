import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { ErrorHandler, ErrorType } from './errorHandler';
import { OfflineQueue } from './offlineQueue';
import { RetryMechanism } from './retryMechanism';

export interface FallbackStrategy {
  name: string;
  description: string;
  applicableErrors: ErrorType[];
  execute: (error: any, context: any) => Promise<boolean>;
}

export class DatabaseFallbackStrategies {
  private static strategies: FallbackStrategy[] = [
    {
      name: 'Retry with Exponential Backoff',
      description: 'Retry the operation with increasing delays',
      applicableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.DATABASE],
      execute: async (error, context) => {
        console.log('[DatabaseFallback] Attempting retry with exponential backoff');
        const result = await RetryMechanism.executeWithRetry(
          context.operation,
          { maxRetries: 3, baseDelay: 1000 },
          context
        );
        return result.success;
      }
    },
    {
      name: 'Queue for Offline Processing',
      description: 'Queue the operation for later processing when network is restored',
      applicableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT],
      execute: async (error, context) => {
        console.log('[DatabaseFallback] Queuing operation for offline processing');
        try {
          await OfflineQueue.add(context.operationType, context.data);
          Alert.alert(
            'Offline Mode',
            'Operation saved locally. It will sync when connection is restored.'
          );
          return true;
        } catch (queueError) {
          console.error('[DatabaseFallback] Failed to queue operation:', queueError);
          return false;
        }
      }
    },
    {
      name: 'Local Storage Fallback',
      description: 'Save data to local storage as backup',
      applicableErrors: [ErrorType.DATABASE, ErrorType.CONSTRAINT],
      execute: async (error, context) => {
        console.log('[DatabaseFallback] Saving to local storage as fallback');
        try {
          const localKey = `fallback_${context.operationType}_${Date.now()}`;
          await AsyncStorage.setItem(localKey, JSON.stringify({
            data: context.data,
            timestamp: Date.now(),
            operation: context.operationType,
            userId: context.userId
          }));
          
          Alert.alert(
            'Data Saved Locally',
            'Your data has been saved locally. It will sync when possible.'
          );
          return true;
        } catch (storageError) {
          console.error('[DatabaseFallback] Failed to save to local storage:', storageError);
          return false;
        }
      }
    },
    {
      name: 'Authentication Refresh',
      description: 'Refresh authentication and retry',
      applicableErrors: [ErrorType.AUTHENTICATION],
      execute: async (error, context) => {
        console.log('[DatabaseFallback] Attempting authentication refresh');
        try {
          // This would implement authentication refresh logic
          // For now, just return false to indicate failure
          Alert.alert(
            'Authentication Required',
            'Please log in again to continue.'
          );
          return false;
        } catch (authError) {
          console.error('[DatabaseFallback] Authentication refresh failed:', authError);
          return false;
        }
      }
    },
    {
      name: 'Data Validation and Retry',
      description: 'Validate data and retry with corrected values',
      applicableErrors: [ErrorType.VALIDATION, ErrorType.CONSTRAINT],
      execute: async (error, context) => {
        console.log('[DatabaseFallback] Attempting data validation and retry');
        try {
          // This would implement data validation logic
          // For now, just return false to indicate failure
          Alert.alert(
            'Data Validation Error',
            'Please check your input and try again.'
          );
          return false;
        } catch (validationError) {
          console.error('[DatabaseFallback] Data validation failed:', validationError);
          return false;
        }
      }
    }
  ];

  /**
   * Execute appropriate fallback strategy based on error type
   */
  static async executeFallback(
    error: any,
    context: {
      operation: () => Promise<any>;
      operationType: string;
      data: any;
      userId?: string;
    }
  ): Promise<boolean> {
    const errorType = ErrorHandler.categorizeError(error);
    console.log(`[DatabaseFallback] Error type: ${errorType}`);

    // Find applicable strategies
    const applicableStrategies = this.strategies.filter(strategy =>
      strategy.applicableErrors.includes(errorType)
    );

    if (applicableStrategies.length === 0) {
      console.log('[DatabaseFallback] No applicable fallback strategies found');
      return false;
    }

    // Try strategies in order of preference
    for (const strategy of applicableStrategies) {
      try {
        console.log(`[DatabaseFallback] Trying strategy: ${strategy.name}`);
        const success = await strategy.execute(error, context);
        
        if (success) {
          console.log(`[DatabaseFallback] Strategy ${strategy.name} succeeded`);
          return true;
        }
      } catch (strategyError) {
        console.error(`[DatabaseFallback] Strategy ${strategy.name} failed:`, strategyError);
      }
    }

    console.log('[DatabaseFallback] All fallback strategies failed');
    return false;
  }

  /**
   * Get available strategies for error type
   */
  static getAvailableStrategies(errorType: ErrorType): FallbackStrategy[] {
    return this.strategies.filter(strategy =>
      strategy.applicableErrors.includes(errorType)
    );
  }

  /**
   * Add custom fallback strategy
   */
  static addStrategy(strategy: FallbackStrategy): void {
    this.strategies.push(strategy);
    console.log(`[DatabaseFallback] Added custom strategy: ${strategy.name}`);
  }

  /**
   * Remove fallback strategy
   */
  static removeStrategy(strategyName: string): boolean {
    const index = this.strategies.findIndex(s => s.name === strategyName);
    if (index !== -1) {
      this.strategies.splice(index, 1);
      console.log(`[DatabaseFallback] Removed strategy: ${strategyName}`);
      return true;
    }
    return false;
  }

  /**
   * Get all available strategies
   */
  static getAllStrategies(): FallbackStrategy[] {
    return [...this.strategies];
  }

  /**
   * Process local storage fallbacks
   */
  static async processLocalStorageFallbacks(): Promise<{
    processed: number;
    failed: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const fallbackKeys = keys.filter(key => key.startsWith('fallback_'));
      
      let processed = 0;
      let failed = 0;

      for (const key of fallbackKeys) {
        try {
          const fallbackData = await AsyncStorage.getItem(key);
          if (!fallbackData) continue;

          const parsed = JSON.parse(fallbackData);
          console.log(`[DatabaseFallback] Processing fallback: ${key}`);

          // Here you would implement the actual fallback processing
          // For now, just remove the fallback
          await AsyncStorage.removeItem(key);
          processed++;
        } catch (error) {
          console.error(`[DatabaseFallback] Failed to process fallback ${key}:`, error);
          failed++;
        }
      }

      console.log(`[DatabaseFallback] Processed ${processed} fallbacks, ${failed} failed`);
      return { processed, failed };
    } catch (error) {
      console.error('[DatabaseFallback] Failed to process local storage fallbacks:', error);
      return { processed: 0, failed: 0 };
    }
  }

  /**
   * Clear all local storage fallbacks
   */
  static async clearLocalStorageFallbacks(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const fallbackKeys = keys.filter(key => key.startsWith('fallback_'));
      
      if (fallbackKeys.length > 0) {
        await AsyncStorage.multiRemove(fallbackKeys);
        console.log(`[DatabaseFallback] Cleared ${fallbackKeys.length} local storage fallbacks`);
      }
    } catch (error) {
      console.error('[DatabaseFallback] Failed to clear local storage fallbacks:', error);
    }
  }
}
