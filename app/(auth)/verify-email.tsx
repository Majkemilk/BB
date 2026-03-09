import { Link } from 'expo-router';
import { Mail, RefreshCw } from 'lucide-react-native';
import React, { useState } from 'react';
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
    View,
} from 'react-native';
import { resendVerificationEmail } from '../../utils/checkEmailStatus';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      console.log('📧 Attempting to resend verification email to:', email);
      
      const result = await resendVerificationEmail(email.trim());
      
      if (result.success) {
        Alert.alert(
          '📧 Verification Sent',
          'A new verification link has been sent to your email address. Please check your inbox and spam folder.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Error',
          result.error || 'Failed to send verification email. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Resend verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.title}>Check Your Inbox! 📧</Text>
               <Text style={styles.subtitle}>
                 We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
               </Text>
               
               <View style={styles.rateLimitInfo}>
                 <Text style={styles.rateLimitTitle}>📧 Email Delivery Info</Text>
                 <Text style={styles.rateLimitText}>
                   • Emails may take 5-15 minutes to arrive{'\n'}
                   • Check your spam/junk folder{'\n'}
                   • Rate limits apply (max 10 emails/day in development)
                 </Text>
               </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What's next?</Text>
          <Text style={styles.infoText}>
            1. Check your email inbox (and spam folder){'\n'}
            2. Click the verification link{'\n'}
            3. Return to the app and sign in
          </Text>
        </View>

        <View style={styles.resendSection}>
          <Text style={styles.resendTitle}>Didn't receive the email?</Text>
          <Text style={styles.resendText}>
            Enter your email address and we'll send you a new verification link.
          </Text>
          
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          
          <TouchableOpacity 
            style={[styles.resendButton, loading && styles.buttonDisabled]}
            onPress={handleResendVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.resendButtonText}>Resend Verification Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already verified? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity disabled={loading}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </Link>
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
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
  resendSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  resendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  rateLimitInfo: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  rateLimitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  rateLimitText: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  emailInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
