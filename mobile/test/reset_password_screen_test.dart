import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/features/auth/reset_password/reset_password_screen.dart';
import 'package:provider/provider.dart';

class _FakeAuthService extends AuthService {
  bool shouldThrow = false;
  String? lastToken;
  String? lastPassword;
  Completer<void>? completer;

  @override
  Future<void> resetPassword(String token, String newPassword) async {
    lastToken = token;
    lastPassword = newPassword;
    if (completer != null) await completer!.future;
    if (shouldThrow) throw Exception('Token non valido o scaduto');
  }
}

void main() {
  late _FakeAuthService fakeAuth;

  setUp(() {
    fakeAuth = _FakeAuthService();
  });

  Widget buildWidget({int area = 2, String token = 'valid-token'}) {
    final router = GoRouter(
      initialLocation: '/reset-password',
      routes: [
        GoRoute(
          path: '/reset-password',
          builder: (_, _) => ResetPasswordScreen(area: area, token: token),
        ),
        GoRoute(
          path: '/login',
          builder: (_, _) => const Scaffold(body: Text('Login App')),
        ),
        GoRoute(
          path: '/admin-login',
          builder: (_, _) => const Scaffold(body: Text('Login Admin')),
        ),
        GoRoute(
          path: '/forgot-password/:area',
          builder: (_, state) => Scaffold(
            body: Text('Forgot ${state.pathParameters["area"]}'),
          ),
        ),
      ],
    );
    return ChangeNotifierProvider<AuthService>.value(
      value: fakeAuth,
      child: MaterialApp.router(routerConfig: router),
    );
  }

  group('ResetPasswordScreen — token vuoto', () {
    testWidgets('mostra widget token non valido', (tester) async {
      await tester.pumpWidget(buildWidget(token: ''));
      await tester.pumpAndSettle();
      expect(find.text('Token non valido'), findsOneWidget);
      expect(find.text('Torna al login'), findsOneWidget);
    });

    testWidgets('non mostra il form quando token è vuoto', (tester) async {
      await tester.pumpWidget(buildWidget(token: ''));
      await tester.pumpAndSettle();
      expect(find.byType(TextFormField), findsNothing);
    });
  });

  group('ResetPasswordScreen — token valido', () {
    testWidgets('mostra il form con due campi password', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.widgetWithText(TextFormField, 'Nuova password'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, 'Conferma password'), findsOneWidget);
    });

    testWidgets('validazione: password vuota mostra errore', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Imposta password'));
      await tester.pump();
      expect(find.text('Password obbligatoria'), findsOneWidget);
    });

    testWidgets('validazione: password troppo corta mostra errore', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'abc');
      await tester.tap(find.text('Imposta password'));
      await tester.pump();
      expect(find.text('Minimo 8 caratteri'), findsOneWidget);
    });

    testWidgets('validazione: password e conferma diverse mostrano errore', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'newpass123');
      await tester.enterText(find.byType(TextFormField).last, 'different1');
      await tester.tap(find.text('Imposta password'));
      await tester.pump();
      expect(find.text('Le password non coincidono'), findsOneWidget);
      expect(fakeAuth.lastToken, isNull);
    });

    testWidgets('submit ok: chiama resetPassword con token e nuova password', (tester) async {
      await tester.pumpWidget(buildWidget(token: 'mytoken'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'newpass123');
      await tester.enterText(find.byType(TextFormField).last, 'newpass123');
      await tester.tap(find.text('Imposta password'));
      await tester.pumpAndSettle();
      expect(fakeAuth.lastToken, equals('mytoken'));
      expect(fakeAuth.lastPassword, equals('newpass123'));
    });

    testWidgets('submit ok: mostra stato di successo con bottone vai al login', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'newpass123');
      await tester.enterText(find.byType(TextFormField).last, 'newpass123');
      await tester.tap(find.text('Imposta password'));
      await tester.pumpAndSettle();
      expect(find.text('Password aggiornata'), findsOneWidget);
      expect(find.text('Vai al login'), findsOneWidget);
    });

    testWidgets('submit con token scaduto: mostra messaggio di errore', (tester) async {
      fakeAuth.shouldThrow = true;
      await tester.pumpWidget(buildWidget(token: 'expired'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'newpass123');
      await tester.enterText(find.byType(TextFormField).last, 'newpass123');
      await tester.tap(find.text('Imposta password'));
      await tester.pumpAndSettle();
      expect(find.textContaining('non valido o scaduto'), findsOneWidget);
      expect(find.text('Password aggiornata'), findsNothing);
    });

    testWidgets('loading state: bottone disabilitato durante submit', (tester) async {
      final c = Completer<void>();
      fakeAuth.completer = c;
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'newpass123');
      await tester.enterText(find.byType(TextFormField).last, 'newpass123');
      await tester.tap(find.text('Imposta password'));
      await tester.pump();
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull);
      c.complete();
      await tester.pumpAndSettle();
    });
  });
}
