import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface NetworkStatusIndicatorProps {
  showWhenConnected?: boolean;
  position?: 'top' | 'bottom';
}

export function NetworkStatusIndicator({ 
  showWhenConnected = false, 
  position = 'top' 
}: NetworkStatusIndicatorProps) {
  const networkStatus = useNetworkStatus();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (networkStatus.isOffline || (showWhenConnected && networkStatus.isConnected)) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [networkStatus.isOffline, networkStatus.isConnected, showWhenConnected]);

  if (!networkStatus.isOffline && !showWhenConnected) {
    return null;
  }

  const getStatusInfo = () => {
    if (networkStatus.isOffline) {
      return {
        text: 'Offline Mode',
        color: '#FF6B6B',
        icon: WifiOff,
        description: 'Some features may be limited'
      };
    }
    
    if (networkStatus.isConnected) {
      return {
        text: 'Connected',
        color: '#4CAF50',
        icon: Wifi,
        description: `Connected via ${networkStatus.connectionType || 'unknown'}`
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const IconComponent = statusInfo.icon;

  return (
    <Animated.View 
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { opacity: fadeAnim }
      ]}
    >
      <View style={[styles.statusBar, { backgroundColor: statusInfo.color }]}>
        <IconComponent size={16} color="white" />
        <Text style={styles.statusText}>{statusInfo.text}</Text>
        <Text style={styles.descriptionText}>{statusInfo.description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topPosition: {
    top: 0,
  },
  bottomPosition: {
    bottom: 0,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
});
