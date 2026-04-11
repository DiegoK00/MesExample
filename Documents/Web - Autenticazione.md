# Web — Autenticazione

## Modelli (`core/models/auth.models.ts`)

| Tipo | Campi |
|------|-------|
| `LoginRequest` | `email`, `password`, `area: LoginArea` |
| `LoginResponse` | `accessToken`, `refreshToken`, `expiresAt` |
| `CurrentUser` | `id`, `email`, `username`, `loginArea`, `roles[]`, `programs[]` |
| `LoginArea` | `1` = Admin, `2` = App |

---

## AuthService (`core/services/auth.service.ts`)

Stato gestito con **signals** Angular 19:

| Signal | Tipo | Descrizione |
|--------|------|-------------|
| `currentUser` | `Signal<CurrentUser \| null>` | Utente autenticato |
| `token` | `Signal<string \| null>` | Access token corrente |
| `isLoggedIn` | `computed` | `true` se token presente |
| `isAdmin` | `computed` | `true` se ruolo Admin/SuperAdmin |

Token salvati in `localStorage` (`access_token`, `refresh_token`).

**Metodi principali:**

```typescript
login(request: LoginRequest): Observable<LoginResponse>
logout(): void          // POST /auth/logout + clearSession + navigate
refresh(): Observable<LoginResponse>
setCurrentUser(user: CurrentUser): void
```

---

## AccountService (`core/services/account.service.ts`)

```typescript
getMe(): Observable<CurrentUser>    // GET /account/me
changePassword(current, new): Observable<void>
```

---

## AuthInterceptor (`core/interceptors/auth.interceptor.ts`)

Intercetta ogni richiesta HTTP uscente:

1. Aggiunge `Authorization: Bearer <token>` all'header
2. Su risposta `401`: chiama `POST /auth/refresh`
3. Se refresh OK → aggiorna token e riprova la richiesta originale
4. Se refresh fallisce → `authService.logout()` e redirect al login

Gli endpoint di auth (`/auth/login`, `/auth/refresh`) sono esclusi dall'intercettazione per evitare loop.

---

## Guards (`core/guards/auth.guard.ts`)

```typescript
export const adminGuard: CanActivateFn
export const appGuard: CanActivateFn
```

Flusso per ogni guard:
1. Se non autenticato → redirect a `/{area}/login`
2. Se `currentUser` già presente → `true` (pass-through)
3. Se token presente ma utente non caricato → `GET /account/me` → `setCurrentUser()` → `true`
4. Se `/account/me` fallisce → redirect a `/{area}/login`

---

## LoginComponent (`features/auth/login/login.component.ts`)

Componente **parametrico** — usato sia per area Admin che App tramite `data: { area }` nella route.

- Form reattivo con validazione (`required`, `email`)
- Spinner durante il submit
- Messaggio di errore inline su credenziali errate
- Dopo login chiama `GET /account/me` e naviga a `/admin` o `/app`

**Note implementative:**
- L'area viene letta da `ActivatedRoute.snapshot.data['area']`
- Se già autenticato al caricamento della pagina → redirect diretto alla home dell'area

---

## Test (`auth.service.spec.ts`, `auth.guard.spec.ts`, `auth.interceptor.spec.ts`, `login.component.spec.ts`)

| File | Test | Cosa verifica |
|------|------|---------------|
| `auth.service.spec.ts` | 13 | login, logout, refresh, hasRole, hasProgram, isAdmin, isLoggedIn |
| `auth.guard.spec.ts` | 8 | not logged in, currentUser presente, fetch /account/me, errore su fetch |
| `auth.interceptor.spec.ts` | 5 | aggiunta header Bearer, assenza header senza token, refresh su 401, logout su refresh fallito, skip su auth endpoint |
| `login.component.spec.ts` | 10 | inizializzazione, redirect se già loggato, validazione form, submit ok/ko, loading state, toggle password |
