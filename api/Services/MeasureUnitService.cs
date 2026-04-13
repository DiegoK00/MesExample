using Api.Data;
using Api.DTOs.MeasureUnits;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class MeasureUnitService(AppDbContext db, AuditLogService auditLog)
{
    public async Task<List<MeasureUnitResponse>> GetAllAsync()
    {
        var units = await db.MeasureUnits.OrderBy(m => m.Name).ToListAsync();
        return units.Select(MapToResponse).ToList();
    }

    public async Task<MeasureUnitResponse?> GetByIdAsync(int id)
    {
        var unit = await db.MeasureUnits.FindAsync(id);
        return unit is null ? null : MapToResponse(unit);
    }

    public async Task<(MeasureUnitResponse? Unit, string? Error)> CreateAsync(CreateMeasureUnitRequest request)
    {
        var exists = await db.MeasureUnits.AnyAsync(m => m.Name == request.Name);
        if (exists)
            return (null, $"L'unità di misura '{request.Name}' esiste già.");

        var unit = new MeasureUnit
        {
            Name = request.Name,
            Description = request.Description
        };

        db.MeasureUnits.Add(unit);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("measureunit.created", entityName: "MeasureUnit", entityId: unit.Id.ToString(),
            newValues: $"Name={unit.Name}");

        return (MapToResponse(unit), null);
    }

    public async Task<(MeasureUnitResponse? Unit, string? Error)> UpdateAsync(int id, UpdateMeasureUnitRequest request)
    {
        var unit = await db.MeasureUnits.FindAsync(id);
        if (unit is null)
            return (null, null);

        var exists = await db.MeasureUnits.AnyAsync(m => m.Name == request.Name && m.Id != id);
        if (exists)
            return (null, $"L'unità di misura '{request.Name}' esiste già.");

        unit.Name = request.Name;
        unit.Description = request.Description;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("measureunit.updated", entityName: "MeasureUnit", entityId: id.ToString(),
            newValues: $"Name={unit.Name}");

        return (MapToResponse(unit), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var unit = await db.MeasureUnits.FindAsync(id);
        if (unit is null)
            return false;

        var hasArticles = await db.Articles.AnyAsync(a => a.UMId == id || a.UM2Id == id);
        if (hasArticles)
            throw new InvalidOperationException("Impossibile eliminare un'unità di misura associata a uno o più articoli.");

        db.MeasureUnits.Remove(unit);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("measureunit.deleted", entityName: "MeasureUnit", entityId: id.ToString(),
            oldValues: $"Name={unit.Name}");

        return true;
    }

    private static MeasureUnitResponse MapToResponse(MeasureUnit m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Description = m.Description
    };
}
