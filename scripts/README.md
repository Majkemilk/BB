# Skrypty importu danych BB

## csvToJson.mjs

Konwertuje pliki `*_rows.csv` z katalogu głównego BB na JSON.

**Wymagania:** Node.js (bez zewnętrznych zależności).

**Użycie:**

```bash
# Zapis do data/json/<entity>.json (domyślnie)
node scripts/csvToJson.mjs

# Własny katalog wyjściowy
node scripts/csvToJson.mjs --out-dir=ścieżka/do/json

# Format pod AsyncStorage (obiekt z kluczami bb_contexts, bb_plots, …)
node scripts/csvToJson.mjs --async-storage > async-storage-export.json
```

**Konwersje:**
- Pola `true`/`false` → boolean
- Puste pola → null
- Kolumny `branches`, `recurrence`, `task_data` → parsowany JSON
