# API - Error Handling e Validazione

Strategia centralizzata per la gestione degli errori e la validazione degli input nell'API ASP.NET Core.

---

## ErrorHandlingMiddleware

File: `api/Middleware/ErrorHandlingMiddleware.cs`  
Registrato in `Program.cs` come primo middleware della pipeline.

Intercetta tutte le eccezioni non gestite e le trasforma in risposte `application/problem+json` (RFC 7807).

### Mapping eccezioni → HTTP status

| Eccezione .NET | HTTP Status | Titolo risposta |
|----------------|-------------|-----------------|
| `ArgumentException` | 400 Bad Request | "Richiesta non valida." |
| `UnauthorizedAccessException` | 403 Forbidden | "Accesso negato." |
| `KeyNotFoundException` | 404 Not Found | "Risorsa non trovata." |
| Qualsiasi altra | 500 Internal Server Error | "Si è verificato un errore interno." |

### Formato risposta (ProblemDetails)

```json
{
  "title": "Risorsa non trovata.",
  "status": 404
}
```

Tutte le risposte di errore usano `Content-Type: application/problem+json`.  
L'eccezione viene loggata con `LogError` prima di scrivere la risposta.

### Errori di dominio (non eccezioni)

Per errori di business logic (es. codice duplicato, entità non trovata in operazioni CRUD) i controller restituiscono direttamente `ProblemDetails` senza lanciare eccezioni:

```csharp
return Conflict(new ProblemDetails { Title = "Il codice 'X' è già in uso." });
return NotFound(new ProblemDetails { Title = "Articolo 5 non trovato." });
```

---

## Validazione Input — FluentValidation

File: `api/Validators/`  
Integrato tramite `FluentValidation.AspNetCore` con `AddFluentValidationAutoValidation()`.

La validazione viene eseguita automaticamente prima che il controller riceva la request. In caso di errore restituisce `400 Bad Request` con i dettagli dei campi non validi.

### Validators implementati

| Validator | DTO validato | Regole principali |
|-----------|-------------|-------------------|
| `LoginRequestValidator` | `LoginRequest` | Email valida, password non vuota |
| `ForgotPasswordRequestValidator` | `ForgotPasswordRequest` | Email valida |
| `ResetPasswordRequestValidator` | `ResetPasswordRequest` | Token non vuoto, password min 6 chars |
| `RefreshTokenRequestValidator` | `RefreshTokenRequest` | Token non vuoto |
| `ChangePasswordRequestValidator` | `ChangePasswordRequest` | Password attuale + nuova non vuote |
| `CreateUserRequestValidator` | `CreateUserRequest` | Email valida, username, password |
| `UpdateUserRequestValidator` | `UpdateUserRequest` | Username, email valida |
| `CreateProgramRequestValidator` | `CreateProgramRequest` | Code `^[A-Z0-9_]+$`, max 50 chars; Name max 100 |
| `UpdateProgramRequestValidator` | `UpdateProgramRequest` | Stesse regole di Create |
| `AssignProgramRequestValidator` | `AssignProgramRequest` | UserId e ProgramId > 0 |

### Esempio validator

```csharp
public class CreateProgramRequestValidator : AbstractValidator<CreateProgramRequest>
{
    public CreateProgramRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50)
            .Matches("^[A-Z0-9_]+$")
            .WithMessage("Code deve contenere solo lettere maiuscole, numeri e underscore.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);
    }
}
```

### Risposta errore validazione (automatica)

```json
{
  "errors": {
    "Code": ["Code deve contenere solo lettere maiuscole, numeri e underscore."],
    "Name": ["'Name' must not be empty."]
  },
  "status": 400,
  "title": "One or more validation errors occurred."
}
```

---

## Note

- I validators vengono registrati automaticamente con `AddValidatorsFromAssemblyContaining<Program>()` — nessuna registrazione manuale necessaria.
- Per le risorse senza validator esplicito (categorie, unità di misura, articoli) la validazione è affidata ai Data Annotations sui DTOs e ai controlli nel service layer.
