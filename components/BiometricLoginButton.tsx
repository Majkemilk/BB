import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { checkBiometricCapabilities, getBiometricIcon } from '../utils/biometricAuth';

interface BiometricLoginButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const BiometricLoginButton: React.FC<BiometricLoginButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricIcon, setBiometricIcon] = useState('🔐');

  useEffect(() => {
    const checkAvailability = async () => {
      const capabilities = await checkBiometricCapabilities();
      const available = capabilities.hasHardware && capabilities.isEnrolled;
      
      setIsAvailable(available);
      
      if (available) {
        const icon = getBiometricIcon(capabilities.supportedTypes);
        setBiometricIcon(icon);
      }
    };

    checkAvailability();
  }, []);

  if (!isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.biometricButton,
        (loading || disabled) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityLabel="Sign in with biometrics"
      accessibilityRole="button"
    >
      <Text style={styles.biometricIcon}>{biometricIcon}</Text>
      <Text style={styles.biometricText}>
        {loading ? 'Authenticating...' : 'Quick Sign In'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  biometricButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  biometricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  biometricText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
