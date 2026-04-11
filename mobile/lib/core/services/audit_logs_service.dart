import 'dart:convert';
import '../constants/api_constants.dart';
import '../models/audit_log_models.dart';
import 'auth_service.dart';

class AuditLogsService {
  final AuthService _auth;

  AuditLogsService(this._auth);

  Future<AuditLogsPageResponse> getLogs({
    int page = 1,
    int pageSize = 50,
    String? action,
    String? entityName,
  }) async {
    final queryParams = {
      'page': '$page',
      'pageSize': '$pageSize',
      if (action != null && action.isNotEmpty) 'action': action,
      if (entityName != null && entityName.isNotEmpty) 'entityName': entityName,
    };
    final uri = Uri.parse(ApiConstants.auditLogs).replace(queryParameters: queryParams);
    final response = await _auth.authenticatedGet(uri);

    if (response.statusCode == 200) {
      return AuditLogsPageResponse.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
    }
    throw Exception('Errore nel caricamento audit log (${response.statusCode})');
  }
}
