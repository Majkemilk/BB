import { Seed, seedsData } from '@/data/seedsData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AutoBackup } from '@/utils/autoBackup';
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '@/utils/calendarSync';
import { CrashReporter } from '@/utils/crashReporter';
import { DatabaseFallbackStrategies } from '@/utils/databaseFallbackStrategies';
import { DataCache } from '@/utils/dataCache';
import { ErrorHandler } from '@/utils/errorHandler';
import { ErrorRecoveryMechanisms } from '@/utils/errorRecoveryMechanisms';
import { cancelTaskNotifications, scheduleDailyOverdueSummary, scheduleTaskNotifications } from '@/utils/notifications';
import { OfflineQueue } from '@/utils/offlineQueue';
import { RetryMechanism } from '@/utils/retryMechanism';
import { supabase } from '@/utils/supabase';
import { scheduleWildflowerReminder } from '@/utils/wildflowerNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

// --- DEFINICJE TYPÓW ---
// Helper to validate UUIDs
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
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

  // Function to load all user data from Supabase
  const loadAllData = async () => {
    if (!session || !user) {
      console.warn('No user session available for data loading');
      return;
          }

    // Session validation handled by AuthContext
    console.log('[TaskContext] Loading data for user:', user.id);

    try {
      const userId = user.id;

      // Try to load from cache first
      const cachedTasks = await DataCache.loadFromCache('cached_tasks');
      const cachedWildflowers = await DataCache.loadFromCache('cached_wildflowers');
      const cachedTemplates = await DataCache.loadFromCache('cached_templates');
      const cachedContexts = await DataCache.loadFromCache('cached_contexts');
      const cachedPlots = await DataCache.loadFromCache('cached_plots');
      const cachedAlmanac = await DataCache.loadFromCache('cached_almanac');

      // If we have cached data, use it for immediate UI update
      if (cachedTasks && cachedTasks.length > 0) {
        console.log('[TaskContext] Loading from cache for immediate UI update');
        setTasks(cachedTasks);
      }
      if (cachedWildflowers && cachedWildflowers.length > 0) {
        setWildflowers(cachedWildflowers);
      }
      if (cachedTemplates && cachedTemplates.length > 0) {
        setTemplates(cachedTemplates);
      }
      if (cachedContexts && cachedContexts.length > 0) {
        setContexts(cachedContexts);
      }
      if (cachedPlots && cachedPlots.length > 0) {
        setPlots(cachedPlots);
      }
      if (cachedAlmanac) {
        setAlmanac(cachedAlmanac);
      }

      // --- Fetch Tasks ---
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        if (tasksError) throw tasksError;
        const mappedTasks = tasksData ? tasksData.map((t: any) => ({
          ...t,
          id: t.id,
          title: t.title,
          description: t.description || '',
          priority: t.priority,
          context: t.context || undefined,
          plot: t.plot || undefined,
          startDate: t.start_date ? new Date(t.start_date) : undefined,
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          isMIT: t.is_mit ?? false,
          isCompleted: t.is_completed ?? false,
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
          recurrence: t.recurrence || undefined,
          branches: t.branches || [],
          isRecurringTemplate: t.is_recurring_template || undefined,
          parentTaskId: t.parent_task_id || undefined,
          calendarEventId: t.calendar_event_id || undefined,
        })) : [];
        setTasks(mappedTasks);
        
        // Cache the data
        await DataCache.saveToCache('cached_tasks', mappedTasks);
        console.log('[TaskContext] Cached tasks data');
      } catch (err) {
        console.error('Failed to load tasks from Supabase:', err);
      }

      // --- Fetch Active Wildflowers (not archived) ---
      try {
        const { data: wildflowersData, error: wildflowersError } = await supabase
          .from('wildflowers')
          .select('*')
          .eq('user_id', userId)
          .or('is_archived.is.null,is_archived.eq.false');
        if (wildflowersError) throw wildflowersError;
        const mappedWildflowers = wildflowersData ? wildflowersData.map((w: any) => ({
          ...w,
          id: w.id,
          title: w.title,
          description: w.description || '',
          createdAt: w.created_at ? new Date(w.created_at) : new Date(),
          updatedAt: w.updated_at ? new Date(w.updated_at) : undefined,
          isArchived: w.is_archived || false,
          archivedAt: w.archived_at ? new Date(w.archived_at) : undefined,
        })) : [];
        setWildflowers(mappedWildflowers);
        
        // Cache the data
        await DataCache.saveToCache('cached_wildflowers', mappedWildflowers);
        console.log('[TaskContext] Cached wildflowers data');
      } catch (err) {
        console.error('Failed to load active wildflowers from Supabase:', err);
      }

      // --- Fetch Archived Wildflowers (Compost Bin) ---
      try {
        const { data: archivedData, error: archivedError } = await supabase
          .from('wildflowers')
          .select('*')
          .eq('user_id', userId)
          .eq('is_archived', true)
          .order('archived_at', { ascending: false });
        if (archivedError) throw archivedError;
        const mappedArchived = archivedData ? archivedData.map((w: any) => ({
          ...w,
          id: w.id,
          title: w.title,
          description: w.description || '',
          createdAt: w.created_at ? new Date(w.created_at) : new Date(),
          updatedAt: w.updated_at ? new Date(w.updated_at) : undefined,
          isArchived: w.is_archived || false,
          archivedAt: w.archived_at ? new Date(w.archived_at) : undefined,
        })) : [];
        setArchivedWildflowers(mappedArchived);
      } catch (err) {
        console.error('Failed to load archived wildflowers from Supabase:', err);
      }

      // --- Fetch Contexts ---
      try {
        const { data: contextsData, error: contextsError } = await supabase
          .from('contexts')
          .select('*')
          .eq('user_id', userId);
        if (contextsError) throw contextsError;
        const mappedContexts = contextsData ? contextsData.map((c: any) => c.name) : [];
        setContexts(mappedContexts);
      } catch (err) {
        console.error('Failed to load contexts from Supabase:', err);
      }

      // --- Fetch Plots ---
      try {
        const { data: plotsData, error: plotsError } = await supabase
          .from('plots')
          .select('*')
          .eq('user_id', userId);
        if (plotsError) throw plotsError;
        const mappedPlots = plotsData ? plotsData.map((p: any) => p.name) : [];
        setPlots(mappedPlots);
      } catch (err) {
        console.error('Failed to load plots from Supabase:', err);
      }

      // --- Fetch Templates ---
      try {
        const { data: templatesData, error: templatesError } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', userId);
        if (templatesError) throw templatesError;
        const mappedTemplates = templatesData ? templatesData.map((t: any) => ({
          id: t.id,
          name: t.name,
          taskData: t.task_data ? JSON.parse(t.task_data) : {},
        })) : [];
        setTemplates(mappedTemplates);
      } catch (err) {
        console.error('Failed to load templates from Supabase:', err);
      }

      // --- Load Almanac from AsyncStorage (user-specific) ---
      try {
        const storedAlmanac = await AsyncStorage.getItem(`user_almanac_${userId}`);
        const parsedAlmanac = storedAlmanac ? JSON.parse(storedAlmanac) : {};
        setAlmanac(parsedAlmanac);
      } catch (error) {
        console.error('Failed to load almanac from storage', error);
      }
    } catch (error) {
      console.error('Failed to load user data from Supabase:', error);
    }
  };

  // Main useEffect for authentication state management
  useEffect(() => {
    // Load data if session already exists on mount
    if (session?.user) {
      loadAllData();
    }
  }, [session?.user?.id]); // Re-run when user ID changes

  // Listen to auth state changes from AuthContext (optimized)
  useEffect(() => {
    if (!session?.user) {
          // Clear all data when user signs out
          clearAllData();
    } else {
          // Load user data when user signs in
      loadAllData();
    }
  }, [session?.user?.id]); // Only re-run when user ID changes, not on every session change

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
    // Session validation handled by AuthContext
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('User not found, cannot add task.');
      return;
    }

    // Check task limit for non-premium users BEFORE creating task
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
            // Navigate to premium screen
            // Note: This requires router access, which is not available in TaskContext
            // The calling component should handle navigation
          }}
        ]
      );
      return;
    }

    const taskForDB = {
      user_id: user.id,
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority,
      context: taskData.context || null,
      plot: taskData.plot || null,
      start_date: taskData.startDate ? taskData.startDate.toISOString() : null,
      due_date: taskData.dueDate ? taskData.dueDate.toISOString() : null,
      is_mit: taskData.isMIT,
      is_completed: false,
      recurrence: taskData.recurrence || null,
      branches: (taskData as any).branches && (taskData as any).branches.length ? (taskData as any).branches : null,
    } as any;


    // Use enhanced error handling with retry and fallback mechanisms
    try {
      const result = await RetryMechanism.executeWithRetry(
        async () => {
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(taskForDB)
      .select()
      .single();

    if (error) {
            throw error;
          }

          return newTask;
        },
        { maxRetries: 3, baseDelay: 1000 },
        { operation: 'addTask', userId: user.id }
      );

      if (!result.success) {
        console.log('[TaskContext] Retry failed, attempting fallback strategies');
        
        // Try fallback strategies
        const fallbackSuccess = await DatabaseFallbackStrategies.executeFallback(
          result.error,
          {
            operation: async () => {
              const { data: newTask, error } = await supabase
                .from('tasks')
                .insert(taskForDB)
                .select()
                .single();
              if (error) throw error;
              return newTask;
            },
            operationType: 'addTask',
            data: taskForDB,
            userId: user.id
          }
        );

        if (!fallbackSuccess) {
          const errorType = ErrorHandler.categorizeError(result.error);
          ErrorHandler.showErrorAlert(result.error, errorType, {
            operation: 'addTask',
            userId: user.id,
            timestamp: Date.now()
          });
      return;
    }

        console.log('[TaskContext] Task queued for offline processing');
        return;
      }

      const newTask = result.data;
    const mappedTask: Task = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description ?? '',
      priority: newTask.priority,
      context: newTask.context ?? undefined,
      plot: newTask.plot ?? undefined,
      startDate: newTask.start_date ? new Date(newTask.start_date) : undefined,
      dueDate: newTask.due_date ? new Date(newTask.due_date) : undefined,
      isMIT: !!newTask.is_mit,
      isCompleted: !!newTask.is_completed,
      createdAt: newTask.created_at ? new Date(newTask.created_at) : new Date(),
      completedAt: newTask.completed_at ? new Date(newTask.completed_at) : undefined,
      recurrence: newTask.recurrence || undefined,
      isRecurringTemplate: newTask.is_recurring_template || undefined,
      parentTaskId: newTask.parent_task_id || undefined,
      calendarEventId: newTask.calendar_event_id || undefined,
      branches: newTask.branches || [],
    };

    setTasks(prev => [mappedTask, ...prev]);

    if (mappedTask.dueDate) {
      try {
        await scheduleTaskNotifications(
          mappedTask.id,
          mappedTask.title,
          mappedTask.priority,
          mappedTask.dueDate
        );
      } catch (err) {
        console.error('Failed to schedule notifications for new task:', err);
      }
    }
    try {
      const syncEnabled = (await AsyncStorage.getItem('calendar_sync_enabled')) === 'true';
      const calendarId = await AsyncStorage.getItem('calendar_sync_calendar_id');
      if (syncEnabled && mappedTask.dueDate && calendarId) {
        const eventId = await createCalendarEvent(mappedTask, calendarId);
        if (eventId) {
          await updateTask(mappedTask.id, { calendarEventId: eventId });
        }
      }
    } catch (e) { /* ignore */ }
         } catch (error) {
           console.error('[TaskContext] Failed to add task:', error);
           
           // Report crash for critical errors
           if (error instanceof Error) {
             await CrashReporter.reportDatabaseError(error, {
               userId: user.id,
               screen: 'TaskContext',
               action: 'addTask'
             });
           }
           
           Alert.alert(
             'Error',
             'Failed to add task. Please check your connection and try again.'
           );
         }
  };

  const harvestWildflower = async (wildflower: { id: string; title: string; description?: string }) => {
    try {
      // Session validation handled by AuthContext
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('User not found, cannot harvest wildflower.');
      return;
    }

      // Check task limit for non-premium users BEFORE creating task
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
              // Navigate to premium screen
              // Note: This requires router access, which is not available in TaskContext
              // The calling component should handle navigation
            }}
          ]
        );
        return;
      }

    // PERFORMANCE OPTIMIZATION: Get the created task back with .select().single()
    const { data: newTask, error: addTaskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: wildflower.title,
        description: wildflower.description || null,
        priority: 'Could-do',
        is_completed: false
      })
      .select()
      .single();
      
    if (addTaskError) {
      console.error('DATABASE ERROR: Failed to create task from wildflower.', addTaskError);
      return;
    }

    // Map the database response to frontend format and add to local state
    const mappedTask: Task = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description ?? '',
      priority: newTask.priority,
      context: newTask.context ?? undefined,
      plot: newTask.plot ?? undefined,
      startDate: newTask.start_date ? new Date(newTask.start_date) : undefined,
      dueDate: newTask.due_date ? new Date(newTask.due_date) : undefined,
      isMIT: !!newTask.is_mit,
      isCompleted: !!newTask.is_completed,
      createdAt: newTask.created_at ? new Date(newTask.created_at) : new Date(),
      completedAt: newTask.completed_at ? new Date(newTask.completed_at) : undefined,
      recurrence: newTask.recurrence || undefined,
      isRecurringTemplate: newTask.is_recurring_template || undefined,
      parentTaskId: newTask.parent_task_id || undefined,
      calendarEventId: newTask.calendar_event_id || undefined,
      branches: newTask.branches || [],
    };
    
    // Add the new task to local state
    setTasks(prev => [mappedTask, ...prev]);
    
    // Success message removed - handled by calling function (handleTaskAdd)

    // CRITICAL FIX: Remove wildflower from local state IMMEDIATELY using the passed id
    // This ensures instant UI feedback (optimistic update)
    setWildflowers(prev => prev.filter(w => w.id !== wildflower.id));

    // Delete from database in background (with fallback for safety)
    try {
    await deleteWildflower(wildflower.id, { 
      title: wildflower.title, 
      description: wildflower.description 
    });
    } catch (deleteError) {
      console.error('Error deleting wildflower after harvest:', deleteError);
      // Don't re-throw - the main operation (creating task) was successful
      // The wildflower has already been removed from local state, so UI is consistent
    }
    } catch (error) {
      console.error('Error in harvestWildflower:', error);
      // Re-throw to let the calling function handle it
      throw error;
    }
  };

  const deleteTask = async (id: string, silent?: boolean) => { 
    // Session validation handled by AuthContext

    const task = tasks.find(t => t.id === id);
    // Cancel notifications for this task
    try { await cancelTaskNotifications(id); } catch (e) { console.error(e); }
    // Calendar sync logic
    try {
      const syncEnabled = (await AsyncStorage.getItem('calendar_sync_enabled')) === 'true';
      if (syncEnabled && task?.calendarEventId) {
        await deleteCalendarEvent(task.calendarEventId);
      }
    } catch (e) { /* ignore */ }

    // Implement the database-first logic
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      return;
    }
    
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setTasks(prev => prev.filter(t => t.id !== id));
    
    // Success message for task deletion (only if not silent)
    if (!silent) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌱 Your Plant has sprouted back to life! It\'s growing again in the Action Garden!');
    }
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id'>>) => { 
    // CRITICAL FIX: Add database persistence before updating local state
    // Prepare updates for database (camelCase → snake_case)
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.context !== undefined) dbUpdates.context = updates.context;
    if (updates.plot !== undefined) dbUpdates.plot = updates.plot;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate ? updates.startDate.toISOString() : null;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? updates.dueDate.toISOString() : null;
    if (updates.isMIT !== undefined) dbUpdates.is_mit = updates.isMIT;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
    if (updates.branches !== undefined) dbUpdates.branches = updates.branches;
    if (updates.calendarEventId !== undefined) dbUpdates.calendar_event_id = updates.calendarEventId;

    // Persist to database first
    const { error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating task in database:', error);
      return;
    }

    // Then update local state
    let updatedTask: Task | undefined;
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id !== id) return task;
        const merged = {
          ...task,
          ...updates,
          recurrence: updates.recurrence !== undefined ? updates.recurrence : task.recurrence,
          updatedAt: new Date(),
        };
        updatedTask = merged;
        return merged;
      });
    });
    
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
      // If we are un-completing a task, do nothing special for now.
      // We can add logic to re-enable recurrence later if needed.
      return; 
    }

    // 1. Mark the current task as complete in the database.
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating task completion status:', updateError);
      return; // Stop if the main operation fails
    }

    // PERFORMANCE OPTIMIZATION: Update local state for completed task
    setTasks(prev => prev.map(t => 
      t.id === id 
        ? { ...t, isCompleted: true, completedAt: new Date() }
        : t
    ));

    // Success message for task completion
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌾 Your Plant has been harvested! It\'s now resting in the Granary!');

    // 2. If the task is recurring, create the next instance.
    if (task.recurrence && task.dueDate) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.error('No user for recurring task creation.');
        return;
      }

      const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);

      // Calculate the duration of the original task
      let nextStartDate: Date | null = null;
      if (task.startDate && task.dueDate) {
        const duration = task.dueDate.getTime() - task.startDate.getTime();
        nextStartDate = new Date(nextDueDate.getTime() - duration);
      }

      // Prepare the new task instance for the database, omitting the ID.
      const nextTaskInstance = {
        user_id: user.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        context: task.context,
        plot: task.plot,
        start_date: nextStartDate ? nextStartDate.toISOString() : null,
        due_date: nextDueDate.toISOString(),
        is_mit: task.isMIT,
        is_completed: false,
        recurrence: task.recurrence,
        branches: task.branches,
        parent_task_id: task.isRecurringTemplate ? task.id : task.parentTaskId,
        is_recurring_template: false,
      };

      const { data: newRecurringTask, error: insertError } = await supabase
        .from('tasks')
        .insert(nextTaskInstance)
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create next recurring task instance:", insertError);
      } else if (newRecurringTask) {
        // PERFORMANCE OPTIMIZATION: Add new recurring task to local state
        const mappedNewTask: Task = {
          id: newRecurringTask.id,
          title: newRecurringTask.title,
          description: newRecurringTask.description ?? '',
          priority: newRecurringTask.priority,
          context: newRecurringTask.context ?? undefined,
          plot: newRecurringTask.plot ?? undefined,
          startDate: newRecurringTask.start_date ? new Date(newRecurringTask.start_date) : undefined,
          dueDate: newRecurringTask.due_date ? new Date(newRecurringTask.due_date) : undefined,
          isMIT: !!newRecurringTask.is_mit,
          isCompleted: !!newRecurringTask.is_completed,
          createdAt: newRecurringTask.created_at ? new Date(newRecurringTask.created_at) : new Date(),
          completedAt: newRecurringTask.completed_at ? new Date(newRecurringTask.completed_at) : undefined,
          recurrence: newRecurringTask.recurrence || undefined,
          isRecurringTemplate: newRecurringTask.is_recurring_template || undefined,
          parentTaskId: newRecurringTask.parent_task_id || undefined,
          calendarEventId: newRecurringTask.calendar_event_id || undefined,
          branches: newRecurringTask.branches || [],
        };
        setTasks(prev => [mappedNewTask, ...prev]);
      }
    }
  };

  const toggleMIT = async (id: string) => { 
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newPriority: 'Must-do' | 'Could-do' | 'Later' | 'Key Plant' = task.isMIT ? 'Could-do' : 'Key Plant';
    const updatedTask = { ...task, isMIT: !task.isMIT, priority: newPriority };
    
    setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
    
    // Success message for MIT toggle
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '⭐ Your Plant is now a Key Plant! It\'s getting the attention it deserves!');
    
    // Reschedule notifications if task has a due date and is not completed
    if (updatedTask.dueDate && !updatedTask.isCompleted) {
      try {
        // Cancel existing notifications first
        await cancelTaskNotifications(id);
        
        // Schedule new notifications with updated priority
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
    // Session validation handled by AuthContext

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('User not found, cannot add wildflower.');
      return;
    }
    const { data: newWildflower, error } = await supabase
      .from('wildflowers')
      .insert({
        user_id: user.id,
        title: wildflowerData.title,
        description: wildflowerData.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error for addWildflower:', error);
      return;
    }

    setWildflowers(prev => [
      {
        id: newWildflower.id,
        title: newWildflower.title,
        description: newWildflower.description ?? '',
        createdAt: newWildflower.created_at ? new Date(newWildflower.created_at) : new Date(),
        updatedAt: newWildflower.updated_at ? new Date(newWildflower.updated_at) : undefined,
      },
      ...prev,
    ]);
    
    // Success message
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌸 Your new Wildflower is blooming in the Idea Meadow! Let your creativity grow!');
    
    // Schedule wildflower reminder if needed
    try {
      await scheduleWildflowerReminder([
        {
          id: newWildflower.id,
          title: newWildflower.title,
          description: newWildflower.description ?? '',
          createdAt: newWildflower.created_at ? new Date(newWildflower.created_at) : new Date(),
          updatedAt: newWildflower.updated_at ? new Date(newWildflower.updated_at) : undefined,
        },
        ...wildflowers
      ]);
    } catch (error) {
      console.error('Failed to schedule wildflower reminder:', error);
    }
  };
  const updateWildflower = (id: string, updates: Partial<Omit<Wildflower, 'id'>>) => {
    setWildflowers(prev => prev.map(w => w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w));
    
    // Success message
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌸 Your Wildflower has been tended to! It\'s looking more vibrant than ever!');
  };
  const deleteWildflower = async (id: string, opts?: { title?: string; description?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    let dbId = id;
    if (!isUuid(dbId)) {
      const { data: rows, error: findErr } = await supabase
        .from('wildflowers')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', opts?.title ?? '')
        .eq('description', opts?.description ?? null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (findErr) {
        console.error('Lookup error before deleteWildflower:', findErr);
        return;
      }
      if (!rows || rows.length === 0) {
        console.warn('No matching wildflower found for deletion fallback.');
        return;
      }
      dbId = rows[0].id;
    }

    const { error } = await supabase.from('wildflowers').delete().eq('id', dbId);
    if (error) {
      console.error('Error deleting wildflower:', error);
      return;
    }
    
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    // Remove only the deleted wildflower from local state
    setWildflowers(prev => prev.filter(w => w.id !== dbId));
    
    // Success message removed - handled by modal in index.tsx
  };

  // --- COMPOST BIN FUNCTIONS ---
  
  /**
   * Archive a wildflower (move to Compost Bin)
   * Sets is_archived to true and archived_at to current timestamp
   */
  const archiveWildflower = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('User not found, cannot archive wildflower.');
      return;
    }

    // Update in database
    const { error } = await supabase
      .from('wildflowers')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error archiving wildflower:', error);
      return;
    }

    // PERFORMANCE OPTIMIZATION: Targeted state update
    // Move wildflower from active to archived array
    setWildflowers(prev => {
      const wildflowerToArchive = prev.find(w => w.id === id);
      if (wildflowerToArchive) {
        setArchivedWildflowers(archived => [{
          ...wildflowerToArchive,
          isArchived: true,
          archivedAt: new Date(),
        }, ...archived]);
        return prev.filter(w => w.id !== id);
      }
      return prev;
    });
    
    // Success message for archiving wildflower
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌿 Your Wildflower has been composted! It\'s nourishing the soil for new ideas!');
  };

  /**
   * Restore a wildflower from Compost Bin
   * Sets is_archived to false and clears archived_at
   */
  const restoreWildflower = async (id: string, onUpgradeNeeded?: () => void, silent?: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('User not found, cannot restore wildflower.');
      return;
    }

    // Check wildflower limit for non-premium users BEFORE restoring
    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const wildflowerLimit = 30;
    const activeWildflowers = wildflowers.filter(w => !w.isArchived);
    
    if (isProfileLoaded && !isPremium && activeWildflowers.length >= wildflowerLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${wildflowerLimit} wildflowers. Upgrade to Premium for unlimited ideas!`,
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

    // Update in database
    const { error } = await supabase
      .from('wildflowers')
      .update({
        is_archived: false,
        archived_at: null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error restoring wildflower:', error);
      return;
    }

    // PERFORMANCE OPTIMIZATION: Targeted state update
    // Move wildflower from archived to active array
    setArchivedWildflowers(prev => {
      const wildflowerToRestore = prev.find(w => w.id === id);
      if (wildflowerToRestore) {
        setWildflowers(active => [{
          ...wildflowerToRestore,
          isArchived: false,
          archivedAt: undefined,
        }, ...active]);
        return prev.filter(w => w.id !== id);
      }
      return prev;
    });
    
    // Success message (only if not silent)
    if (!silent) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌸 Your Wildflower has been restored! It\'s blooming again in the Idea Meadow!');
    }
  };

  /**
   * Permanently delete a wildflower from Compost Bin
   * This is a hard delete from the database
   */
  const deleteWildflowerPermanently = async (id: string, silent?: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('User not found, cannot delete wildflower permanently.');
      return;
    }

    // Hard delete from database
    const { error } = await supabase
      .from('wildflowers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error permanently deleting wildflower:', error);
      return;
    }

    // PERFORMANCE OPTIMIZATION: Targeted state update
    // Remove from archived array
    setArchivedWildflowers(prev => prev.filter(w => w.id !== id));
  };

  // --- END COMPOST BIN FUNCTIONS ---

  const addContext = async (newContext: string) => {
    if (newContext && !contexts.includes(newContext)) {
      // Get current user session for Supabase operations
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to get user session for addContext:', sessionError);
        return;
      }
      const user = session?.user;

      const contextForDB = {
        name: newContext,
        user_id: user?.id,
      };

      // Add diagnostic logging
      console.log("--- DEBUG: Attempting to addContext ---");
      console.log("User ID:", user ? user.id : "NO USER FOUND");
      console.log("Context Data Payload:", JSON.stringify(contextForDB, null, 2));

      // Supabase insert operation (placeholder for debugging)
      try {
        const { data, error } = await supabase.from('contexts').insert(contextForDB);
        if (error) {
          console.error('Supabase insert error for addContext:', error);
          // Fallback to local state only
        } else {
          console.log('Context successfully inserted to Supabase:', data);
        }
      } catch (error) {
        console.error('Exception during Supabase insert for addContext:', error);
      }

      setContexts(prev => [newContext, ...prev]);
    }
  };

  const deleteContext = async (contextToDelete: string) => { 
    if (!user?.id) return; 
    const { error } = await supabase
      .from('contexts')
      .delete()
      .eq('user_id', user.id)
      .eq('name', contextToDelete); 
    if (error) { 
      console.error('Error deleting context:', error); 
      return; 
    } 
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setContexts(prev => prev.filter(c => c !== contextToDelete));
  };

  const addPlot = async (newPlot: string) => {
    if (newPlot && !plots.includes(newPlot)) {
      // Get current user session for Supabase operations
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Failed to get user session for addPlot:', sessionError);
        return;
      }
      const user = session?.user;

      const plotForDB = {
        name: newPlot,
        user_id: user?.id,
      };

      // Add diagnostic logging
      console.log("--- DEBUG: Attempting to addPlot ---");
      console.log("User ID:", user ? user.id : "NO USER FOUND");
      console.log("Plot Data Payload:", JSON.stringify(plotForDB, null, 2));

      // Supabase insert operation (placeholder for debugging)
      try {
        const { data, error } = await supabase.from('plots').insert(plotForDB);
        if (error) {
          console.error('Supabase insert error for addPlot:', error);
          // Fallback to local state only
        } else {
          console.log('Plot successfully inserted to Supabase:', data);
        }
      } catch (error) {
        console.error('Exception during Supabase insert for addPlot:', error);
      }

      setPlots(prev => [newPlot, ...prev]);
    }
  };

  const deletePlot = async (plotToDelete: string) => { 
    if (!user?.id) return; 
    const { error } = await supabase
      .from('plots')
      .delete()
      .eq('user_id', user.id)
      .eq('name', plotToDelete); 
    if (error) { 
      console.error('Error deleting plot:', error); 
      return; 
    } 
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setPlots(prev => prev.filter(p => p !== plotToDelete));
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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newBranch = { id: Date.now().toString(), text: branchText, isCompleted: false };
    const updatedBranches = task.branches ? [...task.branches, newBranch] : [newBranch];

    // Resolve DB id (handle non-uuid temporary ids)
    let targetId = taskId;
    if (!isUuid(targetId)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: rows, error: findErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', task.title)
        .eq('description', task.description ?? null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (findErr || !rows || rows.length === 0) return;
      targetId = rows[0].id;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ branches: updatedBranches as any })
      .eq('id', targetId);
    if (error) {
      console.error('Error updating branches (addBranch):', error);
      return;
    }
    
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, branches: updatedBranches } : t
    ));
  };

  const toggleBranchComplete = async (taskId: string, branchId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.branches) return;

    const updatedBranches = task.branches.map(branch =>
      branch.id === branchId ? { ...branch, isCompleted: !branch.isCompleted } : branch
    );

    let targetId = taskId;
    if (!isUuid(targetId)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: rows, error: findErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', task.title)
        .eq('description', task.description ?? null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (findErr || !rows || rows.length === 0) return;
      targetId = rows[0].id;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ branches: updatedBranches as any })
      .eq('id', targetId);
    if (error) {
      console.error('Error updating branches (toggleBranchComplete):', error);
      return;
    }
    
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, branches: updatedBranches } : t
    ));
  };

  const updateBranch = async (taskId: string, branchId: string, newText: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.branches) return;

    const updatedBranches = task.branches.map(branch =>
      branch.id === branchId ? { ...branch, text: newText } : branch
    );

    let targetId = taskId;
    if (!isUuid(targetId)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: rows, error: findErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', task.title)
        .eq('description', task.description ?? null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (findErr || !rows || rows.length === 0) return;
      targetId = rows[0].id;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ branches: updatedBranches as any })
      .eq('id', targetId);
    if (error) {
      console.error('Error updating branches (updateBranch):', error);
      return;
    }
    
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, branches: updatedBranches } : t
    ));
  };

  const deleteBranch = async (taskId: string, branchId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.branches) return;

    const updatedBranches = task.branches.filter(branch => branch.id !== branchId);

    let targetId = taskId;
    if (!isUuid(targetId)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { data: rows, error: findErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', task.title)
        .eq('description', task.description ?? null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (findErr || !rows || rows.length === 0) return;
      targetId = rows[0].id;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ branches: updatedBranches as any })
      .eq('id', targetId);
    if (error) {
      console.error('Error updating branches (deleteBranch):', error);
      return;
    }
    
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, branches: updatedBranches } : t
    ));
  };

  // 3. Implement Template Management Functions
  const addTemplate = async (templateData: Omit<Template, 'id'>) => {
    // Get current user session for Supabase operations
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Failed to get user session for addTemplate:', sessionError);
      return;
    }
    const user = session?.user;

    // 🔒 CRITICAL SECURITY: Check template limit for non-premium users BEFORE creating template
    const isPremium = userProfile?.is_premium ?? false;
    const isProfileLoaded = !userProfileLoading && userProfile !== null;
    const templateLimit = 5; // Limit for Freemium users
    
    if (isProfileLoaded && !isPremium && templates.length >= templateLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${templateLimit} Seedling templates. Upgrade to Premium for unlimited templates!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            // Navigation will be handled by the calling component
            console.log('[addTemplate] Premium upgrade requested');
          }}
        ]
      );
      return;
    }

    // Prepare template data for database
    // Ensure branches are persisted (default to empty array if undefined)
    const taskDataForTemplate = {
      ...templateData.taskData,
      branches: (templateData.taskData as any)?.branches ?? [],
    } as any;

    const templateForDB = {
      name: templateData.name,
      task_data: JSON.stringify(taskDataForTemplate),
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };

    // Add diagnostic logging
    console.log("--- DEBUG: Attempting to addTemplate ---");
    console.log("User ID:", user ? user.id : "NO USER FOUND");
    console.log("Template Data Payload:", JSON.stringify(templateForDB, null, 2));

    // Supabase insert operation - get the returned ID
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert(templateForDB)
        .select()
        .single();
        
      if (error) {
        console.error('Supabase insert error for addTemplate:', error);
        return;
      }
      
      console.log('Template successfully inserted to Supabase:', data);
      
      // Use the real ID from database
      const newTemplate: Template = {
        id: data.id,
        name: data.name,
        taskData: JSON.parse(data.task_data),
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      
      // Success message
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌿 Your new Seedling template is ready! It\'s waiting to grow into a Plant!');
    } catch (error) {
      console.error('Exception during Supabase insert for addTemplate:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => { 
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId); 
    if (error) { 
      console.error('Error deleting template:', error); 
      return; 
    } 
    // PERFORMANCE OPTIMIZATION: Targeted state update instead of loadAllData()
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    
    // Success message
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', '🌿 Your Seedling template has been uprooted forever! Your garden now has more space for fresh templates!');
  };

  // --- Recurring Task Management ---
  const updateRecurringTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    
    console.log('[updateRecurringTask] Starting update:', { taskId, updates });
    
    // Map camelCase fields to snake_case for database
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.context !== undefined) dbUpdates.context = updates.context || null;
    if (updates.plot !== undefined) dbUpdates.plot = updates.plot || null;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate ? updates.startDate.toISOString() : null;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? updates.dueDate.toISOString() : null;
    if (updates.isMIT !== undefined) dbUpdates.is_mit = updates.isMIT;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence || null;
    if (updates.branches !== undefined) dbUpdates.branches = updates.branches;
    if (updates.calendarEventId !== undefined) dbUpdates.calendar_event_id = updates.calendarEventId || null;
    
    console.log('[updateRecurringTask] Mapped dbUpdates:', dbUpdates);
    
    // Validate that we have something to update
    if (Object.keys(dbUpdates).length === 0) {
      console.warn('[updateRecurringTask] No valid updates to apply');
      Alert.alert('Warning', 'No changes to save.');
      return;
    }
    
    try {
      // Find the current task to get parent info
      const currentTask = tasks.find(t => t.id === taskId);
      if (!currentTask) {
        Alert.alert('Error', 'Task not found.');
        return;
      }
      
      // Update current task - break from series and set recurrence to null
      const singleUpdatePayload = {
        ...dbUpdates,
        recurrence: null,                    // ← AUTOMATYCZNIE NONE
        parent_task_id: null,
        is_recurring_template: false,
      };
      
      console.log('[updateRecurringTask] Payload:', singleUpdatePayload);
      
      const { error, data } = await supabase
        .from('tasks')
        .update(singleUpdatePayload)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select();
      
      console.log('[updateRecurringTask] Result:', { error, data });
      
      if (error) {
        console.error('Error updating recurring task instance:', error);
        Alert.alert('Error', `Failed to update task: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn('[updateRecurringTask] No rows updated - task may not exist or belong to different user');
        Alert.alert('Error', 'Task not found or access denied.');
        return;
      }
      
      // DELETE future tasks in series
      const parentId = currentTask.isRecurringTemplate ? currentTask.id : currentTask.parentTaskId;
      if (parentId) {
        console.log('[updateRecurringTask] Deleting future tasks for parent:', parentId);
        
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('user_id', user.id)
          .eq('parent_task_id', parentId)
          .eq('is_completed', false)
          .gte('due_date', new Date().toISOString());
        
        if (deleteError) {
          console.error('Error deleting future tasks:', deleteError);
          // Don't fail the whole operation for this
    } else {
          console.log('[updateRecurringTask] Future tasks deleted successfully');
        }
      }
      
      // Update local state - remove future tasks and update current task
      setTasks(prev => {
        const updatedTasks = prev.map(task => {
          if (task.id === taskId) {
            return { 
              ...task, 
              ...updates, 
              recurrence: null,                    // ← AUTOMATYCZNIE NONE
              parentTaskId: undefined, 
              isRecurringTemplate: false, 
              updatedAt: new Date() 
            };
          }
          return task;
        });
        
        // Remove future tasks from local state
        const filteredTasks = updatedTasks.filter(task => {
          if (task.parentTaskId === parentId && !task.isCompleted && task.dueDate >= new Date()) {
            console.log('[updateRecurringTask] Removing future task from local state:', task.id);
            return false;
          }
          return true;
        });
        
        return filteredTasks;
      });
      
      console.log('[updateRecurringTask] Local state updated');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🔄 Your recurring Plant has been tended to! It\'s now a standalone beauty!');
      
    } catch (error) {
      console.error('[updateRecurringTask] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred while updating the task.');
    }
  };

  const deleteRecurringTask = async (taskId: string, mode: 'single' | 'all') => {
    if (!user) return;
    
    if (mode === 'single') {
      // Delete this single instance from database first
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error deleting recurring task instance:', error);
        Alert.alert('Error', 'Failed to delete task. Please try again.');
        return;
      }
      
      // Then remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Success message
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌿 Your Plant has been permanently cleared! Your garden is ready for new growth!');
      
    } else {
      // mode === 'all'
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.warn('Task not found for deletion');
        return;
      }
      
      const parentId = task.isRecurringTemplate ? task.id : task.parentTaskId;
      if (!parentId) {
        console.warn('No parent ID found for recurring task');
        return;
      }
      
      // Delete parent template from database
      const { error: parentError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', parentId)
        .eq('user_id', user.id);
      
      if (parentError) {
        console.error('Error deleting parent task:', parentError);
        Alert.alert('Error', 'Failed to delete task series. Please try again.');
        return;
      }
      
      // Delete all future uncompleted child tasks from database
      const { error: childrenError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('parent_task_id', parentId)
        .eq('is_completed', false);
      
      if (childrenError) {
        console.error('Error deleting child tasks:', childrenError);
        // Don't return here - parent is already deleted, continue with state cleanup
      }
      
      // Then remove from local state - POPRAWIONA LOGIKA
      const now = new Date();
      setTasks(prev => prev.filter(t => {
        // Remove if parent
        if (t.id === parentId) return false;
        
        // Remove if future uncompleted child of this parent
        if (t.parentTaskId === parentId && !t.isCompleted) {
          // Parse dueDate to Date if it's a string
          const taskDueDate = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate || '');
          if (taskDueDate >= now) {
            return false;  // Remove future uncompleted tasks
          }
        }
        
        return true;  // Keep everything else
      }));
      
      // Success message for recurring task deletion
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', '🌿 Your Plant has been permanently cleared! Your garden is ready for new growth!');
    }
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