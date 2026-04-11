using Api.Data;
using Api.DTOs.Programs;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class ProgramService(AppDbContext db, AuditLogService auditLog)
{
    // --- CRUD Programs ---

    public async Task<List<ProgramResponse>> GetAllAsync(bool? activeOnly = null)
    {
        var query = db.Programs.AsQueryable();

        if (activeOnly == true)
            query = query.Where(p => p.IsActive);

        var programs = await query.OrderBy(p => p.Code).ToListAsync();
        return programs.Select(MapToResponse).ToList();
    }

    public async Task<ProgramResponse?> GetByIdAsync(int id)
    {
        var program = await db.Programs.FindAsync(id);
        return program is null ? null : MapToResponse(program);
    }

    public async Task<(ProgramResponse? Program, string? Error)> CreateAsync(CreateProgramRequest request)
    {
        var exists = await db.Programs.AnyAsync(p => p.Code == request.Code);
        if (exists)
            return (null, $"Il codice '{request.Code}' è già in uso.");

        var program = new AppProgram
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.Programs.Add(program);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("program.created", entityName: "Program", entityId: program.Id.ToString(),
            newValues: $"Code={program.Code}, Name={program.Name}");

        return (MapToResponse(program), null);
    }

    public async Task<(ProgramResponse? Program, string? Error)> UpdateAsync(int id, UpdateProgramRequest request)
    {
        var program = await db.Programs.FindAsync(id);
        if (program is null)
            return (null, null);

        program.Name = request.Name;
        program.Description = request.Description;
        program.IsActive = request.IsActive;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("program.updated", entityName: "Program", entityId: id.ToString(),
            newValues: $"Name={program.Name}, IsActive={program.IsActive}");

        return (MapToResponse(program), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var program = await db.Programs.FindAsync(id);
        if (program is null)
            return false;

        // Verifica che nessun utente abbia questo programma assegnato
        var hasUsers = await db.UserPrograms.AnyAsync(up => up.ProgramId == id);
        if (hasUsers)
            throw new InvalidOperationException("Impossibile eliminare un programma assegnato a uno o più utenti. Rimuovere prima le assegnazioni.");

        db.Programs.Remove(program);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("program.deleted", entityName: "Program", entityId: id.ToString(),
            oldValues: $"Code={program.Code}, Name={program.Name}");

        return true;
    }

    // --- Assegnazione utenti ---

    public async Task<List<UserProgramResponse>> GetUserProgramsAsync(int userId)
    {
        var userExists = await db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return [];

        return await db.UserPrograms
            .Where(up => up.UserId == userId)
            .Include(up => up.Program)
            .Include(up => up.GrantedBy)
            .OrderBy(up => up.Program.Code)
            .Select(up => new UserProgramResponse
            {
                ProgramId = up.ProgramId,
                Code = up.Program.Code,
                Name = up.Program.Name,
                GrantedAt = up.GrantedAt,
                GrantedByUsername = up.GrantedBy != null ? up.GrantedBy.Username : null
            })
            .ToListAsync();
    }

    public async Task<(bool Success, string? Error)> AssignProgramsAsync(int userId, AssignProgramRequest request, int grantedByUserId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            return (false, null);

        var programs = await db.Programs
            .Where(p => request.ProgramIds.Contains(p.Id) && p.IsActive)
            .ToListAsync();

        var invalidIds = request.ProgramIds.Except(programs.Select(p => p.Id)).ToList();
        if (invalidIds.Count > 0)
            return (false, $"Programmi non trovati o non attivi: {string.Join(", ", invalidIds)}.");

        var existingIds = await db.UserPrograms
            .Where(up => up.UserId == userId && request.ProgramIds.Contains(up.ProgramId))
            .Select(up => up.ProgramId)
            .ToListAsync();

        var toAdd = programs.Where(p => !existingIds.Contains(p.Id)).ToList();

        foreach (var program in toAdd)
        {
            db.UserPrograms.Add(new UserProgram
            {
                UserId = userId,
                ProgramId = program.Id,
                GrantedAt = DateTime.UtcNow,
                GrantedByUserId = grantedByUserId
            });
        }

        await db.SaveChangesAsync();

        await auditLog.LogAsync("program.assigned", entityName: "UserProgram",
            entityId: userId.ToString(),
            newValues: $"ProgramIds={string.Join(",", toAdd.Select(p => p.Id))}");

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> RevokeProgramsAsync(int userId, AssignProgramRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            return (false, null);

        var toRemove = await db.UserPrograms
            .Where(up => up.UserId == userId && request.ProgramIds.Contains(up.ProgramId))
            .ToListAsync();

        db.UserPrograms.RemoveRange(toRemove);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("program.revoked", entityName: "UserProgram",
            entityId: userId.ToString(),
            oldValues: $"ProgramIds={string.Join(",", request.ProgramIds)}");

        return (true, null);
    }

    private static ProgramResponse MapToResponse(AppProgram p) => new()
    {
        Id = p.Id,
        Code = p.Code,
        Name = p.Name,
        Description = p.Description,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt
    };
}
