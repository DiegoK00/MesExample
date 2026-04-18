import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/models/auth_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/preferences_service.dart';
import 'package:mobile/features/auth/login/login_screen.dart';
import 'package:provider/provider.dart';

// Fake PreferencesService — evita SharedPreferences.getInstance() nei test
class _FakePreferencesService extends PreferencesService {
  @override
  Future<void> setLastArea(int area) async {}
}

// Fake controllabile che estende AuthService — nessuna chiamata HTTP reale
class _FakeAuthService extends AuthService {
  bool shouldThrow = false;
  LoginRequest? lastRequest;
  Completer<void>? loginCompleter;

  @override
  Future<void> login(LoginRequest request) async {
    lastRequest = request;
    if (loginCompleter != null) await loginCompleter!.future;
    if (shouldThrow) throw Exception('Credenziali non valide');
  }
}

void main() {
  late _FakeAuthService fakeAuth;

  setUp(() {
    fakeAuth = _FakeAuthService();
  });

  Widget buildWidget({int area = 2}) {
    final router = GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(path: '/login', builder: (_, _) => LoginScreen(area: area)),
        GoRoute(path: '/home', builder: (_, _) => const Scaffold(body: Text('Home'))),
        GoRoute(path: '/admin', builder: (_, _) => const Scaffold(body: Text('Admin'))),
      ],
    );
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthService>.value(value: fakeAuth),
        ChangeNotifierProvider<PreferencesService>(create: (_) => _FakePreferencesService()),
      ],
      child: MaterialApp.router(routerConfig: router),
    );
  }

  group('LoginScreen', () {
    testWidgets('area=1: mostra titolo Backoffice e icona admin', (tester) async {
      await tester.pumpWidget(buildWidget(area: 1));
      await tester.pumpAndSettle();
      expect(find.text('Backoffice'), findsOneWidget);
      expect(find.byIcon(Icons.admin_panel_settings), findsOneWidget);
    });

    testWidgets('area=2: mostra titolo MesClaude e icona apps', (tester) async {
      await tester.pumpWidget(buildWidget(area: 2));
      await tester.pumpAndSettle();
      expect(find.text('MesClaude'), findsOneWidget);
      expect(find.byIcon(Icons.apps), findsOneWidget);
    });

    testWidgets('validazione: email vuota mostra errore', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Accedi'));
      await tester.pump();
      expect(find.text('Email obbligatoria'), findsOneWidget);
    });

    testWidgets('validazione: email senza @ mostra errore formato', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'notanemail');
      await tester.tap(find.text('Accedi'));
      await tester.pump();
      expect(find.text('Email non valida'), findsOneWidget);
    });

    testWidgets('validazione: password vuota mostra errore', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'test@test.com');
      await tester.tap(find.text('Accedi'));
      await tester.pump();
      expect(find.text('Password obbligatoria'), findsOneWidget);
    });

    testWidgets('submit fallito: mostra messaggio errore inline', (tester) async {
      fakeAuth.shouldThrow = true;
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'test@test.com');
      await tester.enterText(find.byType(TextFormField).last, 'wrongpassword');
      await tester.tap(find.text('Accedi'));
      await tester.pumpAndSettle();
      expect(find.text('Credenziali non valide. Riprova.'), findsOneWidget);
    });

    testWidgets('submit ok: chiama AuthService.login con parametri corretti', (tester) async {
      await tester.pumpWidget(buildWidget(area: 2));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'test@test.com');
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.tap(find.text('Accedi'));
      await tester.pumpAndSettle();
      expect(fakeAuth.lastRequest, isNotNull);
      expect(fakeAuth.lastRequest!.email, equals('test@test.com'));
      expect(fakeAuth.lastRequest!.password, equals('password123'));
      expect(fakeAuth.lastRequest!.area, equals(2));
    });

    testWidgets('submit ok: naviga a /home dopo login riuscito', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'test@test.com');
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.tap(find.text('Accedi'));
      await tester.pumpAndSettle();
      expect(find.text('Home'), findsOneWidget);
    });

    testWidgets('loading state: bottone disabilitato durante submit', (tester) async {
      final completer = Completer<void>();
      fakeAuth.loginCompleter = completer;
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'test@test.com');
      await tester.enterText(find.byType(TextFormField).last, 'password123');
      await tester.tap(find.text('Accedi'));
      await tester.pump(); // un frame — loading attivo
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull);
      completer.complete();
      await tester.pumpAndSettle();
    });

    testWidgets('toggle password: visibilità cambia su tap icona', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      // inizialmente oscurato
      final pwBefore = tester.widget<EditableText>(
        find.descendant(of: find.byType(TextFormField).last, matching: find.byType(EditableText)),
      );
      expect(pwBefore.obscureText, isTrue);
      // tap sull'icona visibility
      await tester.tap(find.byIcon(Icons.visibility));
      await tester.pump();
      final pwAfter = tester.widget<EditableText>(
        find.descendant(of: find.byType(TextFormField).last, matching: find.byType(EditableText)),
      );
      expect(pwAfter.obscureText, isFalse);
    });

    testWidgets('inizializzazione: contiene campo email e password', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Accedi'), findsOneWidget);
    });
  });
}
