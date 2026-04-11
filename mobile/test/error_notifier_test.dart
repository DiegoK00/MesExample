import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/app_exceptions.dart';
import 'package:mobile/core/services/error_notifier.dart';

void main() {
  group('ErrorNotifier', () {
    late ErrorNotifier notifier;

    setUp(() {
      notifier = ErrorNotifier();
    });

    tearDown(() {
      notifier.dispose();
    });

    test('currentMessage è null all\'inizializzazione', () {
      expect(notifier.currentMessage, isNull);
    });

    test('handle(NetworkException) imposta il messaggio e notifica', () {
      var notified = false;
      notifier.addListener(() => notified = true);

      notifier.handle(const NetworkException('Nessuna connessione'));

      expect(notifier.currentMessage, equals('Nessuna connessione'));
      expect(notified, isTrue);
    });

    test('handle(ServerException) imposta il messaggio del server', () {
      notifier.handle(const ServerException(500));
      expect(notifier.currentMessage, contains('server'));
    });

    test('handle(Exception generica) imposta messaggio di fallback', () {
      notifier.handle(Exception('unknown'));
      expect(notifier.currentMessage, contains('imprevisto'));
    });

    test('clear() azzera il messaggio e notifica', () {
      notifier.handle(const NetworkException());
      var notified = false;
      notifier.addListener(() => notified = true);

      notifier.clear();

      expect(notifier.currentMessage, isNull);
      expect(notified, isTrue);
    });

    test('clear() su messaggio già null non notifica', () {
      var notified = false;
      notifier.addListener(() => notified = true);

      notifier.clear();

      expect(notified, isFalse);
    });

    test('handle successive sovrascrivono il messaggio precedente', () {
      notifier.handle(const NetworkException('Primo'));
      notifier.handle(const NetworkException('Secondo'));
      expect(notifier.currentMessage, equals('Secondo'));
    });
  });
}
