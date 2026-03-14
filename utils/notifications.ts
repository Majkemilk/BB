import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { IS_OFFLINE_MODE } from './featureFlags';

// Ważne: Usunęliśmy "import * as Notifications..." stąd

// Typy zostają, bo są potrzebne w innych częściach aplikacji
export type TaskPriority = 'Key Plant' | 'Must-do' | 'Could-do' | 'Later';

interface NotificationConfig {
  title: string;
  body: string;
  trigger: any;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  context?: string;
  plot?: string;
  startDate?: Date;
  dueDate?: Date;
  isMIT: boolean;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

if (!IS_OFFLINE_MODE) {
  require('expo-notifications').setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Schedule notifications based on task priority and due date
export async function scheduleTaskNotifications(
  taskId: string,
  taskTitle: string,
  priority: TaskPriority,
  dueDate: Date
) {
  if (IS_OFFLINE_MODE || !Constants.isDevice) return;
  const Notifications = require('expo-notifications');

  if (Platform.OS === 'web') {
    return;
  }

  // Read user preferences
  let preferences = {
    enabled: true,
    preset: 'standard' as 'minimal' | 'standard' | 'proactive',
    defaultTime: '09:00',
  };
  try {
    const stored = await AsyncStorage.getItem('notification_preferences');
    if (stored) {
      preferences = { ...preferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to read notification preferences:', error);
  }

  // If reminders disabled, skip
  if (!preferences.enabled) {
    return;
  }

  const notifications: NotificationConfig[] = [];
  const now = new Date();
  const isOverdue = dueDate < now;

  // Determine which reminders to schedule based on preset
  const shouldRemind = {
    oneWeekBefore: preferences.preset === 'proactive',
    threeDaysBefore: preferences.preset === 'proactive',
    oneDayBefore: preferences.preset === 'standard' || preferences.preset === 'proactive',
    onDueDate: true, // All presets include due date
  };

  // Get priority-specific emoji and wording
  const getPriorityEmoji = () => {
    switch (priority) {
      case 'Key Plant': return '🌱';
      case 'Must-do': return '📌';
      case 'Could-do': return '📝';
      case 'Later': return '🔔';
      default: return '📅';
    }
  };

  const emoji = getPriorityEmoji();

  // Schedule reminders based on preset
  if (shouldRemind.oneWeekBefore && !isOverdue) {
    notifications.push({
      title: `${emoji} Task in 1 Week`,
      body: `Coming up next week: ${taskTitle}`,
      trigger: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
    });
  }

  if (shouldRemind.threeDaysBefore && !isOverdue) {
    notifications.push({
      title: `${emoji} Task in 3 Days`,
      body: `Coming up soon: ${taskTitle}`,
      trigger: new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    });
  }

  if (shouldRemind.oneDayBefore && !isOverdue) {
    notifications.push({
      title: `${emoji} Task Due Tomorrow`,
      body: `Remember: ${taskTitle}`,
      trigger: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000),
    });
  }

  if (shouldRemind.onDueDate && !isOverdue) {
    notifications.push({
      title: `${emoji} Task Due Today`,
      body: taskTitle,
      trigger: getDayStart(dueDate),
    });
  }

  for (const notification of notifications) {
    await Notifications.scheduleNotificationAsync({
      content: { 
        title: notification.title, 
        body: notification.body, 
        data: { taskId },
        categoryIdentifier: 'task_actions',
      },
      trigger: notification.trigger,
    });
  }
}

// NEW: Schedule daily overdue summary notification
export async function scheduleDailyOverdueSummary(tasks: Task[]) {
  if (IS_OFFLINE_MODE || !Constants.isDevice) return;
  const Notifications = require('expo-notifications');

  if (Platform.OS === 'web') {
    return;
  }

  // Read user preferences
  let preferences = {
    dailyOverdueReminder: true,
    dailyReminderTime: '09:00', // Default time
  };
  try {
    const stored = await AsyncStorage.getItem('notification_preferences');
    if (stored) {
      const parsed = JSON.parse(stored);
      preferences.dailyOverdueReminder = parsed.dailyOverdueReminder ?? true;
      preferences.dailyReminderTime = parsed.dailyReminderTime ?? '09:00';
    }
  } catch (error) {
    console.error('Failed to read notification preferences:', error);
  }

  // Check if daily overdue reminders are enabled
  if (!preferences.dailyOverdueReminder) {
    return;
  }

  // Find all overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter(task => 
    !task.isCompleted && 
    task.dueDate && 
    task.dueDate < now
  );

  // If no overdue tasks, don't schedule notification
  if (overdueTasks.length === 0) {
    return;
  }

  // Cancel any existing daily summary notifications
  await cancelDailyOverdueSummary();

  // Parse the custom time from preferences
  const [hours, minutes] = preferences.dailyReminderTime.split(':').map(Number);
  
  // Schedule for tomorrow at the user's preferred time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);

  // Create dynamic notification body
  const taskCount = overdueTasks.length;
  const priorityCounts = {
    'Key Plant': overdueTasks.filter(t => t.priority === 'Key Plant').length,
    'Must-do': overdueTasks.filter(t => t.priority === 'Must-do').length,
    'Could-do': overdueTasks.filter(t => t.priority === 'Could-do').length,
    'Later': overdueTasks.filter(t => t.priority === 'Later').length,
  };

  let body = `Good morning! You have ${taskCount} overdue Plant${taskCount > 1 ? 's' : ''} that need your attention.`;
  
  // Add priority breakdown if there are multiple priorities
  const activePriorities = Object.entries(priorityCounts).filter(([_, count]) => count > 0);
  if (activePriorities.length > 1) {
    const priorityBreakdown = activePriorities
      .map(([priority, count]) => `${count} ${priority}`)
      .join(', ');
    body += ` Including: ${priorityBreakdown}.`;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: { 
        title: '🌱 Daily Garden Check', 
        body: body,
        data: { type: 'daily_overdue_summary' }
      },
      trigger: tomorrow,
    });
    console.log('Daily overdue summary scheduled for tomorrow at', preferences.dailyReminderTime);
  } catch (error) {
    console.error('Failed to schedule daily overdue summary:', error);
  }
}

// NEW: Cancel daily overdue summary notifications
export async function cancelDailyOverdueSummary() {
  if (IS_OFFLINE_MODE || !Constants.isDevice) return;
  const Notifications = require('expo-notifications');
  
  if (Platform.OS === 'web') return;
  
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const summaryNotifications = scheduledNotifications.filter(
    (notification: any) => notification.content.data?.type === 'daily_overdue_summary'
  );
  
  for (const notification of summaryNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

// Cancel all notifications for a specific task
export async function cancelTaskNotifications(taskId: string) {
  if (IS_OFFLINE_MODE || !Constants.isDevice) return;
  const Notifications = require('expo-notifications');
  
  if (Platform.OS === 'web') return;
  
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const taskNotifications = scheduledNotifications.filter(
    (notification: any) => notification.content.data?.taskId === taskId
  );
  
  for (const notification of taskNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

// Helper functions
function getDayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  return start;
}