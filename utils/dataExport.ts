import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Share } from 'react-native';
import { DataCache } from './dataCache';

export interface ExportData {
  tasks: any[];
  wildflowers: any[];
  templates: any[];
  preferences: any;
  contexts: string[];
  plots: string[];
  almanac: any;
  exportDate: string;
  version: string;
  userId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
}

export interface ImportResult {
  success: boolean;
  importedItems: {
    tasks: number;
    wildflowers: number;
    templates: number;
    preferences: boolean;
    contexts: number;
    plots: number;
    almanac: boolean;
  };
  errors: string[];
  warnings: string[];
}

export class DataExport {
  private static readonly EXPORT_VERSION = '1.0';
  private static readonly SUPPORTED_VERSIONS = ['1.0'];

  /**
   * Export all user data
   */
  static async exportUserData(): Promise<string> {
    try {
      console.log('[DataExport] Starting data export...');
      
      const exportData: ExportData = {
        tasks: await DataCache.loadFromCache('cached_tasks') || [],
        wildflowers: await DataCache.loadFromCache('cached_wildflowers') || [],
        templates: await DataCache.loadFromCache('cached_templates') || [],
        preferences: await DataCache.loadFromCache('cached_preferences') || {},
        contexts: await DataCache.loadFromCache('cached_contexts') || [],
        plots: await DataCache.loadFromCache('cached_plots') || [],
        almanac: await DataCache.loadFromCache('cached_almanac') || {},
        exportDate: new Date().toISOString(),
        version: this.EXPORT_VERSION,
        deviceInfo: {
          platform: 'React Native',
          version: '1.0.0'
        }
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      console.log(`[DataExport] Export completed, size: ${jsonData.length} bytes`);
      
      return jsonData;
    } catch (error) {
      console.error('[DataExport] Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Export data to file and share
   */
  static async exportAndShare(): Promise<boolean> {
    try {
      const jsonData = await this.exportUserData();
      const fileName = `plantascape_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      await Share.share({
        message: jsonData,
        title: 'Plantascape Data Export',
        url: `data:application/json;base64,${btoa(jsonData)}`
      });

      console.log('[DataExport] Data shared successfully');
      return true;
    } catch (error) {
      console.error('[DataExport] Failed to share data:', error);
      Alert.alert('Export Failed', 'Failed to share your data. Please try again.');
      return false;
    }
  }

  /**
   * Import user data from JSON
   */
  static async importUserData(jsonData: string): Promise<ImportResult> {
    try {
      console.log('[DataExport] Starting data import...');
      
      const importResult: ImportResult = {
        success: false,
        importedItems: {
          tasks: 0,
          wildflowers: 0,
          templates: 0,
          preferences: false,
          contexts: 0,
          plots: 0,
          almanac: false
        },
        errors: [],
        warnings: []
      };

      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!this.validateDataStructure(data)) {
        importResult.errors.push('Invalid data structure');
        return importResult;
      }

      // Check version compatibility
      if (!this.SUPPORTED_VERSIONS.includes(data.version)) {
        importResult.warnings.push(`Data version ${data.version} may not be fully compatible`);
      }

      // Import tasks
      if (data.tasks && Array.isArray(data.tasks)) {
        try {
          await DataCache.saveToCache('cached_tasks', data.tasks);
          importResult.importedItems.tasks = data.tasks.length;
          console.log(`[DataExport] Imported ${data.tasks.length} tasks`);
        } catch (error) {
          importResult.errors.push('Failed to import tasks');
          console.error('[DataExport] Failed to import tasks:', error);
        }
      }

      // Import wildflowers
      if (data.wildflowers && Array.isArray(data.wildflowers)) {
        try {
          await DataCache.saveToCache('cached_wildflowers', data.wildflowers);
          importResult.importedItems.wildflowers = data.wildflowers.length;
          console.log(`[DataExport] Imported ${data.wildflowers.length} wildflowers`);
        } catch (error) {
          importResult.errors.push('Failed to import wildflowers');
          console.error('[DataExport] Failed to import wildflowers:', error);
        }
      }

      // Import templates
      if (data.templates && Array.isArray(data.templates)) {
        try {
          await DataCache.saveToCache('cached_templates', data.templates);
          importResult.importedItems.templates = data.templates.length;
          console.log(`[DataExport] Imported ${data.templates.length} templates`);
        } catch (error) {
          importResult.errors.push('Failed to import templates');
          console.error('[DataExport] Failed to import templates:', error);
        }
      }

      // Import preferences
      if (data.preferences) {
        try {
          await DataCache.saveToCache('cached_preferences', data.preferences);
          importResult.importedItems.preferences = true;
          console.log('[DataExport] Imported preferences');
        } catch (error) {
          importResult.errors.push('Failed to import preferences');
          console.error('[DataExport] Failed to import preferences:', error);
        }
      }

      // Import contexts
      if (data.contexts && Array.isArray(data.contexts)) {
        try {
          await DataCache.saveToCache('cached_contexts', data.contexts);
          importResult.importedItems.contexts = data.contexts.length;
          console.log(`[DataExport] Imported ${data.contexts.length} contexts`);
        } catch (error) {
          importResult.errors.push('Failed to import contexts');
          console.error('[DataExport] Failed to import contexts:', error);
        }
      }

      // Import plots
      if (data.plots && Array.isArray(data.plots)) {
        try {
          await DataCache.saveToCache('cached_plots', data.plots);
          importResult.importedItems.plots = data.plots.length;
          console.log(`[DataExport] Imported ${data.plots.length} plots`);
        } catch (error) {
          importResult.errors.push('Failed to import plots');
          console.error('[DataExport] Failed to import plots:', error);
        }
      }

      // Import almanac
      if (data.almanac) {
        try {
          await DataCache.saveToCache('cached_almanac', data.almanac);
          importResult.importedItems.almanac = true;
          console.log('[DataExport] Imported almanac');
        } catch (error) {
          importResult.errors.push('Failed to import almanac');
          console.error('[DataExport] Failed to import almanac:', error);
        }
      }

      importResult.success = importResult.errors.length === 0;
      console.log(`[DataExport] Import completed: ${importResult.success ? 'success' : 'with errors'}`);
      
      return importResult;
    } catch (error) {
      console.error('[DataExport] Failed to import user data:', error);
      return {
        success: false,
        importedItems: {
          tasks: 0,
          wildflowers: 0,
          templates: 0,
          preferences: false,
          contexts: 0,
          plots: 0,
          almanac: false
        },
        errors: ['Failed to parse import data'],
        warnings: []
      };
    }
  }

  /**
   * Validate data structure
   */
  private static validateDataStructure(data: any): boolean {
    try {
      // Check required fields
      const requiredFields = ['version', 'exportDate'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.error(`[DataExport] Missing required field: ${field}`);
          return false;
        }
      }

      // Check data types
      if (data.tasks && !Array.isArray(data.tasks)) {
        console.error('[DataExport] Tasks must be an array');
        return false;
      }

      if (data.wildflowers && !Array.isArray(data.wildflowers)) {
        console.error('[DataExport] Wildflowers must be an array');
        return false;
      }

      if (data.templates && !Array.isArray(data.templates)) {
        console.error('[DataExport] Templates must be an array');
        return false;
      }

      if (data.contexts && !Array.isArray(data.contexts)) {
        console.error('[DataExport] Contexts must be an array');
        return false;
      }

      if (data.plots && !Array.isArray(data.plots)) {
        console.error('[DataExport] Plots must be an array');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[DataExport] Data structure validation failed:', error);
      return false;
    }
  }

  /**
   * Get export statistics
   */
  static async getExportStats(): Promise<{
    totalSize: number;
    itemCounts: {
      tasks: number;
      wildflowers: number;
      templates: number;
      contexts: number;
      plots: number;
    };
    lastExport?: string;
  }> {
    try {
      const tasks = await DataCache.loadFromCache('cached_tasks') || [];
      const wildflowers = await DataCache.loadFromCache('cached_wildflowers') || [];
      const templates = await DataCache.loadFromCache('cached_templates') || [];
      const contexts = await DataCache.loadFromCache('cached_contexts') || [];
      const plots = await DataCache.loadFromCache('cached_plots') || [];

      const exportData = {
        tasks,
        wildflowers,
        templates,
        contexts,
        plots,
        preferences: {},
        almanac: {},
        exportDate: new Date().toISOString(),
        version: this.EXPORT_VERSION
      };

      const jsonData = JSON.stringify(exportData);
      
      return {
        totalSize: jsonData.length,
        itemCounts: {
          tasks: tasks.length,
          wildflowers: wildflowers.length,
          templates: templates.length,
          contexts: contexts.length,
          plots: plots.length
        },
        lastExport: undefined // This would be stored separately
      };
    } catch (error) {
      console.error('[DataExport] Failed to get export stats:', error);
      return {
        totalSize: 0,
        itemCounts: {
          tasks: 0,
          wildflowers: 0,
          templates: 0,
          contexts: 0,
          plots: 0
        }
      };
    }
  }

  /**
   * Clear all imported data
   */
  static async clearImportedData(): Promise<boolean> {
    try {
      const keys = [
        'cached_tasks',
        'cached_wildflowers',
        'cached_templates',
        'cached_preferences',
        'cached_contexts',
        'cached_plots',
        'cached_almanac'
      ];

      await AsyncStorage.multiRemove(keys);
      console.log('[DataExport] Cleared all imported data');
      return true;
    } catch (error) {
      console.error('[DataExport] Failed to clear imported data:', error);
      return false;
    }
  }
}
