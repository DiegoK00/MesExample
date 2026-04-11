import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../errors/app_exceptions.dart';
import '../models/auth_models.dart';
import '../network/app_http_client.dart';
import 'error_notifier.dart';

class AuthService extends ChangeNotifier {
  final FlutterSecureStorage _storage;
  final http.Client _client;
  final ErrorNotifier? _errorNotifier;

  AuthService({
    FlutterSecureStorage? storage,
    http.Client? client,
    ErrorNotifier? errorNotifier,
  })  : _storage = storage ?? const FlutterSecureStorage(),
        _client = client ?? AppHttpClient(),
        _errorNotifier = errorNotifier;

  CurrentUser? _currentUser;
  String? _accessToken;

  CurrentUser? get currentUser => _currentUser;
  String? get accessToken => _accessToken;
  bool get isLoggedIn => _accessToken != null;

  Map<String, String> get _authHeaders => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_accessToken',
      };

  /// Setter per il current user. Usato principalmente nei test per impostare l'utente senza autenticazione.
  void setCurrentUser(CurrentUser? user) {
    _currentUser = user;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  Future<void> init() async {
    _accessToken = await _storage.read(key: 'access_token');
    if (_accessToken != null) {
      await fetchMe();
    }
  }

  // ---------------------------------------------------------------------------
  // Auth operations
  // ---------------------------------------------------------------------------

  Future<void> login(LoginRequest request) async {
    final response = await _client.post(
      Uri.parse(ApiConstants.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 200) {
      final loginResp = LoginResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      await _storage.write(key: 'access_token', value: loginResp.accessToken);
      await _storage.write(key: 'refresh_token', value: loginResp.refreshToken);
      _accessToken = loginResp.accessToken;
      await fetchMe();
      notifyListeners();
    } else {
      throw Exception('Credenziali non valide');
    }
  }

  Future<void> fetchMe() async {
    final response = await authenticatedGet(Uri.parse(ApiConstants.me));
    if (response.statusCode == 200) {
      _currentUser = CurrentUser.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      notifyListeners();
    }
  }

  /// Invia una richiesta di reset password. Non lancia mai eccezione —
  /// il server risponde sempre 200 per evitare user enumeration.
  Future<void> forgotPassword(String email, int area) async {
    try {
      await _client.post(
        Uri.parse(ApiConstants.forgotPassword),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'area': area}),
      );
    } catch (_) {
      // silenzioso: l'utente vede sempre il messaggio di successo
    }
  }

  /// Applica la nuova password tramite il token ricevuto via email.
  /// Lancia eccezione se il token non è valido o scaduto (400).
  Future<void> resetPassword(String token, String newPassword) async {
    final response = await _client.post(
      Uri.parse(ApiConstants.resetPassword),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'token': token, 'newPassword': newPassword}),
    );
    if (response.statusCode != 204) {
      throw Exception('Token non valido o scaduto');
    }
  }

  /// Cambia la password dell'utente autenticato.
  /// Lancia eccezione se la password attuale non è corretta (400/401).
  Future<void> changePassword(String currentPassword, String newPassword) async {
    final response = await authenticatedPut(
      Uri.parse(ApiConstants.changePassword),
      body: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
    if (response.statusCode != 204) {
      throw Exception('Password attuale non corretta');
    }
  }

  Future<void> logout() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken != null && _accessToken != null) {
      await _client.post(
        Uri.parse(ApiConstants.logout),
        headers: _authHeaders,
        body: jsonEncode({'refreshToken': refreshToken}),
      );
    }
    await _storage.deleteAll();
    _accessToken = null;
    _currentUser = null;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Token refresh
  // ---------------------------------------------------------------------------

  /// Tenta di rinnovare l'access token usando il refresh token.
  /// Restituisce true se il rinnovo è riuscito, false altrimenti.
  Future<bool> refresh() async {
    try {
      final storedRefresh = await _storage.read(key: 'refresh_token');
      if (storedRefresh == null) return false;

      final response = await _client.post(
        Uri.parse(ApiConstants.refresh),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': storedRefresh}),
      );

      if (response.statusCode == 200) {
        final data = LoginResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
        await _storage.write(key: 'access_token', value: data.accessToken);
        await _storage.write(key: 'refresh_token', value: data.refreshToken);
        _accessToken = data.accessToken;
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Authenticated HTTP methods con retry automatico su 401
  // ---------------------------------------------------------------------------

  /// GET autenticato. Se riceve 401 tenta il refresh e riprova.
  /// Se il refresh fallisce esegue il logout.
  /// [NetworkException] viene notificata a [ErrorNotifier] prima del rethrow.
  Future<http.Response> authenticatedGet(Uri uri) async {
    try {
      var response = await _client.get(uri, headers: _authHeaders);
      if (response.statusCode == 401) {
        if (await refresh()) {
          response = await _client.get(uri, headers: _authHeaders);
        } else {
          await logout();
        }
      }
      return response;
    } on NetworkException catch (e) {
      _errorNotifier?.handle(e);
      rethrow;
    }
  }

  /// POST autenticato con retry su 401.
  Future<http.Response> authenticatedPost(Uri uri, {Map<String, dynamic>? body}) async {
    try {
      var response = await _client.post(
        uri,
        headers: _authHeaders,
        body: body != null ? jsonEncode(body) : null,
      );
      if (response.statusCode == 401) {
        if (await refresh()) {
          response = await _client.post(
            uri,
            headers: _authHeaders,
            body: body != null ? jsonEncode(body) : null,
          );
        } else {
          await logout();
        }
      }
      return response;
    } on NetworkException catch (e) {
      _errorNotifier?.handle(e);
      rethrow;
    }
  }

  /// PUT autenticato con retry su 401.
  Future<http.Response> authenticatedPut(Uri uri, {Map<String, dynamic>? body}) async {
    try {
      var response = await _client.put(
        uri,
        headers: _authHeaders,
        body: body != null ? jsonEncode(body) : null,
      );
      if (response.statusCode == 401) {
        if (await refresh()) {
          response = await _client.put(
            uri,
            headers: _authHeaders,
            body: body != null ? jsonEncode(body) : null,
          );
        } else {
          await logout();
        }
      }
      return response;
    } on NetworkException catch (e) {
      _errorNotifier?.handle(e);
      rethrow;
    }
  }

  /// DELETE autenticato con retry su 401.
  Future<http.Response> authenticatedDelete(Uri uri) async {
    try {
      var response = await _client.delete(uri, headers: _authHeaders);
      if (response.statusCode == 401) {
        if (await refresh()) {
          response = await _client.delete(uri, headers: _authHeaders);
        } else {
          await logout();
        }
      }
      return response;
    } on NetworkException catch (e) {
      _errorNotifier?.handle(e);
      rethrow;
    }
  }
}
