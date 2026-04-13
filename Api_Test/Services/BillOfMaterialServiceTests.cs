using Api.DTOs.BillOfMaterials;
using Api.Models;
using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class BillOfMaterialServiceTests
{
    private static (BillOfMaterialService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed("BOM_" + dbName);
        var auditLog = new AuditLogService(db);
        return (new BillOfMaterialService(db, auditLog), db);
    }

    private static async Task<(Article parent, Article component, MeasureUnit um)> AddTestData(Api.Data.AppDbContext db)
    {
        var um = new MeasureUnit { Name = "PZ" };
        var parent = new Article
        {
            Code = "PAR001",
            Name = "Articolo Padre",
            Price = 100m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        };
        var component = new Article
        {
            Code = "COMP001",
            Name = "Componente",
            Price = 10m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        };

        db.MeasureUnits.Add(um);
        db.Articles.Add(parent);
        db.Articles.Add(component);
        await db.SaveChangesAsync();

        return (parent, component, um);
    }

    // --- GetByParentArticleAsync ---

    [Fact]
    public async Task GetByParentArticleAsync_NoResults_ReturnsEmptyList()
    {
        var (service, db) = Build(nameof(GetByParentArticleAsync_NoResults_ReturnsEmptyList));
        var (parent, _, _) = await AddTestData(db);

        var result = await service.GetByParentArticleAsync(parent.Id);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetByParentArticleAsync_WithResults_ReturnsBOMs()
    {
        var (service, db) = Build(nameof(GetByParentArticleAsync_WithResults_ReturnsBOMs));
        var (parent, component, um) = await AddTestData(db);

        var bom = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id,
            ScrapPercentage = 10m
        };
        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        var result = await service.GetByParentArticleAsync(parent.Id);

        Assert.Single(result);
        Assert.Equal(parent.Id, result[0].ParentArticleId);
        Assert.Equal(component.Id, result[0].ComponentArticleId);
        Assert.Equal(5, result[0].Quantity);
        Assert.Equal("PHYSICAL", result[0].QuantityType);
        Assert.Equal(10m, result[0].ScrapPercentage);
    }

    [Fact]
    public async Task GetByParentArticleAsync_MultipleBOMs_ReturnsSorted()
    {
        var (service, db) = Build(nameof(GetByParentArticleAsync_MultipleBOMs_ReturnsSorted));
        var (parent, component, um) = await AddTestData(db);

        var comp2 = new Article
        {
            Code = "COMP002",
            Name = "Componente 2",
            Price = 20m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        };
        db.Articles.Add(comp2);
        await db.SaveChangesAsync();

        var bom1 = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = comp2.Id,  // Higher ID
            Quantity = 3,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };
        var bom2 = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,  // Lower ID
            Quantity = 2,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };
        db.BillOfMaterials.Add(bom1);
        db.BillOfMaterials.Add(bom2);
        await db.SaveChangesAsync();

        var result = await service.GetByParentArticleAsync(parent.Id);

        Assert.Equal(2, result.Count);
        Assert.Equal(component.Id, result[0].ComponentArticleId);  // Lower ID first
        Assert.Equal(comp2.Id, result[1].ComponentArticleId);
    }

    // --- GetAsync ---

    [Fact]
    public async Task GetAsync_Exists_ReturnsBOM()
    {
        var (service, db) = Build(nameof(GetAsync_Exists_ReturnsBOM));
        var (parent, component, um) = await AddTestData(db);

        var bom = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PERCENTAGE",
            UmId = um.Id,
            ScrapFactor = 1.05m
        };
        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        var result = await service.GetAsync(parent.Id, component.Id);

        Assert.NotNull(result);
        Assert.Equal(parent.Id, result.ParentArticleId);
        Assert.Equal(component.Id, result.ComponentArticleId);
        Assert.Equal(1.05m, result.ScrapFactor);
    }

    [Fact]
    public async Task GetAsync_NotExists_ReturnsNull()
    {
        var (service, db) = Build(nameof(GetAsync_NotExists_ReturnsNull));
        var (parent, _, _) = await AddTestData(db);

        var result = await service.GetAsync(parent.Id, 9999);

        Assert.Null(result);
    }

    // --- CreateAsync ---

    [Fact]
    public async Task CreateAsync_Valid_CreatesBOM()
    {
        var (service, db) = Build(nameof(CreateAsync_Valid_CreatesBOM));
        var (parent, component, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5.5m,
            QuantityType = "PHYSICAL",
            UmId = um.Id,
            ScrapPercentage = 10m
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.Null(error);
        Assert.NotNull(result);
        Assert.Equal(parent.Id, result.ParentArticleId);
        Assert.Equal(component.Id, result.ComponentArticleId);
        Assert.Equal(5.5m, result.Quantity);
        Assert.Equal("PHYSICAL", result.QuantityType);
        Assert.Equal(10m, result.ScrapPercentage);
    }

    [Fact]
    public async Task CreateAsync_SelfReference_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_SelfReference_ReturnsError));
        var (parent, _, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = parent.Id,  // Same article
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.NotNull(error);
        Assert.Contains("non può essere componente di se stesso", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_ParentNotFound_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_ParentNotFound_ReturnsError));
        var (_, component, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = 9999,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.NotNull(error);
        Assert.Contains("padre", error);
        Assert.Contains("non trovato", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_ComponentNotFound_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_ComponentNotFound_ReturnsError));
        var (parent, _, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = 9999,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.NotNull(error);
        Assert.Contains("componente", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_MeasureUnitNotFound_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_MeasureUnitNotFound_ReturnsError));
        var (parent, component, _) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = 9999
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.NotNull(error);
        Assert.Contains("Unità di misura", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_Duplicate_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_Duplicate_ReturnsError));
        var (parent, component, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };

        await service.CreateAsync(request, createdByUserId: 1);
        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.NotNull(error);
        Assert.Contains("già associato", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_InvalidQuantityType_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_InvalidQuantityType_ReturnsError));
        var (parent, component, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "INVALID",
            UmId = um.Id
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.NotNull(error);
        Assert.Contains("QuantityType", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task CreateAsync_WithAllScrapTypes_CreatesBOM()
    {
        var (service, db) = Build(nameof(CreateAsync_WithAllScrapTypes_CreatesBOM));
        var (parent, component, um) = await AddTestData(db);

        var request = new CreateBillOfMaterialRequest
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id,
            ScrapPercentage = 5m,
            ScrapFactor = 0.1m,
            FixedScrap = 2m
        };

        var (result, error) = await service.CreateAsync(request, createdByUserId: 1);

        Assert.Null(error);
        Assert.NotNull(result);
        Assert.Equal(5m, result.ScrapPercentage);
        Assert.Equal(0.1m, result.ScrapFactor);
        Assert.Equal(2m, result.FixedScrap);
    }

    // --- UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_Exists_UpdatesBOM()
    {
        var (service, db) = Build(nameof(UpdateAsync_Exists_UpdatesBOM));
        var (parent, component, um) = await AddTestData(db);

        var bom = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id,
            ScrapPercentage = 10m
        };
        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        var um2 = new MeasureUnit { Name = "KG" };
        db.MeasureUnits.Add(um2);
        await db.SaveChangesAsync();

        var request = new UpdateBillOfMaterialRequest
        {
            Quantity = 10,
            QuantityType = "PERCENTAGE",
            UmId = um2.Id,
            ScrapPercentage = 20m
        };

        var (result, error) = await service.UpdateAsync(parent.Id, component.Id, request);

        Assert.Null(error);
        Assert.NotNull(result);
        Assert.Equal(10, result.Quantity);
        Assert.Equal("PERCENTAGE", result.QuantityType);
        Assert.Equal(um2.Id, result.UmId);
        Assert.Equal(20m, result.ScrapPercentage);
    }

    [Fact]
    public async Task UpdateAsync_NotExists_ReturnsNull()
    {
        var (service, db) = Build(nameof(UpdateAsync_NotExists_ReturnsNull));
        var (_, _, um) = await AddTestData(db);

        var request = new UpdateBillOfMaterialRequest
        {
            Quantity = 10,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };

        var (result, error) = await service.UpdateAsync(9999, 9999, request);

        Assert.Null(result);
        Assert.Null(error);
    }

    [Fact]
    public async Task UpdateAsync_InvalidMeasureUnit_ReturnsError()
    {
        var (service, db) = Build(nameof(UpdateAsync_InvalidMeasureUnit_ReturnsError));
        var (parent, component, um) = await AddTestData(db);

        var bom = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };
        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        var request = new UpdateBillOfMaterialRequest
        {
            Quantity = 10,
            QuantityType = "PHYSICAL",
            UmId = 9999
        };

        var (result, error) = await service.UpdateAsync(parent.Id, component.Id, request);

        Assert.NotNull(error);
        Assert.Contains("Unità di misura", error);
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_InvalidQuantityType_ReturnsError()
    {
        var (service, db) = Build(nameof(UpdateAsync_InvalidQuantityType_ReturnsError));
        var (parent, component, um) = await AddTestData(db);

        var bom = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };
        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        var request = new UpdateBillOfMaterialRequest
        {
            Quantity = 10,
            QuantityType = "INVALID",
            UmId = um.Id
        };

        var (result, error) = await service.UpdateAsync(parent.Id, component.Id, request);

        Assert.NotNull(error);
        Assert.Contains("QuantityType", error);
        Assert.Null(result);
    }

    // --- DeleteAsync ---

    [Fact]
    public async Task DeleteAsync_Exists_DeletesBOM()
    {
        var (service, db) = Build(nameof(DeleteAsync_Exists_DeletesBOM));
        var (parent, component, um) = await AddTestData(db);

        var bom = new BillOfMaterial
        {
            ParentArticleId = parent.Id,
            ComponentArticleId = component.Id,
            Quantity = 5,
            QuantityType = "PHYSICAL",
            UmId = um.Id
        };
        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        var result = await service.DeleteAsync(parent.Id, component.Id);

        Assert.True(result);
        var deleted = await service.GetAsync(parent.Id, component.Id);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task DeleteAsync_NotExists_ReturnsFalse()
    {
        var (service, _) = Build(nameof(DeleteAsync_NotExists_ReturnsFalse));

        var result = await service.DeleteAsync(9999, 9999);

        Assert.False(result);
    }
}
