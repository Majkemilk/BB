import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface PremiumLoadingIndicatorProps {
  message?: string;
}

export default function PremiumLoadingIndicator({ 
  message = "Loading premium status..." 
}: PremiumLoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#4CAF50" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  message: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
