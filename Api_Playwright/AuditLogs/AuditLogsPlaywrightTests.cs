using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.AuditLogs;

public class AuditLogsPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public AuditLogsPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        // Il login usato per ottenere il token genera un audit log "user.login"
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    [Fact]
    public async Task GetLogs_Autenticato_RestituiscePaginazioneCorretta()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/audit-logs");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);

        Assert.True(doc.RootElement.TryGetProperty("items", out var items));
        Assert.True(doc.RootElement.TryGetProperty("totalCount", out var total));
        Assert.True(doc.RootElement.TryGetProperty("page", out _));
        Assert.True(doc.RootElement.TryGetProperty("pageSize", out _));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
        Assert.True(total.GetInt32() >= 1);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetLogs_LoginGeneraAuditLog_TotalCountMaggioreZero()
    {
        var ctx = await AuthCtx();

        // Esegui un login aggiuntivo per assicurarsi che ci sia almeno un log
        await _fixture.LoginAsync();

        var response = await ctx.GetAsync("/audit-logs?action=user.login");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        var total = doc.RootElement.GetProperty("totalCount").GetInt32();
        Assert.True(total >= 1, "Almeno un log user.login deve esistere dopo il login");

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetLogs_FiltroAction_TuttiIRisultatiHannoActionCorretta()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/audit-logs?action=user.login");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        var items = doc.RootElement.GetProperty("items");

        foreach (var item in items.EnumerateArray())
        {
            var action = item.GetProperty("action").GetString();
            Assert.Equal("user.login", action);
        }

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetLogs_Paginazione_PageSizeRispettato()
    {
        var ctx = await AuthCtx();

        // Genera più log eseguendo login aggiuntivi
        await _fixture.LoginAsync();
        await _fixture.LoginAsync();

        var response = await ctx.GetAsync("/audit-logs?page=1&pageSize=1");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        var items = doc.RootElement.GetProperty("items");

        // Con pageSize=1 deve restituire al massimo 1 elemento
        Assert.True(items.GetArrayLength() <= 1);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetLogs_SenzaToken_Restituisce401()
    {
        var response = await _fixture.Request.GetAsync("/audit-logs");
        Assert.Equal(401, response.Status);
    }
}
