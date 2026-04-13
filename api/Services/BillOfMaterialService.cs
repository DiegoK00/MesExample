using Api.Data;
using Api.DTOs.BillOfMaterials;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class BillOfMaterialService(AppDbContext db, AuditLogService auditLog)
{
    public async Task<List<BillOfMaterialResponse>> GetByParentArticleAsync(int parentArticleId)
    {
        var boms = await db.BillOfMaterials
            .Where(bom => bom.ParentArticleId == parentArticleId)
            .Include(bom => bom.ParentArticle)
            .Include(bom => bom.ComponentArticle)
            .Include(bom => bom.UM)
            .OrderBy(bom => bom.ComponentArticleId)
            .ToListAsync();

        return boms.Select(MapToResponse).ToList();
    }

    public async Task<BillOfMaterialResponse?> GetAsync(int parentArticleId, int componentArticleId)
    {
        var bom = await db.BillOfMaterials
            .Include(bom => bom.ParentArticle)
            .Include(bom => bom.ComponentArticle)
            .Include(bom => bom.UM)
            .FirstOrDefaultAsync(bom => bom.ParentArticleId == parentArticleId && bom.ComponentArticleId == componentArticleId);

        return bom is null ? null : MapToResponse(bom);
    }

    public async Task<(BillOfMaterialResponse? Data, string? Error)> CreateAsync(CreateBillOfMaterialRequest request, int createdByUserId)
    {
        // Validazioni base
        if (request.ParentArticleId == request.ComponentArticleId)
            return (null, "Un articolo non può essere componente di se stesso.");

        if (!await db.Articles.AnyAsync(a => a.Id == request.ParentArticleId))
            return (null, $"Articolo padre {request.ParentArticleId} non trovato.");

        if (!await db.Articles.AnyAsync(a => a.Id == request.ComponentArticleId))
            return (null, $"Articolo componente {request.ComponentArticleId} non trovato.");

        if (!await db.MeasureUnits.AnyAsync(m => m.Id == request.UmId))
            return (null, $"Unità di misura {request.UmId} non trovata.");

        // Verifica che non esista già
        var exists = await db.BillOfMaterials.AnyAsync(bom =>
            bom.ParentArticleId == request.ParentArticleId && bom.ComponentArticleId == request.ComponentArticleId);
        if (exists)
            return (null, "Questo componente è già associato a questo articolo padre.");

        // Validazione QuantityType
        if (request.QuantityType != "PHYSICAL" && request.QuantityType != "PERCENTAGE")
            return (null, "QuantityType deve essere 'PHYSICAL' o 'PERCENTAGE'.");

        var bom = new BillOfMaterial
        {
            ParentArticleId = request.ParentArticleId,
            ComponentArticleId = request.ComponentArticleId,
            Quantity = request.Quantity,
            QuantityType = request.QuantityType,
            UmId = request.UmId,
            ScrapPercentage = request.ScrapPercentage,
            ScrapFactor = request.ScrapFactor,
            FixedScrap = request.FixedScrap
        };

        db.BillOfMaterials.Add(bom);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("bom.created", entityName: "BillOfMaterial",
            entityId: $"{request.ParentArticleId}_{request.ComponentArticleId}",
            newValues: $"Qty={request.Quantity}, Type={request.QuantityType}");

        return (await GetAsync(bom.ParentArticleId, bom.ComponentArticleId), null);
    }

    public async Task<(BillOfMaterialResponse? Data, string? Error)> UpdateAsync(int parentArticleId, int componentArticleId, UpdateBillOfMaterialRequest request)
    {
        var bom = await db.BillOfMaterials.FindAsync(parentArticleId, componentArticleId);
        if (bom is null)
            return (null, null);

        if (!await db.MeasureUnits.AnyAsync(m => m.Id == request.UmId))
            return (null, $"Unità di misura {request.UmId} non trovata.");

        // Validazione QuantityType
        if (request.QuantityType != "PHYSICAL" && request.QuantityType != "PERCENTAGE")
            return (null, "QuantityType deve essere 'PHYSICAL' o 'PERCENTAGE'.");

        bom.Quantity = request.Quantity;
        bom.QuantityType = request.QuantityType;
        bom.UmId = request.UmId;
        bom.ScrapPercentage = request.ScrapPercentage;
        bom.ScrapFactor = request.ScrapFactor;
        bom.FixedScrap = request.FixedScrap;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("bom.updated", entityName: "BillOfMaterial",
            entityId: $"{parentArticleId}_{componentArticleId}",
            newValues: $"Qty={request.Quantity}, Type={request.QuantityType}");

        return (await GetAsync(parentArticleId, componentArticleId), null);
    }

    public async Task<bool> DeleteAsync(int parentArticleId, int componentArticleId)
    {
        var bom = await db.BillOfMaterials.FindAsync(parentArticleId, componentArticleId);
        if (bom is null)
            return false;

        db.BillOfMaterials.Remove(bom);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("bom.deleted", entityName: "BillOfMaterial",
            entityId: $"{parentArticleId}_{componentArticleId}",
            oldValues: $"Qty={bom.Quantity}, Type={bom.QuantityType}");

        return true;
    }

    private static BillOfMaterialResponse MapToResponse(BillOfMaterial bom) => new()
    {
        ParentArticleId = bom.ParentArticleId,
        ParentArticleCode = bom.ParentArticle.Code,
        ParentArticleName = bom.ParentArticle.Name,

        ComponentArticleId = bom.ComponentArticleId,
        ComponentArticleCode = bom.ComponentArticle.Code,
        ComponentArticleName = bom.ComponentArticle.Name,

        Quantity = bom.Quantity,
        QuantityType = bom.QuantityType,
        UmId = bom.UmId,
        UmName = bom.UM.Name,

        ScrapPercentage = bom.ScrapPercentage,
        ScrapFactor = bom.ScrapFactor,
        FixedScrap = bom.FixedScrap
    };
}
