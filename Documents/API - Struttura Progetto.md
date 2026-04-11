# API - Struttura Progetto

## Cartelle

```
api/
├── Api/
│   ├── Controllers/        → Endpoint REST
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/ → IEntityTypeConfiguration per ogni entità
│   ├── Models/
│   │   ├── Enums/
│   │   │   └── LoginArea.cs
│   │   ├── User.cs
│   │   ├── Role.cs
│   │   ├── UserRole.cs
│   │   ├── AppProgram.cs
│   │   ├── UserProgram.cs
│   │   ├── RefreshToken.cs
│   │   ├── AuditLog.cs
│   │   └── PasswordResetToken.cs
│   ├── Services/           → Business logic
│   ├── DTOs/               → Request / Response objects
│   ├── Validators/         → FluentValidation
│   ├── Middleware/         → Error handling, logging
│   ├── appsettings.json
│   └── Program.cs
```

---

## Pacchetti NuGet

| Pacchetto | Scopo |
|-----------|-------|
| `Microsoft.EntityFrameworkCore.SqlServer` | ORM + provider SQL Server |
| `Microsoft.EntityFrameworkCore.Tools` | Migrations CLI |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Autenticazione JWT |
| `FluentValidation.AspNetCore` | Validazione request |
| `Swashbuckle.AspNetCore` | Swagger / OpenAPI |

---

## Configurazione DbContext (Program.cs)

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

---

## Comandi EF Core

```bash
# Prima migrazione
dotnet ef migrations add InitialCreate --project Api

# Applica al database
dotnet ef database update --project Api

# Rimuovi ultima migrazione
dotnet ef migrations remove --project Api
```
