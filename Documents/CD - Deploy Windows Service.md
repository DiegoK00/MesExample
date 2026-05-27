# CD - Deploy Windows Service

Strategia di Continuous Deployment per l'API ASP.NET Core su server Windows tramite Windows Service.  
Lo script di deploy è `setup.ps1` nella root del progetto.

---

## Pattern adottato

L'API viene pubblicata come **Windows Service** con `StartupType Automatic`:
- Si avvia automaticamente al boot del server
- Nessuna dipendenza da IIS
- Aggiornamento senza reinstallazione tramite `sc.exe config`

Flusso CD tipico:
```
push → main
  └─ GitHub Actions CI (build + test) ✓
       └─ deploy manuale o automatizzato sul server Windows
            └─ .\setup.ps1 -Deploy
```

---

## Script: setup.ps1

Tre modalità operative:

| Flag | Richiede admin | Cosa fa |
|------|---------------|---------|
| `-Dev` | No | Restore dipendenze .NET, npm, Flutter per sviluppo locale |
| `-Deploy` | Sì | `dotnet publish` + installa o aggiorna il Windows Service |
| `-Uninstall` | Sì | Stop + rimozione del servizio |

### Parametri opzionali

| Parametro | Default | Descrizione |
|-----------|---------|-------------|
| `-ServiceName` | `MesClaudeApi` | Nome del Windows Service |
| `-InstallPath` | `C:\Services\MesClaudeApi` | Cartella di deploy |
| `-ApiUrl` | `http://localhost:5000` | URL di ascolto dell'API |

### Esempi

```powershell
# Setup developer locale
.\setup.ps1 -Dev

# Deploy su server (PowerShell elevato)
.\setup.ps1 -Deploy

# Deploy con parametri personalizzati
.\setup.ps1 -Deploy -ServiceName "MesClaudeApi" -InstallPath "D:\Services\Api" -ApiUrl "http://localhost:8080"

# Rimozione del servizio
.\setup.ps1 -Uninstall
```

---

## Prima installazione sul server

### 1. Prerequisiti server
- Windows Server 2019+ (o Windows 10/11)
- .NET 10 Runtime installato (non SDK — solo Runtime è sufficiente)
- PowerShell 7+

### 2. Eseguire il deploy
```powershell
# Da PowerShell elevato (Run as Administrator)
cd C:\deploy\MesClaude
.\setup.ps1 -Deploy
```

Lo script:
1. Esegue `dotnet publish` in Release
2. Copia i binari in `C:\Services\MesClaudeApi\`
3. Crea il file `appsettings.Production.json` (vuoto — da riempire manualmente)
4. Installa e avvia il Windows Service

### 3. Configurare i secrets
Dopo il primo deploy, aprire `C:\Services\MesClaudeApi\appsettings.Production.json` e inserire i valori reali:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=MesClaude;User Id=...;Password=...;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "stringa-random-almeno-32-caratteri"
  },
  "Resend": {
    "ApiKey": "re_xxxxxxxxxxxxxxxx"
  },
  "Cors": {
    "AllowedOrigins": ["https://mesclaude.com"]
  },
  "Urls": "http://localhost:5000"
}
```

Questo file **non va mai committato** nel repository.

### 4. Verificare il servizio
```powershell
Get-Service -Name MesClaudeApi
# Status: Running

# Log in tempo reale (Event Viewer oppure)
Get-EventLog -LogName Application -Source MesClaudeApi -Newest 20
```

---

## Aggiornamento (deploy successivi)

```powershell
# Da PowerShell elevato sul server
cd C:\deploy\MesClaude
git pull
.\setup.ps1 -Deploy
```

Lo script rileva che il servizio esiste già, lo ferma, aggiorna il binario e lo riavvia.  
`appsettings.Production.json` **non viene sovrascritto** — i secrets sono preservati.

---

## Relazione con GitHub Actions

GitHub Actions esegue CI (build + test) ma **non fa deploy** — il deploy è un'operazione manuale o tramite uno step aggiuntivo che chiama `setup.ps1` via SSH/WinRM sul server.

Per automatizzare completamente aggiungere a `.github/workflows/ci.yml` uno step condizionale:

```yaml
  deploy:
    name: Deploy API
    needs: [api-build, api-test]
    runs-on: windows-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        # Esempio con appleboy/ssh-action
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SERVER_PASSWORD }}
          script: |
            cd C:\deploy\MesClaude
            git pull
            powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Deploy
```

I secrets `SERVER_HOST`, `SERVER_USER`, `SERVER_PASSWORD` vanno configurati in GitHub → Settings → Secrets.

---

## Setup locale sviluppatore (-Dev)

Usa `-Dev` per installare tutte le dipendenze su una macchina di sviluppo da zero. Non richiede privilegi di amministratore.

```powershell
# Dalla root del progetto
.\setup.ps1 -Dev
```

Lo script esegue in sequenza:

1. **Verifica prerequisiti** — controlla che siano installati .NET 10 SDK, Node.js, npm, Flutter
2. **Restore .NET** — `dotnet restore` su tutti e 4 i progetti:
   - `api/Api.csproj`
   - `Api_Test/Api.Tests.csproj`
   - `Api_E2E/Api.E2E.csproj`
   - `Api_Playwright/Api.Playwright.csproj`
3. **Install npm** — `npm ci` nella cartella `web/`
4. **Flutter pub get** — `flutter pub get` nella cartella `mobile/`

### Prerequisiti da installare manualmente prima di -Dev

| Tool | Versione minima | Link |
|------|----------------|------|
| .NET SDK | 10.0.x | https://dot.net |
| Node.js | 20+ | https://nodejs.org |
| Flutter SDK | 3.x stable | https://flutter.dev |
| PowerShell | 7+ | https://github.com/PowerShell/PowerShell |

### Dopo -Dev: avviare l'ambiente locale

```powershell
# Terminal 1 — API
cd api && dotnet run

# Terminal 2 — Web
cd web && npx ng serve

# Terminal 3 — Mobile
cd mobile && flutter run --dart-define-from-file=config/env.dev.android.json
```

Vedi [ComandiDiAvvio.md](ComandiDiAvvio.md) per tutti i comandi di avvio e debug.
