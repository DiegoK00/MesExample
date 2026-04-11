# Web — Reset Password

## Flusso

1. L'utente clicca **"Password dimenticata?"** nella pagina di login
2. Viene reindirizzato a `/admin/forgot-password` (area Admin) o `/app/forgot-password` (area App)
3. Inserisce la propria email e clicca **"Invia istruzioni"**
4. Riceve **sempre** il messaggio di successo (anti-enumeration: il server non rivela se l'email esiste)
5. Il server invia un'email con il link `https://.../reset-password?token=<jwt>` (area dedotta dal token)
6. L'utente apre il link e viene mostrato il form con nuova password + conferma
7. Dopo il reset, viene reindirizzato al login della propria area

---

## Route

Le route di reset password sono **fuori dai guard** (accessibili senza autenticazione).

### Area Admin (`features/admin/admin.routes.ts`)
```
/admin/forgot-password  → ForgotPasswordComponent (area=1)
/admin/reset-password   → ResetPasswordComponent  (area=1)
```

### Area App (`features/app/app.routes.ts`)
```
/app/forgot-password    → ForgotPasswordComponent (area=2)
/app/reset-password     → ResetPasswordComponent  (area=2)
```

### Link dalla pagina di login
`LoginComponent` ora include un link "Password dimenticata?" che naviga tramite `RouterLink` alla route corretta in base all'area.

---

## ForgotPasswordComponent (`features/auth/forgot-password/`)

- `area` letto da `route.snapshot.data['area']` (configurato nel file delle route)
- Form con campo `email` (Validators.required + Validators.email)
- `sent` signal: quando `true`, nasconde il form e mostra il messaggio di conferma
- **Anti-enumeration**: sia `next` che `error` dell'Observable impostano `sent(true)`
- `loginPath()`: `/admin/login` per area 1, `/app/login` per area 2
- Chiama `AuthService.forgotPassword(email, area)` → `POST /auth/forgot-password`

---

## ResetPasswordComponent (`features/auth/reset-password/`)

- `token` letto da `route.snapshot.queryParams['token']`
- Se `token` è vuoto/mancante → mostra widget di errore con link a "Richiedi nuovo link"
- Form con `newPassword` (min 8 caratteri) e `confirmPassword`
- Validazione cross-field tramite `passwordsMatchValidator` (validator di gruppo FormGroup)
- `done` signal: quando `true`, nasconde il form e mostra il messaggio di successo con link al login
- Se il server risponde con errore (token scaduto) → mostra `errorMessage` inline senza svuotare il form
- Chiama `AuthService.resetPassword(token, newPassword)` → `POST /auth/reset-password`

---

## AuthService (`core/services/auth.service.ts`)

Metodi aggiunti:
```typescript
forgotPassword(email: string, area: LoginArea): Observable<void>
resetPassword(token: string, newPassword: string): Observable<void>
```

---

## Test

| File spec | Test | Cosa verifica |
|-----------|------|---------------|
| `forgot-password.component.spec.ts` | 8 | area da route data, form presente, loginPath area 1/2, validazione form invalido, chiamata con email+area corretti, sent() dopo successo, sent() dopo errore (anti-enumeration) |
| `reset-password.component.spec.ts` | 9 | token vuoto → widget errore, token presente → form, loginPath area 1/2, validazione form invalido, chiamata con token+password, done() dopo successo, errorMessage dopo errore server, mismatch password non chiama il servizio |
