using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Users;

public class UsersE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public UsersE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    [Fact]
    public async Task GetAll_Autenticato_RestituisceListaPaginata()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("items", out var items));
        Assert.True(doc.RootElement.TryGetProperty("totalCount", out var totalCount));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
        Assert.True(totalCount.GetInt32() >= 1);
    }

    [Fact]
    public async Task Create_DatiValidi_Restituisce201ConLocation()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body = Json(new
        {
            email = "nuovo@test.com",
            username = "nuovoutente",
            password = "Password@1234",
            loginArea = 1,
            roleIds = new[] { 3 }
        });

        var response = await client.PostAsync("/users", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
    }

    [Fact]
    public async Task GetById_UtenteEsistente_Restituisce200()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/users/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("id", out var id));
        Assert.Equal(1, id.GetInt32());
    }

    [Fact]
    public async Task Update_DatiValidi_Restituisce200Aggiornato()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body = Json(new
        {
            email = "admin@test.com",
            username = "admin-aggiornato",
            isActive = true,
            roleIds = new[] { 1 }
        });

        var response = await client.PutAsync("/users/1", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("username", out var username));
        Assert.Equal("admin-aggiornato", username.GetString());
    }

    [Fact]
    public async Task GetAll_SenzaToken_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/users");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_EmailDuplicata_Restituisce409()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        // admin@test.com è già nel seed
        var body = Json(new
        {
            email = "admin@test.com",
            username = "altro-admin",
            password = "Password@1234",
            loginArea = 1,
            roleIds = new[] { 1 }
        });

        var response = await client.PostAsync("/users", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }
}
