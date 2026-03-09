import { Redirect } from 'expo-router';

/**
 * Redirect from the root path to the Idea Meadow tab
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}