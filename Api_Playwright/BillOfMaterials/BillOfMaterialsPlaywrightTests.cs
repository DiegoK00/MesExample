using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.BillOfMaterials;

public class BillOfMaterialsPlaywrightTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public BillOfMaterialsPlaywrightTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    /// <summary>Crea un articolo usando Category Id=1 e MeasureUnit Id=1 (seeded in fixture).</summary>
    private async Task<int> CreateArticle(IAPIRequestContext ctx)
    {
        var response = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = $"ART_BOM_{Guid.NewGuid():N}",
                name = "BOM Test Article",
                categoryId = 1,
                price = 10m,
                umId = 1
            }
        });
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    // ── GET by-parent ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByParentArticle_ConToken_RestituisceArrayJson()
    {
        var ctx = await AuthCtx();
        var parentId = await CreateArticle(ctx);

        var response = await ctx.GetAsync($"/bill-of-materials/by-parent/{parentId}");

        Assert.Equal(200, response.Status);
        Assert.True(response.Headers["content-type"].Contains("application/json"));
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);

        await ctx.DisposeAsync();
    }

    // ── GET singolo ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSingle_NonEsistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.GetAsync("/bill-of-materials/99999/99999");

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }

    // ── POST create ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DatiValidi_Restituisce201ConLocationEBody()
    {
        var ctx = await AuthCtx();
        var parentId = await CreateArticle(ctx);
        var componentId = await CreateArticle(ctx);

        var response = await ctx.PostAsync("/bill-of-materials", new APIRequestContextOptions
        {
            DataObject = new
            {
                parentArticleId = parentId,
                componentArticleId = componentId,
                quantity = 2.5m,
                quantityType = "PHYSICAL",
                umId = 1,
                scrapPercentage = 5m,
                scrapFactor = 0m,
                fixedScrap = 0m
            }
        });

        Assert.Equal(201, response.Status);
        Assert.True(response.Headers.ContainsKey("location"));

        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(parentId, doc.RootElement.GetProperty("parentArticleId").GetInt32());
        Assert.Equal(componentId, doc.RootElement.GetProperty("componentArticleId").GetInt32());
        Assert.Equal(2.5m, doc.RootElement.GetProperty("quantity").GetDecimal());
        Assert.Equal("PHYSICAL", doc.RootElement.GetProperty("quantityType").GetString());
        Assert.Equal(5m, doc.RootElement.GetProperty("scrapPercentage").GetDecimal());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_Duplicato_Restituisce409ConProblemDetails()
    {
        var ctx = await AuthCtx();
        var parentId = await CreateArticle(ctx);
        var componentId = await CreateArticle(ctx);

        var body = new APIRequestContextOptions
        {
            DataObject = new
            {
                parentArticleId = parentId,
                componentArticleId = componentId,
                quantity = 1m,
                quantityType = "PHYSICAL",
                umId = 1,
                scrapPercentage = 0m,
                scrapFactor = 0m,
                fixedScrap = 0m
            }
        };

        await ctx.PostAsync("/bill-of-materials", body);
        var response = await ctx.PostAsync("/bill-of-materials", body);

        Assert.Equal(409, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.True(doc.RootElement.TryGetProperty("title", out _));

        await ctx.DisposeAsync();
    }

    // ── PUT update ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_DatiValidi_Restituisce200ConDatiAggiornati()
    {
        var ctx = await AuthCtx();
        var parentId = await CreateArticle(ctx);
        var componentId = await CreateArticle(ctx);

        await ctx.PostAsync("/bill-of-materials", new APIRequestContextOptions
        {
            DataObject = new
            {
                parentArticleId = parentId,
                componentArticleId = componentId,
                quantity = 1m,
                quantityType = "PHYSICAL",
                umId = 1,
                scrapPercentage = 0m,
                scrapFactor = 0m,
                fixedScrap = 0m
            }
        });

        var response = await ctx.PutAsync(
            $"/bill-of-materials/{parentId}/{componentId}",
            new APIRequestContextOptions
            {
                DataObject = new
                {
                    quantity = 4m,
                    quantityType = "PERCENTAGE",
                    umId = 1,
                    scrapPercentage = 15m,
                    scrapFactor = 0m,
                    fixedScrap = 0m
                }
            });

        Assert.Equal(200, response.Status);
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        Assert.Equal(4m, doc.RootElement.GetProperty("quantity").GetDecimal());
        Assert.Equal("PERCENTAGE", doc.RootElement.GetProperty("quantityType").GetString());
        Assert.Equal(15m, doc.RootElement.GetProperty("scrapPercentage").GetDecimal());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Update_NonEsistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.PutAsync("/bill-of-materials/99999/99999",
            new APIRequestContextOptions
            {
                DataObject = new
                {
                    quantity = 1m,
                    quantityType = "PHYSICAL",
                    umId = 1,
                    scrapPercentage = 0m,
                    scrapFactor = 0m,
                    fixedScrap = 0m
                }
            });

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_Esistente_Restituisce204()
    {
        var ctx = await AuthCtx();
        var parentId = await CreateArticle(ctx);
        var componentId = await CreateArticle(ctx);

        await ctx.PostAsync("/bill-of-materials", new APIRequestContextOptions
        {
            DataObject = new
            {
                parentArticleId = parentId,
                componentArticleId = componentId,
                quantity = 1m,
                quantityType = "PHYSICAL",
                umId = 1,
                scrapPercentage = 0m,
                scrapFactor = 0m,
                fixedScrap = 0m
            }
        });

        var response = await ctx.DeleteAsync($"/bill-of-materials/{parentId}/{componentId}");

        Assert.Equal(204, response.Status);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Delete_NonEsistente_Restituisce404()
    {
        var ctx = await AuthCtx();

        var response = await ctx.DeleteAsync("/bill-of-materials/99999/99999");

        Assert.Equal(404, response.Status);

        await ctx.DisposeAsync();
    }
}
