# Web — Area Admin (Backoffice)

## Routing (`features/admin/admin.routes.ts`)

Tutte le route sotto `/admin/` (escluso `/admin/login`) sono protette da `adminGuard`.

```
/admin/login        → LoginComponent (area=1)
/admin/             → redirect /admin/users
/admin/users        → UsersComponent
/admin/programs     → ProgramsComponent
/admin/audit-logs   → AuditLogsComponent
```

---

## AdminLayoutComponent (`features/admin/layout/`)

Struttura a **sidenav** Angular Material:
- **Toolbar** fissa: icona + titolo "Backoffice", nome utente, pulsante `aria-label="Menu"` per aprire il sidenav
- **Sidenav** a destra (mode `over`): nav items (Utenti, Programmi, Audit Log) + link Esci (`role="link"`)
- Contiene `<router-outlet />` per i componenti figli

---

## UsersComponent (`features/admin/users/`)

`mat-table` paginata con colonne: `#`, Email, Username, Area, Ruoli, **Stato**, Azioni.

**Funzionalità:**
- Ricerca per email/username (campo + pulsante Cerca, query param `search=`)
- Paginazione lato server (`mat-paginator` → `page`, `pageSize`)
- **Disattiva** utente: `DELETE /users/{id}` + conferma `window.confirm`
- **Crea / Modifica**: `MatDialog` → `UserDialogComponent`

**UserDialogComponent:**
- Campi: Email, Username, Password (solo in crea), Area (`mat-select`), Ruoli (checkbox multipli)
- Ruoli hardcoded: `SuperAdmin`, `Admin`, `User` (nessun endpoint `/roles`)
- Crea → `POST /users`, Modifica → `PUT /users/{id}`

**UserProgramsDialogComponent:**
- Aperto dal pulsante "apps" nella colonna Azioni di UsersComponent
- Layout a due colonne: **Assegnati** (con pulsante Revoca) | **Disponibili** (con pulsante Assegna)
- Carica dati in parallelo via `forkJoin`: `GET /users/{id}/programs` + `GET /programs`
- `available()` filtra: programmi attivi non ancora assegnati all'utente
- Assegna → `POST /users/{id}/programs` (ritorna lista aggiornata)
- Revoca → `DELETE /users/{id}/programs` (aggiornamento ottimistico della lista locale)

---

## ProgramsComponent (`features/admin/programs/`)

Tabella con colonne: Codice, Nome, Descrizione, **Stato**, Azioni.

**Funzionalità:**
- Toggle **"Solo attivi"** (`mat-slide-toggle`) → filtra con query param `activeOnly=true`
- **Elimina**: `DELETE /programs/{id}` + conferma
- **Crea / Modifica**: `MatDialog` → `ProgramDialogComponent`

**ProgramDialogComponent:**
- Campi: Codice (forzato in **uppercase** via evento `input`), Nome, Descrizione, Stato (solo in modifica)
- Il campo Codice è **readonly** in modalità modifica
- Crea → `POST /programs`, Modifica → `PUT /programs/{id}`

---

## AuditLogsComponent (`features/admin/audit-logs/`)

Tabella con colonne: Timestamp, Utente, **Azione**, **Entità**, IP, Dettagli.

**Funzionalità:**
- Filtro per **Azione** (`mat-select` con lista azioni predefinite)
- Filtro per **Entità** (`mat-select`: User, Program, UserProgram)
- Paginazione lato server
- Reset filtri

---

## Servizi (`core/services/`)

| Servizio | Endpoint | Note |
|---------|---------|------|
| `UsersService` | `GET/POST /users`, `GET/PUT/DELETE /users/{id}` | Paginazione + ricerca |
| `ProgramsService` | `GET/POST /programs`, `PUT/DELETE /programs/{id}` | Filtro `activeOnly` |
| `AuditLogsService` | `GET /audit-logs` | Filtri: action, entityName, userId, from/to |

---

## Modelli

| File | Tipi |
|------|------|
| `core/models/user.models.ts` | `UserResponse`, `UsersPageResponse`, `CreateUserRequest`, `UpdateUserRequest` |
| `core/models/program.models.ts` | `ProgramResponse`, `CreateProgramRequest`, `UpdateProgramRequest` |
| `core/models/audit-log.models.ts` | `AuditLogResponse`, `AuditLogsPageResponse` |

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `users.service.spec.ts` | 10 | getAll (paginazione, search), getById, create, update, deactivate, getUserPrograms, assignPrograms, revokePrograms |
| `programs.service.spec.ts` | 7 | getAll (activeOnly), getById, create, update, delete |
| `audit-logs.service.spec.ts` | 5 | getLogs con filtri (action, entityName, userId, from/to, paginazione) |
| `account.service.spec.ts` | 2 | getMe, changePassword |
| `admin-layout.component.spec.ts` | 5 | titolo Backoffice, username in toolbar, aria-label Menu, logout(), 3 nav items |
| `users.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, search(), deactivate() con/senza conferma, openCreateDialog() |
| `user-dialog.component.spec.ts` | 9 | crea: titolo, campo password, area login, form invalido, create(); modifica: titolo, no password, pre-popola email, update() |
| `user-programs-dialog.component.spec.ts` | 6 | caricamento init, available() esclude assegnati e inattivi, titolo con username, assign() → lista aggiornata, revoke() → rimosso, errore di caricamento |
| `programs.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, activeOnly, delete() con/senza conferma, openCreateDialog() |
| `program-dialog.component.spec.ts` | 9 | crea: titolo, campo codice, uppercaseCode(), form invalido, create(); modifica: titolo, readonly, pre-popola nome, update() |
| `audit-logs.component.spec.ts` | 7 | colonne tabella, dati mock, ngOnInit, filtro action, clearFilters(), getActionColor() warn, getActionColor() primary |
