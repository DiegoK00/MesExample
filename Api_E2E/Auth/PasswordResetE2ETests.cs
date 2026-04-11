using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Auth;

public class PasswordResetE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;

    public PasswordResetE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    // ── ForgotPassword ────────────────────────────────────────────────────────

    [Fact]
    public async Task ForgotPassword_EmailRegistrata_Restituisce200()
    {
        var client = _fixture.CreateClient();

        var response = await client.PostAsync("/auth/forgot-password",
            Json(new { email = "admin@test.com", area = 1 }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_EmailNonEsistente_Restituisce200IdenticalResponse()
    {
        // Anti-enumeration: stessa risposta indipendentemente dall'esistenza dell'utente
        var client = _fixture.CreateClient();

        var response = await client.PostAsync("/auth/forgot-password",
            Json(new { email = "nonexistent@test.com", area = 1 }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_EmailVuota_Restituisce400()
    {
        var client = _fixture.CreateClient();

        var response = await client.PostAsync("/auth/forgot-password",
            Json(new { email = "", area = 1 }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_EmailRegistrata_CreaTokenNelDb()
    {
        var client = _fixture.CreateClient();

        await client.PostAsync("/auth/forgot-password",
            Json(new { email = "admin@test.com", area = 1 }));

        var token = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    // ── ResetPassword ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_TokenValido_Restituisce204EPermettLoginConNuovaPassword()
    {
        var client = _fixture.CreateClient();

        // 1. Genera il token
        await client.PostAsync("/auth/forgot-password",
            Json(new { email = "admin@test.com", area = 1 }));

        var token = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        Assert.NotNull(token);

        // 2. Reset con il token reale
        var resetResponse = await client.PostAsync("/auth/reset-password",
            Json(new { token, newPassword = "NewAdmin@E2E1" }));

        Assert.Equal(HttpStatusCode.NoContent, resetResponse.StatusCode);

        // 3. Login con la nuova password deve riuscire
        var loginResponse = await client.PostAsync("/auth/login",
            Json(new { email = "admin@test.com", password = "NewAdmin@E2E1", area = 1 }));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // 4. Ripristina la password originale
        await client.PostAsync("/auth/forgot-password",
            Json(new { email = "admin@test.com", area = 1 }));
        var restoreToken = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        await client.PostAsync("/auth/reset-password",
            Json(new { token = restoreToken, newPassword = "Admin@1234" }));
    }

    [Fact]
    public async Task ResetPassword_TokenNonValido_Restituisce400()
    {
        var client = _fixture.CreateClient();

        var response = await client.PostAsync("/auth/reset-password",
            Json(new { token = "token-inesistente-xyz", newPassword = "NewPassword@1" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_TokenGiàUsato_Restituisce400()
    {
        var client = _fixture.CreateClient();

        // 1. Genera il token
        await client.PostAsync("/auth/forgot-password",
            Json(new { email = "admin@test.com", area = 1 }));

        var token = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        Assert.NotNull(token);

        // 2. Primo uso
        var first = await client.PostAsync("/auth/reset-password",
            Json(new { token, newPassword = "FirstNew@E2E1" }));
        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);

        // 3. Secondo uso dello stesso token
        var second = await client.PostAsync("/auth/reset-password",
            Json(new { token, newPassword = "SecondNew@E2E1" }));

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);

        // 4. Ripristina
        await client.PostAsync("/auth/forgot-password",
            Json(new { email = "admin@test.com", area = 1 }));
        var restoreToken = await _fixture.GetLatestResetTokenAsync("admin@test.com");
        await client.PostAsync("/auth/reset-password",
            Json(new { token = restoreToken, newPassword = "Admin@1234" }));
    }

    [Fact]
    public async Task ResetPassword_PasswordTroppoCorta_Restituisce400()
    {
        var client = _fixture.CreateClient();

        var response = await client.PostAsync("/auth/reset-password",
            Json(new { token = "any-token", newPassword = "short" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
