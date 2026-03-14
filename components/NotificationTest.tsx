import * as Notifications from 'expo-notifications';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationPermissions } from '../hooks/useNotificationPermissions';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';

export function NotificationTest() {
  const { permissionStatus, requestPermissions } = useNotificationPermissions();

  const sendTestNotification = async () => {
    try {
      if (IS_OFFLINE_MODE) {
        Alert.alert('Offline Mode', 'Notifications are disabled in offline mode.');
        return;
      }
      if (!permissionStatus?.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant notification permissions to send test notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Request Permissions', onPress: requestPermissions }
          ]
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌱 Plantascape Test',
          body: 'Your notification system is working perfectly!',
          data: { type: 'test' },
        },
        trigger: null, // Immediate notification
      });

      Alert.alert('Success', '🔔 Test notification planted! It will bloom in your notifications!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Check console for details.');
    }
  };

  const getPermissionStatusText = () => {
    if (!permissionStatus) return 'Checking...';
    
    switch (permissionStatus.status) {
      case 'granted':
        return '✅ Granted';
      case 'denied':
        return '❌ Denied';
      case 'undetermined':
        return '❓ Not Determined';
      default:
        return '❓ Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Permission Status:</Text>
        <Text style={styles.status}>{getPermissionStatusText()}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={sendTestNotification}
        disabled={!permissionStatus?.granted}
      >
        <Text style={styles.buttonText}>
          Send Test Notification
        </Text>
      </TouchableOpacity>

      {!permissionStatus?.granted && (
        <TouchableOpacity 
          style={[styles.button, styles.requestButton]} 
          onPress={requestPermissions}
        >
          <Text style={styles.buttonText}>
            Request Permissions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  requestButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 