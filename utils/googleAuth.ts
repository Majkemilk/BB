import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from './config';
import { supabase } from './supabase';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: GOOGLE_CONFIG.webClientId,
    offlineAccess: false,
  });
};

export interface GoogleSignInResult {
  success: boolean;
  user?: any;
  error?: string;
}

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  try {
    console.log('[GoogleAuth] Starting Google Sign-In...');
    
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('[GoogleAuth] Google Play Services available');

    // Sign in with Google
    console.log('[GoogleAuth] Calling GoogleSignin.signIn()...');
    const signInResult = await GoogleSignin.signIn();
    console.log('[GoogleAuth] SignIn result received:', {
      resultType: signInResult.type,
      hasData: !!signInResult.data,
      hasIdToken: !!(signInResult.data?.idToken || signInResult.idToken),
      hasUser: !!(signInResult.data?.user || signInResult.user),
    });

    // FIX: Handle both response structures
    // New versions return { type: 'success', data: { idToken, user } }
    // Old versions return { idToken, user } directly
    const idToken = signInResult.data?.idToken || signInResult.idToken;
    const user = signInResult.data?.user || signInResult.user;

    if (!idToken) {
      console.error('[GoogleAuth] ❌ No ID token received. Full result:', JSON.stringify(signInResult, null, 2));
      return {
        success: false,
        error: 'No ID token received from Google',
      };
    }
    
    console.log('[GoogleAuth] ✅ ID token received successfully');
    console.log('[GoogleAuth] User email:', user?.email);

    // Sign in with Supabase using the Google ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('Supabase Google sign-in error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user data received from Supabase',
      };
    }

    // Create or update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: user.name || null,
        avatar_url: user.photo || null,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the sign-in if profile creation fails
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error: any) {
    console.error('[GoogleAuth] ❌ Error occurred:', error);
    console.error('[GoogleAuth] Error code:', error.code);
    console.error('[GoogleAuth] Error message:', error.message);
    console.error('[GoogleAuth] Full error:', JSON.stringify(error, null, 2));
    
    // Handle specific Google Sign-In errors
    if (error.code === 'SIGN_IN_CANCELLED') {
      return {
        success: false,
        error: 'Sign-in was cancelled',
      };
    }
    
    if (error.code === 'IN_PROGRESS') {
      return {
        success: false,
        error: 'Sign-in is already in progress',
      };
    }
    
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return {
        success: false,
        error: 'Google Play Services not available',
      };
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google sign-out error:', error);
  }
};
