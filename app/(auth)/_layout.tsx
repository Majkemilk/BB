import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerShadowVisible: false,
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Sign In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: 'Create Account',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="reset-password" 
        options={{
          title: 'Reset Password',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="reset-success" 
        options={{
          title: 'Password Reset',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}