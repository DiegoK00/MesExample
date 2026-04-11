# API - Account e AuditLog

---

## Cambio Password (utente loggato)

| Metodo | Route | Descrizione | Auth |
|--------|-------|-------------|------|
| PUT | `/account/password` | Cambia la password dell'utente corrente | JWT richiesto |

### Body

```json
{
  "currentPassword": "Admin@1234",
  "newPassword": "NuovaPass@99"
}
```

### Risposte

| HTTP | Caso |
|------|------|
| 204 | Password aggiornata con successo |
| 400 | Password attuale non corretta |
| 400 | Validazione fallita (nuova password uguale all'attuale, lunghezza, ecc.) |

### Validazione

- `currentPassword`: obbligatoria
- `newPassword`: obbligatoria, min 8, max 128, diversa dalla corrente

> Il cambio password **non** revoca le sessioni attive (solo il reset via email lo fa).

---

## AuditLog

| Metodo | Route | Descrizione | Ruoli richiesti |
|--------|-------|-------------|-----------------|
| GET | `/audit-logs` | Lista log paginata e filtrabile | SuperAdmin, Admin |

### Query params

| Param | Tipo | Descrizione |
|-------|------|-------------|
| `page` | int | Default 1 |
| `pageSize` | int | Default 50, max 200 |
| `userId` | int? | Filtra per utente |
| `action` | string? | Filtra per azione (contains) |
| `entityName` | string? | Filtra per entità (`User`, `Program`, `UserProgram`) |
| `from` | DateTime? | Data inizio (UTC) |
| `to` | DateTime? | Data fine (UTC) |

### AuditLogResponse

```json
{
  "id": 1,
  "userId": 1,
  "username": "admin",
  "action": "user.login",
  "entityName": "User",
  "entityId": "1",
  "oldValues": null,
  "newValues": null,
  "ipAddress": "::1",
  "timestamp": "2026-03-29T15:04:00Z"
}
```

---

## Azioni loggate

| Action | Quando |
|--------|--------|
| `user.login` | Login riuscito |
| `user.login_failed` | Login fallito (utente non trovato o password errata) |
| `user.logout` | Logout |
| `user.password_reset` | Reset password via email completato |
| `user.password_changed` | Cambio password da account loggato |
| `user.created` | Creazione utente |
| `user.updated` | Aggiornamento utente |
| `user.deactivated` | Disattivazione utente |
| `program.created` | Creazione programma |
| `program.updated` | Aggiornamento programma |
| `program.deleted` | Eliminazione programma |
| `program.assigned` | Assegnazione programmi a utente |
| `program.revoked` | Revoca programmi a utente |

---

## Note

- I log non vengono mai eliminati automaticamente — implementare un job di archivio se necessario
- `userId` è nullable: i log di login fallito per email inesistente non hanno userId
- `oldValues` / `newValues` contengono stringhe leggibili (non JSON strutturato)
