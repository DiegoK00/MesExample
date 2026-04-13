import '../config/app_environment.dart';

class ApiConstants {
  ApiConstants._();

  static const String baseUrl = AppEnvironment.apiBaseUrl;

  // ── Auth ──────────────────────────────────────────────────────────────────
  static const String login = '$baseUrl/auth/login';
  static const String refresh = '$baseUrl/auth/refresh';
  static const String logout = '$baseUrl/auth/logout';
  static const String forgotPassword = '$baseUrl/auth/forgot-password';
  static const String resetPassword = '$baseUrl/auth/reset-password';

  // ── Account ───────────────────────────────────────────────────────────────
  static const String me = '$baseUrl/account/me';
  static const String changePassword = '$baseUrl/account/password';

  // ── Risorse ───────────────────────────────────────────────────────────────
  static const String users = '$baseUrl/users';
  static const String programs = '$baseUrl/programs';
  static const String auditLogs = '$baseUrl/audit-logs';
  static const String categories = '$baseUrl/categories';
  static const String measureUnits = '$baseUrl/measure-units';
  static const String articles = '$baseUrl/articles';
}
