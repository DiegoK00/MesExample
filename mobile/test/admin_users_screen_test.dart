import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/user_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/users_service.dart';
import 'package:mobile/features/admin/users/admin_users_screen.dart';

// ---------------------------------------------------------------------------
// Fake services
// ---------------------------------------------------------------------------
class _FakeUsersService extends UsersService {
  final UsersPageResponse? _data;
  final bool _throws;

  _FakeUsersService({UsersPageResponse? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<UsersPageResponse> getAll({int page = 1, int pageSize = 20, String? search}) async {
    if (_throws) throw Exception('API error');
    return _data ??
        const UsersPageResponse(items: [], totalCount: 0, page: 1, pageSize: 20);
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(UsersService usersService) {
  final router = GoRouter(
    initialLocation: '/admin/users',
    routes: [
      GoRoute(path: '/admin/users', builder: (_, __) => const AdminUsersScreen()),
    ],
  );

  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<UsersService>.value(value: usersService),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

const _mockUsersPage = UsersPageResponse(
  items: [
    UserResponse(
      id: 1, email: 'admin@test.com', username: 'admin',
      loginArea: 1, roles: ['SuperAdmin'], isActive: true,
    ),
    UserResponse(
      id: 2, email: 'user@test.com', username: 'utente1',
      loginArea: 2, roles: ['User'], isActive: false,
    ),
  ],
  totalCount: 2,
  page: 1,
  pageSize: 20,
);

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminUsersScreen', () {
    testWidgets('mostra il CircularProgressIndicator durante il caricamento', (tester) async {
      // Completer che non si risolve mai → nessun timer pendente a cleanup
      final completer = Completer<UsersPageResponse>();
      final service = _FakeUsersService();
      // Override diretto tramite closure
      final router = GoRouter(
        initialLocation: '/admin/users',
        routes: [
          GoRoute(
            path: '/admin/users',
            builder: (_, __) => FutureBuilder<UsersPageResponse>(
              future: completer.future,
              builder: (_, snap) => snap.connectionState == ConnectionState.waiting
                  ? const Scaffold(body: Center(child: CircularProgressIndicator()))
                  : const Scaffold(body: Text('done')),
            ),
          ),
        ],
      );
      await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
          Provider<UsersService>.value(value: service),
        ],
        child: MaterialApp.router(routerConfig: router),
      ));

      await tester.pump(); // Un tick — future ancora in attesa
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('mostra la lista utenti con email e username', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeUsersService(data: _mockUsersPage)));
      await tester.pumpAndSettle();

      expect(find.text('admin'), findsOneWidget);
      expect(find.text('admin@test.com'), findsOneWidget);
      expect(find.text('utente1'), findsOneWidget);
      expect(find.text('user@test.com'), findsOneWidget);
    });

    testWidgets('mostra badge Attivo/Inattivo correttamente', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeUsersService(data: _mockUsersPage)));
      await tester.pumpAndSettle();

      expect(find.text('Attivo'), findsOneWidget);
      expect(find.text('Inattivo'), findsOneWidget);
    });

    testWidgets('mostra messaggio di errore se il servizio lancia eccezione', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeUsersService(throws: true)));
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('mostra messaggio "Nessun utente trovato" se la lista è vuota', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeUsersService()));
      await tester.pumpAndSettle();

      expect(find.text('Nessun utente trovato'), findsOneWidget);
    });
  });
}
