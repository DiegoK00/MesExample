using Api.Data;
using Api.DTOs.AuditLogs;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class AuditLogService(AppDbContext db)
{
    public async Task LogAsync(
        string action,
        int? userId = null,
        string? entityName = null,
        string? entityId = null,
        string? oldValues = null,
        string? newValues = null,
        string? ipAddress = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Action = action,
            UserId = userId,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = oldValues,
            NewValues = newValues,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }

    public async Task<AuditLogsPageResponse> GetLogsAsync(
        int page,
        int pageSize,
        int? userId = null,
        string? action = null,
        string? entityName = null,
        DateTime? from = null,
        DateTime? to = null)
    {
        var query = db.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action.Contains(action));

        if (!string.IsNullOrWhiteSpace(entityName))
            query = query.Where(a => a.EntityName == entityName);

        if (from.HasValue)
            query = query.Where(a => a.Timestamp >= from.Value);

        if (to.HasValue)
            query = query.Where(a => a.Timestamp <= to.Value);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new AuditLogsPageResponse
        {
            Items = logs.Select(a => new AuditLogResponse
            {
                Id = a.Id,
                UserId = a.UserId,
                Username = a.User?.Username,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                Timestamp = a.Timestamp
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
