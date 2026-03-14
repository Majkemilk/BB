/**
 * Ładuje dane z data/json/ do AsyncStorage przy pierwszym uruchomieniu.
 * Sprawdza flagę @app_data_loaded – jeśli brak, wykonuje import; jeśli jest, pomija.
 * Używa expo-file-system/legacy (Expo SDK 54). Fallback: bundled JSON przez require(), potem pustą tablicę.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const DATA_LOADED_KEY = '@app_data_loaded';
const DATA_JSON_DIR = 'data/json';

const STORAGE_KEYS = {
  contexts: '@contexts',
  plots: '@plots',
  profiles: '@profiles',
  tasks: '@tasks',
  templates: '@templates',
  wildflowers: '@wildflowers',
} as const;

type EntityKey = keyof typeof STORAGE_KEYS;

const ENTITIES: EntityKey[] = [
  'contexts',
  'plots',
  'profiles',
  'tasks',
  'templates',
  'wildflowers',
];

/** Fallback: bundled JSON (wymaga plików w projekcie). W razie błędu zwraca pustą tablicę. */
function getBundledJson(entity: EntityKey): string {
  try {
    switch (entity) {
      case 'contexts':
        return JSON.stringify(require('../data/json/contexts.json'));
      case 'plots':
        return JSON.stringify(require('../data/json/plots.json'));
      case 'profiles':
        return JSON.stringify(require('../data/json/profiles.json'));
      case 'tasks':
        return JSON.stringify(require('../data/json/tasks.json'));
      case 'templates':
        return JSON.stringify(require('../data/json/templates.json'));
      case 'wildflowers':
        return JSON.stringify(require('../data/json/wildflowers.json'));
      default:
        return '[]';
    }
  } catch (e) {
    console.warn(
      `[loadLocalData] Bundled JSON for ${entity} failed, using []:`,
      e instanceof Error ? e.message : e
    );
    return '[]';
  }
}

/**
 * Odczytuje JSON dla encji: najpierw z documentDirectory (expo-file-system),
 * potem fallback na bundled JSON (require), na końcu pustą tablicę.
 */
async function readJsonForEntity(entity: EntityKey): Promise<string> {
  const path = `${FileSystem.documentDirectory ?? ''}${DATA_JSON_DIR}/${entity}.json`;

  try {
    if (FileSystem.documentDirectory) {
      const exists = await FileSystem.getInfoAsync(path, { size: false }).catch(() => null);
      if (exists?.exists) {
        const content = await FileSystem.readAsStringAsync(path, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return content;
      }
    }
  } catch (e) {
    console.warn(
      `[loadLocalData] Could not read ${entity}.json from file system, using bundled or []:`,
      e instanceof Error ? e.message : e
    );
  }

  return getBundledJson(entity);
}

/**
 * Tworzy katalog data/json w documentDirectory (opcjonalnie na przyszłość).
 */
async function ensureDataJsonDir(): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  const dir = `${FileSystem.documentDirectory}${DATA_JSON_DIR}`;
  try {
    const info = await FileSystem.getInfoAsync(dir, { size: false });
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (_) {
    // ignoruj – nie blokuj importu
  }
}

/**
 * Ładuje początkowe dane z data/json/ do AsyncStorage, jeśli jeszcze nie załadowane.
 * Flaga @app_data_loaded: brak → import; istnieje → pomijamy.
 * Wywołać raz przy starcie (np. w root layout).
 */
export async function loadInitialData(): Promise<void> {
  const log = (msg: string, ...args: unknown[]) => {
    console.log('[loadLocalData]', msg, ...args);
  };

  try {
    const alreadyLoaded = await AsyncStorage.getItem(DATA_LOADED_KEY);
    if (alreadyLoaded === 'true') {
      log('Data already loaded, skipping.');
      return;
    }

    log('Loading initial data...');
    await ensureDataJsonDir();

    for (const entity of ENTITIES) {
      try {
        const content = await readJsonForEntity(entity);
        let toStore = content;
        try {
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) {
            toStore = '[]';
            console.warn(`[loadLocalData] ${entity} is not an array, storing [].`);
          }
        } catch {
          toStore = '[]';
          console.warn(`[loadLocalData] ${entity} invalid JSON, storing [].`);
        }
        const key = STORAGE_KEYS[entity];
        await AsyncStorage.setItem(key, toStore);
        log(`Saved ${entity} to ${key}`);
      } catch (e) {
        console.error(`[loadLocalData] Failed to load ${entity}:`, e);
        await AsyncStorage.setItem(STORAGE_KEYS[entity], '[]').catch(() => {});
      }
    }

    await AsyncStorage.setItem(DATA_LOADED_KEY, 'true');
    log('Initial data loaded successfully.');
  } catch (e) {
    console.error('[loadLocalData] loadInitialData failed:', e);
    throw e;
  }
}
