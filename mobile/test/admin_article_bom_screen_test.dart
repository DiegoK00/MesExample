import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/articles_service.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/bill_of_materials_service.dart';
import 'package:mobile/core/services/measure_units_service.dart';
import 'package:mobile/features/admin/articles/admin_article_bom_screen.dart';

class _FakeArticlesService extends ArticlesService {
  final ArticleResponse _article;
  final List<ArticleResponse> _allArticles;

  _FakeArticlesService(this._article, {List<ArticleResponse>? allArticles})
      : _allArticles = allArticles ?? [_article, _mockComponentArticle],
        super(AuthService());

  @override
  Future<ArticleResponse> getById(int id) async => _article;

  @override
  Future<List<ArticleResponse>> getAll({bool? activeOnly}) async {
    if (activeOnly == true) return _allArticles.where((a) => a.isActive).toList();
    return _allArticles;
  }
}

class _FakeMeasureUnitsService extends MeasureUnitsService {
  _FakeMeasureUnitsService() : super(AuthService());

  @override
  Future<List<MeasureUnitResponse>> getAll() async => const [
        MeasureUnitResponse(id: 1, name: 'Pezzo'),
        MeasureUnitResponse(id: 2, name: 'Metro'),
      ];
}

class _FakeBillOfMaterialsService extends BillOfMaterialsService {
  final List<BillOfMaterialResponse>? _data;
  final bool _throws;
  int? deletedParentId;
  int? deletedComponentId;

  _FakeBillOfMaterialsService({List<BillOfMaterialResponse>? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<List<BillOfMaterialResponse>> getByParentArticle(int parentArticleId) async {
    if (_throws) throw Exception('API error');
    return _data ?? [];
  }

  @override
  Future<void> delete(int parentArticleId, int componentArticleId) async {
    deletedParentId = parentArticleId;
    deletedComponentId = componentArticleId;
  }
}

Widget _buildApp({
  required ArticlesService articlesService,
  required BillOfMaterialsService bomService,
  MeasureUnitsService? measureUnitsService,
}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<ArticlesService>.value(value: articlesService),
      Provider<BillOfMaterialsService>.value(value: bomService),
      Provider<MeasureUnitsService>.value(value: measureUnitsService ?? _FakeMeasureUnitsService()),
    ],
    child: const MaterialApp(
      home: AdminArticleBOMScreen(articleId: 1),
    ),
  );
}

const _mockArticle = ArticleResponse(
  id: 1,
  code: 'ART001',
  name: 'Articolo Padre',
  categoryId: 1,
  categoryName: 'Categoria 1',
  price: 100,
  umId: 1,
  umName: 'Pezzo',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  createdByUsername: 'admin',
);

const _mockComponentArticle = ArticleResponse(
  id: 2,
  code: 'ART002',
  name: 'Componente A',
  categoryId: 1,
  categoryName: 'Categoria 1',
  price: 50,
  umId: 1,
  umName: 'Pezzo',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  createdByUsername: 'admin',
);

final _mockBomItems = [
  BillOfMaterialResponse(
    parentArticleId: 1,
    parentArticleCode: 'ART001',
    parentArticleName: 'Articolo Padre',
    componentArticleId: 2,
    componentArticleCode: 'ART002',
    componentArticleName: 'Componente A',
    quantity: 2.5,
    quantityType: 'PHYSICAL',
    umId: 1,
    umName: 'Pezzo',
    scrapPercentage: 5,
    scrapFactor: 0,
    fixedScrap: 0,
  ),
];

void main() {
  group('AdminArticleBOMScreen', () {
    testWidgets('mostra il titolo con codice articolo padre', (tester) async {
      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: _FakeBillOfMaterialsService(data: _mockBomItems),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Bill of Materials - ART001'), findsOneWidget);
    });

    testWidgets('mostra lista BOM con codice, nome, quantita e scarto', (tester) async {
      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: _FakeBillOfMaterialsService(data: _mockBomItems),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('ART002'), findsOneWidget);
      expect(find.text('Componente A'), findsOneWidget);
      expect(find.textContaining('Quantita:'), findsOneWidget);
      expect(find.text('Scarto %: 5.0'), findsOneWidget);
    });

    testWidgets('mostra messaggio vuoto quando non ci sono componenti', (tester) async {
      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: _FakeBillOfMaterialsService(data: const []),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Nessun componente trovato per questo articolo.'), findsOneWidget);
    });

    testWidgets('mostra errore se il service fallisce', (tester) async {
      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: _FakeBillOfMaterialsService(throws: true),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento dei componenti'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('FAB apre il dialog di creazione componente', (tester) async {
      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: _FakeBillOfMaterialsService(data: _mockBomItems),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      expect(find.text('Aggiungi Componente'), findsOneWidget);
      expect(find.text('Articolo Componente'), findsOneWidget);
      expect(find.text('Tipo Quantita'), findsOneWidget);
      expect(find.text('Unita di Misura'), findsOneWidget);
    });

    testWidgets('tap su modifica apre il dialog di edit precompilato', (tester) async {
      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: _FakeBillOfMaterialsService(data: _mockBomItems),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Modifica'));
      await tester.pumpAndSettle();

      expect(find.text('Modifica Componente'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, '2.5'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, '5.0'), findsOneWidget);
    });

    testWidgets('delete mostra conferma e chiama il service', (tester) async {
      final bomService = _FakeBillOfMaterialsService(data: _mockBomItems);

      await tester.pumpWidget(
        _buildApp(
          articlesService: _FakeArticlesService(_mockArticle),
          bomService: bomService,
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byTooltip('Elimina'));
      await tester.pumpAndSettle();

      expect(find.text('Eliminare il componente?'), findsOneWidget);
      expect(find.textContaining('Rimuovere "Componente A"'), findsOneWidget);

      await tester.tap(find.text('Elimina'));
      await tester.pumpAndSettle();

      expect(bomService.deletedParentId, 1);
      expect(bomService.deletedComponentId, 2);
      expect(find.text('Componente eliminato'), findsOneWidget);
    });
  });
}
