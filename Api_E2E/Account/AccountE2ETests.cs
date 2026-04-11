using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Account;

public class AccountE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;

    public AccountE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    [Fact]
    public async Task ChangePassword_PasswordCorretta_Restituisce204()
    {
        var token = await _fixture.LoginAsync();
        var client = _fixture.CreateAuthenticatedClient(token);

        var response = await client.PutAsync("/account/password",
            Json(new { currentPassword = "Admin@1234", newPassword = "Changed@E2E1" }));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Ripristina per non rompere gli altri test
        var restoreToken = await _fixture.LoginAsync(password: "Changed@E2E1");
        var restoreClient = _fixture.CreateAuthenticatedClient(restoreToken);
        await restoreClient.PutAsync("/account/password",
            Json(new { currentPassword = "Changed@E2E1", newPassword = "Admin@1234" }));
    }

    [Fact]
    public async Task ChangePassword_PasswordErrata_Restituisce400()
    {
        var token = await _fixture.LoginAsync();
        var client = _fixture.CreateAuthenticatedClient(token);

        var response = await client.PutAsync("/account/password",
            Json(new { currentPassword = "WrongPassword!", newPassword = "NewPassword@1" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("title", out _));
    }

    [Fact]
    public async Task ChangePassword_SenzaToken_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.PutAsync("/account/password",
            Json(new { currentPassword = "Admin@1234", newPassword = "NewPassword@1" }));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_NuovaPasswordTroppoCorta_Restituisce400()
    {
        var token = await _fixture.LoginAsync();
        var client = _fixture.CreateAuthenticatedClient(token);

        var response = await client.PutAsync("/account/password",
            Json(new { currentPassword = "Admin@1234", newPassword = "short" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_DopoReset_VecchiaPasswordNonFunziona()
    {
        var token = await _fixture.LoginAsync();
        var client = _fixture.CreateAuthenticatedClient(token);

        // Cambia password
        await client.PutAsync("/account/password",
            Json(new { currentPassword = "Admin@1234", newPassword = "Changed@E2E2" }));

        // Usa un nuovo client autenticato con il vecchio token (ancora valido)
        // ma prova a riusare la vecchia password → deve fallire
        var response = await client.PutAsync("/account/password",
            Json(new { currentPassword = "Admin@1234", newPassword = "AnotherNew@1" }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Ripristina
        var restoreToken = await _fixture.LoginAsync(password: "Changed@E2E2");
        var restoreClient = _fixture.CreateAuthenticatedClient(restoreToken);
        await restoreClient.PutAsync("/account/password",
            Json(new { currentPassword = "Changed@E2E2", newPassword = "Admin@1234" }));
    }
}
