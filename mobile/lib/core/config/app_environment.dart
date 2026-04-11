/// Configurazione dell'ambiente di esecuzione.
///
/// I valori vengono iniettati a compile-time tramite `--dart-define` o
/// `--dart-define-from-file`. In assenza di override, vengono usati i
/// default di sviluppo.
///
/// ## Uso
///
/// ```bash
/// # Android emulator (default)
/// flutter run --dart-define-from-file=config/env.dev.android.json
///
/// # iOS simulator
/// flutter run --dart-define-from-file=config/env.dev.ios.json
///
/// # Produzione
/// flutter run --release --dart-define-from-file=config/env.prod.json
/// ```
///
/// Oppure con flag singoli:
/// ```bash
/// flutter run --dart-define=API_BASE_URL=https://api.mesclaude.com
/// ```
class AppEnvironment {
  AppEnvironment._();

  /// URL base dell'API REST.
  ///
  /// Default: Android emulator → `http://10.0.2.2:5260`
  /// (10.0.2.2 è l'alias dell'host sul network virtuale Android)
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5260',
  );

  /// `true` solo nei build di release (impostato automaticamente da Dart).
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');

  /// Nome leggibile dell'ambiente corrente (utile per logging / Sentry).
  static String get name => isProduction ? 'production' : 'development';
}
