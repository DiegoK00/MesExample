import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/auth_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/features/home/programs_screen.dart';

class _FakeAuthService extends AuthService {
  _FakeAuthService(List<String> programs) {
    setCurrentUser(CurrentUser(
      id: 1,
      email: 'user@test.com',
      username: 'mario',
      loginArea: 2,
      roles: ['User'],
      programs: programs,
    ));
  }
}

Widget _buildApp(_FakeAuthService auth) {
  final router = GoRouter(
    initialLocation: '/programs',
    routes: [
      GoRoute(
        path: '/programs',
        builder: (_, __) => const ProgramsScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (_, __) => const Scaffold(body: Text('Home')),
      ),
    ],
  );
  return ChangeNotifierProvider<AuthService>.value(
    value: auth,
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  group('ProgramsScreen', () {
    testWidgets('mostra il titolo "I miei programmi"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService(['PROG1'])));
      await tester.pumpAndSettle();
      expect(find.text('I miei programmi'), findsOneWidget);
    });

    testWidgets('lista vuota: mostra messaggio "Nessun programma assegnato"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService([])));
      await tester.pumpAndSettle();
      expect(find.text('Nessun programma assegnato'), findsOneWidget);
      expect(find.byType(ListView), findsNothing);
    });

    testWidgets('lista vuota: mostra icona apps_outlined', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService([])));
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.apps_outlined), findsOneWidget);
    });

    testWidgets('mostra un card per ogni programma assegnato', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService(['PROG1', 'PROG2', 'PROG3'])));
      await tester.pumpAndSettle();
      expect(find.text('PROG1'), findsOneWidget);
      expect(find.text('PROG2'), findsOneWidget);
      expect(find.text('PROG3'), findsOneWidget);
      expect(find.byType(Card), findsNWidgets(3));
    });

    testWidgets('ogni card mostra icona apps e check_circle', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService(['PROG1'])));
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.apps), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('pulsante Back naviga a /home', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService(['PROG1'])));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Home'), findsOneWidget);
    });
  });
}
