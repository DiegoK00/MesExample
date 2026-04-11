# Web — E2E Playwright

## Setup (`playwright.config.ts`)

```typescript
testDir: './e2e',
workers: 1,           // test sequenziali
retries: 0,
use: { baseURL: 'http://localhost:4200' },
webServer: {
  command: 'npx ng serve --port 4200',
  url: 'http://localhost:4200',
  reuseExistingServer: true,
  timeout: 120_000,
}
```

---

## Struttura (`web/e2e/`)

```
e2e/
├── helpers.ts                → mock condivisi, loginAsAdmin(), loginAsAppUser()
├── auth.spec.ts              → 8 test — login/logout area Admin
├── admin-users.spec.ts       → 5 test — gestione utenti
├── admin-programs.spec.ts    → 4 test — gestione programmi
├── admin-audit-logs.spec.ts  → 3 test — audit log
├── forgot-password.spec.ts   → 6 test — recupero password
├── reset-password.spec.ts    → 5 test — reset password
├── change-password.spec.ts   → 5 test — cambio password (dialog Admin)
└── app-dashboard.spec.ts     → 8 test — area App (login, dashboard, sidenav, logout, dialog)
```

---

## Helpers (`helpers.ts`)

Espone mock functions e la costante `API_BASE`:

```typescript
export const API_BASE = 'http://localhost:5260';

mockLoginSuccess(page)       // POST /auth/login → 200
mockLoginFailure(page)       // POST /auth/login → 401
mockAccountMe(page, user?)   // GET /account/me → 200 (default: admin)
mockLogout(page)             // POST /auth/logout → 204
mockUsers(page, data?)       // GET /users** → paginated list
mockPrograms(page, data?)    // GET /programs** → list
mockAuditLogs(page, data?)   // GET /audit-logs** → paginated list
mockForgotPassword(page)     // POST /auth/forgot-password → 200
mockResetPassword(page, ok?) // POST /auth/reset-password → 204 o 400
mockChangePassword(page, ok?) // PUT /account/password → 204 o 400

loginAsAdmin(page)           // login completo area admin via UI
loginAsAppUser(page)         // login completo area app via UI
```

### Pattern mock — regola critica

I pattern usano `API_BASE` per essere **specifici all'host dell'API**:

```typescript
// ✅ Corretto — intercetta solo le chiamate API
await page.route(`${API_BASE}/users**`, handler)

// ❌ Sbagliato — intercetta anche GET http://localhost:4200/admin/users
//    causando la restituzione di JSON al posto dell'index.html Angular
await page.route('**/users**', handler)
```

---

## Copertura (44/44 test)

### `auth.spec.ts` (8)

| Test | Verifica |
|------|----------|
| redirect: / → /admin/login | Route di default |
| login_page: form visibile | Campi email, password, pulsante Accedi |
| login_page: titolo Backoffice | Testo "Accesso Backoffice" |
| validazione: email vuota | Errore "Email obbligatoria" |
| validazione: password vuota | Errore "Password obbligatoria" |
| login_fallito: 401 | Messaggio inline "Credenziali non valide. Riprova." |
| login_ok: redirect /admin/ | URL contiene /admin/ dopo login |
| logout: sidenav → Esci | Torna a /admin/login |

### `admin-users.spec.ts` (5)

| Test | Verifica |
|------|----------|
| Tabella con colonne Email/Username/Stato | Header e dati mock visibili |
| Paginazione con totalCount | `mat-paginator` visibile con conteggio |
| Ricerca filtra la lista | Query param `search=admin` nella chiamata API |
| Dialog creazione mostra campi obbligatori | Email, Username, Password nel dialog |
| Disattiva chiama DELETE | `DELETE /users/{id}` invocato |

### `admin-programs.spec.ts` (4)

| Test | Verifica |
|------|----------|
| Tabella con colonne Codice/Nome/Stato | Header e dati mock visibili |
| Dialog crea — codice in uppercase | Input `test_code` → valore `TEST_CODE` |
| Toggle "Solo attivi" filtra | Query param `activeOnly=true` nella chiamata API |
| Elimina chiama DELETE | `DELETE /programs/{id}` invocato |

### `admin-audit-logs.spec.ts` (3)

| Test | Verifica |
|------|----------|
| Tabella con colonne Azione/Entità/Timestamp | Header e dati mock visibili |
| Filtro azione aggiorna la tabella | Query param `action=user.login` nella chiamata API |
| Paginazione — pagina successiva | Seconda richiesta API dopo click "Next page" |

### `forgot-password.spec.ts` (6)

| Test | Verifica |
|------|----------|
| Form con campo email e bottone "Invia istruzioni" | Elementi presenti sulla pagina |
| Titolo "Password dimenticata" visibile | Testo nel mat-card-title |
| Email vuota → errore "Email obbligatoria" | Validazione Angular Material |
| Email non valida → errore "Email non valida" | Validazione formato email |
| Invio riuscito → messaggio anti-enumeration | "Se l'indirizzo è registrato..." + link torna al login |
| Link "Torna al login" punta a /admin/login | href corretto per area admin |

### `reset-password.spec.ts` (5)

| Test | Verifica |
|------|----------|
| Senza token → "Token non valido o mancante" | Stato errore con link "Richiedi nuovo link" |
| Con token → form con campi password | "Nuova password", "Conferma password", bottone visibili |
| Password troppo corta → "Minimo 8 caratteri" | Validazione minlength |
| Invio riuscito → "Password aggiornata con successo" | Stato success con link "Vai al login" |
| Token scaduto (400) → errore inline | Messaggio "Token non valido o scaduto" |

### `change-password.spec.ts` (5)

| Test | Verifica |
|------|----------|
| Click "Cambia password" nel sidenav → apre dialog | `mat-dialog-container` visibile |
| Dialog ha i tre campi e bottone "Salva" | "Password attuale", "Nuova password", "Conferma nuova password" |
| Campi vuoti → errori di validazione | "Password attuale obbligatoria", "Nuova password obbligatoria" |
| Cambio riuscito (204) → "Password aggiornata con successo." | Stato success + bottone "Chiudi" |
| Password errata (400) → "Password attuale non corretta." | Messaggio di errore inline |

### `app-dashboard.spec.ts` (8)

| Test | Verifica |
|------|----------|
| app_login: titolo "MesClaude" | Testo e form presenti su /app/login |
| app_login_ok: redirect a /app/ | URL contiene /app/ dopo login area 2 |
| app_dashboard: benvenuto con username | "Benvenuto, user" visibile |
| app_dashboard: email e ruolo | `user@test.com` e `User` nel body |
| app_dashboard: programmi assegnati | `PROG_A` visibile come chip |
| app_sidenav: username e programmi | sidenav mostra username e PROG_A |
| app_logout: Esci → /app/login | URL torna a /app/login |
| app_change_password: dialog dal sidenav | `mat-dialog-container` con "Password attuale" visibile |
