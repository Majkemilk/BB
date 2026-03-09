import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { DataExport } from './dataExport';

export interface BackupEntry {
  id: string;
  timestamp: number;
  size: number;
  version: string;
  description?: string;
  metadata?: {
    tasksCount: number;
    wildflowersCount: number;
    templatesCount: number;
  };
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup: number;
  newestBackup: number;
  lastBackupDate?: string;
}

export class AutoBackup {
  private static readonly BACKUP_KEY_PREFIX = 'backup_';
  private static readonly BACKUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  private static readonly MAX_BACKUPS = 5;
  private static readonly MAX_BACKUP_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly BACKUP_LIST_KEY = 'backup_list';

  private static backupInterval: NodeJS.Timeout | null = null;
  private static isBackupInProgress = false;

  /**
   * Initialize auto-backup system
   */
  static async initialize(): Promise<void> {
    try {
      console.log('[AutoBackup] Initializing auto-backup system...');
      
      // Clean old backups
      await this.cleanOldBackups();
      
      // Schedule periodic backups
      this.scheduleAutoBackup();
      
      console.log('[AutoBackup] Auto-backup system initialized');
    } catch (error) {
      console.error('[AutoBackup] Failed to initialize auto-backup system:', error);
    }
  }

  /**
   * Create a new backup
   */
  static async createBackup(description?: string): Promise<BackupEntry | null> {
    if (this.isBackupInProgress) {
      console.log('[AutoBackup] Backup already in progress, skipping...');
      return null;
    }

    try {
      this.isBackupInProgress = true;
      console.log('[AutoBackup] Creating backup...');

      const backupId = `backup_${Date.now()}`;
      const exportData = await DataExport.exportUserData();
      const backupSize = exportData.length;

      // Check if backup size is within limits
      if (backupSize > this.MAX_BACKUP_SIZE) {
        console.warn(`[AutoBackup] Backup size (${backupSize}) exceeds limit (${this.MAX_BACKUP_SIZE})`);
        Alert.alert(
          'Backup Size Warning',
          'Your data is too large to backup. Consider cleaning up old data.'
        );
        return null;
      }

      // Get metadata
      const stats = await DataExport.getExportStats();
      const backupEntry: BackupEntry = {
        id: backupId,
        timestamp: Date.now(),
        size: backupSize,
        version: '1.0',
        description,
        metadata: {
          tasksCount: stats.itemCounts.tasks,
          wildflowersCount: stats.itemCounts.wildflowers,
          templatesCount: stats.itemCounts.templates
        }
      };

      // Save backup data
      await AsyncStorage.setItem(backupId, exportData);
      
      // Update backup list
      await this.addToBackupList(backupEntry);
      
      // Clean old backups if necessary
      await this.cleanOldBackups();

      console.log(`[AutoBackup] Backup created: ${backupId} (${backupSize} bytes)`);
      return backupEntry;
    } catch (error) {
      console.error('[AutoBackup] Failed to create backup:', error);
      return null;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Restore from backup
   */
  static async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      console.log(`[AutoBackup] Restoring from backup: ${backupId}`);
      
      const backupData = await AsyncStorage.getItem(backupId);
      if (!backupData) {
        console.error(`[AutoBackup] Backup not found: ${backupId}`);
        return false;
      }

      const importResult = await DataExport.importUserData(backupData);
      
      if (importResult.success) {
        console.log(`[AutoBackup] Successfully restored from backup: ${backupId}`);
        Alert.alert(
          'Restore Successful',
          `Restored ${importResult.importedItems.tasks} tasks, ${importResult.importedItems.wildflowers} wildflowers, and other data.`
        );
        return true;
      } else {
        console.error(`[AutoBackup] Failed to restore from backup: ${backupId}`);
        Alert.alert(
          'Restore Failed',
          `Failed to restore data: ${importResult.errors.join(', ')}`
        );
        return false;
      }
    } catch (error) {
      console.error(`[AutoBackup] Failed to restore from backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Get all available backups
   */
  static async getAvailableBackups(): Promise<BackupEntry[]> {
    try {
      const backupList = await AsyncStorage.getItem(this.BACKUP_LIST_KEY);
      if (!backupList) return [];

      const backups: BackupEntry[] = JSON.parse(backupList);
      return backups.sort((a, b) => b.timestamp - a.timestamp); // Newest first
    } catch (error) {
      console.error('[AutoBackup] Failed to get available backups:', error);
      return [];
    }
  }

  /**
   * Delete backup
   */
  static async deleteBackup(backupId: string): Promise<boolean> {
    try {
      console.log(`[AutoBackup] Deleting backup: ${backupId}`);
      
      // Remove backup data
      await AsyncStorage.removeItem(backupId);
      
      // Remove from backup list
      await this.removeFromBackupList(backupId);
      
      console.log(`[AutoBackup] Backup deleted: ${backupId}`);
      return true;
    } catch (error) {
      console.error(`[AutoBackup] Failed to delete backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  static async getBackupStats(): Promise<BackupStats> {
    try {
      const backups = await this.getAvailableBackups();
      
      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          oldestBackup: 0,
          newestBackup: 0
        };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const timestamps = backups.map(backup => backup.timestamp);
      const oldestBackup = Math.min(...timestamps);
      const newestBackup = Math.max(...timestamps);

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup,
        newestBackup,
        lastBackupDate: new Date(newestBackup).toISOString()
      };
    } catch (error) {
      console.error('[AutoBackup] Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: 0,
        newestBackup: 0
      };
    }
  }

  /**
   * Schedule automatic backups
   */
  private static scheduleAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = setInterval(async () => {
      try {
        console.log('[AutoBackup] Running scheduled backup...');
        await this.createBackup('Automatic backup');
      } catch (error) {
        console.error('[AutoBackup] Scheduled backup failed:', error);
      }
    }, this.BACKUP_INTERVAL);

    console.log(`[AutoBackup] Scheduled auto-backup every ${this.BACKUP_INTERVAL / 1000 / 60} minutes`);
  }

  /**
   * Stop auto-backup system
   */
  static stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('[AutoBackup] Auto-backup system stopped');
    }
  }

  /**
   * Add backup to backup list
   */
  private static async addToBackupList(backup: BackupEntry): Promise<void> {
    try {
      const existingBackups = await this.getAvailableBackups();
      existingBackups.push(backup);
      
      await AsyncStorage.setItem(this.BACKUP_LIST_KEY, JSON.stringify(existingBackups));
    } catch (error) {
      console.error('[AutoBackup] Failed to add backup to list:', error);
    }
  }

  /**
   * Remove backup from backup list
   */
  private static async removeFromBackupList(backupId: string): Promise<void> {
    try {
      const existingBackups = await this.getAvailableBackups();
      const filteredBackups = existingBackups.filter(backup => backup.id !== backupId);
      
      await AsyncStorage.setItem(this.BACKUP_LIST_KEY, JSON.stringify(filteredBackups));
    } catch (error) {
      console.error('[AutoBackup] Failed to remove backup from list:', error);
    }
  }

  /**
   * Clean old backups
   */
  private static async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.getAvailableBackups();
      
      if (backups.length <= this.MAX_BACKUPS) {
        return;
      }

      // Sort by timestamp (oldest first)
      const sortedBackups = backups.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest backups
      const backupsToRemove = sortedBackups.slice(0, backups.length - this.MAX_BACKUPS);
      
      for (const backup of backupsToRemove) {
        await this.deleteBackup(backup.id);
        console.log(`[AutoBackup] Cleaned old backup: ${backup.id}`);
      }
    } catch (error) {
      console.error('[AutoBackup] Failed to clean old backups:', error);
    }
  }

  /**
   * Force backup creation
   */
  static async forceBackup(): Promise<boolean> {
    try {
      const backup = await this.createBackup('Manual backup');
      return backup !== null;
    } catch (error) {
      console.error('[AutoBackup] Failed to force backup:', error);
      return false;
    }
  }

  /**
   * Clear all backups
   */
  static async clearAllBackups(): Promise<boolean> {
    try {
      const backups = await this.getAvailableBackups();
      
      for (const backup of backups) {
        await AsyncStorage.removeItem(backup.id);
      }
      
      await AsyncStorage.removeItem(this.BACKUP_LIST_KEY);
      
      console.log(`[AutoBackup] Cleared ${backups.length} backups`);
      return true;
    } catch (error) {
      console.error('[AutoBackup] Failed to clear all backups:', error);
      return false;
    }
  }
}
