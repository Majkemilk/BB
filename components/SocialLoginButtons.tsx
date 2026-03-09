// import { Google } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGooglePress,
  onApplePress,
  loading = false,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Google Sign-In Button */}
      <TouchableOpacity
        style={[styles.googleButton, (loading || disabled) && styles.buttonDisabled]}
        onPress={onGooglePress}
        disabled={loading || disabled}
        accessibilityLabel="Continue with Google"
        accessibilityRole="button"
      >
        <Text style={styles.googleButtonText}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Apple Sign-In Button - Future Implementation */}
      {onApplePress && (
        <TouchableOpacity
          style={[styles.appleButton, (loading || disabled) && styles.buttonDisabled]}
          onPress={onApplePress}
          disabled={loading || disabled}
          accessibilityLabel="Sign in with Apple"
          accessibilityRole="button"
        >
          <Text style={styles.appleButtonText}>
            {loading ? 'Signing in...' : 'Sign in with Apple'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
