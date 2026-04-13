import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/articles_service.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/categories_service.dart';
import 'package:mobile/core/services/measure_units_service.dart';
import 'package:mobile/features/admin/articles/admin_articles_screen.dart';

// ---------------------------------------------------------------------------
// Fake services
// ---------------------------------------------------------------------------
class _FakeArticlesService extends ArticlesService {
  final List<ArticleResponse>? _data;
  final bool _throws;

  _FakeArticlesService({List<ArticleResponse>? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<List<ArticleResponse>> getAll({bool? activeOnly}) async {
    if (_throws) throw Exception('API error');
    final all = _data ?? [];
    if (activeOnly == true) return all.where((a) => a.isActive).toList();
    return all;
  }

  @override
  Future<ArticleResponse> create(Map<String, dynamic> body) async => _mockArticles.first;

  @override
  Future<ArticleResponse> update(int id, Map<String, dynamic> body) async => _mockArticles.first;

  @override
  Future<void> delete(int id) async {}
}

class _FakeCategoriesService extends CategoriesService {
  _FakeCategoriesService() : super(AuthService());

  @override
  Future<List<CategoryResponse>> getAll() async =>
      [const CategoryResponse(id: 1, name: 'Abbigliamento')];
}

class _FakeMeasureUnitsService extends MeasureUnitsService {
  _FakeMeasureUnitsService() : super(AuthService());

  @override
  Future<List<MeasureUnitResponse>> getAll() async =>
      [const MeasureUnitResponse(id: 1, name: 'Pezzo')];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(ArticlesService service) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<ArticlesService>.value(value: service),
      Provider<CategoriesService>.value(value: _FakeCategoriesService()),
      Provider<MeasureUnitsService>.value(value: _FakeMeasureUnitsService()),
    ],
    child: MaterialApp(
      home: const AdminArticlesScreen(),
    ),
  );
}

const _mockArticles = [
  ArticleResponse(
    id: 1,
    code: 'ART001',
    name: 'Maglietta Bianca',
    categoryId: 1,
    categoryName: 'Abbigliamento',
    price: 19.99,
    umId: 1,
    umName: 'Pezzo',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    createdByUsername: 'admin',
  ),
  ArticleResponse(
    id: 2,
    code: 'ART002',
    name: 'Cintura Nera',
    categoryId: 1,
    categoryName: 'Accessori',
    price: 29.50,
    umId: 1,
    umName: 'Pezzo',
    isActive: false,
    createdAt: '2026-01-02T00:00:00Z',
    createdByUsername: 'admin',
  ),
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminArticlesScreen', () {
    testWidgets('mostra la lista articoli con codice e nome', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService(data: _mockArticles)));
      await tester.pumpAndSettle();

      expect(find.text('ART001'), findsOneWidget);
      expect(find.text('Maglietta Bianca'), findsOneWidget);
      expect(find.text('ART002'), findsOneWidget);
      expect(find.text('Cintura Nera'), findsOneWidget);
    });

    testWidgets('mostra badge Attivo/Inattivo correttamente', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService(data: _mockArticles)));
      await tester.pumpAndSettle();

      expect(find.text('Attivo'), findsOneWidget);
      expect(find.text('Inattivo'), findsOneWidget);
    });

    testWidgets('mostra chip categoria e prezzo', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService(data: _mockArticles)));
      await tester.pumpAndSettle();

      expect(find.text('Abbigliamento'), findsOneWidget);
      expect(find.text('19.99'), findsOneWidget);
    });

    testWidgets('mostra messaggio di errore se il servizio lancia eccezione', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService(throws: true)));
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('mostra "Nessun articolo trovato" se la lista è vuota', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService()));
      await tester.pumpAndSettle();

      expect(find.text('Nessun articolo trovato'), findsOneWidget);
    });

    testWidgets('FAB apre AdminArticleFormScreen con titolo "Nuovo Articolo"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService(data: _mockArticles)));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      expect(find.text('Nuovo Articolo'), findsOneWidget);
    });

    testWidgets('tap "Modifica" apre AdminArticleFormScreen con titolo "Modifica Articolo"',
        (tester) async {
      await tester.pumpWidget(_buildApp(_FakeArticlesService(data: _mockArticles)));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Modifica').first);
      await tester.pumpAndSettle();

      expect(find.text('Modifica Articolo'), findsOneWidget);
    });
  });
}
