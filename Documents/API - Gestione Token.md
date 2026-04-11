# API - Gestione Token

## Strategia JWT + Refresh Token

L'autenticazione usa una coppia di token:

| Token | Durata | Scopo |
|-------|--------|-------|
| **Access Token** (JWT) | 15 minuti | Autorizza le chiamate API |
| **Refresh Token** | 7 giorni | Ottiene un nuovo Access Token senza re-login |

---

## Flusso

```
1. Login → restituisce AccessToken + RefreshToken
2. Ogni richiesta → header: Authorization: Bearer <AccessToken>
3. AccessToken scaduto → chiama /auth/refresh con il RefreshToken
4. Refresh valido → nuova coppia AccessToken + RefreshToken (rotation)
5. Logout → RevokedAt del RefreshToken corrente
```

---

## Tabella RefreshTokens

| Campo | Tipo | Note |
|-------|------|------|
| `Id` | int | PK |
| `UserId` | int | FK → Users |
| `Token` | string(512) | Hash unico, indice univoco |
| `ExpiresAt` | DateTime | Scadenza (7 giorni) |
| `CreatedAt` | DateTime | Data creazione |
| `RevokedAt` | DateTime? | Valorizzato su logout o rotation |
| `CreatedByIp` | string(45) | IP del client (IPv4/IPv6) |

---

## Regole

- Un RefreshToken è valido se: `RevokedAt == null` AND `ExpiresAt > now`
- Ad ogni refresh il token precedente viene revocato e ne viene generato uno nuovo (**token rotation**)
- In caso di riuso di un token già revocato → revocare **tutti** i token dell'utente (possibile furto)
- I token scaduti possono essere eliminati periodicamente (job di cleanup)

---

## Configurazione JWT (appsettings)

```json
"Jwt": {
  "Secret": "...",
  "Issuer": "api.myapp.com",
  "Audience": "myapp.com",
  "AccessTokenExpiryMinutes": 15,
  "RefreshTokenExpiryDays": 7
}
```

> Il `Secret` non va mai nel repository — usare variabili d'ambiente o secrets manager.
