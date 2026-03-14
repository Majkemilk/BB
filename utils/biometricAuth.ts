import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BIOMETRIC_CONFIG, SECURE_STORE_KEYS } from './config';
import { IS_OFFLINE_MODE } from './featureFlags';
import { supabase } from './supabase';

export interface BiometricAuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

// Check if device supports biometric authentication
export const checkBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  if (IS_OFFLINE_MODE) {
    return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (error) {
    console.error('Biometric capabilities check error:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  };
};

// Save user credentials securely after successful login
export const saveUserCredentials = async (userId: string, refreshToken: string): Promise<boolean> => {
  if (IS_OFFLINE_MODE) return false;
  try {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_ID, userId);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, refreshToken);
    return true;
  } catch (error) {
    console.error('Error saving user credentials:', error);
    return false;
  }
};

// Retrieve saved user credentials
export const getSavedCredentials = async (): Promise<{ userId: string; refreshToken: string } | null> => {
  if (IS_OFFLINE_MODE) return null;
  try {
    const userId = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_ID);
    const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);

    if (userId && refreshToken) {
      return { userId, refreshToken };
    }
    return null;
  } catch (error) {
    console.error('Error retrieving saved credentials:', error);
    return null;
  }
};

// Clear saved credentials
export const clearSavedCredentials = async (): Promise<void> => {
  if (IS_OFFLINE_MODE) return;
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER_ID);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error clearing saved credentials:', error);
  }
};

// Authenticate with biometrics and auto-login
export const authenticateWithBiometrics = async (): Promise<BiometricAuthResult> => {
  if (IS_OFFLINE_MODE) {
    return { success: false, error: 'Biometric login is disabled in offline mode.' };
  }
  try {
    const capabilities = await checkBiometricCapabilities();
    
    if (!capabilities.hasHardware || !capabilities.isEnrolled) {
      return {
        success: false,
        error: 'Biometric authentication not available',
      };
    }

    // Get saved credentials
    const credentials = await getSavedCredentials();
    if (!credentials) {
      return {
        success: false,
        error: 'No saved credentials found',
      };
    }

    const result = await LocalAuthentication.authenticateAsync(BIOMETRIC_CONFIG);

    if (!result.success) {
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }

    // Try to refresh the session with saved credentials
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: credentials.refreshToken,
    });

    if (error || !data.session) {
      // Clear invalid credentials
      await clearSavedCredentials();
      return {
        success: false,
        error: 'Session refresh failed',
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error: any) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error.message || 'Biometric authentication failed',
    };
  }
};

// Get biometric icon based on supported types
export const getBiometricIcon = (supportedTypes: LocalAuthentication.AuthenticationType[]): string => {
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return '👤'; // Face ID
  }
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return '👆'; // Fingerprint
  }
  if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return '👁️'; // Iris
  }
  return '🔐'; // Generic biometric
};
