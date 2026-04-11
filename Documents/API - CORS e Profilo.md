# API - CORS e Profilo Utente

---

## CORS

### Configurazione per ambiente

Le origini consentite sono in `appsettings.json` (lista vuota = nessuna origin consentita):

```json
"Cors": {
  "AllowedOrigins": []
}
```

In `appsettings.Development.json` sono già configurate le origini Angular in locale:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:4200",
    "https://localhost:4200"
  ]
}
```

In produzione aggiungere le origini reali in `appsettings.Production.json` o tramite variabile d'ambiente:

```
Cors__AllowedOrigins__0=https://app.mesclaude.com
Cors__AllowedOrigins__1=https://admin.mesclaude.com
```

### Policy applicata

- `WithOrigins(...)` — whitelist esplicita, mai `AllowAnyOrigin`
- `AllowAnyHeader()` — necessario per `Authorization`, `Content-Type`
- `AllowAnyMethod()` — GET, POST, PUT, DELETE, OPTIONS
- `AllowCredentials()` — consente l'invio di cookie e header Authorization

> `AllowAnyOrigin` + `AllowCredentials` è proibito dal browser (CORS spec) e non viene mai usato.

### Ordine nella pipeline

```
UseMiddleware<ErrorHandlingMiddleware>
UseSwagger (solo dev)
UseHttpsRedirection
UseCors("AppPolicy")      ← deve essere prima di UseAuthentication
UseRateLimiter
UseAuthentication
UseAuthorization
MapControllers
```

---

## GET /account/me

Restituisce il profilo dell'utente attualmente loggato basandosi sul JWT.

| Metodo | Route | Auth |
|--------|-------|------|
| GET | `/account/me` | JWT richiesto |

### Risposta 200

```json
{
  "id": 1,
  "email": "admin@test.com",
  "username": "admin",
  "loginArea": 1,
  "roles": ["SuperAdmin"],
  "programs": ["GESTIONE_ORDINI", "MAGAZZINO"]
}
```

- `roles` — nomi dei ruoli assegnati
- `programs` — codici dei programmi attivi assegnati

### Casi d'uso Angular

- Popolare lo stato dell'app al login (NgRx store / signal)
- Mostrare menu e funzioni in base a ruoli e programmi
- Verificare se l'utente ha accesso a un modulo specifico
