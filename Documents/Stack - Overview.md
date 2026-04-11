# Stack - Overview

## Tech Stack

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| **API** | .NET / ASP.NET Core Web API | 10 (LTS) |
| **Web** | Angular + standalone components | 19 |
| **Mobile** | Flutter | latest stable |
| **ORM** | Entity Framework Core (Code First) | - |
| **Auth** | JWT + Refresh Token | - |
| **DB** | SQL Server | - |

---

## Struttura Monorepo

```
MesClaude/
├── api/        → .NET 10 / ASP.NET Core Web API
├── web/        → Angular 19
├── mobile/     → Flutter
├── documents/  → Documentazione tecnica
├── CLAUDE.md   → Linee guida per Claude Code
└── README.md   → Getting started
```

---

## Principi Architetturali

- Separazione netta tra business logic, data access e presentation
- API RESTful con `ProblemDetails` per gli errori
- Autenticazione JWT con refresh token rotation
- 2 aree di login distinte: **Admin** (backoffice) e **App** (utenti finali)
- Accesso ai programmi gestito per singolo utente (`UserPrograms`)
- Audit log centralizzato per tutte le azioni rilevanti
