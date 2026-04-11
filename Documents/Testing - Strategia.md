# Testing - Strategia

## Regole Generali

- Test per i **critical path** e i casi limite
- Test **deterministici** — nessun dato random, nessuna logica time-dependent senza mock
- Ogni test verifica **una sola cosa** con nome descrittivo
- Preferire **integration test** su heavy mocking dove praticabile

---

## Per Layer

### API (.NET)

| Tool | Scopo |
|------|-------|
| **xUnit** | Unit test e integration test |
| **Moq** | Mock di dipendenze |
| **Microsoft.Playwright** | E2E — scenari API completi |

### Web (Angular)

| Tool | Scopo |
|------|-------|
| **Jasmine + Karma** | Unit test componenti e servizi |
| **TestBed** | Test componenti Angular con DI |
| **@playwright/test** | E2E — scenari utente nel browser |

### Mobile (Flutter)

| Tool | Scopo |
|------|-------|
| **flutter_test** | Unit test e widget test (built-in) |
| **integration_test** | E2E su device/emulatore reale |
| **mockito + build_runner** | Mock di servizi e repository |

---

## Priorità

1. **Autenticazione** — login, refresh, logout, reset password
2. **Autorizzazione** — accesso per area (Admin / App) e per programma
3. **CRUD principali** — Users, Programs, UserPrograms
4. **Edge case** — token scaduto, token revocato, utente disabilitato

---

## Stato Test API (.NET) — 2026-04-02

**66/66 test passati** — xUnit + EF Core InMemory + Moq — progetto in `Api_Test/`

| File | Test | Cosa verifica |
|------|------|---------------|
| `AuthServiceTests.cs` | 19 | HashPassword/VerifyPassword, LoginAsync (valido/password errata/utente non trovato/inattivo/area sbagliata), LogoutAsync, RefreshAsync (valido/scaduto/revocato→revoca tutto), **ForgotPasswordAsync** (invia email/crea token DB/email non trovata→no email), ResetPasswordAsync |
| `EmailServiceTests.cs` | 6 | Chiama `IResend.EmailSendAsync` una volta, To corretto, From corretto, HtmlBody contiene reset URL, token URL-encoded, trailing slash trimmed |
| `UserServiceTests.cs` | 16 | GetAllAsync (paginazione, search), GetByIdAsync, CreateAsync (valido/email duplicata/username duplicato/stessa email altra area), UpdateAsync, DeactivateAsync, ChangePasswordAsync |
| `ProgramServiceTests.cs` | 17 | GetAllAsync (tutti/solo attivi), GetByIdAsync, CreateAsync (valido/codice duplicato), UpdateAsync, DeleteAsync (ok/non esistente/assegnato→eccezione), AssignProgramsAsync (valido/utente inesistente/inattivo/già assegnato), RevokeProgramsAsync |
| `AuditLogServiceTests.cs` | 8 | LogAsync (con/senza campi opzionali), GetLogsAsync (paginazione, filtri action/userId/entityName/date range, ordinamento DESC) |

**Note**: `IEmailService` è mockato con `Mock.Of<IEmailService>()` (no-op) in tutti i test che non verificano il comportamento email. Nei test E2E (`Api_E2E/`, `Api_Playwright/`) è sostituito con `NoOpEmailService` via `ConfigureServices`.

---

## Stato Test Web (Angular) — 2026-04-01

**144/144 test passati** — Jasmine + Karma + ChromeHeadless

| File spec | Test | Cosa verifica |
|-----------|------|---------------|
| `auth.service.spec.ts` | 13 | login, logout, refresh, hasRole, hasProgram, isAdmin, isLoggedIn |
| `account.service.spec.ts` | 2 | getMe, changePassword |
| `users.service.spec.ts` | 10 | getAll (paginazione, search), getById, create, update, deactivate, getUserPrograms, assignPrograms, revokePrograms |
| `programs.service.spec.ts` | 7 | getAll (activeOnly), getById, create, update, delete |
| `audit-logs.service.spec.ts` | 5 | getLogs con filtri (action, entityName, userId, from/to, paginazione) |
| `auth.guard.spec.ts` | 8 | adminGuard e appGuard — not logged in, user presente, fetch /account/me, errore su fetch |
| `auth.interceptor.spec.ts` | 5 | aggiunta header Bearer, assenza header senza token, refresh su 401, logout su refresh fallito, skip refresh su auth endpoint |
| `login.component.spec.ts` | 10 | inizializzazione, redirect se già loggato, validazione form, submit ok/ko, loading state, toggle password |
| `admin-layout.component.spec.ts` | 5 | titolo Backoffice, username in toolbar, aria-label Menu, logout(), 3 nav items |
| `users.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, search(), deactivate() con/senza conferma, openCreateDialog() |
| `user-dialog.component.spec.ts` | 9 | crea: titolo/campo password/area login/form invalido/create(); modifica: titolo/no password/pre-popola email/update() |
| `user-programs-dialog.component.spec.ts` | 6 | caricamento init, available() esclude assegnati+inattivi, titolo con username, assign() aggiorna lista, revoke() rimuove, errore caricamento |
| `programs.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, activeOnly, delete() con/senza conferma, openCreateDialog() |
| `program-dialog.component.spec.ts` | 9 | crea: titolo/campo codice/uppercaseCode/form invalido/create(); modifica: titolo/readonly/pre-popola nome/update() |
| `audit-logs.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, filtro action, clearFilters(), getActionColor() warn/primary |
| `app-layout.component.spec.ts` | 5 | titolo MesClaude, username in toolbar, programmi nel sidenav, messaggio lista vuota, logout() |
| `dashboard.component.spec.ts` | 5 | "Benvenuto, {username}", email, ruoli, programmi, messaggio lista vuota |
| `forgot-password.component.spec.ts` | 8 | area da route data, form presente, loginPath area 1/2, validazione form invalido, chiamata corretta, sent() dopo successo, sent() dopo errore (anti-enumeration) |
| `reset-password.component.spec.ts` | 9 | token vuoto→errore, token presente→form, loginPath area 1/2, validazione invalido, chiamata corretta, done() dopo successo, errorMessage dopo errore, mismatch non chiama servizio |
| `change-password.component.spec.ts` | 6 | form presente, form invalido, mismatch, chiamata corretta, success state, error message |

---

## Stato Test API E2E — WebApplicationFactory (.NET) — 2026-04-02

**38/38 test passati** — WebApplicationFactory + EF InMemory — progetto in `Api_E2E/`

| File | Test | Cosa verifica |
|------|------|---------------|
| `AuthE2ETests.cs` | 8 | Login (valido/password errata/email vuota), Refresh (valido/non valido), Logout, GetMe (autenticato/non autenticato) |
| `PasswordResetE2ETests.cs` | 8 | ForgotPassword (200/anti-enum/400/crea token DB), ResetPassword (204+nuova pwd/token invalido/token già usato/pwd corta) |
| `AccountE2ETests.cs` | 5 | ChangePassword (204/400 pwd errata/401 no-auth/400 pwd corta/vecchia pwd non funziona) |
| `UsersE2ETests.cs` | 6 | GetAll (paginato/non autenticato), Create (valido/email duplicata), GetById, Update |
| `ProgramsE2ETests.cs` | 5 | GetAll, Create (valido/duplicato/lowercase), Assign+Revoke ciclo completo |
| `AuditLogsE2ETests.cs` | 3 | GetLogs (paginazione, filtro action, non autenticato) |

---

## Stato Test API E2E — Playwright (.NET) — 2026-04-02

**36/36 test passati** — Microsoft.Playwright + Kestrel reale + EF InMemory — progetto in `Api_Playwright/`

Usa il **dual-host pattern**: WebApplicationFactory per DI/seed + Kestrel su porta casuale per connessioni HTTP reali di Playwright.

| File | Test | Cosa verifica |
|------|------|---------------|
| `AuthPlaywrightTests.cs` | 7 | Login (200+Content-Type, 401, 400+ProblemDetails), Refresh (nuovi token diversi), Logout→refresh revocato 401, GetMe (auth/no-auth) |
| `PasswordResetPlaywrightTests.cs` | 8 | ForgotPassword (200/anti-enum/400/crea token DB), ResetPassword (204+nuova pwd/token invalido/token già usato/pwd corta) |
| `ChangePasswordPlaywrightTests.cs` | 4 | ChangePassword (204+Content-Type, 400+ProblemDetails, 401 no-auth, 400 pwd corta) |
| `UsersPlaywrightTests.cs` | 7 | GetAll (paginazione/no-auth), Create (201+Location/duplicato 409), GetById (200/404), Update 200 |
| `ProgramsPlaywrightTests.cs` | 6 | GetAll array, Create (201/duplicato 409/lowercase 400), Assign+Revoke ciclo, Delete 204 |
| `AuditLogsPlaywrightTests.cs` | 5 | Paginazione, login genera log, filtro action, pageSize rispettato, no-auth 401 |

---

## Stato Test Mobile E2E (integration_test) — 2026-04-02

**6/6 test** — integration_test + MockClient + FakeSecureStorage — cartella `integration_test/`

| File | Test | Cosa verifica |
|------|------|---------------|
| `app_test.dart` | 6 | Login Admin→AdminHome, Login App→Home, Logout Admin→LoginScreen, Nav Utenti, Nav Programmi, Nav CambiaPwd |

Esecuzione: `flutter test integration_test/app_test.dart` (richiede emulatore/device).

---

## Stato Test Mobile (Flutter) — 2026-04-02

**102/102 test passati** — flutter_test + mockito

| File | Test | Cosa verifica |
|------|------|---------------|
| `auth_service_test.dart` | 13 | login (salva token, popola currentUser, lancia eccezione su 401), logout, init (con/senza token), **refresh** (successo/401/errore rete/no token), **authenticatedGet** (200 diretto, 401+refresh+retry, 401+logout) |
| `login_screen_test.dart` | 10 | titoli per area (Backoffice area=1, MesClaude area=2), validazione email vuota/formato/password vuota, submit fallito (errore inline), submit ok (parametri corretti, navigazione /home o /admin), loading state (bottone disabilitato), toggle visibilità password, inizializzazione campi |
| `admin_home_screen_test.dart` | 4 | Username e ruolo visibili, tre card di navigazione presenti, tap su card naviga correttamente, pulsante Esci chiama logout |
| `admin_users_screen_test.dart` | 5 | CircularProgressIndicator durante caricamento, lista utenti con email/username, badge Attivo/Inattivo, messaggio di errore, lista vuota |
| `admin_programs_screen_test.dart` | 4 | Lista programmi con codice/nome, badge Attivo/Inattivo, messaggio di errore, lista vuota |
| `admin_audit_logs_screen_test.dart` | 4 | Lista log con azione/utente, entità e id nel log, messaggio di errore, lista vuota |
| `preferences_service_test.dart` | 9 | init (default, dark, light, lastArea), setThemeMode (aggiorna, notifica, persiste), setLastArea (memoria, SharedPreferences) |
| `forgot_password_screen_test.dart` | 7 | campo email+bottone, validazione email vuota/formato, chiamata con email+area, successo→"Email inviata", errore→successo (anti-enum), titolo schermata, AppBar presente |
| `reset_password_screen_test.dart` | 11 | token vuoto→widget errore, nessun form senza token, due campi con token, validazione vuota/corta/mismatch, submit corretto, successo→"Password aggiornata", errore→messaggio inline, loading state |
| `programs_screen_test.dart` | 6 | titolo "I miei programmi", lista vuota→messaggio+icona, card per ogni programma, icone apps+check_circle, back button→/home |
| `change_password_screen_test.dart` | 10 | titolo, tre campi, validazione vuota/corta/mismatch, submit corretto, success state, errore inline, loading state, back App→/home, back Admin→/admin |
| `error_notifier_test.dart` | 7 | init null, NetworkException (messaggio+notifica), ServerException, fallback generico, clear azzeramento, clear su null non notifica, successive sovrascrivono |
| `app_http_client_test.dart` | 5 | forwarding normale, SocketException→NetworkException, TimeoutException→NetworkException, eccezioni non-rete non intercettate, 401 passata invariata |
| `app_environment_test.dart` | 7 | apiBaseUrl non vuota, inizia con http/https, isProduction false in test, name development, tutti gli endpoint da baseUrl, path auth, path account |

---

## Stato Test Web E2E (Playwright) — 2026-04-02

**44/44 test passati** — @playwright/test + Chromium — cartella `web/e2e/`

| File | Test | Cosa verifica |
|------|------|---------------|
| `auth.spec.ts` | 8 | Redirect /, form login, validazione email/password vuote, login fallito (401 → messaggio inline), login ok (redirect /admin/), logout (sidenav → Esci → /admin/login) |
| `admin-users.spec.ts` | 5 | Tabella utenti con colonne Email/Username/Stato, paginazione con totalCount, ricerca (query param search=), dialog creazione con campi obbligatori, disattiva utente (DELETE) |
| `admin-programs.spec.ts` | 4 | Tabella programmi con colonne Codice/Nome/Stato, dialog creazione (uppercase codice), toggle "Solo attivi" (query param activeOnly=true), elimina programma (DELETE) |
| `admin-audit-logs.spec.ts` | 3 | Tabella log con colonne Azione/Entità/Timestamp, filtro azione (query param action=), paginazione (navigazione pagina successiva) |
| `forgot-password.spec.ts` | 6 | Form con campo email, titolo, validazione email vuota/formato, invio riuscito (anti-enumeration), link "Torna al login" area corretta |
| `reset-password.spec.ts` | 5 | Senza token → errore, con token → form, password troppo corta, invio riuscito → success, token scaduto (400) → errore inline |
| `change-password.spec.ts` | 5 | Sidenav "Cambia password" apre dialog, tre campi + bottone Salva, validazione vuoti, cambio riuscito (204), password errata (400) |
| `app-dashboard.spec.ts` | 8 | Login area App (titolo/redirect), dashboard (benvenuto/email/ruolo/programmi), sidenav (username/PROG_A), logout → /app/login, dialog cambio password |
