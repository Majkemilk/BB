import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

export function useNotificationPermissions() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = async (): Promise<NotificationPermissionStatus> => {
    if (IS_OFFLINE_MODE) {
      const fallback = { granted: false, canAskAgain: false, status: 'denied' as Notifications.PermissionStatus };
      setPermissionStatus(fallback);
      return fallback;
    }
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      
      const permissionStatus: NotificationPermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
      
      setPermissionStatus(permissionStatus);
      return permissionStatus;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      const fallbackStatus: NotificationPermissionStatus = {
        granted: false,
        canAskAgain: false,
        status: 'denied' as Notifications.PermissionStatus,
      };
      setPermissionStatus(fallbackStatus);
      return fallbackStatus;
    }
  };

  const requestPermissions = async (): Promise<NotificationPermissionStatus> => {
    if (IS_OFFLINE_MODE) {
      const fallback = { granted: false, canAskAgain: false, status: 'denied' as Notifications.PermissionStatus };
      setPermissionStatus(fallback);
      return fallback;
    }
    try {
      setIsLoading(true);
      
      const currentStatus = await checkPermissions();
      
      // If already granted, return current status
      if (currentStatus.granted) {
        setIsLoading(false);
        return currentStatus;
      }
      
      // If can't ask again, return current status
      if (!currentStatus.canAskAgain) {
        console.log('Cannot request notification permissions again');
        setIsLoading(false);
        return currentStatus;
      }
      
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      
      const newPermissionStatus: NotificationPermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
      
      setPermissionStatus(newPermissionStatus);
      
      if (status === 'granted') {
        console.log('Notification permissions granted');
      } else {
        console.log('Notification permissions denied');
      }
      
      return newPermissionStatus;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      const errorStatus: NotificationPermissionStatus = {
        granted: false,
        canAskAgain: false,
        status: 'denied' as Notifications.PermissionStatus,
      };
      setPermissionStatus(errorStatus);
      return errorStatus;
    } finally {
      setIsLoading(false);
    }
  };

  const initializePermissions = async () => {
    if (IS_OFFLINE_MODE) {
      setPermissionStatus({ granted: false, canAskAgain: false, status: 'denied' as Notifications.PermissionStatus });
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web') {
        console.log('Notifications not supported on web');
        setPermissionStatus({
          granted: false,
          canAskAgain: false,
          status: 'denied' as Notifications.PermissionStatus,
        });
        return;
      }
      
      // Check current permissions
      const status = await checkPermissions();
      
      // If permissions are undetermined, request them
      if (status.status === 'undetermined') {
        console.log('Requesting notification permissions...');
        await requestPermissions();
      } else {
        console.log('Notification permissions already determined:', status.status);
      }
    } catch (error) {
      console.error('Error initializing notification permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializePermissions();
  }, []);

  return {
    permissionStatus,
    isLoading,
    checkPermissions,
    requestPermissions,
    initializePermissions,
  };
} 