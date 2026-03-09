import { Link, router } from 'expo-router';
import { Sprout } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BiometricLoginButton } from '../../components/BiometricLoginButton';
import { SocialLoginButtons } from '../../components/SocialLoginButtons';
import { useAuth } from '../../contexts/AuthContext';
import { authenticateWithBiometrics, getSavedCredentials, saveUserCredentials } from '../../utils/biometricAuth';
// import { configureGoogleSignIn, signInWithGoogle } from '../../utils/googleAuth';
import { supabase } from '../../utils/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { emailVerificationRequired } = useAuth();

  // Configure Google Sign-In on component mount
  useEffect(() => {
    // configureGoogleSignIn(); // Temporarily disabled
    
    // Check if user has saved biometric credentials
    const checkBiometricCredentials = async () => {
      const credentials = await getSavedCredentials();
      setHasBiometricCredentials(!!credentials);
    };
    
    checkBiometricCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isLoggingIn) {
      console.log('[Login] Login already in progress, ignoring duplicate request');
      return;
    }

    setIsLoggingIn(true);
    setLoading(true);
    console.log('=== LOGIN ATTEMPT DEBUG ===');
    console.log('Email:', email.trim());
    console.log('Password length:', password.length);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      console.log('Login response - Data:', !!data);
      console.log('Login response - Error:', !!error);
      if (error) console.log('Error message:', error.message);

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Verification Required',
            'Please check your email and click the verification link to activate your account.',
            [
              { text: 'OK', onPress: () => router.push('/verify-email') }
            ]
          );
        } else {
          Alert.alert('Login Error', error.message);
        }
      } else {
        // Save credentials for biometric login
        if (data.session?.refresh_token) {
          await saveUserCredentials(data.user.id, data.session.refresh_token);
        }
        console.log('Login successful:', data.user?.email);
        console.log('Session created:', !!data.session);
        console.log('User ID:', data.user?.id);
        // Navigation is handled by RootLayout once AuthContext updates
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { signInWithGoogle } = await import('../../utils/googleAuth');
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log('Google sign-in successful:', result.user?.email);
        // Navigation is handled by RootLayout once AuthContext updates
      } else {
        Alert.alert('Google Sign-In Error', result.error || 'Google sign-in failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during Google sign-in');
      console.error('Google sign-in error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    try {
      const result = await authenticateWithBiometrics();
      
      if (result.success) {
        console.log('Biometric sign-in successful:', result.user?.email);
      } else {
        Alert.alert('Biometric Authentication Error', result.error || 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during biometric authentication');
      console.error('Biometric sign-in error:', error);
    } finally {
      setBiometricLoading(false);
    }
  };

  // Show email verification screen if required
  if (emailVerificationRequired) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Sprout size={80} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Email Verification Required 📧</Text>
          <Text style={styles.subtitle}>
            Please check your email and click the verification link to activate your account.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/verify-email')}
          >
            <Text style={styles.buttonText}>Go to Verification</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
        <View style={styles.spacer} />
        
        {/* Logo + App Name */}
        <View style={styles.logoContainer}>
          <Sprout size={48} color="#4CAF50" strokeWidth={1.5} />
          <Text style={styles.appName}>Plantascape</Text>
        </View>
        
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Return to your garden of ideas</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Social Login Buttons */}
          <SocialLoginButtons
            onGooglePress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={loading}
          />

          {/* Biometric Login Button */}
          {hasBiometricCredentials && (
            <View style={styles.biometricContainer}>
              <BiometricLoginButton
                onPress={handleBiometricSignIn}
                loading={biometricLoading}
                disabled={loading || googleLoading}
              />
            </View>
          )}

          <Link href="/reset-password" asChild>
            <TouchableOpacity 
              style={styles.forgotPassword} 
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  spacer: {
    height: 50,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#4CAF50',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  biometricContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});