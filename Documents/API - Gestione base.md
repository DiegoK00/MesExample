# API - Gestione Base

## Tabelle

| Tabella | Descrizione |
|---------|-------------|
| `Users` | Anagrafica utenti con supporto a 2 aree di login (Admin / App) |
| `Roles` | Ruoli di sistema: SuperAdmin, Admin, User |
| `UserRoles` | Associazione M:N tra Users e Roles |
| `Programs` | Programmi/moduli applicativi accessibili agli utenti |
| `UserPrograms` | Associazione M:N tra Users e Programs con tracciabilità (GrantedBy) |
| `RefreshTokens` | Token JWT refresh per la gestione delle sessioni |
| `AuditLogs` | Log azioni utente: chi, cosa, quando, da dove |
| `PasswordResetTokens` | Token monouso per il reset della password via email |

---

## Aree di Login

Gestite tramite l'enum `LoginArea` sulla tabella `Users`:

| Valore | Area | Descrizione |
|--------|------|-------------|
| `1` | `Admin` | Backoffice — accesso amministratori |
| `2` | `App` | Frontend — accesso utenti finali |

> Lo stesso indirizzo email può esistere in entrambe le aree.
> Lo stesso username è unico **per LoginArea** (indice composito su `Username + LoginArea`).

---

## Seed Data

Alla prima migrazione vengono inseriti automaticamente i ruoli base:

| Id | Name | Description |
|----|------|-------------|
| 1 | SuperAdmin | Full system access |
| 2 | Admin | Administrative access |
| 3 | User | Standard user access |

---

## Convenzioni EF Core

- Ogni entità ha la propria classe di configurazione in `Data/Configurations/` che implementa `IEntityTypeConfiguration<T>`
- Il `DbContext` applica tutte le configurazioni via `ApplyConfigurationsFromAssembly`
- Le chiavi composte (es. `UserRole`, `UserProgram`) usano `HasKey` con chiave composta — nessuna colonna `Id` aggiuntiva
- Tutti i campi obbligatori usano `.IsRequired()` esplicito nella configurazione
- I `DeleteBehavior` sono configurati esplicitamente per evitare cicli di cascade non voluti

---

## Pacchetti NuGet (API)

```
Microsoft.EntityFrameworkCore.SqlServer
Microsoft.EntityFrameworkCore.Tools
Microsoft.AspNetCore.Authentication.JwtBearer
FluentValidation.AspNetCore
Swashbuckle.AspNetCore
```

---

## Comandi EF Core

```bash
# Prima migrazione
dotnet ef migrations add InitialCreate

# Applica al database
dotnet ef database update

# Rimuovi ultima migrazione (se non ancora applicata)
dotnet ef migrations remove
```
