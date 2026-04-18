using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.BillOfMaterials;

public class BillOfMaterialsE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public BillOfMaterialsE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    /// <summary>Crea categoria, UM e articolo — restituisce (articleId, umId).</summary>
    private async Task<(int articleId, int umId)> CreateArticleWithUm(HttpClient client)
    {
        var catRes = await client.PostAsync("/categories",
            Json(new { name = $"Cat_{Guid.NewGuid():N}", description = (string?)null }));
        catRes.EnsureSuccessStatusCode();
        var catId = JsonDocument.Parse(await catRes.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetInt32();

        var umRes = await client.PostAsync("/measure-units",
            Json(new { name = $"UM_{Guid.NewGuid():N}", description = (string?)null }));
        umRes.EnsureSuccessStatusCode();
        var umId = JsonDocument.Parse(await umRes.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetInt32();

        var artRes = await client.PostAsync("/articles", Json(new
        {
            code = $"ART_{Guid.NewGuid():N}",
            name = "Test Article",
            categoryId = catId,
            price = 10.0m,
            uMId = umId
        }));
        artRes.EnsureSuccessStatusCode();
        var artId = JsonDocument.Parse(await artRes.Content.ReadAsStringAsync())
            .RootElement.GetProperty("id").GetInt32();

        return (artId, umId);
    }

    // ── GET by-parent ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByParentArticle_SenzaToken_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/bill-of-materials/by-parent/1");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetByParentArticle_ConToken_RestituisceArrayVuoto()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (parentId, _) = await CreateArticleWithUm(client);

        var response = await client.GetAsync($"/bill-of-materials/by-parent/{parentId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    // ── GET singolo ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSingle_NonEsistente_Restituisce404()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/bill-of-materials/99999/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── POST create ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_DatiValidi_Restituisce201ConLocation()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (parentId, umId) = await CreateArticleWithUm(client);
        var (componentId, _) = await CreateArticleWithUm(client);

        var response = await client.PostAsync("/bill-of-materials", Json(new
        {
            parentArticleId = parentId,
            componentArticleId = componentId,
            quantity = 2.5m,
            quantityType = "PHYSICAL",
            umId,
            scrapPercentage = 5m,
            scrapFactor = 0m,
            fixedScrap = 0m
        }));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(parentId, doc.RootElement.GetProperty("parentArticleId").GetInt32());
        Assert.Equal(componentId, doc.RootElement.GetProperty("componentArticleId").GetInt32());
        Assert.Equal(2.5m, doc.RootElement.GetProperty("quantity").GetDecimal());
        Assert.Equal("PHYSICAL", doc.RootElement.GetProperty("quantityType").GetString());
        Assert.Equal(5m, doc.RootElement.GetProperty("scrapPercentage").GetDecimal());
    }

    [Fact]
    public async Task Create_SenzaToken_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.PostAsync("/bill-of-materials", Json(new
        {
            parentArticleId = 1,
            componentArticleId = 2,
            quantity = 1m,
            quantityType = "PHYSICAL",
            umId = 1,
            scrapPercentage = 0m,
            scrapFactor = 0m,
            fixedScrap = 0m
        }));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_Duplicato_Restituisce409()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (parentId, umId) = await CreateArticleWithUm(client);
        var (componentId, _) = await CreateArticleWithUm(client);

        var body = Json(new
        {
            parentArticleId = parentId,
            componentArticleId = componentId,
            quantity = 1m,
            quantityType = "PHYSICAL",
            umId,
            scrapPercentage = 0m,
            scrapFactor = 0m,
            fixedScrap = 0m
        });

        await client.PostAsync("/bill-of-materials", body);
        var response = await client.PostAsync("/bill-of-materials", body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    // ── PUT update ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_DatiValidi_Restituisce200ConDatiAggiornati()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (parentId, umId) = await CreateArticleWithUm(client);
        var (componentId, _) = await CreateArticleWithUm(client);

        await client.PostAsync("/bill-of-materials", Json(new
        {
            parentArticleId = parentId,
            componentArticleId = componentId,
            quantity = 1m,
            quantityType = "PHYSICAL",
            umId,
            scrapPercentage = 0m,
            scrapFactor = 0m,
            fixedScrap = 0m
        }));

        var response = await client.PutAsync(
            $"/bill-of-materials/{parentId}/{componentId}",
            Json(new
            {
                quantity = 3.5m,
                quantityType = "PERCENTAGE",
                umId,
                scrapPercentage = 10m,
                scrapFactor = 0m,
                fixedScrap = 0m
            }));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(3.5m, doc.RootElement.GetProperty("quantity").GetDecimal());
        Assert.Equal("PERCENTAGE", doc.RootElement.GetProperty("quantityType").GetString());
        Assert.Equal(10m, doc.RootElement.GetProperty("scrapPercentage").GetDecimal());
    }

    [Fact]
    public async Task Update_NonEsistente_Restituisce404()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.PutAsync("/bill-of-materials/99999/99999", Json(new
        {
            quantity = 1m,
            quantityType = "PHYSICAL",
            umId = 1,
            scrapPercentage = 0m,
            scrapFactor = 0m,
            fixedScrap = 0m
        }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_Esistente_Restituisce204()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (parentId, umId) = await CreateArticleWithUm(client);
        var (componentId, _) = await CreateArticleWithUm(client);

        await client.PostAsync("/bill-of-materials", Json(new
        {
            parentArticleId = parentId,
            componentArticleId = componentId,
            quantity = 1m,
            quantityType = "PHYSICAL",
            umId,
            scrapPercentage = 0m,
            scrapFactor = 0m,
            fixedScrap = 0m
        }));

        var response = await client.DeleteAsync($"/bill-of-materials/{parentId}/{componentId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_NonEsistente_Restituisce404()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.DeleteAsync("/bill-of-materials/99999/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
