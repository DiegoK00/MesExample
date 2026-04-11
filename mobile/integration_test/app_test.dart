import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile/main.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/error_notifier.dart';
import 'package:mobile/core/services/preferences_service.dart';

import 'helpers/fake_secure_storage.dart';
import 'helpers/mock_client.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // ── Setup comune ─────────────────────────────────────────────────────────────

  /// Crea l'app con dipendenze iniettate (HTTP mock, storage in-memory).
  /// [lastArea]: 1 = Admin, 2 = App (determina la schermata di login iniziale).
  Future<MyApp> buildApp({int lastArea = 2}) async {
    SharedPreferences.setMockInitialValues({'last_area': lastArea});
    final storage = FakeSecureStorage();
    final errorNotifier = ErrorNotifier();
    final auth = AuthService(
      client: buildMockClient(),
      storage: storage,
      errorNotifier: errorNotifier,
    );
    final prefs = PreferencesService();
    await Future.wait([auth.init(), prefs.init()]);
    return MyApp(auth: auth, prefs: prefs, errorNotifier: errorNotifier);
  }

  /// Esegue il flow di login tramite UI.
  Future<void> performLogin(
    WidgetTester tester, {
    required String email,
    required String password,
  }) async {
    await tester.enterText(find.byType(TextFormField).first, email);
    await tester.enterText(find.byType(TextFormField).last, password);
    await tester.tap(find.text('Accedi'));
    await tester.pumpAndSettle();
  }

  // ── Test ──────────────────────────────────────────────────────────────────────

  testWidgets('admin_login_flow: login admin mostra AdminHomeScreen con username',
      (tester) async {
    await tester.pumpWidget(await buildApp(lastArea: 1));
    await tester.pumpAndSettle();

    // Verifica di essere sulla schermata di login Admin
    expect(find.text('Backoffice'), findsOneWidget);

    await performLogin(tester, email: 'admin@test.com', password: 'Admin@1234');

    // Dopo login → AdminHomeScreen
    expect(find.text('Benvenuto, admin'), findsOneWidget);
    expect(find.text('SuperAdmin'), findsOneWidget);
  });

  testWidgets('app_login_flow: login utente App mostra HomeScreen con username',
      (tester) async {
    await tester.pumpWidget(await buildApp(lastArea: 2));
    await tester.pumpAndSettle();

    // Verifica di essere sulla schermata di login App
    expect(find.text('MesClaude'), findsOneWidget);

    await performLogin(tester, email: 'user@test.com', password: 'User@1234');

    // Dopo login → HomeScreen
    expect(find.text('Benvenuto, user'), findsOneWidget);
  });

  testWidgets('admin_logout_flow: logout da AdminHomeScreen torna al login',
      (tester) async {
    await tester.pumpWidget(await buildApp(lastArea: 1));
    await tester.pumpAndSettle();

    await performLogin(tester, email: 'admin@test.com', password: 'Admin@1234');
    expect(find.text('Benvenuto, admin'), findsOneWidget);

    // Tap sull'icona logout nella AppBar
    await tester.tap(find.byIcon(Icons.logout));
    await tester.pumpAndSettle();

    // Torna alla schermata di login Admin
    expect(find.text('Backoffice'), findsOneWidget);
    expect(find.byType(TextFormField), findsAtLeast(1));
  });

  testWidgets('admin_navigate_to_users: tap card "Utenti" apre AdminUsersScreen',
      (tester) async {
    await tester.pumpWidget(await buildApp(lastArea: 1));
    await tester.pumpAndSettle();

    await performLogin(tester, email: 'admin@test.com', password: 'Admin@1234');
    expect(find.text('Benvenuto, admin'), findsOneWidget);

    // Tap sulla card "Utenti"
    await tester.tap(find.text('Utenti'));
    await tester.pumpAndSettle();

    // AdminUsersScreen ha title "Utenti" nell'AppBar
    expect(find.text('Utenti'), findsAtLeast(1));
    // La lista si carica (o mostra loader): verifica che non siamo più su AdminHome
    expect(find.text('Benvenuto, admin'), findsNothing);
  });

  testWidgets('app_navigate_to_programs: tap "Programmi assegnati" apre ProgramsScreen',
      (tester) async {
    await tester.pumpWidget(await buildApp(lastArea: 2));
    await tester.pumpAndSettle();

    await performLogin(tester, email: 'user@test.com', password: 'User@1234');
    expect(find.text('Benvenuto, user'), findsOneWidget);

    // Tap sul ListTile "Programmi assegnati"
    await tester.tap(find.text('Programmi assegnati'));
    await tester.pumpAndSettle();

    // ProgramsScreen mostra il titolo e il programma assegnato
    expect(find.text('I miei programmi'), findsOneWidget);
    expect(find.text('PROG_A'), findsOneWidget);
  });

  testWidgets('admin_change_password: tap card "Cambia password" apre ChangePasswordScreen',
      (tester) async {
    await tester.pumpWidget(await buildApp(lastArea: 1));
    await tester.pumpAndSettle();

    await performLogin(tester, email: 'admin@test.com', password: 'Admin@1234');
    expect(find.text('Benvenuto, admin'), findsOneWidget);

    // Tap sulla card "Cambia password"
    await tester.tap(find.text('Cambia password'));
    await tester.pumpAndSettle();

    // ChangePasswordScreen mostra il titolo e i tre campi
    expect(find.text('Cambia password'), findsAtLeast(1));
    expect(find.widgetWithText(TextFormField, 'Password attuale'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Nuova password'), findsOneWidget);
  });
}
