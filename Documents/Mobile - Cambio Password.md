# Mobile — Cambio Password

## Accesso

La schermata è raggiungibile da:
- **`HomeScreen`** (area App): card "Cambia password" con icona `lock` e freccia → naviga a `/change-password`
- **`AdminHomeScreen`** (area Admin): `_NavCard` "Cambia password" nella sezione "Account" → naviga a `/change-password`

---

## Route

```dart
GoRoute(
  path: '/change-password',
  builder: (_, __) => const ChangePasswordScreen(),
),
```

La route è **protetta** (richiede autenticazione) — il redirect guard non la esclude, quindi un utente non loggato viene reindirizzato al login.

---

## ChangePasswordScreen (`features/auth/change_password/`)

**Campi:**
- Password attuale (required)
- Nuova password (required, minLength: 8)
- Conferma nuova password (must match `newPassword`)

**Toggle visibilità:** unico `_showPwd` condiviso tra i tre campi.

**Stati:**
- Form default → tre campi + bottone "Salva"
- `_success = true` → icona check + "Password aggiornata" + bottone "Torna alla home"
- `_error != null` → testo errore inline sotto il form

**Back button:** naviga a `/admin` (area Admin) o `/home` (area App) in base a `currentUser.loginArea`.

**Chiamata API:** `AuthService.changePassword(currentPassword, newPassword)` → `PUT /account/password` (via `authenticatedPut`)

---

## AuthService — nuovi metodi

```dart
Future<void> changePassword(String currentPassword, String newPassword) async {
  // Usa authenticatedPut → retry automatico su 401
  // Lancia Exception se statusCode != 204
}

Future<http.Response> authenticatedPut(Uri uri, {Map<String, dynamic>? body}) async {
  // Stesso pattern di authenticatedGet/Post/Delete
}
```

**`ApiConstants`:**
```dart
static const String changePassword = '$baseUrl/account/password';
```

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `change_password_screen_test.dart` | 10 | titolo, tre campi, validazione vuota/corta/mismatch, submit corretto, success state, errore inline, loading state, back area App→/home, back area Admin→/admin |
