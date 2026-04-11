using System.Net;
using System.Text;
using System.Text.Json;
using Api.E2E.Helpers;

namespace Api.E2E.Programs;

public class ProgramsE2ETests : IClassFixture<ApiE2EFixture>
{
    private readonly ApiE2EFixture _fixture;
    private readonly string _token;

    public ProgramsE2ETests(ApiE2EFixture fixture)
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

        var response = await client.GetAsync("/programs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task Create_CodiceValido_Restituisce201()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body = Json(new
        {
            code = "PROG_E2E_001",
            name = "Programma E2E Test",
            description = "Creato da test E2E"
        });

        var response = await client.PostAsync("/programs", body);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("code", out var code));
        Assert.Equal("PROG_E2E_001", code.GetString());
    }

    [Fact]
    public async Task Create_CodiceDuplicato_Restituisce409()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        // Prima creazione
        var body1 = Json(new { code = "PROG_DUP_TEST", name = "Primo", description = (string?)null });
        await client.PostAsync("/programs", body1);

        // Seconda creazione con stesso codice
        var body2 = Json(new { code = "PROG_DUP_TEST", name = "Secondo", description = (string?)null });
        var response = await client.PostAsync("/programs", body2);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task AssignAndRevoke_ProgrammaAdUtente_FunzionaCicloCompleto()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);

        // Crea programma
        var createBody = Json(new { code = "PROG_ASSIGN_TEST", name = "Programma Assegnazione", description = (string?)null });
        var createResponse = await client.PostAsync("/programs", createBody);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createJson = await createResponse.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var programId = createDoc.RootElement.GetProperty("id").GetInt32();

        // Assegna programma all'utente 1
        var assignBody = Json(new { programIds = new[] { programId } });
        var assignResponse = await client.PostAsync("/users/1/programs", assignBody);
        Assert.Equal(HttpStatusCode.OK, assignResponse.StatusCode);

        // Revoca programma dall'utente 1
        var revokeBody = Json(new { programIds = new[] { programId } });
        var revokeRequest = new HttpRequestMessage(HttpMethod.Delete, "/users/1/programs")
        {
            Content = Json(new { programIds = new[] { programId } })
        };
        var revokeResponse = await client.SendAsync(revokeRequest);
        Assert.Equal(HttpStatusCode.NoContent, revokeResponse.StatusCode);
    }

    [Fact]
    public async Task Create_CodiceLowercase_Restituisce400()
    {
        var client = _fixture.CreateAuthenticatedClient(_token);
        var body = Json(new { code = "prog_minuscolo", name = "Test Lowercase", description = (string?)null });

        var response = await client.PostAsync("/programs", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
