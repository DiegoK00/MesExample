import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/models/program_models.dart';
import '../../../core/services/programs_service.dart';

class AdminProgramsScreen extends StatefulWidget {
  const AdminProgramsScreen({super.key});

  @override
  State<AdminProgramsScreen> createState() => _AdminProgramsScreenState();
}

class _AdminProgramsScreenState extends State<AdminProgramsScreen> {
  late Future<List<ProgramResponse>> _future;
  bool _activeOnly = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = context.read<ProgramsService>().getAll(activeOnly: _activeOnly ? true : null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Programmi'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          Row(
            children: [
              const Text('Solo attivi', style: TextStyle(color: Colors.white, fontSize: 13)),
              Switch(
                value: _activeOnly,
                onChanged: (v) => setState(() {
                  _activeOnly = v;
                  _load();
                }),
                activeThumbColor: Colors.white,
                activeTrackColor: Colors.white38,
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => setState(_load),
        child: FutureBuilder<List<ProgramResponse>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 8),
                    Text('Errore nel caricamento', style: Theme.of(context).textTheme.bodyLarge),
                  ],
                ),
              );
            }

            final programs = snapshot.data!;
            if (programs.isEmpty) {
              return const Center(child: Text('Nessun programma trovato'));
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: programs.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _ProgramCard(program: programs[index]),
            );
          },
        ),
      ),
    );
  }
}

class _ProgramCard extends StatelessWidget {
  final ProgramResponse program;

  const _ProgramCard({required this.program});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.teal.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.apps, color: Colors.teal.shade700, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(program.code,
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                  Text(program.name,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: Colors.grey[700])),
                  if (program.description != null)
                    Text(program.description!,
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: Colors.grey[500]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: program.isActive ? Colors.green.shade50 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: program.isActive ? Colors.green.shade300 : Colors.grey.shade400,
                ),
              ),
              child: Text(
                program.isActive ? 'Attivo' : 'Inattivo',
                style: TextStyle(
                  fontSize: 11,
                  color: program.isActive ? Colors.green.shade700 : Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
