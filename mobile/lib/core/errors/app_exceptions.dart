/// Errore di rete: nessuna connessione o timeout.
class NetworkException implements Exception {
  final String message;
  const NetworkException([this.message = 'Nessuna connessione a internet']);

  @override
  String toString() => 'NetworkException: $message';
}

/// Errore server: risposta HTTP con status >= 500.
class ServerException implements Exception {
  final int statusCode;
  final String message;
  const ServerException(this.statusCode,
      [this.message = 'Errore del server. Riprova più tardi.']);

  @override
  String toString() => 'ServerException($statusCode): $message';
}
