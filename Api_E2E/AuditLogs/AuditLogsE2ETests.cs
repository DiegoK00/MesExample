using System.Net;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.AuditLogs;

public class AuditLogsE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public AuditLogsE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
        // Il login genera audit log "user.login" — utile per il test del filtro
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task GetLogs_Autenticato_RestituiscePaginazione()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/audit-logs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("totalCount", out _));
        Assert.True(doc.RootElement.TryGetProperty("items", out var items));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
    }

    [Fact]
    public async Task GetLogs_FiltroAction_RestituisceRisultatiCorretti()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/audit-logs?action=user.login");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var items = doc.RootElement.GetProperty("items");
        Assert.Equal(JsonValueKind.Array, items.ValueKind);

        // Tutti i risultati devono avere action == "user.login"
        foreach (var item in items.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("action", out var action));
            Assert.Equal("user.login", action.GetString());
        }
    }

    [Fact]
    public async Task GetLogs_SenzaToken_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/audit-logs");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
