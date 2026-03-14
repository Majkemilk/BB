/**
 * AuthContext – wersja offline (bez Supabase).
 * Auto-logowanie na podstawie pierwszego profilu z AsyncStorage po załadowaniu danych.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadInitialData } from '../utils/loadLocalData';
import { getFirstProfile, type StoredProfile } from '../utils/localStorage';

/** Minimalny typ użytkownika (kompatybilny z miejscami używającymi User z Supabase). */
export interface OfflineUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

export const OFFLINE_USER_ID_PREFIX = 'offline-';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_premium: boolean;
  stripe_customer_id?: string;
  subscription_status?: string;
  subscription_type?: string;
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: OfflineUser | null;
  session: null;
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  loading: boolean;
  isAuthLoading: boolean;
  emailVerificationRequired: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInOffline: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToUser(profile: StoredProfile): OfflineUser {
  return {
    id: profile.id,
    email: profile.email || 'offline@local.app',
    email_confirmed_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: (profile as any).created_at || new Date().toISOString(),
  };
}

function profileToUserProfile(profile: StoredProfile): UserProfile {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    is_premium: profile.is_premium ?? false,
    stripe_customer_id: (profile as any).stripe_customer_id,
    subscription_status: (profile as any).subscription_status,
    subscription_type: (profile as any).subscription_type,
    subscription_end_date: (profile as any).subscription_end_date,
    created_at: (profile as any).created_at ?? new Date().toISOString(),
    updated_at: (profile as any).updated_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OfflineUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadInitialData();
        if (cancelled) return;
        const profile = await getFirstProfile();
        if (cancelled) return;
        if (profile) {
          setUser(profileToUser(profile));
          setUserProfile(profileToUserProfile(profile));
          console.log('[AuthContext] Auto-logged in as offline user:', profile.id, profile.email);
        }
        // Jeśli brak profilu, użytkownik pozostaje null – ekran logowania może pokazać "Kontynuuj bez logowania" (tworzy fikcyjnego użytkownika)
      } catch (e) {
        console.error('[AuthContext] Initial load failed:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsAuthLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const signOut = async () => {
    setUser(null);
    setUserProfile(null);
    setUserProfileLoading(false);
    setLoading(false);
    setIsAuthLoading(false);
    setEmailVerificationRequired(false);
    console.log('[AuthContext] Signed out (offline).');
  };

  const signInWithGoogle = async () => {
    // Nie używane w wersji offline
  };

  const signInOffline = async () => {
    const profile = await getFirstProfile();
    if (profile) {
      setUser(profileToUser(profile));
      setUserProfile(profileToUserProfile(profile));
      setLoading(false);
      setIsAuthLoading(false);
      setEmailVerificationRequired(false);
    } else {
      setUser({
        id: 'offline-local-user',
        email: 'offline@local.app',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      });
      setUserProfile(null);
      setLoading(false);
      setIsAuthLoading(false);
      setEmailVerificationRequired(false);
    }
  };

  const value: AuthContextType = {
    user,
    session: null,
    userProfile,
    userProfileLoading,
    loading,
    isAuthLoading,
    emailVerificationRequired,
    signOut,
    signInWithGoogle,
    signInOffline,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
