import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#4CAF50',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: '#333',
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false, // iOS - hide back button text
        animation: 'slide_from_right', // Smooth slide animation
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Settings",
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="tracker" 
        options={{ title: "Growth Tracker" }}
      />
      <Stack.Screen 
        name="granary" 
        options={{ title: "Granary" }}
      />
      <Stack.Screen 
        name="compost-bin" 
        options={{ title: "Compost Bin" }}
      />
      <Stack.Screen 
        name="manage-categories" 
        options={{ title: "Manage Categories" }}
      />
      <Stack.Screen 
        name="manage-seedlings" 
        options={{ title: "Manage Seedlings" }}
      />
      <Stack.Screen 
        name="notifications-and-calendar" 
        options={{ title: "Notifications & Calendar" }}
      />
      <Stack.Screen 
        name="backup-restore" 
        options={{ title: "Backup & Restore" }}
      />
      <Stack.Screen 
        name="crash-reports" 
        options={{ title: "Crash Reports" }}
      />
      <Stack.Screen 
        name="premium" 
        options={{ 
          title: "Go Premium",
          headerShown: true,
          headerBackTitle: 'Back',
          headerBackTitleVisible: true
        }}
      />
      <Stack.Screen 
        name="faq" 
        options={{ title: "F.A.Q." }}
      />
      <Stack.Screen 
        name="contact" 
        options={{ title: "Contact Support" }}
      />
      <Stack.Screen 
        name="privacy" 
        options={{ title: "Privacy Policy" }}
      />
      <Stack.Screen 
        name="terms" 
        options={{ title: "Terms of Service" }}
      />
      <Stack.Screen 
        name="report-issue" 
        options={{ title: "Report an Issue" }}
      />
    </Stack>
  );
}


