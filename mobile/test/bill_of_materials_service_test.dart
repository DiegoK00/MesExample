import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/errors/app_exceptions.dart';
import 'package:mobile/core/models/article_models.dart' show CreateBillOfMaterialRequest, UpdateBillOfMaterialRequest;
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/bill_of_materials_service.dart';

class _FakeAuthService extends AuthService {
  final Future<http.Response> Function(Uri uri)? onGet;
  final Future<http.Response> Function(Uri uri, Map<String, dynamic>? body)? onPost;
  final Future<http.Response> Function(Uri uri, Map<String, dynamic>? body)? onPut;
  final Future<http.Response> Function(Uri uri)? onDelete;

  _FakeAuthService({this.onGet, this.onPost, this.onPut, this.onDelete});

  @override
  Future<http.Response> authenticatedGet(Uri uri) => onGet!(uri);

  @override
  Future<http.Response> authenticatedPost(Uri uri, {Map<String, dynamic>? body}) =>
      onPost!(uri, body);

  @override
  Future<http.Response> authenticatedPut(Uri uri, {Map<String, dynamic>? body}) =>
      onPut!(uri, body);

  @override
  Future<http.Response> authenticatedDelete(Uri uri) => onDelete!(uri);
}

const _bomJson = '''
{
  "parentArticleId": 1,
  "parentArticleCode": "ART001",
  "parentArticleName": "Articolo Padre",
  "componentArticleId": 2,
  "componentArticleCode": "ART002",
  "componentArticleName": "Componente A",
  "quantity": 2.5,
  "quantityType": "PHYSICAL",
  "umId": 1,
  "umName": "Pezzo",
  "scrapPercentage": 5.0,
  "scrapFactor": 0.0,
  "fixedScrap": 0.0
}
''';

void main() {
  group('BillOfMaterialsService', () {
    test('getByParentArticle restituisce lista BOM deserializzata', () async {
      final auth = _FakeAuthService(
        onGet: (uri) async {
          expect(uri.path, contains('/bill-of-materials/by-parent/1'));
          return http.Response(
            '''
            [
              {
                "parentArticleId": 1,
                "parentArticleCode": "ART001",
                "parentArticleName": "Articolo Padre",
                "componentArticleId": 2,
                "componentArticleCode": "ART002",
                "componentArticleName": "Componente A",
                "quantity": 2.5,
                "quantityType": "PHYSICAL",
                "umId": 1,
                "umName": "Pezzo",
                "scrapPercentage": 5,
                "scrapFactor": 0,
                "fixedScrap": 0
              }
            ]
            ''',
            200,
            headers: {'content-type': 'application/json'},
          );
        },
      );

      final service = BillOfMaterialsService(auth);
      final result = await service.getByParentArticle(1);

      expect(result, hasLength(1));
      expect(result.first.parentArticleId, 1);
      expect(result.first.componentArticleCode, 'ART002');
      expect(result.first.componentArticleName, 'Componente A');
      expect(result.first.quantity, 2.5);
      expect(result.first.scrapPercentage, 5);
    });

    test('getByParentArticle restituisce lista vuota', () async {
      final auth = _FakeAuthService(
        onGet: (_) async => http.Response('[]', 200, headers: {'content-type': 'application/json'}),
      );

      final service = BillOfMaterialsService(auth);
      final result = await service.getByParentArticle(999);

      expect(result, isEmpty);
    });

    test('getByParentArticle propaga NetworkException', () async {
      final auth = _FakeAuthService(
        onGet: (_) async => throw NetworkException('offline'),
      );

      final service = BillOfMaterialsService(auth);

      expect(
        () => service.getByParentArticle(1),
        throwsA(isA<NetworkException>()),
      );
    });

    test('getByParentArticle lancia eccezione su risposta non 200', () async {
      final auth = _FakeAuthService(
        onGet: (_) async => http.Response('Unauthorized', 401),
      );

      final service = BillOfMaterialsService(auth);

      expect(
        () => service.getByParentArticle(1),
        throwsException,
      );
    });
  });

  group('BillOfMaterialsService - create', () {
    test('create restituisce BOM deserializzata su 201', () async {
      final auth = _FakeAuthService(
        onPost: (uri, body) async => http.Response(
          _bomJson,
          201,
          headers: {'content-type': 'application/json'},
        ),
      );

      final service = BillOfMaterialsService(auth);
      final result = await service.create(
        const CreateBillOfMaterialRequest(
          parentArticleId: 1,
          componentArticleId: 2,
          quantity: 2.5,
          quantityType: 'PHYSICAL',
          umId: 1,
          scrapPercentage: 5.0,
          scrapFactor: 0.0,
          fixedScrap: 0.0,
        ),
      );

      expect(result.parentArticleId, 1);
      expect(result.componentArticleId, 2);
      expect(result.quantity, 2.5);
    });

    test('create lancia eccezione su risposta non 200/201', () async {
      final auth = _FakeAuthService(
        onPost: (uri, body) async => http.Response(
          '{"title": "Componente già presente"}',
          409,
          headers: {'content-type': 'application/json'},
        ),
      );

      final service = BillOfMaterialsService(auth);

      expect(
        () => service.create(
          const CreateBillOfMaterialRequest(
            parentArticleId: 1,
            componentArticleId: 2,
            quantity: 1,
            quantityType: 'PHYSICAL',
            umId: 1,
            scrapPercentage: 0,
            scrapFactor: 0,
            fixedScrap: 0,
          ),
        ),
        throwsA(isA<Exception>().having(
          (e) => e.toString(),
          'message',
          contains('Componente già presente'),
        )),
      );
    });
  });

  group('BillOfMaterialsService - update', () {
    test('update restituisce BOM aggiornata su 200', () async {
      final auth = _FakeAuthService(
        onPut: (uri, body) async {
          expect(uri.path, contains('/bill-of-materials/'));
          return http.Response(
            _bomJson,
            200,
            headers: {'content-type': 'application/json'},
          );
        },
      );

      final service = BillOfMaterialsService(auth);
      final result = await service.update(
        1,
        2,
        const UpdateBillOfMaterialRequest(
          quantity: 2.5,
          quantityType: 'PHYSICAL',
          umId: 1,
          scrapPercentage: 5.0,
          scrapFactor: 0.0,
          fixedScrap: 0.0,
        ),
      );

      expect(result.componentArticleId, 2);
      expect(result.scrapPercentage, 5.0);
    });

    test('update lancia eccezione su risposta non 200', () async {
      final auth = _FakeAuthService(
        onPut: (uri, body) async => http.Response('Internal error', 500),
      );

      final service = BillOfMaterialsService(auth);

      expect(
        () => service.update(
          1,
          2,
          const UpdateBillOfMaterialRequest(
            quantity: 1,
            quantityType: 'PHYSICAL',
            umId: 1,
            scrapPercentage: 0,
            scrapFactor: 0,
            fixedScrap: 0,
          ),
        ),
        throwsException,
      );
    });
  });

  group('BillOfMaterialsService - delete', () {
    test('delete completa senza eccezione su 204', () async {
      final auth = _FakeAuthService(
        onDelete: (uri) async {
          expect(uri.path, contains('/bill-of-materials/'));
          return http.Response('', 204);
        },
      );

      final service = BillOfMaterialsService(auth);

      await expectLater(service.delete(1, 2), completes);
    });

    test('delete lancia eccezione su risposta non 204', () async {
      final auth = _FakeAuthService(
        onDelete: (uri) async => http.Response(
          '{"title": "Componente non trovato"}',
          404,
          headers: {'content-type': 'application/json'},
        ),
      );

      final service = BillOfMaterialsService(auth);

      expect(
        () => service.delete(1, 99),
        throwsA(isA<Exception>().having(
          (e) => e.toString(),
          'message',
          contains('Componente non trovato'),
        )),
      );
    });
  });
}
