import * as Calendar from 'expo-calendar';
import { useCallback, useState } from 'react';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';

export type CalendarPermissionStatus = 'undetermined' | 'granted' | 'denied';

export function useCalendarPermissions() {
  const [status, setStatus] = useState<CalendarPermissionStatus>('undetermined');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = useCallback(async () => {
    if (IS_OFFLINE_MODE) {
      setStatus('denied');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { status: permStatus } = await Calendar.getCalendarPermissionsAsync();
      setStatus(permStatus);
    } catch (e: any) {
      setError(e.message || 'Failed to check calendar permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (IS_OFFLINE_MODE) {
      setStatus('denied');
      return 'denied' as const;
    }
    try {
      setLoading(true);
      setError(null);
      const { status: permStatus } = await Calendar.requestCalendarPermissionsAsync();
      setStatus(permStatus);
      return permStatus;
    } catch (e: any) {
      setError(e.message || 'Failed to request calendar permissions.');
      return 'denied';
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    status,
    loading,
    error,
    checkPermissions,
    requestPermissions,
  };
} 