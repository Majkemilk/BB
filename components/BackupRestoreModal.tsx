import { AutoBackup, BackupEntry } from '../utils/autoBackup';
import { DataExport } from '../utils/dataExport';
import { Clock, Download, HardDrive, Trash2, Upload, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface BackupRestoreModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BackupRestoreModal({ visible, onClose }: BackupRestoreModalProps) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
    lastBackupDate: ''
  });

  useEffect(() => {
    if (visible) {
      loadBackupData();
    }
  }, [visible]);

  const loadBackupData = async () => {
    setLoading(true);
    try {
      const [backupList, backupStats] = await Promise.all([
        AutoBackup.getAvailableBackups(),
        AutoBackup.getBackupStats()
      ]);
      
      setBackups(backupList);
      setStats({
        totalBackups: backupStats.totalBackups,
        totalSize: backupStats.totalSize,
        lastBackupDate: backupStats.lastBackupDate || 'Never'
      });
    } catch (error) {
      console.error('Failed to load backup data:', error);
      Alert.alert('Error', 'Failed to load backup information');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const backup = await AutoBackup.createBackup('Manual backup');
      if (backup) {
        Alert.alert('Success', '🌿 Your garden has been safely backed up! Your data is secure!');
        loadBackupData();
      } else {
        Alert.alert('Error', 'Failed to create backup');
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    Alert.alert(
      'Restore Backup',
      'This will replace your current data with the backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await AutoBackup.restoreFromBackup(backupId);
              if (success) {
                Alert.alert('Success', '🌸 Your garden has been restored! All your plants and ideas are blooming again!');
                onClose();
              }
            } catch (error) {
              console.error('Failed to restore backup:', error);
              Alert.alert('Error', 'Failed to restore backup');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteBackup = async (backupId: string) => {
    Alert.alert(
      'Delete Backup',
      'Are you sure you want to delete this backup?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await AutoBackup.deleteBackup(backupId);
              if (success) {
                Alert.alert('Success', '🌿 Old backup cleared! Your garden storage is now tidy!');
                loadBackupData();
              }
            } catch (error) {
              console.error('Failed to delete backup:', error);
              Alert.alert('Error', 'Failed to delete backup');
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const success = await DataExport.exportAndShare();
      if (success) {
        Alert.alert('Success', '🌱 Your garden data has been exported! Your ideas are ready to bloom elsewhere!');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Backup & Restore</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <HardDrive size={20} color="#4CAF50" />
              <Text style={styles.statLabel}>Total Backups</Text>
              <Text style={styles.statValue}>{stats.totalBackups}</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={20} color="#2196F3" />
              <Text style={styles.statLabel}>Last Backup</Text>
              <Text style={styles.statValue}>{stats.lastBackupDate}</Text>
            </View>
            <View style={styles.statItem}>
              <Download size={20} color="#FF9800" />
              <Text style={styles.statLabel}>Total Size</Text>
              <Text style={styles.statValue}>{formatFileSize(stats.totalSize)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton]}
              onPress={handleCreateBackup}
              disabled={loading}
            >
              <Download size={20} color="white" />
              <Text style={styles.actionButtonText}>Create Backup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={handleExportData}
              disabled={loading}
            >
              <Upload size={20} color="white" />
              <Text style={styles.actionButtonText}>Export Data</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {/* Backup List */}
          <View style={styles.backupListContainer}>
            <Text style={styles.sectionTitle}>Available Backups</Text>
            {backups.length === 0 ? (
              <Text style={styles.emptyText}>No backups available</Text>
            ) : (
              backups.map((backup) => (
                <View key={backup.id} style={styles.backupItem}>
                  <View style={styles.backupInfo}>
                    <Text style={styles.backupDate}>{formatDate(backup.timestamp)}</Text>
                    <Text style={styles.backupSize}>{formatFileSize(backup.size)}</Text>
                    {backup.description && (
                      <Text style={styles.backupDescription}>{backup.description}</Text>
                    )}
                    {backup.metadata && (
                      <Text style={styles.backupMetadata}>
                        {backup.metadata.tasksCount} tasks, {backup.metadata.wildflowersCount} wildflowers
                      </Text>
                    )}
                  </View>
                  <View style={styles.backupActions}>
                    <TouchableOpacity
                      style={[styles.backupActionButton, styles.restoreButton]}
                      onPress={() => handleRestoreBackup(backup.id)}
                    >
                      <Upload size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.backupActionButton, styles.deleteButton]}
                      onPress={() => handleDeleteBackup(backup.id)}
                    >
                      <Trash2 size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  exportButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  backupListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backupInfo: {
    flex: 1,
  },
  backupDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  backupSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  backupDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  backupMetadata: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backupActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
});
