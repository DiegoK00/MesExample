using System.Net;
using System.Text.Json;
using Api.Data;
using Api.Models;
using Api.Models.Enums;
using Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Playwright;

namespace Api.Playwright.Helpers;

/// <summary>
/// Fixture che avvia l'API su una porta Kestrel reale (dual-host pattern)
/// e fornisce un IAPIRequestContext di Playwright per i test E2E.
/// </summary>
public class PlaywrightApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _dbName = $"PlaywrightDb_{Guid.NewGuid()}";
    private IHost? _kestrelHost;
    private IPlaywright? _playwright;

    public string ServerUrl { get; private set; } = string.Empty;
    public IAPIRequestContext Request { get; private set; } = null!;

    // ── Configurazione dell'host ──────────────────────────────────────────────

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
            // Sostituisci SqlServer con InMemory
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

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));

            // Sostituisci IEmailService con no-op (nessuna email reale nei test)
            var emailDescriptor = services.FirstOrDefault(d => d.ServiceType == typeof(IEmailService));
            if (emailDescriptor != null) services.Remove(emailDescriptor);
            services.AddScoped<IEmailService, NoOpEmailService>();

            // Override JWT validation per usare la chiave di test
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

    /// <summary>
    /// Dual-host pattern: crea il test host (per DI/seeding) e in parallelo
    /// avvia un vero server Kestrel su porta casuale per Playwright.
    /// </summary>
    protected override IHost CreateHost(IHostBuilder builder)
    {
        // Host in-memory usato da WebApplicationFactory internamente
        var testHost = builder.Build();

        // Configura e avvia un Kestrel reale su porta dinamica
        builder.ConfigureWebHost(wb =>
            wb.UseKestrel(opts => opts.Listen(IPAddress.Loopback, 0)));

        _kestrelHost = builder.Build();
        _kestrelHost.Start();

        ServerUrl = _kestrelHost.Services
            .GetRequiredService<IServer>()
            .Features
            .Get<IServerAddressesFeature>()!
            .Addresses
            .First();

        return testHost;
    }

    // ── IAsyncLifetime ────────────────────────────────────────────────────────

    async Task IAsyncLifetime.InitializeAsync()
    {
        // Seed del database InMemory
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        SeedDatabase(db);

        // Inizializza Playwright e crea il contesto HTTP di base
        _playwright = await Microsoft.Playwright.Playwright.CreateAsync();
        Request = await _playwright.APIRequest.NewContextAsync(new()
        {
            BaseURL = ServerUrl,
            ExtraHTTPHeaders = new Dictionary<string, string>
            {
                ["Accept"] = "application/json"
            }
        });
    }

    public new async Task DisposeAsync()
    {
        await Request.DisposeAsync();
        _playwright?.Dispose();
        if (_kestrelHost != null)
        {
            await _kestrelHost.StopAsync();
            _kestrelHost.Dispose();
        }
        await base.DisposeAsync();
    }

    // ── Helpers per i test ────────────────────────────────────────────────────

    public async Task<string> LoginAsync(
        string email = "admin@test.com",
        string password = "Admin@1234",
        int area = 1)
    {
        var response = await Request.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { email, password, area }
        });
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.GetProperty("accessToken").GetString()!;
    }

    public async Task<string> LoginAndGetRefreshTokenAsync(
        string email = "admin@test.com",
        string password = "Admin@1234",
        int area = 1)
    {
        var response = await Request.PostAsync("/auth/login", new APIRequestContextOptions
        {
            DataObject = new { email, password, area }
        });
        var text = await response.TextAsync();
        using var doc = JsonDocument.Parse(text);
        return doc.RootElement.GetProperty("refreshToken").GetString()!;
    }

    /// <summary>
    /// Legge dal DB il token di reset più recente per l'utente dato (non ancora usato e non scaduto).
    /// Utile nei test di forgot-password / reset-password dove l'API non restituisce il token.
    /// </summary>
    public async Task<string?> GetLatestResetTokenAsync(string email)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var token = await db.PasswordResetTokens
            .Include(t => t.User)
            .Where(t => t.User.Email == email && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => t.Token)
            .FirstOrDefaultAsync();
        return token;
    }

    public async Task<IAPIRequestContext> CreateAuthenticatedContextAsync(string token)
    {
        return await _playwright!.APIRequest.NewContextAsync(new()
        {
            BaseURL = ServerUrl,
            ExtraHTTPHeaders = new Dictionary<string, string>
            {
                ["Authorization"] = $"Bearer {token}",
                ["Accept"] = "application/json"
            }
        });
    }

    // ── Seed ─────────────────────────────────────────────────────────────────

    private static void SeedDatabase(AppDbContext db)
    {
        if (db.Roles.Any()) return;

        db.Roles.AddRange(
            new Role { Id = 1, Name = "SuperAdmin" },
            new Role { Id = 2, Name = "Admin" },
            new Role { Id = 3, Name = "User" });
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
}

file sealed class NoOpEmailService : IEmailService
{
    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken) => Task.CompletedTask;
}
