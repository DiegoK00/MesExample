import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

// ── Dati mock ────────────────────────────────────────────────────────────────

const _adminToken = 'admin-access-token';
const _appToken = 'app-access-token';

final _adminUser = {
  'id': 1,
  'email': 'admin@test.com',
  'username': 'admin',
  'loginArea': 1,
  'roles': ['SuperAdmin'],
  'programs': <String>[],
  'isActive': true,
};

final _appUser = {
  'id': 2,
  'email': 'user@test.com',
  'username': 'user',
  'loginArea': 2,
  'roles': ['User'],
  'programs': ['PROG_A'],
  'isActive': true,
};

final _usersPage = {
  'items': [_adminUser],
  'totalCount': 1,
  'page': 1,
  'pageSize': 20,
};

final _programs = [
  {'id': 1, 'code': 'PROG_A', 'name': 'Programma A', 'description': null, 'isActive': true},
];

final _auditLogs = {
  'items': <Map<String, dynamic>>[],
  'totalCount': 0,
  'page': 1,
  'pageSize': 50,
};

final _categories = [
  {'id': 1, 'name': 'Abbigliamento', 'description': null},
  {'id': 2, 'name': 'Accessori', 'description': null},
];

final _measureUnits = [
  {'id': 1, 'name': 'Pezzo', 'description': null},
  {'id': 2, 'name': 'Metro', 'description': null},
];

final _articles = [
  {
    'id': 1,
    'code': 'ART001',
    'name': 'T-Shirt Bianca',
    'description': 'Maglietta classica',
    'categoryId': 1,
    'categoryName': 'Abbigliamento',
    'price': 19.90,
    'umId': 1,
    'umName': 'Pezzo',
    'um2Id': null,
    'um2Name': null,
    'measures': 'S / M / L / XL',
    'composition': null,
    'isActive': true,
    'createdAt': '2026-01-01T00:00:00Z',
    'createdByUsername': 'admin',
    'deletedAt': null,
    'deletedByUsername': null,
  },
  {
    'id': 2,
    'code': 'ART002',
    'name': 'Cintura Pelle',
    'description': null,
    'categoryId': 2,
    'categoryName': 'Accessori',
    'price': 45.00,
    'umId': 1,
    'umName': 'Pezzo',
    'um2Id': null,
    'um2Name': null,
    'measures': null,
    'composition': null,
    'isActive': false,
    'createdAt': '2026-01-02T00:00:00Z',
    'createdByUsername': 'admin',
    'deletedAt': null,
    'deletedByUsername': null,
  },
];

// ── Factory ───────────────────────────────────────────────────────────────────

/// Crea un [MockClient] che risponde a tutti gli endpoint usati dall'app.
/// Usa token differenti per area Admin (1) e App (2) in modo da restituire
/// il profilo utente corretto su GET /account/me.
MockClient buildMockClient() {
  return MockClient((request) async {
    final path = request.url.path;
    final auth = request.headers['authorization'] ?? '';

    // ── Auth ──────────────────────────────────────────────────────────────────

    if (path.endsWith('/auth/login')) {
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      final area = body['area'] as int;
      final token = area == 1 ? _adminToken : _appToken;
      return http.Response(
        jsonEncode({
          'accessToken': token,
          'refreshToken': '$token-refresh',
          'expiresAt': '2030-01-01T00:00:00Z',
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.endsWith('/auth/logout')) {
      return http.Response('', 204);
    }

    if (path.endsWith('/auth/refresh')) {
      return http.Response(
        jsonEncode({
          'accessToken': auth.contains('admin') ? _adminToken : _appToken,
          'refreshToken': 'refreshed-token',
          'expiresAt': '2030-01-01T00:00:00Z',
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    // ── Account ───────────────────────────────────────────────────────────────

    if (path.endsWith('/account/me')) {
      final user = auth.contains('admin') ? _adminUser : _appUser;
      return http.Response(
        jsonEncode(user),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.endsWith('/account/password')) {
      return http.Response('', 204);
    }

    // ── Risorse ───────────────────────────────────────────────────────────────

    if (path.contains('/users')) {
      return http.Response(
        jsonEncode(_usersPage),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.contains('/programs')) {
      return http.Response(
        jsonEncode(_programs),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.contains('/audit-logs')) {
      return http.Response(
        jsonEncode(_auditLogs),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.contains('/articles')) {
      return http.Response(
        jsonEncode(_articles),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.contains('/categories')) {
      return http.Response(
        jsonEncode(_categories),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.contains('/measure-units')) {
      return http.Response(
        jsonEncode(_measureUnits),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    return http.Response('Not found', 404);
  });
}
