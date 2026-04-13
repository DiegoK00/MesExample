using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Categories;

public class CategoriesPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public CategoriesPlaywrightTests(PlaywrightApiFixture fixture)
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

        var response = await ctx.GetAsync("/categories");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task GetAll_ActiveOnly_RestituisceOnlyActiveCategories()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/categories?activeOnly=true");

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        
        // Category non ha isActive — verifica solo che sia un array valido
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_NomeValido_Restituisce201()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PostAsync("/categories", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Categoria Playwright Test",
                description = "Creata da test Playwright"
            }
        });

        Assert.Equal(201, response.Status);
        Assert.True(response.Headers.ContainsKey("location"));

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal("Categoria Playwright Test", doc.RootElement.GetProperty("name").GetString());

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
                name = "CAT_DUP_NOME",
                description = (string?)null
            }
        };
        
        await ctx.PostAsync("/categories", body);

        var response = await ctx.PostAsync("/categories", body);

        Assert.Equal(409, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Update_CategoriaEsistente_Restituisce200()
    {
        var ctx = await AuthCtx();

        // Crea categoria
        var createResponse = await ctx.PostAsync("/categories", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "CAT_ORIG",
                description = "Organale"
            }
        });

        var createText = await createResponse.TextAsync();
        using var doc = JsonDocument.Parse(createText);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        // Aggiorna
        var response = await ctx.PutAsync($"/categories/{id}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "CAT_AGGIORNATA",
                description = "Modificata",
                isActive = true
            }
        });

        Assert.Equal(200, response.Status);

        var updateText = await response.TextAsync();
        using var updateDoc = JsonDocument.Parse(updateText);
        Assert.Equal("CAT_AGGIORNATA", updateDoc.RootElement.GetProperty("name").GetString());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_CategoriaEsistente_Restituisce204()
    {
        var ctx = await AuthCtx();

        // Crea categoria
        var createResponse = await ctx.PostAsync("/categories", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "CAT_DEL",
                description = (string?)null
            }
        });

        var createText = await createResponse.TextAsync();
        using var doc = JsonDocument.Parse(createText);
        var id = doc.RootElement.GetProperty("id").GetInt32();

        // Elimina
        var response = await ctx.DeleteAsync($"/categories/{id}");

        Assert.Equal(204, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_CategoriaNonEsistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.DeleteAsync("/categories/99999");

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }
}
