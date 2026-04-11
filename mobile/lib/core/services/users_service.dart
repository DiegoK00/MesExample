import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/user_models.dart';
import 'auth_service.dart';

class UsersService {
  final AuthService _auth;

  UsersService(this._auth);

  Future<UsersPageResponse> getAll({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    final queryParams = {
      'page': '$page',
      'pageSize': '$pageSize',
      if (search != null && search.isNotEmpty) 'search': search,
    };
    final uri = Uri.parse(ApiConstants.users).replace(queryParameters: queryParams);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      return UsersPageResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception('Errore nel caricamento utenti (${response.statusCode})');
  }
}
