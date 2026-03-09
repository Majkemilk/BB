import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedOperation {
  id: string;
  timestamp: number;
  type: string;
  data: any;
  retryCount: number;
  maxRetries: number;
}

export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline_queue';
  private static readonly MAX_QUEUE_SIZE = 100;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 5000; // 5 seconds

  /**
   * Add operation to offline queue
   */
  static async add(
    type: string,
    data: any,
    maxRetries = this.MAX_RETRIES
  ): Promise<string> {
    try {
      const queue = await this.getQueue();
      
      // Check queue size limit
      if (queue.length >= this.MAX_QUEUE_SIZE) {
        console.warn('[OfflineQueue] Queue size limit reached, removing oldest operations');
        queue.splice(0, queue.length - this.MAX_QUEUE_SIZE + 1);
      }
      
      const operation: QueuedOperation = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type,
        data,
        retryCount: 0,
        maxRetries
      };
      
      queue.push(operation);
      await this.saveQueue(queue);
      
      console.log('[OfflineQueue] Operation queued:', {
        id: operation.id,
        type: operation.type,
        queueSize: queue.length
      });
      
      return operation.id;
    } catch (error) {
      console.error('[OfflineQueue] Failed to add operation to queue:', error);
      throw error;
    }
  }

  /**
   * Process all queued operations
   */
  static async processQueue(): Promise<{ processed: number; failed: number }> {
    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        console.log('[OfflineQueue] No operations to process');
        return { processed: 0, failed: 0 };
      }
      
      console.log(`[OfflineQueue] Processing ${queue.length} queued operations`);
      
      let processed = 0;
      let failed = 0;
      const remainingOperations: QueuedOperation[] = [];
      
      for (const operation of queue) {
        try {
          const success = await this.executeOperation(operation);
          
          if (success) {
            processed++;
            console.log(`[OfflineQueue] Successfully processed operation ${operation.id}`);
          } else {
            // Increment retry count
            operation.retryCount++;
            
            if (operation.retryCount >= operation.maxRetries) {
              failed++;
              console.error(`[OfflineQueue] Operation ${operation.id} failed after ${operation.maxRetries} retries`);
            } else {
              remainingOperations.push(operation);
              console.log(`[OfflineQueue] Operation ${operation.id} will be retried (attempt ${operation.retryCount + 1})`);
            }
          }
        } catch (error) {
          console.error(`[OfflineQueue] Error processing operation ${operation.id}:`, error);
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            failed++;
          } else {
            remainingOperations.push(operation);
          }
        }
      }
      
      // Save remaining operations back to queue
      await this.saveQueue(remainingOperations);
      
      console.log(`[OfflineQueue] Queue processing complete: ${processed} processed, ${failed} failed, ${remainingOperations.length} remaining`);
      
      return { processed, failed };
    } catch (error) {
      console.error('[OfflineQueue] Failed to process queue:', error);
      return { processed: 0, failed: 0 };
    }
  }

  /**
   * Execute a single queued operation
   */
  private static async executeOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'addTask':
          return await this.executeAddTask(operation.data);
        case 'updateTask':
          return await this.executeUpdateTask(operation.data);
        case 'deleteTask':
          return await this.executeDeleteTask(operation.data);
        case 'addWildflower':
          return await this.executeAddWildflower(operation.data);
        case 'updateWildflower':
          return await this.executeUpdateWildflower(operation.data);
        case 'deleteWildflower':
          return await this.executeDeleteWildflower(operation.data);
        case 'addTemplate':
          return await this.executeAddTemplate(operation.data);
        case 'deleteTemplate':
          return await this.executeDeleteTemplate(operation.data);
        default:
          console.warn(`[OfflineQueue] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[OfflineQueue] Failed to execute operation ${operation.type}:`, error);
      return false;
    }
  }

  /**
   * Execute addTask operation
   */
  private static async executeAddTask(data: any): Promise<boolean> {
    // This would integrate with your actual TaskContext
    // For now, we'll simulate the operation
    console.log('[OfflineQueue] Executing addTask:', data);
    return true;
  }

  /**
   * Execute updateTask operation
   */
  private static async executeUpdateTask(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing updateTask:', data);
    return true;
  }

  /**
   * Execute deleteTask operation
   */
  private static async executeDeleteTask(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing deleteTask:', data);
    return true;
  }

  /**
   * Execute addWildflower operation
   */
  private static async executeAddWildflower(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing addWildflower:', data);
    return true;
  }

  /**
   * Execute updateWildflower operation
   */
  private static async executeUpdateWildflower(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing updateWildflower:', data);
    return true;
  }

  /**
   * Execute deleteWildflower operation
   */
  private static async executeDeleteWildflower(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing deleteWildflower:', data);
    return true;
  }

  /**
   * Execute addTemplate operation
   */
  private static async executeAddTemplate(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing addTemplate:', data);
    return true;
  }

  /**
   * Execute deleteTemplate operation
   */
  private static async executeDeleteTemplate(data: any): Promise<boolean> {
    console.log('[OfflineQueue] Executing deleteTemplate:', data);
    return true;
  }

  /**
   * Get current queue from storage
   */
  private static async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queue = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Save queue to storage
   */
  private static async saveQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Get queue status
   */
  static async getQueueStatus(): Promise<{
    count: number;
    operations: QueuedOperation[];
    oldestOperation?: QueuedOperation;
    newestOperation?: QueuedOperation;
  }> {
    try {
      const queue = await this.getQueue();
      
      return {
        count: queue.length,
        operations: queue,
        oldestOperation: queue.length > 0 ? queue[0] : undefined,
        newestOperation: queue.length > 0 ? queue[queue.length - 1] : undefined
      };
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queue status:', error);
      return { count: 0, operations: [] };
    }
  }

  /**
   * Clear all queued operations
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      console.log('[OfflineQueue] Queue cleared');
    } catch (error) {
      console.error('[OfflineQueue] Failed to clear queue:', error);
    }
  }

  /**
   * Remove specific operation from queue
   */
  static async removeOperation(operationId: string): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(op => op.id !== operationId);
      
      if (filteredQueue.length !== queue.length) {
        await this.saveQueue(filteredQueue);
        console.log(`[OfflineQueue] Removed operation ${operationId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[OfflineQueue] Failed to remove operation:', error);
      return false;
    }
  }

  /**
   * Get operations by type
   */
  static async getOperationsByType(type: string): Promise<QueuedOperation[]> {
    try {
      const queue = await this.getQueue();
      return queue.filter(op => op.type === type);
    } catch (error) {
      console.error('[OfflineQueue] Failed to get operations by type:', error);
      return [];
    }
  }
}
