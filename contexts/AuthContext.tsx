import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { supabase } from '../utils/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_premium: boolean;
  stripe_customer_id?: string;
  subscription_status?: string; // active, canceled, past_due
  subscription_type?: string; // monthly, annual
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  loading: boolean;
  isAuthLoading: boolean;
  emailVerificationRequired: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);


  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setIsAuthLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('=== AUTH STATE CHANGE DEBUG ===');
        console.log('Auth event:', event);
        console.log('Session present:', !!session);
        console.log('User present:', !!session?.user);
        if (session?.user) {
          console.log('User ID:', session.user.id);
          console.log('User email:', session.user.email);
          console.log('Email confirmed:', !!session.user.email_confirmed_at);
        }
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[AuthContext] User signed in, checking email verification...');
          
          // 🔒 CRITICAL SECURITY CHECK: Verify email before granting access
          if (session.user && !session.user.email_confirmed_at) {
            console.log('[AuthContext] Email not verified, blocking access...');
            console.log('🔍 Email Verification Debug:', {
              userId: session.user.id,
              email: session.user.email,
              emailConfirmed: session.user.email_confirmed_at,
              emailConfirmedAt: session.user.email_confirmed_at
            });
            
            // BLOCK ACCESS - User must verify email
            setEmailVerificationRequired(true);
            setSession(null);
            setUser(null);
            setLoading(false);
            setIsAuthLoading(false);
            return;
          }
          
          // ✅ EMAIL VERIFIED - Grant full access
          console.log('[AuthContext] Email verified, granting access...');
          setSession(session);
          setUser(session.user);
          setEmailVerificationRequired(false);
          setLoading(false);
          setIsAuthLoading(false);
          return;
        }
        
        // Handle other auth events (SIGNED_OUT, TOKEN_REFRESHED, etc.)
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out, clearing state...');
          setSession(null);
          setUser(null);
          setEmailVerificationRequired(false);
          setLoading(false);
          setIsAuthLoading(false);
          return;
        }
        
        // For other events, update state normally
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setIsAuthLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Periodic session validation (OPTIMIZED - only when app is active)
  useEffect(() => {
    if (!session?.user) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPeriodicValidation = () => {
      if (interval) return; // Already running
      
      interval = setInterval(async () => {
        // Only validate if app is in foreground
        if (AppState.currentState !== 'active') {
          console.log('[AuthContext] App not active, skipping periodic validation');
          return;
        }

        try {
          console.log('[AuthContext] Running periodic validation...');
          const isValid = await validateUserSession(session);
          if (!isValid) {
            console.log('[AuthContext] Periodic validation failed, signing out...');
            await signOut();
          } else {
            console.log('[AuthContext] Periodic validation successful');
          }
        } catch (error) {
          console.error('[AuthContext] Periodic validation error:', error);
          // Don't sign out on validation errors, just log them
        }
      }, 60000); // Check every 60 seconds
      
      console.log('[AuthContext] Started periodic validation');
    };

    const stopPeriodicValidation = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
        console.log('[AuthContext] Stopped periodic validation');
      }
    };

    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      console.log('[AuthContext] App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('[AuthContext] App resumed, starting periodic validation');
        startPeriodicValidation();
        
        // Also run immediate validation when app resumes
        validateUserSession(session).then(isValid => {
          if (!isValid) {
            console.log('[AuthContext] Session invalid on app resume, signing out...');
            signOut();
          } else {
            console.log('[AuthContext] Session valid on app resume');
          }
        });
      } else {
        console.log('[AuthContext] App backgrounded, stopping periodic validation');
        stopPeriodicValidation();
      }
    };

    // Start validation immediately if app is active
    if (AppState.currentState === 'active') {
      startPeriodicValidation();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopPeriodicValidation();
    };
  }, [session?.user?.id]); // Only re-run when user ID changes

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      console.log('[AuthContext] Testing Supabase connection...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('[AuthContext] Supabase connection test failed:', error);
        return false;
      }
      
      console.log('[AuthContext] Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('[AuthContext] Supabase connection test exception:', error);
      return false;
    }
  };

  // Session validation middleware
  const validateUserSession = async (session: Session | null) => {
    if (!session?.user) {
      console.log('[AuthContext] No session or user');
      return false;
    }
    
    console.log('[AuthContext] === SESSION VALIDATION DEBUG ===');
    console.log('[AuthContext] User ID:', session.user.id);
    console.log('[AuthContext] User email:', session.user.email);
    console.log('[AuthContext] Session expires at:', session.expires_at);
    console.log('[AuthContext] Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('[AuthContext] Supabase Key present:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    // Set loading state
    setUserProfileLoading(true);
    
    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.log('[AuthContext] Supabase connection failed, skipping validation');
      setUserProfileLoading(false);
      return false;
    }
    
    try {
      const startTime = Date.now();
      console.log('[AuthContext] Starting profile query...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_premium, stripe_customer_id, subscription_status, subscription_type, subscription_end_date, created_at, updated_at')
        .eq('id', session.user.id)
        .single();
      
      const endTime = Date.now();
      console.log(`[AuthContext] Query took ${endTime - startTime}ms`);
      console.log('[AuthContext] Query result:', { data, error });
      
      if (error) {
        console.error('[AuthContext] Profile query error:', error);
        console.error('[AuthContext] Error code:', error.code);
        console.error('[AuthContext] Error message:', error.message);
        console.error('[AuthContext] Error details:', error.details);
        console.log('[AuthContext] User session invalid due to query error, signing out...');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setUserProfileLoading(false);
        return false;
      }
      
      if (!data) {
        console.log('[AuthContext] No profile found for user, creating profile...');
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              is_premium: false,
              stripe_customer_id: null
            })
            .select('id, email, full_name, avatar_url, is_premium, stripe_customer_id, subscription_status, subscription_type, subscription_end_date, created_at, updated_at')
            .single();
          
          if (createError) {
            console.error('[AuthContext] Failed to create profile:', createError);
            console.log('[AuthContext] User session invalid - profile creation failed, signing out...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setUserProfile(null);
            setUserProfileLoading(false);
            return false;
          }
          
          console.log('[AuthContext] Profile created successfully:', newProfile);
          setUserProfile(newProfile as UserProfile);
          setUserProfileLoading(false);
          return true;
        } catch (createException) {
          console.error('[AuthContext] Profile creation exception:', createException);
          console.log('[AuthContext] User session invalid - profile creation exception, signing out...');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setUserProfileLoading(false);
          return false;
        }
      }
      
      console.log('[AuthContext] Profile found:', data);
      
      // Store user profile in state
      setUserProfile(data as UserProfile);
      setUserProfileLoading(false);
      
      // Profile exists and is valid
      console.log('[AuthContext] Session validation successful');
      return true;
    } catch (error) {
      console.error('[AuthContext] Session validation exception:', error);
      console.log('[AuthContext] User session invalid due to exception, signing out...');
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setUserProfileLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Supabase signOut error:', error);
        throw error;
      }
      console.log('[AuthContext] Sign out successful, clearing state...');
      // Manually clear state to ensure immediate update
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setUserProfileLoading(false);
      console.log('[AuthContext] State cleared');
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      throw error; // Re-throw to let caller handle it
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { signInWithGoogle: googleSignIn } = await import('../utils/googleAuth');
      const result = await googleSignIn();
      
      if (result.success) {
        console.log('Google sign-in successful:', result.user?.email);
        // Navigation is handled by RootLayout once AuthContext updates
      } else {
        Alert.alert('Google Sign-In Error', result.error || 'Google sign-in failed');
      }
    } catch (error) {
      console.error("Error with Google Sign-In:", error);
      Alert.alert('Error', 'An unexpected error occurred during Google sign-in');
    }
  };

  // Monitor app state changes to validate session on resume
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('[AuthContext] App state changed to:', nextAppState);
      if (nextAppState === 'active' && session) {
        console.log('[AuthContext] App resumed with session, validating...');
        validateUserSession(session);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [session]);

  const value = {
    user,
    session,
    userProfile,
    userProfileLoading,
    loading,
    isAuthLoading,
    emailVerificationRequired,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook do używania kontekstu
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}