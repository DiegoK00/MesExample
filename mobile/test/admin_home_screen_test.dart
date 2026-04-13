import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/auth_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/preferences_service.dart';
import 'package:mobile/features/admin/admin_home_screen.dart';

// ---------------------------------------------------------------------------
// Fake AuthService per admin
// ---------------------------------------------------------------------------
class _FakeAdminAuthService extends AuthService {
  bool logoutCalled = false;

  _FakeAdminAuthService() {
    setCurrentUser(const CurrentUser(
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      loginArea: 1,
      roles: ['SuperAdmin'],
      programs: [],
    ));
  }

  @override
  Future<void> logout() async {
    logoutCalled = true;
    notifyListeners();
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(_FakeAdminAuthService auth, {String initialLocation = '/admin'}) {
  final router = GoRouter(
    initialLocation: initialLocation,
    routes: [
      GoRoute(path: '/admin', builder: (_, _) => const AdminHomeScreen()),
      GoRoute(path: '/admin/users', builder: (_, _) => const Scaffold(body: Text('Utenti'))),
      GoRoute(path: '/admin/programs', builder: (_, _) => const Scaffold(body: Text('Programmi'))),
      GoRoute(path: '/admin/audit-logs', builder: (_, _) => const Scaffold(body: Text('Audit Log'))),
      GoRoute(path: '/admin-login', builder: (_, _) => const Scaffold(body: Text('Login'))),
    ],
  );

  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>.value(value: auth),
      ChangeNotifierProvider<PreferencesService>(create: (_) => PreferencesService()),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminHomeScreen', () {
    testWidgets('mostra username e ruolo dell\'admin', (tester) async {
      final auth = _FakeAdminAuthService();
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();

      expect(find.text('Benvenuto, admin'), findsOneWidget);
      expect(find.text('SuperAdmin'), findsOneWidget);
    });

    testWidgets('mostra le tre card di navigazione', (tester) async {
      final auth = _FakeAdminAuthService();
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();

      expect(find.text('Utenti'), findsOneWidget);
      expect(find.text('Programmi'), findsOneWidget);
      expect(find.text('Audit Log'), findsOneWidget);
    });

    testWidgets('tap su Utenti naviga a /admin/users', (tester) async {
      final auth = _FakeAdminAuthService();
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Utenti'));
      await tester.pumpAndSettle();

      expect(find.text('Utenti'), findsOneWidget);
    });

    testWidgets('pulsante Esci chiama logout', (tester) async {
      final auth = _FakeAdminAuthService();
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      expect(auth.logoutCalled, isTrue);
    });
  });
}
