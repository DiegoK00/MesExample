using Api.Data;
using Api.Models;
using Api.Models.Enums;
using Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Api.Tests.Helpers;

public static class DbContextFactory
{
    public static AppDbContext Create(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new AppDbContext(options);
    }

    /// <summary>
    /// Crea un db con dati seed: ruoli base + 1 utente admin attivo.
    /// </summary>
    public static AppDbContext CreateWithSeed(string dbName)
    {
        var db = Create(dbName);

        var roleAdmin = new Role { Id = 1, Name = "SuperAdmin" };
        var roleUser = new Role { Id = 2, Name = "User" };
        db.Roles.AddRange(roleAdmin, roleUser);

        var (hash, salt) = AuthService.HashPassword("Admin@1234");
        var adminUser = new User
        {
            Id = 1,
            Email = "admin@test.com",
            Username = "admin",
            PasswordHash = hash,
            PasswordSalt = salt,
            LoginArea = LoginArea.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UserRoles = [new UserRole { RoleId = 1 }]
        };

        db.Users.Add(adminUser);
        db.SaveChanges();

        return db;
    }
}
