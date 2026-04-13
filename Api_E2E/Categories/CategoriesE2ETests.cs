using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Categories;

public class CategoriesE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public CategoriesE2ETests(ApiE2EFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private StringContent Json(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    [Fact]
    public async Task GetAll_Autenticato_RestituisceArray()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.GetAsync("/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task GetAll_NonAutenticato_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/categories");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_NomeValido_Restituisce201()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body = Json(new { name = "Categoria E2E Test", description = "Creata da test" });

        var response = await client.PostAsync("/categories", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("name", out var name));
        Assert.Equal("Categoria E2E Test", name.GetString());
    }

    [Fact]
    public async Task Create_NomeDuplicato_Restituisce409()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body1 = Json(new { name = "CAT_DUP_TEST", description = (string?)null });
        await client.PostAsync("/categories", body1);

        var body2 = Json(new { name = "CAT_DUP_TEST", description = (string?)null });
        var response = await client.PostAsync("/categories", body2);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_CategoriaEsistente_Restituisce200()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var createBody = Json(new { name = "CAT_UPDATE_TEST", description = (string?)null });
        var createResponse = await client.PostAsync("/categories", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        var updateBody = Json(new { name = "CAT_UPDATE_TEST_MOD", description = "Aggiornata" });
        var response = await client.PutAsync($"/categories/{id}", updateBody);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("CAT_UPDATE_TEST_MOD", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Delete_CategoriaEsistente_Restituisce204()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var createBody = Json(new { name = "CAT_DELETE_TEST", description = (string?)null });
        var createResponse = await client.PostAsync("/categories", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        var response = await client.DeleteAsync($"/categories/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_CategoriaNonEsistente_Restituisce404()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.DeleteAsync("/categories/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
