import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/categories_service.dart';
import 'package:mobile/features/admin/categories/admin_categories_screen.dart';

// ---------------------------------------------------------------------------
// Fake service
// ---------------------------------------------------------------------------
class _FakeCategoriesService extends CategoriesService {
  final List<CategoryResponse>? _data;
  final bool _throws;

  _FakeCategoriesService({List<CategoryResponse>? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<List<CategoryResponse>> getAll() async {
    if (_throws) throw Exception('API error');
    return _data ?? [];
  }

  @override
  Future<CategoryResponse> create({required String name, String? description}) async =>
      CategoryResponse(id: 99, name: name, description: description);

  @override
  Future<CategoryResponse> update(int id, {required String name, String? description}) async =>
      CategoryResponse(id: id, name: name, description: description);

  @override
  Future<void> delete(int id) async {}
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(CategoriesService service) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<CategoriesService>.value(value: service),
    ],
    child: MaterialApp(
      home: const AdminCategoriesScreen(),
    ),
  );
}

const _mockCategories = [
  CategoryResponse(id: 1, name: 'Abbigliamento', description: 'Capi di abbigliamento'),
  CategoryResponse(id: 2, name: 'Accessori'),
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminCategoriesScreen', () {
    testWidgets('mostra la lista categorie con nome', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeCategoriesService(data: _mockCategories)));
      await tester.pumpAndSettle();

      expect(find.text('Abbigliamento'), findsOneWidget);
      expect(find.text('Accessori'), findsOneWidget);
    });

    testWidgets('mostra descrizione se presente', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeCategoriesService(data: _mockCategories)));
      await tester.pumpAndSettle();

      expect(find.text('Capi di abbigliamento'), findsOneWidget);
    });

    testWidgets('mostra messaggio di errore se il servizio lancia eccezione', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeCategoriesService(throws: true)));
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('mostra "Nessuna categoria trovata" se la lista è vuota', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeCategoriesService()));
      await tester.pumpAndSettle();

      expect(find.text('Nessuna categoria trovata'), findsOneWidget);
    });

    testWidgets('FAB apre bottom sheet con titolo "Nuova Categoria"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeCategoriesService(data: _mockCategories)));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      expect(find.text('Nuova Categoria'), findsOneWidget);
      expect(find.byType(TextFormField), findsWidgets);
    });

    testWidgets('tap icona edit apre bottom sheet con titolo "Modifica Categoria"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeCategoriesService(data: _mockCategories)));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.edit).first);
      await tester.pumpAndSettle();

      expect(find.text('Modifica Categoria'), findsOneWidget);
    });
  });
}
