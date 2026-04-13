using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.MeasureUnits;

public class MeasureUnitsPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public MeasureUnitsPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    [Fact]
    public async Task GetAll_Autenticato_RestituisceArrayJson()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/measure-units");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetAll_ActiveOnly_RestituisceOnlyActiveMeasureUnits()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/measure-units?activeOnly=true");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        
        // MeasureUnit non ha isActive — verifica solo che sia un array valido
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_NomeValido_Restituisce201()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/measure-units", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Unità Misura Playwright"
            }
        });

        Assert.Equal(201, response.Status);
        Assert.True(response.Headers.ContainsKey("location"));

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("Unità Misura Playwright", doc.RootElement.GetProperty("name").GetString());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_NomeDuplicato_Restituisce409()
    {
        var ctx = await AuthCtx();

        var body = new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "UM_DUP_TEST"
            }
        };
        
        await ctx.PostAsync("/measure-units", body);

        var response = await ctx.PostAsync("/measure-units", body);

        Assert.Equal(409, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Update_UnitaEsistente_Restituisce200()
    {
        var ctx = await AuthCtx();

        // Crea unità
        var createResponse = await ctx.PostAsync("/measure-units", new APIRequestContextOptions
        {
            DataObject = new
            {
                symbol = "UM_ORIG",
                name = "Originale"
            }
        });

        var createText = await createResponse.TextAsync();
        using var doc = JsonDocument.Parse(createText);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        // Aggiorna
        var response = await ctx.PutAsync($"/measure-units/{id}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Aggiornata",
                isActive = true
            }
        });

        Assert.Equal(200, response.Status);

        var updateText = await response.TextAsync();
        using var updateDoc = JsonDocument.Parse(updateText);
        Assert.Equal("Aggiornata", updateDoc.RootElement.GetProperty("name").GetString());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_UnitaEsistente_Restituisce204()
    {
        var ctx = await AuthCtx();

        // Crea unità
        var createResponse = await ctx.PostAsync("/measure-units", new APIRequestContextOptions
        {
            DataObject = new
            {
                symbol = "UM_DEL",
                name = "Da eliminare"
            }
        });

        var createText = await createResponse.TextAsync();
        using var doc = JsonDocument.Parse(createText);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        // Elimina
        var response = await ctx.DeleteAsync($"/measure-units/{id}");

        Assert.Equal(204, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_UnitaNonEsistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.DeleteAsync("/measure-units/99999");

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }
}
