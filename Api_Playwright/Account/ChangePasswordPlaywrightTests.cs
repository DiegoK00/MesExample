using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Account;

public class ChangePasswordPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public ChangePasswordPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    [Fact]
    public async Task ChangePassword_PasswordCorretta_Restituisce204()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PutAsync("/account/password", new APIRequestContextOptions
        {
            DataObject = new { currentPassword = "Admin@1234", newPassword = "Changed@PW1" }
        });

        Assert.Equal(204, response.Status);

        // Ripristina
        var restoreToken = await _fixture.LoginAsync(password: "Changed@PW1");
        var restoreCtx = await _fixture.CreateAuthenticatedContextAsync(restoreToken);
        await restoreCtx.PutAsync("/account/password", new APIRequestContextOptions
        {
            DataObject = new { currentPassword = "Changed@PW1", newPassword = "Admin@1234" }
        });

        await ctx.DisposeAsync();
        await restoreCtx.DisposeAsync();
    }

    [Fact]
    public async Task ChangePassword_PasswordErrata_Restituisce400ConProblemDetails()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PutAsync("/account/password", new APIRequestContextOptions
        {
            DataObject = new { currentPassword = "WrongPassword!", newPassword = "NewPassword@1" }
        });

        Assert.Equal(400, response.Status);

        var contentType = response.Headers["content-type"];
        Assert.Contains("json", contentType); // accetta application/json e application/problem+json

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(doc.RootElement.TryGetProperty("title", out var title));
        Assert.False(string.IsNullOrWhiteSpace(title.GetString()));

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task ChangePassword_SenzaToken_Restituisce401()
    {
        var response = await _fixture.Request.PutAsync("/account/password", new APIRequestContextOptions
        {
            DataObject = new { currentPassword = "Admin@1234", newPassword = "NewPassword@1" }
        });

        Assert.Equal(401, response.Status);
    }

    [Fact]
    public async Task ChangePassword_NuovaPasswordTroppoCorta_Restituisce400()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PutAsync("/account/password", new APIRequestContextOptions
        {
            DataObject = new { currentPassword = "Admin@1234", newPassword = "short" }
        });

        Assert.Equal(400, response.Status);

        await ctx.DisposeAsync();
    }
}
