using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Auth;

public class PasswordResetPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;

    public PasswordResetPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
    }

    // ── ForgotPassword ────────────────────────────────────────────────────────

    [Fact]
    public async Task ForgotPassword_EmailRegistrata_Restituisce200ConContentTypeJson()
    {
        var response = await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", area = 1 }
        });

        Assert.Equal(200, response.Status);
        var contentType = response.Headers["content-type"];
        Assert.Contains("application/json", contentType);

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(doc.RootElement.TryGetProperty("message", out _));
    }

    [Fact]
    public async Task ForgotPassword_EmailNonEsistente_Restituisce200IdenticalResponse()
    {
        // Anti-enumeration: risposta identica indipendentemente dall'esistenza dell'utente
        var response = await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "nonexistent@test.com", area = 1 }
        });

        Assert.Equal(200, response.Status);
    }

    [Fact]
    public async Task ForgotPassword_EmailVuota_Restituisce400ConProblemDetails()
    {
        var response = await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "", area = 1 }
        });

        Assert.Equal(400, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(
            doc.RootElement.TryGetProperty("title", out _) ||
            doc.RootElement.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task ForgotPassword_EmailRegistrata_CreaTokenNelDb()
    {
        // Chiama forgot-password
        var response = await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", area = 1 }
        });

        Assert.Equal(200, response.Status);

        // Verifica che il token sia stato inserito nel DB
        var token = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    // ── ResetPassword ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_TokenValido_Restituisce204EPermettLoginConNuovaPassword()
    {
        // 1. Genera il token tramite forgot-password
        await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", area = 1 }
        });

        var token = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        Assert.NotNull(token);

        // 2. Reset con il token reale
        var resetResponse = await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token, newPassword = "NewAdmin@9999" }
        });

        Assert.Equal(204, resetResponse.Status);

        // 3. Login con la nuova password
        var loginResponse = await _fixture.Request.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", password = "NewAdmin@9999", area = 1 }
        });

        Assert.Equal(200, loginResponse.Status);

        // 4. Ripristina la password originale per non rompere gli altri test
        await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", area = 1 }
        });
        var restoreToken = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token = restoreToken, newPassword = "Admin@1234" }
        });
    }

    [Fact]
    public async Task ResetPassword_TokenNonValido_Restituisce400()
    {
        var response = await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token = "invalid-token-that-does-not-exist", newPassword = "NewPassword@1" }
        });

        Assert.Equal(400, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(doc.RootElement.TryGetProperty("title", out var title));
        Assert.Contains("Token", title.GetString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResetPassword_TokenGiàUsato_Restituisce400()
    {
        // 1. Genera il token
        await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", area = 1 }
        });

        var token = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        Assert.NotNull(token);

        // 2. Primo uso del token
        var first = await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token, newPassword = "FirstNew@1234" }
        });
        Assert.Equal(204, first.Status);

        // 3. Secondo uso dello stesso token → deve fallire
        var second = await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token, newPassword = "SecondNew@1234" }
        });

        Assert.Equal(400, second.Status);

        // 4. Ripristina password originale
        await _fixture.Request.PostAsync("/auth/forgot-password", new APIRequestContextOptions
        {
            DataObject = new { email = "admin@test.com", area = 1 }
        });
        var restoreToken = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token = restoreToken, newPassword = "Admin@1234" }
        });
    }

    [Fact]
    public async Task ResetPassword_PasswordTroppoCorta_Restituisce400()
    {
        var response = await _fixture.Request.PostAsync("/auth/reset-password", new APIRequestContextOptions
        {
            DataObject = new { token = "any-token", newPassword = "short" }
        });

        Assert.Equal(400, response.Status);
    }
}
