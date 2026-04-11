import 'dart:async';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/errors/app_exceptions.dart';
import 'package:mobile/core/network/app_http_client.dart';

void main() {
  group('AppHttpClient', () {
    test('inoltra le richieste normali al client interno', () async {
      final inner = MockClient((_) async => http.Response('{"ok":true}', 200));
      final client = AppHttpClient(inner: inner);

      final response = await client.get(Uri.parse('http://test.com/api'));

      expect(response.statusCode, equals(200));
      expect(response.body, equals('{"ok":true}'));
    });

    test('SocketException → NetworkException con messaggio connessione', () async {
      final inner = MockClient((_) async => throw const SocketException('No route'));
      final client = AppHttpClient(inner: inner);

      expect(
        () => client.get(Uri.parse('http://test.com/api')),
        throwsA(isA<NetworkException>().having(
          (e) => e.message,
          'message',
          contains('connessione'),
        )),
      );
    });

    test('TimeoutException → NetworkException con messaggio scaduta', () async {
      final inner = MockClient((_) async => throw TimeoutException('Timeout'));
      final client = AppHttpClient(inner: inner);

      expect(
        () => client.get(Uri.parse('http://test.com/api')),
        throwsA(isA<NetworkException>().having(
          (e) => e.message,
          'message',
          contains('scaduta'),
        )),
      );
    });

    test('altre eccezioni non vengono intercettate', () async {
      final inner = MockClient((_) async => throw Exception('Generic error'));
      final client = AppHttpClient(inner: inner);

      expect(
        () => client.get(Uri.parse('http://test.com/api')),
        throwsA(isNot(isA<NetworkException>())),
      );
    });

    test('risposta 401 viene restituita senza trasformazioni', () async {
      final inner = MockClient((_) async => http.Response('Unauthorized', 401));
      final client = AppHttpClient(inner: inner);

      final response = await client.get(Uri.parse('http://test.com/api'));

      expect(response.statusCode, equals(401));
    });
  });
}
