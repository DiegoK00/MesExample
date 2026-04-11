# API — E2E Playwright (.NET)

## Scopo

Progetto `Api_Playwright/` — test E2E dell'API tramite `Microsoft.Playwright` con `IAPIRequestContext`.

Differenza rispetto a `Api_E2E/` (WebApplicationFactory + HttpClient in-process):

| | `Api_E2E/` | `Api_Playwright/` |
|---|---|---|
| HTTP client | In-process (TestServer) | Rete reale (Kestrel locale) |
| Stack testato | Pipeline ASP.NET Core | Pipeline + Kestrel + HTTP headers |
| Headers reali | No | Sì (Content-Type, Location, ecc.) |
| Playwright assertions | No | Sì (`IAPIResponse`) |

---

## Setup

### 1. Installa le dipendenze NuGet

```bash
cd Api_Playwright
dotnet restore
```

### 2. Installa i browser Playwright (richiesto una volta)

```bash
pwsh bin/Debug/net10.0/playwright.ps1 install chromium
```

O con `playwright` CLI:

```bash
playwright install --with-deps chromium
```

### 3. Esegui i test

```bash
dotnet test Api_Playwright/
```

---

## Architettura: Dual-Host Pattern

`PlaywrightApiFixture` (`Helpers/PlaywrightApiFixture.cs`) combina:

1. **WebApplicationFactory** — crea il test host in-memory con EF InMemory DB per il seeding e la DI
2. **Kestrel reale** (porta casuale) — avviato in `CreateHost()` via `opts.Listen(IPAddress.Loopback, 0)` per permettere a Playwright connessioni TCP reali

```csharp
protected override IHost CreateHost(IHostBuilder builder)
{
    var testHost = builder.Build(); // host in-memory per WebApplicationFactory

    builder.ConfigureWebHost(wb =>
        wb.UseKestrel(opts => opts.Listen(IPAddress.Loopback, 0)));

    _kestrelHost = builder.Build(); // host Kestrel reale
    _kestrelHost.Start();

    ServerUrl = ...; // http://127.0.0.1:{porta}
    return testHost;
}
```

Il `Request` (IAPIRequestContext) punta al `ServerUrl` di Kestrel.

---

## Helpers disponibili nella fixture

```csharp
// Contesto HTTP base (no auth)
IAPIRequestContext Request

// Login → restituisce accessToken
Task<string> LoginAsync(email, password, area)

// Login → restituisce refreshToken
Task<string> LoginAndGetRefreshTokenAsync(email, password, area)

// Crea un contesto autenticato con Bearer token
Task<IAPIRequestContext> CreateAuthenticatedContextAsync(string token)

// Legge dal DB il token di reset password più recente (non usato, non scaduto)
// Necessario perché l'API non restituisce il token nel body (anti-enumeration)
Task<string?> GetLatestResetTokenAsync(string email)
```

---

## Test Copertura — 36 test

### Auth (`Auth/AuthPlaywrightTests.cs` — 7 test)

| Test | Verifica |
|------|---------|
| Login valido | 200 + Content-Type json + accessToken/refreshToken presenti |
| Login password errata | 401 |
| Login email vuota | 400 + ProblemDetails (title o errors) |
| Refresh token valido | 200 + nuovi token diversi (rotation) |
| Logout poi refresh | 204 logout → 401 sul refresh revocato |
| GetMe autenticato | 200 + email/username/loginArea corretti |
| GetMe senza token | 401 |

### Password Reset (`Auth/PasswordResetPlaywrightTests.cs` — 8 test)

| Test | Verifica |
|------|---------|
| ForgotPassword email registrata | 200 + Content-Type json + campo `message` nel body |
| ForgotPassword email non esistente | 200 identico (anti-enumeration) |
| ForgotPassword email vuota | 400 + ProblemDetails |
| ForgotPassword crea token nel DB | token non-null nel DB dopo la chiamata |
| ResetPassword token valido | 204 + login con nuova password → 200 |
| ResetPassword token non valido | 400 + ProblemDetails con "Token" nel title |
| ResetPassword token già usato | 204 al primo uso → 400 al secondo |
| ResetPassword password troppo corta | 400 |

### Change Password (`Account/ChangePasswordPlaywrightTests.cs` — 4 test)

| Test | Verifica |
|------|---------|
| Password corretta | 204 + conferma cambio |
| Password errata | 400 + Content-Type json + `title` nel body |
| Senza token | 401 |
| Nuova password troppo corta | 400 |

### Users (`Users/UsersPlaywrightTests.cs` — 7 test)

| Test | Verifica |
|------|---------|
| GetAll autenticato | 200 + items array + totalCount >= 1 |
| GetAll senza token | 401 |
| Create valido | 201 + Location header + body con email |
| Create email duplicata | 409 |
| GetById esistente | 200 + id e email corretti |
| GetById inesistente | 404 |
| Update valido | 200 + username aggiornato nel body |

### Programs (`Programs/ProgramsPlaywrightTests.cs` — 6 test)

| Test | Verifica |
|------|---------|
| GetAll autenticato | 200 + array JSON |
| Create valido | 201 + Location + code/name/isActive nel body |
| Create duplicato | 409 |
| Create codice lowercase | 400 |
| Assign + Revoke ciclo | POST 200 → DELETE 204 |
| Delete programma | POST crea → DELETE 204 |

### AuditLogs (`AuditLogs/AuditLogsPlaywrightTests.cs` — 5 test)

| Test | Verifica |
|------|---------|
| GetLogs paginazione | 200 + items/totalCount/page/pageSize |
| Login genera audit log | totalCount >= 1 dopo login |
| Filtro action | tutti gli items hanno action == "user.login" |
| Paginazione pageSize | pageSize=1 → al massimo 1 item restituito |
| Senza token | 401 |

---

## Note

- La fixture usa un DB InMemory con nome univoco per isolamento tra sessioni di test
- Kestrel si avvia su porta 0 (casuale) → nessun conflitto con API in esecuzione
- I test Playwright verificano **headers HTTP reali** (es. `Content-Type`, `Location`) che i test WebApplicationFactory non testano
- Per CI: non richiede API avviata esternamente — la fixture è completamente self-contained
