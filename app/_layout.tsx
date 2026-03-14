import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';
import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
// import { ErrorBoundary } from '../components/ErrorBoundary'; // Temporarily disabled
import { NetworkStatusIndicator } from '../components/NetworkStatusIndicator';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { TaskProvider, useTasks } from '../contexts/TaskContext';
import { useNotificationPermissions } from '../hooks/useNotificationPermissions';
import { GlobalErrorHandler } from '../utils/globalErrorHandler';
// import { configureGoogleSignIn } from '../utils/googleAuth'; // Tymczasowo wyłączone
import { loadInitialData } from '../utils/loadLocalData';
import { scheduleDailyOverdueSummary } from '../utils/notifications';

// Stripe tylko gdy nie offline
const StripeWrapper = IS_OFFLINE_MODE
  ? ({ children }: { children: ReactNode }) => <>{children}</>
  : (function StripeWrapperImpl() {
      const { StripeProvider } = require('@stripe/stripe-react-native');
      const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
      return ({ children }: { children: ReactNode }) => (
        <StripeProvider publishableKey={key}>{children}</StripeProvider>
      );
    })();

function RootLayoutNav() {
  const { user, loading, isAuthLoading, emailVerificationRequired } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavState = useRootNavigationState();
  const { tasks, toggleTaskComplete } = useTasks();
  const notificationListener = useRef<any>();
  
  // Initialize notification permissions (w trybie offline nie blokujemy)
  const { permissionStatus, isLoading: permissionsLoading } = useNotificationPermissions();
  const permissionsLoadingOrBlocking = IS_OFFLINE_MODE ? false : permissionsLoading;

  // Set up notification category and response listener (tylko gdy nie offline)
  useEffect(() => {
    if (IS_OFFLINE_MODE || !rootNavState?.key) return;
    const Notifications = require('expo-notifications');
    let listener: any = null;
    Notifications.setNotificationCategoryAsync('task_actions', [
      { identifier: 'snooze', buttonTitle: 'Snooze (1 hour)', options: { opensAppToForeground: false } },
      { identifier: 'mark_as_done', buttonTitle: 'Mark as Complete', options: { opensAppToForeground: true } },
    ]).then(() => {
      listener = Notifications.addNotificationResponseReceivedListener(async (response: any) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data;
        const notificationId = response.notification.request.identifier;
        if (!data || !data.taskId) return;
        if (actionId === 'snooze') {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          await Notifications.scheduleNotificationAsync({
            content: response.notification.request.content as Notifications.NotificationContentInput,
            trigger: { seconds: 3600, repeats: false, channelId: undefined, type: 'timeInterval' as any },
          });
        } else if (actionId === 'mark_as_done') {
          try {
            await toggleTaskComplete(data.taskId);
          } catch (e) {
            console.error('Failed to mark task as complete from notification:', e);
          }
        }
      });
      notificationListener.current = listener;
    });
    return () => {
      const l = notificationListener.current;
      notificationListener.current = null;
      if (l) l.remove();
    };
  }, [toggleTaskComplete]);

  useEffect(() => {
    if (!rootNavState?.key) return;

    if (isAuthLoading) return;
    if (loading) return;
    if (emailVerificationRequired) {
      setTimeout(() => router.replace('/verify-email'), 0);
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      setTimeout(() => router.replace('/login'), 0);
    } else if (user && inAuthGroup) {
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [user, segments, loading, isAuthLoading, emailVerificationRequired, rootNavState?.key]);

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Navigation effect above will handle redirects if needed
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Schedule daily overdue summary when app starts and user is authenticated
  useEffect(() => {
    if (IS_OFFLINE_MODE || !user || !tasks || tasks.length === 0) return;
    const scheduleSummary = async () => {
      try {
        await scheduleDailyOverdueSummary(tasks);
      } catch (error) {
        console.error('Failed to schedule daily overdue summary on app start:', error);
      }
    };
    scheduleSummary();
  }, [user, tasks]);

  if (loading || isAuthLoading || permissionsLoadingOrBlocking) {
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

  // Configure Google Sign-In globally on app start (tymczasowo wyłączone)
  // useEffect(() => {
  //   configureGoogleSignIn();
  // }, []);

  // Load initial data from data/json/ into AsyncStorage (if not already loaded)
  useEffect(() => {
    loadInitialData().catch((e) => {
      console.error('[RootLayout] loadInitialData failed:', e);
    });
  }, []);

  return (
    <StripeWrapper>
      <AuthProvider>
        <TaskProvider>
          <RootLayoutNav />
        </TaskProvider>
      </AuthProvider>
    </StripeWrapper>
  );
}