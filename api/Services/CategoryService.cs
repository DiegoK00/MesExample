using Api.Data;
using Api.DTOs.Categories;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class CategoryService(AppDbContext db, AuditLogService auditLog)
{
    public async Task<List<CategoryResponse>> GetAllAsync()
    {
        var categories = await db.Categories.OrderBy(c => c.Name).ToListAsync();
        return categories.Select(MapToResponse).ToList();
    }

    public async Task<CategoryResponse?> GetByIdAsync(int id)
    {
        var category = await db.Categories.FindAsync(id);
        return category is null ? null : MapToResponse(category);
    }

    public async Task<(CategoryResponse? Category, string? Error)> CreateAsync(CreateCategoryRequest request)
    {
        var exists = await db.Categories.AnyAsync(c => c.Name == request.Name);
        if (exists)
            return (null, $"La categoria '{request.Name}' esiste già.");

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("category.created", entityName: "Category", entityId: category.Id.ToString(),
            newValues: $"Name={category.Name}");

        return (MapToResponse(category), null);
    }

    public async Task<(CategoryResponse? Category, string? Error)> UpdateAsync(int id, UpdateCategoryRequest request)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null)
            return (null, null);

        var exists = await db.Categories.AnyAsync(c => c.Name == request.Name && c.Id != id);
        if (exists)
            return (null, $"La categoria '{request.Name}' esiste già.");

        category.Name = request.Name;
        category.Description = request.Description;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("category.updated", entityName: "Category", entityId: id.ToString(),
            newValues: $"Name={category.Name}");

        return (MapToResponse(category), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null)
            return false;

        var hasArticles = await db.Articles.AnyAsync(a => a.CategoryId == id);
        if (hasArticles)
            throw new InvalidOperationException("Impossibile eliminare una categoria associata a uno o più articoli.");

        db.Categories.Remove(category);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("category.deleted", entityName: "Category", entityId: id.ToString(),
            oldValues: $"Name={category.Name}");

        return true;
    }

    private static CategoryResponse MapToResponse(Category c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description
    };
}
