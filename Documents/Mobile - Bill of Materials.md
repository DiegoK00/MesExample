# Mobile — Gestione Bill of Materials (Flutter) — ⏳ NON COMPLETATO

## Status
🔴 **Non implementato** — Solo lettura (GET), niente create/edit/delete da mobile

---

## Route da aggiungere (`main.dart`)

```
/admin/articles/:id/bom  → AdminArticleBOMScreen
```

Protetto dal redirect admin esistente (loginArea == 1).

---

## Nav Integration (AdminArticlesScreen)

Nel component `AdminArticlesScreen`, aggiungere bottone "BOM" nell'`_ArticleCard`:

```
IconButton(
  icon: Icon(Icons.build),
  color: Colors.blue,
  tooltip: "Componenti",
  onPressed: () => context.go('/admin/articles/$articleId/bom'),
)
```

---

## Screens

### AdminArticleBOMScreen (`features/admin/articles/admin_article_bom_screen.dart`)

**Parametri** (da route):
- `articleId: int` — Estratto dalla rotta

**Features**:
- AppBar: Titolo "Bill of Materials - {ArticleCode}"
- Bottone back → torna a lista articoli
- `FutureBuilder` che carica:
  1. Articolo padre via `ArticlesService.getById()`
  2. Lista BOM via `BillOfMaterialsService.getByParentArticle()`
- Lista con `RefreshIndicator` ("tira giù per ricaricare")
- Ogni card mostra:
  - **Componente**: Code + Name
  - **Quantità**: numero + tipo (PHYSICAL/PERCENTAGE)
  - **UM**: nome unità di misura
  - **Scarto**: mostra percentuale/fattore/fisso se presenti
- Stato di errore: icona + testo "Errore nel caricamento"
- Stato vuoto: "Nessun componente trovato"

---

## Modelli (`core/models/article_models.dart`)

Aggiungere:

```dart
class BillOfMaterialResponse {
  final int parentArticleId;
  final String parentArticleCode;
  final String parentArticleName;
  final int componentArticleId;
  final String componentArticleCode;
  final String componentArticleName;
  final double quantity;
  final String quantityType;  // 'PHYSICAL' o 'PERCENTAGE'
  final int umId;
  final String umName;
  final double scrapPercentage;
  final double scrapFactor;
  final double fixedScrap;

  BillOfMaterialResponse({ required this.parentArticleId, ... });

  factory BillOfMaterialResponse.fromJson(Map<String, dynamic> json) => ...;
}
```

---

## Servizio (`core/services/bill_of_materials_service.dart`)

Metodi:
- `getByParentArticle(int parentArticleId)` → `Future<List<BillOfMaterialResponse>>`

Note:
- Niente create/update/delete da mobile
- Solo lettura (GET)

---

## Aggiornamenti (`core/constants/api_constants.dart`)

```dart
static const String billOfMaterials = '$baseUrl/bill-of-materials';
```

---

## TODO - Implementazione

- [ ] Aggiungere `BillOfMaterialResponse` a `article_models.dart`
- [ ] Creare `BillOfMaterialsService` con metodo `getByParentArticle`
- [ ] Creare screen `AdminArticleBOMScreen`
- [ ] Aggiungere rotta in `main.dart`
- [ ] Aggiungere bottone BOM in `_ArticleCard` di articoli (AdminArticlesScreen)
- [ ] Aggiornare `api_constants.dart`
- [ ] Scrivere tests Flutter quando completato
