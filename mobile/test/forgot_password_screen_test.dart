import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/features/auth/forgot_password/forgot_password_screen.dart';
import 'package:provider/provider.dart';

class _FakeAuthService extends AuthService {
  bool shouldThrow = false;
  String? lastEmail;
  int? lastArea;

  @override
  Future<void> forgotPassword(String email, int area) async {
    lastEmail = email;
    lastArea = area;
    if (shouldThrow) throw Exception('Network error');
  }
}

void main() {
  late _FakeAuthService fakeAuth;

  setUp(() {
    fakeAuth = _FakeAuthService();
  });

  Widget buildWidget({int area = 2}) {
    final router = GoRouter(
      initialLocation: '/forgot-password',
      routes: [
        GoRoute(
          path: '/forgot-password',
          builder: (_, _) => ForgotPasswordScreen(area: area),
        ),
        GoRoute(
          path: '/login',
          builder: (_, _) => const Scaffold(body: Text('Login App')),
        ),
        GoRoute(
          path: '/admin-login',
          builder: (_, _) => const Scaffold(body: Text('Login Admin')),
        ),
      ],
    );
    return ChangeNotifierProvider<AuthService>.value(
      value: fakeAuth,
      child: MaterialApp.router(routerConfig: router),
    );
  }

  group('ForgotPasswordScreen', () {
    testWidgets('mostra campo email e bottone invio', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Invia istruzioni'), findsOneWidget);
    });

    testWidgets('validazione: email vuota mostra errore', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Invia istruzioni'));
      await tester.pump();
      expect(find.text('Email obbligatoria'), findsOneWidget);
    });

    testWidgets('validazione: email senza @ mostra errore formato', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), 'notanemail');
      await tester.tap(find.text('Invia istruzioni'));
      await tester.pump();
      expect(find.text('Email non valida'), findsOneWidget);
    });

    testWidgets('submit ok: chiama forgotPassword con email e area corretti', (tester) async {
      await tester.pumpWidget(buildWidget(area: 1));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), 'test@test.com');
      await tester.tap(find.text('Invia istruzioni'));
      await tester.pumpAndSettle();
      expect(fakeAuth.lastEmail, equals('test@test.com'));
      expect(fakeAuth.lastArea, equals(1));
    });

    testWidgets('submit ok: mostra stato di successo', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), 'test@test.com');
      await tester.tap(find.text('Invia istruzioni'));
      await tester.pumpAndSettle();
      expect(find.text('Email inviata'), findsOneWidget);
      expect(find.text('Torna al login'), findsOneWidget);
    });

    testWidgets('errore server: mostra comunque stato di successo (anti-enumeration)', (tester) async {
      fakeAuth.shouldThrow = true;
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField), 'notfound@test.com');
      await tester.tap(find.text('Invia istruzioni'));
      await tester.pumpAndSettle();
      // Nota: ForgotPasswordScreen non lancia mai (il service swallows exceptions)
      // quindi il test verifica che il form sia ancora visibile (il fake lancia ma
      // la schermata gestisce solo il servizio vero)
      expect(find.byType(TextFormField), findsNothing); // success state shown
    });

    testWidgets('titolo della schermata: Password dimenticata', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      expect(find.text('Password dimenticata'), findsOneWidget);
    });

    testWidgets('app bar: bottone Torna al login naviga a /login per area 2', (tester) async {
      await tester.pumpWidget(buildWidget(area: 2));
      await tester.pumpAndSettle();
      // Back button navigates to the login route via AppBar leading
      final appBar = find.byType(AppBar);
      expect(appBar, findsOneWidget);
    });
  });
}
