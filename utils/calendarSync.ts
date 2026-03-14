import { Task } from '@/contexts/TaskContext';
import * as Calendar from 'expo-calendar';
import { Alert } from 'react-native';
import { IS_OFFLINE_MODE } from './featureFlags';

const ensureCalendarPermissions = async (): Promise<boolean> => {
  if (IS_OFFLINE_MODE) return false;
  const { status } = await Calendar.getCalendarPermissionsAsync();
  if (status === 'granted') {
    return true;
  }
  const { status: newStatus } = await Calendar.requestCalendarPermissionsAsync();
  if (newStatus === 'granted') {
    return true;
  }
  Alert.alert(
    'Permission Required',
    'Calendar access is required to sync tasks. Please enable it in your device settings.'
  );
  return false;
};

export function formatEventTitle(task: Task): string {
  let title = `[${task.priority}] ${task.title}`;
  if (task.context) title += ` @${task.context}`;
  if (task.plot) title += ` (${task.plot})`;
  return title;
}

export async function createCalendarEvent(task: Task, calendarId: string): Promise<string | null> {
  const hasPermissions = await ensureCalendarPermissions();
  if (!hasPermissions) {
    return null;
  }
  
  try {
    if (!task.dueDate) return null;
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: formatEventTitle(task),
      startDate,
      endDate,
      notes: task.description,
      timeZone: undefined,
    });
    return eventId;
  } catch (e) {
    return null;
  }
}

export async function updateCalendarEvent(eventId: string, task: Task): Promise<boolean> {
  if (IS_OFFLINE_MODE) return false;
  const hasPermissions = await ensureCalendarPermissions();
  if (!hasPermissions) return false;
  try {
    if (!eventId || !task.dueDate) return false;
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    await Calendar.updateEventAsync(eventId, {
      title: formatEventTitle(task),
      startDate,
      endDate,
      notes: task.description,
      timeZone: undefined,
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (IS_OFFLINE_MODE) return false;
  const hasPermissions = await ensureCalendarPermissions();
  if (!hasPermissions) return false;
  try {
    if (!eventId) return false;
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (e) {
    return false;
  }
} 