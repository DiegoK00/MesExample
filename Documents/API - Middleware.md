# API - Middleware

## ErrorHandlingMiddleware

Intercetta tutte le eccezioni non gestite e restituisce una risposta `ProblemDetails` standardizzata (RFC 9110).

**File:** `Middleware/ErrorHandlingMiddleware.cs`

### Comportamento

| Eccezione | HTTP | Titolo |
|-----------|------|--------|
| `ArgumentException` | 400 | Richiesta non valida. |
| `UnauthorizedAccessException` | 403 | Accesso negato. |
| `KeyNotFoundException` | 404 | Risorsa non trovata. |
| Qualsiasi altra | 500 | Si è verificato un errore interno. |

Ogni eccezione viene loggata tramite `ILogger` con livello `Error`.

### Registrazione in Program.cs

Il middleware è registrato **primo nella pipeline**, prima di Swagger e HTTPS redirect:

```csharp
app.UseMiddleware<ErrorHandlingMiddleware>();
```

### Formato risposta

```json
{
  "title": "Si è verificato un errore interno.",
  "status": 500
}
```

---

## Ordine della pipeline

```
ErrorHandlingMiddleware      ← primo: cattura tutto
  → Swagger (solo dev)
  → HttpsRedirection
  → Authentication
  → Authorization
  → Controllers
```

---

## Note

- In produzione i dettagli dell'eccezione non vengono mai esposti nel body della risposta.
- I dettagli completi (stack trace, messaggio) sono loggati solo server-side.
- FluentValidation restituisce automaticamente `400` con il dettaglio degli errori di validazione tramite `AddFluentValidationAutoValidation()` — il middleware non interferisce con questo flusso.
