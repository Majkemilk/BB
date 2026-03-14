/**
 * Skrypt importu plików CSV do JSON (lub pod AsyncStorage).
 * Użycie: node scripts/csvToJson.mjs [--out-dir=data/json] [--async-storage]
 *
 * Czyta pliki *_rows.csv z katalogu BB i zapisuje:
 *   - data/json/<entity>.json (domyślnie)
 *   - lub wyświetla obiekt pod AsyncStorage gdy --async-storage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ENTITIES = [
  { file: 'contexts_rows.csv', key: 'contexts' },
  { file: 'plots_rows.csv', key: 'plots' },
  { file: 'profiles_rows.csv', key: 'profiles' },
  { file: 'tasks_rows.csv', key: 'tasks' },
  { file: 'templates_rows.csv', key: 'templates' },
  { file: 'wildflowers_rows.csv', key: 'wildflowers' },
];

// Kolumny typu boolean w CSV
const BOOLEAN_COLUMNS = {
  contexts: [],
  plots: [],
  profiles: ['is_premium'],
  tasks: ['is_mit', 'is_completed', 'is_recurring_template'],
  templates: [],
  wildflowers: ['is_archived'],
};

// Kolumny zawierające JSON (parsujemy)
const JSON_COLUMNS = {
  contexts: [],
  plots: [],
  profiles: [],
  tasks: ['branches', 'recurrence'],
  templates: ['task_data'],
  wildflowers: [],
};

/**
 * Parsuje cały CSV (obsługuje cudzysłowy i znaki nowej linii wewnątrz pól).
 * Zwraca { headers, rows }.
 */
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes) {
      if (c === ',') {
        currentRow.push(current);
        current = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') i++;
        currentRow.push(current);
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        current = '';
      } else {
        current += c;
      }
    } else {
      current += c;
    }
  }
  if (current !== '' || currentRow.length > 0) {
    currentRow.push(current);
    if (currentRow.length > 0) rows.push(currentRow);
  }
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0];
  const dataRows = rows.slice(1).map((values) => {
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    return row;
  });
  return { headers, rows: dataRows };
}

function toBool(s) {
  if (s === undefined || s === null || s === '') return null;
  return s === 'true' || s === '1';
}

function parseValue(key, entityKey, raw) {
  if (raw === undefined || raw === '') return null;
  const booleans = BOOLEAN_COLUMNS[entityKey] || [];
  const jsonCols = JSON_COLUMNS[entityKey] || [];
  if (booleans.includes(key)) return toBool(raw);
  if (jsonCols.includes(key)) {
    try {
      const decoded = raw.replace(/""/g, '"');
      return JSON.parse(decoded);
    } catch {
      return key === 'branches' ? [] : null;
    }
  }
  return raw;
}

function convertRows(entityKey, rows) {
  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = parseValue(k, entityKey, v);
    }
    return out;
  });
}

function loadEntity(entity) {
  const filePath = path.join(ROOT, entity.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Brak pliku: ${entity.file}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const { headers, rows } = parseCSV(content);
  const data = convertRows(entity.key, rows);
  return data;
}

function main() {
  const args = process.argv.slice(2);
  const outDir = args.includes('--out-dir')
    ? path.resolve(ROOT, args[args.indexOf('--out-dir') + 1])
    : path.join(ROOT, 'data', 'json');
  const forAsyncStorage = args.includes('--async-storage');

  const store = {};

  for (const entity of ENTITIES) {
    const data = loadEntity(entity);
    store[entity.key] = data;
    console.error(`${entity.key}: ${data.length} wierszy`);

    if (!forAsyncStorage) {
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `${entity.key}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
      console.error(`  Zapisano: ${outPath}`);
    }
  }

  if (forAsyncStorage) {
    // Format pod AsyncStorage: klucze bb_* z stringified tablicami
    const asyncStorage = {};
    for (const [key, value] of Object.entries(store)) {
      asyncStorage[`bb_${key}`] = JSON.stringify(value);
    }
    console.log(JSON.stringify(asyncStorage, null, 2));
  }
}

main();
