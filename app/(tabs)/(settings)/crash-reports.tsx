import { CrashReportModal } from '../../../components/CrashReportModal';
import { Bug, Send, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CrashReportsScreen() {
  const [showCrashModal, setShowCrashModal] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Garden Health Reports 🩺</Text>
          <Text style={styles.sectionDescription}>
            Help us improve Plantascape by sharing anonymous crash reports. Your privacy is protected!
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => setShowCrashModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Bug size={24} color="#4CAF50" style={{ marginRight: 12 }} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>View Crash Reports</Text>
                  <Text style={styles.settingSubtitle}>See and manage error reports</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => {
              // This would trigger sending crash reports
              // Implementation would be handled by the CrashReportModal
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Send size={24} color="#4CAF50" style={{ marginRight: 12 }} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Send Reports</Text>
                  <Text style={styles.settingSubtitle}>Help us improve the app</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => {
              // This would trigger clearing crash reports
              // Implementation would be handled by the CrashReportModal
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingHeader}>
                <Trash2 size={24} color="#4CAF50" style={{ marginRight: 12 }} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Clear Reports</Text>
                  <Text style={styles.settingSubtitle}>Remove all stored reports</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security 🔒</Text>
          <Text style={styles.sectionDescription}>
            • Reports are completely anonymous{'\n'}
            • No personal data is collected{'\n'}
            • Only technical error information{'\n'}
            • You can clear reports anytime{'\n'}
            • Help us make Plantascape better for everyone
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works 🔧</Text>
          <Text style={styles.sectionDescription}>
            When the app encounters an error, it automatically creates a technical report. 
            These reports help us identify and fix bugs to improve your experience. 
            You can review, send, or delete these reports at any time.
          </Text>
        </View>
      </ScrollView>

      <CrashReportModal 
        visible={showCrashModal} 
        onClose={() => setShowCrashModal(false)} 
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
