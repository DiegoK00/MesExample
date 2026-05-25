# API - Reports

Endpoint di reportistica per articoli e KPI di produzione, con export PDF ed Excel.

**Package utilizzati**
- `QuestPDF 2025.5.0` — generazione PDF lato server (licenza Community)
- `ClosedXML 0.104.2` — generazione file Excel lato server

---

## Endpoints

### GET /reports/articles/top-used

Restituisce gli articoli più usati come componenti nelle distinte base (BOM), ordinati per numero di utilizzi.

**Query params**
| Parametro | Tipo | Default | Note |
|-----------|------|---------|------|
| `top` | int | 10 | Range 1–100 |

**Response**
```json
[
  {
    "articleId": 3,
    "code": "ART-001",
    "name": "Vite M6",
    "categoryName": "Minuteria",
    "usageCount": 12,
    "totalQuantity": 48.5,
    "umName": "pz"
  }
]
```

---

### GET /reports/production/kpi

Restituisce i KPI di produzione aggregati.

**Response**
```json
{
  "totalArticlesActive": 120,
  "totalArticlesInactive": 15,
  "totalBomParents": 35,
  "totalBomComponents": 80,
  "avgComponentsPerBom": 3.4,
  "articlesCreatedLast30Days": 8,
  "totalScrapPercentageAvg": 2.5,
  "articlesByCategory": [
    { "categoryName": "Materie prime", "articleCount": 45, "bomCount": 10 }
  ],
  "creationTrend": [
    { "month": "2026-01", "count": 5 },
    { "month": "2026-02", "count": 3 }
  ]
}
```

---

### GET /reports/articles/top-used/export/pdf

Genera e scarica un PDF con la tabella degli articoli più richiesti.

**Query params:** `top` (int, default 10, range 1–100)
**Response:** `application/pdf` — file `articoli-top-YYYYMMDD.pdf`

---

### GET /reports/articles/top-used/export/excel

Genera e scarica un Excel con la tabella degli articoli più richiesti.

**Query params:** `top` (int, default 10, range 1–100)
**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` — file `articoli-top-YYYYMMDD.xlsx`

---

### GET /reports/production/kpi/export/excel

Genera e scarica un Excel con i KPI di produzione su **3 fogli**:
- `KPI Produzione` — tabella riepilogativa KPI
- `Per categoria` — articoli e distinte per categoria
- `Trend creazione` — articoli creati per mese (ultimi 6 mesi)

**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` — file `kpi-produzione-YYYYMMDD.xlsx`

---

## Note

- Tutti gli endpoint richiedono autenticazione JWT (`[Authorize]`).
- I dati sono calcolati in tempo reale sul DB — nessuna cache. Aggiungere caching se le query diventano lente su dataset grandi.
- "Articoli più richiesti" è proxy basato sull'utilizzo nelle distinte base. Quando saranno disponibili ordini di produzione, aggiornare `ReportService.GetTopArticlesAsync` per includere la frequenza negli ordini.

---

## Web (Angular)

La pagina `/admin/reports` visualizza i dati di entrambi gli endpoint e offre i tre pulsanti di export.

**Componenti usati**
- `ngx-echarts v21` + `echarts v6` — grafici
- `Angular Material Table` — tabella articoli

**Grafici presenti**
| Grafico | Tipo | Dati |
|---------|------|------|
| Articoli più richiesti | Barre orizzontali | `usageCount` per articolo |
| Articoli per categoria | Donut | `articleCount` per categoria |
| Trend creazione | Linea con area | `creationTrend` ultimi 6 mesi |

**File Angular**
| File | Ruolo |
|------|-------|
| `core/models/report.models.ts` | Interfacce TypeScript |
| `core/services/reports.service.ts` | 5 chiamate HTTP (2 dati JSON + 3 export Blob) |
| `features/admin/reports/reports.component.ts` | Pagina completa |
