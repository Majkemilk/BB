import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { IS_OFFLINE_MODE } from './featureFlags';
import 'react-native-url-polyfill/auto';

// Prawidłowy kod odczytujący zmienne środowiskowe
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Test SUPABASE_URL:', supabaseUrl);
console.log('Test SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Loaded' : 'Not Loaded');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are not set!');
  console.error('URL:', supabaseUrl || 'MISSING');
  console.error('ANON_KEY:', supabaseAnonKey ? 'present' : 'MISSING');
  
  // Show alert to user instead of crashing
  setTimeout(() => {
    Alert.alert(
      'Configuration Error',
      'App is not properly configured. Please contact support or try again later.',
      [{ text: 'OK' }]
    );
  }, 1000);
}

// Supabase Storage Adapter using expo-secure-store
const SupabaseStorageAdapter = {
  setItem: async (key: string, value: string) => {
    if (!IS_OFFLINE_MODE) await SecureStore.setItemAsync(key, value);
  },
  getItem: async (key: string) => {
    if (IS_OFFLINE_MODE) return null;
    return await SecureStore.getItemAsync(key);
  },
  removeItem: async (key: string) => {
    if (!IS_OFFLINE_MODE) await SecureStore.deleteItemAsync(key);
  },
};

// Always create client (even with placeholder values to prevent crashes)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder',
  {
    auth: {
      storage: SupabaseStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Kluczowe dla mobile
    },
  }
);