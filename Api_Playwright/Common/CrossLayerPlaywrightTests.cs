using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Common;

/// <summary>
/// Cross-layer E2E tests: rate limiting, concurrency, token refresh flow
/// </summary>
public class CrossLayerPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public CrossLayerPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    // ───────────────────────────────────────────────────────────────
    // TIER 2.1: Rate Limiting E2E
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task RateLimiting_WithinLimit_AllRequests_Succeed()
    {
        var ctx = await AuthCtx();

        // Invia 3 richieste normalmente spaziate (ben dentro il limite di 5/min)
        for (int i = 0; i < 3; i++)
        {
            var response = await ctx.GetAsync("/users");
            Assert.Equal(200, response.Status);
        }

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task RateLimiting_WaitBetweenRequests_AllowsExecution()
    {
        var ctx = await AuthCtx();

        // Prima richiesta
        var response1 = await ctx.GetAsync("/users");
        Assert.Equal(200, response1.Status);

        // Attendi 2 secondi
        System.Threading.Thread.Sleep(2000);

        // Seconda richiesta dovrebbe funzionare
        var response2 = await ctx.GetAsync("/users");
        Assert.Equal(200, response2.Status);

        await ctx.DisposeAsync();
    }

    // ───────────────────────────────────────────────────────────────
    // TIER 2.2: Concurrent Requests → Conflict Detection
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task ConcurrentUpdates_SameResource_LastWriteWins()
    {
        var ctx = await AuthCtx();

        // Crea un programma per aggiornamenti concorrenti
        var createResp = await ctx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "CONCURRENT_TEST",
                name = "Original",
                description = "Will be updated"
            }
        });

        var createText = await createResp.TextAsync();
        using var createDoc = JsonDocument.Parse(createText);
        var progId = createDoc.RootElement.GetProperty("id").GetInt32();

        // Lancio 2 PUT concorrenti
        var update1 = ctx.PutAsync($"/programs/{progId}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Updated by thread 1",
                description = "First update",
                isActive = true
            }
        });

        var update2 = ctx.PutAsync($"/programs/{progId}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Updated by thread 2",
                description = "Second update",
                isActive = true
            }
        });

        var results = await Task.WhenAll(update1, update2);

        // Entrambi dovrebbero avere successo (200)
        Assert.All(results, r => Assert.Equal(200, r.Status));

        // Leggi lo stato finale
        var getResp = await ctx.GetAsync($"/programs/{progId}");
        var getText = await getResp.TextAsync();
        using var getDoc = JsonDocument.Parse(getText);
        var finalName = getDoc.RootElement.GetProperty("name").GetString();

        // Una delle due update deve aver prevalso
        Assert.True(
            finalName == "Updated by thread 1" || finalName == "Updated by thread 2",
            "Final name should be from one of the concurrent updates"
        );

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task ConcurrentCreates_DifferentResources_BothSucceed()
    {
        var ctx = await AuthCtx();

        // Crea 3 categorie concorrentemente
        var creates = new List<Task<IAPIResponse>>
        {
            ctx.PostAsync("/categories", new APIRequestContextOptions
            {
                DataObject = new { name = "Category 1" }
            }),
            ctx.PostAsync("/categories", new APIRequestContextOptions
            {
                DataObject = new { name = "Category 2" }
            }),
            ctx.PostAsync("/categories", new APIRequestContextOptions
            {
                DataObject = new { name = "Category 3" }
            })
        };

        var results = await Task.WhenAll(creates);

        // Tutte dovrebbero avere successo (201)
        Assert.All(results, r => Assert.Equal(201, r.Status));

        // Verifica che le categorie siano state create
        var listResp = await ctx.GetAsync("/categories");
        Assert.Equal(200, listResp.Status);

        await ctx.DisposeAsync();
    }

    // ───────────────────────────────────────────────────────────────
    // TIER 2.3: Token Refresh Flow E2E
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task TokenRefresh_AfterLoginAndLogout_RefreshTokenRevoked()
    {
        // Ottieni un refreshToken e usalo per refresh dopo il logout
        var refreshToken = await _fixture.LoginAndGetRefreshTokenAsync();
        var accessToken = await _fixture.LoginAsync();
        var ctx = await _fixture.CreateAuthenticatedContextAsync(accessToken);

        // Verifica che l'access token funziona
        var response1 = await ctx.GetAsync("/account/me");
        Assert.Equal(200, response1.Status);

        // Logout → revoca il refreshToken nel DB
        await ctx.PostAsync("/auth/logout", new APIRequestContextOptions
        {
            DataObject = new { refreshToken }
        });

        // Prova a fare refresh con il token revocato → 401
        var refreshResp = await _fixture.Request.PostAsync("/auth/refresh", new APIRequestContextOptions
        {
            DataObject = new { refreshToken }
        });
        Assert.Equal(401, refreshResp.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task TokenReuse_AfterRevocation_RefreshFails()
    {
        var refreshToken = await _fixture.LoginAndGetRefreshTokenAsync();
        var accessToken = await _fixture.LoginAsync();
        var ctx = await _fixture.CreateAuthenticatedContextAsync(accessToken);

        // Logout revoca il refreshToken
        var logoutResp = await ctx.PostAsync("/auth/logout", new APIRequestContextOptions
        {
            DataObject = new { refreshToken }
        });
        Assert.Equal(204, logoutResp.Status);

        // Il refreshToken non può più essere usato per ottenere nuovi token
        var refreshResp = await _fixture.Request.PostAsync("/auth/refresh", new APIRequestContextOptions
        {
            DataObject = new { refreshToken }
        });
        Assert.Equal(401, refreshResp.Status);

        await ctx.DisposeAsync();
    }

    // ───────────────────────────────────────────────────────────────
    // TIER 2.4: Authorization Boundary (verify role access)
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Authorization_NonAdminUser_CannnotCreateProgram()
    {
        // Login come utente App (non admin)
        var appUserToken = await _fixture.LoginAsync(email: "user@test.com", password: "User@1234", area: 2);
        var appCtx = await _fixture.CreateAuthenticatedContextAsync(appUserToken);

        // Prova a creare un programma - dovrebbe fallire (403)
        var response = await appCtx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "FORBIDDEN_TEST",
                name = "Non-admin should not create",
                description = (string?)null
            }
        });

        Assert.Equal(403, response.Status);

        await appCtx.DisposeAsync();
    }

    [Fact]
    public async Task Authorization_AdminCanCreateProgram_AppUserCanView()
    {
        // Admin crea un programma
        var adminCtx = await AuthCtx();
        var createResp = await adminCtx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "ADMIN_CREATED_PROG",
                name = "Created by Admin",
                description = "Should be viewable by app user"
            }
        });
        Assert.Equal(201, createResp.Status);

        // App user legge la lista
        var appUserToken = await _fixture.LoginAsync(email: "user@test.com", password: "User@1234", area: 2);
        var appCtx = await _fixture.CreateAuthenticatedContextAsync(appUserToken);

        var listResp = await appCtx.GetAsync("/programs");
        Assert.Equal(200, listResp.Status);

        var text = await listResp.TextAsync();
        using var doc = JsonDocument.Parse(text);
        // La lista dovrebbe contenere il programma creato
        Assert.True(doc.RootElement.GetArrayLength() > 0);

        await adminCtx.DisposeAsync();
        await appCtx.DisposeAsync();
    }
}
