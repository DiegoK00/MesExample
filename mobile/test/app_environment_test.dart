import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/app_environment.dart';
import 'package:mobile/core/constants/api_constants.dart';

void main() {
  group('AppEnvironment', () {
    test('apiBaseUrl ha un valore non vuoto', () {
      expect(AppEnvironment.apiBaseUrl, isNotEmpty);
    });

    test('apiBaseUrl inizia con http:// o https://', () {
      expect(
        AppEnvironment.apiBaseUrl,
        anyOf(startsWith('http://'), startsWith('https://')),
      );
    });

    test('isProduction è false in ambiente di test', () {
      // I test non sono eseguiti in release mode, quindi dart.vm.product = false.
      expect(AppEnvironment.isProduction, isFalse);
    });

    test('name è "development" in ambiente di test', () {
      expect(AppEnvironment.name, equals('development'));
    });
  });

  group('ApiConstants', () {
    test('tutti gli endpoint iniziano con apiBaseUrl', () {
      final base = AppEnvironment.apiBaseUrl;
      expect(ApiConstants.login, startsWith(base));
      expect(ApiConstants.refresh, startsWith(base));
      expect(ApiConstants.logout, startsWith(base));
      expect(ApiConstants.forgotPassword, startsWith(base));
      expect(ApiConstants.resetPassword, startsWith(base));
      expect(ApiConstants.me, startsWith(base));
      expect(ApiConstants.changePassword, startsWith(base));
      expect(ApiConstants.users, startsWith(base));
      expect(ApiConstants.programs, startsWith(base));
      expect(ApiConstants.auditLogs, startsWith(base));
      expect(ApiConstants.articles, startsWith(base));
      expect(ApiConstants.categories, startsWith(base));
      expect(ApiConstants.measureUnits, startsWith(base));
      expect(ApiConstants.billOfMaterials, startsWith(base));
    });

    test('path degli endpoint auth sono corretti', () {
      expect(ApiConstants.login, endsWith('/auth/login'));
      expect(ApiConstants.refresh, endsWith('/auth/refresh'));
      expect(ApiConstants.logout, endsWith('/auth/logout'));
    });

    test('path degli endpoint account sono corretti', () {
      expect(ApiConstants.me, endsWith('/account/me'));
      expect(ApiConstants.changePassword, endsWith('/account/password'));
    });

    test('path degli endpoint BOM sono corretti', () {
      expect(ApiConstants.billOfMaterials, endsWith('/bill-of-materials'));
      
      // Verifica metodi helper per parametri dinamici
      const parentId = 1;
      const componentId = 2;
      expect(ApiConstants.bomByParent(parentId), contains('/bill-of-materials/by-parent/1'));
      expect(ApiConstants.bomItem(parentId, componentId), contains('/bill-of-materials/1/2'));
    });
  });
}
