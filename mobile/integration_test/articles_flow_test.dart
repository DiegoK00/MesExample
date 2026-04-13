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

  // ── Setup ─────────────────────────────────────────────────────────────────

  Future<MyApp> buildApp() async {
    SharedPreferences.setMockInitialValues({'last_area': 1});
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

  Future<void> loginAdmin(WidgetTester tester) async {
    await tester.enterText(find.byType(TextFormField).first, 'admin@test.com');
    await tester.enterText(find.byType(TextFormField).last, 'Admin@1234');
    await tester.tap(find.text('Accedi'));
    await tester.pumpAndSettle();
  }

  // ── Test ──────────────────────────────────────────────────────────────────

  testWidgets(
      'articles_navigate: tap card "Articoli" apre AdminArticlesScreen',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    expect(find.text('Benvenuto, admin'), findsOneWidget);

    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    // AdminArticlesScreen mostra il titolo nell'AppBar
    expect(find.text('Articoli'), findsAtLeast(1));
    // Non siamo più su AdminHomeScreen
    expect(find.text('Benvenuto, admin'), findsNothing);
  });

  testWidgets(
      'articles_list: lista mostra codice, nome e badge isActive degli articoli',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    // Articolo 1: attivo
    expect(find.text('ART001'), findsOneWidget);
    expect(find.text('T-Shirt Bianca'), findsOneWidget);
    expect(find.text('Attivo'), findsOneWidget);

    // Articolo 2: inattivo
    expect(find.text('ART002'), findsOneWidget);
    expect(find.text('Cintura Pelle'), findsOneWidget);
    expect(find.text('Inattivo'), findsOneWidget);
  });

  testWidgets(
      'articles_list: mostra categoria e prezzo nella card',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    expect(find.text('Abbigliamento'), findsOneWidget);
    expect(find.text('19.90'), findsOneWidget);
  });

  testWidgets(
      'articles_list: mostra misure nella card quando presenti',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    expect(find.textContaining('S / M / L / XL'), findsOneWidget);
  });

  testWidgets(
      'articles_create: tap FAB apre AdminArticleFormScreen in modalità creazione',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    // Tap sul FAB (+)
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    // Form di creazione: titolo "Nuovo Articolo" e campo Codice visibile
    expect(find.text('Nuovo Articolo'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Codice'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Nome'), findsOneWidget);
    expect(find.text('Crea Articolo'), findsOneWidget);
  });

  testWidgets(
      'articles_create_validation: submit senza campi obbligatori mostra errori',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    // Tap su "Crea Articolo" senza compilare nulla
    await tester.tap(find.text('Crea Articolo'));
    await tester.pumpAndSettle();

    // Mostra errori di validazione
    expect(find.text('Codice obbligatorio'), findsOneWidget);
    expect(find.text('Nome obbligatorio'), findsOneWidget);
  });

  testWidgets(
      'articles_edit: tap "Modifica" su articolo attivo apre form in modalità modifica',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    // Tap "Modifica" sulla prima card (ART001, isActive=true)
    await tester.tap(find.text('Modifica').first);
    await tester.pumpAndSettle();

    // Form di modifica: titolo "Modifica Articolo" e codice non editabile
    expect(find.text('Modifica Articolo'), findsOneWidget);
    expect(find.text('ART001'), findsOneWidget);

    // Campo Nome pre-compilato
    expect(find.widgetWithText(TextFormField, 'Nome'), findsOneWidget);

    // Pulsante "Salva" (non "Crea Articolo")
    expect(find.text('Salva'), findsOneWidget);
    expect(find.text('Crea Articolo'), findsNothing);
  });
}
