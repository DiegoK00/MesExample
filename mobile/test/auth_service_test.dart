import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/models/auth_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import 'auth_service_test.mocks.dart';

@GenerateMocks([http.Client, FlutterSecureStorage])
void main() {
  late MockClient mockClient;
  late MockFlutterSecureStorage mockStorage;
  late AuthService authService;

  const accessToken = 'test_access_token';
  const refreshToken = 'test_refresh_token';
  const loginResponseJson =
      '{"accessToken":"test_access_token","refreshToken":"test_refresh_token","expiresAt":"2026-04-01T12:00:00Z"}';
  const meResponseJson =
      '{"id":1,"email":"test@test.com","username":"testuser","loginArea":2,"roles":["User"],"programs":["PROG_A"]}';

  setUp(() {
    mockClient = MockClient();
    mockStorage = MockFlutterSecureStorage();
    authService = AuthService(client: mockClient, storage: mockStorage);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // login
  // ──────────────────────────────────────────────────────────────────────────
  group('login', () {
    setUp(() {
      when(mockStorage.write(key: anyNamed('key'), value: anyNamed('value')))
          .thenAnswer((_) async {});
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response(meResponseJson, 200));
    });

    test('successo: salva i token e imposta accessToken', () async {
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(loginResponseJson, 200));

      await authService.login(LoginRequest(email: 'test@test.com', password: 'pass', area: 2));

      expect(authService.accessToken, equals(accessToken));
      expect(authService.isLoggedIn, isTrue);
      verify(mockStorage.write(key: 'access_token', value: accessToken));
      verify(mockStorage.write(key: 'refresh_token', value: refreshToken));
    });

    test('successo: currentUser popolato tramite fetchMe', () async {
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(loginResponseJson, 200));

      await authService.login(LoginRequest(email: 'test@test.com', password: 'pass', area: 2));

      expect(authService.currentUser, isNotNull);
      expect(authService.currentUser!.email, equals('test@test.com'));
      expect(authService.currentUser!.roles, contains('User'));
    });

    test('fallito (401): lancia eccezione', () async {
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response('{"title":"Credenziali non valide."}', 401));

      expect(
        () => authService.login(LoginRequest(email: 'x@x.com', password: 'wrong', area: 2)),
        throwsException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // logout
  // ──────────────────────────────────────────────────────────────────────────
  group('logout', () {
    setUp(() async {
      when(mockStorage.write(key: anyNamed('key'), value: anyNamed('value')))
          .thenAnswer((_) async {});
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(loginResponseJson, 200));
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response(meResponseJson, 200));
      await authService.login(LoginRequest(email: 'test@test.com', password: 'pass', area: 2));

      reset(mockClient);
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => refreshToken);
      when(mockStorage.deleteAll()).thenAnswer((_) async {});
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response('', 204));
    });

    test('chiama endpoint logout, cancella storage, resetta stato', () async {
      await authService.logout();

      expect(authService.isLoggedIn, isFalse);
      expect(authService.accessToken, isNull);
      expect(authService.currentUser, isNull);
      verify(mockStorage.deleteAll());
      verify(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // init
  // ──────────────────────────────────────────────────────────────────────────
  group('init', () {
    test('con token salvato: carica token e chiama fetchMe', () async {
      when(mockStorage.read(key: 'access_token')).thenAnswer((_) async => accessToken);
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response(meResponseJson, 200));

      await authService.init();

      expect(authService.isLoggedIn, isTrue);
      expect(authService.accessToken, equals(accessToken));
      expect(authService.currentUser, isNotNull);
    });

    test('senza token salvato: rimane non autenticato', () async {
      when(mockStorage.read(key: 'access_token')).thenAnswer((_) async => null);

      await authService.init();

      expect(authService.isLoggedIn, isFalse);
      expect(authService.currentUser, isNull);
      verifyNever(mockClient.get(any, headers: anyNamed('headers')));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // refresh
  // ──────────────────────────────────────────────────────────────────────────
  group('refresh', () {
    const newTokenJson =
        '{"accessToken":"new_access","refreshToken":"new_refresh","expiresAt":"2027-01-01T00:00:00Z"}';

    test('successo: aggiorna i token e restituisce true', () async {
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => refreshToken);
      when(mockStorage.write(key: anyNamed('key'), value: anyNamed('value')))
          .thenAnswer((_) async {});
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(newTokenJson, 200));

      final result = await authService.refresh();

      expect(result, isTrue);
      verify(mockStorage.write(key: 'access_token', value: 'new_access'));
      verify(mockStorage.write(key: 'refresh_token', value: 'new_refresh'));
    });

    test('fallito (401): restituisce false', () async {
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => refreshToken);
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response('', 401));

      final result = await authService.refresh();

      expect(result, isFalse);
    });

    test('errore di rete: restituisce false', () async {
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => refreshToken);
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenThrow(Exception('network error'));

      final result = await authService.refresh();

      expect(result, isFalse);
    });

    test('senza refresh token in storage: restituisce false senza chiamare API', () async {
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => null);

      final result = await authService.refresh();

      expect(result, isFalse);
      verifyNever(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // authenticatedGet
  // ──────────────────────────────────────────────────────────────────────────
  group('authenticatedGet', () {
    final testUri = Uri.parse('http://10.0.2.2:5260/test');
    const responseBody = '{"data":"ok"}';
    const newTokenJson =
        '{"accessToken":"new_token","refreshToken":"new_refresh","expiresAt":"2027-01-01T00:00:00Z"}';

    test('risposta 200: restituisce la risposta senza tentare il refresh', () async {
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response(responseBody, 200));

      final response = await authService.authenticatedGet(testUri);

      expect(response.statusCode, equals(200));
      expect(response.body, equals(responseBody));
      verifyNever(mockStorage.read(key: 'refresh_token'));
    });

    test('401 poi refresh riuscito: riprova e restituisce la seconda risposta', () async {
      var getCallCount = 0;
      when(mockClient.get(any, headers: anyNamed('headers'))).thenAnswer((_) async {
        getCallCount++;
        return getCallCount == 1
            ? http.Response('', 401)
            : http.Response(responseBody, 200);
      });
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => refreshToken);
      when(mockStorage.write(key: anyNamed('key'), value: anyNamed('value')))
          .thenAnswer((_) async {});
      when(mockClient.post(any, headers: anyNamed('headers'), body: anyNamed('body')))
          .thenAnswer((_) async => http.Response(newTokenJson, 200));

      final response = await authService.authenticatedGet(testUri);

      expect(response.statusCode, equals(200));
      expect(response.body, equals(responseBody));
      expect(getCallCount, equals(2));
    });

    test('401 e refresh fallito: esegue logout e svuota lo stato', () async {
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response('', 401));
      when(mockStorage.read(key: 'refresh_token')).thenAnswer((_) async => null);
      when(mockStorage.deleteAll()).thenAnswer((_) async {});

      await authService.authenticatedGet(testUri);

      expect(authService.isLoggedIn, isFalse);
      verify(mockStorage.deleteAll());
    });
  });
}
