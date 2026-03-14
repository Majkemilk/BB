# GitHub Actions – Build iOS IPA

## Workflow: Build iOS IPA

- **Plik:** `build-ios-ipa.yml`
- **Uruchomienie:** ręcznie w zakładce **Actions** → **Build iOS IPA** → **Run workflow**.

## Wymagania

1. **Sekret repozytorium `EXPO_TOKEN`**
   - W repozytorium: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
   - Nazwa: `EXPO_TOKEN`.
   - Wartość: token z [expo.dev](https://expo.dev) → **Account** → **Access tokens** → **Create**.

2. **Credentials iOS w EAS (jednorazowo)**
   - Lokalnie (na swoim Macu lub w inny sposób) uruchom raz interaktywnie:
     ```bash
     npx eas-cli build --platform ios --profile preview
     ```
   - Zaloguj się do Expo i podaj **Apple ID** (darmowe konto Apple wystarczy do internal distribution).
   - EAS utworzy/zapisze certyfikat i provisioning profile. Potem pipeline będzie mógł z nich korzystać przez `EXPO_TOKEN`.

## Co robi pipeline

- Używa **macos-latest**.
- Instaluje zależności: `npm ci`.
- Instaluje **EAS CLI**.
- Uruchamia **lokalny** build iOS: `eas build --platform ios --profile preview --local --non-interactive`.
- Zapisuje wynik w katalogu `ios-artifacts/` i publikuje go jako **artifact** o nazwie `app-ipa`.

Po zakończeniu workflow w zakładce **Actions** → wybrane uruchomienie → sekcja **Artifacts** pojawi się `app-ipa` do pobrania (w środku m.in. plik `.ipa`).

## Instalacja na iPhonie (AltStore / LiveContainer)

Pobrany plik `.ipa` możesz zainstalować przez AltStore lub LiveContainer (sideload z użyciem darmowego Apple ID; podpis development, np. 7-dniowy).
