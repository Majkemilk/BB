# Analiza plików CSV w katalogu BB/

## 1. contexts_rows.csv

| Parametr | Wartość |
|----------|---------|
| **Nazwa pliku** | contexts_rows.csv |
| **Liczba wierszy z danymi** | 10 (bez nagłówka; w bieżącym katalogu BB) |

### Nagłówek (kolumny)
`id`, `user_id`, `name`

### Typy danych kolumn
| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | string (UUID) | Identyfikator kontekstu |
| user_id | string (UUID) | Klucz obcy do użytkownika |
| name | string | Nazwa kontekstu (np. "Coding", "Work") |

---

## 2. plots_rows.csv

| Parametr | Wartość |
|----------|---------|
| **Nazwa pliku** | plots_rows.csv |
| **Liczba wierszy z danymi** | 6 (bez nagłówka) |

### Nagłówek (kolumny)
`id`, `user_id`, `name`

### Typy danych kolumn
| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | string (UUID) | Identyfikator „plotu” (np. lista/kategoria) |
| user_id | string (UUID) | Klucz obcy do użytkownika |
| name | string | Nazwa (np. "DIY", "Quick") |

---

## 3. profiles_rows.csv

| Parametr | Wartość |
|----------|---------|
| **Nazwa pliku** | profiles_rows.csv |
| **Liczba wierszy z danymi** | 9 (bez nagłówka) |

### Nagłówek (kolumny)
`id`, `email`, `created_at`, `updated_at`, `is_premium`, `stripe_customer_id`, `full_name`, `avatar_url`, `subscription_status`, `subscription_type`, `subscription_end_date`

### Typy danych kolumn
| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | string (UUID) | Identyfikator profilu |
| email | string | Adres e-mail |
| created_at | date (ISO 8601) | Data utworzenia |
| updated_at | date (ISO 8601) | Data aktualizacji |
| is_premium | boolean | Czy konto premium ("true"/"false") |
| stripe_customer_id | string \| null | ID klienta Stripe (często puste) |
| full_name | string | Imię i nazwisko |
| avatar_url | string | URL awatara (często puste) |
| subscription_status | string \| null | Status subskrypcji |
| subscription_type | string \| null | Typ subskrypcji |
| subscription_end_date | string \| null | Data końca subskrypcji |

---

## 4. tasks_rows.csv

| Parametr | Wartość |
|----------|---------|
| **Nazwa pliku** | tasks_rows.csv |
| **Liczba wierszy z danymi** | 59 (bez nagłówka) |

### Nagłówek (kolumny)
`id`, `user_id`, `title`, `description`, `priority`, `context`, `plot`, `start_date`, `due_date`, `is_mit`, `is_completed`, `created_at`, `completed_at`, `calendar_event_id`, `branches`, `recurrence`, `is_recurring_template`, `parent_task_id`

### Typy danych kolumn
| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | string (UUID) | Identyfikator zadania |
| user_id | string (UUID) | Właściciel zadania |
| title | string | Tytuł zadania |
| description | string | Opis (może zawierać wielolinijkowy tekst) |
| priority | string | Np. "Later", "Could-do", "Must-do", "Key Plant" |
| context | string | Nazwa kontekstu (odniesienie) |
| plot | string | Nazwa plotu (odniesienie) |
| start_date | date \| null | Data rozpoczęcia (ISO) |
| due_date | date \| null | Termin (ISO) |
| is_mit | boolean | Most Important Task |
| is_completed | boolean | Czy zakończone |
| created_at | date | Data utworzenia |
| completed_at | date \| null | Data zakończenia |
| calendar_event_id | string \| null | ID zdarzenia w kalendarzu |
| branches | string (JSON) | Tablica podzadań (np. `[{"id":"...","text":"...","isCompleted":false}]`) |
| recurrence | string (JSON) \| null | Reguła cykliczności (np. `{"type":"daily","interval":1}`) |
| is_recurring_template | boolean | Czy szablon cykliczny |
| parent_task_id | string \| null | ID zadania nadrzędnego |

---

## 5. templates_rows.csv

| Parametr | Wartość |
|----------|---------|
| **Nazwa pliku** | templates_rows.csv |
| **Liczba wierszy z danymi** | 1 (bez nagłówka) |

### Nagłówek (kolumny)
`id`, `user_id`, `name`, `task_data`, `created_at`

### Typy danych kolumn
| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | string (UUID) | Identyfikator szablonu |
| user_id | string (UUID) | Właściciel |
| name | string | Nazwa szablonu |
| task_data | string (JSON) | Obiekt z danymi zadania (title, description, priority, context, plot, startDate, dueDate, isMIT, branches itd.) |
| created_at | date | Data utworzenia |

---

## 6. wildflowers_rows.csv

| Parametr | Wartość |
|----------|---------|
| **Nazwa pliku** | wildflowers_rows.csv |
| **Liczba wierszy z danymi** | 20 (bez nagłówka) |

### Nagłówek (kolumny)
`id`, `user_id`, `created_at`, `title`, `description`, `updated_at`, `is_archived`, `archived_at`

### Typy danych kolumn
| Kolumna | Typ | Uwagi |
|---------|-----|--------|
| id | string (UUID) | Identyfikator wpisu |
| user_id | string (UUID) | Właściciel |
| created_at | date | Data utworzenia |
| title | string | Tytuł |
| description | string | Opis (opcjonalny) |
| updated_at | date | Data aktualizacji |
| is_archived | boolean | Czy zarchiwizowany |
| archived_at | date \| null | Data archiwizacji |

---

## Podsumowanie

| Plik | Kolumny | Wiersze danych | Relacje |
|------|---------|----------------|---------|
| contexts_rows.csv | 3 | 10 | user_id → profiles.id |
| plots_rows.csv | 3 | 6 | user_id → profiles.id |
| profiles_rows.csv | 11 | 9 | — (encja główna użytkownika) |
| tasks_rows.csv | 18 | 59 | user_id → profiles; context/plot jako nazwy |
| templates_rows.csv | 5 | 1 | user_id → profiles.id |
| wildflowers_rows.csv | 8 | 20 | user_id → profiles.id |

**Łączna liczba wierszy z danymi (w bieżącym katalogu BB):** 105.  
*Skrypt `scripts/csvToJson.mjs` obsługuje dowolną liczbę wierszy — liczby powyżej odnoszą się do plików w katalogu w chwili analizy.*

Relacje między tabelami: **profiles** jest encją centralną; **contexts**, **plots**, **tasks**, **templates** i **wildflowers** są powiązane z użytkownikiem przez `user_id`.
