using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Api.Data;
using Api.DTOs.Auth;
using Api.Models;
using Api.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

public class AuthService(AppDbContext db, IConfiguration config, AuditLogService auditLog, IEmailService emailService)
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request, string ipAddress)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.LoginArea == request.Area);

        if (user is null || !user.IsActive)
        {
            await auditLog.LogAsync("user.login_failed", entityName: "User",
                newValues: request.Email, ipAddress: ipAddress);
            return null;
        }

        if (!VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
        {
            await auditLog.LogAsync("user.login_failed", userId: user.Id, entityName: "User",
                entityId: user.Id.ToString(), newValues: request.Email, ipAddress: ipAddress);
            return null;
        }

        user.LastLoginAt = DateTime.UtcNow;

        var accessToken = GenerateAccessToken(user);
        var refreshToken = CreateRefreshToken(user.Id, ipAddress);

        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        await auditLog.LogAsync("user.login", userId: user.Id, entityName: "User",
            entityId: user.Id.ToString(), ipAddress: ipAddress);

        return new LoginResponse
        {
            AccessToken = accessToken.Token,
            RefreshToken = refreshToken.Token,
            ExpiresAt = accessToken.ExpiresAt
        };
    }

    public async Task<LoginResponse?> RefreshAsync(string token, string ipAddress)
    {
        var existing = await db.RefreshTokens
            .Include(rt => rt.User).ThenInclude(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (existing is null)
            return null;

        // Token riusato dopo revoca → possibile furto, revoca tutto
        if (existing.RevokedAt is not null)
        {
            await RevokeAllUserTokensAsync(existing.UserId);
            return null;
        }

        if (existing.ExpiresAt <= DateTime.UtcNow)
            return null;

        // Token rotation
        existing.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = CreateRefreshToken(existing.UserId, ipAddress);
        db.RefreshTokens.Add(newRefreshToken);

        var accessToken = GenerateAccessToken(existing.User);
        await db.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken.Token,
            RefreshToken = newRefreshToken.Token,
            ExpiresAt = accessToken.ExpiresAt
        };
    }

    public async Task<bool> LogoutAsync(string token, string? ipAddress = null)
    {
        var existing = await db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.RevokedAt == null);

        if (existing is null)
            return false;

        existing.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await auditLog.LogAsync("user.logout", userId: existing.UserId, entityName: "User",
            entityId: existing.UserId.ToString(), ipAddress: ipAddress);

        return true;
    }

    public async Task ForgotPasswordAsync(string email, LoginArea area)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.LoginArea == area);

        // Risposta identica indipendentemente dall'esistenza dell'utente (evita user enumeration)
        if (user is null || !user.IsActive)
            return;

        // Invalida token precedenti non ancora usati
        var oldTokens = await db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var old in oldTokens)
            old.UsedAt = DateTime.UtcNow;

        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            CreatedAt = DateTime.UtcNow
        };

        db.PasswordResetTokens.Add(resetToken);
        await db.SaveChangesAsync();

        await emailService.SendPasswordResetEmailAsync(user.Email, resetToken.Token);
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        var resetToken = await db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token);

        if (resetToken is null || resetToken.UsedAt is not null || resetToken.ExpiresAt <= DateTime.UtcNow)
            return false;

        var (hash, salt) = HashPassword(newPassword);
        resetToken.User.PasswordHash = hash;
        resetToken.User.PasswordSalt = salt;
        resetToken.User.UpdatedAt = DateTime.UtcNow;
        resetToken.UsedAt = DateTime.UtcNow;

        // Revoca tutte le sessioni attive
        await RevokeAllUserTokensAsync(resetToken.UserId);

        await db.SaveChangesAsync();

        await auditLog.LogAsync("user.password_reset", userId: resetToken.UserId,
            entityName: "User", entityId: resetToken.UserId.ToString());

        return true;
    }

    // --- Helpers ---

    private (string Token, DateTime ExpiresAt) GenerateAccessToken(User user)
    {
        var jwtSection = config.GetSection("Jwt");
        var secret = jwtSection["Secret"]!;
        var expiryMinutes = int.Parse(jwtSection["AccessTokenExpiryMinutes"]!);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("area", user.LoginArea.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private RefreshToken CreateRefreshToken(int userId, string ipAddress)
    {
        var expiryDays = int.Parse(config.GetSection("Jwt")["RefreshTokenExpiryDays"]!);

        return new RefreshToken
        {
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };
    }

    private async Task RevokeAllUserTokensAsync(int userId)
    {
        var tokens = await db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var t in tokens)
            t.RevokedAt = DateTime.UtcNow;
    }

    public static (string Hash, string Salt) HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(32);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32
        );

        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public static bool VerifyPassword(string password, string storedHash, string storedSalt)
    {
        var salt = Convert.FromBase64String(storedSalt);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32
        );

        return Convert.ToBase64String(hash) == storedHash;
    }

    private static string GenerateSecureToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
