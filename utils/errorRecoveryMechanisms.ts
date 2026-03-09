import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { ErrorHandler, ErrorType } from './errorHandler';

export interface RecoveryAction {
  id: string;
  type: 'retry' | 'fallback' | 'queue' | 'local_storage' | 'user_action';
  description: string;
  execute: () => Promise<boolean>;
  priority: number;
}

export class ErrorRecoveryMechanisms {
  private static recoveryActions: RecoveryAction[] = [];

  /**
   * Register a recovery action
   */
  static registerRecoveryAction(action: RecoveryAction): void {
    this.recoveryActions.push(action);
    console.log(`[ErrorRecovery] Registered recovery action: ${action.id}`);
  }

  /**
   * Unregister a recovery action
   */
  static unregisterRecoveryAction(actionId: string): boolean {
    const index = this.recoveryActions.findIndex(action => action.id === actionId);
    if (index !== -1) {
      this.recoveryActions.splice(index, 1);
      console.log(`[ErrorRecovery] Unregistered recovery action: ${actionId}`);
      return true;
    }
    return false;
  }

  /**
   * Execute recovery actions for a specific error
   */
  static async executeRecovery(
    error: any,
    context: {
      operation: string;
      userId?: string;
      data?: any;
    }
  ): Promise<boolean> {
    const errorType = ErrorHandler.categorizeError(error);
    console.log(`[ErrorRecovery] Executing recovery for error type: ${errorType}`);

    // Get applicable recovery actions
    const applicableActions = this.getApplicableActions(errorType, context);
    
    if (applicableActions.length === 0) {
      console.log('[ErrorRecovery] No applicable recovery actions found');
      return false;
    }

    // Sort by priority (higher priority first)
    applicableActions.sort((a, b) => b.priority - a.priority);

    // Try each action in order of priority
    for (const action of applicableActions) {
      try {
        console.log(`[ErrorRecovery] Trying recovery action: ${action.id}`);
        const success = await action.execute();
        
        if (success) {
          console.log(`[ErrorRecovery] Recovery action ${action.id} succeeded`);
          return true;
        }
      } catch (actionError) {
        console.error(`[ErrorRecovery] Recovery action ${action.id} failed:`, actionError);
      }
    }

    console.log('[ErrorRecovery] All recovery actions failed');
    return false;
  }

  /**
   * Get applicable recovery actions for error type
   */
  private static getApplicableActions(
    errorType: ErrorType,
    context: { operation: string; userId?: string; data?: any }
  ): RecoveryAction[] {
    // Filter actions based on error type and context
    return this.recoveryActions.filter(action => {
      // This would implement more sophisticated filtering logic
      return true;
    });
  }

  /**
   * Initialize default recovery actions
   */
  static initializeDefaultRecoveryActions(): void {
    // Clear existing actions
    this.recoveryActions = [];

    // Register default recovery actions
    this.registerRecoveryAction({
      id: 'retry_with_backoff',
      type: 'retry',
      description: 'Retry operation with exponential backoff',
      priority: 10,
      execute: async () => {
        // This would implement retry logic
        return false;
      }
    });

    this.registerRecoveryAction({
      id: 'queue_for_offline',
      type: 'queue',
      description: 'Queue operation for offline processing',
      priority: 8,
      execute: async () => {
        // This would implement queue logic
        return false;
      }
    });

    this.registerRecoveryAction({
      id: 'local_storage_fallback',
      type: 'local_storage',
      description: 'Save to local storage as fallback',
      priority: 6,
      execute: async () => {
        // This would implement local storage logic
        return false;
      }
    });

    this.registerRecoveryAction({
      id: 'user_intervention',
      type: 'user_action',
      description: 'Request user intervention',
      priority: 4,
      execute: async () => {
        return new Promise((resolve) => {
          Alert.alert(
            'Recovery Required',
            'Please try the operation again or contact support.',
            [
              { text: 'Cancel', onPress: () => resolve(false) },
              { text: 'Retry', onPress: () => resolve(true) }
            ]
          );
        });
      }
    });

    console.log('[ErrorRecovery] Default recovery actions initialized');
  }

  /**
   * Process pending recovery actions
   */
  static async processPendingRecoveryActions(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      const pendingActions = await this.getPendingRecoveryActions();
      
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const action of pendingActions) {
        try {
          processed++;
          const success = await action.execute();
          
          if (success) {
            successful++;
            await this.removePendingRecoveryAction(action.id);
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`[ErrorRecovery] Failed to process recovery action ${action.id}:`, error);
          failed++;
        }
      }

      console.log(`[ErrorRecovery] Processed ${processed} recovery actions: ${successful} successful, ${failed} failed`);
      return { processed, successful, failed };
    } catch (error) {
      console.error('[ErrorRecovery] Failed to process pending recovery actions:', error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }

  /**
   * Get pending recovery actions from storage
   */
  private static async getPendingRecoveryActions(): Promise<RecoveryAction[]> {
    try {
      const pendingActions = await AsyncStorage.getItem('pending_recovery_actions');
      return pendingActions ? JSON.parse(pendingActions) : [];
    } catch (error) {
      console.error('[ErrorRecovery] Failed to get pending recovery actions:', error);
      return [];
    }
  }

  /**
   * Save pending recovery action to storage
   */
  static async savePendingRecoveryAction(action: RecoveryAction): Promise<void> {
    try {
      const pendingActions = await this.getPendingRecoveryActions();
      pendingActions.push(action);
      await AsyncStorage.setItem('pending_recovery_actions', JSON.stringify(pendingActions));
      console.log(`[ErrorRecovery] Saved pending recovery action: ${action.id}`);
    } catch (error) {
      console.error('[ErrorRecovery] Failed to save pending recovery action:', error);
    }
  }

  /**
   * Remove pending recovery action from storage
   */
  private static async removePendingRecoveryAction(actionId: string): Promise<void> {
    try {
      const pendingActions = await this.getPendingRecoveryActions();
      const filteredActions = pendingActions.filter(action => action.id !== actionId);
      await AsyncStorage.setItem('pending_recovery_actions', JSON.stringify(filteredActions));
      console.log(`[ErrorRecovery] Removed pending recovery action: ${actionId}`);
    } catch (error) {
      console.error('[ErrorRecovery] Failed to remove pending recovery action:', error);
    }
  }

  /**
   * Clear all pending recovery actions
   */
  static async clearPendingRecoveryActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem('pending_recovery_actions');
      console.log('[ErrorRecovery] Cleared all pending recovery actions');
    } catch (error) {
      console.error('[ErrorRecovery] Failed to clear pending recovery actions:', error);
    }
  }

  /**
   * Get recovery statistics
   */
  static async getRecoveryStats(): Promise<{
    totalActions: number;
    pendingActions: number;
    successfulRecoveries: number;
    failedRecoveries: number;
  }> {
    try {
      const pendingActions = await this.getPendingRecoveryActions();
      
      return {
        totalActions: this.recoveryActions.length,
        pendingActions: pendingActions.length,
        successfulRecoveries: 0, // This would track successful recoveries
        failedRecoveries: 0 // This would track failed recoveries
      };
    } catch (error) {
      console.error('[ErrorRecovery] Failed to get recovery stats:', error);
      return {
        totalActions: 0,
        pendingActions: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0
      };
    }
  }
}
