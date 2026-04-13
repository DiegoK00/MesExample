import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/article_models.dart';
import 'auth_service.dart';

class CategoriesService {
  final AuthService _auth;

  CategoriesService(this._auth);

  Future<List<CategoryResponse>> getAll() async {
    final uri = Uri.parse(ApiConstants.categories);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body) as List;
      return list.map((e) => CategoryResponse.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Errore nel caricamento categorie (${response.statusCode})');
  }

  Future<CategoryResponse> create({required String name, String? description}) async {
    final uri = Uri.parse(ApiConstants.categories);
    final response = await _auth.authenticatedPost(uri, body: {
      'name': name,
      if (description != null && description.isNotEmpty) 'description': description,
    });

    if (response.statusCode == 201) {
      return CategoryResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nella creazione (${response.statusCode})');
  }

  Future<CategoryResponse> update(int id, {required String name, String? description}) async {
    final uri = Uri.parse('${ApiConstants.categories}/$id');
    final response = await _auth.authenticatedPut(uri, body: {
      'name': name,
      if (description != null && description.isNotEmpty) 'description': description,
    });

    if (response.statusCode == 200) {
      return CategoryResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nel salvataggio (${response.statusCode})');
  }

  Future<void> delete(int id) async {
    final uri = Uri.parse('${ApiConstants.categories}/$id');
    final response = await _auth.authenticatedDelete(uri);

    if (response.statusCode == 204) return;
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nell\'eliminazione (${response.statusCode})');
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
