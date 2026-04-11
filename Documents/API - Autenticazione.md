# API - Autenticazione

## Endpoint

| Metodo | Route | Descrizione | Area |
|--------|-------|-------------|------|
| POST | `/auth/login` | Login con email + password | Entrambe |
| POST | `/auth/refresh` | Rinnova AccessToken tramite RefreshToken | Entrambe |
| POST | `/auth/logout` | Revoca il RefreshToken corrente | Entrambe |
| POST | `/auth/forgot-password` | Invia email con link reset password | Entrambe |
| POST | `/auth/reset-password` | Imposta nuova password tramite token | Entrambe |

---

## Distinzione delle Aree

Il campo `LoginArea` viene incluso nel payload JWT come claim:

```json
{
  "sub": "42",
  "email": "user@example.com",
  "role": "Admin",
  "area": "Admin",
  "exp": 1234567890
}
```

I controller del backoffice verificano che `area == "Admin"` tramite policy dedicate.

---

## Password

- Hashing: **PBKDF2** con salt per utente (o `BCrypt` come alternativa)
- Il salt è salvato in `Users.PasswordSalt`
- Nessuna password in chiaro viene mai persistita o loggata

---

## Reset Password

1. Utente richiede reset → viene generato un token casuale (`PasswordResetTokens`)
2. Token inviato via email tramite **Resend** (scadenza: 1 ora) — vedi `API - Email Service.md`
3. Utente clicca il link → POST `/auth/reset-password` con token + nuova password
4. Token viene marcato come usato (`UsedAt = now`)
5. Tutti i RefreshToken dell'utente vengono revocati (sessioni invalidate)

---

## Sicurezza

- Rate limiting sugli endpoint di login e forgot-password
- Risposta identica per email esistente/non esistente (evita user enumeration)
- AccessToken non revocabile prima della scadenza — durata breve (15 min) mitiga il rischio
