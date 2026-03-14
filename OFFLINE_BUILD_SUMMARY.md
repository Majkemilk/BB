# BloomBoard (Plantascape) – wersja offline i build iOS

## Wprowadzone zmiany

### 1. AuthContext (tryb offline)
- **Nie używa Supabase** – brak importów i wywołań Supabase Auth.
- **Auto-logowanie** – przy starcie wywoływane jest `loadInitialData()`, potem `getFirstProfile()` z AsyncStorage (klucz `@profiles`). Jeśli jest profil, ustawiane są `user` i `userProfile`.
- **signInOffline()** – ustawia użytkownika z pierwszego profilu lub fikcyjnego `offline-local-user`.
- **session** – zawsze `null` (typ zachowany dla kompatybilności).

### 2. Import danych z CSV/JSON przy pierwszym uruchomieniu
- **utils/loadLocalData.ts**:
  - Odczyt z **expo-file-system/legacy** (Expo SDK 54) z `documentDirectory`; gdy brak plików – fallback na **bundled JSON** (`require('../data/json/...')`).
  - Flaga **@app_data_loaded** – jeśli `'true'`, import jest pomijany.
  - Przy błędzie odczytu dla danej encji zapisywana jest pusta tablica `[]`; przy błędzie `require()` w `getBundledJson()` zwracane jest `'[]'`.
  - Encje: contexts, plots, profiles, tasks, templates, wildflowers.
- Wywołanie w **app/_layout.tsx** w `useEffect` przy starcie.

### 3. Moduły wymagające backendu / usług zewnętrznych
- **Stripe** – w trybie offline (`IS_OFFLINE_MODE`) nie renderowany jest `StripeProvider`; używany jest pusty wrapper.
- **expo-notifications** – w _layout listener i kategoria tylko gdy `!IS_OFFLINE_MODE`; `useNotificationPermissions` w trybie offline od razu ustawia `isLoading: false` i nie wywołuje API.
- **expo-calendar** – w `calendarSync.ts` wszystkie funkcje na początku sprawdzają `IS_OFFLINE_MODE` i zwracają `false`/`null`.
- **Premium (Stripe/Supabase)** – w `premium.tsx` przyciski zakupu/przywracania/zarządzania subskrypcją są ukryte w trybie offline; wyświetlana jest informacja „Offline mode”.
- **expo-store-review** – w `reviewManager.ts` wywołania opakowane w `if (!IS_OFFLINE_MODE)`.
- **expo-haptics** – w TaskContext wywołania w blokach `if (!IS_OFFLINE_MODE)`.
- **expo-secure-store / expo-local-authentication** – w `biometricAuth.ts` już chronione flagą offline (zgodnie z NATIVE_MODULES_ANALYSIS.md).

Zależności (np. `@stripe/stripe-react-native`, `expo-notifications`) pozostają w **package.json**; w trybie offline nie są używane lub są wywoływane tylko za warunkiem. Usunięcie ich z `package.json` można zrobić później dla mniejszego rozmiaru aplikacji.

### 4. Konfiguracja pod build iOS (IPA)
- **app.json**:
  - **sdkVersion**: `"54.0.0"`.
  - **ios.bundleIdentifier**: `com.bloomboard.app`.
  - Pozostała konfiguracja bez zmian (NSCalendarsUsageDescription, ITSAppUsesNonExemptEncryption itd.).
- **eas.json**:
  - **development** – `distribution: "internal"`, `ios.simulator: false` (build na urządzenie).
  - **preview** – `distribution: "internal"`, kanał `preview`.
  - **production** – `credentialsSource: "remote"`, `autoIncrement: true`, dla iOS dodane `resourceClass: "m-medium"` (opcjonalnie).

Build IPA na fizyczne urządzenie (np. iPhone XR):
- Konto Apple Developer (lub Apple Developer Program).
- **Pierwszy build** uruchom w trybie interaktywnym (bez --non-interactive): `npx eas-cli build --platform ios --profile development` – EAS zapyta o Apple ID i skonfiguruje credentials. Kolejne buildy mogą używać --non-interactive.
- W katalogu projektu: `eas build --platform ios --profile preview` (lub `production`).

### 5. Testy i porządki
- **Zakładka Debug** – usunięta z nawigacji (tabs); plik **app/(tabs)/debug.tsx** usunięty.
- **Logi** – usunięte zbędne `console.log` z _layout (nawigacja, app state, permission status).
- **expo-file-system** – dodane do **package.json** (`expo-file-system: ~19.0.6`) na potrzeby loadLocalData.

---

## Weryfikacja w Expo Go / development build

1. **Uruchomienie**: `npx expo start` (np. `--port 8083` jeśli 8081 jest zajęty), potem skan QR w Expo Go.
2. **Sprawdzić**:
   - Czy po starcie następuje automatyczne logowanie (pierwszy profil z AsyncStorage lub „Kontynuuj bez logowania”).
   - Czy dane z plików JSON (zadania, wildflowers, konteksty, ploty, szablony) są widoczne.
   - Czy tworzenie nowego zadania zapisuje je w AsyncStorage (np. po restarcie aplikacji zadanie nadal jest na liście).
   - Czy w konsoli nie ma błędów (np. brak modułu, błąd przy require JSON).

---

## Opcjonalne kolejne kroki

- Usunięcie z **package.json** nieużywanych w trybie offline zależności (np. `@stripe/stripe-react-native`, `@react-native-google-signin/google-signin`, `expo-notifications`, `expo-calendar`) – po ich usunięciu trzeba sprawdzić, że wszystkie importy są za warunkiem lub usunięte.
- Wyłączenie lub usunięcie pluginów w **app.json** (expo-notifications, expo-calendar, google-signin) dla czystego buildu offline – mogą zostać, ale wtedy nie będą używane przy `IS_OFFLINE_MODE = true`.
