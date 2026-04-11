# Mobile — Refresh Token Automatico

## Obiettivo

Gestire la scadenza del JWT in modo trasparente: quando una chiamata API riceve un `401 Unauthorized`, il client prova automaticamente a rinnovare il token e ripete la richiesta originale. Se il rinnovo fallisce, esegue il logout.

---

## Implementazione

### Metodo `refresh()` in `AuthService`

```dart
Future<bool> refresh() async
```

- Legge il `refresh_token` da `FlutterSecureStorage`
- Esegue `POST /auth/refresh` con `{ "refreshToken": "..." }`
- Se la risposta è `200`: salva i nuovi token in storage, aggiorna `_accessToken` in memoria, ritorna `true`
- Se la risposta non è `200` o si verifica un errore di rete: ritorna `false` (nessuna eccezione propagata)

### Metodi `authenticatedGet / Post / Delete()` in `AuthService`

```dart
Future<http.Response> authenticatedGet(Uri uri)
Future<http.Response> authenticatedPost(Uri uri, {Map<String, dynamic>? body})
Future<http.Response> authenticatedDelete(Uri uri)
```

Flusso per ogni metodo:
1. Esegue la richiesta con header `Authorization: Bearer <token>`
2. Se la risposta è `401`:
   - Chiama `refresh()`
   - Se il refresh riesce → riprova la stessa richiesta con il nuovo token
   - Se il refresh fallisce → chiama `logout()` e ritorna l'ultima risposta
3. In tutti gli altri casi ritorna direttamente la risposta

`fetchMe()` è stato aggiornato per usare `authenticatedGet`.

---

## Utilizzo nei servizi dati

I servizi `UsersService`, `ProgramsService` e `AuditLogsService` usano `auth.authenticatedGet()` per tutte le chiamate GET, ricevendo automaticamente il comportamento di retry.

---

## Casi gestiti

| Scenario | Comportamento |
|---------|---------------|
| Token valido | Risposta normale, nessun refresh |
| Token scaduto, refresh valido | Refresh trasparente + retry della richiesta originale |
| Token scaduto, refresh scaduto/revocato | Logout automatico → router reindirizza a `/login` o `/admin-login` |
| Errore di rete durante il refresh | Logout automatico |
| Nessun refresh token in storage | Logout automatico |

---

## File coinvolti

- `lib/core/services/auth_service.dart` — aggiunta logica refresh e metodi autenticati
- `lib/core/constants/api_constants.dart` — `refresh` endpoint già presente
- `test/auth_service_test.dart` — 4 test per `refresh()` + 3 test per `authenticatedGet()`
