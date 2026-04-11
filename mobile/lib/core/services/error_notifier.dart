import 'package:flutter/foundation.dart';
import '../errors/app_exceptions.dart';

/// Servizio globale per la propagazione degli errori di rete all'UI.
///
/// I servizi chiamano [handle] quando catturano un errore centralizzato
/// (es. [NetworkException]). Il root widget ascolta le notifiche e mostra
/// uno SnackBar senza che ogni singola schermata debba gestirlo.
class ErrorNotifier extends ChangeNotifier {
  String? _currentMessage;

  String? get currentMessage => _currentMessage;

  /// Mappa l'eccezione a un messaggio human-readable e notifica i listener.
  void handle(Object error) {
    if (error is NetworkException) {
      _currentMessage = error.message;
    } else if (error is ServerException) {
      _currentMessage = error.message;
    } else {
      _currentMessage = 'Si è verificato un errore imprevisto.';
    }
    notifyListeners();
    // Auto-dismiss dopo 4 secondi.
    Future.delayed(const Duration(seconds: 4), clear);
  }

  /// Pulisce il messaggio corrente (chiamato dopo la visualizzazione o
  /// automaticamente dopo il timeout).
  void clear() {
    if (_currentMessage != null) {
      _currentMessage = null;
      notifyListeners();
    }
  }
}
