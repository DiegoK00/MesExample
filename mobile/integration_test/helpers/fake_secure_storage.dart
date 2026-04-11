import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Implementazione in-memory di [FlutterSecureStorage] per i test d'integrazione.
/// Evita le dipendenze dal platform channel del dispositivo reale.
class FakeSecureStorage implements FlutterSecureStorage {
  final _data = <String, String>{};

  @override
  Future<String?> read({
    required String? key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async =>
      key != null ? _data[key] : null;

  @override
  Future<void> write({
    required String? key,
    required String? value,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (key == null) return;
    if (value != null) {
      _data[key] = value;
    } else {
      _data.remove(key);
    }
  }

  @override
  Future<void> delete({
    required String? key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (key != null) _data.remove(key);
  }

  @override
  Future<void> deleteAll({
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async =>
      _data.clear();

  @override
  Future<Map<String, String>> readAll({
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async =>
      Map.from(_data);

  @override
  Future<bool> containsKey({
    required String? key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async =>
      key != null && _data.containsKey(key);

  // ── Metodi non usati da AuthService ────────────────────────────────────────

  @override
  IOSOptions get iOptions => const IOSOptions();

  @override
  AndroidOptions get aOptions => const AndroidOptions();

  @override
  LinuxOptions get lOptions => const LinuxOptions();

  @override
  WindowsOptions get wOptions => const WindowsOptions();

  @override
  WebOptions get webOptions => const WebOptions();

  @override
  MacOsOptions get mOptions => const MacOsOptions();

  @override
  void registerListener({
    required String? key,
    required ValueChanged<String?>? listener,
  }) {}

  @override
  void unregisterListener({
    required String? key,
    required ValueChanged<String?>? listener,
  }) {}

  @override
  void unregisterAllListenersForKey({required String? key}) {}

  @override
  void unregisterAllListeners() {}

  @override
  Future<bool?> isCupertinoProtectedDataAvailable() async => null;
  
  @override
  // TODO: implement onCupertinoProtectedDataAvailabilityChanged
  Stream<bool>? get onCupertinoProtectedDataAvailabilityChanged => throw UnimplementedError();
}
