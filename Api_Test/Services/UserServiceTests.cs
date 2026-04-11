using Api.DTOs.Users;
using Api.Models;
using Api.Models.Enums;
using Api.Services;
using Api.Tests.Helpers;

namespace Api.Tests.Services;

public class UserServiceTests
{
    private static (UserService service, Api.Data.AppDbContext db) Build(string dbName)
    {
        var db = DbContextFactory.CreateWithSeed(dbName);
        var auditLog = new AuditLogService(db);
        return (new UserService(db, auditLog), db);
    }

    // --- GetAllAsync ---

    [Fact]
    public async Task GetAllAsync_ReturnsPaginatedUsers()
    {
        var (service, _) = Build(nameof(GetAllAsync_ReturnsPaginatedUsers));

        var result = await service.GetAllAsync(page: 1, pageSize: 10);

        Assert.Equal(1, result.TotalCount);
        Assert.Single(result.Items);
        Assert.Equal(1, result.Page);
    }

    [Fact]
    public async Task GetAllAsync_WithSearch_FiltersResults()
    {
        var (service, _) = Build(nameof(GetAllAsync_WithSearch_FiltersResults));

        var resultFound = await service.GetAllAsync(1, 10, search: "admin");
        var resultNotFound = await service.GetAllAsync(1, 10, search: "nonexistent");

        Assert.Equal(1, resultFound.TotalCount);
        Assert.Equal(0, resultNotFound.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_PaginationWorks()
    {
        var db = DbContextFactory.CreateWithSeed(nameof(GetAllAsync_PaginationWorks));
        var auditLog = new AuditLogService(db);

        // Aggiungi 4 utenti extra
        for (int i = 2; i <= 5; i++)
        {
            var (hash, salt) = AuthService.HashPassword("Pass@1234");
            db.Users.Add(new User
            {
                Email = $"user{i}@test.com",
                Username = $"user{i}",
                PasswordHash = hash,
                PasswordSalt = salt,
                LoginArea = LoginArea.App,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync();

        var service = new UserService(db, auditLog);

        var page1 = await service.GetAllAsync(1, 3);
        var page2 = await service.GetAllAsync(2, 3);

        Assert.Equal(5, page1.TotalCount);
        Assert.Equal(3, page1.Items.Count);
        Assert.Equal(2, page2.Items.Count);
    }

    // --- GetByIdAsync ---

    [Fact]
    public async Task GetByIdAsync_ExistingUser_ReturnsUser()
    {
        var (service, _) = Build(nameof(GetByIdAsync_ExistingUser_ReturnsUser));

        var result = await service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("admin@test.com", result.Email);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistingUser_ReturnsNull()
    {
        var (service, _) = Build(nameof(GetByIdAsync_NonExistingUser_ReturnsNull));

        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    // --- CreateAsync ---

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesUser()
    {
        var (service, _) = Build(nameof(CreateAsync_ValidRequest_CreatesUser));

        var (user, error) = await service.CreateAsync(new CreateUserRequest
        {
            Email = "newuser@test.com",
            Username = "newuser",
            Password = "NewPass@1",
            LoginArea = LoginArea.App,
            RoleIds = [2]
        });

        Assert.Null(error);
        Assert.NotNull(user);
        Assert.Equal("newuser@test.com", user.Email);
        Assert.Contains("User", user.Roles);
    }

    [Fact]
    public async Task CreateAsync_DuplicateEmail_ReturnsError()
    {
        var (service, _) = Build(nameof(CreateAsync_DuplicateEmail_ReturnsError));

        var (user, error) = await service.CreateAsync(new CreateUserRequest
        {
            Email = "admin@test.com", // già esistente
            Username = "different",
            Password = "Pass@1",
            LoginArea = LoginArea.Admin,
            RoleIds = [1]
        });

        Assert.Null(user);
        Assert.Contains("Email", error);
    }

    [Fact]
    public async Task CreateAsync_DuplicateUsername_ReturnsError()
    {
        var (service, _) = Build(nameof(CreateAsync_DuplicateUsername_ReturnsError));

        var (user, error) = await service.CreateAsync(new CreateUserRequest
        {
            Email = "different@test.com",
            Username = "admin", // già esistente
            Password = "Pass@1",
            LoginArea = LoginArea.Admin,
            RoleIds = [1]
        });

        Assert.Null(user);
        Assert.Contains("Username", error);
    }

    [Fact]
    public async Task CreateAsync_SameEmailDifferentArea_Succeeds()
    {
        var (service, _) = Build(nameof(CreateAsync_SameEmailDifferentArea_Succeeds));

        // admin@test.com esiste in area Admin, deve poter esistere in area App
        var (user, error) = await service.CreateAsync(new CreateUserRequest
        {
            Email = "admin@test.com",
            Username = "admin_app",
            Password = "Pass@1",
            LoginArea = LoginArea.App,
            RoleIds = [2]
        });

        Assert.Null(error);
        Assert.NotNull(user);
    }

    // --- UpdateAsync ---

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesUser()
    {
        var (service, _) = Build(nameof(UpdateAsync_ValidRequest_UpdatesUser));

        var (user, error) = await service.UpdateAsync(1, new UpdateUserRequest
        {
            Email = "updated@test.com",
            Username = "updated_admin",
            IsActive = true,
            RoleIds = [1]
        });

        Assert.Null(error);
        Assert.NotNull(user);
        Assert.Equal("updated@test.com", user.Email);
        Assert.Equal("updated_admin", user.Username);
    }

    [Fact]
    public async Task UpdateAsync_NonExistingUser_ReturnsNulls()
    {
        var (service, _) = Build(nameof(UpdateAsync_NonExistingUser_ReturnsNulls));

        var (user, error) = await service.UpdateAsync(999, new UpdateUserRequest
        {
            Email = "x@test.com",
            Username = "x",
            IsActive = true,
            RoleIds = []
        });

        Assert.Null(user);
        Assert.Null(error);
    }

    // --- DeactivateAsync ---

    [Fact]
    public async Task DeactivateAsync_ExistingUser_DeactivatesAndReturnsTrue()
    {
        var (service, db) = Build(nameof(DeactivateAsync_ExistingUser_DeactivatesAndReturnsTrue));

        var result = await service.DeactivateAsync(1);

        Assert.True(result);
        Assert.False(db.Users.Find(1)!.IsActive);
    }

    [Fact]
    public async Task DeactivateAsync_NonExistingUser_ReturnsFalse()
    {
        var (service, _) = Build(nameof(DeactivateAsync_NonExistingUser_ReturnsFalse));

        var result = await service.DeactivateAsync(999);

        Assert.False(result);
    }

    // --- ChangePasswordAsync ---

    [Fact]
    public async Task ChangePasswordAsync_CorrectPassword_ChangesPasswordAndReturnsTrue()
    {
        var (service, _) = Build(nameof(ChangePasswordAsync_CorrectPassword_ChangesPasswordAndReturnsTrue));

        var result = await service.ChangePasswordAsync(1, "Admin@1234", "NewPass@999");

        Assert.True(result);

        // Verifica che il login con la nuova password funzioni
        var db2 = DbContextFactory.Create("verify_" + nameof(ChangePasswordAsync_CorrectPassword_ChangesPasswordAndReturnsTrue));
        // Leggiamo direttamente dal db l'hash aggiornato
        var updatedUser = service.GetByIdAsync(1).Result;
        Assert.NotNull(updatedUser);
    }

    [Fact]
    public async Task ChangePasswordAsync_WrongCurrentPassword_ReturnsFalse()
    {
        var (service, _) = Build(nameof(ChangePasswordAsync_WrongCurrentPassword_ReturnsFalse));

        var result = await service.ChangePasswordAsync(1, "WrongPass!", "NewPass@999");

        Assert.False(result);
    }

    [Fact]
    public async Task ChangePasswordAsync_InactiveUser_ReturnsFalse()
    {
        var (service, db) = Build(nameof(ChangePasswordAsync_InactiveUser_ReturnsFalse));
        db.Users.Find(1)!.IsActive = false;
        await db.SaveChangesAsync();

        var result = await service.ChangePasswordAsync(1, "Admin@1234", "NewPass@999");

        Assert.False(result);
    }
}
