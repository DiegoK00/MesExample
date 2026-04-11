# API — Email Service (Resend)

## Scopo

Invio email transazionali tramite il provider **Resend** (`resend.com`).

Attualmente usato per: reset password (forgot-password flow).

---

## Stack

- **NuGet package**: `Resend` (v3.x)
- **Interfaccia**: `IEmailService` (`Api.Services`)
- **Implementazione**: `EmailService` (`Api.Services`)

---

## Configurazione

`appsettings.json` (valori di default/produzione):
```json
"Resend": {
  "ApiKey": "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION",
  "From": "noreply@mesclaude.com"
},
"App": {
  "FrontendUrl": "https://mesclaude.com"
}
```

`appsettings.Development.json`:
```json
"Resend": {
  "ApiKey": "CHANGE_ME_USE_ENV_VAR_IN_PRODUCTION"
},
"App": {
  "FrontendUrl": "http://localhost:4200"
}
```

In produzione impostare `Resend__ApiKey` come variabile d'ambiente (non committare la chiave reale).

---

## Registrazione (Program.cs)

```csharp
builder.Services.AddResend(options =>
{
    options.ApiToken = builder.Configuration["Resend:ApiKey"]
        ?? throw new InvalidOperationException("Resend:ApiKey not configured.");
});
builder.Services.AddScoped<IEmailService, EmailService>();
```

---

## IEmailService

```csharp
public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken);
}
```

---

## Utilizzo

`AuthService.ForgotPasswordAsync` chiama:
```csharp
await emailService.SendPasswordResetEmailAsync(user.Email, resetToken.Token);
```

Il link nell'email punta a:
```
{App:FrontendUrl}/reset-password?token={token}
```

---

## Test

Nei progetti `Api_E2E/` e `Api_Playwright/`, `IEmailService` viene sostituito con un **no-op** (`NoOpEmailService`) via `ConfigureServices` — nessuna email reale viene inviata durante i test.

---

## Resend — Configurazione Account

1. Registrarsi su [resend.com](https://resend.com)
2. Aggiungere e verificare il dominio mittente (DNS: SPF, DKIM)
3. Generare una API Key dalla dashboard
4. Impostare la API Key come variabile d'ambiente: `Resend__ApiKey=re_...`
