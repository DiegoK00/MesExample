# Mobile - Core Network e Gestione Errori

Documentazione del layer HTTP centralizzato e della gerarchia delle eccezioni.

---

## AppHttpClient

File: `mobile/lib/core/network/app_http_client.dart`

Wrapper su `http.BaseClient` che intercetta gli errori di rete a basso livello e li rilancia come eccezioni tipizzate prima che raggiungano i service.

### Comportamento

Estende `http.BaseClient` e fa override di `send()` — tutti i metodi HTTP (`get`, `post`, `put`, `delete`) passano automaticamente per questo wrapper senza modifiche ai service esistenti.

| Eccezione intercettata | Eccezione rilasciata | Messaggio |
|---|---|---|
| `SocketException` | `NetworkException` | "Nessuna connessione a internet" |
| `TimeoutException` | `NetworkException` | "Richiesta scaduta. Riprova più tardi." |

### Uso

`AppHttpClient` viene passato ad `AuthService` alla costruzione in `main.dart`.  
Tutti i service usano `AuthService` per le chiamate HTTP — il wrapper è quindi trasparente all'intera app.

```dart
// main.dart (semplificato)
final auth = AuthService(errorNotifier: errorNotifier);
// AuthService internamente usa AppHttpClient
```

---

## AppExceptions

File: `mobile/lib/core/errors/app_exceptions.dart`

Gerarchia di eccezioni custom dell'app.

### NetworkException

Errore di rete: nessuna connessione o timeout.

```dart
class NetworkException implements Exception {
  final String message;
  const NetworkException([this.message = 'Nessuna connessione a internet']);
}
```

Viene catturata dall'`ErrorNotifier` e mostrata come SnackBar globale (sfondo rosso, icona `wifi_off`).

### ServerException

Errore server: risposta HTTP con status >= 500.

```dart
class ServerException implements Exception {
  final int statusCode;
  final String message;
  const ServerException(this.statusCode,
      [this.message = 'Errore del server. Riprova più tardi.']);
}
```

---

## ErrorNotifier

File: `mobile/lib/core/services/error_notifier.dart`

`ChangeNotifier` globale che propaga i messaggi di errore di rete all'UI.  
Registrato in `main.dart` come `ChangeNotifierProvider`.

Il listener in `_MyAppState._onNetworkError()` mostra uno `SnackBar` floating con:
- Icona `wifi_off` bianca
- Messaggio dell'eccezione
- Sfondo `Colors.red[700]`
- Durata 4 secondi

### Flusso completo errore di rete

```
Chiamata HTTP
  └─ AppHttpClient.send() → lancia NetworkException
       └─ AuthService cattura → ErrorNotifier.notify()
            └─ _MyAppState listener → ScaffoldMessenger.showSnackBar()
```
