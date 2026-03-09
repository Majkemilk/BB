import Constants from 'expo-constants';

// Google OAuth Configuration
export const GOOGLE_CONFIG = {
  // Get from app.json extra section or fallback to environment variables
  webClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  androidClientId: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
};

// Biometric Authentication Configuration
export const BIOMETRIC_CONFIG = {
  promptMessage: 'Sign in to Plantascape',
  cancelLabel: 'Cancel',
  fallbackLabel: 'Use Password',
  disableDeviceFallback: false,
};

// Secure Store Keys
export const SECURE_STORE_KEYS = {
  USER_ID: 'user_id',
  REFRESH_TOKEN: 'refresh_token',
} as const;
