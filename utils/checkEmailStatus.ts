import { supabase } from './supabase';

/**
 * Sprawdza status wysłania emaila weryfikacyjnego
 */
export const checkEmailVerificationStatus = async (email: string) => {
  try {
    // Sprawdź czy email został wysłany (tylko dla debugowania)
    console.log('🔍 Checking email verification status for:', email);
    
    // Sprawdź czy użytkownik istnieje w bazie
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(email);
    
    if (userError) {
      console.log('❌ User not found or error:', userError);
      return { sent: false, error: userError.message };
    }
    
    console.log('✅ User found:', {
      id: userData.user?.id,
      email: userData.user?.email,
      emailConfirmed: userData.user?.email_confirmed_at,
      createdAt: userData.user?.created_at
    });
    
    return {
      sent: true,
      emailConfirmed: !!userData.user?.email_confirmed_at,
      user: userData.user
    };
    
  } catch (error) {
    console.error('❌ Error checking email status:', error);
    return { sent: false, error: 'Failed to check email status' };
  }
};

/**
 * Wysyła ponownie email weryfikacyjny
 */
export const resendVerificationEmail = async (email: string) => {
  try {
    console.log('📧 Resending verification email to:', email);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: 'plantascape://auth'
      }
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Verification email resent successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Resend error:', error);
    return { success: false, error: 'Failed to resend email' };
  }
};
