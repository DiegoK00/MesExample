import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/models/article_models.dart';
import '../../../core/services/measure_units_service.dart';

class AdminMeasureUnitsScreen extends StatefulWidget {
  const AdminMeasureUnitsScreen({super.key});

  @override
  State<AdminMeasureUnitsScreen> createState() => _AdminMeasureUnitsScreenState();
}

class _AdminMeasureUnitsScreenState extends State<AdminMeasureUnitsScreen> {
  late Future<List<MeasureUnitResponse>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = context.read<MeasureUnitsService>().getAll();
  }

  Future<void> _showForm({MeasureUnitResponse? unit}) async {
    final nameCtrl = TextEditingController(text: unit?.name ?? '');
    final descCtrl = TextEditingController(text: unit?.description ?? '');
    final formKey = GlobalKey<FormState>();
    String? errorMsg;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setInner) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unit == null ? 'Nuova Unità di Misura' : 'Modifica Unità di Misura',
                  style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nome',
                    hintText: 'Es: PZ, KG, MT',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Nome obbligatorio' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descCtrl,
                  decoration: const InputDecoration(labelText: 'Descrizione (opzionale)', border: OutlineInputBorder()),
                  maxLines: 2,
                ),
                if (errorMsg != null) ...[
                  const SizedBox(height: 8),
                  Text(errorMsg!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      if (!formKey.currentState!.validate()) return;
                      try {
                        final svc = ctx.read<MeasureUnitsService>();
                        if (unit == null) {
                          await svc.create(
                            name: nameCtrl.text.trim(),
                            description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                          );
                        } else {
                          await svc.update(
                            unit.id,
                            name: nameCtrl.text.trim(),
                            description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                          );
                        }
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      } catch (e) {
                        setInner(() => errorMsg = e.toString().replaceFirst('Exception: ', ''));
                      }
                    },
                    child: Text(unit == null ? 'Crea' : 'Salva'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (mounted) setState(_load);
  }

  Future<void> _delete(MeasureUnitResponse unit) async {
    final svc = context.read<MeasureUnitsService>();
    final messenger = ScaffoldMessenger.of(context);

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminare l\'unità di misura?'),
        content: Text('Stai per eliminare "${unit.name}".'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annulla')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Elimina', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await svc.delete(unit.id);
      if (mounted) {
        setState(_load);
        messenger.showSnackBar(const SnackBar(content: Text('Unità di misura eliminata')));
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Unità di Misura'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => setState(_load),
        child: FutureBuilder<List<MeasureUnitResponse>>(
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

            final units = snapshot.data!;
            if (units.isEmpty) {
              return const Center(child: Text('Nessuna unità di misura trovata'));
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: units.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final unit = units[index];
                return Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.straighten, color: Colors.green.shade700, size: 22),
                    ),
                    title: Text(unit.name,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                    subtitle: unit.description != null ? Text(unit.description!) : null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit, size: 20),
                          color: Colors.blue,
                          onPressed: () => _showForm(unit: unit),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, size: 20),
                          color: Colors.red,
                          onPressed: () => _delete(unit),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
