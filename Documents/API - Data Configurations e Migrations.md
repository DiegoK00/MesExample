# API - Data Configurations e Migrations

Pattern di configurazione EF Core e gestione delle migrations del database.

---

## Pattern IEntityTypeConfiguration

Ogni entità ha la propria classe di configurazione in `api/Data/Configurations/`, che implementa `IEntityTypeConfiguration<T>`.

Le configurazioni vengono registrate automaticamente in `AppDbContext.OnModelCreating`:
```csharp
modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
```

### Perché una classe per entità

Separare la configurazione dal modello mantiene i file `Models/` puliti e sposta la logica di mapping (vincoli, indici, FK) in un posto dedicato e facilmente trovabile.

### Convenzioni applicate

| Aspetto | Regola |
|---------|--------|
| Delete behavior | Sempre `Restrict` — nessuna cascata automatica |
| Decimali | `HasColumnType("decimal(18,2)")` per prezzi, `HasPrecision(18,4)` per quantità |
| Stringhe obbligatorie | `.IsRequired().HasMaxLength(n)` |
| Indici univoci | Definiti esplicitamente con `HasIndex(...).IsUnique()` |
| Check constraint | Usati per vincoli di dominio (es. `QuantityType IN ('PHYSICAL','PERCENTAGE')`) |

### Esempi notevoli

**ArticleConfiguration** — indice univoco su `Code`, FK `Restrict` verso `Category`, `MeasureUnit` e `User` (creatore e cancellatore separati).

**BillOfMaterialConfiguration** — chiave primaria composta `(ParentArticleId, ComponentArticleId)`, check constraint per evitare auto-referenza (`ParentArticleId <> ComponentArticleId`) e per limitare `QuantityType` ai soli valori ammessi.

**UserConfiguration** — indice univoco su `Email` e indice univoco composto `(Username, LoginArea)` — stesso username può esistere nelle due aree (App e Admin).

---

## Migrations

Le migrations si trovano in `api/Migrations/` e usano EF Core Code-First.

### Migrations esistenti

| Classe | Data | Contenuto |
|--------|------|-----------|
| `InitialCreate` | 2026-03-29 | Users, Roles, UserRoles, Programs, UserPrograms, RefreshTokens, PasswordResetTokens, AuditLogs |
| `AddArticles` | 2026-04-11 | Categories, MeasureUnits, Articles |
| `AddConfiguratorRole` | 2026-04-11 | Seed ruolo `Configurator` |
| `AddBillOfMaterials` | 2026-04-13 | BillOfMaterials con chiave composta e check constraint |

### Comandi principali

```bash
# Creare una nuova migration (dalla root del progetto)
dotnet ef migrations add NomeMigration --project api

# Applicare le migrations pendenti al DB
dotnet ef database update --project api

# Rollback all'ultima migration applicata
dotnet ef database update NomeMigrationPrecedente --project api

# Rimuovere l'ultima migration non ancora applicata
dotnet ef migrations remove --project api

# Generare script SQL (per deploy manuale su produzione)
dotnet ef migrations script --project api --output deploy.sql
```

### Strategia per ambiente

| Ambiente | Applicazione migrations |
|----------|------------------------|
| Sviluppo | `dotnet ef database update` manuale dopo ogni pull |
| Test (CI) | InMemory database — le migrations non vengono applicate |
| Produzione | Script SQL generato con `migrations script` e applicato manualmente prima del deploy |

### Regole per le migrations

- Non modificare mai una migration già applicata in produzione — creare sempre una migration nuova
- I seed dati (es. ruoli) vanno inseriti tramite migration dedicata, non in `OnModelCreating`
- In caso di rollback in produzione: applicare lo script `Down()` della migration o ripristinare dal backup
