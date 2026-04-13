using Api.DTOs.MeasureUnits;
using Api.Models;
using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class MeasureUnitServiceTests
{
    private static (MeasureUnitService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed("UM_" + dbName);
        var auditLog = new AuditLogService(db);
        return (new MeasureUnitService(db, auditLog), db);
    }

    private static async Task<MeasureUnit> AddUnit(Api.Data.AppDbContext db, string name = "PZ")
    {
        var unit = new MeasureUnit { Name = name, Description = "Pezzi" };
        db.MeasureUnits.Add(unit);
        await db.SaveChangesAsync();
        return unit;
    }

    // --- GetAllAsync ---

    [Fact]
    public async Task GetAllAsync_ReturnsAllUnits()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsAllUnits));
        await AddUnit(db, "KG");
        await AddUnit(db, "PZ");

        var result = await service.GetAllAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsOrderedByName()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsOrderedByName));
        await AddUnit(db, "MT");
        await AddUnit(db, "KG");

        var result = await service.GetAllAsync();

        Assert.Equal("KG", result[0].Name);
        Assert.Equal("MT", result[1].Name);
    }

    // --- GetByIdAsync ---

    [Fact]
    public async Task GetByIdAsync_ExistingUnit_ReturnsUnit()
    {
        var (service, db) = Build(nameof(GetByIdAsync_ExistingUnit_ReturnsUnit));
        var unit = await AddUnit(db);

        var result = await service.GetByIdAsync(unit.Id);

        Assert.NotNull(result);
        Assert.Equal("PZ", result.Name);
    }

    [Fact]
    public async Task GetByIdAsync_NonExisting_ReturnsNull()
    {
        var (service, _) = Build(nameof(GetByIdAsync_NonExisting_ReturnsNull));

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    // --- CreateAsync ---

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesUnit()
    {
        var (service, _) = Build(nameof(CreateAsync_ValidRequest_CreatesUnit));

        var (unit, error) = await service.CreateAsync(new CreateMeasureUnitRequest
        {
            Name = "KG",
            Description = "Chilogrammi"
        });

        Assert.Null(error);
        Assert.NotNull(unit);
        Assert.Equal("KG", unit.Name);
        Assert.Equal("Chilogrammi", unit.Description);
    }

    [Fact]
    public async Task CreateAsync_DuplicateName_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_DuplicateName_ReturnsError));
        await AddUnit(db, "PZ");

        var (unit, error) = await service.CreateAsync(new CreateMeasureUnitRequest { Name = "PZ" });

        Assert.Null(unit);
        Assert.Contains("PZ", error);
    }

    // --- UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesUnit()
    {
        var (service, db) = Build(nameof(UpdateAsync_ValidRequest_UpdatesUnit));
        var unit = await AddUnit(db);

        var (updated, error) = await service.UpdateAsync(unit.Id, new UpdateMeasureUnitRequest
        {
            Name = "PEZZI",
            Description = "Numero di pezzi"
        });

        Assert.Null(error);
        Assert.NotNull(updated);
        Assert.Equal("PEZZI", updated.Name);
        Assert.Equal("Numero di pezzi", updated.Description);
    }

    [Fact]
    public async Task UpdateAsync_NonExisting_ReturnsNulls()
    {
        var (service, _) = Build(nameof(UpdateAsync_NonExisting_ReturnsNulls));

        var (unit, error) = await service.UpdateAsync(999, new UpdateMeasureUnitRequest { Name = "X" });

        Assert.Null(unit);
        Assert.Null(error);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateName_ReturnsError()
    {
        var (service, db) = Build(nameof(UpdateAsync_DuplicateName_ReturnsError));
        await AddUnit(db, "KG");
        var other = await AddUnit(db, "MT");

        var (updated, error) = await service.UpdateAsync(other.Id, new UpdateMeasureUnitRequest { Name = "KG" });

        Assert.Null(updated);
        Assert.Contains("KG", error);
    }

    // --- DeleteAsync ---

    [Fact]
    public async Task DeleteAsync_UnitWithNoArticles_DeletesAndReturnsTrue()
    {
        var (service, db) = Build(nameof(DeleteAsync_UnitWithNoArticles_DeletesAndReturnsTrue));
        var unit = await AddUnit(db);

        var result = await service.DeleteAsync(unit.Id);

        Assert.True(result);
        Assert.Null(await service.GetByIdAsync(unit.Id));
    }

    [Fact]
    public async Task DeleteAsync_NonExisting_ReturnsFalse()
    {
        var (service, _) = Build(nameof(DeleteAsync_NonExisting_ReturnsFalse));

        var result = await service.DeleteAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_UnitUsedAsUM_ThrowsInvalidOperation()
    {
        var (service, db) = Build(nameof(DeleteAsync_UnitUsedAsUM_ThrowsInvalidOperation));
        var unit = await AddUnit(db, "PZ");

        var category = new Category { Name = "Test" };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        db.Articles.Add(new Article
        {
            Code = "ART001",
            Name = "Articolo",
            CategoryId = category.Id,
            Price = 5.0m,
            UMId = unit.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.DeleteAsync(unit.Id));
    }

    [Fact]
    public async Task DeleteAsync_UnitUsedAsUM2_ThrowsInvalidOperation()
    {
        var (service, db) = Build(nameof(DeleteAsync_UnitUsedAsUM2_ThrowsInvalidOperation));
        var um1 = await AddUnit(db, "PZ");
        var um2 = await AddUnit(db, "MT");

        var category = new Category { Name = "Test" };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        db.Articles.Add(new Article
        {
            Code = "ART002",
            Name = "Articolo",
            CategoryId = category.Id,
            Price = 5.0m,
            UMId = um1.Id,
            UM2Id = um2.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.DeleteAsync(um2.Id));
    }
}
