import { supabase } from './supabase';

/**
 * Wymusza weryfikację email dla użytkownika
 * Użyj tylko jeśli Supabase ma wyłączoną weryfikację
 */
export const forceEmailVerification = async (userId: string): Promise<boolean> => {
  try {
    // Wymuś weryfikację email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: '', // Email zostanie pobrany z userId
    });

    if (error) {
      console.error('Force email verification error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Force email verification error:', error);
    return false;
  }
};

/**
 * Sprawdza czy użytkownik wymaga weryfikacji
 */
export const checkEmailVerificationRequired = (user: any): boolean => {
  return !user?.email_confirmed_at;
};
