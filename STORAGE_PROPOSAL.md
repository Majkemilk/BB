# Propozycja lokalnego magazynu danych (BB)

## Opcje magazynu

| Opcja | Zalety | Wady | Rekomendacja |
|-------|--------|------|--------------|
| **AsyncStorage** | Prosty API, brak konfiguracji, dobre w React Native / Expo | Limit ~6 MB na klucz (Android), brak zapytań SQL | **Aplikacja mobilna (React Native)** – dane użytkownika, cache |
| **Pliki JSON** | Czytelne, łatwy backup, wersjonowanie (git) | Wolne przy dużych zbiorach, cały plik w pamięci | **Eksport/import, małe zestawy, development** |
| **SQLite** | Zapytania, indeksy, relacje, duże zbiory (np. 15k zadań) | Więcej kodu, zależność (expo-sqlite / react-native-sqlite-storage) | **Duże dane, wyszukiwanie, filtry** |

## Rekomendowana strategia

- **Aplikacja webowa / mały offline:**  
  **JSON w plikach** lub **AsyncStorage** z jednym obiektem `{ profiles, contexts, plots, tasks, templates, wildflowers }` – klucze: `bb_profiles`, `bb_contexts` itd.

- **Aplikacja mobilna z wieloma użytkownikami / dużo zadań:**  
  **SQLite** z tabelami: `profiles`, `contexts`, `plots`, `tasks`, `templates`, `wildflowers` i indeksami na `user_id`, `is_completed`, `due_date`.

- **Hybryda:**  
  **AsyncStorage** na urządzeniu z zapisem kolekcji jako JSON (np. `tasks` jako stringified array), z okresowym eksportem do plików JSON jako backup.

## Struktura danych (wspólna dla JSON / AsyncStorage / SQLite)

```
bb/
├── profiles[]      – użytkownicy (id, email, full_name, …)
├── contexts[]      – konteksty (id, user_id, name)
├── plots[]         – ploty (id, user_id, name)
├── tasks[]         – zadania (id, user_id, title, priority, …)
├── templates[]     – szablony zadań (id, user_id, name, task_data)
└── wildflowers[]   – wpisy „wildflowers” (id, user_id, title, …)
```

W **AsyncStorage** można trzymać np.:
- `bb_profiles` → JSON.stringify(profiles)
- `bb_contexts` → JSON.stringify(contexts)
- itd.

Lub jeden klucz `bb_store` z obiektem `{ version: 1, profiles, contexts, plots, tasks, templates, wildflowers }` (uważać na limit rozmiaru).

## Konwersja typów przy imporcie z CSV

- **boolean:** `"true"` / `"false"` → true / false; puste → false lub null (zgodnie z logiką).
- **date:** zachować jako string ISO lub konwertować do `Date` / timestamp w zależności od stacku.
- **JSON w polu (branches, recurrence, task_data):** `JSON.parse(cell)` z zabezpieczeniem (try/catch, fallback do [] lub null).
- **puste pola:** `""` → null dla opcjonalnych pól; string gdzie wymagane.

Skrypt importu w `scripts/csvToJson.mjs` realizuje powyższą logikę i zapisuje pliki JSON lub format pod AsyncStorage.
