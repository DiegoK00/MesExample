using Api.DTOs.Categories;
using Api.Models;
using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class CategoryServiceTests
{
    private static (CategoryService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed("Cat_" + dbName);
        var auditLog = new AuditLogService(db);
        return (new CategoryService(db, auditLog), db);
    }

    private static async Task<Category> AddCategory(Api.Data.AppDbContext db, string name = "Abbigliamento")
    {
        var category = new Category { Name = name, Description = "Desc" };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    // --- GetAllAsync ---

    [Fact]
    public async Task GetAllAsync_ReturnsAllCategories()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsAllCategories));
        await AddCategory(db, "Abbigliamento");
        await AddCategory(db, "Calzature");

        var result = await service.GetAllAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsOrderedByName()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsOrderedByName));
        await AddCategory(db, "Zucchero");
        await AddCategory(db, "Abbigliamento");

        var result = await service.GetAllAsync();

        Assert.Equal("Abbigliamento", result[0].Name);
        Assert.Equal("Zucchero", result[1].Name);
    }

    // --- GetByIdAsync ---

    [Fact]
    public async Task GetByIdAsync_ExistingCategory_ReturnsCategory()
    {
        var (service, db) = Build(nameof(GetByIdAsync_ExistingCategory_ReturnsCategory));
        var category = await AddCategory(db);

        var result = await service.GetByIdAsync(category.Id);

        Assert.NotNull(result);
        Assert.Equal("Abbigliamento", result.Name);
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
    public async Task CreateAsync_ValidRequest_CreatesCategory()
    {
        var (service, _) = Build(nameof(CreateAsync_ValidRequest_CreatesCategory));

        var (category, error) = await service.CreateAsync(new CreateCategoryRequest
        {
            Name = "Elettronica",
            Description = "Prodotti elettronici"
        });

        Assert.Null(error);
        Assert.NotNull(category);
        Assert.Equal("Elettronica", category.Name);
        Assert.Equal("Prodotti elettronici", category.Description);
    }

    [Fact]
    public async Task CreateAsync_DuplicateName_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_DuplicateName_ReturnsError));
        await AddCategory(db, "Abbigliamento");

        var (category, error) = await service.CreateAsync(new CreateCategoryRequest
        {
            Name = "Abbigliamento"
        });

        Assert.Null(category);
        Assert.Contains("Abbigliamento", error);
    }

    // --- UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesCategory()
    {
        var (service, db) = Build(nameof(UpdateAsync_ValidRequest_UpdatesCategory));
        var category = await AddCategory(db);

        var (updated, error) = await service.UpdateAsync(category.Id, new UpdateCategoryRequest
        {
            Name = "Nome Aggiornato",
            Description = "Nuova descrizione"
        });

        Assert.Null(error);
        Assert.NotNull(updated);
        Assert.Equal("Nome Aggiornato", updated.Name);
        Assert.Equal("Nuova descrizione", updated.Description);
    }

    [Fact]
    public async Task UpdateAsync_NonExisting_ReturnsNulls()
    {
        var (service, _) = Build(nameof(UpdateAsync_NonExisting_ReturnsNulls));

        var (category, error) = await service.UpdateAsync(999, new UpdateCategoryRequest { Name = "X" });

        Assert.Null(category);
        Assert.Null(error);
    }

    [Fact]
    public async Task UpdateAsync_DuplicateName_ReturnsError()
    {
        var (service, db) = Build(nameof(UpdateAsync_DuplicateName_ReturnsError));
        await AddCategory(db, "Abbigliamento");
        var other = await AddCategory(db, "Calzature");

        var (updated, error) = await service.UpdateAsync(other.Id, new UpdateCategoryRequest
        {
            Name = "Abbigliamento"
        });

        Assert.Null(updated);
        Assert.Contains("Abbigliamento", error);
    }

    // --- DeleteAsync ---

    [Fact]
    public async Task DeleteAsync_CategoryWithNoArticles_DeletesAndReturnsTrue()
    {
        var (service, db) = Build(nameof(DeleteAsync_CategoryWithNoArticles_DeletesAndReturnsTrue));
        var category = await AddCategory(db);

        var result = await service.DeleteAsync(category.Id);

        Assert.True(result);
        Assert.Null(await service.GetByIdAsync(category.Id));
    }

    [Fact]
    public async Task DeleteAsync_NonExisting_ReturnsFalse()
    {
        var (service, _) = Build(nameof(DeleteAsync_NonExisting_ReturnsFalse));

        var result = await service.DeleteAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteAsync_CategoryWithArticles_ThrowsInvalidOperation()
    {
        var (service, db) = Build(nameof(DeleteAsync_CategoryWithArticles_ThrowsInvalidOperation));
        var category = await AddCategory(db);

        var um = new MeasureUnit { Name = "PZ", Description = "Pezzi" };
        db.MeasureUnits.Add(um);
        await db.SaveChangesAsync();

        db.Articles.Add(new Article
        {
            Code = "ART001",
            Name = "Articolo Test",
            CategoryId = category.Id,
            Price = 10.0m,
            UMId = um.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.DeleteAsync(category.Id));
    }
}
