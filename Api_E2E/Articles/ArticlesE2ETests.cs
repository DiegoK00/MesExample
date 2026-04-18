using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Articles;

public class ArticlesE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public ArticlesE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    private async Task<(int categoryId, int umId)> CreateLookups(HttpClient client)
    {
        var catBody = Json(new { name = $"Cat_{Guid.NewGuid():N}", description = (string?)null });
        var catResponse = await client.PostAsync("/categories", catBody);
        catResponse.EnsureSuccessStatusCode();
        var catJson = await catResponse.Content.ReadAsStringAsync();
        using var catDoc = JsonDocument.Parse(catJson);
        var categoryId = catDoc.RootElement.GetProperty("id").GetInt32();

        var umBody = Json(new { name = $"UM_{Guid.NewGuid():N}", description = (string?)null });
        var umResponse = await client.PostAsync("/measure-units", umBody);
        umResponse.EnsureSuccessStatusCode();
        var umJson = await umResponse.Content.ReadAsStringAsync();
        using var umDoc = JsonDocument.Parse(umJson);
        var umId = umDoc.RootElement.GetProperty("id").GetInt32();

        return (categoryId, umId);
    }

    [Fact]
    public async Task GetAll_Autenticato_RestituisceArray()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/articles");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task GetAll_NonAutenticato_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/articles");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_ArticoloValido_Restituisce201()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (catId, umId) = await CreateLookups(client);

        var body = Json(new
        {
            code = $"ART_E2E_{Guid.NewGuid():N}",
            name = "Articolo E2E",
            description = "Test E2E",
            categoryId = catId,
            price = 15.99,
            uMId = umId
        });

        var response = await client.PostAsync("/articles", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Articolo E2E", doc.RootElement.GetProperty("name").GetString());
        Assert.True(doc.RootElement.GetProperty("isActive").GetBoolean());
    }

    [Fact]
    public async Task Create_CodiceDuplicato_Restituisce409()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (catId, umId) = await CreateLookups(client);
        var code = $"ART_DUP_{Guid.NewGuid():N}";

        var body1 = Json(new { code, name = "Primo", categoryId = catId, price = 10.0, uMId = umId });
        await client.PostAsync("/articles", body1);

        var body2 = Json(new { code, name = "Secondo", categoryId = catId, price = 10.0, uMId = umId });
        var response = await client.PostAsync("/articles", body2);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_ArticoloEsistente_Restituisce200()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (catId, umId) = await CreateLookups(client);

        var createBody = Json(new
        {
            code = $"ART_UPD_{Guid.NewGuid():N}",
            name = "Articolo da aggiornare",
            categoryId = catId,
            price = 10.0,
            uMId = umId
        });
        var createResponse = await client.PostAsync("/articles", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        var updateBody = Json(new
        {
            name = "Nome Aggiornato",
            categoryId = catId,
            price = 99.99,
            uMId = umId,
            isActive = true
        });
        var response = await client.PutAsync($"/articles/{id}", updateBody);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Nome Aggiornato", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Delete_ArticoloEsistente_SoftDeleteRestituisce200()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (catId, umId) = await CreateLookups(client);

        var createBody = Json(new
        {
            code = $"ART_DEL_{Guid.NewGuid():N}",
            name = "Articolo da eliminare",
            categoryId = catId,
            price = 5.0,
            uMId = umId
        });
        var createResponse = await client.PostAsync("/articles", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        var response = await client.DeleteAsync($"/articles/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ArticoloNonEsistente_Restituisce404()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.DeleteAsync("/articles/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_ActiveOnly_RestituiscesoloAttivi()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var (catId, umId) = await CreateLookups(client);

        // Create and delete one article
        var code = $"ART_AF_{Guid.NewGuid():N}";
        var createBody = Json(new { code, name = "Da eliminare", categoryId = catId, price = 5.0, uMId = umId });
        var createResponse = await client.PostAsync("/articles", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();
        await client.DeleteAsync($"/articles/{id}");

        var response = await client.GetAsync("/articles?activeOnly=true");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            Assert.True(item.GetProperty("isActive").GetBoolean());
        }
    }
}
