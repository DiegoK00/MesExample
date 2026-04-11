import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/auth_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/features/auth/change_password/change_password_screen.dart';

class _FakeAuthService extends AuthService {
  bool shouldThrow = false;
  String? lastCurrent;
  String? lastNew;
  Completer<void>? completer;

  _FakeAuthService({int area = 2}) {
    setCurrentUser(CurrentUser(
      id: 1,
      email: 'user@test.com',
      username: 'mario',
      loginArea: area,
      roles: ['User'],
      programs: [],
    ));
  }

  @override
  Future<void> changePassword(String currentPassword, String newPassword) async {
    lastCurrent = currentPassword;
    lastNew = newPassword;
    if (completer != null) await completer!.future;
    if (shouldThrow) throw Exception('Password attuale non corretta');
  }
}

Widget _buildApp(_FakeAuthService auth, {int area = 2}) {
  final backRoute = area == 1 ? '/admin' : '/home';
  final router = GoRouter(
    initialLocation: '/change-password',
    routes: [
      GoRoute(
        path: '/change-password',
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      GoRoute(path: '/home', builder: (_, __) => const Scaffold(body: Text('Home'))),
      GoRoute(path: '/admin', builder: (_, __) => const Scaffold(body: Text('Admin'))),
    ],
  );
  return ChangeNotifierProvider<AuthService>.value(
    value: auth,
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  group('ChangePasswordScreen', () {
    testWidgets('mostra titolo "Cambia password"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService()));
      await tester.pumpAndSettle();
      expect(find.text('Cambia password'), findsWidgets);
    });

    testWidgets('mostra tre campi: password attuale, nuova, conferma', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService()));
      await tester.pumpAndSettle();
      expect(find.byType(TextFormField), findsNWidgets(3));
      expect(find.text('Password attuale'), findsOneWidget);
      expect(find.text('Nuova password'), findsOneWidget);
      expect(find.text('Conferma nuova password'), findsOneWidget);
    });

    testWidgets('validazione: campi vuoti mostrano errori', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Salva'));
      await tester.pump();
      expect(find.text('Password attuale obbligatoria'), findsOneWidget);
    });

    testWidgets('validazione: nuova password troppo corta', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService()));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(1), 'abc');
      await tester.tap(find.text('Salva'));
      await tester.pump();
      expect(find.text('Minimo 8 caratteri'), findsOneWidget);
    });

    testWidgets('validazione: password e conferma non coincidono', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService()));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(1), 'newpass123');
      await tester.enterText(find.byType(TextFormField).at(2), 'different1');
      await tester.tap(find.text('Salva'));
      await tester.pump();
      expect(find.text('Le password non coincidono'), findsOneWidget);
    });

    testWidgets('submit ok: chiama changePassword con i valori corretti', (tester) async {
      final auth = _FakeAuthService();
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'oldpass1');
      await tester.enterText(find.byType(TextFormField).at(1), 'newpass123');
      await tester.enterText(find.byType(TextFormField).at(2), 'newpass123');
      await tester.tap(find.text('Salva'));
      await tester.pumpAndSettle();
      expect(auth.lastCurrent, equals('oldpass1'));
      expect(auth.lastNew, equals('newpass123'));
    });

    testWidgets('submit ok: mostra stato di successo', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService()));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'oldpass1');
      await tester.enterText(find.byType(TextFormField).at(1), 'newpass123');
      await tester.enterText(find.byType(TextFormField).at(2), 'newpass123');
      await tester.tap(find.text('Salva'));
      await tester.pumpAndSettle();
      expect(find.text('Password aggiornata'), findsOneWidget);
      expect(find.text('Torna alla home'), findsOneWidget);
    });

    testWidgets('submit con password sbagliata: mostra errore inline', (tester) async {
      final auth = _FakeAuthService()..shouldThrow = true;
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'wrongpass');
      await tester.enterText(find.byType(TextFormField).at(1), 'newpass123');
      await tester.enterText(find.byType(TextFormField).at(2), 'newpass123');
      await tester.tap(find.text('Salva'));
      await tester.pumpAndSettle();
      expect(find.textContaining('non corretta'), findsOneWidget);
      expect(find.text('Password aggiornata'), findsNothing);
    });

    testWidgets('loading state: bottone disabilitato durante submit', (tester) async {
      final c = Completer<void>();
      final auth = _FakeAuthService()..completer = c;
      await tester.pumpWidget(_buildApp(auth));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'oldpass1');
      await tester.enterText(find.byType(TextFormField).at(1), 'newpass123');
      await tester.enterText(find.byType(TextFormField).at(2), 'newpass123');
      await tester.tap(find.text('Salva'));
      await tester.pump();
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull);
      c.complete();
      await tester.pumpAndSettle();
    });

    testWidgets('back button area App naviga a /home', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService(area: 2)));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Home'), findsOneWidget);
    });

    testWidgets('back button area Admin naviga a /admin', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuthService(area: 1)));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(BackButton));
      await tester.pumpAndSettle();
      expect(find.text('Admin'), findsOneWidget);
    });
  });
}
