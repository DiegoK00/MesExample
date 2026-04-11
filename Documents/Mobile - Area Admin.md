# Mobile — Area Admin

## Obiettivo

Aggiungere il supporto per gli utenti con `loginArea = 1` (amministratori) nell'app mobile, con schermate dedicate per la gestione di utenti, programmi e audit log.

---

## Architettura

### Routing

Due aree distinte, ognuna con la propria pagina di login:

| Route | Area | Descrizione |
|-------|------|-------------|
| `/login` | App (area=2) | Login utenti finali |
| `/admin-login` | Admin (area=1) | Login amministratori |
| `/home` | App | Home utente app |
| `/admin` | Admin | Dashboard admin |
| `/admin/users` | Admin | Lista utenti |
| `/admin/programs` | Admin | Lista programmi |
| `/admin/audit-logs` | Admin | Audit log |

La logica di redirect in `GoRouter` gestisce:
- Utenti non autenticati → reindirizzati alla login appropriata
- Utenti autenticati → reindirizzati alla home dell'area corretta
- Prevenzione cross-area (area=2 non può accedere a `/admin/*` e viceversa)

### Nuovi servizi dati

Ogni servizio riceve `AuthService` nel costruttore e usa `authenticatedGet()` per le chiamate, ereditando automaticamente il retry su 401.

| Servizio | File | Metodi |
|---------|------|--------|
| `UsersService` | `lib/core/services/users_service.dart` | `getAll({page, pageSize, search})` |
| `ProgramsService` | `lib/core/services/programs_service.dart` | `getAll({activeOnly})` |
| `AuditLogsService` | `lib/core/services/audit_logs_service.dart` | `getLogs({page, pageSize, action, entityName})` |

### Provider

I servizi sono esposti globalmente via `MultiProvider` in `main.dart`:
```dart
Provider.value(value: _usersService),
Provider.value(value: _programsService),
Provider.value(value: _auditLogsService),
```

---

## Schermate

### `AdminHomeScreen`

Dashboard con:
- Benvenuto + ruolo dell'utente corrente
- Tre card di navigazione: Utenti, Programmi, Audit Log
- Pulsante logout nell'AppBar

### `AdminUsersScreen`

- Lista paginata utenti con `UsersService.getAll()`
- Per ogni utente: avatar iniziale, username, email, ruoli, badge Attivo/Inattivo
- Pull-to-refresh
- Stato di errore con icona e messaggio

### `AdminProgramsScreen`

- Lista programmi con `ProgramsService.getAll()`
- Per ogni programma: codice, nome, descrizione, badge Attivo/Inattivo
- Switch "Solo attivi" nell'AppBar per filtrare
- Pull-to-refresh

### `AdminAuditLogsScreen`

- Lista audit log recenti con `AuditLogsService.getLogs()`
- Per ogni log: icona colorata per tipo azione, azione, utente, entità, timestamp, IP
- Pull-to-refresh

---

## Modelli dati

| File | Modelli |
|------|---------|
| `lib/core/models/user_models.dart` | `UserResponse`, `UsersPageResponse` |
| `lib/core/models/program_models.dart` | `ProgramResponse` |
| `lib/core/models/audit_log_models.dart` | `AuditLogEntry`, `AuditLogsPageResponse` |

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `test/admin_home_screen_test.dart` | 4 | Username/ruolo visibili, tre card presenti, navigazione, logout |
| `test/admin_users_screen_test.dart` | 5 | Loading, lista utenti, badge stato, errore, lista vuota |
| `test/admin_programs_screen_test.dart` | 4 | Lista programmi, badge stato, errore, lista vuota |
| `test/admin_audit_logs_screen_test.dart` | 4 | Lista log, entità/id, errore, lista vuota |

---

## File coinvolti

- `lib/main.dart` — routing esteso, MultiProvider con servizi dati
- `lib/features/auth/login/login_screen.dart` — navigazione post-login basata su area
- `lib/features/admin/admin_home_screen.dart` — nuovo
- `lib/features/admin/users/admin_users_screen.dart` — nuovo
- `lib/features/admin/programs/admin_programs_screen.dart` — nuovo
- `lib/features/admin/audit_logs/admin_audit_logs_screen.dart` — nuovo
- `lib/core/constants/api_constants.dart` — aggiunti endpoint users/programs/audit-logs
