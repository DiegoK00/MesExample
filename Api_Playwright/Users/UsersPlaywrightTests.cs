using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Users;

public class UsersPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public UsersPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    [Fact]
    public async Task GetAll_Autenticato_RestituisceListaPaginataConTotalCount()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/users");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(doc.RootElement.TryGetProperty("items", out var items));
        Assert.True(doc.RootElement.TryGetProperty("totalCount", out var total));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
        Assert.True(total.GetInt32() >= 1);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetAll_SenzaToken_Restituisce401()
    {
        var response = await _fixture.Request.GetAsync("/users");
        Assert.Equal(401, response.Status);
    }

    [Fact]
    public async Task Create_DatiValidi_Restituisce201ConLocationHeader()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/users", new APIRequestContextOptions
        {
            DataObject = new
            {
                email = "playwright_new@test.com",
                username = "playwrightuser",
                password = "Password@1234",
                loginArea = 1,
                roleIds = new[] { 3 }
            }
        });

        Assert.Equal(201, response.Status);
        Assert.True(response.Headers.ContainsKey("location"));
        Assert.False(string.IsNullOrWhiteSpace(response.Headers["location"]));

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("playwright_new@test.com", doc.RootElement.GetProperty("email").GetString());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_EmailDuplicata_Restituisce409()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/users", new APIRequestContextOptions
        {
            DataObject = new
            {
                email = "admin@test.com", // già nel seed
                username = "altro-admin",
                password = "Password@1234",
                loginArea = 1,
                roleIds = new[] { 1 }
            }
        });

        Assert.Equal(409, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetById_UtenteEsistente_Restituisce200ConIdCorretto()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/users/1");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(1, doc.RootElement.GetProperty("id").GetInt32());
        Assert.Equal("admin@test.com", doc.RootElement.GetProperty("email").GetString());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetById_UtenteInesistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/users/99999");

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Update_DatiValidi_Restituisce200ConDatiAggiornati()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PutAsync("/users/1", new APIRequestContextOptions
        {
            DataObject = new
            {
                email = "admin@test.com",
                username = "admin-pw-updated",
                isActive = true,
                roleIds = new[] { 1 }
            }
        });

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("admin-pw-updated", doc.RootElement.GetProperty("username").GetString());

        await ctx.DisposeAsync();
    }
}
