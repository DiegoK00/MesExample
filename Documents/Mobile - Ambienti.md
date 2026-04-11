# Mobile — Ambienti (Dev / Prod)

## Strategia

Flutter non ha un sistema `environment.ts` come Angular. La soluzione adottata usa le **costanti compile-time** di Dart (`String.fromEnvironment`) iniettate tramite `--dart-define-from-file`, supportato nativamente da Flutter ≥ 3.7.

---

## File di configurazione (`mobile/config/`)

| File | Ambiente | API URL |
|------|----------|---------|
| `env.dev.android.json` | Sviluppo — Android emulator | `http://10.0.2.2:5260` |
| `env.dev.ios.json` | Sviluppo — iOS simulator | `http://localhost:5260` |
| `env.prod.json` | Produzione | `https://api.mesclaude.com` |

> I file `env.*.json` **non vanno committati** se contengono segreti. Per questo progetto contengono solo URL, quindi è accettabile tenerli in repo. In un progetto con chiavi API o segreti, aggiungere `config/env.prod.json` a `.gitignore` e iniettare i valori via CI/CD.

---

## `AppEnvironment` (`lib/core/config/app_environment.dart`)

```dart
class AppEnvironment {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5260',  // dev Android (default)
  );

  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
  static String get name => isProduction ? 'production' : 'development';
}
```

- `String.fromEnvironment` è una **costante compile-time** — nessun overhead a runtime
- `dart.vm.product` è impostato automaticamente da Flutter in modalità release
- Il `defaultValue` garantisce che `flutter run` senza flags funzioni out-of-the-box su Android

---

## `ApiConstants` (`lib/core/constants/api_constants.dart`)

Usa `AppEnvironment.apiBaseUrl` come base per tutti gli endpoint:

```dart
static const String baseUrl = AppEnvironment.apiBaseUrl;
static const String login   = '$baseUrl/auth/login';
// ... tutti gli endpoint derivati da baseUrl
```

---

## Comandi di avvio

```bash
# Sviluppo Android (emulator)
flutter run --dart-define-from-file=config/env.dev.android.json

# Sviluppo iOS (simulator)
flutter run --dart-define-from-file=config/env.dev.ios.json

# Release produzione
flutter run --release --dart-define-from-file=config/env.prod.json

# Oppure con flag inline (utile in CI/CD)
flutter build apk --dart-define=API_BASE_URL=https://api.mesclaude.com
```

---

## VS Code (`mobile/.vscode/launch.json`)

Tre configurazioni preconfigurate selezionabili dal pannello Run & Debug:
- **Dev — Android** → `env.dev.android.json`
- **Dev — iOS** → `env.dev.ios.json`
- **Prod — Release** → `env.prod.json` in modalità release

---

## CI/CD

In un pipeline di build, iniettare l'URL tramite secret/env variable:

```yaml
# Esempio GitHub Actions
- run: flutter build apk --dart-define=API_BASE_URL=${{ secrets.API_BASE_URL }}
```

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `app_environment_test.dart` | 7 | apiBaseUrl non vuota, inizia con http/https, isProduction false in test, name="development", tutti gli endpoint iniziano con baseUrl, path auth corretti, path account corretti |
