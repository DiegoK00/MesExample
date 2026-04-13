import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/article_models.dart';
import 'auth_service.dart';

class MeasureUnitsService {
  final AuthService _auth;

  MeasureUnitsService(this._auth);

  Future<List<MeasureUnitResponse>> getAll() async {
    final uri = Uri.parse(ApiConstants.measureUnits);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body) as List;
      return list.map((e) => MeasureUnitResponse.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Errore nel caricamento unità di misura (${response.statusCode})');
  }

  Future<MeasureUnitResponse> create({required String name, String? description}) async {
    final uri = Uri.parse(ApiConstants.measureUnits);
    final response = await _auth.authenticatedPost(uri, body: {
      'name': name,
      if (description != null && description.isNotEmpty) 'description': description,
    });

    if (response.statusCode == 201) {
      return MeasureUnitResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nella creazione (${response.statusCode})');
  }

  Future<MeasureUnitResponse> update(int id, {required String name, String? description}) async {
    final uri = Uri.parse('${ApiConstants.measureUnits}/$id');
    final response = await _auth.authenticatedPut(uri, body: {
      'name': name,
      if (description != null && description.isNotEmpty) 'description': description,
    });

    if (response.statusCode == 200) {
      return MeasureUnitResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    final error = _extractError(response.body);
    throw Exception(error ?? 'Errore nel salvataggio (${response.statusCode})');
  }

  Future<void> delete(int id) async {
    final uri = Uri.parse('${ApiConstants.measureUnits}/$id');
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
