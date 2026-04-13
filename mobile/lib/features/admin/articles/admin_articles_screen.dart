import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/models/article_models.dart';
import '../../../core/services/articles_service.dart';
import '../../../core/services/categories_service.dart';
import '../../../core/services/measure_units_service.dart';

// ─── List Screen ─────────────────────────────────────────────────────────────

class AdminArticlesScreen extends StatefulWidget {
  const AdminArticlesScreen({super.key});

  @override
  State<AdminArticlesScreen> createState() => _AdminArticlesScreenState();
}

class _AdminArticlesScreenState extends State<AdminArticlesScreen> {
  late Future<List<ArticleResponse>> _future;
  bool _activeOnly = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = context.read<ArticlesService>().getAll(activeOnly: _activeOnly ? true : null);
  }

  Future<void> _delete(ArticleResponse article) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Disattivare l\'articolo?'),
        content: Text('Stai per disattivare "${article.name}".'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annulla')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Disattiva', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    try {
      await context.read<ArticlesService>().delete(article.id);
      if (mounted) {
        setState(_load);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Articolo disattivato')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Articoli'),
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
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (_) => const AdminArticleFormScreen()),
          );
          if (result == true && mounted) setState(_load);
        },
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async => setState(_load),
        child: FutureBuilder<List<ArticleResponse>>(
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

            final articles = snapshot.data!;
            if (articles.isEmpty) {
              return const Center(child: Text('Nessun articolo trovato'));
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: articles.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _ArticleCard(
                article: articles[index],
                onEdit: () async {
                  final result = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                      builder: (_) => AdminArticleFormScreen(article: articles[index]),
                    ),
                  );
                  if (result == true && mounted) setState(_load);
                },
                onDelete: () => _delete(articles[index]),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────

class _ArticleCard extends StatelessWidget {
  final ArticleResponse article;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ArticleCard({required this.article, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final umLabel = article.um2Name != null ? '${article.umName} / ${article.um2Name}' : article.umName;

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.inventory_2, color: Colors.purple.shade700, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(article.code,
                          style: Theme.of(context)
                              .textTheme
                              .bodyLarge
                              ?.copyWith(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                      Text(article.name,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: Colors.grey[700])),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: article.isActive ? Colors.green.shade50 : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: article.isActive ? Colors.green.shade300 : Colors.grey.shade400,
                    ),
                  ),
                  child: Text(
                    article.isActive ? 'Attivo' : 'Inattivo',
                    style: TextStyle(
                      fontSize: 11,
                      color: article.isActive ? Colors.green.shade700 : Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _InfoChip(icon: Icons.category, label: article.categoryName),
                const SizedBox(width: 8),
                _InfoChip(icon: Icons.euro, label: article.price.toStringAsFixed(2)),
                const SizedBox(width: 8),
                _InfoChip(icon: Icons.straighten, label: umLabel),
              ],
            ),
            if (article.measures != null || article.composition != null) ...[
              const SizedBox(height: 6),
              if (article.measures != null)
                Text('Misure: ${article.measures}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[600])),
              if (article.composition != null)
                Text('Composizione: ${article.composition}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[600])),
            ],
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Modifica'),
                  onPressed: onEdit,
                ),
                if (article.isActive)
                  TextButton.icon(
                    icon: const Icon(Icons.delete, size: 16, color: Colors.red),
                    label: const Text('Disattiva', style: TextStyle(color: Colors.red)),
                    onPressed: onDelete,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }
}

// ─── Form Screen ──────────────────────────────────────────────────────────────

class AdminArticleFormScreen extends StatefulWidget {
  final ArticleResponse? article;

  const AdminArticleFormScreen({super.key, this.article});

  @override
  State<AdminArticleFormScreen> createState() => _AdminArticleFormScreenState();
}

class _AdminArticleFormScreenState extends State<AdminArticleFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _codeCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _measuresCtrl = TextEditingController();
  final _compositionCtrl = TextEditingController();

  int? _categoryId;
  int? _umId;
  int? _um2Id;
  bool _isActive = true;

  bool _loading = false;
  bool _loadingData = true;
  String? _errorMsg;

  List<CategoryResponse> _categories = [];
  List<MeasureUnitResponse> _measureUnits = [];

  bool get isEdit => widget.article != null;

  @override
  void initState() {
    super.initState();
    final a = widget.article;
    if (a != null) {
      _nameCtrl.text = a.name;
      _descCtrl.text = a.description ?? '';
      _priceCtrl.text = a.price.toStringAsFixed(2);
      _measuresCtrl.text = a.measures ?? '';
      _compositionCtrl.text = a.composition ?? '';
      _categoryId = a.categoryId;
      _umId = a.umId;
      _um2Id = a.um2Id;
      _isActive = a.isActive;
    } else {
      _priceCtrl.text = '0.00';
    }
    _loadSupportData();
  }

  Future<void> _loadSupportData() async {
    try {
      final catSvc = context.read<CategoriesService>();
      final umSvc = context.read<MeasureUnitsService>();
      final cats = await catSvc.getAll();
      final units = await umSvc.getAll();
      if (mounted) {
        setState(() {
          _categories = cats;
          _measureUnits = units;
          _loadingData = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingData = false);
    }
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _measuresCtrl.dispose();
    _compositionCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _errorMsg = null; });

    try {
      final svc = context.read<ArticlesService>();
      final price = double.tryParse(_priceCtrl.text.replaceAll(',', '.')) ?? 0;

      if (isEdit) {
        await svc.update(widget.article!.id, {
          'name': _nameCtrl.text.trim(),
          if (_descCtrl.text.trim().isNotEmpty) 'description': _descCtrl.text.trim(),
          'categoryId': _categoryId,
          'price': price,
          'umId': _umId,
          if (_um2Id != null) 'um2Id': _um2Id,
          if (_measuresCtrl.text.trim().isNotEmpty) 'measures': _measuresCtrl.text.trim(),
          if (_compositionCtrl.text.trim().isNotEmpty) 'composition': _compositionCtrl.text.trim(),
          'isActive': _isActive,
        });
      } else {
        await svc.create({
          'code': _codeCtrl.text.trim(),
          'name': _nameCtrl.text.trim(),
          if (_descCtrl.text.trim().isNotEmpty) 'description': _descCtrl.text.trim(),
          'categoryId': _categoryId,
          'price': price,
          'umId': _umId,
          if (_um2Id != null) 'um2Id': _um2Id,
          if (_measuresCtrl.text.trim().isNotEmpty) 'measures': _measuresCtrl.text.trim(),
          if (_compositionCtrl.text.trim().isNotEmpty) 'composition': _compositionCtrl.text.trim(),
        });
      }

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMsg = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Modifica Articolo' : 'Nuovo Articolo'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _loadingData
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isEdit)
                      _field(
                        controller: _codeCtrl,
                        label: 'Codice',
                        hint: 'Es: ART001',
                        validator: (v) => v == null || v.trim().isEmpty ? 'Codice obbligatorio' : null,
                      ),
                    if (isEdit) ...[
                      Text('Codice', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[600])),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(widget.article!.code,
                            style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(height: 16),
                    ],
                    _field(
                      controller: _nameCtrl,
                      label: 'Nome',
                      validator: (v) => v == null || v.trim().isEmpty ? 'Nome obbligatorio' : null,
                    ),
                    _field(controller: _descCtrl, label: 'Descrizione (opzionale)', maxLines: 2),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<int>(
                      initialValue: _categoryId,
                      decoration: const InputDecoration(labelText: 'Categoria', border: OutlineInputBorder()),
                      items: _categories
                          .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                          .toList(),
                      onChanged: (v) => setState(() => _categoryId = v),
                      validator: (v) => v == null ? 'Categoria obbligatoria' : null,
                    ),
                    const SizedBox(height: 16),
                    _field(
                      controller: _priceCtrl,
                      label: 'Prezzo (€)',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Prezzo obbligatorio';
                        if (double.tryParse(v.replaceAll(',', '.')) == null) return 'Valore non valido';
                        return null;
                      },
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<int>(
                            initialValue: _umId,
                            decoration: const InputDecoration(labelText: 'UM', border: OutlineInputBorder()),
                            items: _measureUnits
                                .map((u) => DropdownMenuItem(value: u.id, child: Text(u.name)))
                                .toList(),
                            onChanged: (v) => setState(() => _umId = v),
                            validator: (v) => v == null ? 'UM obbligatoria' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<int?>(
                            initialValue: _um2Id,
                            decoration: const InputDecoration(labelText: 'UM2 (opz.)', border: OutlineInputBorder()),
                            items: [
                              const DropdownMenuItem(value: null, child: Text('—')),
                              ..._measureUnits
                                  .map((u) => DropdownMenuItem(value: u.id, child: Text(u.name))),
                            ],
                            onChanged: (v) => setState(() => _um2Id = v),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _field(
                      controller: _measuresCtrl,
                      label: 'Misure (opzionale)',
                      hint: 'Es: S / M / L / XL',
                    ),
                    _field(
                      controller: _compositionCtrl,
                      label: 'Composizione (opzionale)',
                      hint: 'Es: Cotton 70% Elastane 30%',
                      maxLines: 2,
                    ),
                    if (isEdit) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Switch(
                            value: _isActive,
                            onChanged: (v) => setState(() => _isActive = v),
                          ),
                          const SizedBox(width: 8),
                          Text(_isActive ? 'Articolo attivo' : 'Articolo inattivo'),
                        ],
                      ),
                    ],
                    if (_errorMsg != null) ...[
                      const SizedBox(height: 8),
                      Text(_errorMsg!, style: const TextStyle(color: Colors.red, fontSize: 13)),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(isEdit ? 'Salva' : 'Crea Articolo'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    String? hint,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(labelText: label, hintText: hint, border: const OutlineInputBorder()),
        maxLines: maxLines,
        keyboardType: keyboardType,
        validator: validator,
      ),
    );
  }
}
