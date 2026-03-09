import { BackupRestoreModal } from '@/components/BackupRestoreModal';
import { Database, Download } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BackupRestoreScreen() {
  const [showBackupModal, setShowBackupModal] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management 🌱</Text>
          <Text style={styles.sectionDescription}>
            Safely backup and restore your garden data. Your ideas and tasks are precious - keep them secure!
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setShowBackupModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Database size={24} color="#4CAF50" style={{ marginRight: 12 }} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Backup & Restore</Text>
                  <Text style={styles.settingSubtitle}>Create backups and restore your data</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => {
              // This would trigger data export functionality
              // Implementation would be handled by the BackupRestoreModal
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Download size={24} color="#4CAF50" style={{ marginRight: 12 }} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Export Data</Text>
                  <Text style={styles.settingSubtitle}>Download your data as JSON file</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Backup? 🤔</Text>
          <Text style={styles.sectionDescription}>
            • Keep your ideas safe when changing devices{'\n'}
            • Restore your garden after app reinstallation{'\n'}
            • Export data for personal archiving{'\n'}
            • Never lose your creative progress
          </Text>
        </View>
      </ScrollView>

      <BackupRestoreModal 
        visible={showBackupModal} 
        onClose={() => setShowBackupModal(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  settingItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});
