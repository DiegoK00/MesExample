# API - Gestione Programmi

## CRUD Programmi

| Metodo | Route | Descrizione | Ruoli richiesti |
|--------|-------|-------------|-----------------|
| GET | `/programs` | Lista tutti i programmi | Qualsiasi autenticato |
| GET | `/programs/{id}` | Dettaglio programma | Qualsiasi autenticato |
| POST | `/programs` | Crea nuovo programma | SuperAdmin, Admin |
| PUT | `/programs/{id}` | Aggiorna programma | SuperAdmin, Admin |
| DELETE | `/programs/{id}` | Elimina programma | SuperAdmin |

---

## Assegnazione Programmi agli Utenti

| Metodo | Route | Descrizione | Ruoli richiesti |
|--------|-------|-------------|-----------------|
| GET | `/users/{userId}/programs` | Lista programmi assegnati a un utente | SuperAdmin, Admin |
| POST | `/users/{userId}/programs` | Assegna programmi a un utente | SuperAdmin, Admin |
| DELETE | `/users/{userId}/programs` | Revoca programmi a un utente | SuperAdmin, Admin |

---

## GET /programs

**Query params:**

| Param | Default | Note |
|-------|---------|------|
| `activeOnly` | — | Se `true`, restituisce solo i programmi attivi |

---

## POST /programs — Body

```json
{
  "code": "GESTIONE_ORDINI",
  "name": "Gestione Ordini",
  "description": "Modulo per la gestione degli ordini clienti"
}
```

- `code`: solo lettere maiuscole, numeri e underscore (`[A-Z0-9_]+`) — il client deve inviare il codice già in uppercase
- **409 Conflict** se il codice è già in uso

**Risposta 201** con `Location: /programs/{id}`.

---

## PUT /programs/{id} — Body

```json
{
  "name": "Nuovo nome",
  "description": "Nuova descrizione",
  "isActive": false
}
```

> Il `code` non è modificabile dopo la creazione.

---

## DELETE /programs/{id}

Elimina fisicamente il programma dal database.
**Vincolo:** fallisce con `400` se il programma è assegnato a uno o più utenti. Rimuovere prima le assegnazioni.

---

## POST /users/{userId}/programs — Body

```json
{
  "programIds": [1, 2, 3]
}
```

- Assegna i programmi specificati all'utente
- I programmi già assegnati vengono ignorati (no errore, no duplicati)
- I programmi non attivi o inesistenti restituiscono `400`
- Registra `GrantedAt` (timestamp) e `GrantedByUserId` (utente che ha concesso l'accesso)

**Risposta 200:** lista aggiornata dei programmi dell'utente (`UserProgramResponse[]`).

---

## DELETE /users/{userId}/programs — Body

```json
{
  "programIds": [2]
}
```

Revoca i programmi specificati. I programmi non assegnati vengono ignorati silenziosamente.

---

## UserProgramResponse

```json
{
  "programId": 1,
  "code": "GESTIONE_ORDINI",
  "name": "Gestione Ordini",
  "grantedAt": "2026-03-29T15:00:00Z",
  "grantedByUsername": "admin"
}
```

---

## Note

- La DELETE del programma è **fisica** (non soft delete) per mantenere il catalogo pulito
- L'assegnazione traccia chi ha concesso il permesso (`GrantedByUserId` dal JWT corrente)
- Un programma disattivato (`IsActive = false`) non può essere assegnato a nuovi utenti ma le assegnazioni esistenti rimangono valide
