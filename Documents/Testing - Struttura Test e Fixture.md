# Testing - Struttura Test e Fixture

Pattern, fixture e seed data usati nei tre livelli di test API.

---

## Api_Test — Unit Test (xUnit + InMemory)

File: `Api_Test/`

Test dei service in isolamento. Ogni test usa un database InMemory separato.

### DbContextFactory

File: `Api_Test/Helpers/DbContextFactory.cs`

Factory statica con due metodi:

| Metodo | DB | Contenuto |
|--------|-----|-----------|
| `Create(dbName)` | InMemory vuoto | Nessun dato — per test che costruiscono tutto da zero |
| `CreateWithSeed(dbName)` | InMemory con seed | Ruoli `SuperAdmin`+`User` + 1 utente admin (`admin@test.com` / `Admin@1234`) |

Il `dbName` deve essere **unico per test** — si usa `nameof(TestMethod)` come convenzione per evitare collisioni tra test paralleli.

### Pattern di ogni test file

```csharp
// 1. Factory locale che crea service + db
private static (ArticleService service, AppDbContext db) Build(string dbName)
{
    var db = DbContextFactory.CreateWithSeed("Art_" + dbName);
    var auditLog = new AuditLogService(db);
    return (new ArticleService(db, auditLog), db);
}

// 2. Helper per dati di lookup (categorie, UM, ecc.)
private static async Task<(Category cat, MeasureUnit um)> AddLookups(AppDbContext db) { ... }

// 3. Test con nome descrittivo del comportamento atteso
[Fact]
public async Task GetAllAsync_ReturnsAllArticles() { ... }
```

### Suite di test unitari

| File | Service testato |
|------|----------------|
| `AuthServiceTests.cs` | Login, hashing password, refresh token |
| `UserServiceTests.cs` | CRUD utenti, deactivation |
| `ProgramServiceTests.cs` | CRUD programmi, assegnazione |
| `CategoryServiceTests.cs` | CRUD categorie |
| `MeasureUnitServiceTests.cs` | CRUD unità di misura |
| `ArticleServiceTests.cs` | CRUD articoli, filtro attivi |
| `BillOfMaterialServiceTests.cs` | CRUD distinte base, validazione auto-referenza |
| `AuditLogServiceTests.cs` | Scrittura e lettura log |
| `EmailServiceTests.cs` | Mock Resend, invio email reset |

---

## Api_E2E — Test E2E (WebApplicationFactory + InMemory)

File: `Api_E2E/`

Test HTTP reali contro l'app ASP.NET Core avviata in memoria.  
Ogni test class condivide la stessa `ApiE2EFixture` tramite `IClassFixture<ApiE2EFixture>`.

### ApiE2EFixture

File: `Api_E2E/Helpers/ApiE2EFixture.cs`

Estende `WebApplicationFactory<Program>` e:

1. **Sostituisce SQL Server con InMemory** — rimuove tutti i descriptor che referenziano SqlServer, aggiunge `UseInMemoryDatabase`
2. **Sostituisce IEmailService con NoOp** — nessuna email reale viene inviata durante i test
3. **Override JWT** — secret di test (`super-secret-test-key-that-is-at-least-32-chars!!`) iniettato via `PostConfigure`
4. **Seed database** in `InitializeAsync()` — ruoli `SuperAdmin`/`Admin`/`User` + utente admin

### Helper methods della fixture

| Metodo | Scopo |
|--------|-------|
| `LoginAsync(email, password, area)` | Esegue login e restituisce l'access token JWT |
| `LoginAndGetRefreshTokenAsync(...)` | Come sopra ma restituisce il refresh token |
| `CreateAuthenticatedClient(token)` | `HttpClient` con header `Authorization: Bearer {token}` |
| `GetLatestResetTokenAsync(email)` | Legge dal DB il token di reset più recente (per testare il flow reset password) |

### Pattern di ogni test E2E

```csharp
public class ArticlesE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public ArticlesE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task GetAll_Autenticato_RestituisceArray()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var response = await client.GetAsync("/articles");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

### Dati di test nei test E2E

Per i dati aggiuntivi (categorie, articoli, ecc.) ogni test li crea tramite le API stesse — non direttamente nel DB. Questo testa anche il flusso di creazione:

```csharp
// Crea categoria via API prima di testare articoli
var catResponse = await client.PostAsync("/categories",
    Json(new { name = $"Cat_{Guid.NewGuid():N}" }));
var categoryId = JsonDocument.Parse(await catResponse.Content.ReadAsStringAsync())
    .RootElement.GetProperty("id").GetInt32();
```

### Suite di test E2E

| File | Endpoint testati |
|------|-----------------|
| `Auth/AuthE2ETests.cs` | Login, logout, refresh token |
| `Auth/PasswordResetE2ETests.cs` | Forgot password, reset password |
| `Account/AccountE2ETests.cs` | GET me, cambio password |
| `Users/UsersE2ETests.cs` | CRUD utenti |
| `Programs/ProgramsE2ETests.cs` | CRUD programmi, assegnazione |
| `Categories/CategoriesE2ETests.cs` | CRUD categorie |
| `MeasureUnits/MeasureUnitsE2ETests.cs` | CRUD unità di misura |
| `Articles/ArticlesE2ETests.cs` | CRUD articoli, filtri |
| `BillOfMaterials/BillOfMaterialsE2ETests.cs` | CRUD distinte base |
| `AuditLogs/AuditLogsE2ETests.cs` | Lista log, filtri, paginazione |

---

## Ambiente "Test"

L'app riconosce `ASPNETCORE_ENVIRONMENT=Test` (impostato da `builder.UseEnvironment("Test")` nella fixture) e disabilita:
- `UseHttpsRedirection`
- `UseRateLimiter`

Questo evita redirect HTTPS e blocchi rate limiting durante i test.
