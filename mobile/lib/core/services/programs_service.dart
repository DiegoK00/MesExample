import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/program_models.dart';
import 'auth_service.dart';

class ProgramsService {
  final AuthService _auth;

  ProgramsService(this._auth);

  Future<List<ProgramResponse>> getAll({bool? activeOnly}) async {
    final queryParams = {
      if (activeOnly == true) 'activeOnly': 'true',
    };
    final uri = Uri.parse(ApiConstants.programs).replace(queryParameters: queryParams);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      final list = jsonDecode(response.body) as List;
      return list.map((e) => ProgramResponse.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Errore nel caricamento programmi (${response.statusCode})');
  }
}
