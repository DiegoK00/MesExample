# API - Rate Limiting

Implementato tramite il middleware built-in `Microsoft.AspNetCore.RateLimiting` (incluso in ASP.NET Core, nessun pacchetto aggiuntivo).

---

## Policy configurate

| Policy | Algoritmo | Limite | Finestra | Endpoint |
|--------|-----------|--------|----------|----------|
| `login` | Sliding Window | 5 richieste | 1 minuto | `POST /auth/login` |
| `forgot-password` | Fixed Window | 3 richieste | 10 minuti | `POST /auth/forgot-password` |

---

## Comportamento al superamento

- HTTP **429 Too Many Requests**
- Nessun body aggiuntivo

---

## Configurazione (Program.cs)

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 3,
                QueueLimit = 0
            }));

    options.AddPolicy("forgot-password", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0
            }));
});
```

Applicazione ai controller tramite attributo:

```csharp
[EnableRateLimiting("login")]
```

---

## Note

- La partition key è l'IP del client (`RemoteIpAddress`)
- Dietro un reverse proxy usare `X-Forwarded-For` come partition key
- `QueueLimit = 0`: le richieste in eccesso vengono rifiutate immediatamente senza accodamento
