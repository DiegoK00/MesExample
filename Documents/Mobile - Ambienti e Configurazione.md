# Mobile - Ambienti e Configurazione

Strategia di gestione degli ambienti e delle variabili di configurazione nell'app Flutter.

---

## AppEnvironment

File: `mobile/lib/core/config/app_environment.dart`

Classe statica che espone le variabili di configurazione iniettate a compile-time tramite `--dart-define` o `--dart-define-from-file`.

### Variabili disponibili

| Variabile dart-define | Proprietà Dart | Default | Note |
|---|---|---|---|
| `API_BASE_URL` | `AppEnvironment.apiBaseUrl` | `http://10.0.2.2:5260` | `10.0.2.2` = host dall'emulatore Android |
| `dart.vm.product` | `AppEnvironment.isProduction` | `false` | Impostato automaticamente da Dart in `--release` |

`AppEnvironment.name` restituisce `"production"` o `"development"` in base a `isProduction`.

---

## File di configurazione per ambiente

I file JSON si trovano in `mobile/config/` e **non vengono committati** (contengono URL di ambiente).  
Vanno creati localmente da ogni sviluppatore.

### env.dev.android.json
```json
{ "API_BASE_URL": "http://10.0.2.2:5260" }
```
Usato con emulatore Android — `10.0.2.2` è l'alias del localhost host sulla rete virtuale Android.

### env.dev.ios.json
```json
{ "API_BASE_URL": "http://localhost:5260" }
```
Usato con iOS simulator — l'iOS simulator condivide il network dell'host direttamente.

### env.prod.json
```json
{ "API_BASE_URL": "https://api.mesclaude.com" }
```
Usato per i build di release.

---

## Comandi per ambiente

```bash
# Android emulator — sviluppo
flutter run --dart-define-from-file=config/env.dev.android.json

# iOS simulator — sviluppo (solo macOS)
flutter run --dart-define-from-file=config/env.dev.ios.json

# Build release Android
flutter build apk --dart-define-from-file=config/env.prod.json

# Build release iOS (solo macOS)
flutter build ipa --dart-define-from-file=config/env.prod.json

# Senza file (usa default: Android emulator http://10.0.2.2:5260)
flutter run
```

---

## Uso in CI/CD

### GitHub Actions (test + APK debug)

Il job `mobile-test` in CI non usa `--dart-define-from-file` — usa il default (`http://10.0.2.2:5260`).  
I test Flutter non fanno chiamate HTTP reali, quindi il valore non è rilevante per CI.

### Codemagic (release)

`API_BASE_URL` viene iniettata come variabile d'ambiente nel dashboard Codemagic e passata al build:

```yaml
flutter build ipa \
  --release \
  --dart-define=API_BASE_URL=$API_BASE_URL
```

Vedi [CI - Codemagic.md](CI%20-%20Codemagic.md) per dettagli sul setup.

---

## ApiConstants

File: `mobile/lib/core/constants/api_constants.dart`

Centralizza tutti gli URL dell'API costruiti da `AppEnvironment.apiBaseUrl`.  
Aggiungere sempre qui i nuovi endpoint invece di usare stringhe inline nei service.

```dart
static const String articles = '$baseUrl/articles';
static String article(int id) => '$articles/$id';  // URL dinamici come metodi statici
```
