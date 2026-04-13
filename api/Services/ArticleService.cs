using Api.Data;
using Api.DTOs.Articles;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class ArticleService(AppDbContext db, AuditLogService auditLog)
{
    public async Task<List<ArticleResponse>> GetAllAsync(bool? activeOnly = null)
    {
        var query = db.Articles
            .Include(a => a.Category)
            .Include(a => a.UM)
            .Include(a => a.UM2)
            .Include(a => a.CreatedByUser)
            .Include(a => a.DeletedByUser)
            .AsQueryable();

        if (activeOnly == true)
            query = query.Where(a => a.IsActive);

        var articles = await query.OrderBy(a => a.Code).ToListAsync();
        return articles.Select(MapToResponse).ToList();
    }

    public async Task<ArticleResponse?> GetByIdAsync(int id)
    {
        var article = await db.Articles
            .Include(a => a.Category)
            .Include(a => a.UM)
            .Include(a => a.UM2)
            .Include(a => a.CreatedByUser)
            .Include(a => a.DeletedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        return article is null ? null : MapToResponse(article);
    }

    public async Task<(ArticleResponse? Article, string? Error)> CreateAsync(CreateArticleRequest request, int createdByUserId)
    {
        var codeExists = await db.Articles.AnyAsync(a => a.Code == request.Code);
        if (codeExists)
            return (null, $"Il codice '{request.Code}' è già in uso.");

        var categoryExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
            return (null, $"Categoria {request.CategoryId} non trovata.");

        var umExists = await db.MeasureUnits.AnyAsync(m => m.Id == request.UMId);
        if (!umExists)
            return (null, $"Unità di misura {request.UMId} non trovata.");

        if (request.UM2Id.HasValue)
        {
            var um2Exists = await db.MeasureUnits.AnyAsync(m => m.Id == request.UM2Id.Value);
            if (!um2Exists)
                return (null, $"Unità di misura secondaria {request.UM2Id} non trovata.");
        }

        var article = new Article
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            CategoryId = request.CategoryId,
            Price = request.Price,
            UMId = request.UMId,
            UM2Id = request.UM2Id,
            Measures = request.Measures,
            Composition = request.Composition,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedFrom = createdByUserId
        };

        db.Articles.Add(article);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("article.created", entityName: "Article", entityId: article.Id.ToString(),
            newValues: $"Code={article.Code}, Name={article.Name}");

        return (await GetByIdAsync(article.Id), null);
    }

    public async Task<(ArticleResponse? Article, string? Error)> UpdateAsync(int id, UpdateArticleRequest request)
    {
        var article = await db.Articles.FindAsync(id);
        if (article is null)
            return (null, null);

        var categoryExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
            return (null, $"Categoria {request.CategoryId} non trovata.");

        var umExists = await db.MeasureUnits.AnyAsync(m => m.Id == request.UMId);
        if (!umExists)
            return (null, $"Unità di misura {request.UMId} non trovata.");

        if (request.UM2Id.HasValue)
        {
            var um2Exists = await db.MeasureUnits.AnyAsync(m => m.Id == request.UM2Id.Value);
            if (!um2Exists)
                return (null, $"Unità di misura secondaria {request.UM2Id} non trovata.");
        }

        article.Name = request.Name;
        article.Description = request.Description;
        article.CategoryId = request.CategoryId;
        article.Price = request.Price;
        article.UMId = request.UMId;
        article.UM2Id = request.UM2Id;
        article.Measures = request.Measures;
        article.Composition = request.Composition;
        article.IsActive = request.IsActive;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("article.updated", entityName: "Article", entityId: id.ToString(),
            newValues: $"Name={article.Name}, IsActive={article.IsActive}");

        return (await GetByIdAsync(id), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedByUserId)
    {
        var article = await db.Articles.FindAsync(id);
        if (article is null)
            return false;

        article.IsActive = false;
        article.DeletedAt = DateTime.UtcNow;
        article.DeletedFrom = deletedByUserId;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("article.deleted", entityName: "Article", entityId: id.ToString(),
            oldValues: $"Code={article.Code}, Name={article.Name}");

        return true;
    }

    private static ArticleResponse MapToResponse(Article a) => new()
    {
        Id = a.Id,
        Code = a.Code,
        Name = a.Name,
        Description = a.Description,
        CategoryId = a.CategoryId,
        CategoryName = a.Category.Name,
        Price = a.Price,
        UMId = a.UMId,
        UMName = a.UM.Name,
        UM2Id = a.UM2Id,
        UM2Name = a.UM2?.Name,
        Measures = a.Measures,
        Composition = a.Composition,
        IsActive = a.IsActive,
        CreatedAt = a.CreatedAt,
        CreatedByUsername = a.CreatedByUser.Username,
        DeletedAt = a.DeletedAt,
        DeletedByUsername = a.DeletedByUser?.Username
    };
}
