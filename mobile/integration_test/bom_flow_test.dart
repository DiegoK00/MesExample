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

  /// Login → Articoli → tap BOM su ART001 → AdminArticleBOMScreen
  Future<void> navigateToBOM(WidgetTester tester) async {
    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('BOM').first);
    await tester.pumpAndSettle();
  }

  // ── Test ──────────────────────────────────────────────────────────────────

  testWidgets(
      'bom_navigate: tap BOM su ART001 apre AdminArticleBOMScreen',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await loginAdmin(tester);
    await tester.tap(find.text('Articoli'));
    await tester.pumpAndSettle();

    expect(find.text('ART001'), findsOneWidget);

    await tester.tap(find.text('BOM').first);
    await tester.pumpAndSettle();

    expect(find.textContaining('Bill of Materials'), findsOneWidget);
    expect(find.text('T-Shirt Bianca'), findsNothing);
  });

  testWidgets(
      'bom_title: AppBar mostra il codice articolo padre',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    expect(find.text('Bill of Materials - ART001'), findsOneWidget);
  });

  testWidgets(
      'bom_list: mostra componente con codice, nome, quantita e scarto',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    expect(find.text('TESSUTO_01'), findsOneWidget);
    expect(find.text('Cotone Bianco'), findsOneWidget);
    expect(find.textContaining('Quantita: 1.5 Metro'), findsOneWidget);
    expect(find.text('Scarto %: 5.0'), findsOneWidget);
  });

  testWidgets(
      'bom_fab: tap FAB apre dialog "Aggiungi Componente" con campi corretti',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    expect(find.text('Aggiungi Componente'), findsOneWidget);
    expect(find.text('Articolo Componente'), findsOneWidget);
    expect(find.text('Tipo Quantita'), findsOneWidget);
    expect(find.text('Unita di Misura'), findsOneWidget);
    expect(find.text('Crea'), findsOneWidget);
  });

  testWidgets(
      'bom_edit: tap Modifica apre dialog precompilato con quantita e scarto',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    await tester.tap(find.byTooltip('Modifica'));
    await tester.pumpAndSettle();

    expect(find.text('Modifica Componente'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, '1.5'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, '5.0'), findsOneWidget);
    expect(find.text('Aggiorna'), findsOneWidget);
  });

  testWidgets(
      'bom_delete_cancel: tap Annulla mantiene il componente in lista',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    await tester.tap(find.byTooltip('Elimina'));
    await tester.pumpAndSettle();

    expect(find.text('Eliminare il componente?'), findsOneWidget);

    await tester.tap(find.text('Annulla'));
    await tester.pumpAndSettle();

    expect(find.text('TESSUTO_01'), findsOneWidget);
  });

  testWidgets(
      'bom_delete_confirm: conferma elimina mostra snackbar "Componente eliminato"',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    await tester.tap(find.byTooltip('Elimina'));
    await tester.pumpAndSettle();

    expect(find.text('Eliminare il componente?'), findsOneWidget);
    expect(find.textContaining('Rimuovere "Cotone Bianco"'), findsOneWidget);

    await tester.tap(find.text('Elimina'));
    await tester.pumpAndSettle();

    expect(find.text('Componente eliminato'), findsOneWidget);
  });

  testWidgets(
      'bom_back: back button torna alla lista articoli',
      (tester) async {
    await tester.pumpWidget(await buildApp());
    await tester.pumpAndSettle();

    await navigateToBOM(tester);

    expect(find.textContaining('Bill of Materials'), findsOneWidget);

    final NavigatorState navigator = tester.state(find.byType(Navigator).last);
    navigator.pop();
    await tester.pumpAndSettle();

    expect(find.text('ART001'), findsOneWidget);
    expect(find.text('T-Shirt Bianca'), findsOneWidget);
  });
}
