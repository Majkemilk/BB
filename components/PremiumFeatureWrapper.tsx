import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
// import ErrorBoundary from './ErrorBoundary'; // Temporarily disabled

interface PremiumFeatureWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PremiumFeatureWrapper({ 
  children, 
  fallback 
}: PremiumFeatureWrapperProps) {
  const defaultFallback = (
    <View style={styles.errorContainer}>
      <AlertTriangle size={24} color="#FF6B6B" />
      <Text style={styles.errorText}>
        Premium feature temporarily unavailable
      </Text>
    </View>
  );

  return (
    <>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
