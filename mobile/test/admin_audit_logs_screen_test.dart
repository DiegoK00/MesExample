import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/audit_log_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/audit_logs_service.dart';
import 'package:mobile/features/admin/audit_logs/admin_audit_logs_screen.dart';

// ---------------------------------------------------------------------------
// Fake service
// ---------------------------------------------------------------------------
class _FakeAuditLogsService extends AuditLogsService {
  final AuditLogsPageResponse? _data;
  final bool _throws;

  _FakeAuditLogsService({AuditLogsPageResponse? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<AuditLogsPageResponse> getLogs({
    int page = 1,
    int pageSize = 50,
    String? action,
    String? entityName,
  }) async {
    if (_throws) throw Exception('API error');
    return _data ??
        const AuditLogsPageResponse(items: [], totalCount: 0, page: 1, pageSize: 50);
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(AuditLogsService service) {
  final router = GoRouter(
    initialLocation: '/admin/audit-logs',
    routes: [
      GoRoute(path: '/admin/audit-logs', builder: (_, _) => const AdminAuditLogsScreen()),
    ],
  );

  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<AuditLogsService>.value(value: service),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

const _mockLogs = AuditLogsPageResponse(
  items: [
    AuditLogEntry(
      id: 1,
      timestamp: '2026-04-01T10:00:00Z',
      username: 'admin',
      action: 'user.login',
      entityName: 'User',
      entityId: 1,
      ipAddress: '127.0.0.1',
    ),
    AuditLogEntry(
      id: 2,
      timestamp: '2026-04-01T10:05:00Z',
      username: 'admin',
      action: 'program.created',
      entityName: 'Program',
      entityId: 5,
    ),
  ],
  totalCount: 2,
  page: 1,
  pageSize: 50,
);

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminAuditLogsScreen', () {
    testWidgets('mostra la lista dei log con azione e utente', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuditLogsService(data: _mockLogs)));
      await tester.pumpAndSettle();

      expect(find.text('user.login'), findsOneWidget);
      expect(find.text('program.created'), findsOneWidget);
      expect(find.text('admin'), findsWidgets);
    });

    testWidgets('mostra entità e id nel log', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuditLogsService(data: _mockLogs)));
      await tester.pumpAndSettle();

      expect(find.text('User #1'), findsOneWidget);
      expect(find.text('Program #5'), findsOneWidget);
    });

    testWidgets('mostra messaggio di errore se il servizio lancia eccezione', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuditLogsService(throws: true)));
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento'), findsOneWidget);
    });

    testWidgets('mostra messaggio "Nessun log trovato" se la lista è vuota', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeAuditLogsService()));
      await tester.pumpAndSettle();

      expect(find.text('Nessun log trovato'), findsOneWidget);
    });
  });
}
