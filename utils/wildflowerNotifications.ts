import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface Wildflower {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Schedule wildflower reminder notifications
export async function scheduleWildflowerReminder(wildflowers: Wildflower[]) {
  if (!Constants.isDevice) {
    return;
  }

  const Notifications = require('expo-notifications');

  if (Platform.OS === 'web') {
    return;
  }

  // Read user preferences
  let preferences = {
    enabled: true,
    wildflowerReminders: true,
    frequency: '3days' as 'daily' | '3days' | 'weekly',
    reminderTime: '10:00',
  };
  
  try {
    const stored = await AsyncStorage.getItem('notification_preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      preferences.wildflowerReminders = parsed.wildflowerReminders ?? true;
      preferences.frequency = parsed.wildflowerFrequency ?? '3days';
      preferences.reminderTime = parsed.wildflowerReminderTime ?? '10:00';
    }
  } catch (error) {
    console.error('Failed to read wildflower notification preferences:', error);
  }

  // If wildflower reminders disabled, skip
  if (!preferences.wildflowerReminders) {
    return;
  }

  const wildflowerCount = wildflowers.length;
  
  // Only send reminders if user has 3+ wildflowers
  if (wildflowerCount < 3) {
    return;
  }

  // Determine message based on wildflower count
  let title: string;
  let body: string;

  if (wildflowerCount >= 3 && wildflowerCount <= 10) {
    // Option 1 - Gentle encouragement
    title = "🌸 Your Idea Meadow needs tending!";
    body = "Time to check on your wildflowers! Some might be ready to bloom into Plants.";
  } else if (wildflowerCount >= 11 && wildflowerCount <= 25) {
    // Option 3 - Playful and friendly
    title = "🌸 Your wildflowers are getting lonely!";
    body = "Time to visit your Idea Meadow! Your wildflowers miss you and want to become Plants!";
  } else if (wildflowerCount >= 26) {
    // Option 2 - Energetic motivation
    title = "🌿 Idea Meadow is calling!";
    body = "Your wildflowers are getting restless! Transform them into action-ready Plants!";
  } else {
    return; // Should not reach here
  }

  // Cancel any existing wildflower reminders
  await cancelWildflowerReminders();

  // Parse the custom time from preferences
  const [hours, minutes] = preferences.reminderTime.split(':').map(Number);
  
  // Calculate trigger based on frequency
  let triggerDate: Date;
  const now = new Date();
  
  switch (preferences.frequency) {
    case 'daily':
      // Schedule for tomorrow at the user's preferred time
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 1);
      triggerDate.setHours(hours, minutes, 0, 0);
      break;
    case '3days':
      // Schedule for 3 days from now at the user's preferred time
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 3);
      triggerDate.setHours(hours, minutes, 0, 0);
      break;
    case 'weekly':
      // Schedule for next week at the user's preferred time
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 7);
      triggerDate.setHours(hours, minutes, 0, 0);
      break;
    default:
      triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + 3);
      triggerDate.setHours(hours, minutes, 0, 0);
  }

  // Schedule the notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: { 
        type: 'wildflower_reminder',
        wildflowerCount: wildflowerCount
      },
      categoryIdentifier: 'wildflower_actions',
    },
    trigger: triggerDate,
  });

  console.log(`Wildflower reminder scheduled for ${triggerDate.toISOString()}`);
}

// Cancel existing wildflower reminder notifications
export async function cancelWildflowerReminders() {
  if (!Constants.isDevice) {
    return;
  }

  const Notifications = require('expo-notifications');

  if (Platform.OS === 'web') {
    return;
  }

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'wildflower_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Failed to cancel wildflower reminders:', error);
  }
}

// Update wildflower reminder preferences
export async function updateWildflowerReminderPreferences(
  wildflowerReminders: boolean,
  frequency: 'daily' | '3days' | 'weekly' = '3days',
  reminderTime: string = '10:00'
) {
  try {
    const stored = await AsyncStorage.getItem('notification_preferences');
    let preferences = stored ? JSON.parse(stored) : {};
    
    preferences.wildflowerReminders = wildflowerReminders;
    preferences.wildflowerFrequency = frequency;
    preferences.wildflowerReminderTime = reminderTime;
    
    await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to update wildflower reminder preferences:', error);
  }
}
