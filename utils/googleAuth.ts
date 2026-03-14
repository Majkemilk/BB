// Tymczasowo wyłączone – Google Sign-In
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from './config';
// import { supabase } from './supabase';

/** Tymczasowo no-op (Google Sign-In wyłączony). */
export const configureGoogleSignIn = () => {
  // GoogleSignin.configure({
  //   webClientId: GOOGLE_CONFIG.webClientId,
  //   offlineAccess: false,
  // });
};

export interface GoogleSignInResult {
  success: boolean;
  user?: any;
  error?: string;
}

/** Tymczasowo wyłączone – zawsze zwraca failure (użyj "Kontynuuj bez logowania"). */
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  return {
    success: false,
    error: 'Google Sign-In jest tymczasowo wyłączony. Użyj "Kontynuuj bez logowania".',
  };
};

/** Tymczasowo no-op. */
export const signOutFromGoogle = async (): Promise<void> => {
  // await GoogleSignin.signOut();
};
