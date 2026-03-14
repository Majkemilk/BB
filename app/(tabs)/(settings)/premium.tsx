import PremiumLoadingIndicator from '@/components/PremiumLoadingIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { IS_OFFLINE_MODE } from '@/utils/featureFlags';
import * as WebBrowser from 'expo-web-browser';
import { CheckCircle, RefreshCw, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PREMIUM_FEATURES = [
  'Unlimited Wildflowers & Plants',
  'Advanced Recurring Tasks (Daily, Weekly, Monthly & Custom)',
  'Unlimited Custom Contexts & Plots',
  'Unlimited Subtasks (Branches)',
  'Task Templates (Seedlings)',
];

const MONTHLY_PRICE_ID = 'price_1RgktMDIZ9mfQMHFAPmKGSJK'; // TODO: Replace with your real Stripe price ID
const ANNUAL_PRICE_ID = 'price_1RgkrHDIZ9mfQMHFCA4UAAd6';   // TODO: Replace with your real Stripe price ID

export default function PremiumScreen() {
  const [loading, setLoading] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const { user, userProfile, userProfileLoading } = useAuth();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;

  // Debounce rapid changes to prevent restart
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStable(true);
    }, 1000); // 1 sekunda debouncing
    
    return () => {
      clearTimeout(timer);
      setIsStable(false);
    };
  }, [userProfileLoading, isPremium, isProfileLoaded, userProfile]);

  // Debug auto-refresh issue (reduced logging)
  useEffect(() => {
    if (isStable) {
      console.log('Premium screen stable:', { 
        userProfileLoading, 
        isPremium, 
        isProfileLoaded,
        userProfile: userProfile ? 'loaded' : 'null'
      });
    }
  }, [isStable, userProfileLoading, isPremium, isProfileLoaded, userProfile]);

  const handlePurchase = async (priceId: string) => {
    if (IS_OFFLINE_MODE) {
      Alert.alert('Offline', 'Purchases are not available in offline mode.');
      return;
    }
    setLoading(true);
    try {
      const accessToken = (user as any)?.access_token ?? null;
      if (!accessToken) {
        throw new Error('No valid session found. Please log in again.');
      }
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) throw new Error(data.error || 'Failed to create checkout session');
      const checkoutUrl = `https://checkout.stripe.com/c/${data.sessionId}`;
      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start purchase.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (IS_OFFLINE_MODE) {
      Alert.alert('Offline', 'Restore purchases is not available in offline mode.');
      return;
    }
    setLoading(true);
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error('Not signed in');
      const { data, error } = await supabase.functions.invoke('restore-purchases', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (error) throw error;
      Alert.alert('Success', 'Your purchases have been restored!');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (IS_OFFLINE_MODE) {
      Alert.alert('Offline', 'Subscription management is not available in offline mode.');
      return;
    }
    try {
      const accessToken = (user as any)?.access_token ?? null;
      if (!accessToken) throw new Error('No valid session found. Please log in again.');
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-customer-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create customer portal session');
      await WebBrowser.openBrowserAsync(data.url);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to open subscription management.');
    }
  };

  // Show loading state while profile is being loaded or while debouncing
  if (userProfileLoading || !isStable) {
    return (
      <View style={styles.container}>
        <PremiumLoadingIndicator message="Loading your premium status..." />
      </View>
    );
  }

  // Show different content based on premium status
  if (isProfileLoaded && isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Star size={40} color="#FFD700" style={{ marginBottom: 8 }} />
          <Text style={styles.title}>You're Premium! 🌟</Text>
          <Text style={styles.subtitle}>Thank you for supporting Plantascape</Text>
        </View>
        {IS_OFFLINE_MODE && (
          <Text style={styles.offlineNote}>Offline mode – premium status from your local profile.</Text>
        )}
        <View style={styles.featuresBox}>
          {PREMIUM_FEATURES.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <CheckCircle size={20} color="#388E3C" style={{ marginRight: 8 }} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={styles.premiumStatusBox}>
          <Text style={styles.premiumStatusText}>
            Your premium subscription is active and all features are unlocked!
          </Text>
        </View>
        {!IS_OFFLINE_MODE && (
          <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Star size={40} color="#FFD700" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>Unlock Your Full Potential</Text>
        <Text style={styles.subtitle}>Upgrade to Plantascape Premium</Text>
      </View>
      {IS_OFFLINE_MODE && (
        <Text style={styles.offlineNote}>Offline mode – purchases are disabled. Your limits are from your local profile.</Text>
      )}
      <View style={styles.featuresBox}>
        {PREMIUM_FEATURES.map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <CheckCircle size={20} color="#388E3C" style={{ marginRight: 8 }} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      {!IS_OFFLINE_MODE && (
        <>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.planButton, styles.monthlyButton]}
              onPress={() => handlePurchase(MONTHLY_PRICE_ID)}
              disabled={loading}
            >
              <Text style={styles.planButtonText}>Monthly Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planButton, styles.annualButton]}
              onPress={() => handlePurchase(ANNUAL_PRICE_ID)}
              disabled={loading}
            >
              <Text style={styles.planButtonText}>Annual Plan</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={loading}>
            <RefreshCw size={18} color="#388E3C" style={{ marginRight: 6 }} />
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
        </>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#388E3C" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#DAA520', // Złoty tytuł
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#B8860B', // Ciemnożółty opis
    marginBottom: 12,
  },
  featuresBox: {
    width: '100%',
    backgroundColor: '#FFFFE0', // Bardzo jasnożółte tło
    borderRadius: 12,
    padding: 18,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700', // Czysty złoty border
    shadowColor: '#FFD700', // Złoty cień
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  planButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: '#388E3C',
  },
  monthlyButton: {
    backgroundColor: '#388E3C',
  },
  annualButton: {
    backgroundColor: '#FFD700',
  },
  planButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  restoreText: {
    color: '#388E3C',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  premiumStatusBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  premiumStatusText: {
    fontSize: 16,
    color: '#388E3C',
    fontWeight: '600',
    textAlign: 'center',
  },
  manageButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#8B4513',
    fontWeight: '600',
    fontSize: 16,
  },
  offlineNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 