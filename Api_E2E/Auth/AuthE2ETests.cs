using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Auth;

public class AuthE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuthE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    [Fact]
    public async Task Login_CredenzisliValide_Restituisce200ConTokens()
    {
        var client = _fixture.CreateClient();
        var body = Json(new { email = "admin@test.com", password = "Admin@1234", area = 1 });

        var response = await client.PostAsync("/auth/login", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("accessToken", out var accessToken));
        Assert.True(doc.RootElement.TryGetProperty("refreshToken", out var refreshToken));
        Assert.True(doc.RootElement.TryGetProperty("expiresAt", out _));
        Assert.False(string.IsNullOrEmpty(accessToken.GetString()));
        Assert.False(string.IsNullOrEmpty(refreshToken.GetString()));
    }

    [Fact]
    public async Task Login_PasswordErrata_Restituisce401()
    {
        var client = _fixture.CreateClient();
        var body = Json(new { email = "admin@test.com", password = "WrongPassword!", area = 1 });

        var response = await client.PostAsync("/auth/login", body);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_EmailVuota_Restituisce400()
    {
        var client = _fixture.CreateClient();
        var body = Json(new { email = "", password = "Admin@1234", area = 1 });

        var response = await client.PostAsync("/auth/login", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_TokenValido_Restituisce200ConNuoviToken()
    {
        var refreshToken = await _fixture.LoginAndGetRefreshTokenAsync();
        var client = _fixture.CreateClient();
        var body = Json(new { refreshToken });

        var response = await client.PostAsync("/auth/refresh", body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("accessToken", out var newAccess));
        Assert.True(doc.RootElement.TryGetProperty("refreshToken", out var newRefresh));
        Assert.False(string.IsNullOrEmpty(newAccess.GetString()));
        Assert.False(string.IsNullOrEmpty(newRefresh.GetString()));
    }

    [Fact]
    public async Task Refresh_TokenNonValido_Restituisce401()
    {
        var client = _fixture.CreateClient();
        var body = Json(new { refreshToken = "token-inesistente-inventato-xyz123" });

        var response = await client.PostAsync("/auth/refresh", body);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_TokenValido_Restituisce204()
    {
        var refreshToken = await _fixture.LoginAndGetRefreshTokenAsync();
        var client = _fixture.CreateClient();
        var body = Json(new { refreshToken });

        var response = await client.PostAsync("/auth/logout", body);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_Autenticato_Restituisce200ConDatiUtente()
    {
        var token = await _fixture.LoginAsync();
        var client = _fixture.CreateAuthenticatedClient(token);

        var response = await client.GetAsync("/account/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("id", out var id));
        Assert.True(doc.RootElement.TryGetProperty("email", out var email));
        Assert.True(doc.RootElement.TryGetProperty("roles", out _));
        Assert.Equal(1, id.GetInt32());
        Assert.Equal("admin@test.com", email.GetString());
    }

    [Fact]
    public async Task GetMe_NonAutenticato_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/account/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
