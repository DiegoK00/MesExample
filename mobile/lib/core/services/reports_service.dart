import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/report_models.dart';
import 'auth_service.dart';

class ReportsService {
  final AuthService _auth;

  ReportsService(this._auth);

  Future<List<TopArticleResponse>> getTopArticles({int top = 10}) async {
    final uri = Uri.parse(ApiConstants.reportsTopArticles)
        .replace(queryParameters: {'top': top.toString()});
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body) as List;
      return list.map((e) => TopArticleResponse.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Errore nel caricamento articoli più richiesti (${response.statusCode})');
  }

  Future<ProductionKpiResponse> getProductionKpi() async {
    final uri = Uri.parse(ApiConstants.reportsProductionKpi);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      return ProductionKpiResponse.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception('Errore nel caricamento KPI (${response.statusCode})');
  }
}
