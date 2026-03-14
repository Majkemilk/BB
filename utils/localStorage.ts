/**
 * Lokalny magazyn danych dla wersji offline (bez Supabase).
 * Odczyt/zapis z AsyncStorage pod kluczami @tasks, @wildflowers, @contexts, @plots, @templates, @profiles.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  tasks: '@tasks',
  wildflowers: '@wildflowers',
  contexts: '@contexts',
  plots: '@plots',
  templates: '@templates',
  profiles: '@profiles',
} as const;

/** Kształt wiersza task w storage (snake_case z JSON/CSV). */
export interface StoredTask {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  priority: string;
  context?: string | null;
  plot?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  is_mit: boolean;
  is_completed: boolean;
  created_at: string;
  completed_at?: string | null;
  calendar_event_id?: string | null;
  branches?: { id: string; text: string; isCompleted: boolean }[] | null;
  recurrence?: unknown;
  is_recurring_template?: boolean;
  parent_task_id?: string | null;
}

/** Kształt task w aplikacji. */
export interface AppTask {
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
  recurrence?: unknown;
  isRecurringTemplate?: boolean;
  parentTaskId?: string;
}

function mapStoredTaskToApp(t: StoredTask): AppTask {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    priority: (t.priority as AppTask['priority']) || 'Could-do',
    context: t.context ?? undefined,
    plot: t.plot ?? undefined,
    startDate: t.start_date ? new Date(t.start_date) : undefined,
    dueDate: t.due_date ? new Date(t.due_date) : undefined,
    isMIT: t.is_mit ?? false,
    isCompleted: t.is_completed ?? false,
    createdAt: t.created_at ? new Date(t.created_at) : new Date(),
    completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
    calendarEventId: t.calendar_event_id ?? undefined,
    branches: t.branches ?? [],
    recurrence: t.recurrence,
    isRecurringTemplate: t.is_recurring_template,
    parentTaskId: t.parent_task_id ?? undefined,
  };
}

function mapAppTaskToStored(task: AppTask, userId: string): StoredTask {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description ?? null,
    priority: task.priority,
    context: task.context ?? null,
    plot: task.plot ?? null,
    start_date: task.startDate ? task.startDate.toISOString() : null,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    is_mit: task.isMIT,
    is_completed: task.isCompleted,
    created_at: task.createdAt instanceof Date ? task.createdAt.toISOString() : new Date().toISOString(),
    completed_at: task.completedAt ? task.completedAt.toISOString() : null,
    calendar_event_id: task.calendarEventId ?? null,
    branches: task.branches ?? null,
    recurrence: task.recurrence ?? null,
    is_recurring_template: task.isRecurringTemplate ?? false,
    parent_task_id: task.parentTaskId ?? null,
  };
}

export interface StoredWildflower {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_archived?: boolean;
  archived_at?: string | null;
}

export interface AppWildflower {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  isArchived?: boolean;
  archivedAt?: Date;
}

function mapStoredWildflowerToApp(w: StoredWildflower): AppWildflower {
  return {
    id: w.id,
    title: w.title,
    description: w.description ?? undefined,
    createdAt: w.created_at ? new Date(w.created_at) : new Date(),
    updatedAt: w.updated_at ? new Date(w.updated_at) : undefined,
    isArchived: w.is_archived ?? false,
    archivedAt: w.archived_at ? new Date(w.archived_at) : undefined,
  };
}

function mapAppWildflowerToStored(w: AppWildflower, userId: string): StoredWildflower {
  return {
    id: w.id,
    user_id: userId,
    title: w.title,
    description: w.description ?? null,
    created_at: w.createdAt instanceof Date ? w.createdAt.toISOString() : new Date().toISOString(),
    updated_at: w.updatedAt ? w.updatedAt.toISOString() : null,
    is_archived: w.isArchived ?? false,
    archived_at: w.archivedAt ? w.archivedAt.toISOString() : null,
  };
}

export interface StoredContext {
  id: string;
  user_id: string;
  name: string;
}

export interface StoredPlot {
  id: string;
  user_id: string;
  name: string;
}

export interface StoredTemplate {
  id: string;
  user_id: string;
  name: string;
  task_data: string | object;
  created_at: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  taskData: Partial<Omit<AppTask, 'id' | 'createdAt' | 'completedAt'>>;
}

export interface StoredProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  is_premium?: boolean;
  [key: string]: unknown;
}

async function getRaw<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setRaw(key: string, data: unknown[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

/** Pobiera zadania dla użytkownika (z AsyncStorage). */
export async function getTasks(userId: string): Promise<AppTask[]> {
  const raw = await getRaw<StoredTask>(KEYS.tasks);
  const forUser = raw.filter((t) => t.user_id === userId);
  return forUser.map(mapStoredTaskToApp);
}

/** Zapisuje listę zadań użytkownika. */
export async function setTasks(userId: string, tasks: AppTask[]): Promise<void> {
  const raw = await getRaw<StoredTask>(KEYS.tasks);
  const others = raw.filter((t) => t.user_id !== userId);
  const ours = tasks.map((t) => mapAppTaskToStored(t, userId));
  await setRaw(KEYS.tasks, [...others, ...ours]);
}

/** Pobiera wildflowers dla użytkownika. */
export async function getWildflowers(userId: string): Promise<AppWildflower[]> {
  const raw = await getRaw<StoredWildflower>(KEYS.wildflowers);
  const forUser = raw.filter((w) => w.user_id === userId);
  return forUser.map(mapStoredWildflowerToApp);
}

/** Zapisuje listę wildflowers użytkownika. */
export async function setWildflowers(userId: string, list: AppWildflower[]): Promise<void> {
  const raw = await getRaw<StoredWildflower>(KEYS.wildflowers);
  const others = raw.filter((w) => w.user_id !== userId);
  const ours = list.map((w) => mapAppWildflowerToStored(w, userId));
  await setRaw(KEYS.wildflowers, [...others, ...ours]);
}

/** Pobiera nazwy kontekstów dla użytkownika. */
export async function getContexts(userId: string): Promise<string[]> {
  const raw = await getRaw<StoredContext>(KEYS.contexts);
  return raw.filter((c) => c.user_id === userId).map((c) => c.name);
}

/** Zapisuje konteksty (tablica nazw). */
export async function setContexts(userId: string, names: string[]): Promise<void> {
  const raw = await getRaw<StoredContext>(KEYS.contexts);
  const others = raw.filter((c) => c.user_id !== userId);
  const ours = names.map((name, i) => ({
    id: `local-context-${userId}-${i}`,
    user_id: userId,
    name,
  }));
  await setRaw(KEYS.contexts, [...others, ...ours]);
}

/** Pobiera nazwy plotów dla użytkownika. */
export async function getPlots(userId: string): Promise<string[]> {
  const raw = await getRaw<StoredPlot>(KEYS.plots);
  return raw.filter((p) => p.user_id === userId).map((p) => p.name);
}

/** Zapisuje ploty (tablica nazw). */
export async function setPlots(userId: string, names: string[]): Promise<void> {
  const raw = await getRaw<StoredPlot>(KEYS.plots);
  const others = raw.filter((p) => p.user_id !== userId);
  const ours = names.map((name, i) => ({
    id: `local-plot-${userId}-${i}`,
    user_id: userId,
    name,
  }));
  await setRaw(KEYS.plots, [...others, ...ours]);
}

/** Pobiera szablony dla użytkownika. */
export async function getTemplates(userId: string): Promise<AppTemplate[]> {
  const raw = await getRaw<StoredTemplate>(KEYS.templates);
  const forUser = raw.filter((t) => t.user_id === userId);
  return forUser.map((t) => ({
    id: t.id,
    name: t.name,
    taskData: typeof t.task_data === 'string' ? (JSON.parse(t.task_data) || {}) : (t.task_data || {}),
  }));
}

/** Zapisuje szablony użytkownika. */
export async function setTemplates(userId: string, list: AppTemplate[]): Promise<void> {
  const raw = await getRaw<StoredTemplate>(KEYS.templates);
  const others = raw.filter((t) => t.user_id !== userId);
  const ours = list.map((t) => ({
    id: t.id,
    user_id: userId,
    name: t.name,
    task_data: t.taskData,
    created_at: new Date().toISOString(),
  }));
  await setRaw(KEYS.templates, [...others, ...ours]);
}

/** Pobiera wszystkie profile z storage. */
export async function getProfiles(): Promise<StoredProfile[]> {
  return getRaw<StoredProfile>(KEYS.profiles);
}

/** Zwraca pierwszy profil (dla auto-loginu offline). */
export async function getFirstProfile(): Promise<StoredProfile | null> {
  const list = await getProfiles();
  return list.length > 0 ? list[0] : null;
}
