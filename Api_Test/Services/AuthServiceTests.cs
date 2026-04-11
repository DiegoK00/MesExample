using Api.DTOs.Auth;
using Api.Models;
using Api.Models.Enums;
using Api.Services;
using Api.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Moq;

namespace Api.Tests.Services;

public class AuthServiceTests
{
    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "supersecret-key-for-testing-only-32chars!!",
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience",
                ["Jwt:AccessTokenExpiryMinutes"] = "15",
                ["Jwt:RefreshTokenExpiryDays"] = "7"
            })
            .Build();

    private static IEmailService NoOpEmail => Mock.Of<IEmailService>();

    // --- HashPassword / VerifyPassword ---

    [Fact]
    public void HashPassword_ProducesVerifiableHash()
    {
        var (hash, salt) = AuthService.HashPassword("TestPass@1");

        Assert.False(string.IsNullOrEmpty(hash));
        Assert.False(string.IsNullOrEmpty(salt));
        Assert.True(AuthService.VerifyPassword("TestPass@1", hash, salt));
    }

    [Fact]
    public void VerifyPassword_ReturnsFalse_WrongPassword()
    {
        var (hash, salt) = AuthService.HashPassword("TestPass@1");

        Assert.False(AuthService.VerifyPassword("WrongPass@1", hash, salt));
    }

    [Fact]
    public void HashPassword_TwoCallsProduceDifferentSalts()
    {
        var (_, salt1) = AuthService.HashPassword("Same@1");
        var (_, salt2) = AuthService.HashPassword("Same@1");

        Assert.NotEqual(salt1, salt2);
    }

    // --- LoginAsync ---

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokens()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LoginAsync_ValidCredentials_ReturnsTokens));
        var auditLog = new AuditLogService(db);
        var service = new AuthService(db, BuildConfig(), auditLog, NoOpEmail);

        var result = await service.LoginAsync(
            new LoginRequest { Email = "admin@test.com", Password = "Admin@1234", Area = LoginArea.Admin },
            ipAddress: "127.0.0.1");

        Assert.NotNull(result);
        Assert.False(string.IsNullOrEmpty(result.AccessToken));
        Assert.False(string.IsNullOrEmpty(result.RefreshToken));
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LoginAsync_WrongPassword_ReturnsNull));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.LoginAsync(
            new LoginRequest { Email = "admin@test.com", Password = "WrongPass!", Area = LoginArea.Admin },
            "127.0.0.1");

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_UserNotFound_ReturnsNull()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LoginAsync_UserNotFound_ReturnsNull));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.LoginAsync(
            new LoginRequest { Email = "nonexistent@test.com", Password = "Admin@1234", Area = LoginArea.Admin },
            "127.0.0.1");

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_InactiveUser_ReturnsNull()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LoginAsync_InactiveUser_ReturnsNull));
        var user = db.Users.First();
        user.IsActive = false;
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.LoginAsync(
            new LoginRequest { Email = "admin@test.com", Password = "Admin@1234", Area = LoginArea.Admin },
            "127.0.0.1");

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_WrongArea_ReturnsNull()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LoginAsync_WrongArea_ReturnsNull));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        // L'utente è Admin (area=1), proviamo con area App (area=2)
        var result = await service.LoginAsync(
            new LoginRequest { Email = "admin@test.com", Password = "Admin@1234", Area = LoginArea.App },
            "127.0.0.1");

        Assert.Null(result);
    }

    // --- LogoutAsync ---

    [Fact]
    public async Task LogoutAsync_ValidToken_RevokesAndReturnsTrue()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LogoutAsync_ValidToken_RevokesAndReturnsTrue));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var loginResult = await service.LoginAsync(
            new LoginRequest { Email = "admin@test.com", Password = "Admin@1234", Area = LoginArea.Admin },
            "127.0.0.1");

        var result = await service.LogoutAsync(loginResult!.RefreshToken, "127.0.0.1");

        Assert.True(result);
        Assert.NotNull(db.RefreshTokens.First().RevokedAt);
    }

    [Fact]
    public async Task LogoutAsync_InvalidToken_ReturnsFalse()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(LogoutAsync_InvalidToken_ReturnsFalse));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.LogoutAsync("non-existent-token");

        Assert.False(result);
    }

    // --- RefreshAsync ---

    [Fact]
    public async Task RefreshAsync_ValidToken_ReturnsNewTokens()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(RefreshAsync_ValidToken_ReturnsNewTokens));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var loginResult = await service.LoginAsync(
            new LoginRequest { Email = "admin@test.com", Password = "Admin@1234", Area = LoginArea.Admin },
            "127.0.0.1");

        var refreshResult = await service.RefreshAsync(loginResult!.RefreshToken, "127.0.0.1");

        Assert.NotNull(refreshResult);
        Assert.NotEqual(loginResult.RefreshToken, refreshResult.RefreshToken); // rotation
        Assert.NotEmpty(refreshResult.AccessToken);
    }

    [Fact]
    public async Task RefreshAsync_ExpiredToken_ReturnsNull()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(RefreshAsync_ExpiredToken_ReturnsNull));

        var expiredToken = new RefreshToken
        {
            UserId = 1,
            Token = "expired-token",
            ExpiresAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-8),
            CreatedByIp = "127.0.0.1"
        };
        db.RefreshTokens.Add(expiredToken);
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.RefreshAsync("expired-token", "127.0.0.1");

        Assert.Null(result);
    }

    [Fact]
    public async Task RefreshAsync_RevokedToken_RevokesAllAndReturnsNull()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(RefreshAsync_RevokedToken_RevokesAllAndReturnsNull));

        var revokedToken = new RefreshToken
        {
            UserId = 1,
            Token = "revoked-token",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            RevokedAt = DateTime.UtcNow.AddHours(-1), // già revocato
            CreatedByIp = "127.0.0.1"
        };
        var activeToken = new RefreshToken
        {
            UserId = 1,
            Token = "active-token",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = "127.0.0.1"
        };
        db.RefreshTokens.AddRange(revokedToken, activeToken);
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.RefreshAsync("revoked-token", "127.0.0.1");

        Assert.Null(result);
        // Tutti i token dell'utente devono essere revocati
        Assert.All(db.RefreshTokens.Where(t => t.UserId == 1).ToList(), t => Assert.NotNull(t.RevokedAt));
    }

    // --- ForgotPasswordAsync ---

    [Fact]
    public async Task ForgotPasswordAsync_ExistingUser_SendsEmail()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(ForgotPasswordAsync_ExistingUser_SendsEmail));
        var emailService = new Mock<IEmailService>();
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), emailService.Object);

        await service.ForgotPasswordAsync("admin@test.com", LoginArea.Admin);

        emailService.Verify(e => e.SendPasswordResetEmailAsync("admin@test.com", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_ExistingUser_CreatesTokenInDb()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(ForgotPasswordAsync_ExistingUser_CreatesTokenInDb));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        await service.ForgotPasswordAsync("admin@test.com", LoginArea.Admin);

        Assert.Single(db.PasswordResetTokens);
        Assert.Null(db.PasswordResetTokens.First().UsedAt);
    }

    [Fact]
    public async Task ForgotPasswordAsync_UnknownEmail_DoesNotSendEmail()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(ForgotPasswordAsync_UnknownEmail_DoesNotSendEmail));
        var emailService = new Mock<IEmailService>();
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), emailService.Object);

        await service.ForgotPasswordAsync("unknown@test.com", LoginArea.Admin);

        emailService.Verify(e => e.SendPasswordResetEmailAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    // --- ResetPasswordAsync ---

    [Fact]
    public async Task ResetPasswordAsync_InvalidToken_ReturnsFalse()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(ResetPasswordAsync_InvalidToken_ReturnsFalse));
        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.ResetPasswordAsync("non-existent-token", "NewPass@1");

        Assert.False(result);
    }

    [Fact]
    public async Task ResetPasswordAsync_ExpiredToken_ReturnsFalse()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(ResetPasswordAsync_ExpiredToken_ReturnsFalse));

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = 1,
            Token = "expired-reset-token",
            ExpiresAt = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        });
        await db.SaveChangesAsync();

        var service = new AuthService(db, BuildConfig(), new AuditLogService(db), NoOpEmail);

        var result = await service.ResetPasswordAsync("expired-reset-token", "NewPass@1");

        Assert.False(result);
    }
}
