# Analiza modułów natywnych / Expo w projekcie BB

Przeskanowano katalogi: `app/`, `components/`, `contexts/`, `hooks/`, `utils/` (pliki `.ts`, `.tsx`, `.js`, `.jsx`).

---

## 1. Moduły z listy – gdzie są używane

| Moduł | Ścieżki plików | Zastosowanie |
|-------|----------------|--------------|
| **@react-native-google-signin/google-signin** | `utils/googleAuth.ts` (import zakomentowany) | Logowanie przez Google – obecnie wyłączone; używane było do `configure` i `signIn()`. |
| **expo-camera** | — | Brak importów w projekcie. |
| **expo-notifications** | `app/_layout.tsx`, `hooks/useNotificationPermissions.ts`, `utils/notifications.ts`, `utils/wildflowerNotifications.ts`, `components/NotificationTest.tsx`, `app/(tabs)/(settings)/notifications-and-calendar.tsx` | Kategorie powiadomień, listener odpowiedzi, harmonogram zadań/wildflowers; uprawnienia; test powiadomień; ekran ustawień powiadomień i kalendarza. |
| **expo-calendar** | `utils/calendar.ts`, `utils/calendarSync.ts`, `hooks/useCalendarPermissions.ts`, `app/(tabs)/(settings)/notifications-and-calendar.tsx` | Uprawnienia, listowanie kalendarzy, tworzenie/aktualizacja zdarzeń (sync zadań), ekran ustawień kalendarza. |
| **expo-haptics** | `components/HapticTab.tsx`, `components/ParallaxScrollView.tsx` (nie), `components/NewTaskModal.tsx`, `app/(tabs)/index.tsx`, `components/CompletedTaskItem.tsx`, `components/WildflowerItem.tsx`, `components/NameTemplateModal.tsx`, `app/(tabs)/(settings)/compost-bin.tsx`, `app/(tabs)/(settings)/granary.tsx`, `components/TaskItem.tsx`, `components/ArchivedWildflowerItem.tsx`, `components/SeedlingItem.tsx`, `contexts/TaskContext.tsx`, `components/NewWildflowerModal.tsx` | Wibracje przy klikaniu (zakładki, zadania, szablony, wildflowers, modale, compost-bin, granary). |
| **expo-image-picker** | — | Brak importów w projekcie. |
| **expo-file-system** | `utils/loadLocalData.ts` | Odczyt plików JSON z `documentDirectory` (data/json), tworzenie katalogu; fallback na dane z bundla. **Działa w Expo Go** (część Expo SDK). |
| **expo-constants** | `utils/config.ts`, `utils/notifications.ts`, `utils/wildflowerNotifications.ts` | Konfiguracja (Google OAuth IDs itd.), sprawdzanie `isDevice` przy powiadomieniach. **Działa w Expo Go**. |
| **expo-linking** | (używane pośrednio przez expo-router / inne pakiety) | Brak bezpośredniego importu w app/components/contexts/hooks/utils. **Działa w Expo Go**. |
| **expo-web-browser** | `components/ExternalLink.tsx`, `app/(tabs)/(settings)/premium.tsx` | Otwieranie linków w przeglądarce (linki zewnętrzne, Premium). **Działa w Expo Go**. |
| **react-native-gesture-handler** | (w zależnościach; typowo używany przez nawigację/Expo) | Brak bezpośredniego importu w skanowanych plikach. **Działa w Expo Go**. |
| **react-native-reanimated** | `components/ParallaxScrollView.tsx`, `components/HelloWave.tsx` | Animacje (parallax, fala). **Działa w Expo Go**. |
| **react-native-safe-area-context** | `app/(tabs)/_layout.tsx`, `app/(tabs)/(settings)/manage-categories.tsx`, `app/(tabs)/(settings)/manage-seedlings.tsx` | `useSafeAreaInsets()` – padding pod pasek nawigacji i safe area. **Działa w Expo Go**. |
| **react-native-screens** | (używane przez expo-router / React Navigation) | Brak bezpośredniego importu w skanowanych plikach. **Działa w Expo Go**. |

---

## 2. Inne moduły „natywne” znalezione w projekcie

| Moduł | Ścieżki plików | Zastosowanie |
|-------|----------------|--------------|
| **expo-blur** | `components/ui/TabBarBackground.ios.tsx` | Rozmycie tła zakładki (tylko iOS). |
| **expo-local-authentication** | `utils/biometricAuth.ts` | Biometria (Face ID / Touch ID) do logowania. |
| **expo-secure-store** | `utils/biometricAuth.ts`, `utils/supabase.ts` | Przechowywanie tokenów/credentials (Supabase, biometria). |
| **expo-store-review** | `utils/reviewManager.ts` | Wywołanie natywnego promptu „Oceń aplikację”. |
| **expo-symbols** | `components/ui/IconSymbol.tsx`, `components/ui/IconSymbol.ios.tsx` | Ikony SF Symbols (iOS). |
| **@react-native-async-storage/async-storage** | `utils/dataCache.ts`, `utils/dataExport.ts`, `utils/databaseFallbackStrategies.ts`, `utils/offlineQueue.ts`, `app/(tabs)/debug.tsx`, `utils/loadLocalData.ts`, `utils/autoBackup.ts`, `utils/errorRecoveryMechanisms.ts`, `app/(tabs)/(settings)/notifications-and-calendar.tsx`, `utils/notifications.ts`, `contexts/TaskContext.tsx`, `utils/networkAwareOperations.ts`, `utils/crashReporter.ts`, `utils/reviewManager.ts` | Cache, eksport, fallback, kolejka offline, debug, ładowanie danych lokalnych, backup, recovery, ustawienia, powiadomienia, kontekst zadań, operacje z siecią, crash reporter, review. **Krytyczny dla trybu offline.** |
| **@react-native-community/netinfo** | `hooks/useNetworkStatus.ts` | Status sieci (online/offline). |
| **@react-native-community/datetimepicker** | `components/NewTaskModal.tsx`, `app/(tabs)/(settings)/notifications-and-calendar.tsx` | Wybór daty/czasu. |
| **react-native-webview** | `app/(tabs)/(settings)/privacy.tsx`, `app/(tabs)/(settings)/terms.tsx` | Wyświetlanie treści Privacy / Terms. |
| **react-native-svg** | `app/(tabs)/(settings)/tracker.tsx` | Wykresy/ikony (Circle, Rect, Svg, Text itd.). |
| **react-native-qrcode-svg** | `components/QRCodeModal.tsx` | Generowanie kodu QR. |

---

## 3. Podział: opcjonalne vs krytyczne dla wersji offline

### Opcjonalne w wersji offline (można wyłączyć / zastąpić)

- **@react-native-google-signin/google-signin** – logowanie Google (już wyłączone w trybie offline).
- **expo-notifications** – powiadomienia push; w trybie offline można wyłączyć harmonogram i listenery.
- **expo-calendar** – synchronizacja z kalendarzem; bez sieci/Supabase sync i tak ma ograniczony sens – można wyłączyć (np. ukryć opcje sync w ustawieniach).
- **expo-haptics** – wibracje; można zastąpić no-op lub warunkiem `if (Constants.isDevice)` żeby nie psuć na webie.
- **expo-local-authentication** + **expo-secure-store** (w biometricAuth) – logowanie biometryczne; opcjonalne, można wejść przez „Kontynuuj bez logowania”.
- **expo-secure-store** (w supabase) – tokeny Supabase; w trybie offline nie potrzebne (sesja lokalna).
- **expo-store-review** – ocena w sklepie; można wywoływać tylko gdy użytkownik jest „online” (zalogowany przez Supabase).
- **expo-blur** – rozmycie tła zakładki; kosmetyka, można zastąpić zwykłym tłem.
- **expo-symbols** – SF Symbols; można podmienić na zwykłe ikony (np. lucide) na potrzeby offline/web.

### Krytyczne / ważne dla działania aplikacji (w tym offline)

- **@react-native-async-storage/async-storage** – przechowywanie danych lokalnych, cache, stan zadań, loadLocalData, backup. **Bez tego tryb offline nie ma sensu.**
- **expo-file-system** – w `loadLocalData.ts` do odczytu JSON z katalogu dokumentów (opcjonalnie; jest fallback na bundel). **Działa w Expo Go**; w czystym offline można polegać tylko na bundlu/AsyncStorage.
- **expo-constants** – konfiguracja i `isDevice`; używane w wielu miejscach. **Trzymać.**
- **expo-web-browser** – linki zewnętrzne i Premium; można zostawić (działa w Expo Go).
- **react-native-gesture-handler**, **react-native-reanimated**, **react-native-safe-area-context**, **react-native-screens** – nawigacja i UX. **Krytyczne dla działania UI.**

### Do rozważenia w zależności od wymagań

- **@react-native-community/netinfo** – wykrywanie sieci; przydatne do przełączania trybu offline/online i synchronizacji.
- **@react-native-community/datetimepicker** – wybór dat w formularzach; ważne dla zadań, ale można tymczasowo zastąpić prostym polem tekstowym.
- **react-native-webview** – tylko Privacy/Terms; można w trybie offline pokazać statyczną treść lub link.
- **react-native-svg** – wykres w Trackerze; opcjonalna funkcja.
- **react-native-qrcode-svg** – tylko QR w modalu; opcjonalne.

---

## 4. Skrót rekomendacji dla wersji offline

| Akcja | Moduły |
|-------|--------|
| **Już wyłączone** | Google Sign-In. |
| **Wyłączyć / nie wywoływać w offline** | Powiadomienia (schedule/listener), sync kalendarza, logowanie biometryczne, store review. |
| **Zostawić (działają w Expo Go / są potrzebne)** | AsyncStorage, expo-file-system, expo-constants, expo-web-browser, gesture-handler, reanimated, safe-area-context, screens. |
| **Opcjonalnie no-op / warunkowo** | expo-haptics (np. tylko gdy `Constants.isDevice`), expo-blur, expo-symbols. |

Dokument wygenerowany na podstawie skanowania plików w katalogach app/, components/, contexts/, hooks/, utils/.
