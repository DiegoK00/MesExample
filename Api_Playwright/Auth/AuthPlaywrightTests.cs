using System.Net;
using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Auth;

public class AuthPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;

    public AuthPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Login_CredenzisliValide_Restituisce200ConTokensEContentTypeJson()
    {
        var response = await _fixture.Request.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", password = "Admin@1234", area = 1 }
        });

        Assert.Equal(200, response.Status);

        // Verifica Content-Type: application/json (comportamento HTTP reale, non in-memory)
        var contentType = response.Headers["content-type"];
        Assert.Contains("application/json", contentType);

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(doc.RootElement.TryGetProperty("accessToken", out var access));
        Assert.True(doc.RootElement.TryGetProperty("refreshToken", out var refresh));
        Assert.True(doc.RootElement.TryGetProperty("expiresAt", out _));
        Assert.False(string.IsNullOrWhiteSpace(access.GetString()));
        Assert.False(string.IsNullOrWhiteSpace(refresh.GetString()));
    }

    [Fact]
    public async Task Login_PasswordErrata_Restituisce401()
    {
        var response = await _fixture.Request.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", password = "WrongPass!", area = 1 }
        });

        Assert.Equal(401, response.Status);
    }

    [Fact]
    public async Task Login_EmailVuota_Restituisce400ConProblemDetails()
    {
        var response = await _fixture.Request.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { email = "", password = "Admin@1234", area = 1 }
        });

        Assert.Equal(400, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        // ProblemDetails deve avere "title" o "errors"
        Assert.True(
            doc.RootElement.TryGetProperty("title", out _) ||
            doc.RootElement.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task Refresh_TokenValido_RestituisceNuoviTokenDiversiDaiPrecedenti()
    {
        var oldRefresh = await _fixture.LoginAndGetRefreshTokenAsync();
        var oldAccess = await _fixture.LoginAsync();

        var response = await _fixture.Request.PostAsync("/auth/refresh", new APIRequestContextOptions
        {
            DataObject = new { refreshToken = oldRefresh }
        });

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        var newAccess = doc.RootElement.GetProperty("accessToken").GetString();
        var newRefresh = doc.RootElement.GetProperty("refreshToken").GetString();

        Assert.False(string.IsNullOrWhiteSpace(newAccess));
        Assert.False(string.IsNullOrWhiteSpace(newRefresh));
        // Refresh token rotation: il nuovo refresh deve essere diverso
        Assert.NotEqual(oldRefresh, newRefresh);
    }

    [Fact]
    public async Task Logout_PoiRefresh_TokenRevocatoRestituisce401()
    {
        var refreshToken = await _fixture.LoginAndGetRefreshTokenAsync();

        // Logout
        var logoutResponse = await _fixture.Request.PostAsync("/auth/logout", new APIRequestContextOptions
        {
            DataObject = new { refreshToken }
        });
        Assert.Equal(204, logoutResponse.Status);

        // Tentativo di usare il refresh token revocato
        var refreshResponse = await _fixture.Request.PostAsync("/auth/refresh", new APIRequestContextOptions
        {
            DataObject = new { refreshToken }
        });
        Assert.Equal(401, refreshResponse.Status);
    }

    [Fact]
    public async Task GetMe_Autenticato_Restituisce200ConDatiCorretti()
    {
        var token = await _fixture.LoginAsync();
        var ctx = await _fixture.CreateAuthenticatedContextAsync(token);

        var response = await ctx.GetAsync("/account/me");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("admin@test.com", doc.RootElement.GetProperty("email").GetString());
        Assert.Equal("admin", doc.RootElement.GetProperty("username").GetString());
        Assert.Equal(1, doc.RootElement.GetProperty("loginArea").GetInt32());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetMe_SenzaToken_Restituisce401()
    {
        var response = await _fixture.Request.GetAsync("/account/me");
        Assert.Equal(401, response.Status);
    }
}
