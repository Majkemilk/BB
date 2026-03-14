import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { IS_OFFLINE_MODE } from './featureFlags';

const COUNTERS_KEY = 'review_action_counters';

// Placeholder: increment a counter for user actions
export async function incrementActionCounter(actionType: 'task_completed' | 'key_plant_completed') {
  try {
    // Read current counters
    const raw = await AsyncStorage.getItem(COUNTERS_KEY);
    let counters = raw ? JSON.parse(raw) : { tasks_completed: 0, key_plants_completed: 0 };

    if (actionType === 'task_completed') {
      counters.tasks_completed = (counters.tasks_completed || 0) + 1;
    } else if (actionType === 'key_plant_completed') {
      counters.key_plants_completed = (counters.key_plants_completed || 0) + 1;
    }

    await AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
    await requestReviewIfAppropriate();
  } catch (e) {
    // fail silently
  }
}

// Placeholder: decide whether to show the review prompt
export async function requestReviewIfAppropriate() {
  if (IS_OFFLINE_MODE) return;
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    // Read counters
    const raw = await AsyncStorage.getItem(COUNTERS_KEY);
    const counters = raw ? JSON.parse(raw) : { tasks_completed: 0, key_plants_completed: 0 };
    const { tasks_completed = 0, key_plants_completed = 0 } = counters;

    // Check multiples
    const shouldPrompt =
      (tasks_completed > 0 && tasks_completed % 10 === 0) ||
      (key_plants_completed > 0 && key_plants_completed % 3 === 0);

    if (shouldPrompt && !IS_OFFLINE_MODE) {
      await StoreReview.requestReview();
    }
  } catch (e) {
    // fail silently
  }
} 