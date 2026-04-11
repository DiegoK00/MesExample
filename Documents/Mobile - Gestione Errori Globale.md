# Mobile — Gestione Errori Globale

Equivalente mobile dell'`AuthInterceptor` Angular: un handler centralizzato che intercetta errori di rete e li mostra all'utente con uno SnackBar globale, senza che ogni schermata debba gestirli individualmente.

---

## Architettura

```
SocketException / TimeoutException
        │
        ▼
  AppHttpClient.send()        ← intercetta errori di rete a basso livello
        │ throws NetworkException
        ▼
  AuthService.authenticatedXxx()  ← cattura NetworkException
        │ notifica + rethrow
        ▼
  ErrorNotifier.handle()      ← broadcast dell'errore
        │ notifyListeners()
        ▼
  _MyAppState._onNetworkError()   ← listener nel root widget
        │
        ▼
  ScaffoldMessenger.showSnackBar() ← SnackBar globale (wifi_off + messaggio)
```

---

## Componenti

### `core/errors/app_exceptions.dart`
Tipi di eccezione tipizzati:
- `NetworkException(message)` — SocketException, TimeoutException
- `ServerException(statusCode, message)` — risposte HTTP >= 500

### `core/network/app_http_client.dart`
`AppHttpClient extends http.BaseClient`:
- Override di `send()` che intercetta eccezioni prima che raggiungano `AuthService`
- `SocketException` → `NetworkException('Nessuna connessione a internet')`
- `TimeoutException` → `NetworkException('Richiesta scaduta. Riprova più tardi.')`
- Tutte le altre eccezioni (inclusi errori logici) passano senza modifiche
- Compatibile con `http.Client` — usato come drop-in nel costruttore di `AuthService`

### `core/services/error_notifier.dart`
`ErrorNotifier extends ChangeNotifier`:
- `handle(Object error)` — mappa l'eccezione a un messaggio leggibile + `notifyListeners()`
- `currentMessage` — messaggio corrente (null = nessun errore attivo)
- `clear()` — azzeramento manuale; auto-clear dopo 4 secondi tramite `Future.delayed`

### `core/services/auth_service.dart` (aggiornato)
- Costruttore: aggiunto `ErrorNotifier? errorNotifier` (opzionale — non impatta i test)
- Client di default: `AppHttpClient()` invece di `http.Client()` raw
- `authenticatedGet/Post/Put/Delete`: ogni metodo ha un `try/catch(NetworkException)` che chiama `_errorNotifier?.handle(e)` poi fa `rethrow` (le schermate ricevono ancora l'eccezione per gestire il loro stato interno)

### `main.dart` (aggiornato)
- `ErrorNotifier` creato in `main()` e passato ad `AuthService`
- `_messengerKey = GlobalKey<ScaffoldMessengerState>()` aggiunto a `_MyAppState`
- `scaffoldMessengerKey: _messengerKey` in `MaterialApp.router`
- `_onNetworkError()` come listener: mostra SnackBar rosso con icona `wifi_off`
- `ChangeNotifierProvider.value(value: widget.errorNotifier)` nei provider

---

## Comportamento UI

Quando la connessione è assente o si va in timeout:
1. `AppHttpClient` lancia `NetworkException`
2. `AuthService` notifica `ErrorNotifier` e rilancia
3. In `main.dart` appare uno **SnackBar rosso** con icona wifi_off e il messaggio
4. La schermata mostra comunque il suo stato di errore locale (es. "Errore nel caricamento")
5. Lo SnackBar si chiude automaticamente dopo 4 secondi

---

## Test

| File | Test | Cosa verifica |
|------|------|---------------|
| `error_notifier_test.dart` | 7 | init null, handle NetworkException (messaggio+notifica), handle ServerException, handle generica (fallback), clear azzeramento, clear su null non notifica, successive handle sovrascrivono |
| `app_http_client_test.dart` | 5 | forwarding normale, SocketException→NetworkException, TimeoutException→NetworkException, eccezioni non-rete non intercettate, risposta 401 passata invariata |
