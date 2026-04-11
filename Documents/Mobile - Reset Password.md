# Mobile — Reset Password

## Flusso

1. L'utente clicca **"Password dimenticata?"** nella `LoginScreen`
2. Viene reindirizzato a `/forgot-password/<area>` (1 = Admin, 2 = App)
3. Inserisce l'email e clicca **"Invia istruzioni"**
4. Riceve **sempre** il messaggio di successo (il servizio swallows exceptions → anti-enumeration)
5. L'utente apre il link email che punta a `/reset-password/<area>?token=<jwt>`
6. Nella `ResetPasswordScreen` inserisce nuova password + conferma
7. Dopo il reset, un pulsante "Vai al login" naviga a `/login` o `/admin-login`

---

## Route (`lib/main.dart`)

Le route di reset password sono **accessibili senza autenticazione** (la funzione `_redirect` le esclude dal guard).

```dart
GoRoute(
  path: '/forgot-password/:area',
  builder: (_, state) => ForgotPasswordScreen(
    area: int.tryParse(state.pathParameters['area'] ?? '') ?? 2,
  ),
),
GoRoute(
  path: '/reset-password/:area',
  builder: (_, state) => ResetPasswordScreen(
    area: int.tryParse(state.pathParameters['area'] ?? '') ?? 2,
    token: state.uri.queryParameters['token'] ?? '',
  ),
),
```

Il redirect guard esclude queste route:
```dart
final isForgotPassword = loc.startsWith('/forgot-password');
final isResetPassword  = loc.startsWith('/reset-password');
if (!loggedIn) {
  if (isAppLogin || isAdminLogin || isForgotPassword || isResetPassword) return null;
  ...
}
```

---

## ForgotPasswordScreen (`features/auth/forgot_password/`)

- Parametro `area` passato come costruttore
- Form con campo email + validazione (obbligatoria, deve contenere `@`)
- Stato `_sent`: mostra schermata di conferma "Email inviata" dopo invio
- Il servizio (`AuthService.forgotPassword`) non lancia mai eccezioni → `_sent = true` sempre
- `_loginRoute` restituisce `/admin-login` (area=1) o `/login` (area=2)
- AppBar con BackButton che naviga a `_loginRoute`

---

## ResetPasswordScreen (`features/auth/reset_password/`)

- Parametri `area` e `token` passati come costruttore (token arriva da query params del link)
- Se `widget.token.isEmpty` → mostra widget "Token non valido" con pulsante "Torna al login"
- Form con:
  - `Nuova password` (min 8 caratteri)
  - `Conferma password` (deve coincidere con nuova password)
  - Toggle visibilità password condiviso tra i due campi
- Se `_done = true` → mostra schermata di successo "Password aggiornata" con pulsante "Vai al login"
- Se `AuthService.resetPassword` lancia → mostra `_error` inline
- Chiama `AuthService.resetPassword(token, password)` → `POST /auth/reset-password`

---

## AuthService (`core/services/auth_service.dart`)

Metodi aggiunti:
```dart
Future<void> forgotPassword(String email, int area) async { ... } // silenzioso
Future<void> resetPassword(String token, String newPassword) async {
  // lancia Exception se statusCode != 204
}
```

Endpoint usati (da `api_constants.dart`):
```dart
static const String forgotPassword = '$baseUrl/auth/forgot-password';
static const String resetPassword  = '$baseUrl/auth/reset-password';
```

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `forgot_password_screen_test.dart` | 7 | campo email + bottone, validazione email vuota/formato, chiamata con email+area corretti, successo → schermata "Email inviata", errore server → schermata successo (anti-enum), titolo schermata, AppBar presente |
| `reset_password_screen_test.dart` | 11 | token vuoto → widget errore, nessun form senza token, due campi password con token, validazione vuota/corta/mismatch, chiamata con token+password corretti, successo → "Password aggiornata", errore → messaggio inline, loading state bottone disabilitato |
