import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    connectionType: null,
    isInternetReachable: null,
    isOffline: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
        isOffline: !state.isConnected || state.isInternetReachable === false,
      };
      
      setNetworkStatus(newStatus);
      
      // Log network changes for debugging
      console.log('[NetworkStatus] Connection changed:', {
        isConnected: newStatus.isConnected,
        type: newStatus.connectionType,
        isInternetReachable: newStatus.isInternetReachable,
        isOffline: newStatus.isOffline,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkStatus;
}
