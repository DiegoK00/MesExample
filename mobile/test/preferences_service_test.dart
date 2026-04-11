import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/services/preferences_service.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('init', () {
    test('valori di default quando SharedPreferences è vuoto', () async {
      final svc = PreferencesService();
      await svc.init();
      expect(svc.themeMode, ThemeMode.system);
      expect(svc.lastArea, 2);
    });

    test('carica themeMode dark salvato', () async {
      SharedPreferences.setMockInitialValues({'theme_mode': 'dark'});
      final svc = PreferencesService();
      await svc.init();
      expect(svc.themeMode, ThemeMode.dark);
    });

    test('carica themeMode light salvato', () async {
      SharedPreferences.setMockInitialValues({'theme_mode': 'light'});
      final svc = PreferencesService();
      await svc.init();
      expect(svc.themeMode, ThemeMode.light);
    });

    test('carica lastArea salvato', () async {
      SharedPreferences.setMockInitialValues({'last_area': 1});
      final svc = PreferencesService();
      await svc.init();
      expect(svc.lastArea, 1);
    });
  });

  group('setThemeMode', () {
    test('aggiorna themeMode e notifica i listener', () async {
      final svc = PreferencesService();
      await svc.init();

      var notified = false;
      svc.addListener(() => notified = true);

      await svc.setThemeMode(ThemeMode.dark);

      expect(svc.themeMode, ThemeMode.dark);
      expect(notified, isTrue);
    });

    test('persiste il valore in SharedPreferences', () async {
      final svc = PreferencesService();
      await svc.init();
      await svc.setThemeMode(ThemeMode.dark);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('theme_mode'), 'dark');
    });

    test('persiste "light" correttamente', () async {
      final svc = PreferencesService();
      await svc.init();
      await svc.setThemeMode(ThemeMode.light);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('theme_mode'), 'light');
    });
  });

  group('setLastArea', () {
    test('aggiorna lastArea in memoria', () async {
      final svc = PreferencesService();
      await svc.init();
      await svc.setLastArea(1);
      expect(svc.lastArea, 1);
    });

    test('persiste lastArea in SharedPreferences', () async {
      final svc = PreferencesService();
      await svc.init();
      await svc.setLastArea(1);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getInt('last_area'), 1);
    });
  });
}
