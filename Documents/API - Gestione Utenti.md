# API - Gestione Utenti

## Endpoint

| Metodo | Route | Descrizione | Ruoli richiesti |
|--------|-------|-------------|-----------------|
| GET | `/users` | Lista utenti (paginata, ricercabile) | SuperAdmin, Admin |
| GET | `/users/{id}` | Dettaglio utente | SuperAdmin, Admin |
| POST | `/users` | Crea nuovo utente | SuperAdmin, Admin |
| PUT | `/users/{id}` | Aggiorna utente | SuperAdmin, Admin |
| DELETE | `/users/{id}` | Disattiva utente (soft delete) | SuperAdmin |

Tutti gli endpoint richiedono autenticazione JWT (`[Authorize]`).

---

## GET /users

**Query params:**

| Param | Default | Note |
|-------|---------|------|
| `page` | 1 | Pagina corrente |
| `pageSize` | 20 | Max 100 |
| `search` | — | Filtra per email o username (contains) |

**Risposta 200:**
```json
{
  "items": [ { ...UserResponse } ],
  "totalCount": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

## POST /users — Body

```json
{
  "email": "user@example.com",
  "username": "mario",
  "password": "Pass@1234",
  "loginArea": 1,
  "roleIds": [3]
}
```

**Risposta 201** con `Location: /users/{id}` e body `UserResponse`.
**409 Conflict** se email o username già in uso per quella area.

---

## PUT /users/{id} — Body

```json
{
  "email": "nuovo@example.com",
  "username": "nuovo_username",
  "isActive": true,
  "roleIds": [2, 3]
}
```

---

## UserResponse

```json
{
  "id": 1,
  "email": "admin@test.com",
  "username": "admin",
  "loginArea": 1,
  "isActive": true,
  "createdAt": "2026-03-29T00:00:00Z",
  "lastLoginAt": "2026-03-29T15:04:00Z",
  "roles": ["SuperAdmin"]
}
```

---

## Soft Delete

`DELETE /users/{id}` imposta `IsActive = false` — l'utente non viene eliminato dal database. Le sue sessioni rimangono nel DB ma non può più autenticarsi (il `LoginAsync` verifica `IsActive`).

---

## Validazione

- Email: formato valido, max 256 caratteri
- Username: 3–100 caratteri, solo `[a-zA-Z0-9_.-]`
- Password (solo create): min 8, max 128 caratteri
