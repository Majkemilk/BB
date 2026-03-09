# Handoff projektu Plantascape (BB)

## 1. Nazwa i cel

**Plantascape (BB)** – mobilna aplikacja do zarządzania zadaniami i pomysłami („Idea Meadow” / „Action Garden”), z subskrypcją premium (Stripe), kontem (Supabase + Google) oraz opcjonalną synchronizacją z kalendarzem i powiadomieniami.

---

## 2. Status projektu (skrót)

| Element | Wartość |
|--------|--------|
| **Nazwa produktu** | Plantascape (slug: BB) |
| **Slogan** | Grow Your Ideas |
| **Typ** | Aplikacja mobilna (Expo/React Native), wieloplatformowa |
| **Wersja** | 1.0.0 |
| **Bundle ID** | `com.bloomboard.app` |
| **EAS Project ID** | `8e958367-8920-4c4a-87ea-686765174a76` |

### Stack technologiczny

- **Framework:** Expo SDK 53, React 19, React Native 0.79
- **Routing:** expo-router (file-based), typed routes
- **Backend / Baza:** Supabase (auth, baza, Edge Functions, Storage)
- **Płatności:** Stripe (`@stripe/stripe-react-native`), webhook w Supabase
- **Auth:** Supabase Auth + Google Sign-In, weryfikacja e-mail, opcjonalnie biometria
- **UI:** lucide-react-native, react-native-reanimated, react-native-gesture-handler
- **Dodatki:** expo-notifications, expo-calendar, expo-secure-store, NetInfo

---

## 3. Wymagania do uruchomienia

- Node (zgodny z Expo 53), npm
- Konto Expo (EAS) – projectId w `app.json`
- Projekt Supabase (URL + anon key w `.env`)
- Opcjonalnie: Stripe (publishable key), Google OAuth (Client IDs w app.json lub env)
- Android: `google-services.json` w głównym katalogu

**Uruchomienie:**

```bash
npm install
# Ustaw .env (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)
npx expo start
# lub: expo run:android / expo run:ios (dev build)
```

---

## 4. Struktura katalogów

```
BB/
├── app/                    # Expo Router (auth, tabs, modal)
├── components/             # Komponenty UI (taski, wildflowers, modale, premium)
├── contexts/               # AuthContext, TaskContext
├── hooks/                  # useNetworkStatus, useNotificationPermissions, useOrientation, ...
├── utils/                  # supabase, notifications, calendar, backup, crash, offline, Stripe
├── data/                   # seedsData, tasksData, wildflowerData (fallback/mock?)
├── types/                  # supabase.ts, env.d.ts
├── constants/              # Colors
├── assets/images/          # ikony, adaptive-icon, favicon
├── supabase/
│   ├── config.toml
│   ├── migrations/         # 7 migracji SQL (tasks, wildflowers, profiles, templates, RLS, subscription)
│   └── functions/          # create-checkout-session, stripe-webhook (Edge Functions)
├── app.json / eas.json
├── package.json
├── env.d.ts                # EXPO_PUBLIC_SUPABASE_*
└── .env                    # nie w repo; EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## 5. Architektura aplikacji

- **`app/`** – routing Expo Router:
  - **`(auth)`** – login, register, reset-password, reset-success, verify-email
  - **`(tabs)`** – Idea Meadow (index), Action Garden (garden), Almanac, Settings `(settings)`, profile (ukryty tab)
  - **`modal`** – ekran modalny
- **`contexts/`** – AuthContext (sesja, profil, premium, Google), TaskContext (zadania, wildflowers, konteksty, plots, szablony, offline/retry/cache)
- **`components/`** – TaskItem, WildflowerItem, NewTaskModal, FilterModal, BackupRestoreModal, PremiumFeatureWrapper, BiometricLoginButton, itd.
- **`utils/`** – supabase, powiadomienia, kalendarz, autoBackup, crashReporter, offlineQueue, retryMechanism, Stripe checkout

---

## 6. Baza danych (Supabase)

Tabele: **profiles**, **tasks**, **wildflowers**, **contexts**, **plots**, **templates**.  
RLS włączone; polityki „Users can manage their own data”.  
Szczegóły w `types/supabase.ts` i w plikach w `supabase/migrations/`.

---

## 7. Konfiguracja i zmienne środowiskowe

- **W .env (lokalnie):** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; opcjonalnie Stripe i Google.
- **W EAS:** credentials i ewentualne sekrety (Stripe, Supabase) w EAS Secrets.
- **Google:** Client IDs w `app.json` – przy udostępnianiu repo rozważyć env/secrets.

---

## 8. Kluczowe pliki do przejrzenia

| Obszar | Pliki |
|--------|--------|
| Wejście / auth | `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `contexts/AuthContext.tsx` |
| Logika zadań | `contexts/TaskContext.tsx` |
| Supabase | `utils/supabase.ts`, `types/supabase.ts`, `supabase/migrations/` |
| Stripe | `app/(tabs)/(settings)/premium.tsx`, `supabase/functions/create-checkout-session/`, `stripe-webhook/` |
| Konfig | `app.json`, `eas.json`, `utils/config.ts`, `env.d.ts` |

---

## 9. Znane ograniczenia / zalecenia

- Brak testów jednostkowych/integracyjnych – warto dodać (np. Jest) dla auth i TaskContext.
- ErrorBoundary wyłączony w `app/_layout.tsx` – włączyć przy stabilizacji.
- Zredukować `console.log` w produkcji.
- Ujednolicić śledzenie plików (Errors/, obrazy, CSV) – dodać do repo lub .gitignore.
- **env.d.ts** vs **types/env.d.ts** – różne zestawy zmiennych; dopasować do faktycznego użycia.
- i18next w package.json bez użycia w kodzie – wdrożyć tłumaczenia lub usunąć zależność.

---

## 10. Dodatkowa dokumentacja

- README w repo – warto uzupełnić o opis Plantascape, wymagania (.env, EAS, Supabase) i komendy (start, build, lint).
- `utils/supabaseConfig.md` – konfiguracja Supabase.
