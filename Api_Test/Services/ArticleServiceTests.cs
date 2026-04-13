using Api.DTOs.Articles;
using Api.Models;
using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class ArticleServiceTests
{
    private static (ArticleService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed("Art_" + dbName);
        var auditLog = new AuditLogService(db);
        return (new ArticleService(db, auditLog), db);
    }

    private static async Task<(Category cat, MeasureUnit um)> AddLookups(Api.Data.AppDbContext db)
    {
        var cat = new Category { Name = "Abbigliamento" };
        var um = new MeasureUnit { Name = "PZ" };
        db.Categories.Add(cat);
        db.MeasureUnits.Add(um);
        await db.SaveChangesAsync();
        return (cat, um);
    }

    private static async Task<Article> AddArticle(
        Api.Data.AppDbContext db,
        string code = "ART001",
        int categoryId = 0,
        int umId = 0,
        bool isActive = true)
    {
        var article = new Article
        {
            Code = code,
            Name = "Articolo Test",
            CategoryId = categoryId,
            Price = 10.0m,
            UMId = umId,
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = 1
        };
        db.Articles.Add(article);
        await db.SaveChangesAsync();
        return article;
    }

    // --- GetAllAsync ---

    [Fact]
    public async Task GetAllAsync_ReturnsAllArticles()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsAllArticles));
        var (cat, um) = await AddLookups(db);
        await AddArticle(db, "ART001", cat.Id, um.Id, isActive: true);
        await AddArticle(db, "ART002", cat.Id, um.Id, isActive: false);

        var result = await service.GetAllAsync();

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAllAsync_ActiveOnly_ReturnsOnlyActive()
    {
        var (service, db) = Build(nameof(GetAllAsync_ActiveOnly_ReturnsOnlyActive));
        var (cat, um) = await AddLookups(db);
        await AddArticle(db, "ART001", cat.Id, um.Id, isActive: true);
        await AddArticle(db, "ART002", cat.Id, um.Id, isActive: false);

        var result = await service.GetAllAsync(activeOnly: true);

        Assert.Single(result);
        Assert.Equal("ART001", result[0].Code);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsOrderedByCode()
    {
        var (service, db) = Build(nameof(GetAllAsync_ReturnsOrderedByCode));
        var (cat, um) = await AddLookups(db);
        await AddArticle(db, "ZZZ999", cat.Id, um.Id);
        await AddArticle(db, "AAA001", cat.Id, um.Id);

        var result = await service.GetAllAsync();

        Assert.Equal("AAA001", result[0].Code);
        Assert.Equal("ZZZ999", result[1].Code);
    }

    // --- GetByIdAsync ---

    [Fact]
    public async Task GetByIdAsync_ExistingArticle_ReturnsArticle()
    {
        var (service, db) = Build(nameof(GetByIdAsync_ExistingArticle_ReturnsArticle));
        var (cat, um) = await AddLookups(db);
        var article = await AddArticle(db, "ART001", cat.Id, um.Id);

        var result = await service.GetByIdAsync(article.Id);

        Assert.NotNull(result);
        Assert.Equal("ART001", result.Code);
        Assert.Equal("Abbigliamento", result.CategoryName);
        Assert.Equal("PZ", result.UMName);
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
    public async Task CreateAsync_ValidRequest_CreatesArticle()
    {
        var (service, db) = Build(nameof(CreateAsync_ValidRequest_CreatesArticle));
        var (cat, um) = await AddLookups(db);

        var (article, error) = await service.CreateAsync(new CreateArticleRequest
        {
            Code = "NEW001",
            Name = "Nuovo Articolo",
            CategoryId = cat.Id,
            Price = 25.50m,
            UMId = um.Id
        }, createdByUserId: 1);

        Assert.Null(error);
        Assert.NotNull(article);
        Assert.Equal("NEW001", article.Code);
        Assert.Equal(25.50m, article.Price);
        Assert.True(article.IsActive);
        Assert.Equal("admin", article.CreatedByUsername);
    }

    [Fact]
    public async Task CreateAsync_DuplicateCode_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_DuplicateCode_ReturnsError));
        var (cat, um) = await AddLookups(db);
        await AddArticle(db, "ART001", cat.Id, um.Id);

        var (article, error) = await service.CreateAsync(new CreateArticleRequest
        {
            Code = "ART001",
            Name = "Altro",
            CategoryId = cat.Id,
            Price = 10m,
            UMId = um.Id
        }, createdByUserId: 1);

        Assert.Null(article);
        Assert.Contains("ART001", error);
    }

    [Fact]
    public async Task CreateAsync_InvalidCategoryId_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_InvalidCategoryId_ReturnsError));
        var (_, um) = await AddLookups(db);

        var (article, error) = await service.CreateAsync(new CreateArticleRequest
        {
            Code = "ART001",
            Name = "Test",
            CategoryId = 999,
            Price = 10m,
            UMId = um.Id
        }, createdByUserId: 1);

        Assert.Null(article);
        Assert.Contains("999", error);
    }

    [Fact]
    public async Task CreateAsync_InvalidUMId_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_InvalidUMId_ReturnsError));
        var (cat, _) = await AddLookups(db);

        var (article, error) = await service.CreateAsync(new CreateArticleRequest
        {
            Code = "ART001",
            Name = "Test",
            CategoryId = cat.Id,
            Price = 10m,
            UMId = 999
        }, createdByUserId: 1);

        Assert.Null(article);
        Assert.Contains("999", error);
    }

    [Fact]
    public async Task CreateAsync_InvalidUM2Id_ReturnsError()
    {
        var (service, db) = Build(nameof(CreateAsync_InvalidUM2Id_ReturnsError));
        var (cat, um) = await AddLookups(db);

        var (article, error) = await service.CreateAsync(new CreateArticleRequest
        {
            Code = "ART001",
            Name = "Test",
            CategoryId = cat.Id,
            Price = 10m,
            UMId = um.Id,
            UM2Id = 999
        }, createdByUserId: 1);

        Assert.Null(article);
        Assert.Contains("999", error);
    }

    // --- UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesArticle()
    {
        var (service, db) = Build(nameof(UpdateAsync_ValidRequest_UpdatesArticle));
        var (cat, um) = await AddLookups(db);
        var article = await AddArticle(db, "ART001", cat.Id, um.Id);

        var (updated, error) = await service.UpdateAsync(article.Id, new UpdateArticleRequest
        {
            Name = "Nome Aggiornato",
            CategoryId = cat.Id,
            Price = 99.99m,
            UMId = um.Id,
            IsActive = true
        });

        Assert.Null(error);
        Assert.NotNull(updated);
        Assert.Equal("Nome Aggiornato", updated.Name);
        Assert.Equal(99.99m, updated.Price);
    }

    [Fact]
    public async Task UpdateAsync_NonExisting_ReturnsNulls()
    {
        var (service, db) = Build(nameof(UpdateAsync_NonExisting_ReturnsNulls));
        var (cat, um) = await AddLookups(db);

        var (article, error) = await service.UpdateAsync(999, new UpdateArticleRequest
        {
            Name = "X",
            CategoryId = cat.Id,
            Price = 1m,
            UMId = um.Id,
            IsActive = true
        });

        Assert.Null(article);
        Assert.Null(error);
    }

    [Fact]
    public async Task UpdateAsync_CanDeactivateArticle()
    {
        var (service, db) = Build(nameof(UpdateAsync_CanDeactivateArticle));
        var (cat, um) = await AddLookups(db);
        var article = await AddArticle(db, "ART001", cat.Id, um.Id, isActive: true);

        var (updated, error) = await service.UpdateAsync(article.Id, new UpdateArticleRequest
        {
            Name = article.Name,
            CategoryId = cat.Id,
            Price = article.Price,
            UMId = um.Id,
            IsActive = false
        });

        Assert.Null(error);
        Assert.NotNull(updated);
        Assert.False(updated.IsActive);
    }

    // --- DeleteAsync (soft delete) ---

    [Fact]
    public async Task DeleteAsync_ExistingArticle_SoftDeletesAndReturnsTrue()
    {
        var (service, db) = Build(nameof(DeleteAsync_ExistingArticle_SoftDeletesAndReturnsTrue));
        var (cat, um) = await AddLookups(db);
        var article = await AddArticle(db, "ART001", cat.Id, um.Id);

        var result = await service.DeleteAsync(article.Id, deletedByUserId: 1);

        Assert.True(result);

        var fetched = await service.GetByIdAsync(article.Id);
        Assert.NotNull(fetched);
        Assert.False(fetched.IsActive);
        Assert.NotNull(fetched.DeletedAt);
        Assert.Equal("admin", fetched.DeletedByUsername);
    }

    [Fact]
    public async Task DeleteAsync_ExistingArticle_StillVisibleInGetAll()
    {
        var (service, db) = Build(nameof(DeleteAsync_ExistingArticle_StillVisibleInGetAll));
        var (cat, um) = await AddLookups(db);
        var article = await AddArticle(db, "ART001", cat.Id, um.Id);

        await service.DeleteAsync(article.Id, deletedByUserId: 1);

        var all = await service.GetAllAsync();
        Assert.Single(all);
        Assert.False(all[0].IsActive);
    }

    [Fact]
    public async Task DeleteAsync_ExistingArticle_NotVisibleInActiveOnlyFilter()
    {
        var (service, db) = Build(nameof(DeleteAsync_ExistingArticle_NotVisibleInActiveOnlyFilter));
        var (cat, um) = await AddLookups(db);
        var article = await AddArticle(db, "ART001", cat.Id, um.Id);

        await service.DeleteAsync(article.Id, deletedByUserId: 1);

        var activeOnly = await service.GetAllAsync(activeOnly: true);
        Assert.Empty(activeOnly);
    }

    [Fact]
    public async Task DeleteAsync_NonExisting_ReturnsFalse()
    {
        var (service, _) = Build(nameof(DeleteAsync_NonExisting_ReturnsFalse));

        var result = await service.DeleteAsync(999, deletedByUserId: 1);

        Assert.False(result);
    }
}
