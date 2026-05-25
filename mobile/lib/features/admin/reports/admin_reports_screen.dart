import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/models/report_models.dart';
import '../../../core/services/reports_service.dart';

class AdminReportsScreen extends StatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  State<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends State<AdminReportsScreen> {
  late Future<(List<TopArticleResponse>, ProductionKpiResponse)> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    final svc = context.read<ReportsService>();
    _future = Future.wait([
      svc.getTopArticles(),
      svc.getProductionKpi(),
    ]).then((r) => (r[0] as List<TopArticleResponse>, r[1] as ProductionKpiResponse));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report & KPI'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Aggiorna',
            onPressed: () => setState(_load),
          ),
        ],
      ),
      body: FutureBuilder(
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
                  const SizedBox(height: 12),
                  Text('Errore: ${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton(onPressed: () => setState(_load), child: const Text('Riprova')),
                ],
              ),
            );
          }

          final (articles, kpi) = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async => setState(_load),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _KpiGrid(kpi: kpi),
                const SizedBox(height: 20),
                _BarChart(articles: articles),
                const SizedBox(height: 20),
                _TopArticlesList(articles: articles),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ─── KPI Grid ────────────────────────────────────────────────────────────────

class _KpiGrid extends StatelessWidget {
  final ProductionKpiResponse kpi;
  const _KpiGrid({required this.kpi});

  @override
  Widget build(BuildContext context) {
    final items = [
      (label: 'Articoli attivi',    value: '${kpi.totalArticlesActive}',              color: Colors.green),
      (label: 'Articoli inattivi',  value: '${kpi.totalArticlesInactive}',            color: Colors.red),
      (label: 'Distinte base',      value: '${kpi.totalBomParents}',                  color: Colors.indigo),
      (label: 'Media comp./BOM',    value: kpi.avgComponentsPerBom.toStringAsFixed(1),color: Colors.indigo),
      (label: 'Creati (30gg)',       value: '${kpi.articlesCreatedLast30Days}',        color: Colors.teal),
      (label: 'Scarto medio',       value: '${kpi.totalScrapPercentageAvg.toStringAsFixed(1)}%', color: Colors.orange),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemBuilder: (_, i) {
        final item = items[i];
        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.value,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: item.color,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

class _BarChart extends StatelessWidget {
  final List<TopArticleResponse> articles;
  const _BarChart({required this.articles});

  @override
  Widget build(BuildContext context) {
    if (articles.isEmpty) return const SizedBox.shrink();

    final top5 = articles.take(5).toList();
    final maxY = (top5.map((a) => a.usageCount).reduce((a, b) => a > b ? a : b) * 1.3).ceilToDouble();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 16, 12, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Top 5 articoli più richiesti',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 180,
              child: BarChart(
                BarChartData(
                  maxY: maxY,
                  barTouchData: BarTouchData(
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem: (group, _, rod, _) => BarTooltipItem(
                        '${top5[group.x].code}\n${rod.toY.toInt()} utilizzi',
                        const TextStyle(color: Colors.white, fontSize: 11),
                      ),
                    ),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        getTitlesWidget: (v, _) => Text(
                          v.toInt().toString(),
                          style: const TextStyle(fontSize: 10),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (v, _) {
                          final idx = v.toInt();
                          if (idx < 0 || idx >= top5.length) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              top5[idx].code,
                              style: const TextStyle(fontSize: 9),
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: const FlGridData(show: true),
                  borderData: FlBorderData(show: false),
                  barGroups: List.generate(top5.length, (i) => BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: top5[i].usageCount.toDouble(),
                        color: Theme.of(context).colorScheme.primary,
                        width: 28,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      ),
                    ],
                  )),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Top Articles List ────────────────────────────────────────────────────────

class _TopArticlesList extends StatelessWidget {
  final List<TopArticleResponse> articles;
  const _TopArticlesList({required this.articles});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Articoli più richiesti',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
          const Divider(height: 1),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: articles.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final a = articles[i];
              return ListTile(
                leading: CircleAvatar(
                  radius: 16,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  child: Text('${i + 1}', style: const TextStyle(fontSize: 12)),
                ),
                title: Text(a.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                subtitle: Text('${a.code} · ${a.categoryName}'),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${a.usageCount} util.',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    Text(
                      '${a.totalQuantity.toStringAsFixed(1)} ${a.umName}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
