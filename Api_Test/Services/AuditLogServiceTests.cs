using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class AuditLogServiceTests
{
    private static (AuditLogService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed(dbName);
        return (new AuditLogService(db), db);
    }

    // --- LogAsync ---

    [Fact]
    public async Task LogAsync_CreatesAuditLogEntry()
    {
        var (service, db) = Build(nameof(LogAsync_CreatesAuditLogEntry));

        await service.LogAsync("user.login", userId: 1, entityName: "User", entityId: "1",
            newValues: "admin@test.com", ipAddress: "127.0.0.1");

        var log = db.AuditLogs.Single();
        Assert.Equal("user.login", log.Action);
        Assert.Equal(1, log.UserId);
        Assert.Equal("User", log.EntityName);
        Assert.Equal("1", log.EntityId);
        Assert.Equal("127.0.0.1", log.IpAddress);
    }

    [Fact]
    public async Task LogAsync_WithoutOptionalFields_StoresNulls()
    {
        var (service, db) = Build(nameof(LogAsync_WithoutOptionalFields_StoresNulls));

        await service.LogAsync("system.event");

        var log = db.AuditLogs.Single();
        Assert.Equal("system.event", log.Action);
        Assert.Null(log.UserId);
        Assert.Null(log.EntityName);
        Assert.Null(log.IpAddress);
    }

    // --- GetLogsAsync ---

    [Fact]
    public async Task GetLogsAsync_ReturnsPaginatedLogs()
    {
        var (service, _) = Build(nameof(GetLogsAsync_ReturnsPaginatedLogs));

        await service.LogAsync("user.login", userId: 1);
        await service.LogAsync("user.logout", userId: 1);

        var result = await service.GetLogsAsync(page: 1, pageSize: 10);

        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Items.Count);
    }

    [Fact]
    public async Task GetLogsAsync_FilterByAction_ReturnsMatchingLogs()
    {
        var (service, _) = Build(nameof(GetLogsAsync_FilterByAction_ReturnsMatchingLogs));

        await service.LogAsync("user.login", userId: 1);
        await service.LogAsync("user.login", userId: 1);
        await service.LogAsync("user.logout", userId: 1);

        var result = await service.GetLogsAsync(1, 10, action: "user.login");

        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, l => Assert.Contains("user.login", l.Action));
    }

    [Fact]
    public async Task GetLogsAsync_FilterByUserId_ReturnsOnlyThatUsersLogs()
    {
        var (service, db) = Build(nameof(GetLogsAsync_FilterByUserId_ReturnsOnlyThatUsersLogs));

        // Aggiunge un secondo utente
        var (hash, salt) = Api.Services.AuthService.HashPassword("Pass@1");
        db.Users.Add(new Api.Models.User
        {
            Id = 2,
            Email = "user2@test.com",
            Username = "user2",
            PasswordHash = hash,
            PasswordSalt = salt,
            LoginArea = Api.Models.Enums.LoginArea.App,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        await service.LogAsync("user.login", userId: 1);
        await service.LogAsync("user.login", userId: 2);

        var result = await service.GetLogsAsync(1, 10, userId: 1);

        Assert.Equal(1, result.TotalCount);
        Assert.All(result.Items, l => Assert.Equal(1, l.UserId));
    }

    [Fact]
    public async Task GetLogsAsync_FilterByEntityName_ReturnsMatchingLogs()
    {
        var (service, _) = Build(nameof(GetLogsAsync_FilterByEntityName_ReturnsMatchingLogs));

        await service.LogAsync("user.created", entityName: "User");
        await service.LogAsync("program.created", entityName: "Program");

        var result = await service.GetLogsAsync(1, 10, entityName: "User");

        Assert.Equal(1, result.TotalCount);
        Assert.Equal("User", result.Items[0].EntityName);
    }

    [Fact]
    public async Task GetLogsAsync_FilterByDateRange_ReturnsLogsInRange()
    {
        var (service, _) = Build(nameof(GetLogsAsync_FilterByDateRange_ReturnsLogsInRange));

        await service.LogAsync("user.login", userId: 1);

        var from = DateTime.UtcNow.AddMinutes(-1);
        var to = DateTime.UtcNow.AddMinutes(1);

        var resultIn = await service.GetLogsAsync(1, 10, from: from, to: to);
        var resultOut = await service.GetLogsAsync(1, 10, from: DateTime.UtcNow.AddDays(1));

        Assert.Equal(1, resultIn.TotalCount);
        Assert.Equal(0, resultOut.TotalCount);
    }

    [Fact]
    public async Task GetLogsAsync_Pagination_ReturnsCorrectPage()
    {
        var (service, _) = Build(nameof(GetLogsAsync_Pagination_ReturnsCorrectPage));

        for (int i = 0; i < 5; i++)
            await service.LogAsync($"action.{i}");

        var page1 = await service.GetLogsAsync(1, 3);
        var page2 = await service.GetLogsAsync(2, 3);

        Assert.Equal(5, page1.TotalCount);
        Assert.Equal(3, page1.Items.Count);
        Assert.Equal(2, page2.Items.Count);
    }

    [Fact]
    public async Task GetLogsAsync_OrderedByTimestampDescending()
    {
        var (service, _) = Build(nameof(GetLogsAsync_OrderedByTimestampDescending));

        await service.LogAsync("first");
        await Task.Delay(10);
        await service.LogAsync("second");

        var result = await service.GetLogsAsync(1, 10);

        // Il più recente deve essere il primo
        Assert.Equal("second", result.Items[0].Action);
        Assert.Equal("first", result.Items[1].Action);
    }
}
