using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Articles;

public class ArticlesPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public ArticlesPlaywrightTests(PlaywrightApiFixture fixture)
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

        var response = await ctx.GetAsync("/articles");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetAll_ActiveOnly_RestituisceOnlyActiveArticles()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/articles?activeOnly=true");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        
        // Se ci sono articoli, tutti devono avere isActive = true
        if (doc.RootElement.GetArrayLength() > 0)
        {
            foreach (var item in doc.RootElement.EnumerateArray())
            {
                Assert.True(item.GetProperty("isActive").GetBoolean());
            }
        }

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_DatiValidi_Restituisce201ConBodyCorretto()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "ART_PW_001",
                name = "Articolo Playwright",
                description = "Creato da test Playwright",
                categoryId = 1,
                umId = 1,
                price = 99.95m
            }
        });

        Assert.Equal(201, response.Status);
        Assert.True(response.Headers.ContainsKey("location"));

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("ART_PW_001", doc.RootElement.GetProperty("code").GetString());
        Assert.Equal("Articolo Playwright", doc.RootElement.GetProperty("name").GetString());
        Assert.True(doc.RootElement.GetProperty("isActive").GetBoolean());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_CodiceDuplicato_Restituisce409()
    {
        var ctx = await AuthCtx();

        var body = new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "ART_DUP",
                name = "Articolo Duplicato",
                description = (string?)null,
                categoryId = 1,
                umId = 1,
                price = 50m
            }
        };
        
        await ctx.PostAsync("/articles", body);

        var response = await ctx.PostAsync("/articles", body);

        Assert.Equal(409, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Update_DatiValidi_Restituisce200()
    {
        var ctx = await AuthCtx();

        // Crea un articolo
        var createResponse = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "ART_UPD_TEST",
                name = "Originale",
                description = "Da aggiornare",
                categoryId = 1,
                umId = 1,
                price = 50m
            }
        });

        var createText = await createResponse.TextAsync();
        using var doc = JsonDocument.Parse(createText);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        // Aggiorna
        var response = await ctx.PutAsync($"/articles/{id}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Aggiornato",
                description = "Modificato",
                categoryId = 1,
                umId = 1,
                price = 75m,
                isActive = true
            }
        });

        Assert.Equal(200, response.Status);

        var updateText = await response.TextAsync();
        using var updateDoc = JsonDocument.Parse(updateText);
        Assert.Equal("Aggiornato", updateDoc.RootElement.GetProperty("name").GetString());
        Assert.Equal(75, updateDoc.RootElement.GetProperty("price").GetDecimal());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_ArticoloEsistente_Restituisce204()
    {
        var ctx = await AuthCtx();

        // Crea un articolo per eliminarlo
        var createResponse = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = "ART_DEL_TEST",
                name = "Da eliminare",
                description = (string?)null,
                categoryId = 1,
                umId = 1,
                price = 30m
            }
        });

        var createText = await createResponse.TextAsync();
        using var doc = JsonDocument.Parse(createText);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        // Elimina
        var response = await ctx.DeleteAsync($"/articles/{id}");

        Assert.Equal(204, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_ArticoloNonEsistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.DeleteAsync("/articles/99999");

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }
}
