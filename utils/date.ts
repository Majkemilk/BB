import { Task } from '@/contexts/TaskContext';

/**
 * Calculates the next due date for a recurring task based on its recurrence rules.
 * @param task The task object with a recurrence property.
 * @returns The next due date as a Date, or null if no next date can be calculated.
 */
export function calculateNextDueDate(task: Task): Date | null {
  if (!task.recurrence || !task.dueDate) return null;
  const { type, interval = 1, daysOfWeek, dayOfMonth } = task.recurrence;
  const current = new Date(task.dueDate);

  switch (type) {
    case 'daily': {
      const next = new Date(current);
      next.setDate(current.getDate() + interval);
      return next;
    }
    case 'weekly': {
      if (!daysOfWeek || daysOfWeek.length === 0) {
        // If no days specified, just add interval weeks
        const next = new Date(current);
        next.setDate(current.getDate() + 7 * interval);
        return next;
      }
      // Find the next day in daysOfWeek after current
      const currentDay = current.getDay();
      // Sort daysOfWeek ascending
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
      // Find the next day in this week
      for (let i = 1; i <= 7 * interval; i++) {
        const candidate = new Date(current);
        candidate.setDate(current.getDate() + i);
        if (sortedDays.includes(candidate.getDay())) {
          return candidate;
        }
      }
      // Fallback: add interval weeks
      const fallback = new Date(current);
      fallback.setDate(current.getDate() + 7 * interval);
      return fallback;
    }
    case 'monthly': {
      const next = new Date(current);
      next.setMonth(current.getMonth() + interval);
      if (dayOfMonth) {
        // Set to the specified day, clamp to last day of month
        const year = next.getFullYear();
        const month = next.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDay));
      }
      return next;
    }
    case 'yearly': {
      const next = new Date(current);
      next.setFullYear(current.getFullYear() + interval);
      return next;
    }
    default:
      return null;
  }
} 