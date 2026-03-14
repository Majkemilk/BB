import { Seed, seedsData } from '@/data/seedsData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AutoBackup } from '@/utils/autoBackup';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '@/utils/calendarSync';
import { CrashReporter } from '@/utils/crashReporter';
import { DataCache } from '@/utils/dataCache';
import { ErrorRecoveryMechanisms } from '@/utils/errorRecoveryMechanisms';
import { IS_OFFLINE_MODE } from '@/utils/featureFlags';
import * as LocalStorage from '@/utils/localStorage';
import { cancelTaskNotifications, scheduleDailyOverdueSummary, scheduleTaskNotifications } from '@/utils/notifications';
import { OfflineQueue } from '@/utils/offlineQueue';
import { scheduleWildflowerReminder } from '@/utils/wildflowerNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from './AuthContext';

function generateId(): string {
  if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- DEFINICJE TYPÓW ---
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Must-do' | 'Could-do' | 'Later' | 'Key Plant';
  context?: string;
  plot?: string;
  startDate?: Date;
  dueDate?: Date;
  isMIT: boolean;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  calendarEventId?: string;
  branches?: { id: string; text: string; isCompleted: boolean }[];
  // --- Recurrence fields ---
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // e.g., 1 for "every", 2 for "every other"
    daysOfWeek?: number[]; // For weekly: [0, 1, 6] for Sun, Mon, Sat
    dayOfMonth?: number; // For monthly
  };
  isRecurringTemplate?: boolean; // To mark the original task that holds the rule
  parentTaskId?: string; // To link generated tasks back to the template
}

export interface Wildflower {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  isArchived?: boolean;
  archivedAt?: Date;
}

// 1. Define the Template Interface
export interface Template {
  id: string;
  name: string; // The name user gives to the template
  taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'completedAt'>>; // The actual template data
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>) => Promise<void>;
  deleteTask: (id: string, silent?: boolean) => Promise<void>;
  restoreTask: (id: string, onUpgradeNeeded?: () => void, silent?: boolean) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  toggleMIT: (id: string) => Promise<void>;
  harvestWildflower: (wildflower: { id: string; title: string; description?: string }) => Promise<void>;
  
  wildflowers: Wildflower[];
  addWildflower: (wildflowerData: Omit<Wildflower, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWildflower: (id: string, updates: Partial<Omit<Wildflower, 'id'>>) => void;
  deleteWildflower: (id: string, opts?: { title?: string; description?: string }) => Promise<void>;
  
  // Compost Bin functionality
  archivedWildflowers: Wildflower[];
  archiveWildflower: (id: string) => Promise<void>;
  restoreWildflower: (id: string, onUpgradeNeeded?: () => void, silent?: boolean) => Promise<void>;
  deleteWildflowerPermanently: (id: string, silent?: boolean) => Promise<void>;

  contexts: string[];
  plots: string[];
  addContext: (newContext: string) => Promise<void>;
  deleteContext: (contextToDelete: string) => Promise<void>;
  addPlot: (newPlot: string) => Promise<void>;
  deletePlot: (plotToDelete: string) => Promise<void>;
  
  getEfficiencyStats: () => {
    efficiencyScore: number;
    totalCompleted: number;
    onTimeCompleted: number;
    lateCompleted: number;
  };

  almanac: { [seedId: string]: { growthLevel: number } };
  handleCompletionReward: (task: Task) => Promise<{ status: 'discovered' | 'nurtured', seed: Seed } | null>;

  addBranch: (taskId: string, branchText: string) => void;
  toggleBranchComplete: (taskId: string, branchId: string) => void;
  updateBranch: (taskId: string, branchId: string, newText: string) => void;
  deleteBranch: (taskId: string, branchId: string) => void;

  // 4. Export from Context
  templates: Template[];
  addTemplate: (templateData: Omit<Template, 'id'>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  // --- Recurring Task Management ---
  updateRecurringTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteRecurringTask: (taskId: string, mode: 'single' | 'all') => Promise<void>;
}

const TaskContext = createContext<TaskContextType | null>(null);

interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const { session, user, userProfile, userProfileLoading } = useAuth();
  const networkStatus = useNetworkStatus();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wildflowers, setWildflowers] = useState<Wildflower[]>([]);
  const [archivedWildflowers, setArchivedWildflowers] = useState<Wildflower[]>([]);
  const [contexts, setContexts] = useState<string[]>(['Work', 'Home', 'Personal', 'Health']);
  const [plots, setPlots] = useState<string[]>(['Quick Tasks', 'Projects', 'Long Term', 'Reference']);
  const [almanac, setAlmanac] = useState<{ [seedId: string]: { growthLevel: number } }>({});

  // 2. Add New State and Persistence
  const [templates, setTemplates] = useState<Template[]>([]);

  // Function to clear all application state
  const clearAllData = () => {
    console.log('Clearing all application data due to sign out');
    setTasks([]);
    setWildflowers([]);
    setContexts(['Work', 'Home', 'Personal', 'Health']); // Reset to defaults
    setPlots(['Quick Tasks', 'Projects', 'Long Term', 'Reference']); // Reset to defaults
    setTemplates([]);
    setAlmanac({});
  };

  // Network status monitoring and offline queue processing
  useEffect(() => {
    if (networkStatus.isConnected && !networkStatus.isOffline) {
      console.log('[TaskContext] Network restored, processing offline queue...');
      OfflineQueue.processQueue().then(({ processed, failed }) => {
        if (processed > 0 || failed > 0) {
          console.log(`[TaskContext] Offline queue processed: ${processed} successful, ${failed} failed`);
        }
      });
    }
  }, [networkStatus.isConnected, networkStatus.isOffline]);

  // Initialize error recovery mechanisms
  useEffect(() => {
    ErrorRecoveryMechanisms.initializeDefaultRecoveryActions();
    
    // Process pending recovery actions on app start
    ErrorRecoveryMechanisms.processPendingRecoveryActions().then(({ processed, successful, failed }) => {
      if (processed > 0) {
        console.log(`[TaskContext] Processed ${processed} recovery actions: ${successful} successful, ${failed} failed`);
      }
    });
  }, []);

  // Initialize auto-backup system
  useEffect(() => {
    AutoBackup.initialize();
    
    // Clean cache on app start
    DataCache.cleanExpiredCache().then(cleanedCount => {
      if (cleanedCount > 0) {
        console.log(`[TaskContext] Cleaned ${cleanedCount} expired cache entries`);
      }
    });
  }, []);

  // Initialize crash reporter
  useEffect(() => {
    CrashReporter.initialize();
  }, []);

  // Session validation removed - AuthContext handles this

  // Function to load all user data from local storage (offline)
  const loadAllData = async () => {
    const currentUser = user;
    if (!currentUser?.id) {
      console.warn('[TaskContext] No user for data loading');
      return;
    }
    const userId = currentUser.id;
    console.log('[TaskContext] Loading data for user (offline):', userId);
    try {
      const [tasksData, wildflowersData, contextsData, plotsData, templatesData] = await Promise.all([
        LocalStorage.getTasks(userId),
        LocalStorage.getWildflowers(userId),
        LocalStorage.getContexts(userId),
        LocalStorage.getPlots(userId),
        LocalStorage.getTemplates(userId),
      ]);
      setTasks(tasksData);
      const activeWildflowers = wildflowersData.filter((w) => !w.isArchived);
      const archived = wildflowersData.filter((w) => w.isArchived);
      setWildflowers(activeWildflowers);
      setArchivedWildflowers(archived);
      if (contextsData.length > 0) setContexts(contextsData);
      if (plotsData.length > 0) setPlots(plotsData);
      setTemplates(templatesData);
      await DataCache.saveToCache('cached_tasks', tasksData);
      await DataCache.saveToCache('cached_wildflowers', activeWildflowers);
      await DataCache.saveToCache('cached_contexts', contextsData);
      await DataCache.saveToCache('cached_plots', plotsData);
      await DataCache.saveToCache('cached_templates', templatesData);
      const storedAlmanac = await AsyncStorage.getItem(`user_almanac_${userId}`);
      const parsedAlmanac = storedAlmanac ? JSON.parse(storedAlmanac) : {};
      setAlmanac(parsedAlmanac);
    } catch (error) {
      console.error('[TaskContext] Failed to load data from storage:', error);
    }
  };

  // Load data when user is set
  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      clearAllData();
    } else {
      loadAllData();
    }
  }, [user?.id]);

  // Schedule daily overdue summary when tasks change
  useEffect(() => {
    const scheduleSummary = async () => {
      try {
        await scheduleDailyOverdueSummary(tasks);
      } catch (error) {
        console.error('Failed to schedule daily overdue summary:', error);
      }
    };
    
    scheduleSummary();
  }, [tasks]);

  const addTask = async (taskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>) => {
    const currentUser = user;
    if (!currentUser?.id) {
      console.error('User not found, cannot add task.');
      return;
    }
    const userId = currentUser.id;
    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const taskLimit = 30;
    const activeTasks = tasks.filter(task => !task.isCompleted);
    if (isProfileLoaded && !isPremium && activeTasks.length >= taskLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Upgrade' }]
      );
      return;
    }
    const newTask: Task = {
      id: generateId(),
      ...taskData,
      isCompleted: false,
      createdAt: new Date(),
      branches: (taskData as any).branches ?? [],
    };
    setTasks(prev => [newTask, ...prev]);
    try {
      await LocalStorage.setTasks(userId, [newTask, ...tasks]);
      if (!IS_OFFLINE_MODE && newTask.dueDate) {
        await scheduleTaskNotifications(newTask.id, newTask.title, newTask.priority, newTask.dueDate);
      }
      try {
        const syncEnabled = (await AsyncStorage.getItem('calendar_sync_enabled')) === 'true';
        const calendarId = await AsyncStorage.getItem('calendar_sync_calendar_id');
        if (!IS_OFFLINE_MODE && syncEnabled && newTask.dueDate && calendarId) {
          const eventId = await createCalendarEvent(newTask, calendarId);
          if (eventId) await updateTask(newTask.id, { calendarEventId: eventId });
        }
      } catch (e) { /* ignore */ }
      if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[TaskContext] Failed to add task:', error);
      setTasks(prev => prev.filter(t => t.id !== newTask.id));
      Alert.alert('Error', 'Failed to add task.');
    }
  };

  const harvestWildflower = async (wildflower: { id: string; title: string; description?: string }) => {
    const currentUser = user;
    if (!currentUser?.id) {
      console.error('User not found, cannot harvest wildflower.');
      return;
    }

    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const taskLimit = 30;
    const activeTasks = tasks.filter(task => !task.isCompleted);
    if (isProfileLoaded && !isPremium && activeTasks.length >= taskLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Upgrade' }]
      );
      return;
    }

    await addTask({
      title: wildflower.title,
      description: wildflower.description ?? '',
      priority: 'Could-do',
      isMIT: false,
    });
    await deleteWildflower(wildflower.id);
  };

  const deleteTask = async (id: string, silent?: boolean) => { 
    const currentUser = user;
    if (!currentUser?.id) return;
    const task = tasks.find(t => t.id === id);
    try { await cancelTaskNotifications(id); } catch (e) { console.error(e); }
    try {
      const syncEnabled = (await AsyncStorage.getItem('calendar_sync_enabled')) === 'true';
      if (!IS_OFFLINE_MODE && syncEnabled && task?.calendarEventId) {
        await deleteCalendarEvent(task.calendarEventId);
      }
    } catch (e) { /* ignore */ }
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Failed to persist task deletion:', e);
    }
    if (!silent) {
      if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌿 Your Plant has been permanently cleared! Your garden is ready for new growth!');
    }
  };

  const restoreTask = async (id: string, onUpgradeNeeded?: () => void, silent?: boolean) => {
    // Check task limit for non-premium users BEFORE restoring
    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const taskLimit = 30;
    const activeTasks = tasks.filter(task => !task.isCompleted);
    
    if (isProfileLoaded && !isPremium && activeTasks.length >= taskLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            if (onUpgradeNeeded) {
              onUpgradeNeeded();
            }
          }}
        ]
      );
      return;
    }
    
    await updateTask(id, { isCompleted: false, completedAt: undefined });
    
    // Success message (only if not silent)
    if (!silent) {
      if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌱 Your Plant has sprouted back to life! It\'s growing again in the Action Garden!');
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id'>>) => { 
    const currentUser = user;
    if (!currentUser?.id) return;
    let updatedTask: Task | undefined;
    const nextTasks = tasks.map((task) => {
      if (task.id !== id) return task;
      updatedTask = {
        ...task,
        ...updates,
        recurrence: updates.recurrence !== undefined ? updates.recurrence : task.recurrence,
      };
      return updatedTask;
    });
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Failed to persist task update:', e);
      return;
    }
    
    // Wait for state update to complete (not strictly necessary for notifications, but for safety)
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (updatedTask) {
    // Reschedule notifications if due date or priority changed
    if (updates.dueDate || updates.priority) {
      try {
        await cancelTaskNotifications(id);
        if (updatedTask.dueDate && !updatedTask.isCompleted) {
          await scheduleTaskNotifications(
            id,
            updatedTask.title,
            updatedTask.priority,
            updatedTask.dueDate
          );
        }
      } catch (error) {
        console.error('Failed to reschedule notifications for updated task:', error);
      }
    }
    // Calendar sync logic
    try {
      const syncEnabled = (await AsyncStorage.getItem('calendar_sync_enabled')) === 'true';
      const calendarId = await AsyncStorage.getItem('calendar_sync_calendar_id');
      // Only update event if key fields changed and event exists
      if (syncEnabled && updatedTask.calendarEventId && (updates.title || updates.dueDate || updates.description || updates.priority || updates.context || updates.plot)) {
        await updateCalendarEvent(updatedTask.calendarEventId, updatedTask);
      }
    } catch (e) { /* ignore */ }
    }
  };

  // Helper function to calculate the next due date for recurring tasks
  const calculateNextDueDate = (currentDueDate: Date, recurrence: Task['recurrence']): Date => {
    const nextDate = new Date(currentDueDate);
    if (!recurrence) return nextDate;

    switch (recurrence.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + recurrence.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * recurrence.interval);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
        break;
      default:
        break;
    }
    return nextDate;
  };

  const toggleTaskComplete = async (id: string) => { 
    const task = tasks.find(t => t.id === id);
    if (!task) {
      console.error("Task not found:", id);
      return;
    }

    const isCompleting = !task.isCompleted;
    if (!isCompleting) {
      return; 
    }

    await updateTask(id, { isCompleted: true, completedAt: new Date() });

    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌾 Your Plant has been harvested! It\'s now resting in the Granary!');

    if (task.recurrence && task.dueDate && user?.id) {
      const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);
      let nextStartDate: Date | undefined;
      if (task.startDate && task.dueDate) {
        const duration = task.dueDate.getTime() - task.startDate.getTime();
        nextStartDate = new Date(nextDueDate.getTime() - duration);
      }
      const nextTask: Task = {
        id: generateId(),
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        context: task.context,
        plot: task.plot,
        startDate: nextStartDate,
        dueDate: nextDueDate,
        isMIT: task.isMIT,
        isCompleted: false,
        createdAt: new Date(),
        recurrence: task.recurrence,
        isRecurringTemplate: false,
        parentTaskId: task.isRecurringTemplate ? task.id : task.parentTaskId,
        branches: task.branches ?? [],
      };
      const nextTasks = [nextTask, ...tasks.map(t => t.id === id ? { ...t, isCompleted: true, completedAt: new Date() } : t)];
      setTasks(nextTasks);
      try {
        await LocalStorage.setTasks(user.id, nextTasks);
      } catch (e) {
        console.error('Failed to persist recurring task:', e);
      }
    }
  };

  const toggleMIT = async (id: string) => { 
    const currentUser = user;
    if (!currentUser?.id) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newPriority: 'Must-do' | 'Could-do' | 'Later' | 'Key Plant' = task.isMIT ? 'Could-do' : 'Key Plant';
    const updatedTask = { ...task, isMIT: !task.isMIT, priority: newPriority };
    const nextTasks = tasks.map(t => t.id === id ? updatedTask : t);
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Failed to persist MIT toggle:', e);
    }
    
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '⭐ Your Plant is now a Key Plant! It\'s getting the attention it deserves!');
    
    if (updatedTask.dueDate && !updatedTask.isCompleted) {
      try {
        await cancelTaskNotifications(id);
        await scheduleTaskNotifications(
          id,
          updatedTask.title,
          updatedTask.priority,
          updatedTask.dueDate
        );
      } catch (error) {
        console.error('Failed to reschedule notifications for MIT toggle:', error);
      }
    }
  };
  
  const addWildflower = async (wildflowerData: Omit<Wildflower, 'id' | 'createdAt' | 'updatedAt'>) => {
    const currentUser = user;
    if (!currentUser?.id) {
      console.error('User not found, cannot add wildflower.');
      return;
    }
    const now = new Date();
    const newW: Wildflower = {
      id: generateId(),
      title: wildflowerData.title,
      description: wildflowerData.description ?? '',
      createdAt: now,
      updatedAt: undefined,
    };
    const nextList = [newW, ...wildflowers];
    setWildflowers(nextList);
    try {
      await LocalStorage.setWildflowers(currentUser.id, [...nextList.map(w => ({ ...w, isArchived: false })), ...archivedWildflowers.map(w => ({ ...w, isArchived: true }))]);
    } catch (e) {
      console.error('Failed to persist wildflower:', e);
      return;
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌸 Your new Wildflower is blooming in the Idea Meadow! Let your creativity grow!');
    try {
      await scheduleWildflowerReminder([newW, ...wildflowers]);
    } catch (error) {
      console.error('Failed to schedule wildflower reminder:', error);
    }
  };
  const updateWildflower = async (id: string, updates: Partial<Omit<Wildflower, 'id'>>) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const nextList = wildflowers.map(w => w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w);
    setWildflowers(nextList);
    try {
      await LocalStorage.setWildflowers(currentUser.id, [...nextList.map(w => ({ ...w, isArchived: false })), ...archivedWildflowers.map(w => ({ ...w, isArchived: true }))]);
    } catch (e) {
      console.error('Failed to persist wildflower update:', e);
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌸 Your Wildflower has been tended to! It\'s looking more vibrant than ever!');
  };
  const deleteWildflower = async (id: string, _opts?: { title?: string; description?: string }) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const nextList = wildflowers.filter(w => w.id !== id);
    setWildflowers(nextList);
    try {
      await LocalStorage.setWildflowers(currentUser.id, [...nextList.map(w => ({ ...w, isArchived: false })), ...archivedWildflowers.map(w => ({ ...w, isArchived: true }))]);
    } catch (e) {
      console.error('Failed to persist wildflower deletion:', e);
    }
  };

  // --- COMPOST BIN FUNCTIONS ---
  
  /**
   * Archive a wildflower (move to Compost Bin)
   */
  const archiveWildflower = async (id: string) => {
    const currentUser = user;
    if (!currentUser?.id) return;

    const wildflowerToArchive = wildflowers.find(w => w.id === id);
    if (!wildflowerToArchive) return;

    const archivedItem = { ...wildflowerToArchive, isArchived: true, archivedAt: new Date() } as Wildflower & { isArchived?: boolean; archivedAt?: Date };
    setWildflowers(prev => prev.filter(w => w.id !== id));
    setArchivedWildflowers(prev => [archivedItem, ...prev]);

    const activeList = wildflowers.filter(w => w.id !== id);
    const archivedList = [archivedItem, ...archivedWildflowers];
    try {
      await LocalStorage.setWildflowers(currentUser.id, [...activeList.map(w => ({ ...w, isArchived: false })), ...archivedList.map(w => ({ ...w, isArchived: true }))]);
    } catch (e) {
      console.error('Failed to persist archive:', e);
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌿 Your Wildflower has been composted! It\'s nourishing the soil for new ideas!');
  };

  /**
   * Restore a wildflower from Compost Bin
   */
  const restoreWildflower = async (id: string, onUpgradeNeeded?: () => void, silent?: boolean) => {
    const currentUser = user;
    if (!currentUser?.id) return;

    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const wildflowerLimit = 30;
    if (isProfileLoaded && !isPremium && wildflowers.length >= wildflowerLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${wildflowerLimit} wildflowers. Upgrade to Premium for unlimited ideas!`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Upgrade', onPress: () => onUpgradeNeeded?.() }]
      );
      return;
    }

    const toRestore = archivedWildflowers.find(w => w.id === id);
    if (!toRestore) return;

    const restored = { ...toRestore, isArchived: false, archivedAt: undefined } as Wildflower;
    setArchivedWildflowers(prev => prev.filter(w => w.id !== id));
    setWildflowers(prev => [restored, ...prev]);

    const activeList = [restored, ...wildflowers];
    const archivedList = archivedWildflowers.filter(w => w.id !== id);
    try {
      await LocalStorage.setWildflowers(currentUser.id, [...activeList.map(w => ({ ...w, isArchived: false })), ...archivedList.map(w => ({ ...w, isArchived: true }))]);
    } catch (e) {
      console.error('Failed to persist restore:', e);
    }
    if (!silent) {
      if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌸 Your Wildflower is back in the Idea Meadow!');
    }
  };

  /**
   * Permanently delete a wildflower from Compost Bin
   */
  const deleteWildflowerPermanently = async (id: string, _silent?: boolean) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const nextArchived = archivedWildflowers.filter(w => w.id !== id);
    setArchivedWildflowers(nextArchived);
    try {
      await LocalStorage.setWildflowers(currentUser.id, [...wildflowers.map(w => ({ ...w, isArchived: false })), ...nextArchived.map(w => ({ ...w, isArchived: true }))]);
    } catch (e) {
      console.error('Failed to persist permanent delete:', e);
    }
  };

  // --- END COMPOST BIN FUNCTIONS ---

  const addContext = async (newContext: string) => {
    if (!newContext || contexts.includes(newContext) || !user?.id) return;
    const next = [newContext, ...contexts];
    setContexts(next);
    try {
      await LocalStorage.setContexts(user.id, next);
    } catch (e) {
      console.error('Failed to persist context:', e);
    }
  };

  const deleteContext = async (contextToDelete: string) => { 
    if (!user?.id) return; 
    const next = contexts.filter(c => c !== contextToDelete);
    setContexts(next);
    try {
      await LocalStorage.setContexts(user.id, next);
    } catch (e) {
      console.error('Failed to persist context delete:', e);
    }
  };

  const addPlot = async (newPlot: string) => {
    if (!newPlot || plots.includes(newPlot) || !user?.id) return;
    const next = [newPlot, ...plots];
    setPlots(next);
    try {
      await LocalStorage.setPlots(user.id, next);
    } catch (e) {
      console.error('Failed to persist plot:', e);
    }
  };

  const deletePlot = async (plotToDelete: string) => { 
    if (!user?.id) return; 
    const next = plots.filter(p => p !== plotToDelete);
    setPlots(next);
    try {
      await LocalStorage.setPlots(user.id, next);
    } catch (e) {
      console.error('Failed to persist plot delete:', e);
    }
  };

  const getEfficiencyStats = () => {
    const completedTasks = tasks.filter(task => task.isCompleted && task.completedAt && task.dueDate);
    const onTimeCompleted = completedTasks.filter(task => {
      const completedDate = new Date(task.completedAt!);
      const dueDate = new Date(task.dueDate!);
      return completedDate <= dueDate;
    }).length;
    const lateCompleted = completedTasks.filter(task => {
      const completedDate = new Date(task.completedAt!);
      const dueDate = new Date(task.dueDate!);
      return completedDate > dueDate;
    }).length;
    const totalCompleted = completedTasks.length;
    const efficiencyScore = totalCompleted > 0 ? Math.round((onTimeCompleted / totalCompleted) * 100) : 0;
    
    return {
      efficiencyScore,
      totalCompleted,
      onTimeCompleted,
      lateCompleted,
    };
  };

  const handleCompletionReward = async (task: Task): Promise<{ status: 'discovered' | 'nurtured', seed: Seed } | null> => {
    // Determine chance based on task priority
    let chance = 0;
    let possibleSeeds: Seed[] = [];
    
    switch (task.priority) {
      case 'Later':
        chance = 0.15; // 15% chance
        possibleSeeds = seedsData.filter(seed => seed.rarity === 'common');
        break;
      case 'Could-do':
        chance = 0.30; // 30% chance
        possibleSeeds = seedsData.filter(seed => seed.rarity === 'common' || seed.rarity === 'rare');
        break;
      case 'Must-do':
        chance = 0.60; // 60% chance
        possibleSeeds = seedsData.filter(seed => seed.rarity === 'rare' || seed.rarity === 'epic');
        break;
      case 'Key Plant':
        chance = 1.0; // 100% chance
        possibleSeeds = seedsData.filter(seed => seed.rarity === 'epic' || seed.rarity === 'legendary');
        break;
    }

    // Check if a seed is found
    if (Math.random() > chance || possibleSeeds.length === 0) {
      return null;
    }

    // Select a random seed from possible seeds
    const foundSeed = possibleSeeds[Math.floor(Math.random() * possibleSeeds.length)];
    
    // Check if this seed is already in the almanac
    if (almanac[foundSeed.id]) {
      // Seed exists, increment growth level
      const currentLevel = almanac[foundSeed.id].growthLevel;
      const newLevel = Math.min(currentLevel + 1, foundSeed.growthGoal);
      
      setAlmanac(prev => ({
        ...prev,
        [foundSeed.id]: { growthLevel: newLevel }
      }));
      
      return { status: 'nurtured', seed: foundSeed };
    } else {
      // New seed discovered
      setAlmanac(prev => ({
        ...prev,
        [foundSeed.id]: { growthLevel: 0 }
      }));
      
      return { status: 'discovered', seed: foundSeed };
    }
  };

  // --- BRANCHES (SUBTASKS) MANAGEMENT ---
  const addBranch = async (taskId: string, branchText: string) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newBranch = { id: Date.now().toString(), text: branchText, isCompleted: false };
    const updatedBranches = task.branches ? [...task.branches, newBranch] : [newBranch];
    const nextTasks = tasks.map(t => t.id === taskId ? { ...t, branches: updatedBranches } : t);
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Error persisting branches (addBranch):', e);
    }
  };

  const toggleBranchComplete = async (taskId: string, branchId: string) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.branches) return;

    const updatedBranches = task.branches.map(branch =>
      branch.id === branchId ? { ...branch, isCompleted: !branch.isCompleted } : branch
    );
    const nextTasks = tasks.map(t => t.id === taskId ? { ...t, branches: updatedBranches } : t);
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Error persisting branches (toggleBranchComplete):', e);
    }
  };

  const updateBranch = async (taskId: string, branchId: string, newText: string) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.branches) return;

    const updatedBranches = task.branches.map(branch =>
      branch.id === branchId ? { ...branch, text: newText } : branch
    );
    const nextTasks = tasks.map(t => t.id === taskId ? { ...t, branches: updatedBranches } : t);
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Error persisting branches (updateBranch):', e);
    }
  };

  const deleteBranch = async (taskId: string, branchId: string) => {
    const currentUser = user;
    if (!currentUser?.id) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.branches) return;

    const updatedBranches = task.branches.filter(branch => branch.id !== branchId);
    const nextTasks = tasks.map(t => t.id === taskId ? { ...t, branches: updatedBranches } : t);
    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Error persisting branches (deleteBranch):', e);
    }
  };

  const addTemplate = async (templateData: Omit<Template, 'id'>) => {
    if (!user?.id) return;

    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const templateLimit = 5;
    if (isProfileLoaded && !isPremium && templates.length >= templateLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${templateLimit} Seedling templates. Upgrade to Premium for unlimited templates!`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Upgrade' }]
      );
      return;
    }

    const taskDataForTemplate = {
      ...templateData.taskData,
      branches: (templateData.taskData as any)?.branches ?? [],
    };
    const newTemplate: Template = {
      id: generateId(),
      name: templateData.name,
      taskData: taskDataForTemplate,
    };
    const next = [newTemplate, ...templates];
    setTemplates(next);
    try {
      await LocalStorage.setTemplates(user.id, next);
    } catch (e) {
      console.error('Failed to persist template:', e);
      return;
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌿 Your new Seedling template is ready! It\'s waiting to grow into a Plant!');
  };

  const deleteTemplate = async (templateId: string) => { 
    if (!user?.id) return; 
    const next = templates.filter(t => t.id !== templateId);
    setTemplates(next);
    try {
      await LocalStorage.setTemplates(user.id, next);
    } catch (e) {
      console.error('Failed to persist template delete:', e);
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌿 Your Seedling template has been uprooted forever! Your garden now has more space for fresh templates!');
  };

  // --- Recurring Task Management ---
  const updateRecurringTask = async (taskId: string, updates: Partial<Task>) => {
    const currentUser = user;
    if (!currentUser?.id) return;

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) {
      Alert.alert('Error', 'Task not found.');
      return;
    }

    const hasUpdates = Object.keys(updates).length > 0;
    if (!hasUpdates) {
      Alert.alert('Warning', 'No changes to save.');
      return;
    }

    const parentId = currentTask.isRecurringTemplate ? currentTask.id : currentTask.parentTaskId;
    const now = new Date();

    const updatedTasks = tasks
      .map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            ...updates,
            recurrence: undefined,
            parentTaskId: undefined,
            isRecurringTemplate: false,
          } as Task;
        }
        return task;
      })
      .filter(task => {
        if (task.parentTaskId === parentId && !task.isCompleted && task.dueDate) {
          const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
          if (due >= now) return false;
        }
        return true;
      });

    setTasks(updatedTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, updatedTasks);
    } catch (e) {
      console.error('Failed to persist updateRecurringTask:', e);
      return;
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🔄 Your recurring Plant has been tended to! It\'s now a standalone beauty!');
  };

  const deleteRecurringTask = async (taskId: string, mode: 'single' | 'all') => {
    const currentUser = user;
    if (!currentUser?.id) return;

    if (mode === 'single') {
      const nextTasks = tasks.filter(t => t.id !== taskId);
      setTasks(nextTasks);
      try {
        await LocalStorage.setTasks(currentUser.id, nextTasks);
      } catch (e) {
        console.error('Failed to persist delete recurring (single):', e);
      }
      if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌿 Your Plant has been permanently cleared! Your garden is ready for new growth!');
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const parentId = task.isRecurringTemplate ? task.id : task.parentTaskId;
    if (!parentId) return;

    const now = new Date();
    const nextTasks = tasks.filter(t => {
      if (t.id === parentId) return false;
      if (t.parentTaskId === parentId && !t.isCompleted && t.dueDate) {
        const due = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
        if (due >= now) return false;
      }
      return true;
    });

    setTasks(nextTasks);
    try {
      await LocalStorage.setTasks(currentUser.id, nextTasks);
    } catch (e) {
      console.error('Failed to persist delete recurring (all):', e);
    }
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌿 Your Plant has been permanently cleared! Your garden is ready for new growth!');
  };

  return (
    <TaskContext.Provider
      value={{
        tasks, addTask, deleteTask, restoreTask, updateTask, toggleTaskComplete, toggleMIT, harvestWildflower,
        wildflowers, addWildflower, updateWildflower, deleteWildflower,
        archivedWildflowers, archiveWildflower, restoreWildflower, deleteWildflowerPermanently,
        contexts, plots, addContext, deleteContext, addPlot, deletePlot,
        getEfficiencyStats,
        almanac,
        handleCompletionReward,
        addBranch,
        toggleBranchComplete,
        updateBranch,
        deleteBranch,
        templates,
        addTemplate,
        deleteTemplate,
        updateRecurringTask,
        deleteRecurringTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}