using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Programs;

public class ProgramsPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public ProgramsPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    [Fact]
    public async Task GetAll_Autenticato_RestituisceArrayJson()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/programs");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_CodiceValido_Restituisce201ConBodyCorretto()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "PW_PROG_001",
                name = "Playwright Programma",
                description = "Creato da test Playwright"
            }
        });

        Assert.Equal(201, response.Status);
        Assert.True(response.Headers.ContainsKey("location"));

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("PW_PROG_001", doc.RootElement.GetProperty("code").GetString());
        Assert.Equal("Playwright Programma", doc.RootElement.GetProperty("name").GetString());
        Assert.True(doc.RootElement.GetProperty("isActive").GetBoolean());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_CodiceDuplicato_Restituisce409()
    {
        var ctx = await AuthCtx();

        var body = new APIRequestContextOptions
        {
            DataObject = new { code = "PW_DUP_TEST", name = "Primo", description = (string?)null }
        };
        await ctx.PostAsync("/programs", body);

        var response = await ctx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new { code = "PW_DUP_TEST", name = "Secondo", description = (string?)null }
        });

        Assert.Equal(409, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_CodiceLowercase_Restituisce400()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new { code = "prog_minuscolo", name = "Test", description = (string?)null }
        });

        Assert.Equal(400, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task AssignRevoke_ProgrammaAdUtente_CicloCompleto()
    {
        var ctx = await AuthCtx();

        // Crea programma
        var createRes = await ctx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new { code = "PW_ASSIGN_001", name = "Assign Test", description = (string?)null }
        });
        Assert.Equal(201, createRes.Status);
        var createText = await createRes.TextAsync();
        using var createDoc = JsonDocument.Parse(createText);
        var programId = createDoc.RootElement.GetProperty("id").GetInt32();

        // Assegna all'utente 1
        var assignRes = await ctx.PostAsync("/users/1/programs", new APIRequestContextOptions
        {
            DataObject = new { programIds = new[] { programId } }
        });
        Assert.Equal(200, assignRes.Status);

        // Verifica che l'utente abbia il programma
        var meRes = await ctx.GetAsync("/account/me");
        // (account/me non mostra i programmi del seed per l'admin, ma verifica 200)
        Assert.Equal(200, meRes.Status);

        // Revoca
        var revokeRes = await ctx.DeleteAsync("/users/1/programs", new APIRequestContextOptions
        {
            DataObject = new { programIds = new[] { programId } }
        });
        Assert.Equal(204, revokeRes.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_ProgrammaEsistente_Restituisce204()
    {
        var ctx = await AuthCtx();

        // Crea programma da eliminare
        var createRes = await ctx.PostAsync("/programs", new APIRequestContextOptions
        {
            DataObject = new { code = "PW_DELETE_001", name = "Da Eliminare", description = (string?)null }
        });
        Assert.Equal(201, createRes.Status);
        var createText = await createRes.TextAsync();
        using var createDoc = JsonDocument.Parse(createText);
        var programId = createDoc.RootElement.GetProperty("id").GetInt32();

        // Elimina
        var deleteRes = await ctx.DeleteAsync($"/programs/{programId}");

        Assert.Equal(204, deleteRes.Status);

        await ctx.DisposeAsync();
    }
}
