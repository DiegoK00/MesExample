using System.Text.Json;
using Api.Playwright.Helpers;
using Microsoft.Playwright;

namespace Api.Playwright.Common;

/// <summary>
/// Cross-layer edge case tests: Article lifecycle, FK validation, concurrency,
/// category rename propagation, UM2, audit log trail.
/// </summary>
public class ArticleEdgeCaseTests : IClassFixture<PlaywrightApiFixture>
{
    private readonly PlaywrightApiFixture _fixture;
    private readonly string _token;

    public ArticleEdgeCaseTests(PlaywrightApiFixture fixture)
    {
        _fixture = fixture;
        _token = fixture.LoginAsync().GetAwaiter().GetResult();
    }

    private async Task<IAPIRequestContext> AuthCtx() =>
        await _fixture.CreateAuthenticatedContextAsync(_token);

    /// Genera un suffisso univoco di 8 caratteri hex.
    private static string Id() => Guid.NewGuid().ToString("N")[..8].ToUpper();

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<int> CreateCategoryAsync(IAPIRequestContext ctx, string name)
    {
        var resp = await ctx.PostAsync("/categories", new APIRequestContextOptions
        {
            DataObject = new { name, description = (string?)null }
        });
        Assert.Equal(201, resp.Status);
        var text = await resp.TextAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    private async Task<int> CreateMeasureUnitAsync(IAPIRequestContext ctx, string name)
    {
        var resp = await ctx.PostAsync("/measure-units", new APIRequestContextOptions
        {
            DataObject = new { name }
        });
        Assert.Equal(201, resp.Status);
        var text = await resp.TextAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.GetProperty("id").GetInt32();
    }

    private async Task<(int id, string code)> CreateArticleAsync(
        IAPIRequestContext ctx, int categoryId, int umId, int? um2Id = null)
    {
        var code = $"ART_EC_{Id()}";
        var resp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code,
                name = $"Articolo {code}",
                categoryId,
                umId,
                um2Id,
                price = 10.0
            }
        });
        Assert.Equal(201, resp.Status);
        var text = await resp.TextAsync();
        using var doc = JsonDocument.Parse(text);
        return (doc.RootElement.GetProperty("id").GetInt32(), code);
    }

    // ── LIFECYCLE ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Lifecycle_CreateSoftDeleteReactivate_StateTransitionsCorrect()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_LC_{Id()}");
        var umId  = await CreateMeasureUnitAsync(ctx, $"UM_LC_{Id()}");
        var (artId, _) = await CreateArticleAsync(ctx, catId, umId);

        // Verifica stato iniziale: isActive = true
        var getResp = await ctx.GetAsync($"/articles/{artId}");
        Assert.Equal(200, getResp.Status);
        using var getDoc = JsonDocument.Parse(await getResp.TextAsync());
        Assert.True(getDoc.RootElement.GetProperty("isActive").GetBoolean());
        Assert.Equal(JsonValueKind.Null, getDoc.RootElement.GetProperty("deletedAt").ValueKind);

        // Soft delete → 204 NoContent (il controller usa NoContent())
        var delResp = await ctx.DeleteAsync($"/articles/{artId}");
        Assert.Equal(204, delResp.Status);

        // Verifica via GetById che isActive sia false
        var afterDelResp = await ctx.GetAsync($"/articles/{artId}");
        Assert.Equal(200, afterDelResp.Status);
        using var afterDelDoc = JsonDocument.Parse(await afterDelResp.TextAsync());
        Assert.False(afterDelDoc.RootElement.GetProperty("isActive").GetBoolean());
        Assert.NotEqual(JsonValueKind.Null, afterDelDoc.RootElement.GetProperty("deletedAt").ValueKind);

        // Riattiva tramite PUT con isActive = true
        var reactivateResp = await ctx.PutAsync($"/articles/{artId}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Riattivato",
                categoryId = catId,
                umId,
                price = 10.0,
                isActive = true
            }
        });
        Assert.Equal(200, reactivateResp.Status);
        using var reactivateDoc = JsonDocument.Parse(await reactivateResp.TextAsync());
        Assert.True(reactivateDoc.RootElement.GetProperty("isActive").GetBoolean());

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task ActiveOnlyFilter_ExcludesDeletedArticles()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_AF_{Id()}");
        var umId  = await CreateMeasureUnitAsync(ctx, $"UM_AF_{Id()}");
        var (artId, code) = await CreateArticleAsync(ctx, catId, umId);

        // Soft delete (204)
        var del = await ctx.DeleteAsync($"/articles/{artId}");
        Assert.Equal(204, del.Status);

        // GetAll senza filtro: l'articolo è presente con isActive=false
        var allResp = await ctx.GetAsync("/articles");
        var allText = await allResp.TextAsync();
        using var allDoc = JsonDocument.Parse(allText);
        var found = allDoc.RootElement.EnumerateArray()
            .Any(a => a.GetProperty("code").GetString() == code);
        Assert.True(found, "Articolo eliminato deve essere visibile senza filtro");

        // GetAll activeOnly=true: l'articolo NON compare
        var activeResp = await ctx.GetAsync("/articles?activeOnly=true");
        var activeText = await activeResp.TextAsync();
        using var activeDoc = JsonDocument.Parse(activeText);
        var foundActive = activeDoc.RootElement.EnumerateArray()
            .Any(a => a.GetProperty("code").GetString() == code);
        Assert.False(foundActive, "Articolo eliminato non deve comparire con activeOnly=true");

        await ctx.DisposeAsync();
    }

    // ── FK VALIDATION ────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_InvalidCategoryId_Returns409WithMessage()
    {
        var ctx = await AuthCtx();
        var umId = await CreateMeasureUnitAsync(ctx, $"UM_FK_{Id()}");

        var resp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = $"ART_FK_CAT_{Id()}",
                name = "Articolo FK test",
                categoryId = 99999,
                umId,
                price = 5.0
            }
        });

        Assert.Equal(409, resp.Status);
        var text = await resp.TextAsync();
        Assert.Contains("99999", text); // messaggio include l'id non trovato

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_InvalidUMId_Returns409WithMessage()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_FK_{Id()}");

        var resp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = $"ART_FK_UM_{Id()}",
                name = "Articolo UM test",
                categoryId = catId,
                umId = 99998,
                price = 5.0
            }
        });

        Assert.Equal(409, resp.Status);
        var text = await resp.TextAsync();
        Assert.Contains("99998", text);

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Create_InvalidUM2Id_Returns409WithMessage()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_FK2_{Id()}");
        var umId  = await CreateMeasureUnitAsync(ctx, $"UM_FK2_{Id()}");

        var resp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = $"ART_FK_UM2_{Id()}",
                name = "Articolo UM2 test",
                categoryId = catId,
                umId,
                um2Id = 99997,
                price = 5.0
            }
        });

        Assert.Equal(409, resp.Status);
        var text = await resp.TextAsync();
        Assert.Contains("99997", text);

        await ctx.DisposeAsync();
    }

    // ── CATEGORY RENAME PROPAGATION ──────────────────────────────────────────

    [Fact]
    public async Task CategoryRename_ReflectedInArticleResponse()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_ORIG_{Id()}");
        var umId  = await CreateMeasureUnitAsync(ctx, $"UM_CR_{Id()}");
        var (artId, _) = await CreateArticleAsync(ctx, catId, umId);

        // Rinomina la categoria
        const string newCatName = "Categoria Rinominata";
        var updateCatResp = await ctx.PutAsync($"/categories/{catId}", new APIRequestContextOptions
        {
            DataObject = new { name = newCatName, description = (string?)null }
        });
        Assert.Equal(200, updateCatResp.Status);

        // L'articolo deve mostrare il nuovo nome categoria
        var artResp = await ctx.GetAsync($"/articles/{artId}");
        Assert.Equal(200, artResp.Status);
        using var artDoc = JsonDocument.Parse(await artResp.TextAsync());
        Assert.Equal(newCatName, artDoc.RootElement.GetProperty("categoryName").GetString());

        await ctx.DisposeAsync();
    }

    // ── UM2 FLOW ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task UM2_CreateWithBothUnits_ResponseHasBothNames()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_UM2_{Id()}");
        var um1Id = await CreateMeasureUnitAsync(ctx, $"UM1_{Id()}");
        var um2Id = await CreateMeasureUnitAsync(ctx, $"UM2_{Id()}");

        var resp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new
            {
                code = $"ART_UM2_{Id()}",
                name = "Articolo con UM2",
                categoryId = catId,
                umId = um1Id,
                um2Id,
                price = 20.0
            }
        });

        Assert.Equal(201, resp.Status);
        var respText = await resp.TextAsync();
        using var doc = JsonDocument.Parse(respText);

        // Individua la chiave UM effettiva nel JSON (può essere umId o uMId secondo config)
        var props = doc.RootElement.EnumerateObject().Select(p => p.Name).ToList();
        var umKey  = props.FirstOrDefault(p => p.Equals("umId",  StringComparison.OrdinalIgnoreCase)) ?? "umId";
        var um2Key = props.FirstOrDefault(p => p.Equals("um2Id", StringComparison.OrdinalIgnoreCase)) ?? "um2Id";
        var umNameKey  = props.FirstOrDefault(p => p.Equals("umName",  StringComparison.OrdinalIgnoreCase)) ?? "umName";
        var um2NameKey = props.FirstOrDefault(p => p.Equals("um2Name", StringComparison.OrdinalIgnoreCase)) ?? "um2Name";

        Assert.Equal(um1Id, doc.RootElement.GetProperty(umKey).GetInt32());
        Assert.Equal(um2Id, doc.RootElement.GetProperty(um2Key).GetInt32());
        Assert.False(string.IsNullOrEmpty(doc.RootElement.GetProperty(umNameKey).GetString()));
        Assert.False(string.IsNullOrEmpty(doc.RootElement.GetProperty(um2NameKey).GetString()));

        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task UM2_UpdateRemovesSecondUnit_Um2NameBecomesNull()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_RM2_{Id()}");
        var um1Id = await CreateMeasureUnitAsync(ctx, $"UM1_RM_{Id()}");
        var um2Id = await CreateMeasureUnitAsync(ctx, $"UM2_RM_{Id()}");
        var (artId, _) = await CreateArticleAsync(ctx, catId, um1Id, um2Id);

        // Update: rimuovi UM2 passando um2Id = null
        var updateResp = await ctx.PutAsync($"/articles/{artId}", new APIRequestContextOptions
        {
            DataObject = new
            {
                name = "Aggiornato senza UM2",
                categoryId = catId,
                umId = um1Id,
                um2Id = (int?)null,
                price = 10.0,
                isActive = true
            }
        });
        Assert.Equal(200, updateResp.Status);
        using var doc = JsonDocument.Parse(await updateResp.TextAsync());
        var props = doc.RootElement.EnumerateObject().Select(p => p.Name).ToList();
        var um2Key     = props.First(p => p.Equals("um2Id",   StringComparison.OrdinalIgnoreCase));
        var um2NameKey = props.First(p => p.Equals("um2Name", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty(um2Key).ValueKind);
        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty(um2NameKey).ValueKind);

        await ctx.DisposeAsync();
    }

    // ── CONCURRENCY ──────────────────────────────────────────────────────────

    [Fact]
    public async Task ConcurrentCreate_SameCode_ExactlyOneSucceeds()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_CC_{Id()}");
        var umId  = await CreateMeasureUnitAsync(ctx, $"UM_CC_{Id()}");
        var sharedCode = $"ART_RACE_{Id()}";

        var payload = new APIRequestContextOptions
        {
            DataObject = new
            {
                code = sharedCode,
                name = "Articolo race condition",
                categoryId = catId,
                umId,
                price = 5.0
            }
        };

        // Lancia 3 POST simultanee con lo stesso codice
        var tasks = new[]
        {
            ctx.PostAsync("/articles", payload),
            ctx.PostAsync("/articles", payload),
            ctx.PostAsync("/articles", payload),
        };
        var results = await Task.WhenAll(tasks);

        var statuses = results.Select(r => r.Status).ToList();
        Assert.Equal(1, statuses.Count(s => s == 201));   // esattamente una creazione
        Assert.Equal(2, statuses.Count(s => s == 409));   // le altre due in conflitto

        await ctx.DisposeAsync();
    }

    // ── CODE CASE SENSITIVITY ────────────────────────────────────────────────

    [Fact]
    public async Task CodeCaseSensitivity_SameLettersDifferentCase_BothAccepted()
    {
        var ctx = await AuthCtx();
        var catId = await CreateCategoryAsync(ctx, $"Cat_CS_{Id()}");
        var umId  = await CreateMeasureUnitAsync(ctx, $"UM_CS_{Id()}");
        var baseCode = $"ART_CASE_{Id()}";

        var upperResp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new { code = baseCode.ToUpper(), name = "Uppercase", categoryId = catId, umId, price = 5.0 }
        });
        var lowerResp = await ctx.PostAsync("/articles", new APIRequestContextOptions
        {
            DataObject = new { code = baseCode.ToLower(), name = "Lowercase", categoryId = catId, umId, price = 5.0 }
        });

        // Il codice è case-sensitive → entrambi devono essere accettati (201)
        Assert.Equal(201, upperResp.Status);
        Assert.Equal(201, lowerResp.Status);

        await ctx.DisposeAsync();
    }

    // ── AUDIT LOG TRAIL ──────────────────────────────────────────────────────

    [Fact]
    public async Task AuditLog_ArticleLifecycle_GeneratesExpectedEntries()
    {
        var adminCtx = await AuthCtx();
        var catId = await CreateCategoryAsync(adminCtx, $"Cat_AL_{Id()}");
        var umId  = await CreateMeasureUnitAsync(adminCtx, $"UM_AL_{Id()}");
        var (artId, _) = await CreateArticleAsync(adminCtx, catId, umId);

        // Update
        await adminCtx.PutAsync($"/articles/{artId}", new APIRequestContextOptions
        {
            DataObject = new { name = "Aggiornato", categoryId = catId, umId, price = 99.0, isActive = true }
        });

        // Delete (soft)
        await adminCtx.DeleteAsync($"/articles/{artId}");

        // Leggi audit log filtrato per azione article
        var logsResp = await adminCtx.GetAsync("/audit-logs?action=article.created&pageSize=50");
        Assert.Equal(200, logsResp.Status);
        using var logsDoc = JsonDocument.Parse(await logsResp.TextAsync());
        var items = logsDoc.RootElement.GetProperty("items");
        Assert.True(items.GetArrayLength() >= 1, "Almeno un article.created deve essere nei log");

        await adminCtx.DisposeAsync();
    }
}
