import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/auth_service.dart';
import 'package:mobile/core/services/measure_units_service.dart';
import 'package:mobile/features/admin/measure_units/admin_measure_units_screen.dart';

// ---------------------------------------------------------------------------
// Fake service
// ---------------------------------------------------------------------------
class _FakeMeasureUnitsService extends MeasureUnitsService {
  final List<MeasureUnitResponse>? _data;
  final bool _throws;

  _FakeMeasureUnitsService({List<MeasureUnitResponse>? data, bool throws = false})
      : _data = data,
        _throws = throws,
        super(AuthService());

  @override
  Future<List<MeasureUnitResponse>> getAll() async {
    if (_throws) throw Exception('API error');
    return _data ?? [];
  }

  @override
  Future<MeasureUnitResponse> create({required String name, String? description}) async =>
      MeasureUnitResponse(id: 99, name: name, description: description);

  @override
  Future<MeasureUnitResponse> update(int id, {required String name, String? description}) async =>
      MeasureUnitResponse(id: id, name: name, description: description);

  @override
  Future<void> delete(int id) async {}
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
Widget _buildApp(MeasureUnitsService service) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<AuthService>(create: (_) => AuthService()),
      Provider<MeasureUnitsService>.value(value: service),
    ],
    child: MaterialApp(
      home: const AdminMeasureUnitsScreen(),
    ),
  );
}

const _mockUnits = [
  MeasureUnitResponse(id: 1, name: 'Pezzo', description: 'Unità base'),
  MeasureUnitResponse(id: 2, name: 'Metro'),
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
void main() {
  group('AdminMeasureUnitsScreen', () {
    testWidgets('mostra la lista unità di misura con nome', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeMeasureUnitsService(data: _mockUnits)));
      await tester.pumpAndSettle();

      expect(find.text('Pezzo'), findsOneWidget);
      expect(find.text('Metro'), findsOneWidget);
    });

    testWidgets('mostra descrizione se presente', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeMeasureUnitsService(data: _mockUnits)));
      await tester.pumpAndSettle();

      expect(find.text('Unità base'), findsOneWidget);
    });

    testWidgets('mostra messaggio di errore se il servizio lancia eccezione', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeMeasureUnitsService(throws: true)));
      await tester.pumpAndSettle();

      expect(find.text('Errore nel caricamento'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('mostra "Nessuna unità di misura trovata" se la lista è vuota', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeMeasureUnitsService()));
      await tester.pumpAndSettle();

      expect(find.text('Nessuna unità di misura trovata'), findsOneWidget);
    });

    testWidgets('FAB apre bottom sheet con titolo "Nuova Unità di Misura"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeMeasureUnitsService(data: _mockUnits)));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      expect(find.text('Nuova Unità di Misura'), findsOneWidget);
      expect(find.byType(TextFormField), findsWidgets);
    });

    testWidgets('tap icona edit apre bottom sheet con titolo "Modifica Unità di Misura"', (tester) async {
      await tester.pumpWidget(_buildApp(_FakeMeasureUnitsService(data: _mockUnits)));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.edit).first);
      await tester.pumpAndSettle();

      expect(find.text('Modifica Unità di Misura'), findsOneWidget);
    });
  });
}
