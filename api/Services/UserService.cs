using Api.Data;
using Api.DTOs.Account;
using Api.DTOs.Users;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class UserService(AppDbContext db, AuditLogService auditLog)
{
    public async Task<UsersPageResponse> GetAllAsync(int page, int pageSize, string? search = null)
    {
        var query = db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u => u.Email.Contains(search) || u.Username.Contains(search));

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new UsersPageResponse
        {
            Items = users.Select(MapToResponse).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UserResponse?> GetByIdAsync(int id)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null ? null : MapToResponse(user);
    }

    public async Task<(UserResponse? User, string? Error)> CreateAsync(CreateUserRequest request)
    {
        var emailExists = await db.Users.AnyAsync(u => u.Email == request.Email && u.LoginArea == request.LoginArea);
        if (emailExists)
            return (null, "Email già registrata per questa area.");

        var usernameExists = await db.Users.AnyAsync(u => u.Username == request.Username && u.LoginArea == request.LoginArea);
        if (usernameExists)
            return (null, "Username già in uso per questa area.");

        var roles = await db.Roles
            .Where(r => request.RoleIds.Contains(r.Id))
            .ToListAsync();

        var (hash, salt) = AuthService.HashPassword(request.Password);

        var user = new User
        {
            Email = request.Email,
            Username = request.Username,
            PasswordHash = hash,
            PasswordSalt = salt,
            LoginArea = request.LoginArea,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UserRoles = roles.Select(r => new UserRole { RoleId = r.Id }).ToList()
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Ricarica con i ruoli per la risposta
        await db.Entry(user).Collection(u => u.UserRoles).Query()
            .Include(ur => ur.Role).LoadAsync();

        await auditLog.LogAsync("user.created", entityName: "User", entityId: user.Id.ToString(),
            newValues: $"Email={user.Email}, Username={user.Username}, Area={user.LoginArea}");

        return (MapToResponse(user), null);
    }

    public async Task<(UserResponse? User, string? Error)> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return (null, null);

        var emailExists = await db.Users.AnyAsync(u => u.Email == request.Email && u.LoginArea == user.LoginArea && u.Id != id);
        if (emailExists)
            return (null, "Email già registrata per questa area.");

        var usernameExists = await db.Users.AnyAsync(u => u.Username == request.Username && u.LoginArea == user.LoginArea && u.Id != id);
        if (usernameExists)
            return (null, "Username già in uso per questa area.");

        user.Email = request.Email;
        user.Username = request.Username;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        // Aggiorna ruoli
        user.UserRoles.Clear();
        var roles = await db.Roles.Where(r => request.RoleIds.Contains(r.Id)).ToListAsync();
        foreach (var role in roles)
            user.UserRoles.Add(new UserRole { UserId = id, RoleId = role.Id });

        await db.SaveChangesAsync();

        await auditLog.LogAsync("user.updated", entityName: "User", entityId: id.ToString(),
            newValues: $"Email={user.Email}, Username={user.Username}, IsActive={user.IsActive}");

        return (MapToResponse(user), null);
    }

    public async Task<bool> DeactivateAsync(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null)
            return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await auditLog.LogAsync("user.deactivated", entityName: "User", entityId: id.ToString());

        return true;
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(int userId)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.UserPrograms).ThenInclude(up => up.Program)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user is null)
            return null;

        return new CurrentUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            LoginArea = user.LoginArea,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            Programs = user.UserPrograms
                .Where(up => up.Program.IsActive)
                .Select(up => up.Program.Code)
                .ToList()
        };
    }

    public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null || !user.IsActive)
            return false;

        if (!AuthService.VerifyPassword(currentPassword, user.PasswordHash, user.PasswordSalt))
            return false;

        var (hash, salt) = AuthService.HashPassword(newPassword);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        await auditLog.LogAsync("user.password_changed", userId: userId,
            entityName: "User", entityId: userId.ToString());

        return true;
    }

    private static UserResponse MapToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Username = user.Username,
        LoginArea = user.LoginArea,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
    };
}
