using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.MeasureUnits;

public class MeasureUnitsE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public MeasureUnitsE2ETests(ApiE2EFixture fixture)
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

        var response = await client.GetAsync("/measure-units");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task GetAll_NonAutenticato_Restituisce401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/measure-units");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Create_NomeValido_Restituisce201()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body = Json(new { name = "PZ_E2E", description = "Pezzi E2E" });

        var response = await client.PostAsync("/measure-units", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("PZ_E2E", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Create_NomeDuplicato_Restituisce409()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body1 = Json(new { name = "UM_DUP_TEST", description = (string?)null });
        await client.PostAsync("/measure-units", body1);

        var body2 = Json(new { name = "UM_DUP_TEST", description = (string?)null });
        var response = await client.PostAsync("/measure-units", body2);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_UnitaEsistente_Restituisce200()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var createBody = Json(new { name = "UM_UPDATE_TEST", description = (string?)null });
        var createResponse = await client.PostAsync("/measure-units", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        var updateBody = Json(new { name = "UM_UPDATE_MOD", description = "Aggiornata" });
        var response = await client.PutAsync($"/measure-units/{id}", updateBody);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("UM_UPDATE_MOD", doc.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Delete_UnitaEsistente_Restituisce204()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var createBody = Json(new { name = "UM_DELETE_TEST", description = (string?)null });
        var createResponse = await client.PostAsync("/measure-units", createBody);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var id = createDoc.RootElement.GetProperty("id").GetInt32();

        var response = await client.DeleteAsync($"/measure-units/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_UnitaNonEsistente_Restituisce404()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        var response = await client.DeleteAsync("/measure-units/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
