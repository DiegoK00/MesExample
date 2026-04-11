using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Api.Data;
using Api.Models;
using Api.Models.Enums;
using Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Api.E2E.Helpers;

public class ApiE2EFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbName = $"E2EDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "super-secret-test-key-that-is-at-least-32-chars!!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Jwt:AccessTokenExpiryMinutes"] = "60",
                ["Jwt:RefreshTokenExpiryDays"] = "7",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Rimuovi TUTTO ciò che fa riferimento a SqlServer o al DbContext registrato
            var toRemove = services
                .Where(d =>
                {
                    var st = d.ServiceType.FullName ?? string.Empty;
                    var it = d.ImplementationType?.FullName ?? string.Empty;
                    var ifact = d.ImplementationFactory?.GetType().FullName ?? string.Empty;

                    return d.ServiceType == typeof(AppDbContext)
                        || st.Contains("DbContextOptions")
                        || it.Contains("SqlServer")
                        || ifact.Contains("SqlServer");
                })
                .ToList();

            foreach (var d in toRemove) services.Remove(d);

            // Aggiungi InMemory
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));

            // Sostituisci IEmailService con no-op (nessuna email reale nei test)
            var emailDescriptor = services.FirstOrDefault(d => d.ServiceType == typeof(IEmailService));
            if (emailDescriptor != null) services.Remove(emailDescriptor);
            services.AddScoped<IEmailService, NoOpEmailService>();

            // Override JWT bearer options con i valori di test
            // (necessario perché Program.cs legge il secret a startup time prima degli override di config)
            const string testSecret = "super-secret-test-key-that-is-at-least-32-chars!!";
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = "test-issuer",
                    ValidAudience = "test-audience",
                    IssuerSigningKey = new SymmetricSecurityKey(
                        System.Text.Encoding.UTF8.GetBytes(testSecret))
                };
            });
        });
    }

    public async Task InitializeAsync()
    {
        await Task.CompletedTask; // richiesto da IAsyncLifetime
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        SeedDatabase(db);
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
    }

    private static void SeedDatabase(AppDbContext db)
    {
        // Salta il seed se il DB è già popolato (salvaguardia contro doppia inizializzazione)
        if (db.Roles.Any())
            return;

        var superAdmin = new Role { Id = 1, Name = "SuperAdmin" };
        var admin = new Role { Id = 2, Name = "Admin" };
        var user = new Role { Id = 3, Name = "User" };
        db.Roles.AddRange(superAdmin, admin, user);
        db.SaveChanges();

        var (hash, salt) = AuthService.HashPassword("Admin@1234");
        db.Users.Add(new User
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
        });

        db.SaveChanges();
    }

    public async Task<string> LoginAsync(string email = "admin@test.com", string password = "Admin@1234", int area = 1)
    {
        var client = CreateClient();
        var body = JsonSerializer.Serialize(new { email, password, area });
        var response = await client.PostAsync("/auth/login",
            new StringContent(body, Encoding.UTF8, "application/json"));
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("accessToken").GetString()!;
    }

    public async Task<string> LoginAndGetRefreshTokenAsync(string email = "admin@test.com", string password = "Admin@1234", int area = 1)
    {
        var client = CreateClient();
        var body = JsonSerializer.Serialize(new { email, password, area });
        var response = await client.PostAsync("/auth/login",
            new StringContent(body, Encoding.UTF8, "application/json"));
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("refreshToken").GetString()!;
    }

    public HttpClient CreateAuthenticatedClient(string token)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    /// <summary>
    /// Legge dal DB il token di reset più recente per l'utente dato (non ancora usato e non scaduto).
    /// </summary>
    public async Task<string?> GetLatestResetTokenAsync(string email)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.PasswordResetTokens
            .Include(t => t.User)
            .Where(t => t.User.Email == email && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => t.Token)
            .FirstOrDefaultAsync();
    }
}

file sealed class NoOpEmailService : IEmailService
{
    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken) => Task.CompletedTask;
}
