import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/program_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/programs_service.dart';
import 'package:mobile/features/admin/programs/admin_programs_screen.dart';

// ---------------------------------------------------------------------------
// Fake service
// ---------------------------------------------------------------------------
class _FakeProgramsService extends ProgramsService {
  final List<ProgramResponse>? _data;
  final bool _throws;

  _FakeProgramsService({List<ProgramResponse>? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<List<ProgramResponse>> getAll({bool? activeOnly}) async {
    if (_throws) throw Exception('API error');
    final all = _data ?? [];
    if (activeOnly == true) return all.where((p) => p.isActive).toList();
    return all;
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(ProgramsService service) {
  final router = GoRouter(
    initialLocation: '/admin/programs',
    routes: [
      GoRoute(path: '/admin/programs', builder: (_, __) => const AdminProgramsScreen()),
    ],
  );

  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<ProgramsService>.value(value: service),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

const _mockPrograms = [
  ProgramResponse(id: 1, code: 'PROG_A', name: 'Programma A', isActive: true),
  ProgramResponse(id: 2, code: 'PROG_B', name: 'Programma B', isActive: false),
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminProgramsScreen', () {
    testWidgets('mostra la lista programmi con codice e nome', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeProgramsService(data: _mockPrograms)));
      await tester.pumpAndSettle();

      expect(find.text('PROG_A'), findsOneWidget);
      expect(find.text('Programma A'), findsOneWidget);
      expect(find.text('PROG_B'), findsOneWidget);
      expect(find.text('Programma B'), findsOneWidget);
    });

    testWidgets('mostra badge Attivo/Inattivo correttamente', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeProgramsService(data: _mockPrograms)));
      await tester.pumpAndSettle();

      expect(find.text('Attivo'), findsOneWidget);
      expect(find.text('Inattivo'), findsOneWidget);
    });

    testWidgets('mostra messaggio di errore se il servizio lancia eccezione', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeProgramsService(throws: true)));
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento'), findsOneWidget);
    });

    testWidgets('mostra messaggio "Nessun programma trovato" se la lista è vuota', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeProgramsService()));
      await tester.pumpAndSettle();

      expect(find.text('Nessun programma trovato'), findsOneWidget);
    });
  });
}
