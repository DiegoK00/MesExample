# Mobile — E2E Integration Test (Flutter)

## Scopo

Test end-to-end che eseguono l'**app completa** su un dispositivo reale o emulatore, verificando l'intera catena: GoRouter → Provider → AuthService → UI.

Differenza rispetto ai test unitari in `test/`:

| | `test/` (unit/widget) | `integration_test/` |
|---|---|---|
| Ambiente | `flutter_test` (in-process) | Device/emulatore reale |
| HTTP | MockClient/Mockito | MockClient iniettato |
| Router | Mock manuale | GoRouter reale |
| Navigazione | Simulata | Reale (context.go) |
| SharedPreferences | Mock isolato | Mock tramite setMockInitialValues |

---

## Setup

### 1. Dipendenza

```yaml
# pubspec.yaml
dev_dependencies:
  integration_test:
    sdk: flutter
```

### 2. Esegui i test

```bash
# Su emulatore/device connesso
flutter test integration_test/app_test.dart

# Con ambiente specifico
flutter test integration_test/app_test.dart \
  --dart-define-from-file=config/env.dev.android.json
```

---

## Struttura

```
integration_test/
├── helpers/
│   ├── fake_secure_storage.dart  → FlutterSecureStorage in-memory (evita platform channel)
│   └── mock_client.dart          → MockClient con risposte API predefinite
└── app_test.dart                 → 6 test E2E del flusso completo
```

---

## Strategia di mock

**HTTP**: `MockClient` da `package:http/testing.dart` iniettato in `AuthService` via costruttore.  
Il client usa token diversi per area Admin (`admin-access-token`) e App (`app-access-token`): `GET /account/me` risponde con il profilo corretto controllando l'header `Authorization`.

**SecureStorage**: `FakeSecureStorage implements FlutterSecureStorage` — mappa in-memory, evita il platform channel (non disponibile nei test headless).

**SharedPreferences**: `SharedPreferences.setMockInitialValues({'last_area': N})` — determina quale schermata di login viene mostrata all'avvio.

**MyApp**: L'app viene istanziata direttamente con dipendenze iniettate — non si chiama `main()` della produzione.

```dart
final app = MyApp(
  auth: AuthService(client: buildMockClient(), storage: FakeSecureStorage()),
  prefs: PreferencesService(),
  errorNotifier: ErrorNotifier(),
);
await tester.pumpWidget(app);
```

---

## Copertura — 6 test

| Test | Flusso verificato |
|------|-------------------|
| `admin_login_flow` | Login admin → "Benvenuto, admin" + ruolo "SuperAdmin" visibili |
| `app_login_flow` | Login app user → "Benvenuto, user" visibile su HomeScreen |
| `admin_logout_flow` | Logout da AdminHomeScreen → torna a LoginScreen "Backoffice" |
| `admin_navigate_to_users` | Tap card "Utenti" → naviga ad AdminUsersScreen |
| `app_navigate_to_programs` | Tap "Programmi assegnati" → naviga a ProgramsScreen con "PROG_A" |
| `admin_change_password` | Tap card "Cambia password" → naviga a ChangePasswordScreen |

---

## Note implementative

- `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` deve essere la prima chiamata in `main()`
- `pumpAndSettle()` aspetta che tutte le animazioni e le `Future` pendenti si risolvano — sufficiente per GoRouter e Provider
- I test sono **sequenziali e indipendenti**: ogni `testWidgets` ricrea l'app da zero via `buildApp()`
- Il `MockClient` riconosce l'utente dal token nell'header `Authorization` — non serve stato condiviso
