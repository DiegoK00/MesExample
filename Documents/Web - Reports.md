# Web - Report & KPI

Pagina `/admin/reports` nell'area backoffice che visualizza i dati di reportistica e offre l'export in PDF ed Excel.

## Accesso

Voce "Report & KPI" nel menu laterale dell'admin layout (icona `bar_chart`).  
Route lazy-loaded: `/admin/reports` → `ReportsComponent`.

## Dipendenze aggiunte

| Package | Versione | Ruolo |
|---------|----------|-------|
| `echarts` | ^6.1.0 | Libreria grafici core |
| `ngx-echarts` | ^21.0.0 | Wrapper Angular per ECharts |

## File

| File | Ruolo |
|------|-------|
| `core/models/report.models.ts` | Interfacce TypeScript (`TopArticleResponse`, `ProductionKpiResponse`, `CategoryKpiItem`, `CreationTrendItem`) |
| `core/services/reports.service.ts` | 5 chiamate HTTP verso `/reports/*` (2 dati JSON + 3 export Blob) |
| `features/admin/reports/reports.component.ts` | Pagina completa standalone con grafici, tabella ed export |
| `features/admin/admin.routes.ts` | Aggiunta rotta `reports` |
| `features/admin/layout/admin-layout.component.ts` | Aggiunta voce menu "Report & KPI" |

## Struttura della pagina

### KPI Cards
Sei card in griglia con i valori principali restituiti da `GET /reports/production/kpi`:
- Articoli attivi / inattivi
- Distinte base (padri)
- Media componenti per BOM
- Articoli creati negli ultimi 30 giorni
- Scarto medio %

### Grafici (ngx-echarts)
| Grafico | Tipo ECharts | Dati |
|---------|-------------|------|
| Articoli più richiesti | Barre orizzontali | `usageCount` per articolo (top 10) |
| Articoli per categoria | Donut | `articleCount` per categoria |
| Trend creazione | Linea con area | `creationTrend` ultimi 6 mesi |

I grafici sono costruiti con `signal<EChartsOption>` e aggiornati al caricamento dati.  
ECharts viene caricato in lazy (`echarts: () => import('echarts')`) tramite `provideEchartsCore`.

### Tabella (Angular Material Table)
Colonne: `#`, Codice, Nome, Categoria, Utilizzi BOM, Qtà totale.  
Dati da `GET /reports/articles/top-used?top=10`.

### Export
| Pulsante | Endpoint chiamato | File scaricato |
|----------|-------------------|----------------|
| PDF | `GET /reports/articles/top-used/export/pdf` | `articoli-top-YYYYMMDD.pdf` |
| Excel articoli | `GET /reports/articles/top-used/export/excel` | `articoli-top-YYYYMMDD.xlsx` |
| Excel KPI | `GET /reports/production/kpi/export/excel` | `kpi-produzione-YYYYMMDD.xlsx` |

Il download avviene lato client tramite `URL.createObjectURL` su un `Blob`.

## Note

- Il componente usa `ChangeDetectionStrategy.OnPush` e signals per lo stato.
- I due endpoint (`top-used` e `production/kpi`) vengono chiamati in parallelo al `ngOnInit`.
- Quando saranno disponibili ordini di produzione, aggiornare solo il service (`ReportsService`) — il componente non richiede modifiche.
