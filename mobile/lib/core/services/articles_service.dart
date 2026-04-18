import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/article_models.dart';
import 'auth_service.dart';

class ArticlesService {
  final AuthService _auth;

  ArticlesService(this._auth);

  Future<ArticleResponse> getById(int id) async {
    final uri = Uri.parse('${ApiConstants.articles}/$id');
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      return ArticleResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception('Errore nel caricamento articolo (${response.statusCode})');
  }

  Future<List<ArticleResponse>> getAll({bool? activeOnly}) async {
    final queryParams = {
      if (activeOnly == true) 'activeOnly': 'true',
    };
    final uri = Uri.parse(ApiConstants.articles).replace(queryParameters: queryParams);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body) as List;
      return list.map((e) => ArticleResponse.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Errore nel caricamento articoli (${response.statusCode})');
  }

  Future<ArticleResponse> create(Map<String, dynamic> body) async {
    final uri = Uri.parse(ApiConstants.articles);
    final response = await _auth.authenticatedPost(uri, body: body);

    if (response.statusCode == 201) {
      return ArticleResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nella creazione (${response.statusCode})');
  }

  Future<ArticleResponse> update(int id, Map<String, dynamic> body) async {
    final uri = Uri.parse('${ApiConstants.articles}/$id');
    final response = await _auth.authenticatedPut(uri, body: body);

    if (response.statusCode == 200) {
      return ArticleResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nel salvataggio (${response.statusCode})');
  }

  Future<void> delete(int id) async {
    final uri = Uri.parse('${ApiConstants.articles}/$id');
    final response = await _auth.authenticatedDelete(uri);

    if (response.statusCode == 204) return;
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nella disattivazione (${response.statusCode})');
  }

  String? _extractError(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['title'] as String?;
    } catch (_) {
      return null;
    }
  }
}
