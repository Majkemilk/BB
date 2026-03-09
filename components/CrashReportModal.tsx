import { CrashReport, CrashReporter, CrashStats } from '@/utils/crashReporter';
import { Send, Trash2, X } from 'lucide-react-native';
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

interface CrashReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CrashReportModal({ visible, onClose }: CrashReportModalProps) {
  const [crashReports, setCrashReports] = useState<CrashReport[]>([]);
  const [stats, setStats] = useState<CrashStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCrashData();
    }
  }, [visible]);

  const loadCrashData = async () => {
    setLoading(true);
    try {
      const [reports, crashStats] = await Promise.all([
        CrashReporter.getCrashReports(),
        CrashReporter.getCrashStats()
      ]);
      
      setCrashReports(reports);
      setStats(crashStats);
    } catch (error) {
      console.error('Failed to load crash data:', error);
      Alert.alert('Error', 'Failed to load crash information');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReports = async () => {
    setSending(true);
    try {
      const success = await CrashReporter.forceSendReports();
      if (success) {
        Alert.alert('Success', '🌱 Garden health report sent! Thank you for helping us improve your experience!');
        loadCrashData();
      } else {
        Alert.alert('Error', 'Failed to send crash reports');
      }
    } catch (error) {
      console.error('Failed to send crash reports:', error);
      Alert.alert('Error', 'Failed to send crash reports');
    } finally {
      setSending(false);
    }
  };

  const handleClearReports = () => {
    Alert.alert(
      'Clear Crash Reports',
      'Are you sure you want to clear all crash reports? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await CrashReporter.clearCrashReports();
              if (success) {
                Alert.alert('Success', '🌿 Garden health logs cleared! Your storage is now clean!');
                loadCrashData();
              }
            } catch (error) {
              console.error('Failed to clear crash reports:', error);
              Alert.alert('Error', 'Failed to clear crash reports');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'sent': return '#4CAF50';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Crash Reports</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Statistics */}
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Crash Statistics</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Crashes:</Text>
                <Text style={styles.statValue}>{stats.totalCrashes}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Crash Rate:</Text>
                <Text style={styles.statValue}>{stats.crashRate.toFixed(2)}/day</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Crash:</Text>
                <Text style={styles.statValue}>{stats.lastCrash || 'Never'}</Text>
              </View>

              <View style={styles.severityContainer}>
                <Text style={styles.severityTitle}>By Severity:</Text>
                <View style={styles.severityRow}>
                  <View style={[styles.severityItem, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.severityText}>Low: {stats.crashesBySeverity.low}</Text>
                  </View>
                  <View style={[styles.severityItem, { backgroundColor: '#FF9800' }]}>
                    <Text style={styles.severityText}>Medium: {stats.crashesBySeverity.medium}</Text>
                  </View>
                  <View style={[styles.severityItem, { backgroundColor: '#F44336' }]}>
                    <Text style={styles.severityText}>High: {stats.crashesBySeverity.high}</Text>
                  </View>
                  <View style={[styles.severityItem, { backgroundColor: '#9C27B0' }]}>
                    <Text style={styles.severityText}>Critical: {stats.crashesBySeverity.critical}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={handleSendReports}
              disabled={sending}
            >
              <Send size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {sending ? 'Sending...' : 'Send Reports'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearReports}
            >
              <Trash2 size={20} color="white" />
              <Text style={styles.actionButtonText}>Clear Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading crash data...</Text>
            </View>
          )}

          {/* Crash Reports List */}
          <View style={styles.reportsContainer}>
            <Text style={styles.sectionTitle}>Recent Crash Reports</Text>
            {crashReports.length === 0 ? (
              <Text style={styles.emptyText}>No crash reports available</Text>
            ) : (
              crashReports.map((report) => (
                <View key={report.id} style={styles.reportItem}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportDate}>{formatDate(report.timestamp)}</Text>
                      <Text style={styles.reportError}>{report.error.message}</Text>
                    </View>
                    <View style={styles.reportBadges}>
                      <View style={[styles.badge, { backgroundColor: getSeverityColor(report.severity) }]}>
                        <Text style={styles.badgeText}>{report.severity}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: getStatusColor(report.status) }]}>
                        <Text style={styles.badgeText}>{report.status}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.reportDetails}>
                    <Text style={styles.detailLabel}>Screen: {report.context.screen || 'Unknown'}</Text>
                    <Text style={styles.detailLabel}>Action: {report.context.action || 'Unknown'}</Text>
                    <Text style={styles.detailLabel}>User: {report.context.userId || 'Anonymous'}</Text>
                    <Text style={styles.detailLabel}>Retry Count: {report.retryCount}</Text>
                  </View>

                  {report.error.stack && (
                    <View style={styles.stackContainer}>
                      <Text style={styles.stackTitle}>Stack Trace:</Text>
                      <Text style={styles.stackText}>{report.error.stack}</Text>
                    </View>
                  )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  severityContainer: {
    marginTop: 16,
  },
  severityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  sendButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#F44336',
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
  reportsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  reportItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportError: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  reportDetails: {
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  stackContainer: {
    marginTop: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});
