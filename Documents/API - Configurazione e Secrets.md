# API - Configurazione e Secrets

Schema completo di `appsettings.json` e gestione dei secrets per ambiente.

---

## Schema appsettings.json

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=MesClaude;User Id=...;Password=...;TrustServerCertificate=True;"
  },
  "Cors": {
    "AllowedOrigins": ["https://mesclaude.com"]
  },
  "Jwt": {
    "Secret": "stringa-random-almeno-32-caratteri",
    "Issuer": "api.mesclaude.local",
    "Audience": "mesclaude.local",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "Resend": {
    "ApiKey": "re_xxxxxxxxxxxxxxxx",
    "From": "noreply@mesclaude.com"
  },
  "App": {
    "FrontendUrl": "https://mesclaude.com"
  }
}
```

---

## Chiavi obbligatorie

| Chiave | Tipo | Note |
|--------|------|------|
| `ConnectionStrings:DefaultConnection` | string | Stringa connessione SQL Server |
| `Jwt:Secret` | string | Min 32 caratteri — usata per firmare i JWT |
| `Jwt:Issuer` | string | Deve corrispondere tra API e client |
| `Jwt:Audience` | string | Deve corrispondere tra API e client |
| `Resend:ApiKey` | string | API key del servizio email Resend |

## Chiavi opzionali

| Chiave | Default | Note |
|--------|---------|------|
| `Jwt:AccessTokenExpiryMinutes` | `15` | Scadenza access token in minuti |
| `Jwt:RefreshTokenExpiryDays` | `7` | Scadenza refresh token in giorni |
| `Cors:AllowedOrigins` | `[]` | Array vuoto = CORS disabilitato |
| `Resend:From` | — | Indirizzo mittente email |
| `App:FrontendUrl` | — | URL frontend (usato nei link delle email di reset password) |

---

## Strategia per ambiente

| File | Scopo | Nel repo |
|------|-------|----------|
| `appsettings.json` | Valori di sviluppo / placeholder | Sì |
| `appsettings.Development.json` | Override locali sviluppatore | Sì (valori non sensibili) |
| `appsettings.Production.json` | Secrets produzione sul server | **No** — creato da `setup.ps1 -Deploy` |

ASP.NET Core carica i file in ordine: `appsettings.json` → `appsettings.{Environment}.json` → variabili d'ambiente. Ogni livello sovrascrive il precedente.

### appsettings.Production.json (sul server)

Creato automaticamente da `setup.ps1 -Deploy` in `C:\Services\MesClaudeApi\`.  
Va compilato manualmente dopo il primo deploy con i valori reali:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...produzione..."
  },
  "Jwt": {
    "Secret": "secret-produzione-lungo-e-random"
  },
  "Resend": {
    "ApiKey": "re_produzione_key"
  },
  "Cors": {
    "AllowedOrigins": ["https://mesclaude.com"]
  },
  "Urls": "http://localhost:5000"
}
```

---

## Valori da NON committare mai

- `Jwt:Secret` — chiave di firma JWT
- `ConnectionStrings:DefaultConnection` con password reali
- `Resend:ApiKey`

Il file `appsettings.json` nel repo usa `CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION` come placeholder esplicito per questi valori.
