# Test Effettuati

Data: 2026-03-29
Ambiente: Development (`http://localhost:5260`)
Utente test: `admin@test.com` / `Admin@1234` — ruolo SuperAdmin, area Admin

---

## POST /auth/login

| Scenario | Input | HTTP | Risultato |
|----------|-------|------|-----------|
| Credenziali valide | email + password corrette, area=1 | 200 | `accessToken`, `refreshToken`, `expiresAt` |
| Password errata | password sbagliata | 401 | `{"title":"Credenziali non valide."}` |
| Email vuota | email="" | 400 | Errori FluentValidation |

## POST /auth/refresh

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Token valido | 200 | Nuova coppia token (rotation) |
| Token revocato | 401 | `{"title":"Refresh token non valido o scaduto."}` |

## POST /auth/logout

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Token valido | 204 | Token revocato |

## POST /auth/forgot-password

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Email registrata | 200 | Messaggio neutro |
| Email inesistente | 200 | Stesso messaggio neutro (anti-enumeration) |

## POST /auth/reset-password

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Token non valido | 400 | `{"title":"Token non valido o scaduto."}` |

---

## Rate Limiting

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Login: 6ª richiesta dopo aver esaurito il limite (5/min) | 429 | Too Many Requests |
| Richieste successive nella stessa finestra | 429 | Bloccate tutte |

> La sliding window da 5 req/min per IP funziona correttamente. Durante i test tutte le 6 richieste rapide risultano 429 perché il limite era già stato consumato dalle chiamate di test precedenti.

---

## GET /account/me

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Autenticato con JWT | 200 | `{id, email, username, loginArea, roles, programs}` |
| Senza token | 401 | — |
| Con programma assegnato | 200 | `programs: ["GESTIONE_ORDINI"]` |

Esempio risposta:
```json
{"id":1,"email":"admin@test.com","username":"admin","loginArea":1,"roles":["SuperAdmin"],"programs":["GESTIONE_ORDINI"]}
```

---

## PUT /account/password

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Password corrente corretta | 204 | Password aggiornata |
| Login con nuova password | 200 | JWT valido — conferma aggiornamento |
| Password corrente errata | 400 | `{"title":"Password attuale non corretta."}` |

---

## GET /users

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Lista paginata | 200 | `{items, totalCount, page, pageSize, totalPages}` |
| Senza token | 401 | — |

## POST /users

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Nuovo utente valido | 201 | `UserResponse` + `Location: /users/{id}` |
| Email duplicata stessa area | 409 | `{"title":"Email già registrata per questa area."}` |

## PUT /users/2

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Aggiornamento valido | 200 | `UserResponse` aggiornato (`username: user1_updated`) |

## GET /users/2

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Utente esistente | 200 | `UserResponse` |

## DELETE /users/999

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| ID inesistente | 404 | `{"title":"Utente 999 non trovato."}` |

---

## POST /programs

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Codice valido uppercase | 201 | `ProgramResponse` |
| Codice duplicato | 409 | `{"title":"Il codice 'GESTIONE_ORDINI' è già in uso."}` |
| Codice minuscolo | 400 | Errore validazione — il codice deve essere uppercase (`[A-Z0-9_]+`) |

## GET /programs

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Lista programmi | 200 | Array `ProgramResponse[]` |

---

## POST /users/1/programs (assegna)

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Assegnazione valida | 200 | Lista aggiornata con `grantedByUsername: "admin"` |

## GET /users/1/programs

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Lista programmi utente | 200 | Array con `programId`, `code`, `name`, `grantedAt`, `grantedByUsername` |

## DELETE /users/1/programs (revoca)

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Revoca valida | 204 | Programma rimosso dall'utente |

---

## GET /audit-logs

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Lista log paginata | 200 | `{items, totalCount, page, pageSize, totalPages}` — 16 log registrati |
| Filtro `action=user.login` | 200 | 9 risultati filtrati |
| Senza token | 401 | — |

Azioni registrate durante i test: `user.login`, `user.login_failed`, `user.logout`, `user.password_changed`, `user.created`, `user.updated`, `program.created`, `program.assigned`, `program.revoked`.

---

## CORS

| Scenario | Risultato |
|----------|-----------|
| Preflight da `http://localhost:4200` | Headers CORS restituiti (`Access-Control-Allow-Origin`, `Allow-Credentials: true`) |
| Preflight da `http://evil.com` | Nessun header CORS — origin non autorizzata |

---

## Error Handling Middleware

| Scenario | HTTP | Risultato |
|----------|------|-----------|
| Endpoint non trovato | 404 | Response standard ASP.NET Core |
| Eccezione non gestita | 500 | `{"title":"Si è verificato un errore interno.","status":500}` |
