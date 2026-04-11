import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../errors/app_exceptions.dart';

/// Wrapper attorno a [http.Client] che intercetta errori di rete a basso
/// livello e li rilanancia come [NetworkException] tipizzate.
///
/// Usato come client HTTP di default in [AuthService], funziona in modo
/// trasparente: tutto il codice esistente continua a chiamare `.get()`,
/// `.post()`, ecc. senza modifiche.
class AppHttpClient extends http.BaseClient {
  final http.Client _inner;

  AppHttpClient({http.Client? inner}) : _inner = inner ?? http.Client();

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    try {
      return await _inner.send(request);
    } on SocketException {
      throw const NetworkException('Nessuna connessione a internet');
    } on TimeoutException {
      throw const NetworkException('Richiesta scaduta. Riprova più tardi.');
    }
  }

  @override
  void close() => _inner.close();
}
