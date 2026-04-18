import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile/core/models/article_models.dart';
import 'package:mobile/core/services/articles_service.dart';
import 'package:mobile/core/services/bill_of_materials_service.dart';
import 'package:mobile/core/services/measure_units_service.dart';

class AdminArticleBOMDialog extends StatefulWidget {
  final int parentArticleId;
  final BillOfMaterialResponse? bom;

  const AdminArticleBOMDialog({
    super.key,
    required this.parentArticleId,
    this.bom,
  });

  @override
  State<AdminArticleBOMDialog> createState() => _AdminArticleBOMDialogState();
}

class _AdminArticleBOMDialogState extends State<AdminArticleBOMDialog> {
  final _formKey = GlobalKey<FormState>();
  final _quantityCtrl = TextEditingController();
  final _scrapPercentageCtrl = TextEditingController();
  final _scrapFactorCtrl = TextEditingController();
  final _fixedScrapCtrl = TextEditingController();

  List<ArticleResponse> _articles = [];
  List<MeasureUnitResponse> _units = [];
  int? _componentArticleId;
  int? _umId;
  String _quantityType = 'PHYSICAL';
  bool _loading = true;
  bool _saving = false;
  String? _errorMsg;

  bool get _isEdit => widget.bom != null;

  @override
  void initState() {
    super.initState();
    final bom = widget.bom;
    _componentArticleId = bom?.componentArticleId;
    _umId = bom?.umId;
    _quantityType = bom?.quantityType ?? 'PHYSICAL';
    _quantityCtrl.text = (bom?.quantity ?? 1).toString();
    _scrapPercentageCtrl.text = (bom?.scrapPercentage ?? 0).toString();
    _scrapFactorCtrl.text = (bom?.scrapFactor ?? 0).toString();
    _fixedScrapCtrl.text = (bom?.fixedScrap ?? 0).toString();
    _loadSupportData();
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    _scrapPercentageCtrl.dispose();
    _scrapFactorCtrl.dispose();
    _fixedScrapCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSupportData() async {
    try {
      final articles = await context.read<ArticlesService>().getAll(activeOnly: true);
      final units = await context.read<MeasureUnitsService>().getAll();

      if (!mounted) return;
      setState(() {
        _articles = articles.where((a) => a.id != widget.parentArticleId).toList();
        _units = units;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMsg = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  double _parseNumber(TextEditingController controller) {
    return double.tryParse(controller.text.trim().replaceAll(',', '.')) ?? 0;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _errorMsg = null;
    });

    final bomService = context.read<BillOfMaterialsService>();

    try {
      if (_isEdit) {
        await bomService.update(
          widget.parentArticleId,
          widget.bom!.componentArticleId,
          UpdateBillOfMaterialRequest(
            quantity: _parseNumber(_quantityCtrl),
            quantityType: _quantityType,
            umId: _umId!,
            scrapPercentage: _parseNumber(_scrapPercentageCtrl),
            scrapFactor: _parseNumber(_scrapFactorCtrl),
            fixedScrap: _parseNumber(_fixedScrapCtrl),
          ),
        );
      } else {
        await bomService.create(
          CreateBillOfMaterialRequest(
            parentArticleId: widget.parentArticleId,
            componentArticleId: _componentArticleId!,
            quantity: _parseNumber(_quantityCtrl),
            quantityType: _quantityType,
            umId: _umId!,
            scrapPercentage: _parseNumber(_scrapPercentageCtrl),
            scrapFactor: _parseNumber(_scrapFactorCtrl),
            fixedScrap: _parseNumber(_fixedScrapCtrl),
          ),
        );
      }

      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _errorMsg = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isEdit ? 'Modifica Componente' : 'Aggiungi Componente'),
      content: SizedBox(
        width: 480,
        child: _loading
            ? const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              )
            : SingleChildScrollView(
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      DropdownButtonFormField<int>(
                        initialValue: _componentArticleId,
                        decoration: const InputDecoration(
                          labelText: 'Articolo Componente',
                          border: OutlineInputBorder(),
                        ),
                        items: _articles
                            .map((article) => DropdownMenuItem(
                                  value: article.id,
                                  child: Text('${article.code} - ${article.name}'),
                                ))
                            .toList(),
                        onChanged: _isEdit ? null : (value) => setState(() => _componentArticleId = value),
                        validator: (value) => value == null ? 'Articolo componente obbligatorio' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _quantityCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Quantita',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        validator: (value) {
                          final parsed = double.tryParse((value ?? '').trim().replaceAll(',', '.'));
                          if (parsed == null || parsed <= 0) return 'Inserire una quantita valida';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: _quantityType,
                        decoration: const InputDecoration(
                          labelText: 'Tipo Quantita',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'PHYSICAL', child: Text('Fisico')),
                          DropdownMenuItem(value: 'PERCENTAGE', child: Text('Percentuale')),
                        ],
                        onChanged: (value) => setState(() => _quantityType = value ?? 'PHYSICAL'),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        initialValue: _umId,
                        decoration: const InputDecoration(
                          labelText: 'Unita di Misura',
                          border: OutlineInputBorder(),
                        ),
                        items: _units
                            .map((unit) => DropdownMenuItem(
                                  value: unit.id,
                                  child: Text(unit.name),
                                ))
                            .toList(),
                        onChanged: (value) => setState(() => _umId = value),
                        validator: (value) => value == null ? 'Unita di misura obbligatoria' : null,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Gestione Scarto',
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _scrapPercentageCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Scarto Percentuale (%)',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _scrapFactorCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Scarto Fattore',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _fixedScrapCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Scarto Fisso',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      ),
                      if (_errorMsg != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _errorMsg!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(false),
          child: const Text('Annulla'),
        ),
        FilledButton(
          onPressed: _loading || _saving ? null : _save,
          child: Text(_saving ? 'Salvataggio...' : (_isEdit ? 'Aggiorna' : 'Crea')),
        ),
      ],
    );
  }
}
