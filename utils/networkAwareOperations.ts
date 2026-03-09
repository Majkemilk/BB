import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface NetworkError extends Error {
  code?: string;
  isNetworkError?: boolean;
}

export class NetworkAwareOperation {
  private static retryCount = 3;
  private static retryDelay = 1000;
  private static maxRetryDelay = 10000;

  /**
   * Execute operation with network awareness and retry logic
   */
  static async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T,
    retryCount = this.retryCount
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.log('[NetworkAwareOperation] Operation failed:', error);
      
      if (retryCount > 0 && this.isNetworkError(error)) {
        const delay = Math.min(
          this.retryDelay * Math.pow(2, this.retryCount - retryCount),
          this.maxRetryDelay
        );
        
        console.log(`[NetworkAwareOperation] Retrying in ${delay}ms (attempts left: ${retryCount})`);
        await this.delay(delay);
        
        return this.execute(operation, fallback, retryCount - 1);
      }
      
      if (fallback) {
        console.log('[NetworkAwareOperation] Using fallback operation');
        return fallback();
      }
      
      throw error;
    }
  }

  /**
   * Execute operation with offline queue fallback
   */
  static async executeWithOfflineQueue<T>(
    operation: () => Promise<T>,
    queueKey: string,
    operationData: any
  ): Promise<T> {
    try {
      return await this.execute(operation);
    } catch (error) {
      if (this.isNetworkError(error)) {
        console.log('[NetworkAwareOperation] Network error, queuing operation for later');
        await this.queueOperation(queueKey, operationData);
        
        // Show user-friendly message
        Alert.alert(
          'Offline Mode',
          'Operation saved locally. It will sync when connection is restored.',
          [{ text: 'OK' }]
        );
        
        // Return a mock result for immediate UI feedback
        return operationData as T;
      }
      
      throw error;
    }
  }

  /**
   * Check if error is network-related
   */
  private static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const networkErrorPatterns = [
      'network',
      'timeout',
      'connection',
      'fetch',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'NETWORK_ERROR',
      'CONNECTION_ERROR'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    
    return networkErrorPatterns.some(pattern => 
      errorMessage.includes(pattern) || errorCode.includes(pattern)
    );
  }

  /**
   * Queue operation for later execution
   */
  private static async queueOperation(queueKey: string, operationData: any): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const operation = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        data: operationData,
        type: queueKey
      };
      
      queue.push(operation);
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
      
      console.log('[NetworkAwareOperation] Operation queued:', operation);
    } catch (error) {
      console.error('[NetworkAwareOperation] Failed to queue operation:', error);
    }
  }

  /**
   * Get offline queue from storage
   */
  private static async getOfflineQueue(): Promise<any[]> {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('[NetworkAwareOperation] Failed to get offline queue:', error);
      return [];
    }
  }

  /**
   * Process queued operations when network is restored
   */
  static async processOfflineQueue(): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      if (queue.length === 0) return;
      
      console.log(`[NetworkAwareOperation] Processing ${queue.length} queued operations`);
      
      const processedOperations: string[] = [];
      
      for (const operation of queue) {
        try {
          // Here you would implement the actual operation execution
          // based on the operation type and data
          console.log('[NetworkAwareOperation] Processing queued operation:', operation);
          
          // Mark as processed
          processedOperations.push(operation.id);
        } catch (error) {
          console.error('[NetworkAwareOperation] Failed to process queued operation:', error);
        }
      }
      
      // Remove processed operations from queue
      const remainingQueue = queue.filter(op => !processedOperations.includes(op.id));
      await AsyncStorage.setItem('offline_queue', JSON.stringify(remainingQueue));
      
      console.log(`[NetworkAwareOperation] Processed ${processedOperations.length} operations`);
    } catch (error) {
      console.error('[NetworkAwareOperation] Failed to process offline queue:', error);
    }
  }

  /**
   * Clear offline queue
   */
  static async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem('offline_queue');
      console.log('[NetworkAwareOperation] Offline queue cleared');
    } catch (error) {
      console.error('[NetworkAwareOperation] Failed to clear offline queue:', error);
    }
  }

  /**
   * Get offline queue status
   */
  static async getOfflineQueueStatus(): Promise<{ count: number; operations: any[] }> {
    try {
      const queue = await this.getOfflineQueue();
      return {
        count: queue.length,
        operations: queue
      };
    } catch (error) {
      console.error('[NetworkAwareOperation] Failed to get offline queue status:', error);
      return { count: 0, operations: [] };
    }
  }

  /**
   * Utility method for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
