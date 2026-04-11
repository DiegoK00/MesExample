# Web — Cambio Password

## Accesso

La funzione è disponibile a tutti gli utenti autenticati tramite la voce **"Cambia password"** nel sidenav:
- **Area Admin** (`AdminLayoutComponent`): voce nel pannello laterale, tra le voci di navigazione e il pulsante Esci
- **Area App** (`AppLayoutComponent`): stessa posizione nel sidenav

---

## ChangePasswordComponent (`features/auth/change-password/`)

Componente **MatDialog** (standalone), aperto con `MatDialog.open(ChangePasswordComponent, { width: '420px' })`.

**Campi:**
- `currentPassword` — password attuale (required)
- `newPassword` — nuova password (required, minLength: 8)
- `confirmPassword` — conferma nuova password (required)

**Validazione cross-field:** `passwordsMatchValidator` applicato al gruppo FormGroup — ritorna `{ passwordsMismatch: true }` se `newPassword !== confirmPassword`.

**Stati:**
- Form default → campi editabili + bottone "Salva"
- `success = true` → mostra "Password aggiornata con successo" + bottone "Chiudi"
- `errorMessage` → testo inline sotto il form (es. "Password attuale non corretta")

**Visibilità password:** toggle condiviso `showPwd` per tutti e tre i campi.

**Chiamata API:** `AccountService.changePassword(currentPassword, newPassword)` → `PUT /account/password`

---

## Layout aggiornati

### `AdminLayoutComponent`
- Import aggiunto: `MatDialog`, `MatDialogModule`, `ChangePasswordComponent`
- Metodo aggiunto: `openChangePassword()` → `dialog.open(ChangePasswordComponent, { width: '420px' })`
- Template: voce sidenav `<a mat-list-item (click)="openChangePassword(); sidenav.close()">` con icona `lock`

### `AppLayoutComponent`
- Stesso aggiornamento

---

## Test

| File spec | Test | Cosa verifica |
|-----------|------|---------------|
| `change-password.component.spec.ts` | 6 | form presente, form invalido non chiama servizio, mismatch non chiama servizio, chiamata corretta, success state, error message su password errata |
