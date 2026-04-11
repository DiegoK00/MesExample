# Mobile - Flutter

## Setup

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# Avvio con ambiente (vedi sezione Ambienti)
flutter run --dart-define-from-file=config/env.dev.android.json
```

---

## Convenzioni

- Single codebase per **iOS e Android** (desktop/web opzionali)
- Architettura: **Feature-first** con separazione tra UI, business logic e data layer
- State management: **Provider** (`ChangeNotifier`) — usato in tutto il progetto
- Chiamate API tramite `http` (package `http: ^1.2.2`)
- Navigazione: **go_router** con redirect basato su stato auth e `loginArea`
- Token sensibili salvati in **flutter_secure_storage**
- Preferenze non sensibili in **shared_preferences**
- Nessuna logica di business nei widget — solo presentazione

---

## Struttura Cartelle

```
mobile/
├── config/
│   ├── env.dev.android.json   → API_BASE_URL per Android emulator
│   ├── env.dev.ios.json       → API_BASE_URL per iOS simulator
│   └── env.prod.json          → API_BASE_URL produzione
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── app_environment.dart     → String.fromEnvironment (apiBaseUrl, isProduction)
│   │   ├── constants/
│   │   │   └── api_constants.dart       → endpoint derivati da AppEnvironment.apiBaseUrl
│   │   ├── errors/
│   │   │   └── app_exceptions.dart      → NetworkException, ServerException
│   │   ├── models/
│   │   │   ├── auth_models.dart         → LoginRequest, LoginResponse, CurrentUser
│   │   │   ├── user_models.dart         → UserResponse, UsersPageResponse
│   │   │   ├── program_models.dart      → ProgramResponse
│   │   │   └── audit_log_models.dart    → AuditLogEntry, AuditLogsPageResponse
│   │   ├── network/
│   │   │   └── app_http_client.dart     → BaseClient: SocketException/Timeout → NetworkException
│   │   └── services/
│   │       ├── auth_service.dart        → ChangeNotifier: login/logout/refresh + authenticated HTTP
│   │       ├── error_notifier.dart      → ChangeNotifier: broadcast errori rete globali
│   │       ├── preferences_service.dart → ChangeNotifier: themeMode, lastArea
│   │       ├── users_service.dart       → getAll con paginazione e ricerca
│   │       ├── programs_service.dart    → getAll con filtro activeOnly
│   │       └── audit_logs_service.dart  → getLogs con filtri
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── login_screen.dart           → Form email/password, link password dimenticata
│   │   │   ├── forgot_password/
│   │   │   │   └── forgot_password_screen.dart → Form email, anti-enumeration
│   │   │   ├── reset_password/
│   │   │   │   └── reset_password_screen.dart  → Form nuova password + conferma, token da query param
│   │   │   └── change_password/
│   │   │       └── change_password_screen.dart → Form 3 campi, back contestuale per area
│   │   ├── home/
│   │   │   ├── home_screen.dart         → Dashboard utente App (profilo, link cambio pwd, link programmi)
│   │   │   └── programs_screen.dart     → Lista programmi assegnati come card
│   │   └── admin/
│   │       ├── admin_home_screen.dart   → Home admin con nav cards (Gestione + Account)
│   │       ├── users/
│   │       │   └── admin_users_screen.dart
│   │       ├── programs/
│   │       │   └── admin_programs_screen.dart
│   │       └── audit_logs/
│   │           └── admin_audit_logs_screen.dart
│   └── main.dart              → Entry point: ErrorNotifier, GoRouter, MultiProvider, ScaffoldMessengerKey
└── .vscode/
    └── launch.json            → 3 configurazioni: Dev Android, Dev iOS, Prod Release
```

---

## Autenticazione e Refresh Token

- Token salvati in **flutter_secure_storage** (keychain iOS / keystore Android)
- `AuthService.init()` chiamato al boot: carica il token e recupera `GET /account/me`
- Il logout chiama `POST /auth/logout` con il refresh token, poi cancella lo storage
- **Refresh automatico**: `authenticatedGet/Post/Put/Delete()` intercettano 401 → `refresh()` → retry → se fallisce, `logout()` automatico
- Nessun interceptor separato — tutto in `AuthService`

---

## Navigazione (go_router)

```
/login                   → LoginScreen(area: 2)       ← area App
/home                    → HomeScreen                 ← dashboard profilo utente App
/programs                → ProgramsScreen             ← programmi assegnati
/admin-login             → LoginScreen(area: 1)       ← area Admin
/admin                   → AdminHomeScreen
/admin/users             → AdminUsersScreen
/admin/programs          → AdminProgramsScreen
/admin/audit-logs        → AdminAuditLogsScreen
/change-password         → ChangePasswordScreen       ← richiede autenticazione
/forgot-password/:area   → ForgotPasswordScreen       ← senza auth
/reset-password/:area    → ResetPasswordScreen        ← senza auth (?token=...)
```

- `refreshListenable: AuthService` → il router rivaluta il redirect ad ogni cambio auth
- `_initialLocation()` usa `PreferencesService.lastArea` per scegliere la login page all'avvio
- Redirect impedisce accesso cross-area (utente App → /admin e viceversa)
- Le route `/forgot-password` e `/reset-password` sono escluse dal guard (accessibili senza auth)

---

## Gestione Errori Globale

`AppHttpClient extends http.BaseClient` intercetta `SocketException`/`TimeoutException` → `NetworkException`.  
`AuthService.authenticatedXxx` cattura `NetworkException` → notifica `ErrorNotifier` → rethrow.  
In `main.dart`, `_messengerKey` (`GlobalKey<ScaffoldMessengerState>`) mostra uno SnackBar rosso globale.  
Vedere: `Documents/Mobile - Gestione Errori Globale.md`

---

## Ambienti

URL API configurato a compile-time tramite `--dart-define-from-file`. Vedere `Documents/Mobile - Ambienti.md`.

---

## Preferenze Utente (shared_preferences)

Gestite da `PreferencesService` (ChangeNotifier):

| Chiave | Tipo | Default | Scopo |
|--------|------|---------|-------|
| `last_area` | int | 2 | Ultima area usata → login page all'avvio |
| `theme_mode` | string | — (system) | `'dark'` o `'light'` |

---

## Dipendenze (pubspec.yaml)

| Package | Versione | Scopo |
|---------|----------|-------|
| `http` | ^1.2.2 | Chiamate API REST |
| `flutter_secure_storage` | ^9.2.4 | Storage sicuro token |
| `go_router` | ^14.6.2 | Navigazione dichiarativa |
| `provider` | ^6.1.2 | State management |
| `shared_preferences` | ^2.3.3 | Preferenze non sensibili (tema, lastArea) |

Dev:

| Package | Versione | Scopo |
|---------|----------|-------|
| `mockito` | ^5.4.4 | Mock per test |
| `build_runner` | ^2.4.13 | Generazione mock |

---

## Testing

| Tool | Scopo |
|------|-------|
| **flutter_test** | Unit test e widget test (built-in) |
| **integration_test** | E2E su device/emulatore reale |
| **mockito + build_runner** | Mock di servizi e repository |

### Stato Test — 2026-04-02

**102/102 test passati** — flutter_test + mockito

| File | Test | Cosa verifica |
|------|------|---------------|
| `auth_service_test.dart` | 13 | login (token, currentUser, 401), logout, init, refresh (4 casi), authenticatedGet (3 casi) |
| `login_screen_test.dart` | 10 | titoli per area, validazione, submit ok/ko, loading, toggle password, inizializzazione |
| `preferences_service_test.dart` | 9 | init (default/dark/light/lastArea), setThemeMode (aggiorna/notifica/persiste), setLastArea |
| `admin_home_screen_test.dart` | 4 | username/ruoli, card navigazione, logout |
| `admin_users_screen_test.dart` | 5 | loading, lista utenti, badge stato, errore, vuota |
| `admin_programs_screen_test.dart` | 4 | lista, badge, errore, vuota |
| `admin_audit_logs_screen_test.dart` | 4 | lista log, entità, errore, vuota |
| `forgot_password_screen_test.dart` | 7 | campo email, validazione, submit, successo, anti-enumeration, titolo, AppBar |
| `reset_password_screen_test.dart` | 11 | token vuoto, form, validazione (vuota/corta/mismatch), submit, successo, errore, loading |
| `programs_screen_test.dart` | 6 | titolo, lista vuota, icona empty, card per programma, icone card, back button |
| `change_password_screen_test.dart` | 10 | titolo, tre campi, validazione, submit, successo, errore inline, loading, back App/Admin |
| `error_notifier_test.dart` | 7 | init, handle NetworkException/ServerException/generica, clear, clear su null, successive |
| `app_http_client_test.dart` | 5 | forwarding, SocketException→NetworkException, TimeoutException→NetworkException, non-rete, 401 invariata |
| `app_environment_test.dart` | 7 | apiBaseUrl non vuota, http/https, isProduction false, name development, endpoint da baseUrl, path auth/account |

### Note implementative test

- `AuthService` con DI via costruttore (`http.Client`, `FlutterSecureStorage`, `ErrorNotifier`) — tutti opzionali
- `PreferencesService` testato con `SharedPreferences.setMockInitialValues({})`
- `AppHttpClient` testato con `MockClient` del package `http/testing.dart`
- Mock generati con: `flutter pub run build_runner build --delete-conflicting-outputs`

---

## Integration Test (E2E)

Test E2E su emulatore/device reale, usando `integration_test` SDK.

### Setup

`pubspec.yaml` (dev_dependencies):
```yaml
integration_test:
  sdk: flutter
```

Avvio:
```bash
flutter test integration_test/app_test.dart
```

### Struttura

```
mobile/
├── integration_test/
│   ├── app_test.dart                    → Test E2E principali
│   └── helpers/
│       ├── fake_secure_storage.dart     → FakeSecureStorage (in-memory)
│       └── mock_client.dart             → MockClient HTTP con risposte statiche
```

### Strategia Mock

Poiché `integration_test` gira su device reale (no mocks automatici di platform channel):

- **`FakeSecureStorage`**: implementa `FlutterSecureStorage` con una `Map<String, String>` in memoria — bypassa il platform channel che non è disponibile nei test
- **`MockClient`** (da `http/testing.dart`): restituisce risposte HTTP predefinite basate sul path della request
  - `POST /auth/login` → token diverso per area 1 (`admin-access-token`) o area 2 (`app-access-token`)
  - `GET /account/me` → user diverso in base all'header `Authorization` (contiene "admin" → admin, altrimenti → app)
  - `POST /auth/logout` → 204
  - `GET /users`, `/programs`, `/audit-logs` → dati paginati mock
  - `PUT /account/password` → 204
- **`SharedPreferences.setMockInitialValues`**: usato per settare `last_area` prima di ogni test e determinare la route iniziale

### Bootstrapping

I test istanziano `MyApp` direttamente via DI constructor (non chiamano `main()`):

```dart
IntegrationTestWidgetsFlutterBinding.ensureInitialized();

Future<MyApp> buildApp({int lastArea = 2}) async {
  SharedPreferences.setMockInitialValues({'last_area': lastArea});
  final storage = FakeSecureStorage();
  final errorNotifier = ErrorNotifier();
  final auth = AuthService(client: buildMockClient(), storage: storage, errorNotifier: errorNotifier);
  final prefs = PreferencesService();
  await Future.wait([auth.init(), prefs.init()]);
  return MyApp(auth: auth, prefs: prefs, errorNotifier: errorNotifier);
}
```

### Copertura — 6 test

| Test | Cosa verifica |
|------|---------------|
| `admin_login_flow` | Login area Admin → "Benvenuto, admin" + ruolo "SuperAdmin" |
| `app_login_flow` | Login area App → "Benvenuto, user" |
| `admin_logout_flow` | Tap logout → torna alla schermata "Backoffice" |
| `admin_navigate_to_users` | Tap "Utenti" → `AdminUsersScreen` con lista utenti |
| `app_navigate_to_programs` | Tap "Programmi assegnati" → "I miei programmi" + "PROG_A" |
| `admin_change_password` | Tap "Cambia password" → `ChangePasswordScreen` con tre campi |
