# Web — Struttura Progetto

## Setup

```bash
npm install -g @angular/cli
ng new web --standalone --routing --style=scss
cd web
ng serve          # dev server su http://localhost:4200
npm test          # Jasmine + Karma
npm run e2e       # Playwright E2E
```

---

## Convenzioni

- **Standalone components** — nessun NgModule dove possibile
- **Signals** per lo stato locale dei componenti
- **RxJS** solo per stream asincroni e chiamate HTTP
- **OnPush** change detection su tutti i componenti
- **Lazy loading** per feature routes — bundle iniziale minimo
- Chiamate API centralizzate in **services** con `HttpClient` tipizzato
- Componenti UI da **Angular Material** (libreria unica e consistente)

---

## Struttura Cartelle

```
web/src/
├── app/
│   ├── core/
│   │   ├── models/         → Tipi TypeScript per API responses
│   │   ├── services/       → AuthService, UsersService, ecc.
│   │   ├── interceptors/   → AuthInterceptor (JWT + refresh)
│   │   └── guards/         → adminGuard, appGuard
│   ├── features/
│   │   ├── auth/login/     → LoginComponent (area parametrica)
│   │   ├── admin/          → Area backoffice (lazy)
│   │   └── app/            → Area utenti (lazy)
│   ├── app.routes.ts
│   └── app.config.ts
└── environments/
    ├── environment.ts       → apiUrl: 'http://localhost:5260' (dev)
    └── environment.prod.ts  → apiUrl: 'https://api.mesclaude.com' (prod)
```

---

## Route principali

```
/                    → redirect /admin/login
/admin/login         → LoginComponent (area=1)
/admin/              → AdminLayoutComponent [adminGuard]
  /admin/users       → UsersComponent
  /admin/programs    → ProgramsComponent
  /admin/audit-logs  → AuditLogsComponent
/app/login           → LoginComponent (area=2)
/app/                → AppLayoutComponent [appGuard]
  /app/dashboard     → DashboardComponent
```

---

## Ambienti (environments)

| File | `production` | `apiUrl` |
|------|-------------|---------|
| `environment.ts` | `false` | `http://localhost:5260` |
| `environment.prod.ts` | `true` | `https://api.mesclaude.com` |

Il file viene sostituito automaticamente dalla build Angular tramite `fileReplacements` in `angular.json`:

```json
"fileReplacements": [
  { "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts" }
]
```

Tutti i service usano `environment.apiUrl` — mai hardcodato.

```bash
# Build produzione (usa environment.prod.ts)
npx ng build --configuration=production
```

---

## Dipendenze principali

| Pacchetto | Versione | Uso |
|-----------|----------|-----|
| `@angular/core` | 19 | Framework |
| `@angular/material` | 19 | UI component library |
| `@playwright/test` | 1.59 | E2E test |
| Jasmine + Karma | — | Unit test |
