import { Task } from '@/contexts/TaskContext';
import * as Calendar from 'expo-calendar';

/**
 * Format a calendar event title from a Task.
 * Example: [Must-do] Finalize Q3 Report @Work (Project Phoenix)
 */
export function formatEventTitle(task: Task): string {
  let title = `[${task.priority}] ${task.title}`;
  if (task.context) {
    title += ` @${task.context}`;
  }
  if (task.plot) {
    title += ` (${task.plot})`;
  }
  return title;
}

/**
 * Sync a Task to the device's calendar. Returns eventId on success, null on failure or if no dueDate.
 */
export async function syncTaskToCalendar(task: Task): Promise<string | null> {
  if (!task.dueDate) return null;

  // Check/request permissions
  let permStatus: Calendar.PermissionStatus;
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    permStatus = status;
    if (permStatus !== 'granted') {
      const { status: reqStatus } = await Calendar.requestCalendarPermissionsAsync();
      permStatus = reqStatus;
    }
    if (permStatus !== 'granted') return null;
  } catch (e) {
    return null;
  }

  // Find a suitable calendar
  let calendars: Calendar.Calendar[] = [];
  try {
    calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  } catch (e) {
    return null;
  }
  const defaultCal = calendars.find(cal => cal.allowsModifications && (cal.isPrimary || cal.source?.name === 'Default')) || calendars.find(cal => cal.allowsModifications);
  if (!defaultCal) return null;

  // Prepare event details
  const title = formatEventTitle(task);
  const startDate = new Date(task.dueDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  try {
    const eventId = await Calendar.createEventAsync(defaultCal.id, {
      title,
      startDate,
      endDate,
      notes: task.description,
      timeZone: undefined, // Use device default
    });
    return eventId;
  } catch (e) {
    return null;
  }
}

/**
 * Delete a calendar event by eventId. Returns true on success, false on failure.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (e) {
    return false;
  }
} 