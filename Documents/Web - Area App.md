# Web — Area App (Utenti Finali)

## Routing (`features/app/app.routes.ts`)

Tutte le route sotto `/app/` (escluso `/app/login`) sono protette da `appGuard`.

```
/app/login          → LoginComponent (area=2)
/app/               → redirect /app/dashboard
/app/dashboard      → DashboardComponent
```

---

## AppLayoutComponent (`features/app/layout/`)

Struttura a **sidenav** Angular Material:
- **Toolbar** con titolo "MesClaude", nome utente, pulsante menu
- **Sidenav**: lista dei programmi assegnati all'utente + link Esci
- Mostra i programmi da `currentUser().programs`

---

## DashboardComponent (`features/app/dashboard/`)

Pagina principale per gli utenti App:

- **Card Profilo**: email e ruoli dell'utente corrente
- **Card Programmi assegnati**: lista dei programmi a cui l'utente ha accesso

Dati letti direttamente da `AuthService.currentUser()` (signal) — nessuna chiamata API aggiuntiva.

---

## Note implementative

- L'area App è pensata per utenti con `loginArea = 2`
- Un utente App che tenta di accedere a route `/admin/*` viene reindirizzato a `/app/dashboard` dall'`appGuard`
- I programmi mostrati sono quelli già inclusi nella risposta di `GET /account/me`

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `app-layout.component.spec.ts` | 5 | titolo MesClaude, username in toolbar, programmi nel sidenav, messaggio lista vuota, logout() |
| `dashboard.component.spec.ts` | 5 | "Benvenuto, {username}", email, ruoli, programmi, messaggio lista vuota |
