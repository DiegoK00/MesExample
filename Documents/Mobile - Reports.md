# Mobile - Report & KPI

Schermata `/admin/reports` nell'area backoffice mobile che visualizza KPI di produzione e articoli più richiesti.

## Accesso

Card "Report & KPI" nella home admin (`AdminHomeScreen`) — naviga a `/admin/reports`.

## Dipendenze aggiunte

| Package | Versione | Ruolo |
|---------|----------|-------|
| `fl_chart` | ^0.x | Grafico a barre per top articoli |

## File

| File | Ruolo |
|------|-------|
| `core/models/report_models.dart` | Modelli Dart (`TopArticleResponse`, `ProductionKpiResponse`, `CategoryKpiItem`, `CreationTrendItem`) |
| `core/services/reports_service.dart` | 2 chiamate HTTP: `getTopArticles()` e `getProductionKpi()` |
| `core/constants/api_constants.dart` | + `reportsTopArticles`, `reportsProductionKpi` |
| `features/admin/reports/admin_reports_screen.dart` | Schermata completa |
| `main.dart` | + import, istanza `ReportsService`, `Provider.value`, route `/admin/reports` |
| `features/admin/admin_home_screen.dart` | + card "Report & KPI" |

## Struttura della schermata

### KPI Grid
6 card in griglia 2×3 con i valori da `GET /reports/production/kpi`:
- Articoli attivi / inattivi
- Distinte base
- Media componenti per BOM
- Articoli creati (30gg)
- Scarto medio %

### Grafico a barre (fl_chart)
Top 5 articoli per utilizzi BOM — `BarChart` con tooltip interattivo.

### Lista articoli
`ListView` con i top 10 articoli: codice, nome, categoria, utilizzi e quantità totale.

## Note

- La schermata carica i due endpoint in parallelo con `Future.wait`.
- `RefreshIndicator` permette il pull-to-refresh.
- Export PDF/Excel non disponibile su mobile (operazione server-side disponibile solo via web). 
- Quando saranno disponibili ordini di produzione, aggiornare solo `ReportsService` — la schermata non richiede modifiche.
