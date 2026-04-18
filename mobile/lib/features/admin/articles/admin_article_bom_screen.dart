import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/articles_service.dart';
import 'package:mobile/core/services/bill_of_materials_service.dart';
import 'package:mobile/features/admin/articles/admin_article_bom_dialog.dart';

class AdminArticleBOMScreen extends StatefulWidget {
  final int articleId;

  const AdminArticleBOMScreen({super.key, required this.articleId});

  @override
  State<AdminArticleBOMScreen> createState() => _AdminArticleBOMScreenState();
}

class _AdminArticleBOMScreenState extends State<AdminArticleBOMScreen> {
  late Future<List<BillOfMaterialResponse>> _bomFuture;
  String? _parentCode;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    setState(() {
      _bomFuture = context.read<BillOfMaterialsService>().getByParentArticle(widget.articleId);
      context.read<ArticlesService>().getById(widget.articleId).then((article) {
        if (mounted) {
          setState(() => _parentCode = article.code);
        }
      }).catchError((_) => null);
    });
  }

  Future<void> _openCreateDialog() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AdminArticleBOMDialog(parentArticleId: widget.articleId),
    );

    if (result == true && mounted) {
      _loadData();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Componente aggiunto')),
      );
    }
  }

  Future<void> _openEditDialog(BillOfMaterialResponse bom) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AdminArticleBOMDialog(
        parentArticleId: widget.articleId,
        bom: bom,
      ),
    );

    if (result == true && mounted) {
      _loadData();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Componente aggiornato')),
      );
    }
  }

  Future<void> _delete(BillOfMaterialResponse bom) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminare il componente?'),
        content: Text('Rimuovere "${bom.componentArticleName}" da questo articolo?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annulla'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Elimina'),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    try {
      await context.read<BillOfMaterialsService>().delete(
            bom.parentArticleId,
            bom.componentArticleId,
          );

      if (!mounted) return;
      _loadData();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Componente eliminato')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_parentCode != null ? 'Bill of Materials - $_parentCode' : 'Bill of Materials'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openCreateDialog,
        tooltip: 'Aggiungi Componente',
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: FutureBuilder<List<BillOfMaterialResponse>>(
          future: _bomFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      const Text('Errore nel caricamento dei componenti'),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _loadData,
                        child: const Text('Riprova'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final items = snapshot.data ?? [];
            if (items.isEmpty) {
              return const Center(child: Text('Nessun componente trovato per questo articolo.'));
            }

            return ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, index) {
                final bom = items[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.extension_outlined)),
                    title: Text(bom.componentArticleCode),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bom.componentArticleName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text('Quantita: ${bom.quantity} ${bom.umName} (${bom.quantityType})'),
                        if (bom.scrapPercentage > 0)
                          Text(
                            'Scarto %: ${bom.scrapPercentage}',
                            style: const TextStyle(color: Colors.orange),
                          ),
                        if (bom.scrapFactor > 0)
                          Text(
                            'Scarto fattore: ${bom.scrapFactor}',
                            style: const TextStyle(color: Colors.orange),
                          ),
                        if (bom.fixedScrap > 0)
                          Text(
                            'Scarto fisso: ${bom.fixedScrap}',
                            style: const TextStyle(color: Colors.orange),
                          ),
                      ],
                    ),
                    trailing: Wrap(
                      spacing: 4,
                      children: [
                        IconButton(
                          tooltip: 'Modifica',
                          onPressed: () => _openEditDialog(bom),
                          icon: const Icon(Icons.edit),
                        ),
                        IconButton(
                          tooltip: 'Elimina',
                          onPressed: () => _delete(bom),
                          icon: const Icon(Icons.delete, color: Colors.red),
                        ),
                      ],
                    ),
                    isThreeLine: true,
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
