# 🔧 KONFIGURACJA SUPABASE - WERYFIKACJA EMAIL

## 📋 KROKI DO SPRAWDZENIA:

### 1. **Authentication Settings**
1. Przejdź do **Supabase Dashboard** → **Authentication** → **Settings**
2. Sprawdź sekcję **"Email"**:
   - ✅ **Enable email confirmations** - MUSI być włączone
   - ✅ **Enable email change confirmations** - zalecane
   - ✅ **Enable email change confirmations** - zalecane

### 2. **SMTP Configuration**
1. **Authentication** → **Settings** → **SMTP Settings**
2. Sprawdź czy SMTP jest skonfigurowany:
   - **Host:** (np. smtp.gmail.com)
   - **Port:** (np. 587)
   - **Username:** (twój email)
   - **Password:** (hasło aplikacji)

### 3. **Email Templates**
1. **Authentication** → **Templates**
2. Sprawdź szablon **"Confirm signup"**:
   - ✅ Czy jest aktywny
   - ✅ Czy ma poprawny link weryfikacyjny
   - ✅ Czy używa `{{ .ConfirmationURL }}`

### 4. **Site URL Configuration**
1. **Authentication** → **Settings** → **Site URL**
2. Ustaw: `plantascape://auth` (dla deep linking)

## 🚨 CZĘSTE PROBLEMY:

1. **Brak konfiguracji SMTP** - emaile nie są wysyłane
2. **Nieprawidłowy Site URL** - linki weryfikacyjne nie działają
3. **Wyłączona weryfikacja email** - użytkownicy są automatycznie weryfikowani
4. **Błędny szablon email** - emaile nie są generowane

## 🔧 ROZWIĄZANIE:

1. **Włącz weryfikację email** w ustawieniach Supabase
2. **Skonfiguruj SMTP** (Gmail, SendGrid, itp.)
3. **Sprawdź szablony email**
4. **Przetestuj ponownie rejestrację**
