# CD - Checklist Deploy e Healthcheck

Procedura pre/post deploy per l'API ASP.NET Core su Windows Service.  
Da seguire ogni volta che si esegue `setup.ps1 -Deploy` sul server di produzione.

---

## Checklist pre-deploy

Prima di eseguire `setup.ps1 -Deploy`:

- [ ] La CI è verde su `main` (tutti i job GitHub Actions passati)
- [ ] Le migrations pendenti sono state applicate — verificare con:
  ```powershell
  dotnet ef migrations list --project api
  ```
  Se compaiono migration con `(Pending)`, applicarle **prima** del deploy:
  ```powershell
  dotnet ef database update --project api
  ```
  oppure generare lo script SQL e applicarlo manualmente:
  ```powershell
  dotnet ef migrations script --project api --output deploy.sql
  # applicare deploy.sql sul database di produzione con SSMS o sqlcmd
  ```
- [ ] `appsettings.Production.json` sul server è aggiornato con le eventuali nuove chiavi di configurazione
- [ ] Backup del database effettuato (prima di migration distruttive o rename di colonne)

---

## Esecuzione deploy

```powershell
# Da PowerShell elevato (Run as Administrator)
cd C:\deploy\MesClaude
git pull
.\setup.ps1 -Deploy
```

Lo script:
1. Esegue `dotnet publish` in Release
2. Ferma il servizio esistente (se presente)
3. Copia i binari in `C:\Services\MesClaudeApi\`
4. Riavvia il servizio
5. **Non sovrascrive** `appsettings.Production.json`

---

## Healthcheck post-deploy

Dopo il deploy verificare che il servizio sia operativo.

### 1. Stato del servizio Windows

```powershell
Get-Service -Name MesClaudeApi
# Expected: Status = Running
```

### 2. Risposta HTTP

```powershell
# Healthcheck endpoint (se configurato)
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing

# Oppure qualsiasi endpoint pubblico
Invoke-WebRequest -Uri http://localhost:5000/swagger -UseBasicParsing
```

Risposta attesa: `StatusCode: 200`

### 3. Log degli ultimi eventi

```powershell
Get-EventLog -LogName Application -Source MesClaudeApi -Newest 20
```

Verificare assenza di errori fatali (`EntryType = Error`) al momento dell'avvio.

### 4. Test login

Eseguire un login di smoke test tramite curl o Postman:

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"...\",\"area\":1}"
```

Risposta attesa: `200 OK` con `accessToken`.

---

## Rollback

Se il servizio non si avvia o i test post-deploy falliscono:

### Rollback rapido (binari precedenti)

Lo script di deploy non mantiene automaticamente una copia dei binari precedenti. Se si vuole rollback rapido, fare backup manuale prima del deploy:

```powershell
Copy-Item C:\Services\MesClaudeApi C:\Services\MesClaudeApi_backup -Recurse
```

Per ripristinare:
```powershell
Stop-Service MesClaudeApi
Remove-Item C:\Services\MesClaudeApi -Recurse
Rename-Item C:\Services\MesClaudeApi_backup C:\Services\MesClaudeApi
Start-Service MesClaudeApi
```

### Rollback database (migration)

Se la migration ha causato problemi:

```powershell
# Tornare alla migration precedente
dotnet ef database update NomeMigrationPrecedente --project api
```

Per migration con DROP COLUMN o DROP TABLE: applicare manualmente lo script `Down()` della migration oppure ripristinare da backup.

---

## Aggiunta endpoint /health (opzionale)

Per rendere il healthcheck automatizzabile, aggiungere a `Program.cs`:

```csharp
app.MapHealthChecks("/health");
```

E registrare il servizio in `Program.cs`:

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();  // verifica connessione DB
```

Pacchetto richiesto: `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore`

Il check `AddDbContextCheck` esegue una query `SELECT 1` sul database a ogni chiamata `/health` — utile per verificare sia l'API che la connessione DB con una sola richiesta.
