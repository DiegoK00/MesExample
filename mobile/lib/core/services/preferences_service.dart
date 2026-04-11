import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService extends ChangeNotifier {
  static const _keyThemeMode = 'theme_mode';
  static const _keyLastArea = 'last_area';

  ThemeMode _themeMode = ThemeMode.system;
  int _lastArea = 2;

  ThemeMode get themeMode => _themeMode;
  int get lastArea => _lastArea;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyThemeMode);
    if (saved == 'dark') {
      _themeMode = ThemeMode.dark;
    } else if (saved == 'light') {
      _themeMode = ThemeMode.light;
    }
    _lastArea = prefs.getInt(_keyLastArea) ?? 2;
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyThemeMode, mode == ThemeMode.dark ? 'dark' : 'light');
  }

  Future<void> setLastArea(int area) async {
    _lastArea = area;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyLastArea, area);
  }
}
