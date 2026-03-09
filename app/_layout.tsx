import { StripeProvider } from '@stripe/stripe-react-native';
import * as Notifications from 'expo-notifications';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
// import { ErrorBoundary } from '../components/ErrorBoundary'; // Temporarily disabled
import { NetworkStatusIndicator } from '../components/NetworkStatusIndicator';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { TaskProvider, useTasks } from '../contexts/TaskContext';
import { useNotificationPermissions } from '../hooks/useNotificationPermissions';
import { GlobalErrorHandler } from '../utils/globalErrorHandler';
import { configureGoogleSignIn } from '../utils/googleAuth';
import { scheduleDailyOverdueSummary } from '../utils/notifications';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

function RootLayoutNav() {
  const { user, loading, isAuthLoading, emailVerificationRequired } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavState = useRootNavigationState();
  const { tasks, toggleTaskComplete } = useTasks();
  const notificationListener = useRef<any>();
  
  // Initialize notification permissions
  const { permissionStatus, isLoading: permissionsLoading } = useNotificationPermissions();

  // Set up notification category and response listener
  useEffect(() => {
    if (!rootNavState?.key) {
      console.log('[RootLayout] Navigation not ready yet, skipping redirect');
      return;
    }
    // Define notification category with actions
    Notifications.setNotificationCategoryAsync('task_actions', [
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze (1 hour)',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'mark_as_done',
        buttonTitle: 'Mark as Complete',
        options: { opensAppToForeground: true },
      },
    ]);

    // Set up global notification response listener
    const listener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data;
      const notificationId = response.notification.request.identifier;
      if (!data || !data.taskId) return;
      if (actionId === 'snooze') {
        // Cancel the original notification and reschedule for 1 hour later
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await Notifications.scheduleNotificationAsync({
          content: response.notification.request.content as Notifications.NotificationContentInput,
          trigger: { seconds: 3600, repeats: false, channelId: undefined, type: 'timeInterval' as any },
        });
      } else if (actionId === 'mark_as_done') {
        // Mark the task as complete
        try {
          await toggleTaskComplete(data.taskId);
        } catch (e) {
          console.error('Failed to mark task as complete from notification:', e);
        }
      }
    });

    // Store listener reference
    notificationListener.current = listener;

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [toggleTaskComplete]);

  useEffect(() => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Loading:', loading);
    console.log('IsAuthLoading:', isAuthLoading);
    console.log('User:', !!user);
    console.log('Email verification required:', emailVerificationRequired);
    console.log('Segments:', segments);
    console.log('In auth group:', segments[0] === '(auth)');
    
    // 🔒 CRITICAL: Wait for authentication state to be fully resolved
    if (isAuthLoading) {
      console.log('Authentication state still loading, not redirecting');
      return;
    }
    
    if (loading) {
      console.log('Still loading, not redirecting');
      return;
    }
    
    // 🔒 CRITICAL: Check email verification first
    if (emailVerificationRequired) {
      console.log('Email verification required, redirecting to verify-email');
      setTimeout(() => router.replace('/verify-email'), 0);
      return;
    }
    
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      console.log('No user and not in auth, redirecting to login');
      setTimeout(() => router.replace('/login'), 0);
    } else if (user && inAuthGroup) {
      console.log('User exists and in auth, redirecting to tabs');
      setTimeout(() => router.replace('/(tabs)'), 0);
    } else {
      console.log('Navigation state is correct, no redirect needed');
    }
  }, [user, segments, loading, isAuthLoading, emailVerificationRequired, rootNavState?.key]);

  // Monitor app state changes to handle session validation on resume
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('[RootLayout] App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        console.log('[RootLayout] App resumed, checking session validity');
        // The navigation effect above will handle redirects if needed
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Log permission status for debugging
  useEffect(() => {
    if (permissionStatus) {
      console.log('Notification permission status:', permissionStatus);
    }
  }, [permissionStatus]);

  // Schedule daily overdue summary when app starts and user is authenticated
  useEffect(() => {
    if (user && tasks && tasks.length > 0) {
      const scheduleSummary = async () => {
        try {
          await scheduleDailyOverdueSummary(tasks);
        } catch (error) {
          console.error('Failed to schedule daily overdue summary on app start:', error);
        }
      };
      
      scheduleSummary();
    }
  }, [user, tasks]);

  if (loading || isAuthLoading || permissionsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NetworkStatusIndicator />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  // Initialize global error handler
  useEffect(() => {
    GlobalErrorHandler.initialize();
  }, []);

  // Configure Google Sign-In globally on app start
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY || ''}>
      <AuthProvider>
        <TaskProvider>
          <RootLayoutNav />
        </TaskProvider>
      </AuthProvider>
    </StripeProvider>
  );
}