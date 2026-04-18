import 'dart:convert';
import 'package:mobile/core/constants/api_constants.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/auth_service.dart';

class BillOfMaterialsService {
  final AuthService _auth;

  BillOfMaterialsService(this._auth);

  /// Recupera la distinta base per l'articolo specificato
  Future<List<BillOfMaterialResponse>> getByParentArticle(int parentArticleId) async {
    final response = await _auth.authenticatedGet(
      Uri.parse(ApiConstants.bomByParent(parentArticleId)),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => BillOfMaterialResponse.fromJson(json)).toList();
    } else {
      throw Exception('Errore nel caricamento della distinta base');
    }
  }

  Future<BillOfMaterialResponse> get(int parentArticleId, int componentArticleId) async {
    final response = await _auth.authenticatedGet(
      Uri.parse(ApiConstants.bomItem(parentArticleId, componentArticleId)),
    );

    if (response.statusCode == 200) {
      return BillOfMaterialResponse.fromJson(json.decode(response.body) as Map<String, dynamic>);
    }
    throw Exception('Errore nel caricamento del componente BOM');
  }

  Future<BillOfMaterialResponse> create(CreateBillOfMaterialRequest request) async {
    final response = await _auth.authenticatedPost(
      Uri.parse(ApiConstants.billOfMaterials),
      body: request.toJson(),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return BillOfMaterialResponse.fromJson(json.decode(response.body) as Map<String, dynamic>);
    }
    throw Exception(_extractError(response.body) ?? 'Errore nella creazione del componente');
  }

  Future<BillOfMaterialResponse> update(
    int parentArticleId,
    int componentArticleId,
    UpdateBillOfMaterialRequest request,
  ) async {
    final response = await _auth.authenticatedPut(
      Uri.parse(ApiConstants.bomItem(parentArticleId, componentArticleId)),
      body: request.toJson(),
    );

    if (response.statusCode == 200) {
      return BillOfMaterialResponse.fromJson(json.decode(response.body) as Map<String, dynamic>);
    }
    throw Exception(_extractError(response.body) ?? 'Errore nel salvataggio del componente');
  }

  Future<void> delete(int parentArticleId, int componentArticleId) async {
    final response = await _auth.authenticatedDelete(
      Uri.parse(ApiConstants.bomItem(parentArticleId, componentArticleId)),
    );

    if (response.statusCode == 204) return;
    throw Exception(_extractError(response.body) ?? 'Errore nell\'eliminazione del componente');
  }

  String? _extractError(String body) {
    try {
      final jsonMap = json.decode(body) as Map<String, dynamic>;
      return jsonMap['title'] as String?;
    } catch (_) {
      return null;
    }
  }
}
