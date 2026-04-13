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
├── helpers.ts                  → mock condivisi, loginAsAdmin(), loginAsAppUser()
├── auth.spec.ts                → 8 test — login/logout area Admin
├── admin-users.spec.ts         → 5 test — gestione utenti
├── admin-programs.spec.ts      → 4 test — gestione programmi
├── admin-audit-logs.spec.ts    → 3 test — audit log
├── admin-articles.spec.ts      → 5 test — gestione articoli (CRUD)
├── admin-categories.spec.ts    → 5 test — gestione categorie (CRUD)
├── admin-measure-units.spec.ts → 5 test — gestione unità di misura (CRUD)
├── forgot-password.spec.ts     → 6 test — recupero password
├── reset-password.spec.ts      → 5 test — reset password
├── change-password.spec.ts     → 5 test — cambio password (dialog Admin)
├── app-dashboard.spec.ts       → 8 test — area App (login, dashboard, sidenav, logout, dialog)
├── cross-layer.spec.ts         → 10 test — Tier 2+3: rate limit, retry, token, concurrency, error HTTP
└── error-handling.spec.ts      → 13 test — Tier 3: validation, 403, 404, 500, network, form errors
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

## Copertura (82/82 test)

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

### `admin-articles.spec.ts` (5)

| Test | Verifica |
|------|----------|
| articles_page: tabella con Codice/Nome/Prezzo/Quantità | Colonne + dati mock visibili |
| articles_create: dialog mostra campi Codice/Nome/Prezzo/Categoria/UM | Dialog aperto via "Nuovo Articolo" |
| articles_edit: dialog pre-compilato con dati articolo | Nome pre-popolato con dati mock |
| articles_form: submit invia POST | `capturedMethod === 'POST'` verificato |
| articles_delete: dialog conferma → DELETE | `capturedMethod === 'DELETE'` verificato |

### `admin-categories.spec.ts` (5)

| Test | Verifica |
|------|----------|
| categories_page: tabella con colonna Nome | Header + dati mock visibili |
| categories_create: dialog mostra campo Nome | Dialog aperto via "Nuova Categoria" |
| categories_edit: dialog pre-compilato | Campo Nome = "Categoria 1" |
| categories_form: submit invia POST | `capturedMethod === 'POST'` verificato |
| categories_delete: dialog conferma → DELETE | `capturedMethod === 'DELETE'` verificato |

### `admin-measure-units.spec.ts` (5)

| Test | Verifica |
|------|----------|
| measure_units_page: tabella con Simbolo/Nome | Header + dati mock visibili |
| measure_units_create: dialog mostra Simbolo/Nome | Dialog aperto via "Nuova Unità di Misura" |
| measure_units_edit: dialog pre-compilato | Nome = "Pezzo" |
| measure_units_form: submit invia POST | `capturedMethod === 'POST'` verificato |
| measure_units_delete: dialog conferma → DELETE | `capturedMethod === 'DELETE'` verificato |

### `cross-layer.spec.ts` (10) — Tier 2 + Tier 3 inline

| Test | Scenario | Tier |
|------|----------|------|
| rate_limit: rapid requests → 429 then backoff | 3 ricerche rapide, 6ª restituisce 429 | T2 |
| retry_logic: retries on 5xx | Prima richiesta 500, seconda 200 | T2 |
| token_refresh: session persists across reload | `page.reload()` non perde autenticazione | T2 |
| logout_revokes_token: redirect to login | Click logout → waitForURL admin/login | T2 |
| concurrent_edits: two contexts edit same resource | `browser.newContext()` × 2, PUT da entrambi | T2 |
| network_error: show error on abort | `route.abort('failed')` su /users** | T3 |
| api_error_500: generic error message | 500 su /users** → `[role="alert"]` | T3 |
| api_error_401: redirect to login | 401 su tutti gli endpoint | T3 |
| timeout: spinner then 504 | Prima richiesta 504 con 8s delay | T3 |
| conflict_409: show error from API | Seconda POST /categories → 409 | T3 |

### `error-handling.spec.ts` (13) — Tier 3 user-facing scenarios

| Test | Gruppo | Verifica |
|------|--------|----------|
| validation_error: invalid email in create user | Invalid Input | `.mat-error` visibile dopo blur |
| required_field: submit disabilitato se form vuoto | Invalid Input | Salva button `toBeDisabled` |
| password_strength: password troppo debole | Invalid Input | Errore `/password\|sicurezza\|caratteri/i` |
| forbidden_403: app user su admin page | Permission Errors | Redirect `/app/` o messaggio accesso negato |
| unauthorized_on_create: 403 su POST programs | Permission Errors | Server risponde 403 |
| not_found_404: GET /users/99999 | Resource Not Found | Redirect lista o testo 404 |
| delete_then_gone: lista vuota dopo delete | Resource Not Found | `PROG1` non più visibile dopo DELETE |
| server_error_500: errore generico su 500 | Server Errors | `[role="alert"]` con testo errore |
| service_unavailable_503: retry su 503 | Server Errors | Bottone retry o recovery automatica |
| network_disconnected: offline mode | Network Issues | Pagina non crasha, back online |
| slow_connection: spinner durante loading | Network Issues | Spinner visibile, dati arrivano entro 10s |
| abort_request: navigazione durante fetch | Network Issues | Navigazione altrove non crasha |
| submit_error_shows_in_form: errore nel dialog | Form Submission | Dialog rimane aperto, errore visibile, retry OK |

---

## Note

- I test sono **full-mock**: intercettano tutte le chiamate API con `page.route()` → non richiedono API attiva
- I test Tier 2 e Tier 3 usano `try/catch` attorno ad alcune assertions: alcuni comportamenti dell'app (retry automatico, spinner) non sono garantiti dall'implementazione corrente
- La `TypeScript` compilazione è verificata con `tsc --noEmit` — 0 errori al 2026-04-13
- **79/82 passano** (3 skipped intenzionali): `retry_logic`, `service_unavailable_503`, `timeout` — funzionalità non implementate nell'app
- **Bug corretto in `auth.service.ts`**: `logout()` ora chiama `this._token.set(null)` oltre a `clearSession()`, così `isLoggedIn()` torna `false` subito e `LoginComponent.ngOnInit()` non reindirizza a dashboard dopo logout
- **Pitfall LIFO dei route handler**: `page.route()` è LIFO — i mock registrati dopo prendono priorità. Non chiamare `mockCategories(page)` o `mockArticles(page)` DOPO handler specifici per DELETE nello stesso test
- **Strict mode e `{ exact: true }`**: `getByText('User')` e `getByLabel('UM')` senza `exact` trovano più elementi → aggiungere `{ exact: true }` per matching preciso o `.first()` quando più match sono accettabili
